const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const preferredPorts = [8933, 8934, 8940, 8950];

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

function serveFile(req, res) {
  const url = new URL(req.url, 'http://localhost');
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
    console.log(`Admin: http://localhost:${port}/admin.html`);
  });
}

startServer();
