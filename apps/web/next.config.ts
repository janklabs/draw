import type { NextConfig } from "next"
import path from "path"

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
  serverExternalPackages: ["pg"],
  turbopack: {},
  allowedDevOrigins: ["127.0.0.1", "localhost"],
}

export default nextConfig
