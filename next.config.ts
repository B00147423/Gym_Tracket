import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hides the floating "N" Next.js dev tools pill (often clashes with mobile bottom nav).
  // Only applies in `next dev`; production builds never show it.
  devIndicators: false,
};

export default nextConfig;
