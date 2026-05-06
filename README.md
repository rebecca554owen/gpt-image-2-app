# GPT Image 2 App

基于 OpenAI gpt-image-2 接口的 AI 图片生成应用，支持 Web 和 Android 双端。

[![Deploy to GitHub Pages](https://github.com/AmaTsumeAkira/gpt-image-2-app/actions/workflows/pages.yml/badge.svg)](https://github.com/AmaTsumeAkira/gpt-image-2-app/actions/workflows/pages.yml)

## 功能特性

- **文生图 / 图生图 / 多图合成** — 支持参考图上传和遮罩编辑
- **双供应商** — APIMart（异步轮询）和 DM-Fox（同步直返）
- **任务管理** — 提交、进度追踪、重试、复用配置、批量操作
- **文件夹分组** — 拖拽分类、批量移动、快速筛选
- **本地持久化** — IndexedDB 存储任务记录和图片缓存，无容量限制
- **数据库浏览** — 查看/下载/删除 IndexedDB 中所有存储图片
- **画笔蒙版编辑** — 内置画布工具，支持局部重绘
- **图片放大** — 1K → 2K → 4K 递进放大
- **搜索筛选** — 按提示词、参数、状态快速查找
- **远程任务拉取** — 通过 task_id 拉取远端任务状态和结果
- **统计面板** — 按供应商/时间维度的用量和耗时统计
- **APK 在线更新** — 检查新版本、自动下载安装
- **离线缓存** — 远程图片本地缓存，断网可浏览
- **Web 版** — GitHub Pages 部署，浏览器即可使用

## 技术栈

| 层 | 技术 |
|---|------|
| 框架 | React 19 + TypeScript 5.8 |
| 构建 | Vite 6 |
| 状态管理 | Zustand 5 (persist) |
| 样式 | Tailwind CSS 3 |
| 持久化 | IndexedDB + localStorage |
| 移动端 | Capacitor 8 (Android) |
| CI/CD | GitHub Actions → GitHub Pages |

## 开发

```bash
npm install
npm run dev        # Web 开发服务器
```

## 构建

```bash
npm run build      # Web 构建 → dist/
```

### Android 构建

```bash
npm run build
npx cap sync android
npx cap open android   # Android Studio 构建 APK
```

## 致谢

本项目最初参考了 [gpt_image_playground](https://github.com/CookSleep/gpt_image_playground) 的项目结构和部分 UI 设计，后进行了大幅重构和功能扩展。感谢原作者 [CookSleep](https://github.com/CookSleep) 的开源贡献。

## 许可证

[MIT License](LICENSE)
