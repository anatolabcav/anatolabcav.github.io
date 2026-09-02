
window.TRATO = window.TRATO || {};

TRATO.Sincronia = (() => {
  let ws = null;
  let ligado = false;
  let tentativas = 0;
  let ultimoEstado = null;
  let desistiu = false;

  const ouvintes = {
    entrar:   [],
    trocar:   [],
    rolar:    [],
    tentar:   [],
    responder:[],
    sair:     [],
    conexao:  [],
    celular:  [],
  };

  const avisar = (evento, dados) => {
    for (const fn of ouvintes[evento] || []) {
      try { fn(dados); } catch (e) { console.error(`[sincronia] erro em ${evento}:`, e); }
    }
  };

  function conectar() {
    if (desistiu) return;
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

    const protocolo = location.protocol === 'https:' ? 'wss:' : 'ws:';
    try {
      ws = new WebSocket(`${protocolo}//${location.host}/ws`);
    } catch {
      return reagendar();
    }

    ws.addEventListener('open', () => {
      tentativas = 0;
      ws.send(JSON.stringify({ tipo: 'ola', papel: 'projetor' }));
    });

    ws.addEventListener('message', (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }

      if (msg.tipo === 'ola-ok') {
        ligado = true;
        avisar('conexao', { ligado: true });
        if (ultimoEstado) enviarEstado(ultimoEstado);
        return;
      }

      if (msg.tipo === 'substituido') {
        desistiu = true;
        ligado = false;
        avisar('conexao', { ligado: false, motivo: 'substituido' });
        ws.close();
        return;
      }

      if (msg.tipo === 'celular-chegou' || msg.tipo === 'celular-saiu') {
        avisar('celular', { token: msg.de, chegou: msg.tipo === 'celular-chegou', reconexao: !!msg.reconexao });
        return;
      }

      if (ouvintes[msg.tipo]) avisar(msg.tipo, msg);
    });

    ws.addEventListener('close', () => {
      if (ligado) avisar('conexao', { ligado: false });
      ligado = false;
      reagendar();
    });

    ws.addEventListener('error', () => {  });
  }

  /** Reconecta com espera crescente, para não martelar a rede do hotspot. */
  function reagendar() {
    if (desistiu) return;
    tentativas = Math.min(tentativas + 1, 6);
    setTimeout(conectar, 500 * tentativas);
  }

  const enviar = (msg) => {
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
  };

  /** Retrato do jogo, mandado a cada mudança. Guardado para quem chegar depois. */
  function enviarEstado(estado) {
    ultimoEstado = estado;
    enviar({ tipo: 'estado', para: 'todos', ...estado });
  }

  /** Recado para um celular só (ex.: "a partida já começou, não dá para entrar"). */
  function enviarPara(token, msg) {
    enviar({ ...msg, para: token });
  }

  return {
    conectar,
    enviarEstado,
    enviarPara,
    get ligado() { return ligado; },
    ao(evento, fn) {
      if (!ouvintes[evento]) ouvintes[evento] = [];
      ouvintes[evento].push(fn);
    },
  };
})();
