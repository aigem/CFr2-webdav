# WebDAV 和 S3 服务器 [免费 Cloudflare Worker 应用]

本项目使用 Cloudflare Workers 和 R2 实现了一个兼容 WebDAV 和 S3 的服务器。 [查看R2免费额度](https://developers.cloudflare.com/r2/pricing/)

## 功能特点

- 支持 WebDAV 协议，可与各种 WebDAV 客户端兼容
- 提供 S3 兼容的 API，可用于 S3 客户端和应用程序
- 使用 Cloudflare R2 作为存储后端，提供高性能和低成本的存储解决方案
- 支持基本的文件操作：上传、下载、删除、列表等
- 提供简单的 Web 界面用于浏览文件

## 一键部署

只需点击下面的按钮，即可将此项目部署到您的 Cloudflare Workers 账户：

[![部署到 Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/aigem/r2-webdav-s3)

部署步骤：
1. 点击上面的按钮
2. 如果尚未登录，请登录您的 Cloudflare 账户
3. 选择一个 Worker 名称和要部署到的账户
4. 点击"部署"

注意：部署后，您可能需要在 Cloudflare 控制面板中设置一些环境变量或密钥。

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
