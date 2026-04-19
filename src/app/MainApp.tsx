/**
 * 主窗口应用 - 重构后的样式，遵循 shadcn/ui 风格，完整暗黑支持
 */
import { useEffect, useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import { ClipboardList } from "@/components/ClipboardList";
import { StatusBar } from "@/components/StatusBar";
import { useClipboard } from "@/hooks/useClipboard";
import { Switch } from "@/components/ui/switch";
import { Clipboard } from "lucide-react";

export function MainApp() {
  const { filteredItems, displayedPinned, displayedUnpinned, isLoading, search, setSearch, copyToClipboard, deleteItem, togglePin } = useClipboard();

  // 暗黑模式开关状态
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleDarkMode = (val: boolean) => {
    if (val) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    setIsDark(val);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* 顶部品牌与暗黑模式切换 */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b border-border bg-background shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Clipboard className="size-5 text-primary" />
          <span className="text-lg">ClipMinister</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="whitespace-nowrap">暗黑</span>
          <Switch checked={isDark} onCheckedChange={toggleDarkMode} />
        </div>
      </header>

      {/* 搜索条 */}
      <div className="px-4 py-3 border-b border-border bg-background">
        <SearchBar value={search} onChange={setSearch} placeholder="搜索..." />
      </div>

      {/* 内容区域 */}
      <main className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-5 h-5 border border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <ClipboardList
            pinnedItems={displayedPinned}
            unpinnedItems={displayedUnpinned}
            onCopy={copyToClipboard}
            onDelete={deleteItem}
            onTogglePin={togglePin}
          />
        )}
      </main>

      {/* 底部状态栏 */}
      <StatusBar itemCount={filteredItems.length} />
    </div>
  );
}
