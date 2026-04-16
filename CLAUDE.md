# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于 Tauri 2 的跨平台**剪贴板管理工具**，采用前后端分离架构：
- **前端**: React 19 + TypeScript + Vite
- **后端**: Rust + Tauri 2

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run tauri dev` | 启动开发模式（前后端同时运行） |
| `npm run tauri build` | 构建生产版本 |
| `npm run tauri build -- --debug` | 构建调试版本 |
| `npm run dev` | 仅启动前端开发服务器 |

## 架构说明

```
src/                  # 前端 React 源码
  main.tsx           # 前端入口
  App.tsx            # 主应用组件

src-tauri/           # 后端 Rust 源码
  src/main.rs        # 程序入口
  src/lib.rs         # Tauri 命令定义
  tauri.conf.json    # 应用配置
  Cargo.toml         # Rust 依赖
```

前端通过 `@tauri-apps/api` 与后端通信，后端在 `lib.rs` 中定义 Tauri 命令。

## 开发环境

- 推荐 IDE: VS Code + Tauri 插件 + rust-analyzer
- 包管理器: 使用 bun（项目已配置）
- 开发服务器: http://localhost:1420