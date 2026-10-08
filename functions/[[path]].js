import { createPagesFunctionHandler } from "@react-router/cloudflare";
import * as build from "../build/server/index.js";

export const onRequest = createPagesFunctionHandler({
  build,
  getLoadContext: (context) => {
    return {
      cloudflare: {
        env: context.env,
        cf: context.request.cf, // 👉 修正：拿到真实的地理位置和 IP 标识
        ctx: context            // 👉 修正：传入完整上下文以便后续使用 waitUntil
      }
    };
  }
});