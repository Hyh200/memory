# Flexus L 云服务器上线部署说明

本文面向华为云 Flexus 应用服务器 L 实例，实例镜像选择“宝塔面板”。项目本身使用 Docker Compose 运行 Web + MinIO；宝塔面板用于可视化运维、Nginx 反向代理和 HTTPS 证书管理。

参考资料来自本地保存的华为云文档：

- `C:\Users\34918\Downloads\使用宝塔面板管理服务器_搭建网站_最佳实践_Flexus云服务_Flexus应用服务器L实例-华为云.html`
- `C:\Users\34918\Downloads\使用宝塔面板管理服务器_搭建网站_最佳实践_Flexus云服务_Flexus应用服务器L实例-华为云_files`

## 1. Flexus L 实例准备

在华为云控制台购买 Flexus 应用服务器 L 实例：

- 镜像：选择“宝塔面板”应用镜像。
- 系统：该应用镜像基于 Ubuntu 22.04。
- 规格：官方文档给出的宝塔最低配置为 2 核 2GiB；本项目需要构建 Docker 镜像，建议至少 2 核 4GiB，图片多时优先加内存和数据盘。
- 公网：Flexus L 默认分配固定弹性公网 IP。
- 数据：建议购买或挂载数据盘，用于 Docker volume 和 MinIO 数据。

实例创建后不要立刻重启。官方文档提示应用镜像刚创建后的几分钟处于启动中，此时不要重置密码、重启或关机，避免初始管理信息失效。

## 2. 安全组建议

华为云示例会开放 `80`、`443`、`8888`、`3306`、`9090`。本项目不需要公网 MySQL 或 phpMyAdmin，因此不要照抄开放数据库端口。

推荐入方向规则：

| 端口 | 来源 | 用途 |
|---|---|---|
| 22 | 你的固定公网 IP | SSH 运维 |
| 80 | 0.0.0.0/0 | HTTP 访问和证书签发 |
| 443 | 0.0.0.0/0 | HTTPS 访问 |
| 8888 | 你的固定公网 IP，临时开放 | 宝塔面板管理 |

不建议开放：

- `3000`：Web 容器只绑定 `127.0.0.1:3000`，由 Nginx 反向代理。
- `9000`：MinIO API 只给容器内网使用。
- `9001`：MinIO Console 只绑定 `127.0.0.1:9001`，需要时通过 SSH 隧道访问。
- `3306`、`9090`：本项目 MVP 不使用 MySQL/phpMyAdmin。

宝塔初始化完成后，建议把 `8888` 的来源限制为你的固定公网 IP；如果不再使用宝塔面板，可临时关闭该规则。

## 3. 初始化宝塔面板

在 Flexus 控制台完成以下步骤：

1. 等待“镜像信息”区域的应用管理页面启动完毕。
2. 重置 Flexus L 实例密码。
3. 使用 VNC 或 SSH 登录服务器，用户名通常为 `root`，密码为刚设置的实例密码。
4. 获取宝塔面板初始用户名和密码：

```bash
sudo cat /credentials/password.txt
```

5. 在 Flexus 控制台的“镜像信息”区域点击“管理”，进入宝塔管理页面。
6. 使用上一步获取的宝塔账号密码登录。
7. 首次登录时可按需绑定宝塔账号。LNMP/LAMP 推荐软件不是本项目必须项；如果准备用宝塔管理 Nginx 和证书，只需确保 Nginx 可用。

## 4. 服务器安装 Docker

SSH 登录 Flexus L：

```bash
ssh root@<server-ip>
```

如果宝塔镜像未预装 Docker，安装 Docker 和 Compose 插件：

```bash
apt update
apt install -y ca-certificates curl git
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
docker version
docker compose version
```

如果宝塔软件商店已安装 Docker，也仍建议在 SSH 中执行 `docker compose version` 确认命令可用。

## 5. 上传代码并配置环境变量

推荐把项目放到 `/opt/annual-photo-album`：

```bash
cd /opt
git clone <your-repo-url> annual-photo-album
cd annual-photo-album
cp .env.example .env.production
```

编辑 `.env.production`：

```bash
nano .env.production
```

生产环境示例：

