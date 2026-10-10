// app/components/Feedback.tsx
import { useEffect, useState } from 'react';

interface LogMessage {
  id: number;
  message: string;
  type: "info" | "warning" | "error";
}

export function GlobalFeedback() {
  const [logs, setLogs] = useState<LogMessage[]>([]);

  useEffect(() => {
    const handleFeedback = (e: any) => {
      const { message, type } = e.detail;
      const newLog = { id: Date.now(), message, type };
      
      // 添加新日志，并最多保留 3 条
      setLogs(prev => [...prev, newLog].slice(-3));

      // 3秒后自动清除
      setTimeout(() => {
        setLogs(prev => prev.filter(log => log.id !== newLog.id));
      }, 3000);
    };

    window.addEventListener('geek-feedback-ui', handleFeedback);
    return () => window.removeEventListener('geek-feedback-ui', handleFeedback);
  }, []);

  if (logs.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: '10px'
    }}>
      {logs.map(log => (
        <div key={log.id} style={{
          padding: '12px 20px', borderRadius: '8px', color: '#fff', fontSize: '14px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          background: log.type === 'error' ? '#ef4444' : log.type === 'warning' ? '#f59e0b' : '#3b82f6',
          animation: 'fade-in 0.3s ease-out'
        }}>
          {log.message}
        </div>
      ))}
    </div>
  );
}