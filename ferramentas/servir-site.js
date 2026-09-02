
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', 'site');
const PORTA = Number(process.env.PORTA) || 4173;

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon'
};

const servidor = http.createServer((req, res) => {
  let caminho = decodeURIComponent(req.url.split('?')[0]);
  if (caminho.endsWith('/')) caminho += 'index.html';

  const arquivo = path.normalize(path.join(RAIZ, caminho));
  if (!arquivo.startsWith(RAIZ)) {
    res.writeHead(403);
    return res.end('403');
  }

  if (!fs.existsSync(arquivo) || fs.statSync(arquivo).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end('<meta charset="utf-8"><p style="font:16px system-ui;padding:40px">' +
                   'Página não encontrada: ' + caminho + '</p>');
  }

  res.writeHead(200, {
    'Content-Type': TIPOS[path.extname(arquivo).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': 'no-store'
  });
  fs.createReadStream(arquivo).pipe(res);
});

servidor.listen(PORTA, () => {
  console.log('');
  console.log('  O site está no ar em:  http://localhost:' + PORTA);
  console.log('');
  console.log('  Abra esse endereço no navegador.');
  console.log('  Para parar, feche esta janela ou aperte Ctrl+C.');
  console.log('');
});

servidor.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error('\n  A porta ' + PORTA + ' já está ocupada.');
    console.error('  Provavelmente o site já está aberto: http://localhost:' + PORTA);
    console.error('  Se não estiver, rode com outra porta:  PORTA=4174 node ferramentas/servir-site.js\n');
    process.exit(1);
  }
  throw e;
});
