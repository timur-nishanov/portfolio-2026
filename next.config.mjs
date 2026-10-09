/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    // Static export can't use the Next image optimizer.
    unoptimized: true,
  },
  experimental: {
    // The stylesheets go into the page itself instead of blocking its first
    // paint as separate requests.
    inlineCss: true,
  },
  // three.js glsl-ish files are imported as raw strings via a loader below.
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glsl|vert|frag)$/,
      type: 'asset/source',
    });
    return config;
  },
};

export default nextConfig;
