# 无名之境 (Nameless Realm) - 极简端到端加密博客

这是一个基于 **React Router v8 (Framework Mode) + Cloudflare Pages Edge + R2 Storage** 构建的现代化、全栈 Serverless 博客系统。

项目彻底抛弃了传统的 Node.js 运行时与笨重的本地开发环境，采用直接挂载边缘节点的无服务器架构，并为未来的 **E2EE (端到端加密)** 与 **细粒度权限控制** 奠定了底层数据标准。

## 核心架构设计

*   **计算层 (Edge Compute)**：依托 Cloudflare Pages 与底层 V8 引擎的 Web Workers 环境，实现极低延迟的流式渲染 (Web Streams)。
*   **数据层 (Storage)**：直连 Cloudflare R2 对象存储桶，以极简的 JSON 文件作为单一事实来源。
*   **解耦层 (AST 标准)**：抛弃第三方富文本编辑器的私有 HTML/Markdown 格式，使用自定义 JSON AST (抽象语法树) 隔离数据输入与页面渲染。

## 数据协议：终极 JSON AST 标准

博客的底层数据不再是单纯的文本，而是一个高度结构化的容器。它从一开始就为**离线冲突检测**、**社交媒体 SEO**、**媒体垃圾回收**以及**端到端加密权限控制**做好了准备。

存入 R2 桶的 `.json` 文件必须严格遵循以下 Schema：

\`\`\`json
{
  "version": "1.1.0",
  "metadata": {
    "title": "家宴食谱",
    "slug": "family-dinner-recipes",     // 友好的 URL 路径
    "createdAt": "2026-10-08T10:00:00Z",
    "updatedAt": "2026-10-08T15:30:00Z",
    "revisionId": "rev_8f7d6c5b",        // 版本哈希，用于离线保存与多端同步冲突检测
    
    "seo": {
      "excerpt": "周末家庭聚餐的五道拿手好菜...",
      "coverImage": "uuid_img_cover",    // 用于社交媒体卡片展示的图床引用
      "isPinned": false                  // 是否置顶
    },
    
    "curation": {
      "tags": ["烹饪", "家庭"],
      "series": "周末食堂",
      "related": ["uuid_post_2"]         // 手动或 AI 计算的相关文章 UUID
    },
    
    "assets": ["uuid_img_cover", "uuid_img_body1"], // 文章内包含的所有媒体引用，用于精准的垃圾回收
    
    "access": {
      "visibility": "group",             // 可见性策略: public (全公开) | private (仅自己可见) | group (好友分组可见)
      "allowedGroups": ["family_group_id"], // 当 visibility 为 group 时生效，控制访问圈层
      "e2ee": {
        "isEncrypted": true,             // 标明正文 blocks 是否经过端到端加密
        "cipherType": "AES-256-GCM",
        "nonce": "base64_encoded_nonce", // 加密盐值
        "keyHash": "hash_of_file_credential" // 校验当前访问者密钥是否匹配的哈希
      }
    }
  },
  "blocks": [
    { "id": "b_1", "type": "paragraph", "content": "这是第一段正文数据..." },
    { "id": "b_2", "type": "heading", "content": "核心架构" }
  ]
}
\`\`\`

## 避坑指南：React Router v8 与 Cloudflare 环境穿透

在构建全栈边缘渲染时，极易触发一个隐蔽的框架级黑盒崩溃，表现为：
**浏览器仅返回一句纯文本的 `Unexpected Server Error` 或 `Internal Error`，且 Cloudflare 控制台日志显示为绿色的 `Ok`，所有常规的 `try-catch` 探针均无法捕获报错。**

### 踩坑原因
1. **Node.js 污染**：Vite 默认以 Node 环境打包 SSR 产物，这会导致 Cloudflare Web Worker 启动瞬间因找不到 `fs/stream` 等内置模块而发生 V8 引擎级硬崩溃。
2. **v8 版本 Breaking Change**：React Router v8 废弃了普通对象的上下文传递，强制要求 `getLoadContext` 返回 `RouterContextProvider` 的实例。若写法停留在 v7，框架内部会直接抛出类型校验失败的异常，并强制返回 500 纯文本兜底。
3. **打包器内存隔离**：Wrangler 编译的入口文件与 Vite 编译的路由文件存在物理上下文隔离，导致向 `RouterContextProvider` 塞入的 Cloudflare `env`，在业务路由的 `loader` 中提取时为 `undefined`。

### 终极解法
跳出框架繁琐的 Context API，利用 JavaScript 最底层的特性，将云端环境变量直接锚定在 V8 引擎的顶层对象上。

1. **锁定 Web Worker 构建目标** (`vite.config.ts`)：
   \`\`\`typescript
   ssr: {
     target: "webworker",
     resolve: { conditions: ["workerd", "worker", "browser"] },
   }
   \`\`\`

2. **全局降维注入** (`functions/[[path]].js`)：
   \`\`\`javascript
   export const onRequest = (context) => {
     // 彻底绕过 React Router 的路由传参黑盒，锚定最高全局对象
     if (!globalThis.CF_ENV) {
       globalThis.CF_ENV = context.env;
     }
     const handler = createPagesFunctionHandler({
       build,
       getLoadContext: () => new RouterContextProvider() // 仅提供空壳应对类型校验
     });
     return handler(context);
   };
   \`\`\`

3. **直接提水** (`app/routes/$slug.tsx`)：
   \`\`\`typescript
   export async function loader({ params }: any) {
     const env = (globalThis as any).CF_ENV;
     const bucket = env?.BLOG_BUCKET;
     // ... 直接使用 bucket.get() 或 bucket.list()
   }
   \`\`\`