```bash
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
PORT=3000

MINIO_ENDPOINT=http://minio:9000
MINIO_REGION=us-east-1
MINIO_BUCKET=annual-photo-album
MINIO_ACCESS_KEY=<replace-with-strong-user>
MINIO_SECRET_KEY=<replace-with-strong-password>
MINIO_ROOT_USER=<replace-with-strong-user>
MINIO_ROOT_PASSWORD=<replace-with-strong-password>
```

要求：

- `.env.production` 只保存在服务器，不提交 Git。
- `MINIO_ACCESS_KEY` 和 `MINIO_SECRET_KEY` 使用强随机值。
- MVP 阶段 `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` 可以与 MinIO 访问凭据一致；正式多用户阶段再拆分最小权限账号。

## 6. 启动项目

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
docker compose -f docker-compose.prod.yml --env-file .env.production ps
curl http://127.0.0.1:3000/api/health
```

健康检查返回 `ok: true` 表示 Web 服务已读取 MinIO 必要配置。

查看日志：

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f web
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f minio
```

## 7. 宝塔/Nginx 绑定域名和 HTTPS

先把域名解析到 Flexus L 的弹性公网 IP。中国大陆服务器面向公网网站通常需要先完成备案，再长期使用域名访问。

### 方案 A：使用宝塔面板配置

在宝塔面板中：

1. 进入“网站”，添加站点，域名填写你的域名，例如 `album.example.com`。
2. PHP 版本选择“纯静态”或不启用 PHP。
3. 进入该站点设置，配置反向代理：
   - 代理名称：`annual-photo-album`
   - 目标 URL：`http://127.0.0.1:3000`
   - 发送域名：`$host`
4. 在站点 SSL 配置中申请 Let's Encrypt 证书并开启强制 HTTPS。
5. 上传测试照片后，访问 `https://album.example.com/api/health` 和网站首页。

### 方案 B：手写 Nginx 配置

如果不通过宝塔站点管理，可使用 Nginx 配置：

```nginx
server {
  listen 80;
  server_name album.example.com;

  client_max_body_size 50m;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

配置 HTTPS：

```bash
certbot --nginx -d album.example.com
```

## 8. MinIO Console 访问

`docker-compose.prod.yml` 默认把 MinIO Console 绑定到服务器本机 `127.0.0.1:9001`，不暴露到公网。

需要管理 MinIO 时，在本地电脑建立 SSH 隧道：

```bash
ssh -L 9001:127.0.0.1:9001 root@<server-ip>
```

然后本地浏览器打开：

```text
http://127.0.0.1:9001
```

使用 `.env.production` 中的 `MINIO_ROOT_USER` 和 `MINIO_ROOT_PASSWORD` 登录。

## 9. 更新发布

```bash
cd /opt/annual-photo-album
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f web
curl https://album.example.com/api/health
```

## 10. 数据备份与回滚

MinIO 文件保存在 Docker volume `minio-data`。回滚代码时不要删除该 volume。

备份 MinIO volume：

```bash
docker run --rm -v annual-photo-album_minio-data:/data -v /opt/backups:/backup alpine tar czf /backup/minio-data-$(date +%F).tar.gz -C /data .
```

回滚代码：

```bash
cd /opt/annual-photo-album
git log --oneline -10
git checkout <commit>
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

## 11. 上线前检查清单

- 华为云安全组只开放必要端口：`80`、`443`、受限来源的 `22`、临时/受限来源的 `8888`。
- `.env.production` 在服务器存在，且没有提交到 Git。
- `docker compose ... ps` 中 `web` 和 `minio` 均为运行状态。
- `curl http://127.0.0.1:3000/api/health` 返回 `ok: true`。
- 域名解析到 Flexus L 弹性公网 IP。
- HTTPS 证书签发成功，`https://你的域名` 能访问首页。
- 上传一张测试照片，确认能归档到年度相册。
- 生成分享链接，用无登录浏览器访问，确认只有阅读权限。

## 12. 已知限制

- 当前 MVP 的分享链接存储在 Web 进程内存中，服务重启后会失效；正式上线给真实用户前应改为数据库持久化。
- 当前 MinIO 使用容器 volume 持久化，需定期备份。
- 不建议把宝塔、MinIO Console、数据库端口长期暴露到公网。
