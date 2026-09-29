/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@mojadoo/database", "@mojadoo/types"],
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
}

module.exports = nextConfig
