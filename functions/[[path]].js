import { createPagesFunctionHandler } from "@react-router/cloudflare";
import * as build from "../build/server/index.js";

export const onRequest = createPagesFunctionHandler({
  build,
  // 👇 新增这个神圣的摆渡函数：把 Cloudflare 的底层环境变量，完整注入到你的代码 context 里
  getLoadContext: (context) => {
    return {
      cloudflare: {
        env: context.env,
        cf: context.cf,
        ctx: context.waitUntil
      }
    };
  }
});