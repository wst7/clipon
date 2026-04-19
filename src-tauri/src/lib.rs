pub mod clipboard;
pub mod commands;
pub mod models;
pub mod storage;
pub mod tray;

use models::AppState;
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--autostart"]),
        ))
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let data_dir = storage::get_data_dir(&app.handle());
            let clipboard_items = storage::load_clipboard_data(&data_dir);
            let settings = storage::load_settings(&data_dir);

            app.manage(AppState {
                clipboard_items: std::sync::Mutex::new(clipboard_items),
                data_dir: std::sync::Mutex::new(data_dir),
                settings: std::sync::Mutex::new(settings),
            });

            // 设置托盘
            tray::setup_tray(app)?;

            // 设置窗口关闭事件
            if let Some(main_window) = app.get_webview_window("main") {
                tray::setup_window_close_handler(&main_window);
            }

            // 启动剪切板监听
            clipboard::start_clipboard_monitor(app.handle().clone());

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_clipboard_items,
            commands::add_clipboard_item,
            commands::delete_clipboard_item,
            commands::update_clipboard_item,
            commands::clear_clipboard_items,
            commands::import_clipboard_items,
            commands::get_settings,
            commands::save_settings,
            commands::get_history_items,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
