# dsh-multiple-chat-panels

> ## ⚡ 本 fork 说明（dps 适配版）
>
> 本仓库是 [WilliamShi666/dsh-multiple-chat-panels](https://github.com/WilliamShi666/dsh-multiple-chat-panels) 的 fork，针对 **DeepSeek Harness 0.1.0-rc.8** 做了适配与增强（原作者版本针对 rc.7，rc.8 前端重组后无法运行）。改动清单：
>
> - **rc.8 适配**：内联 `bindSnapshotSelector`（rc.8 移除 `dsh-client-web-react`）；入口改为 `sidebar.footer.action` + `conversation.view`（view-ring tab）；更新 tsdown externals 与 inject 清单
> - **隐藏主对话底部输入框**：Mission Control 视图激活时自动隐藏主 composer，切回 Chat 恢复
> - **面板输入框折叠**：每面板 composer 可折叠成细栏（per-session 持久化）
> - **「＋ 新会话」按钮**：直接新建空白会话作为面板
> - **Add 下拉排序**：按更新时间倒序 + 与侧边栏一致的可见性过滤（隐藏子代理/已归档/空白草稿）
> - **「⬌ 横排」按钮**：所有面板强制单行均分横排（超出时横向滚动）
> - **插话发送**：面板内模型运行中发送自动走 steer（可即时提醒/纠正），steer 不可用时降级 queue
> - **拖拽修复**：修复 HTML5 DnD 在 dragover 阶段读不到数据导致的「拖不动」问题
>
> 安装本 fork：`dsh plugin --profile web add github:zhenlixiaoqiang-png/multiple-chat-panels-dps`
>
> ---

Multiple chat panels for DeepSeek Harness: view and interact with several Agents side by side.

Terminal-native Agents (like Claude Code) give you a “god’s-eye view”: you can watch and steer multiple conversations at once, and interact with several Agents in parallel. Most desktop and web harnesses don’t offer this: you either work with a single Agent in a single conversation, or you juggle multiple windows and quickly lose context.

在终端里使用 TUI 形态的 Agent（例如 Claude Code），你会获得一种“一览众山小”的上帝视角：可以同时查看和操控多个对话窗口，并与多个 Agent 并行互动。但很多桌面端或网页端的 Harness 并不支持这种能力：要么只能在一个对话里和一个 Agent 交互，要么即使支持多 Agent / 多窗口，操作也非常繁琐。

![Claude Code in a terminal with multiple conversation panes](docs/screenshots/claude-code-terminal.jpg)

multiple-chat-panels brings that same experience to DeepSeek Harness. Drag conversations from the left sidebar into the center area, and Mission Control opens with each session as a live, independently interactive panel. With this “god’s-eye view”, you can significantly improve how you interact with multiple Agents and how you handle multitasking, all without leaving your desktop or web UI. Available in both dark and light mode.

multiple-chat-panels 把这种体验带到了 DeepSeek Harness：你只需把左侧边栏里的对话拖到中间区域，Mission Control 就会把每个会话展开为一个可实时交互的独立面板。有了这样“一览众山小”的上帝视角，你可以显著提升与多个 Agent 的交互能力，以及多任务（multitasking）的执行能力；无需离开桌面端或网页端 UI。支持深色与浅色模式。

![DeepSeek Harness multi-chat panels in dark mode](docs/screenshots/dark.jpg)

![DeepSeek Harness multi-chat panels in light mode](docs/screenshots/light.jpg)

## 安装

```bash
dsh plugin --profile web add multiple-chat-panels
```

也可以直接从 GitHub 安装：

```bash
dsh plugin --profile web add github:WilliamShi666/dsh-multiple-chat-panels
```

安装后重启 DSH，把侧边栏中的会话拖到中间区域即可打开 Mission Control。

## 链接

- GitHub: https://github.com/WilliamShi666/dsh-multiple-chat-panels
- npm: https://www.npmjs.com/package/multiple-chat-panels
- 完整功能与开发状态: [docs/FEATURES.md](docs/FEATURES.md)
- 发布/开源操作: [RELEASING.md](RELEASING.md)

## License

MIT
