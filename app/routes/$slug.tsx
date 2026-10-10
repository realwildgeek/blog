import { useParams, Link, useLoaderData } from "react-router";
import { CommandPalette } from "../components/CommandPalette";
// 引入我们的“处理中心 C”
import { universalTransformer } from "../adapters/index";

export async function loader({ params }: any) {
  const env = (globalThis as any).CF_ENV;
  const bucket = env?.BLOG_BUCKET;
  
  if (!bucket) throw new Response("R2 桶未绑定", { status: 500 });

  const object = await bucket.get(`${params.slug}.json`);
  if (!object) throw new Response("文章未找到", { status: 404 });

  const rawText = await object.text();

  // 🔥 极其优雅的单行调用：扔给中心 C，闭眼拿标准数据！
  // (这里为了演示，暂时假设密码是硬编码或从 cookie 取的)
  const password = "my_master_password"; 
  const standardAST = await universalTransformer(rawText, password);

  return standardAST;
}

// ... 下面是组件渲染代码，完全不用改 ...
export default function PostReader() {
  const post = useLoaderData<any>(); 
  // 依然舒舒服服地读取 post.metadata.title 和 post.blocks
}