// 装修工作台 · 轻量同步后端（零依赖，原生 http）
// 契约：GET /data  -> 返回存储的 JSON（无则 {}）
//       PUT /data  -> 接收 JSON 体并落盘，返回 {ok:true}
// 鉴权：若设置了 SYNC_TOKEN，请求头需带 Authorization: Bearer <SYNC_TOKEN>
// 数据隔离：所有持有 token 的设备共享同一份 JSON（即"多设备同步"）

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const TOKEN = process.env.SYNC_TOKEN || '';          // 留空=不鉴权（不建议公网留空）
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'reno.json');
const MAX_BODY = 15 * 1024 * 1024;                   // 灵感图 base64 可能较大，给 15MB

try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}
function authOk(req) {
  if (!TOKEN) return true;
  return (req.headers['authorization'] || '') === ('Bearer ' + TOKEN);
}
function readData() { try { return fs.readFileSync(DATA_FILE, 'utf8'); } catch (e) { return null; } }
function writeData(s) { fs.writeFileSync(DATA_FILE, s); }

const server = http.createServer((req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }   // CORS 预检

  const url = (req.url || '').split('?')[0];

  if (url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Reno Sync Server OK'); return;
  }

  if (url === '/data') {
    if (!authOk(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'unauthorized' })); return;
    }
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(readData() || '{}'); return;
    }
    if (req.method === 'PUT' || req.method === 'POST') {
      let body = '';
      req.setEncoding('utf8');
      req.on('data', c => {
        body += c;
        if (body.length > MAX_BODY) req.destroy();
      });
      req.on('end', () => {
        try {
          const obj = JSON.parse(body);
          if (typeof obj !== 'object' || obj === null) throw 0;
          writeData(JSON.stringify(obj));
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, bytes: body.length }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'invalid json' }));
        }
      });
      return;
    }
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found' }));
});

server.listen(PORT, () => console.log('Reno Sync Server listening on ' + PORT));
