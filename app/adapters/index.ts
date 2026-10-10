// app/adapters/index.ts
// =========================================================================
// 🏢 核心调度中心 (处理中心 C) - 满级兼容与 X光透视版
// =========================================================================

export async function universalTransformer(rawText: string, fallbackSlug: string = "unknown"): Promise<any> {
  let rawData: any;
  try {
    rawData = JSON.parse(rawText);
  } catch (e) {
    return getUnsupportedAST(fallbackSlug, "无法解析为有效 JSON (JSON.parse 失败)，可能是纯文本或编码损坏");
  }

  // ---------------------------------------------------------
  // 🔍 嗅探规则 1: 加密数据包 (只要有信封密钥 wrappedDEK，统统按加密处理)
  // 兼容旧版 meta.wrappedDEK 与 新版 metadata.access.e2ee.wrappedDEK
  // ---------------------------------------------------------
  const wrappedDEK = rawData.meta?.wrappedDEK || rawData.metadata?.access?.e2ee?.wrappedDEK || rawData.wrappedDEK;
  
  if (wrappedDEK) {
    return {
      version: "1.1.0",
      type: "crypto5.2", // 呼叫解密插头
      metadata: {
        title: rawData.meta?.title || rawData.metadata?.title || "🔒 私密加密文档",
        slug: rawData.meta?.id || rawData.metadata?.slug || fallbackSlug,
        createdAt: rawData.meta?.createdAt || rawData.metadata?.createdAt || new Date().toISOString(),
        access: {
          visibility: "private",
          e2ee: { isEncrypted: true, wrappedDEK }
        }
      },
      // 容错：不管是 content 还是 blocks，把密文数组塞进去
      blocks: rawData.content || rawData.blocks || [] 
    };
  }

  // ---------------------------------------------------------
  // 🔍 嗅探规则 2: 标准 1.1.0 AST (自带 metadata 和 blocks)
  // ---------------------------------------------------------
  if (rawData.metadata && rawData.blocks) {
    return { 
      ...rawData, 
      version: rawData.version || "1.1.0",
      type: "native" // 原生支持，直接渲染
    };
  }

  // ---------------------------------------------------------
  // 🔍 嗅探规则 3: 旧版明文包 (比如 qqq.json，有 meta 和 content，但没加密)
  // ---------------------------------------------------------
  if (rawData.meta && rawData.content) {
    return {
      version: "1.1.0",
      type: "native", 
      metadata: {
        title: rawData.meta.title || "旧版明文文档",
        slug: rawData.meta.id || fallbackSlug,
        createdAt: rawData.meta.createdAt || rawData.meta.updatedAt || new Date().toISOString(),
        access: { visibility: "public" }
      },
      blocks: rawData.content // 自动平移为 blocks
    };
  }

  // ---------------------------------------------------------
  // 🔍 嗅探规则 4: 极简草稿 (只有 title 和 content)
  // ---------------------------------------------------------
  if (rawData.title && (rawData.content || rawData.body)) {
    return {
      version: "1.1.0",
      type: "native",
      metadata: { 
        title: rawData.title, 
        createdAt: rawData.date || rawData.createdAt || new Date().toISOString() 
      },
      blocks: Array.isArray(rawData.content) ? rawData.content : [{ type: "paragraph", content: rawData.content || rawData.body }]
    };
  }

  // ---------------------------------------------------------
  // 🚨 兜底防线: 开天眼！打印出这个未知 JSON 到底包含什么字段
  // ---------------------------------------------------------
  const keys = Object.keys(rawData).join(", ");
  return getUnsupportedAST(fallbackSlug, `文件包含的顶层字段为: [ ${keys} ]`);
}

/**
 * 诊断占位符 (Fallback UI AST)
 */
function getUnsupportedAST(slugName: string, debugInfo: string) {
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
      { type: "paragraph", content: `【诊断雷达】: ${debugInfo}` }, // 👈 这一行将直接在网页上告诉你格式差在哪里！
      { type: "paragraph", content: "系统当前未匹配到对应的解析插头，请检查 R2 桶中的源文件格式。" }
    ]
  };
}