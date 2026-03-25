# 极速工具箱 | 高效开发工具集成平台

**中文** | **[English Documentation](README.md)**

极速工具箱是一个高颜值的在线开发工具箱，提供各种程序员必备的开发工具，帮助开发者提升编程效率。本项目使用 Next.js 和 TailwindCSS 开发，拥有美观现代的界面设计。

**在线演示**: [https://www.jisuxiang.com/](https://www.jisuxiang.com/) - 立即体验！

## 🚀 功能特点

- **多种分类工具**：JSON处理、编码解码、网络测试等多种实用工具
- **响应式设计**：适配各种设备尺寸，提供最佳用户体验
- **暗色主题**：保护眼睛的界面设计，适合长时间使用
- **高效搜索**：快速找到所需工具的强大搜索功能
- **收藏系统**：保存常用工具，方便快速访问
- **多语言支持**：支持中文和英文界面

## 🔧 包含工具

- JSON格式化与验证
- HTTP请求测试
- 时间戳转换
- 编码解码工具
- 正则表达式测试
- 加密解密工具
- 颜色选择与转换
- 代码格式化
- JSON编辑器与转换器
- IP地址查询
- 日期计算器
- 时区转换
- 文本统计
- HTML/Markdown转换
- 图片压缩
- 二维码生成
- CSS渐变生成器
- 更多实用工具...

## 🛠️ 技术栈

- [Next.js](https://nextjs.org) - React生产级框架
- [TailwindCSS](https://tailwindcss.com) - 实用优先的CSS框架
- [Font Awesome](https://fontawesome.com) - 图标库
- [TypeScript](https://www.typescriptlang.org/) - 类型安全的JavaScript

## 📦 安装与部署

### 使用Docker部署（推荐）

使用Docker Hub上的官方镜像是运行极速工具箱最简单的方式：

```bash
# 适用于x86/x64架构
docker pull star7th/jisuxiang:latest
docker run -d --name jisuxiang --restart always -p 3000:3000 star7th/jisuxiang:latest

# 适用于ARM架构（如树莓派、Apple Silicon）
docker pull star7th/jisuxiang:arm-latest
docker run -d --name jisuxiang --restart always -p 3000:3000 star7th/jisuxiang:arm-latest
```

### 使用Node.js部署

用于本地开发或在Node.js服务器上部署：

1. 克隆仓库:
```bash
git clone https://github.com/star7th/jisuxiang.git
cd jisuxiang
```

2. 安装依赖:
```bash
npm install
# 或者
yarn install
# 或者
pnpm install
```

3. 运行开发服务器:
```bash
npm run dev
# 或者
yarn dev
# 或者
pnpm dev
```

4. 在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看应用。

生产环境部署:
```bash
# 构建应用
npm run build

# 启动生产服务器
npm start
```

## 🧩 项目结构

```
jisuxiang/
├── src/
│   ├── app/              # Next.js应用目录（页面、布局）
│   ├── components/       # 可复用UI组件
│   ├── config/           # 配置文件
│   │   ├── categories.ts # 工具分类定义
│   │   ├── tools.ts      # 工具定义
│   │   └── i18n/         # 国际化文件
│   ├── context/          # React上下文提供者
│   ├── types/            # TypeScript类型定义
│   └── utils/            # 实用函数
├── public/               # 静态资源
└── ...                   # 配置文件
```

## 🧪 开发指南

添加新工具的步骤:

1. 在 `src/app/tools/[tool_code]/` 创建新目录
2. 在 `src/config/tools.ts` 中添加工具配置
3. 在 `src/config/i18n/tools/[tool_code]/` 中添加翻译

## 🌍 贡献指南

欢迎贡献代码！请随时提交Pull Request。

1. Fork仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m '添加某项惊人功能'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开Pull Request

## 📄 许可证

本项目基于Apache License 2.0许可 - 详情请查看 [LICENSE](LICENSE) 文件。

## 🔗 链接

- GitHub仓库: [https://github.com/star7th/jisuxiang](https://github.com/star7th/jisuxiang) 