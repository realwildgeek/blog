// app/components/CommandPalette.tsx
import { useEffect, useState } from "react";

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  // 监听全局快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 匹配 Cmd+K 或 Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault(); // 阻止浏览器默认的搜索栏跳转
        setIsOpen((prev) => !prev);
      }
      // 按 Esc 键关闭
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const setTheme = (theme: string) => {
    document.documentElement.setAttribute('data-theme', theme);
    setIsOpen(false); // 执行操作后自动隐藏
  };

  if (!isOpen) return null;

  return (
    <div className="cmd-overlay" onClick={() => setIsOpen(false)}>
      <div className="cmd-palette" onClick={(e) => e.stopPropagation()}>
        <input 
          autoFocus 
          className="cmd-input" 
          placeholder="搜索文章，或输入命令..." 
        />
        <ul className="cmd-list">
          <li className="cmd-item" onClick={() => setTheme('light')}>☀️ 切换至浅色模式</li>
          <li className="cmd-item" onClick={() => setTheme('dark')}>🌙 切换至深色模式</li>
          <li className="cmd-item" onClick={() => setTheme('reading')}>📖 切换至阅读模式</li>
          <li className="cmd-item" style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
            🔒 进入系统后台 (未连接)
          </li>
        </ul>
      </div>
    </div>
  );
}