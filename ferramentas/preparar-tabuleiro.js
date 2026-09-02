
const fs = require('fs');
const path = require('path');

const RAIZ    = path.join(__dirname, '..');
const ORIGEM  = path.join(RAIZ, 'origem', 'mapa_tabuleiro.svg');
const TABULEIRO = path.join(RAIZ, 'public', 'assets', 'board.svg');
const CASAS     = path.join(RAIZ, 'public', 'assets', 'casas.json');

const GRUPO = '<g id="trilha-digestiva"';

const CASAS_PADRAO = 50;
const SEPARACAO_MINIMA = 26;
const ARCO_MINIMO = 8;
const FORCA_EMPURRAO = 0.30;
const PASSOS_MAXIMOS = 4000;

const MINIMO_POR_REGIAO = {
  'Boca': 4,
  'Faringe': 4,
  'Esôfago': 4,
  'Estômago': 4,
  'Duodeno': 4,
  'Intestino delgado': 4,
  'Intestino grosso': 4,
};
const MINIMO_PADRAO = 4;

const RAIO_MAXIMO = 10;
const RAIO_MINIMO = 6;

/** O maior raio de disco que ainda deixa folga visível com aquela separação. */
const raioParaSeparacao = (sep) =>
  Math.max(RAIO_MINIMO, Math.min(RAIO_MAXIMO, Math.floor((sep - 1) / 2)));

const atributo = (attrs, nome) => {
  const m = attrs.match(new RegExp(`${nome}="([^"]*)"`));
  return m ? m[1] : null;
};

/** Os pontos da polilinha do trajeto, na ordem em que foram desenhados. */
function lerTracado(cabecalho) {
  const m = cabecalho.match(/<path[^>]*\sd="([^"]*)"/);
  if (!m) return [];
  return [...m[1].matchAll(/(-?[\d.]+)[ ,](-?[\d.]+)/g)]
    .map((p) => ({ x: Number(p[1]), y: Number(p[2]) }));
}

const distancia = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * O traçado medido: para cada ponto, quanto de percurso já foi andado até ele.
 * É essa régua que transforma "a casa 20" em "a 1311 px da boca".
 */
function medir(tracado) {
  const acumulado = [0];
  for (let i = 0; i < tracado.length - 1; i++) {
    acumulado.push(acumulado[i] + distancia(tracado[i], tracado[i + 1]));
  }
  return acumulado;
}

/** Onde fica o ponto que está a `t` px de percurso da boca. */
function pontoEm(tracado, acumulado, t) {
  const total = acumulado[acumulado.length - 1];
  const alvo = Math.min(Math.max(t, 0), total);

  let baixo = 0, alto = acumulado.length - 1;
  while (baixo < alto - 1) {
    const meio = (baixo + alto) >> 1;
    if (acumulado[meio] <= alvo) baixo = meio; else alto = meio;
  }

  const trecho = acumulado[baixo + 1] - acumulado[baixo];
  const f = trecho === 0 ? 0 : (alvo - acumulado[baixo]) / trecho;
  return {
    x: tracado[baixo].x + (tracado[baixo + 1].x - tracado[baixo].x) * f,
    y: tracado[baixo].y + (tracado[baixo + 1].y - tracado[baixo].y) * f,
  };
}

/**
 * Quantas casas para cada órgão.
 *
 * Parte da proporção — quem tem mais trajeto tem mais casas — e depois aplica
 * o piso do MINIMO_POR_REGIAO. Como o piso empurra o total para cima, o
 * excedente é devolvido pelos órgãos mais folgados, um de cada vez, e nunca
 * por quem já está no próprio piso.
 *
 * @param {{nome:string, arco:number}[]} regioes
 * @returns {number[]} quantas casas cada região recebe, na mesma ordem
 */
function cotasPorRegiao(regioes, quantidade, total) {
  const piso = regioes.map((r) => MINIMO_POR_REGIAO[r.nome] ?? MINIMO_PADRAO);
  const cotas = regioes.map((r, i) =>
    Math.max(piso[i], Math.round((quantidade * r.arco) / total)));

  const soma = () => cotas.reduce((s, v) => s + v, 0);

  while (soma() > quantidade) {
    let alvo = -1, menor = Infinity;
    for (let i = 0; i < cotas.length; i++) {
      if (cotas[i] <= piso[i]) continue;
      const depois = regioes[i].arco / (cotas[i] - 1);
      if (depois < menor) { menor = depois; alvo = i; }
    }
    if (alvo < 0) break;
    cotas[alvo]--;
  }

  while (soma() < quantidade) {
    let alvo = 0, maior = -Infinity;
    for (let i = 0; i < cotas.length; i++) {
      const depois = regioes[i].arco / (cotas[i] + 1);
      if (depois > maior) { maior = depois; alvo = i; }
    }
    cotas[alvo]++;
  }

  return cotas;
}

