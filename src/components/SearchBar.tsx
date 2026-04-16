import type { ClipboardFilter } from '../types/clipboard';
import './SearchBar.css';

interface SearchBarProps {
  search: string;
  onSearchChange: (search: string) => void;
  filter: ClipboardFilter;
  onFilterChange: (filter: Partial<ClipboardFilter>) => void;
}

export function SearchBar({
  search,
  onSearchChange,
  filter,
  onFilterChange,
}: SearchBarProps) {
  const handleClear = () => {
    onSearchChange('');
  };

  return (
    <div className="search-bar">
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="搜索剪切板内容..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {search && (
          <button className="clear-btn" onClick={handleClear} title="清除">
            ✕
          </button>
        )}
      </div>

      <div className="filter-group">
        <select
          value={filter.type || 'all'}
          onChange={(e) =>
            onFilterChange({
              type: e.target.value as 'text' | 'image' | 'file' | 'all',
            })
          }
          className="filter-select"
        >
          <option value="all">全部类型</option>
          <option value="text">📄 文本</option>
          <option value="image">🖼️ 图片</option>
          <option value="file">📎 文件</option>
        </select>

        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={filter.pinned || false}
            onChange={(e) => onFilterChange({ pinned: e.target.checked })}
          />
          <span>📌 仅置顶</span>
        </label>

        <select
          value={
            filter.startDate
              ? filter.startDate > Date.now() - 24 * 60 * 60 * 1000
                ? 'today'
                : 'week'
              : 'all'
          }
          onChange={(e) => {
            const value = e.target.value;
            if (value === 'all') {
              onFilterChange({ startDate: undefined, endDate: undefined });
            } else if (value === 'today') {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              onFilterChange({
                startDate: today.getTime(),
                endDate: Date.now(),
              });
            } else if (value === 'week') {
              const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
              onFilterChange({
                startDate: weekAgo,
                endDate: Date.now(),
              });
            }
          }}
          className="filter-select"
        >
          <option value="all">📅 全部时间</option>
          <option value="today">今天</option>
          <option value="week">最近7天</option>
        </select>
      </div>
    </div>
  );
}
