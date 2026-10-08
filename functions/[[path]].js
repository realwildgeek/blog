import { createPagesFunctionHandler } from "@react-router/cloudflare";
import { RouterContextProvider } from "react-router";
import * as build from "../build/server/index.js";

export const onRequest = (context) => {
  // 🔥 全局降维打击：彻底绕过 React Router 的路由传参黑盒
  // 直接将 Cloudflare 的原生绑定，锚定在 V8 引擎最高全局对象上
  if (!globalThis.CF_ENV) {
    globalThis.CF_ENV = context.env;
  }
  
  const handler = createPagesFunctionHandler({
    build,
    getLoadContext: () => {
      // 仅仅为了满足 v8 源码里的硬编码类型校验，丢给它一个空容器
      return new RouterContextProvider();
    }
  });

  return handler(context);
};