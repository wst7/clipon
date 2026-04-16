import './Toolbar.css';

interface ToolbarProps {
  selectedCount: number;
  totalCount: number;
  filteredCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDeleteSelected: () => void;
  onClearAll: () => void;
  onImport: () => void;
  onExport: () => void;
}

export function Toolbar({
  selectedCount,
  totalCount,
  filteredCount,
  onSelectAll,
  onDeselectAll,
  onDeleteSelected,
  onClearAll,
  onImport,
  onExport,
}: ToolbarProps) {
  const hasSelection = selectedCount > 0;
  const hasItems = filteredCount > 0;

  return (
    <div className="toolbar">
      <div className="toolbar-section selection-section">
        {hasSelection ? (
          <>
            <span className="selection-info">
              已选择 <strong>{selectedCount}</strong> 项
            </span>
            <button
              className="toolbar-btn secondary"
              onClick={onDeselectAll}
              title="取消全选"
            >
              取消选择
            </button>
            <button
              className="toolbar-btn danger"
              onClick={onDeleteSelected}
              title="删除选中项"
            >
              🗑️ 删除选中
            </button>
          </>
        ) : (
          <>
            <button
              className="toolbar-btn secondary"
              onClick={onSelectAll}
              disabled={!hasItems}
              title="全选"
            >
              ☑️ 全选
            </button>
            <button
              className="toolbar-btn danger"
              onClick={onClearAll}
              disabled={!hasItems}
              title="清空所有"
            >
              🗑️ 清空
            </button>
          </>
        )}
      </div>

      <div className="toolbar-section data-section">
        <button
          className="toolbar-btn secondary"
          onClick={onImport}
          title="导入数据"
        >
          📥 导入
        </button>
        <button
          className="toolbar-btn secondary"
          onClick={onExport}
          disabled={totalCount === 0}
          title="导出数据"
        >
          📤 导出
        </button>
      </div>

      <div className="toolbar-section stats-section">
        <span className="stats-text">
          共 <strong>{totalCount}</strong> 条记录
          {filteredCount !== totalCount && (
            <span>（显示 {filteredCount} 条）</span>
          )}
        </span>
      </div>
    </div>
  );
}
