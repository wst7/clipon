/**
 * 主窗口应用
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { SearchBar } from "@/components/SearchBar";
import { ClipboardList } from "@/components/ClipboardList";
import { StatusBar } from "@/components/StatusBar";
import { useClipboard } from "@/hooks/useClipboard";
import { Switch } from "@heroui/react";
import { Clipboard, Moon, Sun } from "lucide-react";

interface Settings {
  theme: string;
}

export function MainApp() {
  const { t } = useTranslation();
  const { filteredItems, displayedPinned, displayedUnpinned, isLoading, search, setSearch, copyToClipboard, deleteItem, togglePin } = useClipboard();

  const [isDark, setIsDark] = useState(false);

  const applyTheme = (theme: string) => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (theme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (isSystemDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    setIsDark(document.documentElement.classList.contains("dark"));
  };

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await invoke<Settings>("get_settings");
        applyTheme(settings.theme || "system");
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  useEffect(() => {
    const handleThemeChange = (e: MediaQueryListEvent) => {
      const currentTheme = localStorage.getItem("theme");
      if (currentTheme === "system") {
        if (e.matches) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
        setIsDark(e.matches);
      }
    };
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", handleThemeChange);
    return () => mediaQuery.removeEventListener("change", handleThemeChange);
  }, []);

  const toggleDarkMode = (isSelected: boolean) => {
    setIsDark(isSelected);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* 顶部品牌与暗黑模式切换 */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b border-border bg-background shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Clipboard className="size-5 text-primary" />
          <span className="text-lg">{t('appName')}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Switch
            isSelected={isDark}
            onChange={toggleDarkMode}
          >
            {({ isSelected }) => (
              <>
                <Switch.Control>
                  <Switch.Thumb>
                    <Switch.Icon>
                      {isSelected ? (
                        <Moon className="size-3" />
                      ) : (
                        <Sun className="size-3" />
                      )}
                    </Switch.Icon>
                  </Switch.Thumb>
                </Switch.Control>
              </>
            )}
          </Switch>
        </div>
      </header>

      {/* 搜索条 */}
      <div className="px-4 py-3 border-b border-border bg-background">
        <SearchBar value={search} onChange={setSearch} placeholder={t('search')} />
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
