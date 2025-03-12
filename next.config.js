import MillionLint from "@million/lint";

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  serverExternalPackages: ["@node-rs/argon2"],
  // TODO: Probably delete this when GitHub codespaces aren't needed.
  // experimental: {
  //   serverActions: {
  //     // edit: updated to new key. Was previously `allowedForwardedHosts`
  //     allowedOrigins: ['localhost:3000'],
  //   },
  // },
  async headers() {
    return [
      {
        source: "/api/trpc/:path*",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
    ];
  },
};

export default parseInt(process.env.MILLION_ENABLED ?? "0") == 1 &&
process.env.NODE_ENV == "development"
  ? MillionLint.next({
      enabled: true,
      rsc: true,
    })(config)
  : config;
