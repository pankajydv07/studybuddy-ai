import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: [
    'mammoth',
    'googleapis',
  ],
}

export default nextConfig
