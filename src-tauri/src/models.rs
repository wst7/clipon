// 学习更多关于 Tauri 命令：https://tauri.app/develop/calling-rust/

use serde::{Deserialize, Serialize};

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
use std::path::PathBuf;
use std::sync::Mutex;

pub struct AppState {
    pub clipboard_items: Mutex<Vec<ClipboardItem>>,
    pub data_dir: Mutex<PathBuf>,
    pub settings: Mutex<Settings>,
}

// 设置数据结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub language: String,
    pub theme: String,
    pub autostart: bool,
    #[serde(rename = "maxItems")]
    pub max_items: u32,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            language: "zh-CN".to_string(),
            theme: "system".to_string(),
            autostart: false,
            max_items: 20,
        }
    }
}

impl ClipboardItem {
    pub fn new(content: String, item_type: &str) -> Self {
        let now = chrono::Utc::now().timestamp_millis();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            content,
            item_type: item_type.to_string(),
            created_at: now,
            updated_at: now,
            is_pinned: false,
            tags: None,
            source: None,
        }
    }
}
