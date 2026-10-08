import { useParams, Link, useLoaderData } from "react-router";
import { CommandPalette } from "../components/CommandPalette";

export async function loader({ params, context }: any) {
  try {
    const env = context.env || context.cloudflare?.env || {};
    const bucket = env.BLOG_BUCKET;
    
    if (!bucket) {
      return { _debugError: "❌ R2 桶环境变量丢失！当前环境中只有: " + Object.keys(env).join(", ") };
    }

    const object = await bucket.get(`${params.slug}.json`);
    if (!object) {
      return { _debugError: `❌ R2 桶连接成功，但找不到文件: ${params.slug}.json` };
    }

    const rawText = await object.text();
    return JSON.parse(rawText);
  } catch (error: any) {
    return { _debugError: `❌ 抽水机内部破裂: ${error.message}` };
  }
}

function renderBlock(block: any) {
  switch (block.type) {
    case "paragraph": return <p key={block.id} className="ast-paragraph">{block.content}</p>;
    case "heading": return <h2 key={block.id} className="ast-heading-2">{block.content}</h2>;
    case "quote": return <blockquote key={block.id} className="ast-quote">{block.content}</blockquote>;
    default: return <div key={block.id} style={{ color: 'red' }}>[未知区块]</div>;
  }
}

export default function PostReader() {
  const { slug } = useParams(); 
  const post = useLoaderData<any>(); 

  // 数据层报错拦截渲染
  if (post?._debugError) {
    return (
      <div style={{ padding: '5rem 2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'monospace' }}>
        <h2 style={{ color: '#dc2626' }}>数据层诊断报告</h2>
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '1.5rem', borderRadius: '8px' }}>
          {post._debugError}
        </div>
      </div>
    );
  }

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