/**
 * As N casas, como distâncias de percurso a partir da boca.
 *
 * Cada órgão recebe a sua cota e a espalha por igual dentro do próprio
 * trecho, o que crava a primeira casa de cada órgão exatamente na fronteira
 * dele. Depois vem a relaxação, até nenhuma casa estar a menos de
 * SEPARACAO_MINIMA de outra no desenho. As duas pontas não se movem: a casa 1
 * é a boca e a casa N é o ânus.
 *
 * @param {{nome:string, inicio:number, arco:number}[]|null} regioes
 *        com as regiões, a distribuição respeita as cotas; sem elas, o
 *        trajeto é dividido em partes iguais, como antes.
 */
function distribuirCasas(tracado, acumulado, quantidade, regioes) {
  const total = acumulado[acumulado.length - 1];

  let t, cotas = null;

  if (regioes && regioes.length) {
    cotas = cotasPorRegiao(regioes, quantidade, total);
    t = [];
    regioes.forEach((r, i) => {
      const q = cotas[i];
      const ultimo = i === regioes.length - 1;
      const passo = ultimo ? r.arco / Math.max(1, q - 1) : r.arco / q;
      for (let k = 0; k < q; k++) t.push(r.inicio + passo * k);
    });
  } else {
    t = Array.from({ length: quantidade }, (_, i) => (total * i) / (quantidade - 1));
  }

  let passos = 0;
  for (; passos < PASSOS_MAXIMOS; passos++) {
    const pontos = t.map((v) => pontoEm(tracado, acumulado, v));
    const forca = new Array(quantidade).fill(0);
    let violou = false;

    for (let a = 0; a < quantidade; a++) {
      for (let b = a + 1; b < quantidade; b++) {
        const d = distancia(pontos[a], pontos[b]);
        if (d >= SEPARACAO_MINIMA - 0.02) continue;
        violou = true;
        const empurrao = (SEPARACAO_MINIMA - d) * FORCA_EMPURRAO;
        if (t[a] < t[b]) { forca[a] -= empurrao; forca[b] += empurrao; }
        else             { forca[a] += empurrao; forca[b] -= empurrao; }
      }
    }

    if (!violou) break;

    for (let k = 0; k < quantidade; k++) t[k] += forca[k];

    t[0] = 0;
    t[quantidade - 1] = total;
    t.sort((p, q) => p - q);
    for (let k = 1; k < quantidade - 1; k++) {
      t[k] = Math.max(t[k], t[k - 1] + ARCO_MINIMO);
      t[k] = Math.min(t[k], total - (quantidade - 1 - k) * ARCO_MINIMO);
    }
  }

  return {
    casas: t.map((v) => {
      const p = pontoEm(tracado, acumulado, v);
      return { t: v, x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 };
    }),
    passos,
    cotas,
  };
}

function lerParadas(grupo) {
  const tokens = [...grupo.matchAll(/<(circle|text)\b([^>]*?)\/?>([^<]*)/g)];
  const paradas = [];

  for (let i = 0; i < tokens.length; i++) {
    const [, tag, attrs] = tokens[i];
    if (tag !== 'circle') continue;

    const seguinte = tokens[i + 1];
    if (!seguinte || seguinte[1] !== 'text') continue;

    paradas.push({
      x: Number(atributo(attrs, 'cx')),
      y: Number(atributo(attrs, 'cy')),
      rotulo: seguinte[3].trim(),
    });
  }
  return paradas;
}

/**
 * Em que distância de percurso está cada casa antiga.
 *
 * A busca é obrigada a andar sempre para a frente. Sem essa trava, uma casa
 * das alças do delgado seria atribuída ao pedaço de traçado do cólon que
 * passa rente a ela, e a ordem sairia embaralhada justamente onde importa.
 */
