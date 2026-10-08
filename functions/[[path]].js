import { createPagesFunctionHandler } from "@react-router/cloudflare";
import * as build from "../build/server/index.js";

const routerHandler = createPagesFunctionHandler({ build });

export async function onRequest(context) {
  try {
    // 1. 让 React Router 引擎正常执行
    const response = await routerHandler(context);

    // 2. 临时拦截：如果引擎抛出了那句该死的 Unexpected Server Error (500)
    if (response.status === 500) {
      const errorText = await response.text();
      const envKeys = Object.keys(context.env || {});
      
      const debugLog = [
        "====== [临时探针] 捕获到 500 异常 ======",
        `1. 请求路径: ${context.request.url}`,
        `2. 当前注入的云端变量 (检查是否有 BLOG_BUCKET): ${envKeys.length > 0 ? envKeys.join(", ") : "【完全为空，环境丢失！】"}`,
        `3. React Router 底层原始吐出信息:`,
        errorText
      ].join("\n\n");

      // 强行转为 200 纯文本返回，让浏览器必定能显示
      return new Response(debugLog, {
        headers: { "Content-Type": "text/plain;charset=utf-8" }
      });
    }

    return response;
  } catch (error) {
    // 3. 临时拦截：如果是 V8 引擎级别的硬崩溃
    return new Response(
      `====== [临时探针] 边缘节点发生致命硬崩溃 ======\n\n错误信息: ${error.message}\n堆栈追踪:\n${error.stack}`,
      { headers: { "Content-Type": "text/plain;charset=utf-8" } }
    );
  }
}