# Cloudflare R2 WebDAV Server

这个项目实现了一个基于 Cloudflare Workers 和 R2 存储的 WebDAV 服务器。它允许用户通过 WebDAV 协议访问和管理存储在 Cloudflare R2 中的文件和目录。

## 特性

- 完全兼容 WebDAV 协议
- 基于 Cloudflare Workers，无需管理服务器
- 使用 Cloudflare R2 作为存储后端（免费额度慷慨）
- 支持基本的身份验证
- 支持文件上传、下载、删除、移动和复制操作
- 支持目录创建和列表

## 一键部署到 Cloudflare Workers

点击下面的按钮，一键将此项目部署到您的Cloudflare Workers账户：

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/YOUR_USERNAME/YOUR_REPO)

注需要有Cloudflare账户才能使用此功能。如果您还没有账户，可以在[Cloudflare官www.cloudflare.com)注册。

## 手动部署步骤 [Githut Actions]

如果您需要自定义配置或想要深入了解部署流程，请按以下步骤操作：

### 前提条件

- Cloudflare 账户
- 已创建的 R2 存储桶
- GitHub 账户

### 步骤 1: 配置 Cloudflare

1. 【获取API令牌】在 Cloudflare 仪表板中，创建一个新的 API 令牌，确保它有足够的权限来管理编辑Workers(和 R2)。
2. 【获取桶名称】创建的 R2 存储桶

### 步骤 2: 准备仓库

Fork 这个仓库到您的 GitHub 账户。
```
https://github.com/aigem/CFr2-webdav
```

### 步骤 3: 配置 GitHub Secrets

在您的 GitHub 仓库中，转到 Settings -> Secrets and variables -> Actions，添加以下 secrets：

- `CLOUDFLARE_API_TOKEN`: 步骤1的 Cloudflare API 令牌 (必须)
- `USERNAME`: WebDAV 服务器的用户名 （可选，默认为 _user）
- `PASSWORD`: WebDAV 服务器的密码 （可选，默认为 _pass）
- `BUCKET_NAME`: 的 R2 存储桶名称 （可选，默认为 bucket 如果与你实际的bucket不符，则GithubAction部署会失败）

### 步骤 4: 配置 GitHub Actions

1. 在您的 GitHub 仓库设置中，启用 GitHub Actions。
2. workflow 文件已经存在，请选择： .github/workflow/main.yml

### 步骤 6: 触发部署

按上面操作完成后就会自动进行部署到CF Worker中，或将任何更改推送到 GitHub 仓库的 `main` 分支，或者手动运行 GitHub Actions 工作流。GitHub Actions 将自动触发部署流程。

您可以在 GitHub 仓库的 Actions 标签页中查看部署进度。部署成功后，您可以在 Cloudflare Workers 仪表板中找到您的 Worker URL。

## 使用方法

使用任何支持 WebDAV 协议的客到您的 Worker URL，使用配置的用户名和密码进行身份验证。


## 本地开发（可选）

如果您需要在本地进行开发和测试，请按以下步骤操作：

0. 同上面步骤1 ：配置 Cloudflare

1. 克隆仓库到本地：
   ```bash
   git clone https://github.com/aigem/CFr2-webdav.git
   cd cf-r2-webdav
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 修改wrangler.toml.template为wrangler.toml文件，并修改为你的实际参数：
  
4. 使用 Wrangler 进行本地开发：
   ```bash
   npx wrangler dev --local
   ```

注意：本地开发可能无法完全模拟 Cloudflare Workers 环境，特别是 R2 存储的操作。

## 注意事项

- 确保妥善保管您的 API 令牌和其他敏感信息。
- 定期更新您的依赖以确保安全性。
- 遵守 Cloudflare 的使用政策和条款。

## 贡献

欢迎提交 Pull Requests 或创建 Issues 来改进这个项目。

## 许可证

本项目采用 MIT 许可证。
