/**
 * 剪切板条目类型
 */
export interface ClipboardItem {
  id: string;
  content: string;
  type: 'text' | 'image' | 'file';
  createdAt: number;
  updatedAt: number;
  isPinned: boolean;
  tags?: string[];
  source?: string;
}

/**
 * 剪切板过滤器
 */
export interface ClipboardFilter {
  search?: string;
  type?: 'text' | 'image' | 'file' | 'all';
  pinned?: boolean;
  startDate?: number;
  endDate?: number;
  tags?: string[];
}

/**
 * 导入/导出数据格式
 */
export interface ClipboardExportData {
  version: string;
  exportedAt: number;
  items: ClipboardItem[];
}

/**
 * 应用设置
 */
export interface AppSettings {
  maxHistoryItems: number;
  autoCleanup: boolean;
  cleanupDays: number;
  showNotifications: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
}
