import { createPagesFunctionHandler } from "@react-router/cloudflare";
import { RouterContextProvider } from "react-router";
import * as build from "../build/server/index.js";

export const onRequest = (context) => {
  // 将 Cloudflare 原生环境变量挂载至 V8 引擎全局对象，跨越打包器隔离
  if (!globalThis.CF_ENV) {
    globalThis.CF_ENV = context.env;
  }
  
  const handler = createPagesFunctionHandler({
    build,
    getLoadContext: () => {
      // 满足 React Router v8 的底层强校验，注入空容器
      return new RouterContextProvider();
    }
  });

  return handler(context);
};