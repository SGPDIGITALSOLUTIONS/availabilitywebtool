/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Fix for undici module parsing issue
      config.externals = config.externals || [];
      config.externals.push({
        'undici': 'commonjs undici'
      });
    }
    
    // Handle node modules that use private fields
    config.module.rules.push({
      test: /\.m?js$/,
      include: /node_modules\/undici/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false
      }
    });

    return config;
  },
}

module.exports = nextConfig 