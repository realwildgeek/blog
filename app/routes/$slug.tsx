import { useParams, Link, useLoaderData } from "react-router";
import { CommandPalette } from "../components/CommandPalette";

export async function loader({ params, context }: any) {
  try {
    // 全方位探测环境变量的位置 (兼容 v7 和 v8 的各种挂载方式)
    let env = null;
    let envSource = "";

    if (context?.get && typeof context.get === 'function') {
      env = context.get("env");
      envSource = "context.get('env')";
    } else if (context?.env) {
      env = context.env;
      envSource = "context.env";
    } else if (context?.cloudflare?.env) {
      env = context.cloudflare.env;
      envSource = "context.cloudflare.env";
    }

    if (!env || !env.BLOG_BUCKET) {
      return { 
        _debugError: `❌ 找不到 BLOG_BUCKET！\n探索路径: ${envSource || '无'}\nContext 拥有的顶层键名: ${Object.keys(context || {}).join(', ')}`
      };
    }

    const bucket = env.BLOG_BUCKET;
    const object = await bucket.get(`${params.slug}.json`);
    
    if (!object) {
      return { _debugError: `❌ 环境变量正常，但 R2 桶里找不到名为 [ ${params.slug}.json ] 的文件。` };
    }

    const rawText = await object.text();
    return JSON.parse(rawText);

  } catch (error: any) {
    return { _debugError: `❌ 代码执行崩溃: ${error.message}\n${error.stack}` };
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

  // 如果捕获到错误，直接在页面上输出红色诊断报告，绕过 ErrorBoundary 的掩盖
  if (post?._debugError) {
    return (
      <div style={{ padding: '5rem 2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'monospace' }}>
        <h2 style={{ color: '#dc2626' }}>数据层精确诊断</h2>
        <pre style={{ background: '#fee2e2', color: '#991b1b', padding: '1.5rem', borderRadius: '8px', whiteSpace: 'pre-wrap' }}>
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