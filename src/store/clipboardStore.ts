import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';
import type { ClipboardItem, ClipboardFilter, AppSettings } from '../types/clipboard';

interface ClipboardState {
  // 数据
  items: ClipboardItem[];
  filter: ClipboardFilter;
  selectedIds: Set<string>;
  settings: AppSettings;

  // UI 状态
  isLoading: boolean;
  error: string | null;

  // 派生数据
  filteredItems: () => ClipboardItem[];
  pinnedItems: () => ClipboardItem[];

  // 操作
  addItem: (content: string, type?: 'text' | 'image' | 'file') => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  deleteSelected: () => Promise<void>;
  clearAll: () => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  toggleSelect: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;

  // 过滤和搜索
  setFilter: (filter: Partial<ClipboardFilter>) => void;
  setSearch: (search: string) => void;

  // 导入导出
  exportData: () => Promise<string>;
  importData: (json: string) => Promise<void>;

  // 设置
  updateSettings: (settings: Partial<AppSettings>) => void;

  // 从后端同步
  syncFromBackend: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  maxHistoryItems: 1000,
  autoCleanup: true,
  cleanupDays: 30,
  showNotifications: true,
  theme: 'system',
  language: 'zh-CN',
};

export const useClipboardStore = create<ClipboardState>()(
  persist(
    (set, get) => ({
      items: [],
      filter: {},
      selectedIds: new Set(),
      settings: defaultSettings,
      isLoading: false,
      error: null,

      filteredItems: () => {
        const { items, filter } = get();
        return items.filter(item => {
          // 搜索过滤
          if (filter.search && filter.search.trim()) {
            const search = filter.search.toLowerCase();
            if (!item.content.toLowerCase().includes(search)) {
              return false;
            }
          }

          // 类型过滤
          if (filter.type && filter.type !== 'all') {
            if (item.type !== filter.type) {
              return false;
            }
          }

          // 置顶过滤
          if (filter.pinned !== undefined) {
            if (item.isPinned !== filter.pinned) {
              return false;
            }
          }

          // 日期范围过滤
          if (filter.startDate && item.createdAt < filter.startDate) {
            return false;
          }
          if (filter.endDate && item.createdAt > filter.endDate) {
            return false;
          }

          return true;
        });
      },

      pinnedItems: () => {
        const { items } = get();
        return items.filter(item => item.isPinned);
      },

      addItem: async (content: string, type: 'text' | 'image' | 'file' = 'text') => {
        set({ isLoading: true, error: null });
        try {
          const now = Date.now();
          const newItem: ClipboardItem = {
            id: crypto.randomUUID(),
            content,
            type,
            createdAt: now,
            updatedAt: now,
            isPinned: false,
          };

          // 调用后端保存到文件
          await invoke('add_clipboard_item', { item: newItem });

          // 更新本地状态
          set(state => ({
            items: [newItem, ...state.items],
            isLoading: false,
          }));
        } catch (err) {
          set({ error: String(err), isLoading: false });
        }
      },

      deleteItem: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          await invoke('delete_clipboard_item', { id });

          set(state => ({
            items: state.items.filter(item => item.id !== id),
            selectedIds: new Set([...state.selectedIds].filter(sid => sid !== id)),
            isLoading: false,
          }));
        } catch (err) {
          set({ error: String(err), isLoading: false });
        }
      },

      deleteSelected: async () => {
        const { selectedIds, deleteItem } = get();
        const promises = Array.from(selectedIds).map(id => deleteItem(id));
        await Promise.all(promises);
        set({ selectedIds: new Set() });
      },

      clearAll: async () => {
        set({ isLoading: true, error: null });
        try {
          await invoke('clear_clipboard_items');
          set({ items: [], selectedIds: new Set(), isLoading: false });
        } catch (err) {
          set({ error: String(err), isLoading: false });
        }
      },

      togglePin: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const { items } = get();
          const item = items.find(i => i.id === id);
          if (!item) throw new Error('Item not found');

          const updatedItem = { ...item, isPinned: !item.isPinned, updatedAt: Date.now() };
          await invoke('update_clipboard_item', { item: updatedItem });

          set(state => ({
            items: state.items.map(i => i.id === id ? updatedItem : i),
            isLoading: false,
          }));
        } catch (err) {
          set({ error: String(err), isLoading: false });
        }
      },

      toggleSelect: (id: string) => {
        set(state => {
          const newSet = new Set(state.selectedIds);
          if (newSet.has(id)) {
            newSet.delete(id);
          } else {
            newSet.add(id);
          }
          return { selectedIds: newSet };
        });
      },

      selectAll: () => {
        const filtered = get().filteredItems();
        set({ selectedIds: new Set(filtered.map(item => item.id)) });
      },

      deselectAll: () => {
        set({ selectedIds: new Set() });
      },

      setFilter: (filter: Partial<ClipboardFilter>) => {
        set(state => ({
          filter: { ...state.filter, ...filter },
        }));
      },

      setSearch: (search: string) => {
        set(state => ({
          filter: { ...state.filter, search },
        }));
      },

      exportData: async () => {
        const { items, settings } = get();
        const exportData = {
          version: '1.0.0',
          exportedAt: Date.now(),
          items,
          settings,
        };
        return JSON.stringify(exportData, null, 2);
      },

      importData: async (json: string) => {
        set({ isLoading: true, error: null });
        try {
          const data = JSON.parse(json);
          if (data.items && Array.isArray(data.items)) {
            await invoke('import_clipboard_items', { items: data.items });
            set(state => ({
              items: [...data.items, ...state.items],
              isLoading: false,
            }));
          }
        } catch (err) {
          set({ error: String(err), isLoading: false });
        }
      },

      updateSettings: (settings: Partial<AppSettings>) => {
        set(state => ({
          settings: { ...state.settings, ...settings },
        }));
      },

      syncFromBackend: async () => {
        set({ isLoading: true, error: null });
        try {
          const items: ClipboardItem[] = await invoke('get_clipboard_items');
          set({ items, isLoading: false });
        } catch (err) {
          set({ error: String(err), isLoading: false });
        }
      },
    }),
    {
      name: 'clipboard-store',
      partialize: (state) => ({
        settings: state.settings,
        filter: state.filter,
      }),
    }
  )
);
