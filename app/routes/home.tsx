import { useLoaderData } from "react-router";
import { PostCard } from "../components/PostCard";
import { CommandPalette } from "../components/CommandPalette";

export async function loader() {
  const env = (globalThis as any).CF_ENV;
  const bucket = env?.BLOG_BUCKET;
  
  if (!bucket) {
    return { posts: [] };
  }

  try {
    const listed = await bucket.list();
    
    const postsPromises = listed.objects
      .filter((obj: any) => obj.key.endsWith('.json'))
      .map(async (obj: any) => {
        const file = await bucket.get(obj.key);
        if (!file) return null;
        
        try {
          const rawText = await file.text();
          const data = JSON.parse(rawText);
          
          return {
            slug: obj.key.replace('.json', ''),
            title: data.metadata?.title || "无标题",
            date: data.metadata?.date || "1970-01-01"
          };
        } catch (e) {
          return null; 
        }
      });

    const posts = await Promise.all(postsPromises);
    const validPosts = posts
      .filter(Boolean)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { posts: validPosts };
  } catch (error) {
    console.error("Failed to load posts:", error);
    return { posts: [] };
  }
}

export default function Home() {
  // 接住抽水机抽上来的真实文章列表
  const { posts } = useLoaderData<any>();

  return (
    <>
      <CommandPalette />

      <div className="app-container">
        <header className="header-area">
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>无名之境</h1>
        </header>

        <main className="post-list">
          {posts.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '4rem', fontFamily: 'monospace' }}>
              [ 数据库空载，或者 R2 桶内无 .json 文件 ]
            </div>
          ) : (
            posts.map((post: any) => (
              <PostCard 
                key={post.slug}
                title={post.title} 
                date={post.date} 
                slug={post.slug} 
              />
            ))
          )}
        </main>
      </div>
    </>
  );
}