# WebDAV 和 S3 服务器 [免费 Cloudflare Worker 应用]

本项目使用 Cloudflare Workers 和 R2 实现了一个兼容 WebDAV 和 S3 的服务器。 [查看R2免费额度](https://developers.cloudflare.com/r2/pricing/)

## 功能特点

- 支持 WebDAV 协议，可与各种 WebDAV 客户端兼容
- 提供 S3 兼容的 API，可用于 S3 客户端和应用程序
- 使用 Cloudflare R2 作为存储后端，提供高性能和低成本的存储解决方案
- 支持基本的文件操作：上传、下载、删除、列表等
- 提供简单的 Web 界面用于浏览文件

## 一键部署

## GitHub Actions 部署流程

### 0. Cloudflare 准备工作

- 注册并登录 Cloudflare 账户。
- 创建一个 R2 存储桶，并记下桶的名称。
- 创建一个 Worker API token（确保具有编辑 Cloudflare Workers 的权限），并保存 API 令牌。

### 1. Fork 仓库

- 访问 [https://github.com/aigem/r2-webdav-s3](https://github.com/aigem/r2-webdav-s3)
- 点击页面右上角的 "Fork" 按钮，将仓库 fork 到您的 GitHub 账户。

### 2. 设置 GitHub Secrets

在您 fork 的仓库中，导航到 Settings -> Secrets and variables -> Actions，然后添加以下 secrets：

- `CLOUDFLARE_API_TOKEN`: Cloudflare 的 API Token
- `USERNAME`: WebDAV 的用户名
- `PASSWORD`: WebDAV 的密码
- `my_bucket`: R2 存储桶的名称
- `ACCESS_KEY_ID`: S3 的访问密钥 ID（如果使用 S3）
- `SECRET_ACCESS_KEY`: S3 的访问密钥（如果使用 S3）

### 3. 创建 GitHub Action

- 在您 fork 的仓库中，点击 "Actions" 标签。
- 点击 "New workflow" 或 "set up a workflow yourself"。
- 将文件命名为 `deploy.yml`（或您喜欢的任何名称）。

### 4. 配置工作流文件

将以下内容粘贴到工作流文件中：

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches:
      - main  # 或者您想触发部署的分支

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - uses: actions/checkout@v3
      
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20.x'
      
      - name: Install dependencies
        run: npm install
      
      - name: Create wrangler.toml
        run: |
          echo "name = \"r2-webdav-s3\"" > wrangler.toml
          echo "main = \"src/index.ts\"" >> wrangler.toml
          echo "compatibility_date = \"2023-01-01\"" >> wrangler.toml
          echo "" >> wrangler.toml
          echo "[vars]" >> wrangler.toml
          echo "USERNAME = \"${{ secrets.USERNAME }}\"" >> wrangler.toml
          echo "PASSWORD = \"${{ secrets.PASSWORD }}\"" >> wrangler.toml
          echo "" >> wrangler.toml
          echo "[[r2_buckets]]" >> wrangler.toml
          echo "binding = \"bucket\"" >> wrangler.toml
          echo "bucket_name = \"${{ secrets.my_bucket }}\"" >> wrangler.toml
          echo "" >> wrangler.toml
          echo "[vars.S3]" >> wrangler.toml
          echo "ENDPOINT = \"your_s3_endpoint\"" >> wrangler.toml
          echo "REGION = \"auto\"" >> wrangler.toml
          echo "ACCESS_KEY_ID = \"${{ secrets.ACCESS_KEY_ID }}\"" >> wrangler.toml
          echo "SECRET_ACCESS_KEY = \"${{ secrets.SECRET_ACCESS_KEY }}\"" >> wrangler.toml
          echo "BUCKET = \"${{ secrets.my_bucket }}\"" >> wrangler.toml
      
      - name: Publish to Cloudflare Workers
        uses: cloudflare/wrangler-action@3.0.0
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

### 5. 提交并推送更改

- 点击 "Start commit" 或 "Commit changes"。
- 添加提交消息（例如 "Add deployment workflow"）。
- 选择 "Commit directly to the main branch"。
- 点击 "Commit new file"。

### 6. 触发部署

- 对仓库进行任何更改并推送到 `main` 分支（或您在工作流中指定的分支）。
- 这将自动触发部署过程。

### 7. 查看部署状态

- 在仓库中，点击 "Actions" 标签。
- 您应该能看到正在运行或已完成的工作流。
- 点击工作流以查看详细的部署日志。

### 8. 访问您的 Cloudflare Worker

部署成功后，您可以在 Cloudflare 控制面板中找到您的 Worker URL。使用这个 URL 来访问您的 WebDAV 和 S3 兼容服务器。



这个 Markdown 格式的说明提供了详细的步骤指导，从 Cloudflare 的准备工作到 GitHub Actions 的配置和部署过程。您可以直接将这段内容添加到您的 `README.md` 文件中。

## 本地设置

1. 安装依赖：
npm install

2. 配置 `wrangler.toml`，填入您的凭证和存储桶信息。

3. 部署到 Cloudflare Workers：
wrangler publish

## 使用方法

- WebDAV 端点可在根路径访问。
- S3 兼容的端点可在 `/s3` 路径下访问。

更详细的使用说明，请参阅 API 文档。

## 开发

要在本地运行项目：
wrangler dev

## 测试

运行测试套件：
npm test

## 注意事项

- 请确保正确设置环境变量 `USERNAME` 和 `PASSWORD` 以保护您的服务器。
- R2 存储桶需要预先创建并在 `wrangler.toml` 中正确配置。
- 本项目仅提供基本的 WebDAV 和 S3 功能，可能不支持某些高级特性。

## 贡献

欢迎贡献代码、报告问题或提出改进建议。请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解更多信息。

## 许可证

本项目基于 MIT 许可证开源。
