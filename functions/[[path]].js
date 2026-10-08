import { createPagesFunctionHandler } from "@react-router/cloudflare";
import * as build from "../build/server/index.js";

export const onRequest = createPagesFunctionHandler({
  build,
  getLoadContext: (context) => {
    return {
      env: context.env,
      cloudflare: { env: context.env } // 双保险挂载
    };
  }
});