# 云服务器部署说明

本项目按 Linux 云服务器 + Docker Compose 部署。生产配置不提交真实密钥，服务器上使用 `.env.production`。

## 服务器前置条件

- Ubuntu 22.04/24.04 或同类 Linux 发行版。
- 已安装 Docker 和 Docker Compose v2。
- 域名已解析到服务器公网 IP。
- 安全组只开放 `80`、`443` 和 SSH 端口；应用 `3000` 与 MinIO Console `9001` 默认只绑定 `127.0.0.1`。

## 首次部署

```bash
git clone <your-repo-url> annual-photo-album
cd annual-photo-album
cp .env.example .env.production
```

编辑 `.env.production`：

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

启动服务：

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
docker compose -f docker-compose.prod.yml --env-file .env.production ps
curl http://127.0.0.1:3000/api/health
```

健康检查返回 `ok: true` 才表示 Web 服务已拿到 MinIO 必要配置。

## Nginx 反向代理

将域名代理到本机 `3000`：

```nginx
server {
  listen 80;
  server_name example.com;

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
sudo certbot --nginx -d example.com
```

## 更新发布

```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f web
```

## 数据与回滚

- MinIO 文件保存在 Docker volume `minio-data`，不要在回滚代码时删除该 volume。
- 回滚代码：

```bash
git log --oneline -10
git checkout <commit>
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

## 注意事项

- `.env.production` 已被 `.gitignore` 排除，不能提交真实密钥。
- 当前 MVP 的分享链接存储在 Web 进程内存中，服务重启后会失效；正式多用户上线前需要改为数据库持久化。
- 如果不使用 Nginx，需把 `docker-compose.prod.yml` 中 Web 端口改为 `"3000:3000"`，并在安全组开放 `3000`。生产环境建议使用 Nginx + HTTPS。
