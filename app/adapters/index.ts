// app/adapters/index.ts
// =========================================================================
// 🏢 核心调度中心 (处理中心 C) - 负责数据结构的嗅探与安全包裹 (运行在 Server)
// =========================================================================

export async function universalTransformer(rawText: string): Promise<any> {
  let rawData: any;
  try {
    rawData = JSON.parse(rawText);
  } catch (e) {
    throw new Error("❌ 无法解析的非 JSON 文件");
  }

  // ---------------------------------------------------------
  // 🔍 路由分支 1：旧版 Crypto 格式 (需要前端 E2EE 解密)
  // ---------------------------------------------------------
  // 特征：最外层有 meta 且包含 wrappedDEK
  if (rawData.meta && rawData.meta.wrappedDEK) {
    console.log("👉 [Server] 嗅探到加密包裹，执行静默封存，交由前端解密...");
    
    // 💡 仅做格式的重组与打包，绝不尝试解密
    return {
      version: "1.1.0",
      type: "crypto5.2", // 👈 关键标签，告诉前端这个箱子该用哪个插头开锁
      metadata: {
        title: rawData.meta.title || "🔒 私密加密文档",
        slug: rawData.meta.id || `post_${Date.now()}`,
        createdAt: rawData.meta.createdAt || new Date().toISOString(),
        access: {
          visibility: "private",
          e2ee: {
            isEncrypted: true,
            wrappedDEK: rawData.meta.wrappedDEK // 把信封安全地转交给前端
          }
        }
      },
      // 这里的 blocks 依然是待解密的数学乱码
      blocks: rawData.content 
    };
  }

  // ---------------------------------------------------------
  // 🔍 路由分支 2：标准原生 AST 格式 (无需处理，直接放行)
  // ---------------------------------------------------------
  // 特征：本身就是按我们 1.1.0 标准存入的
  if (rawData.version === "1.1.0" && rawData.blocks) {
    console.log("👉 [Server] 嗅探到标准格式，直接放行...");
    return {
      ...rawData,
      type: "native" // 标记为原生标准格式
    };
  }

  // ---------------------------------------------------------
  // 🔍 兜底处理：未知格式拦截
  // ---------------------------------------------------------
  throw new Error("🚨 未知数据格式，处理中心 C 拒绝受理！");
}