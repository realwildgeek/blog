// app/adapters/index.ts

// 引入你的加密插头 (注意：这里假设 crypto-adapter 已经被重命名为 .ts)
import { decryptAndTranslateToAST } from './crypto-adapter';

/**
 * 中央转换器 (处理中心 C)
 * @param rawText - 从 R2 抽上来的原始文件文本
 * @param userCredential - (可选) 用户密码或 Token，用于需要解密的插头
 */
export async function universalTransformer(rawText: string, userCredential?: string | CryptoKey): Promise<any> {
  let rawData: any;
  
  try {
    rawData = JSON.parse(rawText);
  } catch (e) {
    throw new Error("❌ 无法解析的非 JSON 文件");
  }

  // ==========================================
  // 🔍 开始智能识别 (嗅探特征)，分配插头
  // ==========================================

  // 1. 识别：是不是 Crypto5.2 加密文件？
  if (rawData.meta && rawData.meta.wrappedDEK) {
    console.log("👉 识别为加密文件，路由至 Crypto 转换器...");
    return await decryptAndTranslateToAST(rawText, rawData.meta.wrappedDEK, userCredential);
  }

  // 2. 识别：是不是 Notion 导出的文件？
  if (rawData.object === "page") {
    console.log("👉 识别为 Notion 格式，路由至 Notion 转换器...");
    // return await translateNotionToAST(rawData);
  }

  // 3. 识别：如果它本身就已经符合我们的终极标准了？
  if (rawData.version === "1.1.0" && rawData.blocks) {
    console.log("👉 识别为标准格式，无需转换，直接放行...");
    return rawData;
  }

  // 4. 兜底处理
  throw new Error("🚨 未知数据格式，处理中心 C 找不到匹配的插头！");
}