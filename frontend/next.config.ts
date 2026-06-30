import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    API_SERVICE_URL:
      process.env.API_SERVICE_URL ?? "https://api.mathlens.npsolver.io",
  },
};

export default nextConfig;
