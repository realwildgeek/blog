// app/utils/feedback.ts

export const Feedback = {
  /**
   * 🟢 常规通道 (Routine)
   * 作用：抛出到 UI 层，通常用于全局 Toast 提示或者终端用户可见的警告。
   */
  ui: (message: string, type: "info" | "warning" | "error" = "info") => {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('geek-feedback-ui', { detail: { message, type } });
      window.dispatchEvent(event);
    }
  },

  /**
   * 🕵️ 临时/极客通道 (Temporary / Trace)
   * 作用：将任何脏数据、内存对象打印到 F12 控制台，并折叠起来，不影响主线程。
   * 极度适合排查 AST 结构问题。
   */
  trace: (action: string, payload: any) => {
    if (typeof window === 'undefined') return; // 确保只在浏览器端打印
    console.groupCollapsed(`🕵️ [Trace]: ${action}`);
    console.log("Time:", new Date().toLocaleTimeString());
    console.log("Payload:", payload);
    // 强制输出为纯 JSON 对象，防止引用类型在内存中被后续修改导致控制台显示不准
    console.log("Snapshot:", JSON.parse(JSON.stringify(payload || {}))); 
    console.groupEnd();
  }
};