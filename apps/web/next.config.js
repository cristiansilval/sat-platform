/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'rprpwtjssyuvwtqvjioi.supabase.co',
      },
    ],
  },
}

module.exports = nextConfig
