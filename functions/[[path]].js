import { createPagesFunctionHandler } from "@react-router/cloudflare";
import { RouterContextProvider } from "react-router";
import * as build from "../build/server/index.js";

// 强行接管入口
export const onRequest = (context) => {
  // 这里的 context 是绝对纯正的 Cloudflare Pages EventContext
  // 此刻 context.env.BLOG_BUCKET 绝对存在！
  
  const handler = createPagesFunctionHandler({
    build,
    // 忽略框架传给我们的任何废话参数，直接利用“闭包”捕获外层的 context
    getLoadContext: () => {
      const routerContext = new RouterContextProvider();
      routerContext.set("env", context.env);
      return routerContext;
    }
  });

  return handler(context);
};