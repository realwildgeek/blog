// app/routes/$slug.tsx
// =========================================================================
// 📖 前端阅读器 & 解密指挥官
// =========================================================================
import { useState } from "react";
import { useParams, useLoaderData } from "react-router";
import { universalTransformer } from "../adapters/index";
import { decryptBlockData } from "../adapters/crypto-adapter";

// ---------------------------------------------------------
// 💧 纯净抽水机 (运行在 Server 边缘节点)
// ---------------------------------------------------------
export async function loader({ params }: any) {
  const env = (globalThis as any).CF_ENV;
  const bucket = env?.BLOG_BUCKET;
  if (!bucket) throw new Response("R2 未绑定", { status: 500 });

  // 无后缀拉取，完全拥抱 R2 的 Object 哲学
  const object = await bucket.get(params.slug);
  if (!object) throw new Response("文章未找到", { status: 404 });

  const rawText = await object.text();
  
  // 交给处理中心C洗成标准外壳，然后发给前端（绝不传密码，也不解密）
  return await universalTransformer(rawText);
}

// ---------------------------------------------------------
// 🎨 前端动态交互画布 (运行在 浏览器)
// ---------------------------------------------------------
export default function PostReader() {
  const post = useLoaderData<any>();
  
  // 核心状态机
  const isEncryptedInitial = post.metadata?.access?.e2ee?.isEncrypted;
  
  const [isLocked, setIsLocked] = useState(isEncryptedInitial);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "decrypting" | "error">("idle");
  const [decryptedBlocks, setDecryptedBlocks] = useState(isEncryptedInitial ? null : post.blocks);

  // 💥 触发安全解锁
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    
    setStatus("decrypting");

    try {
      // 从服务端传来的包裹中提取关键安全信息
      const wrappedDEK = post.metadata.access.e2ee.wrappedDEK;
      // 在我们的旧版结构里，content 是一个包裹在数组里的长字符串密文，所以取 [0]
      const ciphertext = Array.isArray(post.blocks) ? post.blocks[0] : post.blocks; 

      // 👉 插上转接头，开始呼叫硬件算力进行零知识解密！
      if (post.type === "crypto5.2") {
         const realBlocks = await decryptBlockData(ciphertext, wrappedDEK, password);
         
         // 解密成功！替换数据，解除封锁状态
         setDecryptedBlocks(realBlocks);
         setStatus("idle");
         setIsLocked(false);
      }
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  };

  // ==========================================
  // 视图 A：🛡️ 锁定状态 (输入密码的优雅 UI)
  // ==========================================
  if (isLocked) {
    return (
      <div className="app-container" style={{ textAlign: "center", marginTop: "15vh" }}>
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🔒</div>
        <h1 className="reader-title" style={{ letterSpacing: "2px" }}>端到端加密档案</h1>
        <p style={{ color: "var(--text-muted)", marginBottom: "3rem", fontSize: "0.95rem" }}>
          数据仍处于加密形态，需验证所有者密钥以在本地释放。
        </p>
        
        <form onSubmit={handleUnlock} style={{ maxWidth: "320px", margin: "0 auto" }}>
          <input
            type="password"
            autoFocus
            className="cmd-input"
            style={{ 
              textAlign: "center", letterSpacing: "0.2em", padding: "1rem", 
              borderRadius: "8px", border: "1px solid var(--border-subtle)" 
            }}
            placeholder="••••••••"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setStatus("idle"); }}
            disabled={status === "decrypting"}
          />
          
          <div style={{ marginTop: "1.5rem", height: "30px", fontSize: "0.85rem" }}>
            {status === "decrypting" && (
              <span style={{ color: "#3b82f6", fontFamily: "monospace" }}>
                [ ⏳ 释放本地算力，重组 AES-GCM 数据区块... ]
              </span>
            )}
            {status === "error" && (
              <span style={{ color: "#ef4444" }}>❌ Auth Tag 验证失败，密钥拒接访问</span>
            )}
          </div>
        </form>
      </div>
    );
  }

  // ==========================================
  // 视图 B：📖 解密成功 / 明文直出 渲染视图
  // ==========================================
  return (
    <div className="reader-container">
      <header className="reader-header">
        <h1 className="reader-title">{post.metadata.title}</h1>
        <div className="reader-meta">
          发布于 {new Date(post.metadata.createdAt).toLocaleDateString()} 
          {/* 渲染一个极其装杯的安全认证标识 */}
          {isEncryptedInitial && (
            <span style={{
              color: "#059669", background: "#d1fae5", 
              padding: "2px 8px", borderRadius: "12px", 
              marginLeft: "12px", fontSize: "0.75rem", fontWeight: 600
            }}>
              ✓ E2EE Verified
            </span>
          )}
        </div>
      </header>

      <article style={{ marginTop: "3rem" }}>
        {/* 解析出的纯净 Blocks 数据渲染区 */}
        {decryptedBlocks && decryptedBlocks.map((block: any, idx: number) => {
          // 这里可以根据 block.type 扩展出 heading, quote 等，目前统配 paragraph
          const textContent = typeof block === 'string' ? block : (block.content || '');
          return (
             <p key={idx} className="ast-paragraph">{textContent}</p>
          );
        })}
      </article>
    </div>
  );
}