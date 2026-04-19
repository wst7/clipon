import { useState, useCallback } from "react";
import { Pin, Copy, Trash2 } from "lucide-react";
import type { ClipboardItem } from "@/types/clipboard";

const ICON_SIZE = 14;

function truncate(text: string, len: number): string {
  return text.length > len ? text.slice(0, len) + "..." : text;
}

interface ClipboardItemCardProps {
  item: ClipboardItem;
  compact?: boolean;
  onCopy: (content: string) => Promise<boolean | void> | boolean | void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
}

export function ClipboardItemCard({
  item,
  compact = false,
  onCopy,
  onDelete,
  onTogglePin,
}: ClipboardItemCardProps) {
  const [showCopied, setShowCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const result = await onCopy(item.content);
    if (result !== false) {
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 1500);
    }
  }, [item.content, onCopy]);

  const handleDelete = useCallback(() => {
    onDelete(item.id);
  }, [item.id, onDelete]);

  const handleTogglePin = useCallback(() => {
    onTogglePin(item.id);
  }, [item.id, onTogglePin]);

  return (
    <div
      className={`group flex items-start gap-3 p-3 rounded-xl bg-card border border-border hover:border-ring hover:shadow-md transition-all cursor-pointer ${item.isPinned ? "ring-2 ring-primary/20" : ""}`}
      onClick={handleCopy}
      role="button"
      aria-label="点击复制"
    >
      {item.isPinned && (
        <span className="self-start mt-1.5 size-1.5 rounded-full bg-amber-500 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-1">
          {item.isPinned && <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">置顶</span>}
        </div>
        <div className="text-sm leading-tight line-clamp-2" title={item.content}>
          {compact ? truncate(item.content, 50) : truncate(item.content, 120)}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        {showCopied ? (
          <span className="text-xs text-green-600 font-medium">已复制</span>
        ) : (
          <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-muted" aria-label="复制">
            <Copy size={ICON_SIZE} className="text-muted-foreground" />
          </button>
        )}
        <button onClick={handleTogglePin} className="p-1.5 rounded-lg hover:bg-muted" aria-label="置顶/取消置顶">
          <Pin size={ICON_SIZE} className={item.isPinned ? "text-amber-500" : "text-muted-foreground"} />
        </button>
        <button onClick={handleDelete} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive" aria-label="删除">
          <Trash2 size={ICON_SIZE} />
        </button>
      </div>
    </div>
  );
}