/**
 * 剪切板类型定义
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

export interface ClipboardFilter {
  search?: string;
  type?: 'text' | 'image' | 'file' | 'all';
}