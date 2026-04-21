import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: [
    'pdf-parse',
    'mammoth',
    'googleapis',
  ],
}

export default nextConfig
