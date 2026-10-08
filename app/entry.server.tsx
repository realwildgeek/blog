import { renderToReadableStream } from "react-dom/server";
import { ServerRouter } from "react-router";

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: any
) {
  try {
    const body = await renderToReadableStream(
      <ServerRouter context={routerContext} url={request.url} />,
      {
        signal: request.signal,
        onError(error: unknown) {
          console.error("Stream rendering error:", error);
          responseStatusCode = 500;
        },
      }
    );

    responseHeaders.set("Content-Type", "text/html");
    return new Response(body, {
      headers: responseHeaders,
      status: responseStatusCode,
    });
  } catch (error: any) {
    // 🔥 终极必杀：强行改为 200 响应，彻底击穿 Cloudflare 的 500 报错拦截！
    return new Response(
      "【V8引擎渲染崩溃】死因已成功抓获，请把这段发给我：\n\n" + error.stack,
      { 
        status: 200, 
        headers: { "Content-Type": "text/plain;charset=utf-8" } 
      }
    );
  }
}