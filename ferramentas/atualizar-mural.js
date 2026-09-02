'use strict';

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const ARQUIVO = path.join(RAIZ, 'site', 'dados', 'lihof.json');
const PASTA_IMG = path.join(RAIZ, 'site', 'assets', 'noticias');
const ESPERA = 25000;

const CSV = process.env.MURAL_CSV || '';
const CSV_LOCAL = process.argv.find((a) => a.endsWith('.csv'));

const COLUNAS = {
  titulo: 'Título',
  resumo: 'Resumo',
  data: 'Data',
  link: 'Link',
  imagem: 'Imagem',
  etiqueta: 'Etiqueta',
  publicar: 'Aparecer no site?',
};

function leCSV(texto) {
  const linhas = [];
  let campo = '';
  let linha = [];
  let aspas = false;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') aspas = false;
      else campo += c;
      continue;
    }
    if (c === '"') { aspas = true; continue; }
    if (c === ',') { linha.push(campo); campo = ''; continue; }
    if (c === '\r') continue;
    if (c === '\n') { linha.push(campo); linhas.push(linha); linha = []; campo = ''; continue; }
    campo += c;
  }
  if (campo !== '' || linha.length) { linha.push(campo); linhas.push(linha); }

  if (!linhas.length) return [];
  const cabecalho = linhas.shift().map((h) => h.trim());
  return linhas
    .filter((l) => l.some((c) => c.trim() !== ''))
    .map((l) => {
      const o = {};
      cabecalho.forEach((h, i) => { o[h] = (l[i] || '').trim(); });
      return o;
    });
}

function achaColuna(linha, desejada) {
  if (desejada in linha) return linha[desejada];
  const alvo = desejada.toLowerCase().replace(/[^a-z?]/g, '');
  for (const chave of Object.keys(linha)) {
    if (chave.toLowerCase().replace(/[^a-z?]/g, '') === alvo) return linha[chave];
  }
  return '';
}

function paraISO(bruta) {
  const s = String(bruta).trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return m[1] + '-' + m[2] + '-' + m[3];
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s);
  if (m) {
    const d = m[1].padStart(2, '0');
    const mes = m[2].padStart(2, '0');
    return m[3] + '-' + mes + '-' + d;
  }
  return '';
}

function idDoDrive(url) {
  const m = /[?&]id=([A-Za-z0-9_-]{10,})/.exec(url) || /\/d\/([A-Za-z0-9_-]{10,})/.exec(url);
  return m ? m[1] : null;
}

