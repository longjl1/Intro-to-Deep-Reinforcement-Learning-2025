import type { NextConfig } from 'next';

const config: NextConfig = {
  // GitHub project Pages uses /<repository>; local development stays at /.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  devIndicators: false,
};
export default config;
