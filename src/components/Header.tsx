import { useState } from 'react';
import type { AppSettings } from '../types/clipboard';
import './Header.css';

interface HeaderProps {
  settings: AppSettings;
  onSettingsChange: (settings: Partial<AppSettings>) => void;
}

export function Header({ settings, onSettingsChange }: HeaderProps) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <header className="header">
      <div className="header-logo">
        <span className="logo-icon">📋</span>
        <h1>ClipOn</h1>
      </div>

      <div className="header-actions">
        <button
          className="icon-button"
          onClick={() => setShowSettings(!showSettings)}
          title="设置"
        >
          ⚙️
        </button>
      </div>

      {showSettings && (
        <div className="settings-panel">
          <h3>设置</h3>

          <div className="setting-item">
            <label>最大历史记录数</label>
            <input
              type="number"
              min={100}
              max={10000}
              value={settings.maxHistoryItems}
              onChange={(e) =>
                onSettingsChange({ maxHistoryItems: parseInt(e.target.value) })
              }
            />
          </div>

          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.autoCleanup}
                onChange={(e) =>
                  onSettingsChange({ autoCleanup: e.target.checked })
                }
              />
              自动清理旧记录
            </label>
          </div>

          {settings.autoCleanup && (
            <div className="setting-item">
              <label>清理天数</label>
              <input
                type="number"
                min={1}
                max={365}
                value={settings.cleanupDays}
                onChange={(e) =>
                  onSettingsChange({ cleanupDays: parseInt(e.target.value) })
                }
              />
            </div>
          )}

          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.showNotifications}
                onChange={(e) =>
                  onSettingsChange({ showNotifications: e.target.checked })
                }
              />
              显示通知
            </label>
          </div>

          <div className="setting-item">
            <label>主题</label>
            <select
              value={settings.theme}
              onChange={(e) =>
                onSettingsChange({ theme: e.target.value as 'light' | 'dark' | 'system' })
              }
            >
              <option value="system">跟随系统</option>
              <option value="light">浅色</option>
              <option value="dark">深色</option>
            </select>
          </div>

          <div className="settings-actions">
            <button onClick={() => setShowSettings(false)}>关闭</button>
          </div>
        </div>
      )}
    </header>
  );
}
