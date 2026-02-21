/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
      config.resolve.alias.canvas = false;
      config.resolve.alias.encoding = false;
      return config;
    },
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'ctmihnkvxjdkkyryphvm.supabase.co',
          pathname: '**',
        },
        {
          protocol: 'https',
          hostname: 'api.dicebear.com',
          pathname: '**',
        },
      ],
    },
    // Allow the Expo web dev server (and any origin) to call /api/mobile/* routes
    async headers() {
      return [
        {
          source: '/api/mobile/:path*',
          headers: [
            { key: 'Access-Control-Allow-Origin', value: '*' },
            { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
            { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-App-Version, X-Platform' },
          ],
        },
      ];
    },
  };
  
  export default nextConfig;
