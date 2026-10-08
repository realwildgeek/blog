import { useParams, Link, useLoaderData } from "react-router";
import { CommandPalette } from "../components/CommandPalette";

export async function loader({ params }: any) {
  // 🔥 终极抽水机：无视框架，直接向 V8 引擎要数据
  const env = (globalThis as any).CF_ENV;
  const bucket = env?.BLOG_BUCKET;
  
  if (!bucket) {
    throw new Response("R2 桶未绑定，请检查环境配置", { status: 500 });
  }

  const object = await bucket.get(`${params.slug}.json`);
  
  if (!object) {
    throw new Response("文章未找到", { status: 404 });
  }

  const rawText = await object.text();
  return JSON.parse(rawText);
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