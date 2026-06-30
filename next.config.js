const { execSync } = require('child_process');

let buildHash = 'dev';
try {
  buildHash = execSync('git rev-parse --short HEAD').toString().trim();
} catch {}

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_HASH: buildHash,
  },
};

module.exports = nextConfig;
