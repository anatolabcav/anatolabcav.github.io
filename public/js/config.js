
window.TRATO = window.TRATO || {};

TRATO.Config = (() => {
  const $ = (id) => document.getElementById(id);

  const MIN_EQUIPES = 2;
  const MAX_EQUIPES = 6;

  let icones = [];
  let perguntas = [];
  let origemPerguntas = '';
  let equipes = [];
  let penalidades = [];
  let vantagens = [];
  let equipeEmEdicao = null;

  let proximoId = 1;

  async function carregarIcones() {
    try {
      const r = await fetch('assets/icons/icones.json');
      icones = await r.json();
    } catch {
      icones = [];
      console.error('Não consegui ler assets/icons/icones.json, a galeria de comidas ficará vazia.');
    }
    montarGaleria();
  }

  const urlDoIcone = (ic) => `assets/icons/${ic.arquivo}`;

  function montarGaleria() {
    const g = $('galeriaIcones');
    g.innerHTML = '';
    for (const ic of icones) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'galeria-item';
      b.dataset.icone = ic.id;
      b.innerHTML = `<img src="${urlDoIcone(ic)}" alt="" loading="lazy"><span>${ic.nome}</span>`;
      b.addEventListener('click', () => escolherIcone(ic.id, urlDoIcone(ic), ic.nome));
      g.appendChild(b);
    }
  }

  /**
   * A cor não vem do ícone: vem da paleta, uma por equipe.
   * É ela que separa os marcadores no tabuleiro, e as comidas são quase todas
   * alaranjadas, e tirar a cor da imagem deixaria duas equipes idênticas de longe.
   */
  function corLivre(exceto) {
    const usadas = equipes.filter((e) => e !== exceto).map((e) => e.cor);
    return TRATO.PALETA_EQUIPES.find((c) => !usadas.includes(c)) || TRATO.PALETA_EQUIPES[0];
  }

  function abrirGaleria(equipe) {
    equipeEmEdicao = equipe;
    for (const b of $('galeriaIcones').children) {
      b.setAttribute('aria-pressed', String(b.dataset.icone === equipe.iconeId));
    }
    $('dialogoIcones').showModal();
  }

  function escolherIcone(id, url, nomeComida) {
    if (!equipeEmEdicao) return;
    equipeEmEdicao.iconeId = id;
    equipeEmEdicao.icone = url;
    if (!equipeEmEdicao.nomeEditado && nomeComida) equipeEmEdicao.nome = nomeComida;
    $('dialogoIcones').close();
    desenharEquipes();
    revalidar();
  }

  $('uploadIcone').addEventListener('change', (ev) => {
    const arq = ev.target.files && ev.target.files[0];
    if (!arq || !equipeEmEdicao) return;
    const leitor = new FileReader();
    leitor.onload = () => escolherIcone('proprio', leitor.result, null);
    leitor.readAsDataURL(arq);
    ev.target.value = '';
  });

  function novaEquipe() {
    const usados = equipes.map((e) => e.iconeId);
    const ic = icones.find((i) => !usados.includes(i.id)) || icones[0];
    if (!ic) return null;
    return {
      id: 'eq' + proximoId++,
      nome: ic.nome,
      nomeEditado: false,
      iconeId: ic.id,
      icone: urlDoIcone(ic),
      cor: corLivre(null),
    };
  }

  function montarSeletorDeCor(eq) {
    const caixa = document.createElement('div');
    caixa.className = 'equipe-cor-caixa';

    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'equipe-cor';
    botao.style.background = eq.cor;
    botao.title = 'Trocar a cor desta equipe';
    botao.setAttribute('aria-label', `Trocar a cor da equipe ${eq.nome}`);
    botao.setAttribute('aria-expanded', 'false');

    const paleta = document.createElement('div');
    paleta.className = 'paleta';
    paleta.hidden = true;

    for (const cor of TRATO.PALETA_EQUIPES) {
      const opcao = document.createElement('button');
      opcao.type = 'button';
      opcao.className = 'paleta-cor';
      opcao.style.background = cor;
      opcao.setAttribute('aria-label', cor);
      opcao.setAttribute('aria-pressed', String(cor === eq.cor));
      opcao.addEventListener('click', () => {
        const dona = equipes.find((o) => o !== eq && o.cor === cor);
        if (dona) dona.cor = eq.cor;
        eq.cor = cor;
        fecharPaletas();
        desenharEquipes();
        revalidar();
      });
      paleta.appendChild(opcao);
    }

    botao.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const abrindo = paleta.hidden;
      fecharPaletas();
      paleta.hidden = !abrindo;
      botao.setAttribute('aria-expanded', String(abrindo));
    });

    caixa.append(botao, paleta);
    return caixa;
  }

  function fecharPaletas() {
    for (const p of document.querySelectorAll('.paleta')) p.hidden = true;
    for (const b of document.querySelectorAll('.equipe-cor')) b.setAttribute('aria-expanded', 'false');
  }
  document.addEventListener('click', fecharPaletas);
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') fecharPaletas(); });

  const semMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** A equipe que acabou de ser criada, para só ela entrar animada. */
  let recemCriada = null;

  function desenharEquipes() {
    const lista = $('equipesLista');
    lista.innerHTML = '';

    equipes.forEach((eq, i) => {
      const linha = document.createElement('div');
      linha.className = 'equipe-linha';
      linha.dataset.equipe = eq.id;
      if (eq.id === recemCriada) linha.classList.add('nova');
      if (eq.offline) linha.classList.add('offline');

      const botaoIcone = document.createElement('button');
      botaoIcone.type = 'button';
      botaoIcone.className = 'equipe-icone';
      botaoIcone.title = 'Trocar o ícone desta equipe';
      botaoIcone.setAttribute('aria-label', `Trocar o ícone da equipe ${eq.nome}`);
      botaoIcone.style.borderColor = eq.cor;
      botaoIcone.innerHTML = `<img src="${eq.icone}" alt="">`;
      botaoIcone.addEventListener('click', () => abrirGaleria(eq));

      const seletorCor = montarSeletorDeCor(eq);

      const campoNome = document.createElement('input');
      campoNome.className = 'equipe-nome';
      campoNome.value = eq.nome;
      campoNome.maxLength = 28;
      campoNome.setAttribute('aria-label', `Nome da equipe ${i + 1}`);
      campoNome.addEventListener('input', () => {
        eq.nome = campoNome.value;
        eq.nomeEditado = true;
        revalidar();
      });

      const botaoRemover = document.createElement('button');
      botaoRemover.type = 'button';
      botaoRemover.className = 'equipe-remover';
      botaoRemover.textContent = '×';
      botaoRemover.title = 'Remover equipe';
      botaoRemover.setAttribute('aria-label', `Remover a equipe ${eq.nome}`);
      botaoRemover.disabled = equipes.length <= MIN_EQUIPES;
      botaoRemover.addEventListener('click', () => {
        equipes = equipes.filter((o) => o.id !== eq.id);
        desenharEquipes();
        revalidar();
      });

      linha.append(botaoIcone, seletorCor, campoNome);

      if (eq.token) {
        const selo = document.createElement('span');
        selo.className = 'selo-celular';
        selo.textContent = eq.offline ? 'caiu' : 'celular';
        selo.title = eq.offline
          ? 'O celular desta equipe perdeu a conexão. Ela continua jogando pelo telão.'
          : 'Esta equipe entrou pelo celular e controla o próprio dado.';
        linha.appendChild(selo);
      }

      linha.appendChild(botaoRemover);
      lista.appendChild(linha);
    });

    $('botaoAddEquipe').disabled = equipes.length >= MAX_EQUIPES;
  }

  $('botaoAddEquipe').addEventListener('click', () => {
    if (equipes.length >= MAX_EQUIPES) return;
    const nova = novaEquipe();
    if (nova) equipes.push(nova);
    recemCriada = nova ? nova.id : null;
    desenharEquipes();
    recemCriada = null;
    revalidar();
  });

  function ajustarAltura(el) {
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }

  function campoDeTexto(classe, valor, rotulo, aoDigitar) {
    const el = document.createElement('textarea');
    el.className = classe;
    el.value = valor;
    el.rows = 1;
    el.setAttribute('aria-label', rotulo);
    el.addEventListener('input', () => { aoDigitar(el.value); ajustarAltura(el); });
    el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') ev.preventDefault(); });
    return el;
  }

  function desenharCartas(cartas, idDaLista, familia) {
    const lista = $(idDaLista);
    lista.innerHTML = '';

    for (const p of cartas) {
      const cartao = document.createElement('div');
      cartao.className = 'pen-cartao';
      cartao.dataset.ativa = String(!!p.ativa);
      cartao.dataset.familia = familia;

      const marca = document.createElement('input');
      marca.type = 'checkbox';
      marca.checked = !!p.ativa;
      marca.setAttribute('aria-label', `Usar ${p.nome}`);
      marca.addEventListener('change', () => {
        p.ativa = marca.checked;
        cartao.dataset.ativa = String(p.ativa);
        revalidar();
      });

      const campos = document.createElement('div');
      campos.className = 'pen-campos';

      const linhaNome = document.createElement('div');
      linhaNome.className = 'pen-linha-nome';

      const nome = campoDeTexto('pen-nome', p.nome, 'Nome', (v) => { p.nome = v; });
      linhaNome.appendChild(nome);

      const efeito = campoDeTexto('pen-efeito', p.efeito, 'Texto do efeito', (v) => { p.efeito = v; });

      const onde = document.createElement('small');
      onde.className = 'pen-onde';
      onde.textContent = p.regioes ? p.regioes.join(' · ') : 'em qualquer região';

      campos.append(linhaNome, efeito, onde);
      cartao.append(marca, campos);
      lista.appendChild(cartao);
      ajustarAltura(nome);
      ajustarAltura(efeito);
    }

    if (!lista.dataset.observado) {
      lista.dataset.observado = '1';
      new ResizeObserver(() => {
        lista.querySelectorAll('.pen-nome, .pen-efeito').forEach(ajustarAltura);
      }).observe(lista);
    }
  }

  const desenharPenalidades = () => desenharCartas(penalidades, 'penLista', 'penalidade');
  const desenharVantagens   = () => desenharCartas(vantagens,   'vanLista', 'vantagem');

  /** Cartas que podem cair no sorteio desta partida. */
  const penalidadesValidas = () => penalidades.filter((p) => p.ativa);
  const vantagensValidas   = () => vantagens.filter((p) => p.ativa);

  function mostrarEstadoPlanilha(estado, titulo, detalhe) {
    if (estado === 'erro') $('cartaoPlanilha').open = true;
    $('planilhaEstado').dataset.estado = estado;
    $('planilhaTitulo').textContent = titulo;
    $('planilhaDetalhe').textContent = detalhe || '';
  }

  function aplicarResultado(r) {
    if (r.ok) {
      perguntas = r.perguntas;
      origemPerguntas = r.caminho;

      const c = r.contagem || {};
      const composicao = [
        c.multipla ? `${c.multipla} de múltipla escolha` : '',
        c.vf ? `${c.vf} de verdadeiro ou falso` : '',
        c.aberta ? `${c.aberta} aberta${c.aberta > 1 ? 's' : ''}` : '',
      ].filter(Boolean).join(' · ');

      const avisos = [];
      if (r.ignoradas) avisos.push(`${r.ignoradas} linha(s) sem enunciado ignoradas`);
      if (r.rebaixadas && r.rebaixadas.length) {
        avisos.push(`${r.rebaixadas.length} sem gabarito válido viraram perguntas abertas`);
      }

      mostrarEstadoPlanilha(
        'ok',
        `${perguntas.length} perguntas prontas`,
        `${composicao}${avisos.length ? ' · ' + avisos.join(' · ') : ''}\n${r.caminho}`
      );

      if (r.rebaixadas && r.rebaixadas.length) {
        console.warn('Perguntas sem gabarito válido (viraram abertas):',
          r.rebaixadas.map((x) => `linha ${x.linha}: ${x.motivo}`).join(' | '));
      }
    } else {
      perguntas = [];
      origemPerguntas = '';
      mostrarEstadoPlanilha('erro', 'Não deu para usar a planilha', r.erro);
    }
    revalidar();
  }

  async function buscarPerguntas() {
    mostrarEstadoPlanilha('carregando', 'Procurando a planilha…', 'um instante');
    try {
      const r = await fetch('api/perguntas');
      aplicarResultado(await r.json());
    } catch {
      mostrarEstadoPlanilha('erro', 'O servidor não respondeu',
        'A janela preta do TRATO precisa ficar aberta enquanto o jogo roda. Se você a fechou, inicie de novo.');
      revalidar();
    }
  }

  $('botaoReprocurar').addEventListener('click', buscarPerguntas);
  $('botaoEscolherArquivo').addEventListener('click', () => $('arquivoPlanilha').click());

  $('arquivoPlanilha').addEventListener('change', async (ev) => {
    const arq = ev.target.files && ev.target.files[0];
    ev.target.value = '';
    if (!arq) return;
    mostrarEstadoPlanilha('carregando', 'Lendo o arquivo…', arq.name);
    try {
      const r = await fetch('api/perguntas/arquivo?nome=' + encodeURIComponent(arq.name), {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: await arq.arrayBuffer(),
      });
      aplicarResultado(await r.json());
    } catch {
      mostrarEstadoPlanilha('erro', 'Não consegui enviar o arquivo',
        'Verifique se a janela preta do TRATO continua aberta e tente de novo.');
      revalidar();
    }
  });

  $('linkDiagnostico').addEventListener('click', async (ev) => {
    ev.preventDefault();
    try {
      const r = await (await fetch('api/onde-procurei')).json();
      TRATO.Aviso.avisar({
        titulo: 'Onde procurei a planilha',
        texto: `Nesta ordem, e em cada pasta serve "${r.nomeArquivo}" ou qualquer `
             + 'arquivo que comece com "perguntas" e seja .xlsx, .xls ou .csv:',
        linhas: r.pastas,
      });
    } catch {
      TRATO.Aviso.avisar({
        tom: 'erro',
        titulo: 'O servidor não respondeu',
        texto: 'A janela preta do jogo precisa continuar aberta enquanto a aula roda.',
      });
    }
  });

  const numero = (id, padrao) => {
    const v = Number($(id).value);
    return Number.isFinite(v) ? v : padrao;
  };

  const abertasEntram = () => $('abertasLigadas').checked;

  const perguntasDaPartida = () =>
    abertasEntram() ? perguntas : perguntas.filter((p) => p.tipo !== 'aberta');

  function revalidar() {
    const problemas = [];
    const doJogo = perguntasDaPartida();
    const abertas = perguntas.length - doJogo.length;

    $('abertasNota').textContent = abertasEntram()
      ? 'as sem alternativa, respondidas em voz alta e julgadas por você'
      : `${abertas} pergunta(s) da planilha ficam de fora desta partida`;

    if (!perguntas.length) problemas.push('faltam as perguntas');
    else if (!doJogo.length) problemas.push('só há perguntas abertas, e elas estão desligadas');
    if (equipes.length < MIN_EQUIPES) problemas.push(`mínimo de ${MIN_EQUIPES} equipes`);
    if (equipes.some((e) => !e.nome.trim())) problemas.push('toda equipe precisa de nome');

    const qtdPen = numero('qtdPenalidades', 0);
    const qtdVan = numero('qtdVantagens', 0);
    const penDisponiveis = penalidadesValidas();
    const vanDisponiveis = vantagensValidas();

    if (qtdPen > 0 && !penDisponiveis.length) problemas.push('marque ao menos uma penalidade');
    if (qtdVan > 0 && !vanDisponiveis.length) problemas.push('marque ao menos uma vantagem');

    $('penAviso').textContent = penDisponiveis.length
      ? `${penDisponiveis.length} penalidade(s) entram no sorteio desta partida.`
      : 'Nenhuma penalidade marcada: o tabuleiro fica sem casas de castigo.';
    $('vanAviso').textContent = vanDisponiveis.length
      ? ''
      : 'Nenhuma vantagem marcada: o tabuleiro fica só com os castigos.';

    const podeIniciar = problemas.length === 0;
    $('botaoIniciar').disabled = !podeIniciar;

    const cabem = TRATO.ULTIMA_CASA - 2;
    const pen = Math.min(qtdPen, cabem, penDisponiveis.length);
    const van = Math.min(qtdVan, Math.max(0, cabem - pen), vanDisponiveis.length);

    const comRoubo = $('rouboLigado').checked;
    $('cfgResumo').innerHTML = podeIniciar
      ? `<b>${equipes.length}</b> equipes · <b>${doJogo.length}</b> perguntas · `
        + `vez <b>${numero('tempoVez', 30)}s</b> · `
        + (comRoubo ? `roubo <b>${numero('tempoRoubo', 15)}s</b> · ` : 'roubo <b>desligado</b> · ')
        + `<b>${pen}</b> de penalidade · <b>${van}</b> de vantagem`
      : `<span class="alerta">Falta: ${problemas.join(' · ')}</span>`;
  }

  for (const id of ['tempoVez', 'tempoRoubo', 'bonusRoubo', 'qtdPenalidades', 'qtdVantagens']) {
    $(id).addEventListener('input', revalidar);
  }

  $('abertasLigadas').addEventListener('change', revalidar);

  $('rouboLigado').addEventListener('change', () => {
    const ligado = $('rouboLigado').checked;
    for (const id of ['tempoRoubo', 'bonusRoubo']) {
      $(id).closest('.campo').classList.toggle('desligado', !ligado);
      $(id).disabled = !ligado;
    }
    revalidar();
  });

  function distribuirCartas(cartas, quantidade, livres) {
    const mapa = {};
    if (!quantidade || !cartas.length) return mapa;

    const baralho = embaralhar([...cartas]);

    for (let i = 0; i < quantidade; i++) {
      let colocou = false;
      for (let t = 0; t < baralho.length && !colocou; t++) {
        const carta = baralho[(i + t) % baralho.length];
        const onde = livres.findIndex((casa) => TRATO.cartaCabeNaCasa(carta, casa));
        if (onde < 0) continue;
        mapa[livres.splice(onde, 1)[0]] = { ...carta };
        colocou = true;
      }
      if (!colocou) break;
    }
    return mapa;
  }

  /** As casas que podem receber carta nesta partida, já embaralhadas. */
  function casasLivres() {
    const livres = [];
    for (let c = TRATO.PRIMEIRA_CASA + 1; c < TRATO.ULTIMA_CASA; c++) livres.push(c);
    return embaralhar(livres);
  }

  /** Fisher-Yates: embaralha no lugar e devolve o mesmo array. */
  function embaralhar(lista) {
    for (let i = lista.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lista[i], lista[j]] = [lista[j], lista[i]];
    }
    return lista;
  }

  $('botaoIniciar').addEventListener('click', (ev) => {
    const livres = casasLivres();
    const penalidadesNoTabuleiro = distribuirCartas(penalidadesValidas(), numero('qtdPenalidades', 0), livres);
    const vantagensNoTabuleiro   = distribuirCartas(vantagensValidas(),   numero('qtdVantagens', 0),   livres);

    const config = {
      equipes: equipes.map((e, i) => ({
        id: e.id,
        token: e.token || null,
        nome: e.nome.trim() || `Equipe ${i + 1}`,
        icone: e.icone,
        cor: e.cor,
        casa: TRATO.PRIMEIRA_CASA,
        pulos: 0,
        escudos: 0,
        jogadaExtra: 0,
      })),
      perguntas: perguntasDaPartida(),
      origemPerguntas,
      penalidadesNoTabuleiro,
      vantagensNoTabuleiro,
      tempoVez: Math.max(5, numero('tempoVez', 30)),
      rouboLigado: $('rouboLigado').checked,
      tempoRoubo: Math.max(5, numero('tempoRoubo', 15)),
      bonusRoubo: Math.max(1, numero('bonusRoubo', 2)),
      musicaLigada: TRATO.Som.musicaLigada,
    };

    const botao = ev.currentTarget;
    botao.disabled = true;

    const origens = new Map();
    for (const linha of $('equipesLista').children) {
      const img = linha.querySelector('.equipe-icone img');
      if (img && linha.dataset.equipe) {
        origens.set(linha.dataset.equipe, img.getBoundingClientRect());
      }
    }

    $('tela-config').classList.add('saindo');
    setTimeout(() => {
      $('tela-config').classList.remove('saindo');
      TRATO.Jogo.iniciar(config, origens);
    }, semMovimento ? 0 : 340);
  });

  function mostrarConfig() {
    TRATO.Som.encerrarPartida();
    $('tela-jogo').classList.add('oculta');
    $('tela-config').classList.remove('oculta');
    revalidar();
  }

  function mostrarEstadoCelulares(estado, titulo) {
    $('celularesEstado').dataset.estado = estado;
    $('celularesTitulo').textContent = titulo;
  }

  async function prepararCelulares() {
    let rede;
    try {
      rede = await (await fetch('api/rede')).json();
    } catch {
      mostrarEstadoCelulares('erro', 'O servidor não respondeu');
      return;
    }

    if (!rede.enderecoDasEquipes) {
      mostrarEstadoCelulares('erro', 'Este computador não está em nenhuma rede');
      $('celularesEndereco').textContent = '';
      $('celularesDica').innerHTML =
        'Ligue o <b>hotspot do celular</b> e conecte o notebook nele. Depois clique em '
        + '<b>Procurar de novo</b> lá em cima, ou recarregue esta página.';
      return;
    }

    $('qrImagem').src = 'api/qr?v=' + Date.now();
    $('qrImagem').hidden = false;
    $('qrVazio').hidden = true;
    $('celularesEndereco').textContent = rede.enderecoDasEquipes;
    mostrarEstadoCelulares('esperando', 'Nenhuma equipe entrou ainda');

    TRATO.Sincronia.ao('conexao', ({ ligado, motivo }) => {
      if (ligado) { atualizarContagemDeCelulares(); return; }
      if (motivo === 'substituido') {
        mostrarEstadoCelulares('erro', 'O jogo foi aberto em outra janela');
        $('celularesDica').innerHTML =
          'Só uma tela pode comandar a partida. Esta aqui parou de valer: '
          + '<b>feche esta aba</b> e siga na outra.';
      } else {
        mostrarEstadoCelulares('erro', 'Canal com os celulares caiu, reconectando…');
      }
    });
    TRATO.Sincronia.ao('entrar', receberEquipeDoCelular);
    TRATO.Sincronia.ao('trocar', receberTrocaDoCelular);
    TRATO.Sincronia.ao('sair', ({ de }) => soltarEquipe(de));
    TRATO.Sincronia.ao('celular', ({ token, chegou }) => {
      if (!chegou) marcarEquipeOffline(token, true);
      atualizarContagemDeCelulares();
    });

    TRATO.Sincronia.conectar();
  }

  function atualizarContagemDeCelulares() {
    const n = equipes.filter((e) => e.token).length;
    mostrarEstadoCelulares(
      n ? 'ok' : 'esperando',
      n ? `${n} equipe${n > 1 ? 's' : ''} pelo celular` : 'Nenhuma equipe entrou ainda'
    );
  }

  /** Manda para um celular o retrato da equipe dele (ou a recusa). */
  function responderAoCelular(token) {
    const eq = equipes.find((e) => e.token === token);
    TRATO.Sincronia.enviarPara(token, eq
      ? { tipo: 'sua-equipe', equipe: { nome: eq.nome, icone: eq.icone, cor: eq.cor, iconeId: eq.iconeId } }
      : { tipo: 'recusado', motivo: 'A partida já tem o máximo de equipes.' });
  }

  /** Um celular pediu para entrar: vira uma equipe nova, ou reassume a dele. */
  function receberEquipeDoCelular({ de, nome, iconeId }) {
    const jaTem = equipes.find((e) => e.token === de);

    if (jaTem) {
      jaTem.offline = false;
      if (nome) { jaTem.nome = nome.slice(0, 28); jaTem.nomeEditado = true; }
      aplicarIcone(jaTem, iconeId);
    } else {
      if (equipes.length >= MAX_EQUIPES) {
        TRATO.Sincronia.enviarPara(de, {
          tipo: 'recusado',
          motivo: `A partida já tem ${MAX_EQUIPES} equipes, que é o máximo.`,
        });
        return;
      }
      const nova = novaEquipe();
      if (!nova) return;
      nova.token = de;
      if (nome) { nova.nome = nome.slice(0, 28); nova.nomeEditado = true; }
      aplicarIcone(nova, iconeId);
      equipes.push(nova);
      GameFX.toast(`${nova.nome} entrou pelo celular`);
    }

    desenharEquipes();
    revalidar();
    atualizarContagemDeCelulares();
    responderAoCelular(de);
  }

  function receberTrocaDoCelular({ de, nome, iconeId }) {
    const eq = equipes.find((e) => e.token === de);
    if (!eq) return;
    if (nome !== undefined) { eq.nome = String(nome).slice(0, 28); eq.nomeEditado = true; }
    aplicarIcone(eq, iconeId);
    desenharEquipes();
    revalidar();
    responderAoCelular(de);
  }

  function aplicarIcone(eq, iconeId) {
    if (!iconeId) return;
    const ic = icones.find((i) => i.id === iconeId);
    if (!ic) return;
    eq.iconeId = ic.id;
    eq.icone = urlDoIcone(ic);
    if (!eq.nomeEditado) eq.nome = ic.nome;
  }

  function marcarEquipeOffline(token, offline) {
    const eq = equipes.find((e) => e.token === token);
    if (eq) { eq.offline = offline; desenharEquipes(); }
  }

  function soltarEquipe(token) {
    const eq = equipes.find((e) => e.token === token);
    if (!eq) return;
    equipes = equipes.filter((e) => e !== eq);
    desenharEquipes();
    revalidar();
    atualizarContagemDeCelulares();
  }

  const CHAVE_SECOES = 'trato:secoes';

  function lembrarSecoes() {
    let guardado = null;
    try { guardado = JSON.parse(localStorage.getItem(CHAVE_SECOES) || 'null'); } catch {}

    for (const secao of document.querySelectorAll('.cfg-corpo > details')) {
      if (guardado && typeof guardado[secao.id] === 'boolean') secao.open = guardado[secao.id];
      secao.addEventListener('toggle', guardarSecoes);
    }
  }

  function guardarSecoes() {
    const estado = {};
    for (const secao of document.querySelectorAll('.cfg-corpo > details')) {
      estado[secao.id] = secao.open;
    }
    try { localStorage.setItem(CHAVE_SECOES, JSON.stringify(estado)); } catch {}
  }

  /**
   * O conteúdo desliza e esmaece ao abrir uma seção. O CSS já faz uma versão
   * disto sozinho (a altura anima via `interpolate-size`, em trato.css), mas
   * só onde o navegador sabe o truque; em qualquer outro lugar a seção
   * simplesmente escancara. Isto aqui é o reforço que funciona em todo canto,
   * via Web Animations API — não conflita com o `::details-content` do CSS
   * porque anima os FILHOS de dentro, não a altura do <details>.
   *
   * Só entra depois de `lembrarSecoes()` ter restaurado o que ficou aberto da
   * última vez: anexar o ouvinte antes disso faria a restauração (que também
   * dispara `toggle`) tocar a animação de abertura no meio do carregamento
   * da página, antes de o professor ver qualquer coisa.
   */
  function revelarAoAbrir() {
    for (const secao of document.querySelectorAll('.cfg-corpo > details')) {
      secao.addEventListener('toggle', () => {
        if (!secao.open || semMovimento) return;
        const conteudo = [...secao.children].filter((el) => el.tagName !== 'SUMMARY');
        conteudo.forEach((el, i) => {
          el.animate(
            [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }],
            { duration: 320, delay: i * 30, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'backwards' },
          );
        });
      });
    }
  }

  async function iniciar() {
    lembrarSecoes();
    revelarAoAbrir();
    TRATO.Som.ligarBotoes();
    penalidades = TRATO.PENALIDADES_PADRAO.map((p) => ({ ...p, ativa: true }));
    vantagens = TRATO.VANTAGENS_PADRAO.map((p) => ({ ...p, ativa: true }));
    desenharPenalidades();
    desenharVantagens();

    await carregarIcones();
    if (!icones.length) {
      $('equipesLista').innerHTML =
        '<p style="color:var(--crimson);font-size:14px">Os ícones não carregaram. '
        + 'Confira se a pasta <code>public/assets/icons</code> está no lugar e recarregue a página.</p>';
    }
    for (let i = 0; i < MIN_EQUIPES; i++) {
      const nova = novaEquipe();
      if (nova) equipes.push(nova);
    }
    if (icones.length) desenharEquipes();

    await buscarPerguntas();
    await prepararCelulares();
  }

  return { iniciar, mostrarConfig, embaralhar };
})();
