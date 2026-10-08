import { useParams, Link, useLoaderData } from "react-router";
import { CommandPalette } from "../components/CommandPalette";

export async function loader({ params, context }: any) {
  try {
    // 毫无悬念地从 provider 中取出我们用闭包强行塞进来的 env
    const env = context.get("env");
    
    if (!env || !env.BLOG_BUCKET) {
      return { _debugError: "❌ 如果你看到这条，说明宇宙物理学不存在了。" };
    }

    const bucket = env.BLOG_BUCKET;
    const object = await bucket.get(`${params.slug}.json`);
    
    if (!object) {
      return { _debugError: `❌ 管道全通！但你的 R2 桶里确实没有 [ ${params.slug}.json ] 这个文件。` };
    }

    const rawText = await object.text();
    return JSON.parse(rawText);

  } catch (error: any) {
    return { _debugError: `❌ 数据解析异常: ${error.message}` };
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

  if (post?._debugError) {
    return (
      <div style={{ padding: '5rem 2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'monospace' }}>
        <h2 style={{ color: '#dc2626' }}>管道已通，数据状态异常：</h2>
        <pre style={{ background: '#fee2e2', color: '#991b1b', padding: '1.5rem', borderRadius: '8px' }}>
          {post._debugError}
        </pre>
        <Link to="/" style={{ display: 'inline-block', marginTop: '2rem', color: '#666' }}>← 返回首页</Link>
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