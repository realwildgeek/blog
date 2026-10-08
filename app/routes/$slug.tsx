import { useParams, Link, useLoaderData } from "react-router";
import { CommandPalette } from "../components/CommandPalette";

// --- 1. 带有绝对防御机制的服务端抽水机 (探针模式) ---
export async function loader({ params, context }: any) {
  try {
    const { slug } = params;
    const env = context?.cloudflare?.env;

    // 案发现场 1：环境变量丢失
    if (!env) {
      return { _debugError: "❌ 崩溃原因：context.cloudflare.env 完全为空，摆渡函数未生效！" };
    }
    if (!env.BLOG_BUCKET) {
      return { _debugError: `❌ 崩溃原因：找不到 BLOG_BUCKET！当前环境只注入了这些变量: ${Object.keys(env).join(", ") || '无'}` };
    }

    const bucket = env.BLOG_BUCKET;
    const object = await bucket.get(`${slug}.json`);

    // 案发现场 2：R2 桶里没这个文件
    if (!object) {
      return { _debugError: `❌ 崩溃原因：R2 数据库连接成功，但桶内找不到名为 [ ${slug}.json ] 的文件！请检查 Cloudflare 后台 R2 里的文件名是否完全一致。` };
    }

    // 案发现场 3：JSON 解析失败 (你传到 R2 里的文件可能不是合法的 JSON)
    const rawText = await object.text();
    try {
      const data = JSON.parse(rawText);
      return data; // 如果一切完美，返回真实数据
    } catch (e: any) {
      return { _debugError: `❌ 崩溃原因：R2 文件读取成功，但 JSON 解析失败！\n错误信息: ${e.message}\n文件前50个字符: ${rawText.substring(0, 50)}` };
    }

  } catch (e: any) {
    // 案发现场 4：未知的底层引擎崩溃
    return { _debugError: `❌ 崩溃原因：边缘函数执行时发生未知硬崩溃: ${e.message}\n${e.stack}` };
  }
}

// --- 2. 渲染器 ---
function renderBlock(block: any) {
  switch (block.type) {
    case "paragraph":
      return <p key={block.id} className="ast-paragraph">{block.content}</p>;
    case "heading":
      return <h2 key={block.id} className="ast-heading-2">{block.content}</h2>;
    case "quote":
      return <blockquote key={block.id} className="ast-quote">{block.content}</blockquote>;
    default:
      return <div key={block.id} style={{ color: 'red' }}>[未知区块]</div>;
  }
}

export default function PostReader() {
  const { slug } = useParams(); 
  const post = useLoaderData<any>(); 

  // 🚨 探针拦截器：如果查出死因，直接在页面上拉起红色警戒线
  if (post?._debugError) {
    return (
      <div style={{ padding: "5rem 2rem", maxWidth: "800px", margin: "0 auto", fontFamily: "monospace" }}>
        <h2 style={{ color: "#ef4444", marginBottom: "1rem" }}>边缘节点诊断报告 (探针回传)</h2>
        <div style={{ background: "#fee2e2", color: "#991b1b", padding: "1.5rem", borderRadius: "8px", whiteSpace: "pre-wrap", lineHeight: "1.6" }}>
          {post._debugError}
        </div>
        <Link to="/" style={{ display: 'inline-block', marginTop: '2rem', color: '#666' }}>← 返回首页</Link>
      </div>
    );
  }

  // 如果没有错误，正常渲染你的极简阅读器
  return (
    <>
      <CommandPalette />
      <div className="reader-container">
        <Link to="/" style={{ display: 'inline-block', marginBottom: '3rem', color: 'var(--text-muted)', textDecoration: 'none', fontFamily: 'monospace' }}>
          ← Back
        </Link>
        <header className="reader-header">
          <h1 className="reader-title">{post.metadata?.title || "无标题"}</h1>
          <div className="reader-meta">{post.metadata?.date || "未知日期"} / {slug}</div>
        </header>
        <article className="reader-body">
          {post.blocks?.map((block: any) => renderBlock(block))}
        </article>
      </div>
    </>
  );
}