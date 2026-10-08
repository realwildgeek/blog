import { renderToReadableStream } from "react-dom/server";
import type { EntryContext } from "react-router";
import { ServerRouter } from "react-router";

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  loadContext: any
) {
  try {
    const body = await renderToReadableStream(
      <ServerRouter context={routerContext} url={request.url} />,
      {
        signal: request.signal,
        onError(error: unknown) {
          console.error("Render Error:", error);
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
    // 🔥 终极劫持：如果 React 渲染引擎本身炸了，绝不让它吞没日志，强行把死因打在公屏上！
    return new Response(
      "【架构师强制接管】底层渲染引擎(entry.server)启动崩溃:\n\n" + 
      (error.stack || error.message || String(error)),
      {
        status: 500,
        headers: { "Content-Type": "text/plain;charset=utf-8" }
      }
    );
  }
}