import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images:{
    remotePatterns:[
      {
        protocol:"https",
        hostname:"cdn-icons-png.flaticon.com",
        port:"",
      },
      {
        protocol:"https",
        hostname:"static.vecteezy.com",
        port:"",
      }
    ]
  }
};

export default nextConfig;
