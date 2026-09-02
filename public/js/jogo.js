
window.TRATO = window.TRATO || {};

TRATO.Jogo = (() => {
  const $ = (id) => document.getElementById(id);
  const Tabuleiro = TRATO.Tabuleiro;

  const espera = (ms) => new Promise((r) => setTimeout(r, ms));

  let cfg = null;
  let equipes = [];
  let vez = 0;
  let rodada = 1;
  let baralho = [];
  let perguntaAtual = null;
  let dadoAtual = 0;
  let ladrao = null;
  let escolhaTravada = null;
  let gabaritoRevelado = false;
  let fase = 'parado';
  let temporizador = null;
  let fimDoCronometro = null;
  let campeao = null;
  let turno = 0;
  let tiqueTaque = null;

  function comecarCronometro(segundos, aoEstourar) {
    pararCronometro();
    GameFX.startTimer(segundos);
    fimDoCronometro = Date.now() + segundos * 1000;

    comecarTiqueTaque();

    const meuTurno = turno;
    temporizador = setTimeout(() => {
      temporizador = null;
      if (meuTurno !== turno) return;
      aoEstourar();
    }, segundos * 1000);

    transmitirEstado();
  }

  function pararCronometro() {
    if (temporizador) { clearTimeout(temporizador); temporizador = null; }
    fimDoCronometro = null;
    pararTiqueTaque();
    GameFX.stopTimer();
  }

  /**
   * O relógio audível: tick e tock alternados, um por segundo.
   * Os últimos cinco segundos são deixados por conta do fx.js, que já marca
   * essa reta final com o mesmo tick e um aviso. Se batêssemos junto, sairia
   * um som dobrado justo no momento mais tenso.
   */
  function comecarTiqueTaque() {
    pararTiqueTaque();
    let grave = false;
    tiqueTaque = setInterval(() => {
      if (!fimDoCronometro) return;
      const faltam = (fimDoCronometro - Date.now()) / 1000;
      if (faltam <= 5.2) return;
      grave = !grave;
      if (grave) GameSound.tock(); else GameSound.tick();
    }, 1000);
  }

  function pararTiqueTaque() {
    if (tiqueTaque) { clearInterval(tiqueTaque); tiqueTaque = null; }
  }

  function limparPalco() {
    $('dice').classList.remove('show', 'land', 'rolling');
    $('qcard').classList.remove('show');
    $('steal').classList.remove('show');
  }

  /**
   * Escurece o tabuleiro enquanto um pop-up está no ar.
   * Fica ligado do dado até o veredito, e desligado durante o movimento do
   * marcador. É aí que o mapa precisa estar à mostra.
   */
  const veu = (ligado) => $('veu').classList.toggle('on', ligado);

  /**
   * GameFX.steal() esconde o cartaz sozinho depois de 3,2 s, bom como alerta,
   * ruim aqui, porque o roubo continua aberto enquanto o cronômetro corre.
   * Então recolocamos o cartaz e deixamos ele no ar até o roubo terminar.
   */
  function manterCartazDoRoubo() {
    setTimeout(() => {
      if (fase === 'roubo_aberto' || fase === 'roubo_respondendo') {
        $('steal').classList.add('show');
      }
    }, 3300);
  }

  function embaralharBaralho() {
    baralho = TRATO.Config.embaralhar([...cfg.perguntas]);
    atualizarPainel();
  }

  /**
   * Tira do baralho uma pergunta da região do trato onde a equipe está.
   *
   * A escada é esta, e cada degrau abaixo do primeiro é avisado no telão:
   *   1. a região da casa  (está no estômago -> pergunta de estômago)
   *   2. a reserva         (geral, fígado e pâncreas)
   *   3. qualquer uma      (a planilha secou; melhor que travar a partida)
   *
   * @returns {{pergunta:object, degrau:string}|null} null = o professor não
   *          quis reembaralhar, e a partida acaba aqui.
   */
  async function puxarPergunta(regiao) {
    if (!baralho.length) {
      GameFX.toast('Acabaram as perguntas da planilha');
      const querReembaralhar = await TRATO.Aviso.perguntar({
        tom: 'atencao',
        titulo: 'A planilha acabou',
        texto: `As ${cfg.perguntas.length} perguntas já foram todas usadas. `
             + 'Dá para reembaralhar e começar a repetir, ou encerrar a partida aqui.',
        sim: 'Reembaralhar e continuar',
        nao: 'Encerrar a partida',
      });
      if (!querReembaralhar) return null;
      embaralharBaralho();
      GameFX.toast('Perguntas reembaralhadas');
    }

    const procurar = (categorias) => {
      for (let i = baralho.length - 1; i >= 0; i--) {
        if (TRATO.perguntaServe(baralho[i], categorias)) return i;
      }
      return -1;
    };

    let degrau = 'regiao';
    let i = procurar(regiao.categorias);
    if (i < 0) { degrau = 'reserva';  i = procurar(TRATO.CATEGORIAS_RESERVA); }
    if (i < 0) { degrau = 'qualquer'; i = baralho.length - 1; }

    return { pergunta: baralho.splice(i, 1)[0], degrau };
  }

  /**
   * Os cinco botões grandes entram escalonados quando a tela do jogo aparece.
   *
   * Isto tem de ser Web Animations API, e não um `animation` de CSS: os
   * mesmos botões já têm a animação `acendeu` (trato.css), que troca de nome
   * toda vez que `acender()` liga um deles, e um `animation` de entrada
   * declarado por seletor brigaria pela MESMA propriedade `animation` e, com
   * um seletor mais específico, ganharia sempre — apagando o pulo que avisa
   * qual botão acabou de ficar disponível, que é a pista de jogo mais
   * importante do rodapé. `.animate()` roda num objeto à parte, nunca entra
   * nessa disputa.
   *
   * Anima só os BOTÕES, nunca `.controles` em volta: a caixa dos controles
   * divide uma linha de grade com o palco (`.coluna-palco`), e se a própria
   * caixa mudasse de altura durante a entrada, o palco mudaria de tamanho
   * junto — bem no instante em que voarParaABoca() está medindo para onde as
   * comidas voam. Opacidade e transform num filho, com a caixa já no
   * tamanho final, não mexem em nada por fora.
   */
  function revelarControles() {
    if (semMovimento) return;
    const botoes = $('controlesBotoes').querySelectorAll('.btn-grande');
    botoes.forEach((botao, i) => {
      botao.animate(
        [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }],
        { duration: 340, delay: i * 45, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'backwards' },
      );
    });
  }

  /**
   * Monta a partida e a começa.
   *
   * @param {object} configuracao  o que a tela de configuração juntou
   * @param {Map<string,DOMRect>} [origens]  onde estava, na tela, o ícone de
   *        cada equipe no menu. Com isto, as comidas voam de lá até a boca do
   *        trato antes da contagem de largada. Sem isto (ou com o sistema
   *        pedindo menos movimento), a partida simplesmente começa.
   */
  async function iniciar(configuracao, origens) {
    cfg = configuracao;
    equipes = cfg.equipes;
    vez = 0;
    rodada = 1;
    ladrao = null;
    campeao = null;
    perguntaAtual = null;

    $('tela-config').classList.add('oculta');
    $('tela-jogo').classList.remove('oculta');
    revelarControles();

    GameSound.resume();
    GameFX.limpar();

    Tabuleiro.definirVertical(lerVerticalGuardado());
    Tabuleiro.montar();
    Tabuleiro.desenharCasasEspeciais(cfg.penalidadesNoTabuleiro, cfg.vantagensNoTabuleiro);
    Tabuleiro.criarMarcadores(equipes);
    aplicarVertical(Tabuleiro.vertical, false);

    Tabuleiro.seguir(equipes[vez].casa, { imediato: true });

    embaralharBaralho();
    desenharPlacar();
    atualizarPainel();

    TRATO.Som.comecarPartida();
    definirFase('ocupado');

    await voarParaABoca(origens);

    veu(true);
    GameFX.countdown(() => comecarVez());
  }

  async function voarParaABoca(origens) {
    if (!origens || !origens.size) return;

    const pecas = $('pecas');

    const camada = pecas.querySelector('.camada-pecas');
    camada?.classList.add('chegando');

    const destinos = new Map();
    for (const eq of equipes) {
      const marcador = pecas.querySelector(`[data-equipe="${eq.id}"]`);
      if (!marcador) continue;
      const alvo = marcador.querySelector('image') || marcador;
      destinos.set(eq.id, alvo.getBoundingClientRect());
    }

    const palco = $('stage').getBoundingClientRect();
    const dentroDoPalco = (r) => {
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      return cx >= palco.left && cx <= palco.right
          && cy >= palco.top  && cy <= palco.bottom;
    };

    const pares = equipes
      .map((eq) => ({ icone: eq.icone, cor: eq.cor,
                      de: origens.get(eq.id), para: destinos.get(eq.id) }))
      .filter((p) => p.de && p.para && dentroDoPalco(p.para));
    if (pares.length !== equipes.length) {
      console.warn('Entrada sem voo: destino fora do palco para alguma equipe.');
      camada?.classList.remove('chegando');
      return;
    }

    await GameFX.voarIcones(pares);
    camada?.classList.remove('chegando');
  }

  function comecarVez() {
    if (fase === 'fim') return;

    let tentativas = 0;
    while (equipes[vez].pulos > 0 && tentativas < equipes.length) {
      const parada = equipes[vez];
      parada.pulos -= 1;
      GameFX.toast(`${parada.nome} está parada nesta rodada`);
      avancarIndiceDaVez();
      tentativas++;
    }

    turno++;
    const eq = equipes[vez];
    perguntaAtual = null;
    escolhaTravada = null;
    gabaritoRevelado = false;
    ladrao = null;
    dadoAtual = 0;

    veu(false);
    Tabuleiro.destacar(equipes, eq.id);
    desenharPlacar();
    atualizarPainel();

    GameFX.turn(eq.nome, eq.cor, primeiraLetra(eq.nome));
    definirFase('esperando_dado');
  }

  const primeiraLetra = (nome) => (nome.trim()[0] || '?').toUpperCase();

  async function rolarDado() {
    if (fase !== 'esperando_dado') return;
    definirFase('ocupado');
    veu(true);

    dadoAtual = GameFX.rollDice();
    await espera(1200);
    await mostrarPergunta();
  }

  /** Pergunta com gabarito é corrigida sozinha; aberta continua com o professor. */
  const ehFechada = (p) => !!p && p.tipo !== 'aberta';

  async function mostrarPergunta() {
    const eq = equipes[vez];
    const regiao = TRATO.regiaoDaCasa(eq.casa);

    const puxada = await puxarPergunta(regiao);
    if (!puxada) { encerrarSemVencedor(); return; }
    const p = puxada.pergunta;

    perguntaAtual = p;
    escolhaTravada = null;
    gabaritoRevelado = false;

    const etiquetas = [puxada.degrau === 'regiao'
      ? regiao.nome
      : `${regiao.nome} → ${p.categoria || 'geral'}`];
    if (p.dificuldade) etiquetas.push(p.dificuldade);
    $('qkick').textContent = etiquetas.join(' · ');
    $('qtext').textContent = p.texto;

    if (puxada.degrau === 'reserva') {
      GameFX.toast(`Sem perguntas de ${regiao.nome}: veio uma da reserva`);
    } else if (puxada.degrau === 'qualquer') {
      GameFX.toast(`Sem perguntas de ${regiao.nome} nem na reserva`);
    }

    desenharOpcoes(p);

    $('dice').classList.remove('show', 'land');
    GameFX.question();
    definirFase('pergunta');
    atualizarPainel();
    comecarCronometro(cfg.tempoVez, () => {
      GameFX.toast('Tempo esgotado');
      abrirRoubo();
    });
  }

  /**
   * As alternativas no telão.
   * São clicáveis: numa sala sem celulares, é assim que o professor registra a
   * resposta da equipe. Com celulares, servem de leitura e de gabarito visual.
   */
  function desenharOpcoes(p) {
    const alts = $('qalts');
    alts.innerHTML = '';
    alts.classList.toggle('vf', p.tipo === 'vf');

    for (const o of p.opcoes) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'alt';
      b.dataset.letra = o.letra;
      b.innerHTML = `<b>${o.letra}</b>`;
      b.append(document.createTextNode(o.texto));
      b.addEventListener('click', () => registrarResposta(null, o.letra));
      alts.appendChild(b);
    }
  }

  function registrarResposta(token, letra) {
    if (!ehFechada(perguntaAtual) || escolhaTravada) return;
    if (!perguntaAtual.opcoes.some((o) => o.letra === letra)) return;

    if (fase === 'pergunta') {
      if (token && equipes[vez].token !== token) return;
      responder(equipes[vez], letra, false);
      return;
    }

    if (fase === 'roubo_aberto') {
      const eq = token ? equipes.find((e) => e.token === token) : ladrao;
      if (!eq) {
        if (!token) GameFX.toast('Aponte primeiro qual equipe roubou');
        return;
      }
      if (eq.id === equipes[vez].id) return;
      ladrao = eq;
      responder(eq, letra, true);
    }
  }

  async function responder(eq, letra, foiRoubo) {
    pararCronometro();
    const acertouMesmo = letra === perguntaAtual.correta;
    escolhaTravada = { token: eq.token, equipeId: eq.id, letra, certa: acertouMesmo };
    definirFase('ocupado');

    const acabou = acertouMesmo || foiRoubo;
    marcarAlternativas(letra, acabou);
    transmitirEstado();
    await espera(acabou ? 1500 : 900);

    if (!acertouMesmo) {
      GameFX.wrong();
      await espera(1500);
      if (foiRoubo) { GameFX.toast('O roubo não foi. Ninguém anda.'); proximaVez(); }
      else abrirRoubo();
      return;
    }

    if (foiRoubo) {
      GameFX.stealWon(eq.nome, cfg.bonusRoubo);
      await espera(1700);
      await andar(eq, eq.casa + cfg.bonusRoubo);
    } else {
      GameFX.correct(dadoAtual);
      await espera(1700);
      await andar(eq, eq.casa + dadoAtual);
    }
  }

  /**
   * Pinta as alternativas no telão.
   * @param {string|null} escolhida  a que acabou de ser tentada (fica vermelha se errada)
   * @param {boolean} revelar        mostrar a resposta certa em verde
   *
   * A resposta certa só aparece quando ninguém mais pode responder: acerto na
   * vez, ou fim do roubo. Antes disso o telão diz apenas o que já foi descartado.
   */
  function marcarAlternativas(escolhida, revelar) {
    if (revelar) gabaritoRevelado = true;

    for (const b of $('qalts').children) {
      const letra = b.dataset.letra;
      if (escolhida && letra === escolhida && letra !== perguntaAtual.correta) {
        b.classList.add('errada');
        b.disabled = true;
      }
      if (revelar) {
        b.classList.toggle('certa', letra === perguntaAtual.correta);
        b.disabled = true;
      }
    }
  }

  /** Fecha o roubo: aí sim a resposta certa aparece, e a vez passa. */
  async function encerrarRoubo(mensagem) {
    if (mensagem) GameFX.toast(mensagem);
    if (ehFechada(perguntaAtual)) {
      marcarAlternativas(null, true);
      transmitirEstado();
      await espera(1800);
    }
    proximaVez();
  }

  /** No roubo a mesma pergunta volta a valer, agora para as outras equipes. */
  function reabrirOpcoes() {
    escolhaTravada = null;
    for (const b of $('qalts').children) {
      if (b.classList.contains('errada')) continue;
      b.disabled = false;
    }
  }

  async function acertou() {
    if (fase === 'pergunta') {
      pararCronometro();
      definirFase('ocupado');
      const eq = equipes[vez];
      GameFX.correct(dadoAtual);
      await espera(1700);
      await andar(eq, eq.casa + dadoAtual);
      return;
    }

    if (fase === 'roubo_respondendo') {
      pararCronometro();
      definirFase('ocupado');
      const eq = ladrao;
      GameFX.stealWon(eq.nome, cfg.bonusRoubo);
      await espera(1700);
      await andar(eq, eq.casa + cfg.bonusRoubo);
    }
  }

  async function errou() {
    if (fase === 'pergunta') {
      pararCronometro();
      definirFase('ocupado');
      GameFX.wrong();
      await espera(1600);
      abrirRoubo();
      return;
    }

    if (fase === 'roubo_respondendo') {
      pararCronometro();
      definirFase('ocupado');
      GameFX.wrong();
      await espera(1600);
      GameFX.toast('O roubo não foi. Ninguém anda.');
      proximaVez();
    }
  }

  /**
   * Move a equipe, aplica a penalidade da casa de chegada e checa a vitória.
   * Só movimento para frente aciona penalidade: quem já voltou por castigo
   * não é castigado de novo em cascata.
   */
  async function andar(eq, destino) {
    limparPalco();
    veu(false);
    const paraFrente = destino > eq.casa;
    const regiaoAntes = TRATO.regiaoDaCasa(eq.casa);

    await Tabuleiro.mover(eq, destino, equipes);
    desenharPlacar();
    transmitirEstado();

    if (eq.casa >= TRATO.ULTIMA_CASA) { vencer(eq); return; }

    await anunciarRegiao(eq, regiaoAntes);

    if (paraFrente) {
      const pen = cfg.penalidadesNoTabuleiro[eq.casa];
      const van = cfg.vantagensNoTabuleiro && cfg.vantagensNoTabuleiro[eq.casa];
      const regiaoAntesDoEfeito = TRATO.regiaoDaCasa(eq.casa);

      if (pen) await aplicarPenalidade(eq, pen);
      else if (van) await aplicarVantagem(eq, van);

      if (eq.casa >= TRATO.ULTIMA_CASA) { vencer(eq); return; }
      if (pen || van) await anunciarRegiao(eq, regiaoAntesDoEfeito);
    }

    proximaVez();
  }

  /**
   * Quando a equipe muda de órgão, o telão anuncia a região nova.
   * É o momento em que o tabuleiro vira aula: dá para dizer em voz alta que
   * dali em diante começa o estômago, o duodeno, o cólon.
   */
  async function anunciarRegiao(eq, regiaoAntes) {
    const agora = TRATO.regiaoDaCasa(eq.casa);
    if (agora.nome === regiaoAntes.nome) return;
    veu(false);
    GameFX.region(agora.nome);
    await espera(1900);
  }

  async function aplicarPenalidade(eq, pen) {
    if (eq.escudos > 0) {
      eq.escudos -= 1;
      veu(true);
      GameFX.bonus({
        nome: 'A microbiota segurou',
        efeito: `${pen.nome} não pega em ${eq.nome} desta vez.`,
      });
      await espera(2700);
      veu(false);
      desenharPlacar();
      transmitirEstado();
      return;
    }

    veu(true);
    GameFX.penalty({ nome: pen.nome, efeito: pen.efeito });
    await espera(2700);
    veu(false);

    if (pen.tipo === 'voltar') {
      await Tabuleiro.mover(eq, eq.casa - pen.valor, equipes);
    } else if (pen.tipo === 'voltarPara') {
      await Tabuleiro.mover(eq, pen.alvo, equipes);
    } else if (pen.tipo === 'pular') {
      eq.pulos += pen.valor;
      GameFX.toast(`${eq.nome} fica ${pen.valor} jogada${pen.valor > 1 ? 's' : ''} sem jogar`);
    }

    desenharPlacar();
    transmitirEstado();
    Tabuleiro.destacar(equipes, equipes[vez].id);
  }

  /**
   * Casa de vantagem: o contrário da penalidade, com os mesmos cuidados.
   * O avanço usa Tabuleiro.mover direto, e não andar(), justamente para não
   * acionar a casa de chegada.
   */
  async function aplicarVantagem(eq, van) {
    veu(true);
    GameFX.bonus({ nome: van.nome, efeito: van.efeito });
    await espera(2700);
    veu(false);

    if (van.tipo === 'avancar') {
      await Tabuleiro.mover(eq, eq.casa + van.valor, equipes);
    } else if (van.tipo === 'escudo') {
      eq.escudos += van.valor;
      GameFX.toast(`${eq.nome} está protegida da próxima penalidade`);
    } else if (van.tipo === 'jogarDeNovo') {
      eq.jogadaExtra += 1;
      GameFX.toast(`${eq.nome} joga de novo`);
    }

    desenharPlacar();
    transmitirEstado();
    Tabuleiro.destacar(equipes, equipes[vez].id);
  }

  function abrirRoubo() {
    pararCronometro();

    if (!cfg.rouboLigado) { encerrarRoubo(null); return; }

    const descartadas = escolhaTravada && !escolhaTravada.certa ? 1 : 0;
    if (ehFechada(perguntaAtual) && perguntaAtual.opcoes.length - descartadas < 2) {
      encerrarRoubo('Sem roubo: sobrou uma alternativa só');
      return;
    }

    const outras = equipes.filter((e) => e.id !== equipes[vez].id);
    if (!outras.length) { encerrarRoubo(null); return; }

    const cartaz = $('stealTeams');
    cartaz.innerHTML = '';
    for (const e of outras) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'trybtn';
      b.dataset.equipe = e.id;
      const img = document.createElement('img');
      img.src = e.icone;
      img.alt = '';
      b.append(img, document.createTextNode(`${e.nome} · Tentar!`));
      b.addEventListener('click', () => assumirRoubo(e));
      cartaz.appendChild(b);
    }
    GameFX.steal();
    manterCartazDoRoubo();

    const botoes = $('rouboBotoes');
    botoes.innerHTML = '';
    for (const e of outras) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn-roubo';
      b.innerHTML = `<img src="${e.icone}" alt="">`;
      b.append(document.createTextNode(e.nome));
      b.addEventListener('click', () => assumirRoubo(e));
      botoes.appendChild(b);
    }

    ladrao = null;
    if (ehFechada(perguntaAtual)) reabrirOpcoes();
    definirFase('roubo_aberto');
    comecarCronometro(cfg.tempoRoubo, () => {
      definirFase('ocupado');
      encerrarRoubo('Ninguém roubou a tempo');
    });
  }

  /** O professor apontou quem apertou "Tentar!" primeiro. */
  function assumirRoubo(equipe) {
    if (fase !== 'roubo_aberto') return;
    ladrao = equipe;
    GameFX.toast(`${equipe.nome} vai tentar!`);

    for (const b of $('stealTeams').children) {
      b.classList.toggle('escolhida', b.dataset.equipe === equipe.id);
    }

    if (ehFechada(perguntaAtual)) {
      transmitirEstado();
      $('controlesDica').textContent =
        `${equipe.nome} roubou. Clique na alternativa que eles escolheram`;
      return;
    }

    definirFase('roubo_respondendo');
    $('controlesDica').textContent =
      `${equipe.nome} está roubando. Responda e julgue (bônus: +${cfg.bonusRoubo} casas)`;
  }

  function avancarIndiceDaVez() {
    vez = (vez + 1) % equipes.length;
    if (vez === 0) rodada++;
  }

  function proximaVez() {
    if (fase === 'fim') return;
    pararCronometro();
    limparPalco();
    ladrao = null;

    const atual = equipes[vez];
    if (atual && atual.jogadaExtra > 0) {
      atual.jogadaExtra -= 1;
      GameFX.toast(`${atual.nome} joga de novo`);
      comecarVez();
      return;
    }

    avancarIndiceDaVez();
    comecarVez();
  }

  function vencer(eq) {
    pararCronometro();
    TRATO.Som.encerrarPartida();
    campeao = eq;
    definirFase('fim');
    veu(true);
    Tabuleiro.destacar(equipes, eq.id);
    desenharPlacar();
    atualizarPainel();
    GameFX.win(eq.nome, eq.icone);
    $('controlesDica').textContent =
      `${eq.nome} atravessou o trato inteiro. Encerre a partida para voltar à configuração.`;
  }

  function encerrarSemVencedor() {
    pararCronometro();
    TRATO.Som.encerrarPartida();
    definirFase('fim');
    veu(true);
    atualizarPainel();
    GameFX.toast('Partida encerrada: acabaram as perguntas');
    $('controlesDica').textContent = 'Partida encerrada. Volte à configuração para começar outra.';
  }

  const DICAS = {
    esperando_dado:    () => `Vez de ${equipes[vez].nome}. Role o dado`,
    pergunta:          () => ehFechada(perguntaAtual)
                             ? `${equipes[vez].nome} está escolhendo a resposta no celular`
                             : `${equipes[vez].nome} responde em voz alta. Acertou ou errou?`,
    roubo_aberto:      () => !ehFechada(perguntaAtual)
                             ? 'Roubo aberto. Quem apertou "Tentar!" primeiro?'
                             : ladrao
                               ? `${ladrao.nome} roubou. Clique na alternativa que eles escolheram`
                               : 'Roubo aberto. A primeira equipe que tocar leva a chance',
    roubo_respondendo: () => `${ladrao ? ladrao.nome : 'A equipe'} está roubando. Julgue a resposta`,
    ocupado:           () => 'Um instante…',
    fim:               () => 'Fim de jogo',
    parado:            () => '',
  };

  function definirFase(nova) {
    fase = nova;

    const emJogo = fase !== 'fim' && fase !== 'ocupado' && fase !== 'parado';
    const julgando = (fase === 'pergunta' || fase === 'roubo_respondendo') && !ehFechada(perguntaAtual);

    acender('btnDado',        fase === 'esperando_dado');
    acender('btnAcertou',     julgando);
    acender('btnErrou',       julgando);
    acender('btnTempoAcabou', julgando || fase === 'roubo_aberto');
    acender('btnProxima',     emJogo);

    $('rouboEscolha').classList.toggle('oculta', fase !== 'roubo_aberto');
    $('controlesDica').textContent = (DICAS[fase] || DICAS.parado)();

    transmitirEstado();
  }

  /**
   * Liga ou desliga um dos botões grandes, e dá um pulo curto no que ACABOU de
   * ficar disponível. Numa fileira de cinco botões, com quatro apagados, o que
   * se mexe é onde o olho vai. Serve de dica sem ninguém precisar ler nada.
   */
  function acender(id, ligado) {
    const botao = $(id);
    const estavaFora = botao.disabled;
    botao.disabled = !ligado;
    if (estavaFora && ligado) {
      botao.classList.remove('acendeu');
      void botao.offsetWidth;
      botao.classList.add('acendeu');
    }
  }

  /** "Tempo esgotado": atalho para o professor cortar a espera. */
  function forcarTempoEsgotado() {
    if (fase === 'pergunta') {
      pararCronometro();
      definirFase('ocupado');
      GameFX.timeUp();
      setTimeout(abrirRoubo, 700);
    } else if (fase === 'roubo_aberto' || fase === 'roubo_respondendo') {
      pararCronometro();
      definirFase('ocupado');
      GameFX.timeUp();
      setTimeout(() => encerrarRoubo('Ninguém anda'), 700);
    }
  }

  $('btnDado').addEventListener('click', rolarDado);
  $('btnAcertou').addEventListener('click', acertou);
  $('btnErrou').addEventListener('click', errou);
  $('btnTempoAcabou').addEventListener('click', forcarTempoEsgotado);
  $('btnProxima').addEventListener('click', () => {
    if (fase === 'fim' || fase === 'ocupado') return;
    const noRoubo = fase === 'roubo_aberto' || fase === 'roubo_respondendo';
    pararCronometro();
    definirFase('ocupado');
    if (noRoubo) encerrarRoubo('Vez passada');
    else { GameFX.toast('Vez passada'); proximaVez(); }
  });
  $('btnRouboNinguem').addEventListener('click', () => {
    if (fase !== 'roubo_aberto') return;
    pararCronometro();
    definirFase('ocupado');
    encerrarRoubo('Ninguém tentou');
  });

  const CHAVE_VERTICAL = 'trato:vertical';

  function aplicarVertical(ligado, guardar) {
    Tabuleiro.definirVertical(ligado);
    if (cfg) {
      Tabuleiro.desenharCasasEspeciais(cfg.penalidadesNoTabuleiro, cfg.vantagensNoTabuleiro);
      Tabuleiro.criarMarcadores(equipes);
      Tabuleiro.destacar(equipes, equipes[vez] ? equipes[vez].id : null);
    }
    $('botaoVertical').setAttribute('aria-pressed', String(ligado));
    $('verticalRotulo').textContent = ligado ? 'Em pé' : 'Deitado';
    if (guardar) { try { localStorage.setItem(CHAVE_VERTICAL, ligado ? '1' : '0'); } catch {} }
  }

  function lerVerticalGuardado() {
    try { return localStorage.getItem(CHAVE_VERTICAL) === '1'; } catch { return false; }
  }

  $('botaoVertical').addEventListener('click', () => {
    aplicarVertical(!Tabuleiro.vertical, true);
  });

  $('btnReembaralhar').addEventListener('click', () => {
    if (!cfg) return;
    embaralharBaralho();
    GameFX.toast('Perguntas reembaralhadas');
  });

  $('btnVoltarConfig').addEventListener('click', async () => {
    const encerrar = await TRATO.Aviso.perguntar({
      tom: 'atencao',
      titulo: 'Encerrar a partida?',
      texto: 'O placar desta partida se perde e o jogo volta para a tela de '
           + 'configuração. As equipes e as regras continuam como estão.',
      sim: 'Encerrar',
      nao: 'Continuar jogando',
    });
    if (!encerrar) return;
    pararCronometro();
    definirFase('parado');

    $('tela-jogo').classList.add('saindo');
    setTimeout(() => {
      $('tela-jogo').classList.remove('saindo');
      GameFX.limpar();
      veu(false);
      TRATO.Config.mostrarConfig();
    }, semMovimento ? 0 : 300);
  });

  document.addEventListener('keydown', (ev) => {
    if ($('tela-jogo').classList.contains('oculta')) return;
    const alvo = ev.target;
    if (alvo && /^(INPUT|TEXTAREA|SELECT)$/.test(alvo.tagName)) return;

    const acoes = {
      ' ':          () => $('btnDado').disabled || rolarDado(),
      'Enter':      () => $('btnDado').disabled || rolarDado(),
      'a':          () => $('btnAcertou').disabled || acertou(),
      'e':          () => $('btnErrou').disabled || errou(),
      't':          () => $('btnTempoAcabou').disabled || forcarTempoEsgotado(),
      'p':          () => $('btnProxima').disabled || $('btnProxima').click(),
    };
    const acao = acoes[ev.key] || acoes[ev.key.toLowerCase()];
    if (acao) { ev.preventDefault(); acao(); }
  });

  /** Retrato enxuto do jogo: é o que cada celular precisa para saber o que mostrar. */
  function transmitirEstado() {
    if (!cfg || !TRATO.Sincronia.ligado) return;

    const daVez = equipes[vez];
    TRATO.Sincronia.enviarEstado({
      fase,
      rodada,
      vezToken: daVez ? daVez.token : null,
      vezNome: daVez ? daVez.nome : null,
      ladraoToken: ladrao ? ladrao.token : null,
      bonusRoubo: cfg.bonusRoubo,
      rouboLigado: cfg.rouboLigado,
      pergunta: perguntaAtual ? {
        tipo: perguntaAtual.tipo,
        opcoes: perguntaAtual.opcoes,
      } : null,
      escolha: escolhaTravada,
      gabarito: gabaritoRevelado && perguntaAtual ? perguntaAtual.correta : null,
      vencedor: fase === 'fim' && campeao
        ? { nome: campeao.nome, token: campeao.token, icone: campeao.icone }
        : null,
      equipes: equipes.map((e) => ({
        token: e.token, nome: e.nome, icone: e.icone, cor: e.cor,
        casa: e.casa, pulos: e.pulos, escudos: e.escudos || 0,
      })),
      fimDoCronometro,
      ultimaCasa: TRATO.ULTIMA_CASA,
    });
  }

  /** O celular da equipe da vez apertou "Rolar o dado". */
  function rolarPeloCelular({ de }) {
    const eq = equipes[vez];
    if (!eq || eq.token !== de) return;
    rolarDado();
  }

  /**
   * Alguém apertou "Tentar!". Vale o primeiro que chegar. As mensagens
   * seguintes caem fora porque a fase já deixou de ser 'roubo_aberto'.
   */
  function tentarPeloCelular({ de }) {
    if (fase !== 'roubo_aberto') return;
    const eq = equipes.find((e) => e.token === de);
    if (!eq) return;
    if (equipes[vez] && equipes[vez].token === de) return;
    assumirRoubo(eq);
  }

  /** A equipe tocou numa alternativa no celular. */
  function responderPeloCelular({ de, escolha }) {
    registrarResposta(de, String(escolha || '').toUpperCase());
  }

  TRATO.Sincronia.ao('rolar', rolarPeloCelular);
  TRATO.Sincronia.ao('tentar', tentarPeloCelular);
  TRATO.Sincronia.ao('responder', responderPeloCelular);

  const semMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * Sobe contando de `de` até `para`, em vez de trocar o texto seco. Serve
   * tanto para um número puro (a casa) quanto para um número com sufixo fixo
   * (o "X" de "X / 42" perguntas) — `sufixo` fica de fora da conta e volta
   * colado em cada quadro. Sem movimento reduzido, ou se `de` não é um
   * número válido (primeira vez que o campo é preenchido), pula direto para
   * o valor final.
   */
  function animarContagem(el, de, para, sufixo = '') {
    if (semMovimento || !Number.isFinite(de) || de === para) {
      el.textContent = `${para}${sufixo}`;
      return;
    }
    const t0 = performance.now();
    const duracao = 380;
    const passo = (agora) => {
      const p = Math.min(1, (agora - t0) / duracao);
      const facil = 1 - (1 - p) ** 3;
      el.textContent = `${Math.round(de + (para - de) * facil)}${sufixo}`;
      if (p < 1) requestAnimationFrame(passo);
      else el.textContent = `${para}${sufixo}`;
    };
    requestAnimationFrame(passo);
  }

  function desenharPlacar() {
    const placar = $('placar');

    const antes = new Map();
    for (const ficha of placar.children) {
      antes.set(ficha.dataset.equipe, {
        top: ficha.getBoundingClientRect().top,
        casa: Number(ficha.querySelector('.placar-casa b')?.textContent),
      });
    }

    placar.innerHTML = '';
    placar.dataset.equipes = equipes.length;

    const ordenadas = [...equipes].sort((a, b) => b.casa - a.casa);

    for (const eq of ordenadas) {
      const item = document.createElement('div');
      item.className = 'placar-item' + (equipes[vez] && eq.id === equipes[vez].id ? ' ativa' : '');
      item.dataset.equipe = eq.id;

      const img = document.createElement('img');
      img.src = eq.icone;
      img.alt = '';

      const corpo = document.createElement('div');
      corpo.className = 'placar-corpo';
      const nome = document.createElement('div');
      nome.className = 'placar-nome';
      nome.textContent = eq.nome;
      const sub = document.createElement('div');
      sub.className = 'placar-sub' + (eq.pulos > 0 ? ' punida' : '');
      sub.textContent = eq.pulos > 0
        ? `parada ${eq.pulos} jogada${eq.pulos > 1 ? 's' : ''}`
        : TRATO.regiaoDaCasa(eq.casa).nome;
      sub.title = sub.textContent;
      corpo.append(nome, sub);

      if (eq.escudos > 0) {
        const escudo = document.createElement('span');
        escudo.className = 'placar-escudo';
        escudo.textContent = eq.escudos > 1 ? `⛊ ${eq.escudos}` : '⛊';
        escudo.title = `Protegida contra ${eq.escudos} penalidade(s)`;
        corpo.appendChild(escudo);
      }

      const faltam = Math.max(0, TRATO.ULTIMA_CASA - eq.casa);
      const casa = document.createElement('div');
      casa.className = 'placar-casa';
      const casaRotulo = document.createElement('small');
      casaRotulo.textContent = 'casa';
      const casaNum = document.createElement('b');
      casaNum.textContent = eq.casa;
      const casaFaltam = document.createElement('i');
      casaFaltam.textContent = faltam === 0 ? 'chegou' : 'faltam ' + faltam;
      casa.append(casaRotulo, casaNum, casaFaltam);

      item.append(img, corpo, casa);
      placar.appendChild(item);
    }

    if (semMovimento) return;
    for (const ficha of placar.children) {
      const info = antes.get(ficha.dataset.equipe);
      if (!info) continue;

      const salto = info.top - ficha.getBoundingClientRect().top;
      if (salto) {
        ficha.animate(
          [{ transform: `translateY(${salto}px)` }, { transform: 'none' }],
          { duration: 380, easing: 'cubic-bezier(.2,.7,.3,1)' },
        );
      }

      const casaNum = ficha.querySelector('.placar-casa b');
      const valorNovo = Number(casaNum?.textContent);
      if (casaNum && Number.isFinite(info.casa) && info.casa !== valorNovo) {
        animarContagem(casaNum, info.casa, valorNovo);
        piscar(casaNum);
      }
    }
  }

  function atualizarPainel() {
    if (!cfg) return;
    const usadas = cfg.perguntas.length - baralho.length;

    const elPerguntas = $('infoPerguntas');
    const usadasAntes = parseInt(elPerguntas.textContent, 10);
    animarContagem(elPerguntas, usadasAntes, usadas, ` / ${cfg.perguntas.length}`);
    if (Number.isFinite(usadasAntes) && usadasAntes !== usadas) piscar(elPerguntas);

    const elRodada = $('infoRodada');
    const rodadaAntes = parseInt(elRodada.textContent, 10);
    animarContagem(elRodada, rodadaAntes, rodada);
    if (Number.isFinite(rodadaAntes) && rodadaAntes !== rodada) piscar(elRodada);

    listarCasas($('infoPenalidades'), cfg.penalidadesNoTabuleiro);
    listarCasas($('infoVantagens'), cfg.vantagensNoTabuleiro);
  }

  /** Reinicia a animação `.tique` (ver acender(), mesmo truque). */
  function piscar(el) {
    if (semMovimento) return;
    el.classList.remove('tique');
    void el.offsetWidth;
    el.classList.add('tique');
  }

  /** As casas sorteadas de uma família, uma ficha por número. */
  function listarCasas(alvo, mapa) {
    alvo.innerHTML = '';
    const casas = Object.keys(mapa || {}).map(Number).sort((a, b) => a - b);

    if (!casas.length) {
      const vazio = document.createElement('span');
      vazio.className = 'casas-vazio';
      vazio.textContent = 'nenhuma';
      alvo.appendChild(vazio);
      return;
    }

    for (const casa of casas) {
      const ficha = document.createElement('span');
      ficha.className = 'casa-chip';
      ficha.textContent = casa;
      const carta = mapa[casa];
      if (carta) ficha.title = `${carta.nome}: ${carta.efeito}`;
      alvo.appendChild(ficha);
    }
  }

  return { iniciar };
})();

GameFX.advance = function (equipe, destino, equipes) {
  return TRATO.Tabuleiro.mover(equipe, destino, equipes);
};

TRATO.Config.iniciar();
