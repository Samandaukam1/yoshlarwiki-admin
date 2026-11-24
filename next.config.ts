import type { NextConfig } from "next";

// src/lib/config.ts dagi bilan bir xil (next.config boshqa modullarni import qilmasin).
const supabaseHost = new URL(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://olgrimictocmxhhwragu.supabase.co",
).hostname;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        // Admin panel qidiruv tizimlariga va tashqi freymlarga yopiq.
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
