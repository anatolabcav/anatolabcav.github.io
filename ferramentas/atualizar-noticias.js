
'use strict';

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const SAIDA = path.join(__dirname, '..', 'site', 'dados', 'ufpe.json');
const LIMITE = 48;
const ESPERA = 25000;

const FONTES = [
  {
    rotulo: 'CAV/UFPE',
    tag: 'Campus',
    url: 'http://www.ufpe.br/cav/-/asset_publisher/7UAqmlBTTbfv/rss?p_p_cacheability=cacheLevelFull'
  },
  {
    rotulo: 'UFPE',
    tag: 'Universidade',
    url: 'http://www.ufpe.br/ascom/-/asset_publisher/dlhi8nsrz4hK/rss?p_p_cacheability=cacheLevelFull'
  },
  {
    rotulo: 'UFPE',
    tag: 'Ciência',
    url: 'http://www.ufpe.br/ascom/-/asset_publisher/560IJ2hfNESM/rss?p_p_cacheability=cacheLevelFull'
  }
];

function pedaco(xml, campo) {
  const m = xml.match(new RegExp('<' + campo + '[^>]*>([\\s\\S]*?)</' + campo + '>', 'i'));
  return m ? limpa(m[1]) : '';
}

function limpa(t) {
  return String(t)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function paraISO(txt) {
  const d = new Date(txt);
  if (isNaN(d)) return '';
  return d.toISOString().slice(0, 10);
}

function encurta(t, max) {
  if (!t || t.length <= max) return t;
  const corte = t.slice(0, max);
  const espaco = corte.lastIndexOf(' ');
  return (espaco > max * 0.6 ? corte.slice(0, espaco) : corte).trim() + '…';
}

function linkAtom(bloco) {
  const alternate = bloco.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i);
  if (alternate) return limpa(alternate[1]);
  const qualquer = bloco.match(/<link[^>]*href=["']([^"']+)["']/i);
  return qualquer ? limpa(qualquer[1]) : '';
}

function leItens(xml, fonte) {
  const atom = /<entry[\s>]/i.test(xml);
  const re = atom
    ? /<entry[^>]*>([\s\S]*?)<\/entry>/gi
    : /<item[^>]*>([\s\S]*?)<\/item>/gi;

  const itens = [];
  let m;
  while ((m = re.exec(xml)) !== null) {
    const bloco = m[1];
    const titulo = pedaco(bloco, 'title');
    const link = atom ? linkAtom(bloco) : pedaco(bloco, 'link');
    if (!titulo || !link) continue;

    const resumo = atom
      ? (pedaco(bloco, 'summary') || pedaco(bloco, 'content'))
      : pedaco(bloco, 'description');

    const data = atom
      ? (pedaco(bloco, 'published') || pedaco(bloco, 'updated')).slice(0, 10)
      : (paraISO(pedaco(bloco, 'pubDate')) || pedaco(bloco, 'dc:date').slice(0, 10));

    itens.push({
      titulo,
      resumo: encurta(resumo, 168),
      data,
      link: link.replace(/^http:\/\//i, 'https://'),
      fonte: fonte.rotulo,
      tags: [fonte.tag]
    });
  }
  return itens;
}

const CAMINHOS_CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
].filter(Boolean);

function achaChrome() {
  for (const c of CAMINHOS_CHROME) {
    try { if (fs.existsSync(c)) return c; } catch (e) {}
  }
  return null;
}

async function descricao(url) {
  try {
    const corta = new AbortController();
    const relogio = setTimeout(() => corta.abort(), ESPERA);
    const r = await fetch(url, {
      signal: corta.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; site-lihof-cav-ufpe)' }
    });
    clearTimeout(relogio);
    if (!r.ok) return '';
    const html = await r.text();
    const m = html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i)
           || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i);
    return m ? encurta(limpa(m[1]), 168) : '';
  } catch (e) { return ''; }
}

