
window.TRATO = window.TRATO || {};

TRATO.Tabuleiro = (() => {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const XLINK  = 'http://www.w3.org/1999/xlink';

  const casas     = TRATO.CASAS;
  const palco     = document.getElementById('stage');
  const caixa     = document.getElementById('palcoCaixa');
  const pecas     = document.getElementById('pecas');
  const camera    = document.getElementById('camera');
  const controles = document.getElementById('controles');

  let raiz = null;
  let camadaPenalidades = null;
  let camadaPecas = null;
  const marcadores = new Map();

  const elem = (tag, attrs = {}) => {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  };

  const LARGURA = 1200;
  const ALTURA = 675;
  const reduzirMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let vertical = false;
  let alvoAtual = { x: LARGURA / 2, y: ALTURA / 2 };

  const travar = (v, min, max) => Math.min(Math.max(v, min), max);

  function aplicarOrientacao() {
    ajustarTamanho();
  }

  /**
   * Um texto que fica na horizontal mesmo com o tabuleiro em pé.
   * Deitado, é um <text> comum. Em pé, vai dentro de um grupo que desfaz a
   * rotação em torno do próprio ponto do texto.
   */
  function textoEmPe(x, y, attrs, conteudo) {
    const t = elem('text', {
      ...attrs, x: 0, y: 0,
      'text-anchor': 'middle', 'dominant-baseline': 'central',
    });
    t.textContent = conteudo;
    const g = elem('g', {
      transform: vertical ? `translate(${x},${y}) rotate(-90)` : `translate(${x},${y})`,
    });
    g.appendChild(t);
    return g;
  }

  const raioDaCasa = (n) => pontoDaCasa(n).r || 10;
  const R_MENOR = Math.min(...casas.map((c) => c.r || 10));

  const P_MARCA = 1.2;
  const P_HALO  = 1.55;
  const P_SELO  = 0.65;
  const P_DIST  = 1.15;

  const R_PECA  = R_MENOR * 1.3;
  const R_ARO   = R_MENOR * 1.7;
  const R_ICONE = R_MENOR * 1.1;

  /** O corpo do número, que encolhe junto com o disco em que ele é escrito. */
  const corpoDoNumero = (n, raio) => {
    const base = raio >= 10 ? 11 : 9;
    return String(n).length > 1 ? base - 1 : base;
  };

  /** Coordenada de uma casa (1..50), com trava nos limites. */
  const pontoDaCasa = (n) => casas[Math.min(Math.max(n, 1), casas.length) - 1];

  /**
   * Para que lado apontar o selo de uma casa especial.
   *
   * O selo é a única parte da marca que sai do disco, e por isso é a única
   * que pode invadir a casa do lado. Com 50 casas há trechos em que duas
   * ficam a 26 px uma da outra, o suficiente para o selo de uma sumir
   * debaixo do disco da outra, que foi o que aconteceu quando ele era sempre
   * na diagonal de cima à direita.
   *
   * Então ele escolhe: das quatro diagonais, fica na que estiver mais longe
   * da casa vizinha mais próxima. Casa isolada continua com o selo em cima à
   * direita, que é onde ele sempre esteve.
   */
  const DIAGONAIS = [[1, -1], [1, 1], [-1, -1], [-1, 1]];

  function ladoDoSelo(n, dist) {
    const p = pontoDaCasa(n);
    const vizinhas = casas.filter((c) => c.n !== n
      && Math.abs(c.x - p.x) < 50 && Math.abs(c.y - p.y) < 50);
    if (!vizinhas.length) return DIAGONAIS[0];

    let melhor = DIAGONAIS[0], folga = -Infinity;
    for (const [dx, dy] of DIAGONAIS) {
      const sx = p.x + dx * dist, sy = p.y + dy * dist;
      const perto = Math.min(...vizinhas.map((c) => Math.hypot(c.x - sx, c.y - sy)));
      if (perto > folga) { folga = perto; melhor = [dx, dy]; }
    }
    return melhor;
  }

  function ajustarTamanho() {
    if (!caixa || !palco) return;
    const l = caixa.clientWidth, a = caixa.clientHeight;
    if (!l || !a) return;

    const escala = Math.min(l / 16, a / 9);
    const largura = Math.floor(escala * 16);
    palco.style.width  = largura + 'px';
    palco.style.height = Math.floor(escala * 9) + 'px';
    if (controles) controles.style.width = largura + 'px';

    enquadrar(alvoAtual, { imediato: true });
  }

  function enquadrar(alvo, { imediato = false, duracao = 0 } = {}) {
    if (!camera || !palco) return;
    alvoAtual = alvo;

    const Sl = palco.clientWidth, Sa = palco.clientHeight;
    if (!Sl || !Sa) return;

    const larguraMapa = vertical ? ALTURA : LARGURA;
    const alturaMapa  = vertical ? LARGURA : ALTURA;
    const k = vertical
      ? Math.max(Sl / larguraMapa, Sa / alturaMapa)
      : Math.min(Sl / larguraMapa, Sa / alturaMapa);

    const janelaX = (vertical ? Sa : Sl) / k;
    const janelaY = (vertical ? Sl : Sa) / k;

    const cx = janelaX >= LARGURA ? LARGURA / 2
             : travar(alvo.x, janelaX / 2, LARGURA - janelaX / 2);
    const cy = janelaY >= ALTURA ? ALTURA / 2
             : travar(alvo.y, janelaY / 2, ALTURA - janelaY / 2);

    const seco = imediato || reduzirMovimento;
    camera.classList.toggle('sem-transicao', seco);
    camera.style.transitionDuration = seco ? '' : (duracao ? duracao + 'ms' : '');
    camera.style.transform =
      `translate(${Sl / 2}px, ${Sa / 2}px) rotate(${vertical ? 90 : 0}deg)`
      + ` scale(${k}) translate(${-cx}px, ${-cy}px)`;

    if (seco) { void camera.offsetWidth; camera.classList.remove('sem-transicao'); }
  }

  /** Leva a câmera até uma casa do tabuleiro. */
  function seguir(casa, opcoes) {
    const p = pontoDaCasa(casa);
    enquadrar({ x: p.x, y: p.y }, opcoes);
  }

  function montar() {
    pecas.innerHTML = '';

    const defs = elem('defs');
    const clip = elem('clipPath', { id: 'recorte-peca' });
    clip.appendChild(elem('circle', { cx: 0, cy: 0, r: R_ICONE }));
    defs.appendChild(clip);
    pecas.appendChild(defs);

    raiz = elem('g', { class: 'camada-raiz' });
    camadaPenalidades = elem('g', { class: 'camada-penalidades' });
    camadaPecas = elem('g', { class: 'camada-pecas' });
    raiz.appendChild(camadaPenalidades);
    raiz.appendChild(camadaPecas);
    pecas.appendChild(raiz);

    marcadores.clear();
    aplicarOrientacao();

    requestAnimationFrame(ajustarTamanho);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(ajustarTamanho);
    }
  }

  const CARMIM = '#BD3228';
  const CARMIM_ESCURO = '#93271F';
  const VERDE = '#1B7E53';
  const VERDE_ESCURO = '#145D3D';

  /**
   * Uma casa especial: mesmo desenho para as duas famílias, mudando a cor e o
   * que está escrito no selo. Vermelho com "!" é castigo; verde com "+" é
   * vantagem. São as mesmas duas cores do "errou" e do "acertou", que a turma
   * já aprendeu a ler no primeiro minuto de partida.
   */
  function marcaDaCasa(n, cor, corEscura, selo) {
    const p = pontoDaCasa(n);
    const raio = raioDaCasa(n);
    const g = elem('g', { class: 'marca-casa' });

    g.appendChild(elem('circle', {
      class: 'halo', cx: p.x, cy: p.y, r: raio * P_HALO, fill: 'none',
      stroke: cor, 'stroke-width': raio * 0.32, opacity: 0.55,
    }));
    g.appendChild(elem('circle', { cx: p.x, cy: p.y, r: raio * P_MARCA, fill: '#FFFFFF' }));
    g.appendChild(elem('circle', {
      cx: p.x, cy: p.y, r: raio, fill: cor,
      stroke: corEscura, 'stroke-width': 1.4,
    }));
    g.appendChild(textoEmPe(p.x, p.y, {
      'font-family': "Georgia,'Times New Roman',serif",
      'font-size': corpoDoNumero(n, raio),
      'font-weight': 'bold', fill: '#FFF6F2',
    }, n));
    const dist = raio * P_DIST;
    const [dx, dy] = ladoDoSelo(n, dist);
    const sx = p.x + dx * dist, sy = p.y + dy * dist;
    g.appendChild(elem('circle', {
      cx: sx, cy: sy, r: raio * P_SELO,
      fill: '#FFFFFF', stroke: cor, 'stroke-width': 1.8,
    }));
    g.appendChild(textoEmPe(sx, sy, {
      'font-size': raio, 'font-weight': 700, fill: cor,
      'font-family': 'Archivo,Arial,sans-serif',
    }, selo));

    return g;
  }

  /** O número de uma casa comum, escrito por cima do disco do board.svg. */
  function numeroDaCasa(n) {
    const p = pontoDaCasa(n);
    return textoEmPe(p.x, p.y, {
      'font-family': "Georgia,'Times New Roman',serif",
      'font-size': corpoDoNumero(n, raioDaCasa(n)),
      'font-weight': 'bold', fill: '#3B2119',
    }, n);
  }

  /**
   * Desenha a camada das casas inteira: o número de cada uma e, por cima das
   * sorteadas, a marca de castigo ou de vantagem.
   *
   * Os números vêm daqui e não do board.svg porque precisam poder ficar em pé
   * quando o mapa gira. Casa especial não recebe o número escuro: o disco
   * colorido já traz o dela, em branco.
   */
  function desenharCasasEspeciais(penalidades, vantagens) {
    if (!camadaPenalidades) return;
    camadaPenalidades.innerHTML = '';

    const pen = penalidades || {};
    const van = vantagens || {};

    for (const c of casas) {
      if (pen[c.n] || van[c.n]) continue;
      camadaPenalidades.appendChild(numeroDaCasa(c.n));
    }
    for (const casa of Object.keys(van)) {
      camadaPenalidades.appendChild(marcaDaCasa(Number(casa), VERDE, VERDE_ESCURO, '+'));
    }
    for (const casa of Object.keys(pen)) {
      camadaPenalidades.appendChild(marcaDaCasa(Number(casa), CARMIM, CARMIM_ESCURO, '!'));
    }
  }

  function criarMarcadores(equipes) {
    if (!camadaPecas) return;
    camadaPecas.innerHTML = '';
    marcadores.clear();

    for (const eq of equipes) {
      const g = elem('g', { class: 'peca', 'data-equipe': eq.id });

      const conteudo = elem('g', vertical ? { transform: 'rotate(-90)' } : {});

      conteudo.appendChild(elem('circle', {
        class: 'aro-vez', cx: 0, cy: 0, r: R_ARO,
        fill: 'none', stroke: eq.cor, 'stroke-width': 2,
      }));
      conteudo.appendChild(elem('circle', {
        cx: 0, cy: 0, r: R_PECA, fill: '#FFFFFF',
        stroke: eq.cor, 'stroke-width': 2.3,
      }));
      const img = elem('image', {
        x: -R_ICONE, y: -R_ICONE, width: R_ICONE * 2, height: R_ICONE * 2,
        'clip-path': 'url(#recorte-peca)', preserveAspectRatio: 'xMidYMid slice',
      });
      img.setAttribute('href', eq.icone);
      img.setAttributeNS(XLINK, 'xlink:href', eq.icone);
      conteudo.appendChild(img);
      g.appendChild(conteudo);

      camadaPecas.appendChild(g);
      marcadores.set(eq.id, g);
      posicionar(eq, equipes);
    }
  }

  /**
   * Onde o marcador fica de fato. Quando várias equipes dividem a mesma casa,
   * elas se espalham num anel em volta do centro para nenhuma sumir embaixo
   * da outra.
   */
  function coordenada(eq, equipes) {
    const p = pontoDaCasa(eq.casa);
    const juntas = equipes.filter((o) => o.casa === eq.casa);
    if (juntas.length < 2) return { x: p.x, y: p.y };

    const i = juntas.findIndex((o) => o.id === eq.id);
    const raio = 10.5 + juntas.length * 1.3;
    const ang = (i / juntas.length) * Math.PI * 2 - Math.PI / 2;
    return { x: p.x + Math.cos(ang) * raio, y: p.y + Math.sin(ang) * raio };
  }

  function aplicar(g, x, y) {
    g.style.transform = `translate(${x}px, ${y}px)`;
  }

  /** Coloca o marcador na hora, sem animação. */
  function posicionar(eq, equipes) {
    const g = marcadores.get(eq.id);
    if (!g) return;
    const { x, y } = coordenada(eq, equipes);
    aplicar(g, x, y);
  }

  /** Reposiciona todo mundo (usado quando alguém entra ou sai de uma casa). */
  function reposicionar(equipes) {
    for (const eq of equipes) posicionar(eq, equipes);
  }

  /**
   * Anda de `eq.casa` até `destino` pulando uma casa por vez, com som.
   * Serve para frente e para trás (penalidades).
   * @returns {Promise<void>} resolve quando o marcador chega.
   */
  function mover(eq, destino, equipes) {
    return new Promise((resolve) => {
      const g = marcadores.get(eq.id);
      const fim = Math.min(Math.max(destino, TRATO.PRIMEIRA_CASA), TRATO.ULTIMA_CASA);
      if (!g || fim === eq.casa) { eq.casa = fim; reposicionar(equipes); resolve(); return; }

      const passo = fim > eq.casa ? 1 : -1;
      const intervalo = reduzirMovimento ? 30 : 230;

      const pular = () => {
        eq.casa += passo;
        const p = pontoDaCasa(eq.casa);
        aplicar(g, p.x, p.y);
        enquadrar({ x: p.x, y: p.y }, { duracao: intervalo });
        if (typeof GameSound !== 'undefined') GameSound.hop();

        if (eq.casa !== fim) {
          setTimeout(pular, intervalo);
        } else {
          setTimeout(() => { reposicionar(equipes); resolve(); }, intervalo);
        }
      };
      setTimeout(pular, reduzirMovimento ? 0 : 160);
    });
  }

  /** Marca de quem é a vez (aro pulsante) e quem está parada por penalidade. */
  function destacar(equipes, idAtivo) {
    for (const eq of equipes) {
      const g = marcadores.get(eq.id);
      if (!g) continue;
      g.classList.toggle('ativa', eq.id === idAtivo);
      g.classList.toggle('parada', (eq.pulos || 0) > 0 && eq.id !== idAtivo);
    }
    const ativa = equipes.find((eq) => eq.id === idAtivo);
    if (ativa) seguir(ativa.casa);
  }

  if (caixa) new ResizeObserver(ajustarTamanho).observe(caixa);
  window.addEventListener('resize', ajustarTamanho);

  /**
   * Vira o tabuleiro. Quem chama precisa redesenhar as casas e os marcadores
   * depois, porque os textos e os ícones são montados já sabendo se vão ou não
   * precisar da rotação de volta.
   */
  function definirVertical(valor) {
    vertical = !!valor;
    aplicarOrientacao();
  }

  return { montar, ajustarTamanho, desenharCasasEspeciais, criarMarcadores,
           mover, reposicionar, destacar, pontoDaCasa, definirVertical, seguir,
           get vertical() { return vertical; } };
})();
