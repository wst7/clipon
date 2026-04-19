import { ClipboardItemCard } from "./ClipboardItem";
import type { ClipboardItem } from "@/types/clipboard";
import { Clipboard } from "lucide-react";

interface ClipboardListProps {
  pinnedItems: ClipboardItem[];
  unpinnedItems: ClipboardItem[];
  compact?: boolean;
  onCopy: (content: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
}

export function ClipboardList({
  pinnedItems,
  unpinnedItems,
  compact = false,
  onCopy,
  onDelete,
  onTogglePin,
}: ClipboardListProps) {
  const hasPinned = pinnedItems.length > 0;
  const hasUnpinned = unpinnedItems.length > 0;
  const isEmpty = !hasPinned && !hasUnpinned;

  if (isEmpty) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-2 text-center text-gray-500">
          <Clipboard size={18} />
          <span>暂无记录</span>
          <span className="text-xs">复制内容后会显示在这里</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {hasPinned && (
        <section className="mb-4">
          {!compact && (
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide px-1 mb-2">置顶</h3>
          )}
          <div className="flex flex-col gap-2">
            {pinnedItems.map((item) => (
              <ClipboardItemCard
                key={item.id}
                item={item}
                compact={compact}
                onCopy={onCopy}
                onDelete={onDelete}
                onTogglePin={onTogglePin}
              />
            ))}
          </div>
        </section>
      )}

      {hasUnpinned && (
        <section>
          {hasPinned && !compact && (
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide px-1 mb-2">最近</h3>
          )}
          <div className="flex flex-col gap-2">
            {unpinnedItems.map((item) => (
              <ClipboardItemCard
                key={item.id}
                item={item}
                compact={compact}
                onCopy={onCopy}
                onDelete={onDelete}
                onTogglePin={onTogglePin}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}