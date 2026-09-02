
const crypto = require('crypto');
const { WebSocketServer } = require('ws');

/** Tipos que um celular pode mandar. Qualquer outro é descartado. */
const DO_CELULAR = new Set(['entrar', 'trocar', 'rolar', 'tentar', 'responder', 'sair']);

function criarHub(servidorHttp, { aoMudar } = {}) {
  const wss = new WebSocketServer({ server: servidorHttp, path: '/ws' });

  let projetor = null;
  const celulares = new Map();

  const enviar = (ws, msg) => {
    if (ws && ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
  };
  const paraProjetor = (msg) => enviar(projetor, msg);
  const paraTodosOsCelulares = (msg) => {
    for (const ws of celulares.values()) enviar(ws, msg);
  };

  const avisarMudanca = () => aoMudar && aoMudar({
    projetorLigado: !!(projetor && projetor.readyState === projetor.OPEN),
    celulares: celulares.size,
  });

  wss.on('connection', (ws) => {
    ws.papel = null;
    ws.token = null;
    ws.vivo = true;
    ws.on('pong', () => { ws.vivo = true; });

    ws.on('message', (cru) => {
      let msg;
      try { msg = JSON.parse(cru); } catch { return; }
      if (!msg || typeof msg.tipo !== 'string') return;

      if (msg.tipo === 'ola') {
        if (msg.papel === 'projetor') {
          if (projetor && projetor !== ws) enviar(projetor, { tipo: 'substituido' });
          projetor = ws;
          ws.papel = 'projetor';
          enviar(ws, { tipo: 'ola-ok', papel: 'projetor', celulares: [...celulares.keys()] });
          console.log('[ws] telão conectado');
        } else {
          const token = (typeof msg.token === 'string' && msg.token.length === 36)
            ? msg.token : crypto.randomUUID();
          const reconexao = celulares.has(token);

          const anterior = celulares.get(token);
          if (anterior && anterior !== ws) enviar(anterior, { tipo: 'substituido' });

          ws.papel = 'equipe';
          ws.token = token;
          celulares.set(token, ws);
          enviar(ws, { tipo: 'ola-ok', papel: 'equipe', token, reconexao });
          paraProjetor({ tipo: 'celular-chegou', de: token, reconexao });
          console.log(`[ws] celular ${reconexao ? 'voltou' : 'entrou'} (${celulares.size} no total)`);
        }
        avisarMudanca();
        return;
      }

      if (ws.papel === 'projetor') {
        const { para, ...resto } = msg;
        if (!para || para === 'todos') paraTodosOsCelulares(resto);
        else enviar(celulares.get(para), resto);
        return;
      }

      if (ws.papel === 'equipe' && DO_CELULAR.has(msg.tipo)) {
        paraProjetor({ ...msg, de: ws.token });
      }
    });

    ws.on('close', () => {
      if (ws.papel === 'projetor' && projetor === ws) {
        projetor = null;
        console.log('[ws] telão desconectado');
      }
      if (ws.papel === 'equipe' && celulares.get(ws.token) === ws) {
        celulares.delete(ws.token);
        paraProjetor({ tipo: 'celular-saiu', de: ws.token });
        console.log(`[ws] celular saiu (${celulares.size} restantes)`);
      }
      avisarMudanca();
    });
  });

  const batida = setInterval(() => {
    for (const ws of wss.clients) {
      if (!ws.vivo) { ws.terminate(); continue; }
      ws.vivo = false;
      ws.ping();
    }
  }, 20000);
  wss.on('close', () => clearInterval(batida));

  return {
    get situacao() {
      return {
        projetorLigado: !!(projetor && projetor.readyState === projetor.OPEN),
        celulares: celulares.size,
      };
    },
  };
}

module.exports = { criarHub };
