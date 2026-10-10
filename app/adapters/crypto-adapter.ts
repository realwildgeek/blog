// app/adapters/crypto-adapter.ts

// 💡 提示：如果你的 crypto5.2 依然是 .js 后缀，TS 可能会因为找不到类型声明而画红线
// 你可以加上 @ts-ignore 暂时忽略，或者最好把 crypto5.2.js 也改成 .ts
// @ts-ignore
import { CryptoCore } from './crypto5.2.js'; 

/**
 * 终极安全转接头：一站式完成【解密】与【AST 翻译】
 * 
 * @param ciphertextR2 - 从 R2 桶里抽上来的乱码（加密正文）
 * @param wrappedDEK - 该文件的专属信封密钥（通常在 KV 列表或元数据里）
 * @param userCredential - 用户输入的主密码或 WebAuthn Token
 */
export async function decryptAndTranslateToAST(
  ciphertextR2: string,         // 👈 明确规定：必须传入字符串密文
  wrappedDEK: string,           // 👈 明确规定：必须传入字符串信封
  userCredential?: any          // 👈 兼容密码(string)或生物识别的密钥(CryptoKey)
): Promise<any> {               // 👈 明确规定：这个函数最终会吐出一个 Promise 数据包
  
  if (!ciphertextR2 || !wrappedDEK) {
    throw new Error("❌ 缺少密文或信封密钥，转接头拒绝工作");
  }

  try {
    // ==========================================
    // 🔌 第一步：调用 Crypto5.2 引擎进行解密
    // ==========================================
    // 1. 拆信封：用用户主密钥解开 DEK
    const dekBase64 = await CryptoCore.unwrapDEK(wrappedDEK, userCredential);
    
    // 2. 解密数据：用 DEK 将 R2 乱码还原成原来的 JSON 字符串
    const rawJsonStr = await CryptoCore.decryptData(ciphertextR2, dekBase64);
    
    // 3. 将解密出来的旧版字符串，解析为对象
    const rawData = JSON.parse(rawJsonStr);
    
    // ==========================================
    // 🪛 第二步：执行“针脚对接” (JSON 格式化)
    // ==========================================
    const meta = rawData.meta || {};
    const content = rawData.content || [];

    // 吐出严格符合我们阅读器要求的标准格式
    return {
      version: "1.1.0", 
      metadata: {
        title: meta.title || "无标题的私密文档",
        slug: meta.id || `post_${Date.now()}`,
        createdAt: meta.createdAt || meta.updatedAt || new Date().toISOString(),
        updatedAt: meta.updatedAt || new Date().toISOString(),
        revisionId: `rev_${Math.random().toString(36).slice(-8)}`,
        
        seo: { excerpt: "", coverImage: "", isPinned: false },
        curation: { tags: meta.tags || [], series: "", related: [] },
        assets: [], 
        
        // 核心：明确标记这份数据是经过 E2EE 解密重组的
        access: {
          visibility: "private", 
          allowedGroups: [],
          e2ee: {
            isEncrypted: true,
            cipherType: "AES-256-GCM",
            wrappedDEK: wrappedDEK 
          }
        }
      },
      blocks: content 
    };

  } catch (error) {
    console.error("转接头工作失败:", error);
    throw new Error("🔒 密钥错误或数据被篡改，拒绝解密！");
  }
}