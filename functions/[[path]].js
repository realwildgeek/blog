import { createPagesFunctionHandler } from "@react-router/cloudflare";
import * as build from "../build/server/index.js";

export const onRequest = createPagesFunctionHandler({
  build,
  getLoadContext: (context) => {
    try {
      return {
        cloudflare: {
          env: context.env || {},
          cf: context.request ? context.request.cf : {},
          ctx: context
        }
      };
    } catch (e) {
      return { cloudflare: { env: {} } }; // 绝对防御
    }
  }
});