async function baixaImagem(url, rotulo) {
  if (!url) return null;
  const id = idDoDrive(url);
  if (!id) return null;

  const nomeBase = 'drive-' + id.slice(0, 24);
  const destino = path.join(PASTA_IMG, nomeBase + '.jpg');
  const relativo = 'assets/noticias/' + nomeBase + '.jpg';
  if (fs.existsSync(destino)) return relativo;

  try {
    const r = await fetch('https://drive.google.com/uc?export=download&id=' + id, {
      signal: AbortSignal.timeout ? AbortSignal.timeout(ESPERA) : undefined,
      redirect: 'follow',
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const tipo = r.headers.get('content-type') || '';
    if (!/^image\//.test(tipo)) {
      throw new Error('veio ' + (tipo || 'algo que não é imagem') +
                      '; a pasta do Drive precisa estar como "qualquer pessoa com o link"');
    }
    fs.mkdirSync(PASTA_IMG, { recursive: true });
    fs.writeFileSync(destino, Buffer.from(await r.arrayBuffer()));
    return relativo;
  } catch (e) {
    console.log('  imagem de "' + rotulo + '" não veio (' + e.message + '); o cartão usa a capa com a data.');
    return null;
  }
}

async function principal() {
  if (!fs.existsSync(ARQUIVO)) {
    console.error('Não achei site/dados/lihof.json.');
    process.exit(1);
  }
  if (!CSV && !CSV_LOCAL) {
    console.error('Falta o endereço da planilha publicada.');
    console.error('  set MURAL_CSV=https://docs.google.com/spreadsheets/d/e/.../pub?output=csv');
    console.error('  npm run mural');
    console.error('Para experimentar sem a planilha: node ferramentas/atualizar-mural.js arquivo.csv');
    process.exit(1);
  }

  let texto;
  if (CSV_LOCAL) {
    texto = fs.readFileSync(CSV_LOCAL, 'utf8');
    console.log('lendo do arquivo local: ' + CSV_LOCAL);
  } else {
    console.log('buscando as respostas…');
    const r = await fetch(CSV, { signal: AbortSignal.timeout ? AbortSignal.timeout(ESPERA) : undefined });
    if (!r.ok) {
      console.error('A planilha não respondeu (HTTP ' + r.status + ').');
      console.error('Confira se ela está publicada em Arquivo > Compartilhar > Publicar na web, como CSV.');
      process.exit(1);
    }
    texto = await r.text();
    if (/^\s*</.test(texto)) {
      console.error('A planilha devolveu HTML em vez de CSV. O endereço precisa terminar em ?output=csv');
      process.exit(1);
    }
  }

  const linhas = leCSV(texto);
  console.log(linhas.length + ' respostas na planilha.');

  const colunas = linhas.length ? Object.keys(linhas[0]) : [];
  const suspeitas = colunas.filter((c) => /mail|remetente|respondente/i.test(c));
  const temEndereco = linhas.some((l) => colunas.some((c) => /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(l[c] || '')));

  if (suspeitas.length || temEndereco) {
    console.log('');
    console.log('  ATENÇÃO: a planilha publicada contém endereços de e-mail.');
    if (suspeitas.length) console.log('  Coluna: ' + suspeitas.join(', '));
    console.log('  O site não publica esses dados, mas o CSV publicado fica legível');
    console.log('  para quem tiver o endereço dele. Publique uma aba só com as');
    console.log('  colunas do post, em vez da aba de respostas.');
    console.log('');
  }

  const atual = JSON.parse(fs.readFileSync(ARQUIVO, 'utf8'));
  const manuais = (atual.itens || []).filter((i) => i.manual === true);

  const doFormulario = [];
  let ocultos = 0;
  let semData = 0;

  for (const linha of linhas) {
    const publicar = achaColuna(linha, COLUNAS.publicar).toLowerCase();
    if (publicar.startsWith('n')) { ocultos++; continue; }

    const titulo = achaColuna(linha, COLUNAS.titulo);
    const data = paraISO(achaColuna(linha, COLUNAS.data));
    const link = achaColuna(linha, COLUNAS.link);
    if (!titulo || !link) continue;
    if (!data) { semData++; continue; }

    const etiqueta = achaColuna(linha, COLUNAS.etiqueta);
    const item = {
      titulo,
      data,
      link,
      imagem: await baixaImagem(achaColuna(linha, COLUNAS.imagem), titulo),
    };
    const resumo = achaColuna(linha, COLUNAS.resumo);
    if (resumo) item.resumo = resumo;
    if (etiqueta) item.tags = [etiqueta];
    if (!item.imagem) delete item.imagem;

    doFormulario.push(item);
  }

  const todos = manuais.concat(doFormulario)
    .sort((a, b) => String(b.data).localeCompare(String(a.data)));

  atual.itens = todos;
  fs.writeFileSync(ARQUIVO, JSON.stringify(atual, null, 2) + '\n', 'utf8');

  console.log('');
  console.log(todos.length + ' notícias gravadas em site/dados/lihof.json');
  console.log('  do formulário: ' + doFormulario.length +
              ' | à mão: ' + manuais.length +
              ' | com imagem: ' + todos.filter((i) => i.imagem).length);
  if (ocultos) console.log('  ' + ocultos + ' marcadas como "não aparecer" e por isso deixadas de fora.');
  if (semData) console.log('  ' + semData + ' sem data legível e por isso ignoradas.');
  if (todos.length) console.log('  mais recente: ' + todos[0].data + ', ' + todos[0].titulo);
}

principal().catch((e) => {
  console.error('Erro inesperado:', e);
  process.exit(1);
});
