// app/routes/home.tsx
import { PostCard } from "../components/PostCard";
import { CommandPalette } from "../components/CommandPalette";

export default function Home() {
  return (
    <>
      {/* 隐形的全局交互中枢 */}
      <CommandPalette />

      <div className="app-container">
        <header className="header-area">
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>无名之境</h1>
          {/* 按钮已经被彻底抹除了，UI 重回纯净 */}
        </header>

        <main className="post-list">
          <PostCard 
            title="系统架构：从混沌到解耦" 
            date="2026-10-08" 
            slug="architecture-essence" 
          />
          <PostCard 
            title="端到端加密：云端的绝对零知识" 
            date="2026-09-15" 
            slug="e2ee-zero-knowledge" 
          />
          <PostCard 
            title="自定义 JSON AST：抛弃富文本解析器" 
            date="2026-08-20" 
            slug="custom-json-ast" 
          />
        </main>
      </div>
    </>
  );
}