use tauri::image::Image;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::Emitter;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

pub fn setup_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let app_handle = app.handle();

    // 创建托盘菜单
    let menu = build_tray_menu(app_handle)?;

    // 创建托盘图标
    let _tray = TrayIconBuilder::with_id("main")
        .icon(Image::from_bytes(include_bytes!("../icons/icon.png"))?)
        .menu(&menu)
        .tooltip("ClipOn - 剪贴板管理")
        .show_menu_on_left_click(true)
        .on_tray_icon_event(|tray, event| match event {
            TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } => {
                // 左键显示菜单
                tray_menu_display(tray.app_handle());
            }
            TrayIconEvent::DoubleClick { .. } => {
                // 双击：显示主窗口
                if let Some(window) = tray.app_handle().get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            _ => {}
        })
        .on_menu_event(|app_handle, event| {
            let id = event.id().as_ref();
            match id {
                "show" => {
                    if let Some(window) = app_handle.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "settings" => {
                    open_settings_window(app_handle);
                }
                "clear" => {
                    clear_all_items(app_handle);
                }
                "quit" => {
                    std::process::exit(0);
                }
                id if id.starts_with("clip_") => {
                    let item_id = id.strip_prefix("clip_").unwrap_or("");
                    copy_item_to_clipboard(app_handle, item_id);
                }
                _ => {}
            }
        })
        .build(app.handle())?;

    app.manage(_tray);
    Ok(())
}

fn build_tray_menu(app_handle: &AppHandle) -> Result<Menu<tauri::Wry>, Box<dyn std::error::Error>> {
    let menu = Menu::new(app_handle)?;

    // 获取历史记录
    let state = app_handle.state::<crate::models::AppState>();
    let items = state.clipboard_items.lock().unwrap();

    // 排序：置顶在前，时间倒序
    let mut sorted_items: Vec<_> = items.clone();
    sorted_items.sort_by(|a, b| {
        if a.is_pinned != b.is_pinned {
            b.is_pinned.cmp(&a.is_pinned)
        } else {
            b.created_at.cmp(&a.created_at)
        }
    });

    // 取前20条
    let display_items: Vec<_> = sorted_items.into_iter().take(20).collect();

    // 添加历史记录标题（禁用）
    if !display_items.is_empty() {
        let history_title = MenuItem::with_id(
            app_handle,
            "history_title",
            "=== 历史记录 ===",
            false,
            None::<&str>,
        )?;
        menu.append(&history_title)?;

        // 动态添加历史记录项
        for item in &display_items {
            // 使用字符索引截断，避免中文字符被切断
            let chars: Vec<char> = item.content.chars().collect();
            let content_preview = if chars.len() > 35 {
                chars[..35].iter().collect::<String>() + "..."
            } else {
                item.content.clone()
            };

            // 替换换行符为空格
            let display_text = content_preview.replace('\n', " ").replace('\r', "");

            let menu_id = format!("clip_{}", item.id);

            let menu_text = if item.is_pinned {
                format!("📌 {}", display_text)
            } else {
                display_text
            };

            let menu_item =
                MenuItem::with_id(app_handle, &menu_id, &menu_text, true, None::<&str>)?;
            menu.append(&menu_item)?;
        }

        // 添加分隔线
        menu.append(&PredefinedMenuItem::separator(app_handle)?)?;
    } else {
        // 无历史记录
        let empty_item = MenuItem::with_id(app_handle, "empty", "无历史记录", false, None::<&str>)?;
        menu.append(&empty_item)?;
        menu.append(&PredefinedMenuItem::separator(app_handle)?)?;
    }

    // 主窗口
    let show_item = MenuItem::with_id(app_handle, "show", "显示主窗口", true, None::<&str>)?;
    menu.append(&show_item)?;

    // 设置
    let settings_item = MenuItem::with_id(app_handle, "settings", "设置", true, None::<&str>)?;
    menu.append(&settings_item)?;

    // 分隔线
    menu.append(&PredefinedMenuItem::separator(app_handle)?)?;

    // 清除
    let clear_item = MenuItem::with_id(app_handle, "clear", "清空历史", true, None::<&str>)?;
    menu.append(&clear_item)?;

    // 退出
    let quit_item = MenuItem::with_id(app_handle, "quit", "退出", true, None::<&str>)?;
    menu.append(&quit_item)?;

    Ok(menu)
}

pub fn tray_menu_display(app_handle: &AppHandle) {
    // 刷新托盘菜单显示
    if let Some(tray) = app_handle.tray_by_id("main") {
        if let Ok(menu) = build_tray_menu(app_handle) {
            let _ = tray.set_menu(Some(menu));
        }
    }
}

fn copy_item_to_clipboard(app_handle: &AppHandle, item_id: &str) {
    let state = app_handle.state::<crate::models::AppState>();
    let items = state.clipboard_items.lock().unwrap();

    let content = items
        .iter()
        .find(|i| i.id == item_id)
        .map(|i| i.content.clone());

    drop(items);

    if let Some(text) = content {
        if let Ok(mut clipboard) = arboard::Clipboard::new() {
            let _ = clipboard.set_text(&text);
        }
    }
}

fn open_settings_window(app_handle: &AppHandle) {
    // 检查设置窗口是否已存在
    if let Some(window) = app_handle.get_webview_window("settings") {
        let _ = window.show();
        let _ = window.set_focus();
        return;
    }

    // 创建设置窗口
    let _settings_window = WebviewWindowBuilder::new(
        app_handle,
        "settings",
        WebviewUrl::App("index.html?settings=true".into()),
    )
    .title("ClipOn - 设置")
    .inner_size(450.0, 750.0)
    .resizable(true)
    .center()
    .build();
}

fn clear_all_items(app_handle: &AppHandle) {
    let state = app_handle.state::<crate::models::AppState>();
    let mut items = state.clipboard_items.lock().unwrap();
    items.clear();

    // 保存到文件
    let data_dir = state.data_dir.lock().unwrap();
    let _ = crate::storage::save_clipboard_data(&data_dir, &items);

    // 刷新托盘菜单
    drop(items);
    drop(data_dir);
    tray_menu_display(app_handle);

    // 通知前端清空
    let _ = app_handle.emit("clipboard-cleared", ());

    send_notification(app_handle, "已清空历史记录");
}

fn send_notification(app_handle: &AppHandle, message: &str) {
    use tauri_plugin_notification::NotificationExt;
    let _ = app_handle
        .notification()
        .builder()
        .title("ClipOn")
        .body(message)
        .show();
}

pub fn setup_window_close_handler(window: &tauri::WebviewWindow) {
    let window_clone = window.clone();
    window.on_window_event(move |event| {
        if let tauri::WindowEvent::CloseRequested { api, .. } = event {
            api.prevent_close();
            let _ = window_clone.hide();
        }
    });
}
