/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    const backendTarget =
      process.env.BACKEND_URL ||
      (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.startsWith('/')
        ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '')
        : null);

    if (backendTarget) {
      return [
        {
          source: '/api/:path*',
          destination: `${backendTarget}/api/:path*`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
