import { useParams, Link, useLoaderData } from "react-router";
import { CommandPalette } from "../components/CommandPalette";

export async function loader({ params, context }: any) {
  // 不再盲猜层级，直接把 v8 传进来的 context 键值全部返回给前端
  return { 
    slug: params.slug,
    contextKeys: Object.keys(context || {}),
    cloudflareKeys: context?.cloudflare ? Object.keys(context.cloudflare) : "无 cloudflare 属性"
  };
}

export default function PostReader() {
  const { slug } = useParams(); 
  const data = useLoaderData<any>(); 

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h2>环境对象探勘结果：</h2>
      <pre style={{ background: '#f4f4f4', padding: '1rem' }}>
        {JSON.stringify(data, null, 2)}
      </pre>
      <Link to="/">← 返回首页</Link>
    </div>
  );
}