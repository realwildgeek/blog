import { createPagesFunctionHandler } from "@react-router/cloudflare";
import * as build from "../build/server/index.js";

export const onRequest = createPagesFunctionHandler({
  build,
  getLoadContext: (context) => {
    return {
      // 极其直接：把所有云端变量打包放进 env 里
      env: context.env
    };
  }
});