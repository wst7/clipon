import { useEffect, useCallback } from 'react';
import { useClipboardStore } from './store/clipboardStore';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { ClipboardList } from './components/ClipboardList';
import { Toolbar } from './components/Toolbar';
import { StatusBar } from './components/StatusBar';
import './App.css';

function App() {
  const {
    items,
    filter,
    selectedIds,
    isLoading,
    error,
    settings,
    filteredItems,
    addItem,
    deleteItem,
    deleteSelected,
    clearAll,
    togglePin,
    toggleSelect,
    selectAll,
    deselectAll,
    setFilter,
    setSearch,
    exportData,
    importData,
    updateSettings,
    syncFromBackend,
  } = useClipboardStore();

  // 初始化时从后端同步数据
  useEffect(() => {
    syncFromBackend();
  }, [syncFromBackend]);

  // 监听系统剪切板变化（通过 Tauri 事件）
  useEffect(() => {
    // 这里可以添加监听系统剪切板的逻辑
    // 通过 Tauri 的剪贴板插件监听变化
  }, [addItem]);

  // 过滤后的项目
  const displayItems = filteredItems();
  const pinnedItems = displayItems.filter(item => item.isPinned);
  const unpinnedItems = displayItems.filter(item => !item.isPinned);

  // 处理导入
  const handleImport = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        await importData(text);
      }
    };
    input.click();
  }, [importData]);

  // 处理导出
  const handleExport = useCallback(async () => {
    const data = await exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clipboard-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportData]);

  return (
    <div className="app">
      <Header
        settings={settings}
        onSettingsChange={updateSettings}
      />

      <SearchBar
        search={filter.search || ''}
        onSearchChange={setSearch}
        filter={filter}
        onFilterChange={setFilter}
      />

      <Toolbar
        selectedCount={selectedIds.size}
        totalCount={items.length}
        filteredCount={displayItems.length}
        onSelectAll={selectAll}
        onDeselectAll={deselectAll}
        onDeleteSelected={deleteSelected}
        onClearAll={clearAll}
        onImport={handleImport}
        onExport={handleExport}
      />

      {isLoading && (
        <div className="loading-overlay">
          <span className="loading-spinner"></span>
          <span>加载中...</span>
        </div>
      )}

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button onClick={() => useClipboardStore.setState({ error: null })}>
            关闭
          </button>
        </div>
      )}

      <ClipboardList
        pinnedItems={pinnedItems}
        unpinnedItems={unpinnedItems}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onDelete={deleteItem}
        onTogglePin={togglePin}
      />

      <StatusBar
        itemCount={items.length}
        selectedCount={selectedIds.size}
        filterText={filter.search}
      />
    </div>
  );
}

export default App;
