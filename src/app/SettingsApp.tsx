import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Label, ListBox, Select, Switch } from "@heroui/react";
import { RefreshCw } from "lucide-react";

interface UpdateInfo {
  has_update: boolean;
  current_version: string;
  latest_version: string;
  download_url: string;
  release_notes: string | null;
}

interface Settings {
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

export function SettingsApp() {
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState<Settings>({
    language: "zh-CN",
    theme: "system",
    autostart: false,
    max_items: 20,
  });
  const [loading, setLoading] = useState(true);
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
      const data = await invoke<Settings>("get_settings");
      console.log("后端返回的设置数据:", data);
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
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: Settings) => {
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
    <div className="flex flex-col h-screen bg-background text-foreground">
      <div className="px-6 py-4 bg-muted border-b border-border">
        <h1 className="text-xl font-semibold">{t('settings')}</h1>
        <p className="text-sm text-muted-foreground">{t('customize')}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="grid gap-1.5">
          <Label>{t('language')}</Label>
          <Select
            selectedKey={settings.language}
            onSelectionChange={handleLanguageChange}
            isDisabled={loading}
            placeholder={t('selectLanguage')}
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
            isDisabled={loading}
            placeholder={t('selectTheme')}
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
            isDisabled={loading}
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
            disabled={loading}
            className="w-40 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="grid gap-1.5">
          <Label>{t('checkUpdate')}</Label>
          {!updateInfo ? (
            <button
              onClick={checkForUpdate}
              disabled={checkingUpdate}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 text-sm w-fit"
            >
              <RefreshCw className={`w-4 h-4 ${checkingUpdate ? "animate-spin" : ""}`} />
              {checkingUpdate ? t('checking') : t('checkUpdate')}
            </button>
          ) : (
            <div className="space-y-2">
              <div className="text-sm">
                {t('currentVersion')}: <span className="font-medium">{updateInfo.current_version}</span>
              </div>
              {updateInfo.has_update ? (
                <>
                  <div className="text-sm text-green-600">
                    {t('newVersion')}: <span className="font-medium">{updateInfo.latest_version}</span>
                  </div>
                  <button
                    onClick={handleUpdate}
                    className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
                  >
                    {t('download')}
                  </button>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">{t('upToDate')}</div>
              )}
              <button
                onClick={() => setUpdateInfo(null)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {t('recheck')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}