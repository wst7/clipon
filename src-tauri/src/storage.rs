use crate::models::{ClipboardItem, Settings};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::Manager;

pub fn get_data_dir(app_handle: &tauri::AppHandle) -> PathBuf {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .expect("Failed to get app data dir");

    if !app_dir.exists() {
        fs::create_dir_all(&app_dir).expect("Failed to create app data dir");
    }

    app_dir
}

fn get_data_file_path(data_dir: &Path) -> PathBuf {
    data_dir.join("clipboard_data.json")
}

pub fn load_clipboard_data(data_dir: &Path) -> Vec<ClipboardItem> {
    let data_file = get_data_file_path(data_dir);

    if !data_file.exists() {
        return Vec::new();
    }

    match fs::read_to_string(&data_file) {
        Ok(content) => match serde_json::from_str::<Vec<ClipboardItem>>(&content) {
            Ok(items) => items,
            Err(e) => {
                eprintln!("Failed to parse clipboard data: {}", e);
                Vec::new()
            }
        },
        Err(e) => {
            eprintln!("Failed to read clipboard data file: {}", e);
            Vec::new()
        }
    }
}

pub fn save_clipboard_data(data_dir: &Path, items: &[ClipboardItem]) -> Result<(), String> {
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

fn get_settings_file_path(data_dir: &Path) -> PathBuf {
    data_dir.join("settings.json")
}

pub fn load_settings(data_dir: &Path) -> Settings {
    let settings_file = get_settings_file_path(data_dir);

    if !settings_file.exists() {
        return Settings::default();
    }

    match fs::read_to_string(&settings_file) {
        Ok(content) => match serde_json::from_str::<Settings>(&content) {
            Ok(settings) => settings,
            Err(e) => {
                eprintln!("Failed to parse settings: {}", e);
                Settings::default()
            }
        },
        Err(e) => {
            eprintln!("Failed to read settings file: {}", e);
            Settings::default()
        }
    }
}

pub fn save_settings_to_file(data_dir: &Path, settings: &Settings) -> Result<(), String> {
    let settings_file = get_settings_file_path(data_dir);

    let json = match serde_json::to_string_pretty(settings) {
        Ok(json) => json,
        Err(e) => return Err(format!("Failed to serialize settings: {}", e)),
    };

    match fs::write(&settings_file, json) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to write settings file: {}", e)),
    }
}
