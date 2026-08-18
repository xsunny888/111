# 装修工作台 · 同步后端（免费云主机版）

零依赖 Node 服务，专门给「装修工作台」App 做多设备实时同步用。
契约：`GET /data` 取数据，`PUT /data` 存数据，请求头带 `Authorization: Bearer <token>`。

## 本地验证
```bash
cd sync-server
SYNC_TOKEN=test123 PORT=4000 node server.js
# 另一个终端：
curl -X PUT http://localhost:4000/data -H "Authorization: Bearer test123" -H "Content-Type: application/json" -d '{"hello":1}'
curl http://localhost:4000/data -H "Authorization: Bearer test123"
```

## 部署到 Render（免费）
1. 把整个 `sync-server` 文件夹推到你的 GitHub 仓库（新建一个私有仓即可）。
2. 打开 https://render.com → 注册（GitHub 登录）→ New → Web Service → 关联该仓库。
3. 配置：Runtime = Node；Build Command = `true`；Start Command = `node server.js`；Plan = Free。
4. 在 Environment 里加变量 `SYNC_TOKEN`，值填一段**强随机字符串**（例如 `openssl rand -hex 16` 的结果）——这是你数据的唯一钥匙，别泄露。
5. Deploy，等几十秒拿到地址，形如 `https://reno-sync-xxxx.onrender.com`。

## 部署到 Railway（免费额度更大，磁盘持久）
1. 打开 https://railway.app → 用 GitHub 登录 → New Project → Deploy from GitHub repo。
2. 选中含 `sync-server` 的仓库，Railway 会自动识别 Node 项目（用 `package.json` 的 start）。
3. 在 Variables 里加 `SYNC_TOKEN=<强随机串>`；Railway 默认给持久磁盘，数据不会因重启丢失（比 Render 免费版更稳）。
4. Deploy 后拿到地址，形如 `https://reno-sync-xxxx.up.railway.app`。

## 在 App 里开启同步
1. 手机/电脑打开装修工作台 → 右上角「设置」。
2. 勾选「开启在线同步」，Base URL 填上面的后端地址（**不要**带 `/data` 后缀，例如 `https://reno-sync-xxxx.onrender.com`）。
3. Token 填你设的 `SYNC_TOKEN`。保存。
4. 之后任意设备上的增删改都会实时写回后端，其他设备打开即自动拉取最新数据。

## 注意事项
- **数据安全**：后端是明文 JSON 文件，靠 `SYNC_TOKEN` 这一个钥匙保护；公网任何拿到地址+token 的人都能读写。建议 token 够长够随机，且别把地址+token 发给不信任的人。
- **Render 免费版磁盘是临时的**：实例休眠/重建后数据可能清空（冷启动约几十秒）。要持久，优先 Railway，或后续把存储换成 SQLite/数据库。
- 想彻底稳妥可把 `DATA_DIR` 指向挂载的持久卷（Railway 支持）。
- 该后端只服务这一个工作台的数据，多用户隔离需自行扩展（本场景用不到）。
