// functions/[[path]].js
import { createPagesFunctionHandler } from "@react-router/cloudflare";

// 引入 Vite 帮你打包好的纯后端产物
import * as build from "../build/server/index.js";

// 把请求接管权正式移交给 React Router 引擎
export const onRequest = createPagesFunctionHandler({ build });