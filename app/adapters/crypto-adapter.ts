// app/adapters/crypto-adapter.ts
// =========================================================================
// 🔌 前端解密插头 (Crypto Adapter) - 负责接收用户密码并在浏览器内存中安全解密
// =========================================================================

// @ts-ignore
import { CryptoCore } from './crypto5.2.js'; 

/**
 * 纯粹的解密核弹：只管算力开锁，吐出明文对象
 * 
 * @param ciphertext - 需要解密的原始乱码（字符串）
 * @param wrappedDEK - 该文件的专属信封密钥
 * @param userCredential - 用户在页面输入的密码字符串
 * @returns {Promise<any>} 解密出来的原生 JSON 对象
 */
export async function decryptBlockData(
  ciphertext: string, 
  wrappedDEK: string, 
  userCredential: string
): Promise<any> {
  
  try {
    // 1. 拆信封：用用户输入的主密码解开数据的专属 DEK
    const dekBase64 = await CryptoCore.unwrapDEK(wrappedDEK, userCredential);
    
    // 2. 解密数据：在浏览器内存中飞速运算，扒下 AES-GCM 的乱码外衣
    const decryptedStr = await CryptoCore.decryptData(ciphertext, dekBase64);
    
    // 3. 将还原出的 JSON 字符串转换成 JavaScript 对象 (通常就是你的 blocks 数组)
    return JSON.parse(decryptedStr);

  } catch (error) {
    console.error("[Adapter] 内存解密失败:", error);
    // 触发此报错说明：密码错了，或者 R2 桶里的密文被黑客偷偷篡改了一个字节，导致 Auth Tag 破裂
    throw new Error("🔒 密码错误或数据受损，解密中止！");
  }
}