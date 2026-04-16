import type { ClipboardItem } from '../types/clipboard';
import './ClipboardList.css';

interface ClipboardListProps {
  pinnedItems: ClipboardItem[];
  unpinnedItems: ClipboardItem[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // 今天
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }

  // 昨天
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }

  // 本周
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[date.getDay()];
  }

  // 更久以前
  return date.toLocaleDateString('zh-CN');
}

function truncateContent(content: string, maxLength: number = 200): string {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '...';
}

function ClipboardItemCard({
  item,
  isSelected,
  onToggleSelect,
  onDelete,
  onTogglePin,
}: {
  item: ClipboardItem;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
}) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(item.content);
      // 可以添加复制成功的提示
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  return (
    <div
      className={`clipboard-item ${isSelected ? 'selected' : ''} ${item.isPinned ? 'pinned' : ''}`}
    >
      <div className="item-checkbox">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(item.id)}
        />
      </div>

      <div className="item-content" onClick={handleCopy}>
        <div className="item-type">
          {item.type === 'text' && '📝'}
          {item.type === 'image' && '🖼️'}
          {item.type === 'file' && '📎'}
        </div>
        <div className="item-text">
          {item.type === 'text' ? (
            <pre>{truncateContent(item.content)}</pre>
          ) : (
            <span className="file-name">{item.content}</span>
          )}
        </div>
      </div>

      <div className="item-meta">
        <span className="item-date">{formatDate(item.createdAt)}</span>
        {item.source && (
          <span className="item-source" title={item.source}>
            📍
          </span>
        )}
      </div>

      <div className="item-actions">
        <button
          className={`action-btn pin-btn ${item.isPinned ? 'active' : ''}`}
          onClick={() => onTogglePin(item.id)}
          title={item.isPinned ? '取消置顶' : '置顶'}
        >
          {item.isPinned ? '📌' : '📍'}
        </button>
        <button
          className="action-btn copy-btn"
          onClick={handleCopy}
          title="复制"
        >
          📋
        </button>
        <button
          className="action-btn delete-btn"
          onClick={() => onDelete(item.id)}
          title="删除"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

export function ClipboardList({
  pinnedItems,
  unpinnedItems,
  selectedIds,
  onToggleSelect,
  onDelete,
  onTogglePin,
}: ClipboardListProps) {
  const hasPinned = pinnedItems.length > 0;
  const hasUnpinned = unpinnedItems.length > 0;

  return (
    <div className="clipboard-list">
      {hasPinned && (
        <div className="list-section pinned-section">
          <h3 className="section-title">
            <span>📌</span>
            置顶项目
            <span className="item-count">({pinnedItems.length})</span>
          </h3>
          <div className="items-container">
            {pinnedItems.map(item => (
              <ClipboardItemCard
                key={item.id}
                item={item}
                isSelected={selectedIds.has(item.id)}
                onToggleSelect={onToggleSelect}
                onDelete={onDelete}
                onTogglePin={onTogglePin}
              />
            ))}
          </div>
        </div>
      )}

      {hasUnpinned && (
        <div className="list-section unpinned-section">
          {hasPinned && (
            <h3 className="section-title">
              <span>📝</span>
              历史记录
              <span className="item-count">({unpinnedItems.length})</span>
            </h3>
          )}
          <div className="items-container">
            {unpinnedItems.map(item => (
              <ClipboardItemCard
                key={item.id}
                item={item}
                isSelected={selectedIds.has(item.id)}
                onToggleSelect={onToggleSelect}
                onDelete={onDelete}
                onTogglePin={onTogglePin}
              />
            ))}
          </div>
        </div>
      )}

      {!hasPinned && !hasUnpinned && (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>剪切板是空的</h3>
          <p>复制一些内容，它们会显示在这里</p>
        </div>
      )}
    </div>
  );
}
