/**
 * One-time schema migration script.
 * Run: node scripts/apply-schema.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load env manually
const envPath = join(__dirname, '..', '.env.local')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf-8')
    .split('\n')
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => {
      const idx = l.indexOf('=')
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]
    })
)

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL']
const serviceKey = env['SUPABASE_SERVICE_ROLE_KEY']

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing SUPABASE env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
})

// Split SQL into individual statements and run them
const sql = readFileSync(join(__dirname, '..', 'supabase-schema.sql'), 'utf-8')

// Split on semicolons but keep them, filter blanks
const statements = sql
  .split(/;\s*\n/)
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'))

console.log(`📦 Applying ${statements.length} SQL statements...`)

let success = 0
let failed = 0

for (const stmt of statements) {
  const preview = stmt.slice(0, 60).replace(/\n/g, ' ')
  try {
    const { error } = await supabase.rpc('exec_sql', { sql_text: stmt + ';' }).catch(() => ({
      error: { message: 'RPC not available' },
    }))

    if (error) {
      // Try direct query approach
      const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql_text: stmt + ';' }),
      })
      if (!res.ok) {
        throw new Error(await res.text())
      }
    }

    console.log(`  ✅ ${preview}...`)
    success++
  } catch (err) {
    console.log(`  ⚠️  ${preview}... → ${err.message?.slice(0, 80)}`)
    failed++
  }
}

console.log(`\n✨ Done: ${success} succeeded, ${failed} failed/skipped`)
console.log('\nIf you see failures, please apply the schema manually via:')
console.log('https://supabase.com/dashboard/project/fswcygwptafbxyydxnxg/sql/new')
