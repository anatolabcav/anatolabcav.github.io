
(() => {
  const $ = (id) => document.getElementById(id);
  const CHAVE_TOKEN = 'anatobriga:token';

  let ws = null;
  let tentativas = 0;
  let token = null;
  let icones = [];
  let iconeEscolhido = null;
  let minhaEquipe = null;
  let editando = false;
  let pedidoPendente = false;
  let estado = null;
  let relogio = null;

  function mostrarConexao(estadoCx, texto) {
    $('conexao').dataset.estado = estadoCx;
    $('conexaoTexto').textContent = texto;
  }

  function conectar() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

    mostrarConexao('ligando', 'Conectando…');
    const protocolo = location.protocol === 'https:' ? 'wss:' : 'ws:';
    try {
      ws = new WebSocket(`${protocolo}//${location.host}/ws`);
    } catch {
      return reagendar();
    }

    ws.addEventListener('open', () => {
      tentativas = 0;
      enviar({ tipo: 'ola', papel: 'equipe', token: localStorage.getItem(CHAVE_TOKEN) || undefined });
    });

    ws.addEventListener('message', (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      receber(msg);
    });

    ws.addEventListener('close', () => {
      mostrarConexao('caiu', 'Sem conexão, tentando de novo');
      reagendar();
    });
    ws.addEventListener('error', () => {  });
  }

  function reagendar() {
    tentativas = Math.min(tentativas + 1, 8);
    setTimeout(conectar, 400 * tentativas);
  }

  const enviar = (msg) => {
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
  };

  function receber(msg) {
    switch (msg.tipo) {
      case 'ola-ok':
        token = msg.token;
        localStorage.setItem(CHAVE_TOKEN, token);
        mostrarConexao('ligado', 'Conectado');
        if (minhaEquipe || msg.reconexao) enviar({ tipo: 'entrar' });
        break;

      case 'sua-equipe':
        minhaEquipe = msg.equipe;
        if (msg.equipe.iconeId) iconeEscolhido = msg.equipe.iconeId;
        pedidoPendente = false;
        editando = false;
        $('botaoEntrar').disabled = false;
        $('avisoEntrar').textContent = '';
        $('campoNome').value = msg.equipe.nome || '';
        marcarSelecionado();
        atualizarEscolhido();
        desenharTelas();
        break;

      case 'recusado':
        pedidoPendente = false;
        $('avisoEntrar').textContent = msg.motivo || 'Não deu para entrar agora.';
        $('botaoEntrar').disabled = false;
        break;

      case 'estado':
        estado = msg;
        desenharTelas();
        break;

      case 'substituido':
        mostrarConexao('caiu', 'Este celular foi aberto em outra aba');
        break;
    }
  }

  async function carregarIcones() {
    try {
      icones = await (await fetch('assets/icons/icones.json')).json();
    } catch {
      icones = [];
    }
    if (!iconeEscolhido && icones.length) iconeEscolhido = icones[0].id;
    montarGaleria();
    atualizarEscolhido();
  }

  const urlDoIcone = (ic) => `assets/icons/${ic.arquivo}`;
  const acharIcone = (id) => icones.find((i) => i.id === id);

  function montarGaleria() {
    const g = $('galeria');
    g.innerHTML = '';
    for (const ic of icones) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'galeria-item';
      b.dataset.icone = ic.id;
      b.setAttribute('aria-pressed', String(ic.id === iconeEscolhido));
      b.innerHTML = `<img src="${urlDoIcone(ic)}" alt="" loading="lazy"><span>${ic.nome}</span>`;
      b.addEventListener('click', () => {
        const antes = acharIcone(iconeEscolhido);
        iconeEscolhido = ic.id;
        const campo = $('campoNome');
        if (!campo.value.trim() || (antes && campo.value.trim() === antes.nome)) {
          campo.value = ic.nome;
        }
        marcarSelecionado();
        atualizarEscolhido();
      });
      g.appendChild(b);
    }
    marcarSelecionado();
  }

  function marcarSelecionado() {
    for (const b of $('galeria').children) {
      b.setAttribute('aria-pressed', String(b.dataset.icone === iconeEscolhido));
    }
  }

  function atualizarEscolhido() {
    const ic = acharIcone(iconeEscolhido);
    if (!ic) return;
    $('escolhidoImg').src = urlDoIcone(ic);
    $('escolhidoNome').textContent = $('campoNome').value.trim() || ic.nome;
  }

  $('campoNome').addEventListener('input', atualizarEscolhido);

  /**
   * Manda o pedido para o telão. Com equipe já formada o tipo é 'trocar', que
   * atualiza a que existe; sem equipe é 'entrar', que cria uma nova.
   */
  function pedirParaEntrar() {
    const ic = acharIcone(iconeEscolhido);
    const nome = $('campoNome').value.trim() || (ic ? ic.nome : '');
    pedidoPendente = true;
    $('botaoEntrar').disabled = true;
    enviar({ tipo: minhaEquipe ? 'trocar' : 'entrar', nome, iconeId: iconeEscolhido });
  }

  $('botaoEntrar').addEventListener('click', () => {
    $('avisoEntrar').textContent = '';
    pedirParaEntrar();
    setTimeout(() => {
      if (!pedidoPendente) return;
      pedidoPendente = false;
      $('botaoEntrar').disabled = false;
      $('avisoEntrar').textContent =
        'O telão não respondeu. Confira se o professor já abriu o jogo no notebook.';
    }, 4000);
  });

  $('botaoTrocar').addEventListener('click', () => {
    editando = true;
    pedidoPendente = false;
    $('botaoEntrar').disabled = false;
    $('botaoEntrar').textContent = 'Salvar';
    $('avisoEntrar').textContent = '';
    if (minhaEquipe) $('campoNome').value = minhaEquipe.nome || '';
    atualizarEscolhido();
    desenharTelas();
  });

  function vibrar(padrao) {
    try { navigator.vibrate && navigator.vibrate(padrao); } catch {  }
  }

  function rolar() {
    enviar({ tipo: 'rolar' });
    vibrar(40);
  }

  function tentar() {
    enviar({ tipo: 'tentar' });
    vibrar([60, 40, 60]);
  }

  function responder(letra) {
    enviar({ tipo: 'responder', escolha: letra });
    vibrar(50);
  }

  const COR_OPCAO = { A: 'var(--alt-a)', B: 'var(--alt-b)', C: 'var(--alt-c)',
                      D: 'var(--alt-d)', V: 'var(--alt-v)', F: 'var(--alt-f)' };

  /** Botões de resposta: um por alternativa, grandes o bastante para o polegar. */
  function montarOpcoes(alvo, opcoes) {
    const grade = document.createElement('div');
    grade.className = 'opcoes' + (opcoes.length <= 2 ? ' duplas' : '');

    for (const o of opcoes) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'opcao';
      b.style.setProperty('--cor', COR_OPCAO[o.letra] || 'var(--ink2)');
      b.innerHTML = '<b></b><span></span>';
      b.querySelector('b').textContent = o.letra;
      b.querySelector('span').textContent = o.texto;
      b.addEventListener('click', () => {
        for (const outro of grade.children) outro.disabled = true;
        b.classList.add('escolhida');
        responder(o.letra);
      });
      grade.appendChild(b);
    }
    alvo.appendChild(grade);
  }

  const telas = ['telaEntrar', 'telaEspera', 'telaJogo', 'telaFim'];
  function mostrarTela(id) {
    for (const t of telas) $(t).classList.toggle('oculta', t !== id);
  }

  const souEuAVez = () => estado && token && estado.vezToken === token;
  const minhaLinha = () => (estado && estado.equipes || []).find((e) => e.token === token);

  function desenharTelas() {
    if (editando && estado && estado.fase && !['parado', 'fim'].includes(estado.fase)) {
      editando = false;
    }
    if (!minhaEquipe || editando) { mostrarTela('telaEntrar'); return; }

    const emJogo = estado && estado.fase && !['parado', 'fim'].includes(estado.fase);

    if (estado && estado.fase === 'fim') {
      mostrarTela('telaFim');
      const venci = estado.vencedor && estado.vencedor.token === token;
      $('fimTrofeu').hidden = !estado.vencedor;
      $('fimTexto').textContent = estado.vencedor
        ? (venci ? 'Vocês são um cocô vencedor!'
                 : `${estado.vencedor.nome} é um cocô vencedor`)
        : 'Fim de jogo';
      const eu = minhaLinha();
      $('fimSub').textContent = eu ? `Vocês pararam na casa ${eu.casa}.` : '';
      return;
    }

    if (!emJogo) {
      mostrarTela('telaEspera');
      $('esperaImg').src = minhaEquipe.icone;
      $('esperaImg').style.borderColor = minhaEquipe.cor;
      $('esperaNome').textContent = minhaEquipe.nome;
      desenharListaEquipes('listaEsperaEquipes');
      return;
    }

    mostrarTela('telaJogo');
    desenharTopo();
    desenharAcao();
    desenharListaEquipes('listaEquipes');
  }

  function desenharTopo() {
    const eu = minhaLinha();
    $('jogoImg').src = minhaEquipe.icone;
    $('jogoImg').style.borderColor = minhaEquipe.cor;
    $('jogoNome').textContent = minhaEquipe.nome;
    $('jogoCasa').textContent = eu
      ? (eu.pulos > 0
          ? `parada ${eu.pulos} jogada${eu.pulos > 1 ? 's' : ''}`
          : `casa ${eu.casa} de ${estado.ultimaCasa}`)
      : '';
  }

  function desenharAcao() {
    const alvo = $('acao');
    const fase = estado.fase;
    const minha = souEuAVez();
    const perg = estado.pergunta;
    const fechada = !!perg && perg.tipo !== 'aberta';
    const jaEscolheu = !!estado.escolha;
    const fuiEu = jaEscolheu && estado.escolha.token === token;

    let titulo, sub = '', botao = null, opcoes = null, resultado = null;

    if (fase === 'esperando_dado' && minha) {
      titulo = 'É a sua vez';
      sub = 'Role o dado e veja a pergunta no telão.';
      botao = { texto: 'Rolar o dado', classe: 'botao-dado pulsa', acao: rolar };

    } else if (fase === 'esperando_dado') {
      titulo = `Vez de ${estado.vezNome || 'outra equipe'}`;
      sub = estado.rouboLigado === false
        ? 'Aguarde a sua vez.'
        : 'Prepare-se: se eles errarem, o roubo abre para vocês.';

    } else if (fase === 'pergunta' && minha) {
      if (fechada) {
        titulo = 'Qual é a resposta?';
        sub = 'A pergunta está no telão.';
        opcoes = perg.opcoes;
      } else {
        titulo = 'Respondam em voz alta';
        sub = 'O professor está ouvindo.';
      }

    } else if (fase === 'pergunta') {
      titulo = `${estado.vezNome || 'A outra equipe'} está respondendo`;
      sub = 'Olho no telão.';

    } else if (fase === 'roubo_aberto' && !minha) {
      titulo = 'Roubo aberto!';
      if (fechada) {
        sub = `A primeira equipe que tocar leva a chance. Vale +${estado.bonusRoubo} casas.`;
        opcoes = perg.opcoes;
      } else {
        sub = `Quem apertar primeiro responde. Vale +${estado.bonusRoubo} casas.`;
        botao = { texto: 'TENTAR!', classe: 'botao-tentar pulsa', acao: tentar };
      }

    } else if (fase === 'roubo_aberto') {
      titulo = 'Roubo aberto';
      sub = 'As outras equipes estão tentando.';

    } else if (fase === 'roubo_respondendo') {
      const euRoubo = estado.ladraoToken === token;
      titulo = euRoubo ? 'Vocês pegaram!' : 'Outra equipe pegou o roubo';
      sub = euRoubo ? 'Respondam agora, em voz alta.' : 'Olho no telão.';

    } else if (jaEscolheu) {
      const certo = !!estado.escolha.certa;
      titulo = fuiEu ? (certo ? 'Acertaram!' : 'Não foi dessa vez') : 'Resposta enviada';
      sub = estado.gabarito ? `Resposta certa: ${estado.gabarito}` : 'Olho no telão.';
      resultado = { letra: estado.escolha.letra, certo };

    } else {
      titulo = minha ? 'É a sua vez' : `Vez de ${estado.vezNome || 'outra equipe'}`;
      sub = 'Um instante…';
    }

    if (opcoes && fuiEu) {
      opcoes = null;
      titulo = `Vocês responderam ${estado.escolha.letra}`;
      sub = 'Aguardando o gabarito.';
    }

    const assinatura = [fase, minha, titulo, sub, botao && botao.texto,
                        opcoes && opcoes.map((o) => o.letra).join(''),
                        resultado && resultado.letra + resultado.certo,
                        estado.gabarito].join('|');
    if (alvo.dataset.assinatura === assinatura) return;
    alvo.dataset.assinatura = assinatura;

    alvo.innerHTML = '';
    const h = document.createElement('div');
    h.className = 'acao-titulo';
    h.textContent = titulo;
    const p = document.createElement('p');
    p.className = 'acao-sub';
    p.textContent = sub;
    alvo.append(h, p);

    if (resultado) {
      const selo = document.createElement('div');
      selo.className = 'selo-resultado ' + (resultado.certo ? 'certo' : 'errado');
      selo.textContent = resultado.certo ? '✓' : '✕';
      alvo.appendChild(selo);
    }

    if (opcoes) montarOpcoes(alvo, opcoes);

    if (botao) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `botao-grande acao-botao ${botao.classe}`;
      b.textContent = botao.texto;
      b.addEventListener('click', () => {
        b.disabled = true;
        b.classList.remove('pulsa');
        botao.acao();
      });
      alvo.appendChild(b);
    }
  }

  function desenharListaEquipes(id) {
    const alvo = $(id);
    if (!alvo || !estado) return;
    alvo.innerHTML = '';
    for (const e of estado.equipes || []) {
      const item = document.createElement('div');
      item.className = 'mini-equipe'
        + (e.token && e.token === token ? ' eu' : '')
        + (e.token && e.token === estado.vezToken ? ' da-vez' : '');
      const img = document.createElement('img');
      img.src = e.icone; img.alt = ''; img.style.borderColor = e.cor;
      const txt = document.createElement('div');
      txt.innerHTML = `<b></b><br><small>casa ${e.casa}</small>`;
      txt.querySelector('b').textContent = e.nome;
      item.append(img, txt);
      alvo.appendChild(item);
    }
  }

  function tiquetaque() {
    const alvo = $('jogoRelogio');
    const fim = estado && estado.fimDoCronometro;
    if (!fim) { alvo.hidden = true; return; }

    const faltam = Math.max(0, Math.ceil((fim - Date.now()) / 1000));
    alvo.hidden = false;
    alvo.textContent = faltam;
    alvo.classList.toggle('urgente', faltam <= 5);
  }
  relogio = setInterval(tiquetaque, 200);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) conectar();
  });

  carregarIcones();
  conectar();
})();
