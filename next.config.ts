import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
      // Disable X-Powered-By header to reduce information leakage
      poweredByHeader: false,
}

export default nextConfig