function ancorar(paradas, tracado, acumulado) {
  let minimo = -1;
  return paradas.map((p) => {
    let melhor = Infinity, onde = minimo;
    for (let k = 0; k < tracado.length; k++) {
      if (acumulado[k] <= minimo) continue;
      const d = distancia(p, tracado[k]);
      if (d < melhor) { melhor = d; onde = acumulado[k]; }
    }
    minimo = onde;
    return { t: onde, erro: melhor };
  });
}

/**
 * Uma parada, no estilo em que o próprio mapa a desenhou — só o disco.
 *
 * O número **não** vem junto, e essa é a diferença que permite virar o
 * tabuleiro de pé. Aqui ele estaria assado dentro da imagem, e giraria com
 * ela: um "38" deitado de lado, ilegível do fundo da sala. Quem escreve os
 * números é o `tabuleiro.js`, na camada de cima, onde eles podem ser girados
 * de volta para a horizontal. O disco é um círculo e não liga para rotação.
 */
function desenharParada(p, raio) {
  return `<circle cx="${p.x}" cy="${p.y}" r="${raio}" fill="#FBF4EC"` +
    ` stroke="#7A4A3A" stroke-width="1.4" filter="url(#stopShadow)"/>`;
}

/** As fronteiras de órgão do mapa antigo, traduzidas para a numeração nova. */
const REGIOES_ANTIGAS = [
  { casa: 1,  nome: 'Boca' },
  { casa: 2,  nome: 'Faringe' },
  { casa: 3,  nome: 'Esôfago' },
  { casa: 7,  nome: 'Estômago' },
  { casa: 10, nome: 'Duodeno' },
  { casa: 12, nome: 'Intestino delgado' },
  { casa: 24, nome: 'Intestino grosso' },
];

/**
 * Os trechos de trajeto de cada órgão, medidos sobre as casas do ilustrador.
 * É o que permite distribuir as casas novas por órgão em vez de por igual.
 */
function trechosDasRegioes(ancoras, total) {
  const marcos = REGIOES_ANTIGAS
    .filter((r) => ancoras[r.casa - 1])
    .map((r) => ({ nome: r.nome, inicio: ancoras[r.casa - 1].t }));

  return marcos.map((m, i) => ({
    nome: m.nome,
    inicio: m.inicio,
    arco: (i + 1 < marcos.length ? marcos[i + 1].inicio : total) - m.inicio,
  }));
}

function conferir(casas) {
  let pior = Infinity, par = null;
  for (let a = 0; a < casas.length; a++) {
    for (let b = a + 1; b < casas.length; b++) {
      const d = distancia(casas[a], casas[b]);
      if (d < pior) { pior = d; par = [a + 1, b + 1]; }
    }
  }
  const vizinhas = casas.slice(1).map((c, i) => distancia(casas[i], c));
  return {
    pior, par,
    minima: Math.min(...vizinhas),
    media: vizinhas.reduce((s, v) => s + v, 0) / vizinhas.length,
    maxima: Math.max(...vizinhas),
  };
}

