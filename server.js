const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const root = __dirname;
const preferredPorts = [8933, 8934, 8940, 8950];
const contentFile = path.join(root, 'content.json');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8'
};

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.end(JSON.stringify(data, null, 2));
}

function runGit(args) {
  return new Promise((resolve, reject) => {
    execFile('git', args, { cwd: root }, (error, stdout, stderr) => {
      const output = [stdout, stderr].filter(Boolean).join('\n').trim();
      if (error) {
        reject(new Error(output || error.message));
        return;
      }
      resolve(output);
    });
  });
}

async function publishRepo() {
  const status = await runGit(['status', '--porcelain']);
  if (!status.trim()) {
    return { ok: true, message: 'Không có thay đổi mới để publish.', output: '' };
  }

  await runGit(['add', '-A']);
  const timestamp = new Date().toISOString().replace('T', ' ').replace(/:\d{2}\.\d{3}Z$/, ' UTC');
  const commitOutput = await runGit(['commit', '-m', `Publish portfolio update ${timestamp}`]);
  const pushOutput = await runGit(['push', 'origin', 'main']);
  return {
    ok: true,
    message: 'Đã commit và push lên GitHub Pages.',
    output: [commitOutput, pushOutput].filter(Boolean).join('\n\n')
  };
}

function serveFile(req, res) {
  const url = new URL(req.url, 'http://localhost');

  if (req.method === 'GET' && url.pathname === '/api/content') {
    fs.readFile(contentFile, 'utf8', (err, raw) => {
      if (err) return sendJson(res, 500, { ok: false, error: 'Cannot read content.json' });
      try {
        sendJson(res, 200, JSON.parse(raw));
      } catch {
        sendJson(res, 500, { ok: false, error: 'Invalid content.json' });
      }
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/content') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 10 * 1024 * 1024) {
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        fs.writeFile(contentFile, JSON.stringify(parsed, null, 2) + '\n', 'utf8', (err) => {
          if (err) return sendJson(res, 500, { ok: false, error: 'Cannot write content.json' });
          sendJson(res, 200, { ok: true, savedTo: 'content.json' });
        });
      } catch {
        sendJson(res, 400, { ok: false, error: 'Invalid JSON body' });
      }
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/publish') {
    publishRepo()
      .then(result => sendJson(res, 200, result))
      .catch(error => sendJson(res, 500, { ok: false, error: error.message }));
    return;
  }

  let reqPath = decodeURIComponent(url.pathname.replace(/^\/+/, ''));
  if (!reqPath) reqPath = 'index.html';
  const filePath = path.join(root, reqPath);

  if (!filePath.startsWith(root)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    res.writeHead(200, {
      'Content-Type': mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    fs.createReadStream(filePath).pipe(res);
  });
}

function startServer(index = 0) {
  if (index >= preferredPorts.length) {
    console.error('Could not start server on preferred ports:', preferredPorts.join(', '));
    process.exit(1);
  }

  const port = preferredPorts[index];
  const server = http.createServer(serveFile);

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
      startServer(index + 1);
    } else {
      console.error(err);
      process.exit(1);
    }
  });

  server.listen(port, '127.0.0.1', () => {
    console.log(`Portfolio server running at http://localhost:${port}/`);
    console.log(`Index: http://localhost:${port}/index.html`);
    console.log(`Local admin: http://localhost:${port}/local-admin.html`);
    console.log(`API:   http://localhost:${port}/api/content`);
  });
}

startServer();
