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
  };
  
  export default nextConfig;
  