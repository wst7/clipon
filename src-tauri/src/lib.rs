// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::Manager;

// 剪切板条目数据结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipboardItem {
    pub id: String,
    pub content: String,
    #[serde(rename = "type")]
    pub item_type: String,
    #[serde(rename = "createdAt")]
    pub created_at: i64,
    #[serde(rename = "updatedAt")]
    pub updated_at: i64,
    #[serde(rename = "isPinned")]
    pub is_pinned: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tags: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source: Option<String>,
}

// 应用状态
pub struct AppState {
    pub clipboard_items: Mutex<Vec<ClipboardItem>>,
    pub data_dir: Mutex<PathBuf>,
}

// 获取数据目录
fn get_data_dir(app_handle: &tauri::AppHandle) -> PathBuf {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .expect("Failed to get app data dir");

    // 确保目录存在
    if !app_dir.exists() {
        fs::create_dir_all(&app_dir).expect("Failed to create app data dir");
    }

    app_dir
}

// 获取数据文件路径
fn get_data_file_path(data_dir: &PathBuf) -> PathBuf {
    data_dir.join("clipboard_data.json")
}

// 加载数据
fn load_clipboard_data(data_dir: &PathBuf) -> Vec<ClipboardItem> {
    let data_file = get_data_file_path(data_dir);

    if !data_file.exists() {
        return Vec::new();
    }

    match fs::read_to_string(&data_file) {
        Ok(content) => {
            match serde_json::from_str::<Vec<ClipboardItem>>(&content) {
                Ok(items) => items,
                Err(e) => {
                    eprintln!("Failed to parse clipboard data: {}", e);
                    Vec::new()
                }
            }
        }
        Err(e) => {
            eprintln!("Failed to read clipboard data file: {}", e);
            Vec::new()
        }
    }
}

// 保存数据
fn save_clipboard_data(data_dir: &PathBuf, items: &[ClipboardItem]) -> Result<(), String> {
    let data_file = get_data_file_path(data_dir);

    let json = match serde_json::to_string_pretty(items) {
        Ok(json) => json,
        Err(e) => return Err(format!("Failed to serialize data: {}", e)),
    };

    match fs::write(&data_file, json) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to write data file: {}", e)),
    }
}

// 命令：获取所有剪切板项目
#[tauri::command]
fn get_clipboard_items(state: tauri::State<AppState>) -> Result<Vec<ClipboardItem>, String> {
    let items = state.clipboard_items.lock().map_err(|e| e.to_string())?;
    Ok(items.clone())
}

// 命令：添加剪切板项目
#[tauri::command]
fn add_clipboard_item(
    item: ClipboardItem,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    let mut items = state.clipboard_items.lock().map_err(|e| e.to_string())?;

    // 检查是否已存在相同内容的条目（去重）
    let is_duplicate = items.iter().any(|existing| {
        existing.content == item.content && existing.item_type == item.item_type
    });

    if !is_duplicate {
        items.insert(0, item);

        let data_dir = state.data_dir.lock().map_err(|e| e.to_string())?;
        save_clipboard_data(&data_dir, &items)?;
    }

    Ok(())
}

// 命令：删除剪切板项目
#[tauri::command]
fn delete_clipboard_item(id: String, state: tauri::State<AppState>) -> Result<(), String> {
    let mut items = state.clipboard_items.lock().map_err(|e| e.to_string())?;
    items.retain(|item| item.id != id);

    let data_dir = state.data_dir.lock().map_err(|e| e.to_string())?;
    save_clipboard_data(&data_dir, &items)?;

    Ok(())
}

// 命令：更新剪切板项目
#[tauri::command]
fn update_clipboard_item(
    item: ClipboardItem,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    let mut items = state.clipboard_items.lock().map_err(|e| e.to_string())?;

    if let Some(index) = items.iter().position(|i| i.id == item.id) {
        items[index] = item;

        let data_dir = state.data_dir.lock().map_err(|e| e.to_string())?;
        save_clipboard_data(&data_dir, &items)?;
    }

    Ok(())
}

// 命令：清空所有剪切板项目
#[tauri::command]
fn clear_clipboard_items(state: tauri::State<AppState>) -> Result<(), String> {
    let mut items = state.clipboard_items.lock().map_err(|e| e.to_string())?;
    items.clear();

    let data_dir = state.data_dir.lock().map_err(|e| e.to_string())?;
    save_clipboard_data(&data_dir, &items)?;

    Ok(())
}

// 命令：导入剪切板项目
#[tauri::command]
fn import_clipboard_items(
    items: Vec<ClipboardItem>,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    let mut existing_items = state.clipboard_items.lock().map_err(|e| e.to_string())?;

    // 合并项目，去重
    for item in items {
        if !existing_items.iter().any(|i| i.id == item.id) {
            existing_items.push(item);
        }
    }

    // 按时间排序
    existing_items.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    let data_dir = state.data_dir.lock().map_err(|e| e.to_string())?;
    save_clipboard_data(&data_dir, &existing_items)?;

    Ok(())
}

// Tauri 应用入口
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .setup(|app| {
            let data_dir = get_data_dir(&app.handle());
            let clipboard_items = load_clipboard_data(&data_dir);

            app.manage(AppState {
                clipboard_items: Mutex::new(clipboard_items),
                data_dir: Mutex::new(data_dir),
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_clipboard_items,
            add_clipboard_item,
            delete_clipboard_item,
            update_clipboard_item,
            clear_clipboard_items,
            import_clipboard_items,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
