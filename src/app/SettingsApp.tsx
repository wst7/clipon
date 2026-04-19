import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface Settings {
  language: string;
  theme: string;
  autostart: boolean;
  maxItems: number;
}

export function SettingsApp() {
  const [settings, setSettings] = useState<Settings>({
    language: "zh-CN",
    theme: "light",
    autostart: false,
    maxItems: 20,
  });
  const [loading, setLoading] = useState(true);

  const applyTheme = (theme: string) => {
    const isDark =
      theme === "dark" ||
      (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (settings.theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => {
        if (e.matches) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      };
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [settings.theme]);

  const loadSettings = async () => {
    try {
      const data = await invoke<Settings>("get_settings");
      console.log("loaded settings:", JSON.stringify(data));
      setSettings(data);
      applyTheme(data.theme);
    } catch (error) {
      console.error("加载设置失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: Settings) => {
    try {
      await invoke("save_settings", { settings: newSettings });
      applyTheme(newSettings.theme);
    } catch (error) {
      console.error("保存设置失败:", error);
    }
  };

  const handleLanguageChange = (language: string) => {
    const newSettings = { ...settings, language };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleThemeChange = (theme: string) => {
    const newSettings = { ...settings, theme };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleAutostartChange = (autostart: boolean) => {
    saveSettings({ ...settings, autostart });
  };

  const handleMaxItemsChange = (maxItems: number) => {
    saveSettings({ ...settings, maxItems });
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <div className="px-6 py-4 bg-muted border-b border-border">
        <h1 className="text-xl font-semibold">设置</h1>
        <p className="text-sm text-muted-foreground">个性化应用行为</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">语言</h3>
          </div>
          {loading ? (
            <div className="w-48 h-8 bg-muted animate-pulse rounded-md" />
          ) : (
            <Select value={settings.language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="选择语言" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zh-CN">简体中文</SelectItem>
                <SelectItem value="en-US">English</SelectItem>
              </SelectContent>
            </Select>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">主题</h3>
          </div>
          {loading ? (
            <div className="w-48 h-8 bg-muted animate-pulse rounded-md" />
          ) : (
            <Select value={settings.theme} onValueChange={handleThemeChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="选择主题" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">跟随系统</SelectItem>
                <SelectItem value="light">浅色</SelectItem>
                <SelectItem value="dark">深色</SelectItem>
              </SelectContent>
            </Select>
          )}
        </section>

        <section className="flex items-center justify-between">
          <div className="text-sm font-medium">开机自启动</div>
          {loading ? (
            <div className="w-10 h-5 bg-muted animate-pulse rounded-md" />
          ) : (
            <Switch
              checked={settings.autostart}
              onCheckedChange={handleAutostartChange}
            />
          )}
        </section>

        <section className="flex items-center justify-between">
          <div className="text-sm font-medium">保存的最大数量</div>
          {loading ? (
            <div className="w-40 h-9 bg-muted animate-pulse rounded-md" />
          ) : (
            <input
              type="number"
              min={1}
              max={500}
              value={settings.maxItems}
              onChange={(e) => handleMaxItemsChange(Math.max(1, Math.min(500, parseInt(e.target.value) || 20)))}
              className="w-40 px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          )}
        </section>
      </div>
    </div>
  );
}