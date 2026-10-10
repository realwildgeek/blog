// app/adapters/storage-adapter.ts

/**
 * 转接头：将 storage.js 导出的旧版/外部格式，翻译成“无名之境”终极 AST 标准格式
 * @param rawData - 原始的带有旧方言的 JSON 数据
 * @returns 100% 严格符合我们内部协议的标准 JSON
 */
export function translateStorageToNamelessAST(rawData: any): any { // 👈 核心修改：明确了传入参数和返回值的类型为 any
  // 1. 拆开寄过来的包裹（容错处理，防止数据为空崩溃）
  const meta = rawData.meta || {};
  const content = rawData.content || [];

  // 2. 严格照着我们的“说明书”进行针脚对接与重新组装
  return {
    // 【系统特征】强行打上我们的标准协议钢印
    version: "1.1.0", 

    // 【元数据区】把旧的 meta 拆解，逐一塞进我们严密的 metadata 结构里
    metadata: {
      title: meta.title || "无标题文档",
      slug: meta.id || `post_${Date.now()}`, // 旧系统用 id，新系统映射为 slug
      createdAt: meta.createdAt || meta.updatedAt || new Date().toISOString(),
      updatedAt: meta.updatedAt || new Date().toISOString(),
      revisionId: `rev_${Math.random().toString(36).slice(-8)}`, // 离线同步占位符
      
      // 外部数据没有 SEO 字段？没关系，转接头自动补齐默认结构，保证阅读器不报错
      seo: {
        excerpt: "", 
        coverImage: "",
        isPinned: false
      },
      
      curation: {
        tags: meta.tags || [],
        series: "",
        related: []
      },
      
      assets: [], 
      
      // 🔥 最核心的转换：将游离在外的 wrappedDEK，规规矩矩地收编到安全访问控制（access）体系中
      access: {
        visibility: "private", // 外部导进来的默认设为仅自己可见
        allowedGroups: [],
        e2ee: {
          isEncrypted: !!meta.wrappedDEK, // 嗅探：如果包裹里有这把钥匙，证明它是加密的
          cipherType: "AES-256-GCM",
          wrappedDEK: meta.wrappedDEK || null // 针脚对接完成！
        }
      }
    },

    // 【正文数据区】把旧的 content 数组，直接接到新的 blocks 接口上
    blocks: content 
  };
}