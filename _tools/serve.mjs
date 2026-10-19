/**
 * 零依赖静态服务器 —— 预览 H5 构建产物
 * 用法：npm run serve:h5  （默认端口 4173，PORT 环境变量可改）
 */
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { join, extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { networkInterfaces } from 'node:os'

/** 取本机局域网 IPv4 地址（供手机访问） */
function lanIp() {
  for (const list of Object.values(networkInterfaces())) {
    for (const it of list || []) {
      if (it.family === 'IPv4' && !it.internal) return it.address
    }
  }
  return null
}

const ROOT = resolve(fileURLToPath(new URL('../dist/build/h5', import.meta.url)))
const PORT = Number(process.env.PORT || 4173)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4'
}

const server = createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    if (path === '/' || path.endsWith('/')) path += 'index.html'
    // 防目录穿越
    const file = resolve(join(ROOT, path))
    if (!file.startsWith(ROOT)) {
      res.writeHead(403).end('Forbidden')
      return
    }
    let data
    try {
      data = await readFile(file)
    } catch {
      // hash 路由：静态资源 404 才返回 404，其余回退 index.html
      if (extname(file)) {
        res.writeHead(404).end('Not Found')
        return
      }
      data = await readFile(join(ROOT, 'index.html'))
    }
    res.writeHead(200, {
      'Content-Type': MIME[extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    })
    res.end(data)
  } catch (e) {
    res.writeHead(500).end(String(e))
  }
})

// 端口被占用时自动顺延（最多尝试 10 个端口）
function listen(port, tries = 0) {
  const onError = (e) => {
    if (e.code === 'EADDRINUSE' && tries < 10) {
      listen(port + 1, tries + 1)
    } else {
      console.error(`启动失败：${e.message}`)
      process.exit(1)
    }
  }
  server.once('error', onError)
  server.listen(port, () => {
    server.removeListener('error', onError)
    console.log(`\n  翁法罗斯·如我所书 — H5 预览服务已启动`)
    console.log(`  ➜  电脑访问: http://localhost:${port}`)
    const ip = lanIp()
    if (ip) console.log(`  ➜  手机访问: http://${ip}:${port}  (需与电脑连同一 Wi-Fi)`)
    console.log()
  })
}
listen(PORT)
