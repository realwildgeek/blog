import { createPagesFunctionHandler } from "@react-router/cloudflare";
import * as build from "../build/server/index.js";

export const onRequest = createPagesFunctionHandler({
  build,
  // 🔥 核心反制：强制开启开发模式，让框架把真实错误直接打印在网页上
  mode: "development",
});