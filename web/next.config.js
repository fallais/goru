/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Environment variables for runtime
  env: {
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:8080',
  },
  
  // Add any rewrites if needed for API proxy
  async rewrites() {
    return [
      // These rewrites are handled by our API routes, but keeping as fallback
    ];
  },
}

module.exports = nextConfig
