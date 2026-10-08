import { createPagesFunctionHandler } from "@react-router/cloudflare";
import { RouterContextProvider } from "react-router";
import * as build from "../build/server/index.js";

export const onRequest = createPagesFunctionHandler({
  build,
  getLoadContext: (context) => {
    // 🔥 v8 核心修复：必须实例化并返回 RouterContextProvider 
    const routerContext = new RouterContextProvider();
    
    // 将 Cloudflare 原生的 env 挂载到 Provider 实例中
    routerContext.set("env", context.env);
    
    return routerContext;
  }
});