function main() {
  const pedido = (process.argv.find((a) => a.startsWith('--casas=')) || '').split('=')[1];
  const quantidade = Number(pedido) || CASAS_PADRAO;
  if (quantidade < 2) {
    console.error('Um tabuleiro precisa de pelo menos 2 casas.');
    process.exit(1);
  }

  const svg = fs.readFileSync(ORIGEM, 'utf8');

  const inicio = svg.indexOf(GRUPO);
  if (inicio < 0) {
    console.error(`Não achei ${GRUPO}...> em ${path.basename(ORIGEM)}.`);
    console.error('O mapa precisa ter o trajeto e as casas dentro desse grupo.');
    process.exit(1);
  }

  const viewBox = (svg.match(/viewBox="([^"]+)"/) || [])[1] || '(sem viewBox)';

  const grupo = svg.slice(inicio);
  const cabecalho = grupo.slice(0, grupo.indexOf('<circle'));

  const tracado = lerTracado(cabecalho);
  if (tracado.length < 2) {
    console.error('Não achei o traçado do trajeto (o <path> pontilhado) no grupo.');
    console.error('É dele que saem as casas, então sem ele não dá para seguir.');
    process.exit(1);
  }

  const acumulado = medir(tracado);
  const comprimento = acumulado[acumulado.length - 1];

  const paradas = lerParadas(grupo);
  const ancoras = paradas.length ? ancorar(paradas, tracado, acumulado) : [];
  const trechos = ancoras.length ? trechosDasRegioes(ancoras, comprimento) : [];

  const { casas, passos, cotas } = distribuirCasas(tracado, acumulado, quantidade, trechos);
  const medidas = conferir(casas);

  const raioCasa = raioParaSeparacao(medidas.pior);
  casas.forEach((c) => { c.r = raioCasa; });

  const regioes = [];
  let acumuladoDeCasas = 0;
  trechos.forEach((r, i) => {
    regioes.push({ nome: r.nome, casa: acumuladoDeCasas + 1, casas: cotas[i], arco: r.arco });
    acumuladoDeCasas += cotas[i];
  });

  const desenhadas = casas.map((p) => desenharParada(p, p.r)).join('\n');
  const novo = svg.slice(0, inicio) + cabecalho + desenhadas + '\n</g></svg>\n';

  const semArco = casas.map((p, i) => ({ n: i + 1, x: p.x, y: p.y, r: p.r }));

  fs.writeFileSync(TABULEIRO, novo, 'utf8');
  fs.writeFileSync(CASAS, JSON.stringify(semArco), 'utf8');

  console.log(`Mapa lido:   ${path.basename(ORIGEM)}  (viewBox ${viewBox})`);
  console.log(`Trajeto:     ${comprimento.toFixed(1)} px de percurso, ${tracado.length} pontos`);
  console.log(`Casas:       ${quantidade}, distribuídas e relaxadas em ${passos} passo(s)`);
  console.log('');
  console.log(`  separação mínima entre duas casas quaisquer: ${medidas.pior.toFixed(1)} px`
              + ` (casas ${medidas.par[0]} e ${medidas.par[1]})`);
  console.log(`  entre casas seguidas: ${medidas.minima.toFixed(1)} min ·`
              + ` ${medidas.media.toFixed(1)} média · ${medidas.maxima.toFixed(1)} max`);
  console.log(`  raio do disco: ${raioCasa}${raioCasa < RAIO_MAXIMO ? '  (reduzido: falta espaço)' : ''}`);
  if (raioCasa < RAIO_MAXIMO) {
    console.log('');
    console.log('  ATENÇÃO: algum órgão não tem trajeto para o piso de casas que pediram,');
    console.log('  e o tabuleiro inteiro encolheu para caber. Baixe o MINIMO_POR_REGIAO do');
    console.log('  órgão marcado como apertado na tabela abaixo.');
  }

  if (regioes.length) {
    const erro = Math.max(...ancoras.map((a) => a.erro));
    console.log('');
    console.log(`Os órgãos (${paradas.length} casas do desenho, ancoradas com erro`
                + ` de até ${erro.toFixed(1)} px):`);
    console.log('');
    console.log('  órgão                casas   começa   arco     vão   raio');
    for (let i = 0; i < regioes.length; i++) {
      const r = regioes[i];
      const fim = r.casa + r.casas - 1;
      const vao = r.casas > 1 ? r.arco / r.casas : r.arco;
      const apertado = vao < SEPARACAO_MINIMA ? '  <- apertado' : '';
      console.log(`  ${r.nome.padEnd(20)}${String(r.casas).padStart(4)}`
                  + `  ${String(r.casa).padStart(4)}-${String(fim).padEnd(3)}`
                  + `${r.arco.toFixed(0).padStart(6)}px`
                  + `${vao.toFixed(0).padStart(6)}px`
                  + `${String(casas[r.casa - 1].r).padStart(6)}${apertado}`);
    }
    console.log('');
    console.log('  Cole em TRATO.REGIOES (public/js/dados.js):');
    for (const r of regioes) {
      console.log(`    { casa: ${String(r.casa).padStart(2)}, nome: '${r.nome}' },`);
    }

  }

  console.log('');
  console.log(`Gravado:     ${path.relative(RAIZ, TABULEIRO)}`);
  console.log(`Gravado:     ${path.relative(RAIZ, CASAS)}`);
  console.log('');
  console.log('Falta conferir à mão, porque só o olho resolve:');
  console.log(`  · public/index.html  -> viewBox do <svg id="pecas"> = "${viewBox}"`);
  console.log('  · public/js/dados.js -> TRATO.CASAS (cole o casas.json) e TRATO.REGIOES');
}

main();