function foto(chrome, url) {
  return new Promise(resolve => {
    execFile(chrome, [
      '--headless', '--disable-gpu', '--no-first-run', '--mute-audio',
      '--virtual-time-budget=9000', '--dump-dom', url
    ], { maxBuffer: 40 * 1024 * 1024, timeout: 45000 }, (erro, saida) => {
      if (erro && !saida) return resolve('');
      const html = String(saida || '');
      const i = html.indexOf('full-content__full-content');
      if (i < 0) return resolve('');
      const bloco = html.slice(i, i + 8000);
      for (const m of bloco.matchAll(/<img[^>]+src=["']([^"']+)["']/g)) {
        const src = m[1];
        if (!/\/documents\//.test(src)) continue;
        if (/24x24|logo|icone|banner_internas|Assinatura/i.test(src)) continue;
        return resolve(src.startsWith('http')
          ? src.replace(/^http:\/\//i, 'https://')
          : 'https://www.ufpe.br' + src);
      }
      resolve('');
    });
  });
}

async function emLotes(lista, tamanho, tarefa) {
  for (let i = 0; i < lista.length; i += tamanho) {
    await Promise.all(lista.slice(i, i + tamanho).map(tarefa));
  }
}

async function enriquece(itens) {
  const antes = new Map();
  try {
    const velho = JSON.parse(fs.readFileSync(SAIDA, 'utf8'));
    (velho.itens || []).forEach(n => antes.set(n.link, n));
  } catch (e) {}

  const novos = [];
  for (const n of itens) {
    const v = antes.get(n.link);
    if (v && v.visto) {
      if (v.imagem) n.imagem = v.imagem;
      if (!n.resumo && v.resumo) n.resumo = v.resumo;
      n.visto = true;
    } else {
      novos.push(n);
    }
  }

  if (!novos.length) {
    console.log('\nNenhuma notícia nova para detalhar.');
    itens.forEach(n => { n.visto = true; });
    return;
  }

  console.log('\nDetalhando ' + novos.length + ' notícia(s) nova(s)…');

  await emLotes(novos, 6, async n => {
    if (!n.resumo) n.resumo = await descricao(n.link);
  });
  console.log('  resumos: ' + novos.filter(n => n.resumo).length + '/' + novos.length);

  const chrome = achaChrome();
  if (!chrome) {
    console.log('  fotos:   Chrome não encontrado, etapa pulada.');
    console.log('           (defina a variável CHROME com o caminho do executável para ativar)');
  } else {
    await emLotes(novos, 3, async n => { n.imagem = await foto(chrome, n.link); });
    console.log('  fotos:   ' + novos.filter(n => n.imagem).length + '/' + novos.length);
  }

  novos.forEach(n => { n.visto = true; if (!n.imagem) delete n.imagem; });
}

async function baixa(fonte) {
  const corta = new AbortController();
  const relogio = setTimeout(() => corta.abort(), ESPERA);
  try {
    const r = await fetch(fonte.url, {
      signal: corta.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; site-lihof-cav-ufpe)' }
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return leItens(await r.text(), fonte);
  } finally {
    clearTimeout(relogio);
  }
}

async function principal() {
  if (typeof fetch !== 'function') {
    console.error('Este script precisa do Node 18 ou mais novo (é ele que traz o fetch).');
    console.error('Veja a versão instalada com: node --version');
    process.exit(1);
  }

  console.log('Baixando as notícias oficiais…\n');

  const resultados = await Promise.allSettled(FONTES.map(baixa));
  let todas = [];
  let falhas = 0;

  resultados.forEach((r, i) => {
    const nome = FONTES[i].rotulo + ' · ' + FONTES[i].tag;
    if (r.status === 'fulfilled') {
      console.log('  ok    ' + nome + ' — ' + r.value.length + ' notícias');
      todas = todas.concat(r.value);
    } else {
      falhas++;
      console.log('  falha ' + nome + ' — ' + (r.reason && r.reason.message));
    }
  });

  if (!todas.length) {
    console.error('\nNenhuma notícia baixada. O arquivo antigo foi mantido como está.');
    process.exit(falhas ? 1 : 0);
  }

  const vistos = new Set();
  const unicas = todas.filter(n => {
    const chave = n.link.toLowerCase();
    if (vistos.has(chave)) return false;
    vistos.add(chave);
    return true;
  });

  unicas.sort((a, b) => String(b.data).localeCompare(String(a.data)));

  const escolhidas = unicas.slice(0, LIMITE);
  await enriquece(escolhidas);

  const saida = {
    _leia: 'Arquivo GERADO por ferramentas/atualizar-noticias.js. Não edite à mão — ' +
           'a próxima execução sobrescreve tudo. As notícias do laboratório ficam em lihof.json.',
    atualizado: new Date().toISOString(),
    itens: escolhidas
  };

  fs.mkdirSync(path.dirname(SAIDA), { recursive: true });
  fs.writeFileSync(SAIDA, JSON.stringify(saida, null, 2) + '\n', 'utf8');

  console.log('\n' + saida.itens.length + ' notícias gravadas em site/dados/ufpe.json');
  console.log('Com foto: ' + saida.itens.filter(n => n.imagem).length + ' | com resumo: ' + saida.itens.filter(n => n.resumo).length);
console.log('Mais recente: ' + saida.itens[0].data + ', ' + saida.itens[0].titulo);
}

principal().catch(e => {
  console.error('Erro inesperado:', e);
  process.exit(1);
});
