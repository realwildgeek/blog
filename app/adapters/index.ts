// app/adapters/index.ts
// =========================================================================
// 🏢 核心调度中心 (处理中心 C) - 绝不抛出错误，保证全天候降级可用
// =========================================================================

export async function universalTransformer(rawText: string, fallbackSlug: string = "unknown"): Promise<any> {
  let rawData: any;
  try {
    rawData = JSON.parse(rawText);
  } catch (e) {
    // 🚨 连 JSON 都不是（比如文件损坏），走 Type 2 (无法适配)
    return getUnsupportedAST(fallbackSlug);
  }

  // ---------------------------------------------------------
  // 🔍 Type 3：能适配的加密文件 (Crypto5.2)
  // ---------------------------------------------------------
  if (rawData.meta && rawData.meta.wrappedDEK) {
    return {
      version: "1.1.0",
      type: "crypto5.2",
      metadata: {
        title: rawData.meta.title || "🔒 私密加密文档",
        slug: rawData.meta.id || fallbackSlug,
        createdAt: rawData.meta.createdAt || new Date().toISOString(),
        access: {
          visibility: "private",
          e2ee: {
            isEncrypted: true,
            wrappedDEK: rawData.meta.wrappedDEK
          }
        }
      },
      blocks: rawData.content 
    };
  }

  // ---------------------------------------------------------
  // 🔍 Type 1：标准 AST 格式
  // ---------------------------------------------------------
  if (rawData.version === "1.1.0" && rawData.blocks) {
    return { ...rawData, type: "native" };
  }

  // ---------------------------------------------------------
  // 🔍 Type 2：无法适配的未知格式 (兜底降级，绝不报错 500)
  // ---------------------------------------------------------
  return getUnsupportedAST(fallbackSlug);
}

/**
 * 生成“无法适配”的降级视图 AST (保证前端能渲染出联系管理员的提示)
 */
function getUnsupportedAST(slugName: string) {
  return {
    version: "1.1.0",
    type: "unsupported",
    metadata: {
      title: "⚠️ 暂时无法适配，请联系管理员",
      slug: slugName,
      createdAt: new Date().toISOString(),
      access: { visibility: "public" }
    },
    blocks: [
      { type: "paragraph", content: `文件名 / 标识符: ${slugName}.json` },
      { type: "paragraph", content: "系统当前未安装对应的解析插头，无法读取此文件内容。请检查 R2 桶中的源文件格式。" }
    ]
  };
}