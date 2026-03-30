import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  // Allow the frontend dev server to be reached from Docker host
  allowedDevOrigins: ['localhost'],
}

export default nextConfig
