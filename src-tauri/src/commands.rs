use crate::models::{AppState, ClipboardItem, Settings};
use crate::storage;

#[tauri::command]
pub fn get_clipboard_items(state: tauri::State<AppState>) -> Result<Vec<ClipboardItem>, String> {
    let items = state.clipboard_items.lock().map_err(|e| e.to_string())?;
    Ok(items.clone())
}

#[tauri::command]
pub fn add_clipboard_item(
    item: ClipboardItem,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    let settings = state.settings.lock().map_err(|e| e.to_string())?;
    let max_items = settings.max_items;
    drop(settings);

    let mut items = state.clipboard_items.lock().map_err(|e| e.to_string())?;

    let is_duplicate = items
        .iter()
        .any(|existing| existing.content == item.content && existing.item_type == item.item_type);

    if !is_duplicate {
        items.insert(0, item.clone());

        let max_items = max_items as usize;
        if items.len() > max_items {
            let pinned: Vec<_> = items.iter().filter(|i| i.is_pinned).cloned().collect();
            let mut non_pinned: Vec<_> = items.iter().filter(|i| !i.is_pinned).cloned().collect();

            non_pinned.sort_by(|a, b| b.created_at.cmp(&a.created_at));
            non_pinned.truncate(max_items.saturating_sub(pinned.len()));

            items.clear();
            items.extend(pinned);
            items.extend(non_pinned);
        }

        let data_dir = state.data_dir.lock().map_err(|e| e.to_string())?;
        storage::save_clipboard_data(&data_dir, &items)?;
    }

    Ok(())
}

#[tauri::command]
pub fn delete_clipboard_item(
    id: String,
    state: tauri::State<AppState>,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let mut items = state.clipboard_items.lock().map_err(|e| e.to_string())?;
    items.retain(|item| item.id != id);

    let data_dir = state.data_dir.lock().map_err(|e| e.to_string())?;
    storage::save_clipboard_data(&data_dir, &items)?;
    drop(items);
    drop(data_dir);
    crate::tray::tray_menu_display(&app_handle);

    Ok(())
}

#[tauri::command]
pub fn update_clipboard_item(
    item: ClipboardItem,
    state: tauri::State<AppState>,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let mut items = state.clipboard_items.lock().map_err(|e| e.to_string())?;

    if let Some(index) = items.iter().position(|i| i.id == item.id) {
        items[index] = item.clone();

        let data_dir = state.data_dir.lock().map_err(|e| e.to_string())?;
        storage::save_clipboard_data(&data_dir, &items)?;
        drop(items);
        drop(data_dir);
        crate::tray::tray_menu_display(&app_handle);
    }

    Ok(())
}

#[tauri::command]
pub fn clear_clipboard_items(state: tauri::State<AppState>) -> Result<(), String> {
    let mut items = state.clipboard_items.lock().map_err(|e| e.to_string())?;
    items.clear();

    let data_dir = state.data_dir.lock().map_err(|e| e.to_string())?;
    storage::save_clipboard_data(&data_dir, &items)?;

    Ok(())
}

#[tauri::command]
pub fn import_clipboard_items(
    items: Vec<ClipboardItem>,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    let mut existing_items = state.clipboard_items.lock().map_err(|e| e.to_string())?;

    for item in items {
        if !existing_items.iter().any(|i| i.id == item.id) {
            existing_items.push(item);
        }
    }

    existing_items.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    let data_dir = state.data_dir.lock().map_err(|e| e.to_string())?;
    storage::save_clipboard_data(&data_dir, &existing_items)?;

    Ok(())
}

#[tauri::command]
pub fn get_settings(state: tauri::State<AppState>) -> Result<Settings, String> {
    let settings = state.settings.lock().map_err(|e| e.to_string())?;
    Ok(settings.clone())
}

#[tauri::command]
pub fn save_settings(
    settings: Settings,
    state: tauri::State<AppState>,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let mut current_settings = state.settings.lock().map_err(|e| e.to_string())?;

    // 处理自启动
    use tauri_plugin_autostart::ManagerExt;
    let autostart = app_handle.autolaunch();
    if settings.autostart {
        let _ = autostart.enable();
    } else {
        let _ = autostart.disable();
    }

    *current_settings = settings.clone();

    let data_dir = state.data_dir.lock().map_err(|e| e.to_string())?;
    storage::save_settings_to_file(&data_dir, &settings)?;

    Ok(())
}

#[tauri::command]
pub fn get_history_items(state: tauri::State<AppState>) -> Result<Vec<ClipboardItem>, String> {
    let settings = state.settings.lock().map_err(|e| e.to_string())?;
    let max_items = settings.max_items as usize;
    drop(settings);

    let items = state.clipboard_items.lock().map_err(|e| e.to_string())?;
    let mut sorted_items = items.clone();
    sorted_items.sort_by(|a, b| {
        if a.is_pinned != b.is_pinned {
            b.is_pinned.cmp(&a.is_pinned)
        } else {
            b.created_at.cmp(&a.created_at)
        }
    });
    Ok(sorted_items.into_iter().take(max_items).collect())
}
