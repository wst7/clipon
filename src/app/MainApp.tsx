/**
 * 主窗口应用 - 合并设置和剪贴板管理
 */
import { useEffect, useState } from "react";
import packageInfo from '../../package.json' with { type: 'json' };
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { SearchBar } from "@/components/SearchBar";
import { ClipboardList } from "@/components/ClipboardList";
import { useClipboard } from "@/hooks/useClipboard";
import { Tabs, Label, ListBox, Select, Switch } from "@heroui/react";
import { ClipboardList as ClipboardListIcon, Settings, Info, RefreshCw } from "lucide-react";

interface UpdateInfo {
  has_update: boolean;
  current_version: string;
  latest_version: string;
  download_url: string;
  release_notes: string | null;
}

interface SettingsData {
  language: string;
  theme: string;
  autostart: boolean;
  max_items: number;
}

const languages = [
  { id: "zh-CN", name: "简体中文" },
  { id: "en-US", name: "English" },
];

const themes = [
  { id: "system", name: "System" },
  { id: "light", name: "Light" },
  { id: "dark", name: "Dark" },
];

export function MainApp() {
  const { t, i18n } = useTranslation();
  const { displayedPinned, displayedUnpinned, isLoading, search, setSearch, copyToClipboard, deleteItem, togglePin } = useClipboard();

  const [activeTab, setActiveTab] = useState("clips");
  const [settings, setSettings] = useState<SettingsData>({
    language: "zh-CN",
    theme: "system",
    autostart: false,
    max_items: 20,
  });
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);

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
      const data = await invoke<SettingsData>("get_settings");
      setSettings({
        language: data.language || "zh-CN",
        theme: data.theme || "system",
        autostart: data.autostart ?? false,
        max_items: data.max_items ?? 20,
      });
      applyTheme(data.theme || "system");
      if (data.language) {
        i18n.changeLanguage(data.language === "zh-CN" ? "zh" : "en");
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoadingSettings(false);
    }
  };

  const saveSettings = async (newSettings: SettingsData) => {
    try {
      await invoke("save_settings", { settings: newSettings });
      applyTheme(newSettings.theme);
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

  const handleLanguageChange = (key: React.Key | null) => {
    if (!key) return;
    const language = key as string;
    const newSettings = { ...settings, language };
    setSettings(newSettings);
    i18n.changeLanguage(language === "zh-CN" ? "zh" : "en");
    saveSettings(newSettings);
  };

  const handleThemeChange = (key: React.Key | null) => {
    if (!key) return;
    const theme = key as string;
    const newSettings = { ...settings, theme };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleAutostartChange = (isSelected: boolean) => {
    saveSettings({ ...settings, autostart: isSelected });
  };

  const handleMaxItemsChange = (value: string) => {
    const max_items = Math.max(1, Math.min(500, parseInt(value) || 20));
    saveSettings({ ...settings, max_items });
  };

  const checkForUpdate = async () => {
    setCheckingUpdate(true);
    try {
      const info = await invoke<UpdateInfo>("check_update");
      setUpdateInfo(info);
    } catch (error) {
      console.error("Failed to check update:", error);
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleUpdate = () => {
    if (updateInfo?.download_url) {
      openUrl(updateInfo.download_url);
    }
  };

  const selectedLanguage = languages.find((l) => l.id === settings.language);
  const selectedTheme = themes.find((th) => th.id === settings.theme);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* 顶部 Tabs 导航 */}
      <div className="sticky top-0 z-20 border-b border-border bg-background">
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(String(key))}
          className="px-4"
          classNames={{
            tab: "text-foreground",
          }}
        >
          <Tabs.ListContainer>
            <Tabs.List aria-label="Navigation">
              <Tabs.Tab id="clips">
                <div className="flex items-center gap-2">
                  <ClipboardListIcon className="size-4" />
                  <span>{t('clips')}</span>
                </div>
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="settings">
                <div className="flex items-center gap-2">
                  <Settings className="size-4" />
                  <span>{t('settings')}</span>
                </div>
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="about">
                <div className="flex items-center gap-2">
                  <Info className="size-4" />
                  <span>{t('about')}</span>
                </div>
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
      </div>

      {/* 内容区域 */}
      <main className="flex-1 overflow-hidden">
        {/* Clips 标签页 */}
        {activeTab === "clips" && (
          <div className="h-full flex flex-col">
            <div className="px-4 py-3 border-b border-border bg-background">
              <SearchBar value={search} onChange={setSearch} placeholder={t('search')} />
            </div>
            <div className="flex-1 overflow-hidden">
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
            </div>
          </div>
        )}

        {/* 设置标签页 */}
        {activeTab === "settings" && (
          <div className="h-full overflow-y-auto p-4 space-y-6">
            <div className="grid gap-1.5">
              <Label>{t('language')}</Label>
              <Select
                selectedKey={settings.language}
                onSelectionChange={handleLanguageChange}
                isDisabled={loadingSettings}
              >
                <Select.Trigger>
                  <Select.Value>
                    {selectedLanguage?.name || t('selectLanguage')}
                  </Select.Value>
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {languages.map((lang) => (
                      <ListBox.Item key={lang.id} id={lang.id} textValue={lang.name}>
                        {lang.name}
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label>{t('theme')}</Label>
              <Select
                selectedKey={settings.theme}
                onSelectionChange={handleThemeChange}
                isDisabled={loadingSettings}
              >
                <Select.Trigger>
                  <Select.Value>
                    {selectedTheme?.name || t('selectTheme')}
                  </Select.Value>
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {themes.map((theme) => (
                      <ListBox.Item key={theme.id} id={theme.id} textValue={theme.name}>
                        {theme.name}
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>

            <div className="flex flex-row items-center justify-between">
              <Label>{t('autoStart')}</Label>
              <Switch
                isSelected={settings.autostart}
                onChange={handleAutostartChange}
                isDisabled={loadingSettings}
              >
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch>
            </div>

            <div className="flex flex-row items-center justify-between">
              <Label>{t('maxItems')}</Label>
              <input
                type="number"
                min={1}
                max={500}
                value={String(settings.max_items)}
                onChange={(e) => handleMaxItemsChange(e.target.value)}
                disabled={loadingSettings}
                className="w-40 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        )}

        {/* 关于标签页 */}
        {activeTab === "about" && (
          <div className="h-full overflow-y-auto">
            <div className="max-w-sm mx-auto p-6 space-y-8">
              {/* Logo & 标题 */}
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <ClipboardListIcon className="size-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">{t('appName')}</h2>
                <p className="text-muted-foreground mt-1">v{packageInfo.version}</p>
                <p className="text-sm text-muted-foreground mt-2">Lightweight clipboard manager</p>
              </div>

              {/* 版本检查 */}
              <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
                <h3 className="font-medium mb-3">{t('checkUpdate')}</h3>
                {!updateInfo ? (
                  <button
                    onClick={checkForUpdate}
                    disabled={checkingUpdate}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 text-sm w-full justify-center transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${checkingUpdate ? "animate-spin" : ""}`} />
                    {checkingUpdate ? t('checking') : t('checkUpdate')}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t('currentVersion')}</span>
                      <span className="font-medium">{updateInfo.current_version}</span>
                    </div>
                    {updateInfo.has_update ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-green-500">{t('newVersion')}</span>
                          <span className="font-medium text-green-500">{updateInfo.latest_version}</span>
                        </div>
                        <button
                          onClick={handleUpdate}
                          className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm transition-colors"
                        >
                          {t('download')}
                        </button>
                      </>
                    ) : (
                      <div className="text-center text-sm text-muted-foreground py-2">{t('upToDate')}</div>
                    )}
                    <button
                      onClick={() => setUpdateInfo(null)}
                      className="w-full text-sm text-muted-foreground hover:text-foreground py-1 transition-colors"
                    >
                      {t('recheck')}
                    </button>
                  </div>
                )}
              </div>

              {/* 版权 */}
              <div className="text-center text-xs text-muted-foreground pt-4">
                <p>© 2025 ClipOn. All rights reserved.</p>
              </div>
            </div>
          </div>
        )}
      </main>

    </div>
  );
}
