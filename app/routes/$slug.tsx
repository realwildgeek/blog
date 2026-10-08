import { useParams, Link, useLoaderData } from "react-router";
import { CommandPalette } from "../components/CommandPalette";

// --- 1. 这是在服务端 (Cloudflare 边缘节点) 执行的抽水机 ---
export async function loader({ params, context }: any) {
  const { slug } = params;
  
  // 通过 context 拿到我们在 wrangler.toml 里绑定的 R2 桶
  const bucket = context.cloudflare.env.BLOG_BUCKET;
  
  // 去 R2 里找对应的文件（由于我们之后要做 E2EE，现在先用 slug.json 模拟）
  const object = await bucket.get(`${slug}.json`);
  
  if (!object) {
    throw new Response("文章未找到", { status: 404 });
  }

  // 把 R2 里的 Buffer 数据转成 JSON 对象并返回给前端
  const data = await object.json();
  return data;
}

// --- 2. 下面是纯粹的前端渲染器，跟之前几乎一样 ---
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
  
  // 🔥 核心改变：不再用 mockData，直接接住 Loader 从 R2 抽上来的水！
  const post = useLoaderData<typeof loader>(); 

  return (
    <>
      <CommandPalette />
      
      <div className="reader-container">
        <Link 
          to="/" 
          style={{ 
            display: 'inline-block', marginBottom: '3rem', 
            color: 'var(--text-muted)', textDecoration: 'none',
            fontFamily: 'monospace'
          }}
        >
          ← Back
        </Link>

        <header className="reader-header">
          <h1 className="reader-title">{post.metadata.title}</h1>
          <div className="reader-meta">{post.metadata.date} / {slug}</div>
        </header>

        <article className="reader-body">
          {post.blocks.map((block: any) => renderBlock(block))}
        </article>
      </div>
    </>
  );
}