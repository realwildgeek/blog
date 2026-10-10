// app/routes/$slug.tsx
import { useState, useEffect } from "react";
import { useParams, useLoaderData } from "react-router";
import { universalTransformer } from "../adapters/index";
import { decryptBlockData } from "../adapters/crypto-adapter";

// 👉 引入你写的 Feedback 工具，用于调用 API
import { Feedback } from "../utils/feedback"; 

export async function loader({ params }: any) {
  const env = (globalThis as any).CF_ENV;
  const bucket = env?.BLOG_BUCKET;
  if (!bucket) throw new Response("R2 桶未绑定", { status: 500 });

  const object = await bucket.get(`${params.slug}.json`);
  if (!object) throw new Response("文章未找到", { status: 404 });

  const rawText = await object.text();
  // 服务端只做格式清洗，绝不解密！
  return await universalTransformer(rawText, params.slug);
}

export default function PostReader() {
  const post = useLoaderData<any>();
  
  const isEncryptedInitial = post.metadata?.access?.e2ee?.isEncrypted;
  const [isLocked, setIsLocked] = useState(isEncryptedInitial);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "decrypting" | "error">("idle");
  const [decryptedBlocks, setDecryptedBlocks] = useState(isEncryptedInitial ? null : post.blocks);

  useEffect(() => {
    const locked = post.metadata?.access?.e2ee?.isEncrypted;
    setIsLocked(locked);
    setDecryptedBlocks(locked ? null : post.blocks);
    setPassword("");
    setStatus("idle");

    // 埋点：向全局 Feedback 发送调试信息
    Feedback.trace("页面加载: 收到的初始 AST 结构", post);
  }, [post]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    
    setStatus("decrypting");

    try {
      const wrappedDEK = post.metadata.access.e2ee.wrappedDEK;
      const ciphertext = Array.isArray(post.blocks) ? post.blocks[0] : post.blocks; 

      if (post.type === "crypto5.2") {
         const realBlocks = await decryptBlockData(ciphertext, wrappedDEK, password);
         
         setDecryptedBlocks(realBlocks);
         setStatus("idle");
         setIsLocked(false);
         
         // 触发完美的 UI 提示
         Feedback.ui("解锁成功！AST 重组完毕", "info");
         Feedback.trace("解密成功: 明文 Blocks 结构", realBlocks);
      }
    } catch (error) {
      console.error(error);
      setStatus("error");
      // 触发红色的 UI 错误提示
      Feedback.ui("密钥错误或 Auth Tag 验证失败", "error");
    }
  };

  // 💡 注意这里：删除了 <FeedbackPanel />，因为它已经在 root.tsx 全局挂载了！
  return (
    <>
      {/* ==========================================
          🎨 视图 1：锁定状态 (密码框 UI)
          ========================================== */}
      {isLocked ? (
        <div className="app-container" style={{ textAlign: "center", marginTop: "15vh" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🔒</div>
          <h1 className="reader-title" style={{ letterSpacing: "2px" }}>端到端加密档案</h1>
          <p style={{ color: "var(--text-muted)", marginBottom: "3rem" }}>
            数据处于加密形态，需验证所有者密钥以在本地释放。
          </p>
          
          <form onSubmit={handleUnlock} style={{ maxWidth: "300px", margin: "0 auto" }}>
            <input
              type="password"
              autoFocus
              className="cmd-input"
              style={{ textAlign: "center", letterSpacing: "0.2em", padding: "1rem" }}
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setStatus("idle"); }}
              disabled={status === "decrypting"}
            />
            <div style={{ marginTop: "1.5rem", height: "30px", fontSize: "0.85rem" }}>
              {status === "decrypting" && <span style={{ color: "#3b82f6" }}>[ 重组 AES-GCM 数据... ]</span>}
              {status === "error" && <span style={{ color: "#ef4444" }}>❌ Auth Tag 验证失败</span>}
            </div>
          </form>
        </div>
      ) : (
        /* ==========================================
           🎨 视图 2/3：明文渲染区
           ========================================== */
        <div className="reader-container">
          <header className="reader-header">
            <h1 className="reader-title">{post.metadata.title}</h1>
            <div className="reader-meta">
              {post.metadata.createdAt.split('T')[0]} 
              {post.type === "crypto5.2" && <span style={{color: "#10b981", marginLeft: "10px"}}>✓ E2EE 解密成功</span>}
            </div>
          </header>

          <article>
            {decryptedBlocks && decryptedBlocks.map((block: any, idx: number) => {
              const textContent = typeof block === 'string' ? block : (block.content || JSON.stringify(block));
              return <p key={idx} className="ast-paragraph">{textContent}</p>;
            })}
          </article>
        </div>
      )}
    </>
  );
}