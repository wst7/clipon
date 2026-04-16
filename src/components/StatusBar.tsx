import './StatusBar.css';

interface StatusBarProps {
  itemCount: number;
  selectedCount: number;
  filterText?: string;
}

export function StatusBar({ itemCount, selectedCount, filterText }: StatusBarProps) {
  return (
    <footer className="status-bar">
      <div className="status-left">
        <span className="status-item">
          <span className="status-icon">📋</span>
          <span>共 {itemCount} 条记录</span>
        </span>
        {selectedCount > 0 && (
          <span className="status-item selected">
            <span className="status-icon">☑️</span>
            <span>已选择 {selectedCount} 条</span>
          </span>
        )}
        {filterText && (
          <span className="status-item filtered">
            <span className="status-icon">🔍</span>
            <span>搜索: "{filterText}"</span>
          </span>
        )}
      </div>

      <div className="status-right">
        <span className="status-item">
          <span className="status-icon">💡</span>
          <span className="hint-text">点击内容复制到剪切板</span>
        </span>
      </div>
    </footer>
  );
}
