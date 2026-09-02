
'use strict';

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const ARQUIVO = path.join(RAIZ, 'site', 'dados', 'instagram.json');
const PASTA_IMG = path.join(RAIZ, 'site', 'assets', 'instagram');

const POR_PERFIL = 6;
const LIMITE = 12;
const ESPERA = 25000;
const RENOVAR_COM = 15;

const TOKENS = {
  lihof: process.env.IG_TOKEN_LIHOF,
  laecav: process.env.IG_TOKEN_LAECAV
};

async function pega(url, comoTexto) {
  const corta = AbortSignal.timeout ? AbortSignal.timeout(ESPERA) : undefined;
  const r = await fetch(url, { signal: corta });
  if (!r.ok) {
    let detalhe = '';
    try {
      const corpo = await r.json();
      detalhe = corpo && corpo.error ? ' — ' + corpo.error.message : '';
    } catch (e) {  }
    throw new Error('HTTP ' + r.status + detalhe);
  }
  return comoTexto ? r.text() : r.json();
}

async function renova(perfil, token) {
  try {
    const r = await pega('https://graph.instagram.com/refresh_access_token' +
                         '?grant_type=ig_refresh_token&access_token=' + encodeURIComponent(token));
    const dias = Math.round((r.expires_in || 0) / 86400);
    if (dias && dias > RENOVAR_COM) {
      console.log('  token de ' + perfil + ' renovado, vale mais ' + dias + ' dias.');
      console.log('  ATUALIZE a variável de ambiente para: ' + r.access_token);
      return r.access_token;
    }
  } catch (e) {
    console.log('  não foi possível renovar o token de ' + perfil + ' (' + e.message + ').');
  }
  return token;
}

async function baixaImagem(url, id) {
  if (!url) return null;
  const destino = path.join(PASTA_IMG, id + '.jpg');
  const relativo = 'assets/instagram/' + id + '.jpg';
  if (fs.existsSync(destino)) return relativo;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout ? AbortSignal.timeout(ESPERA) : undefined });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    fs.mkdirSync(PASTA_IMG, { recursive: true });
    fs.writeFileSync(destino, Buffer.from(await r.arrayBuffer()));
    return relativo;
  } catch (e) {
    console.log('  imagem de ' + id + ' não baixou (' + e.message + '), o cartão usa a capa com a data.');
    return null;
  }
}

function legenda(texto) {
  if (!texto) return '';
  const primeira = String(texto).split('\n').find(l => l.trim()) || '';
  const limpa = primeira.replace(/#\S+/g, '').replace(/\s+/g, ' ').trim();
  return limpa.length > 140 ? limpa.slice(0, 139).trimEnd() + '…' : limpa;
}

async function doPerfil(perfil, token) {
  const campos = 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp';
  const url = 'https://graph.instagram.com/me/media?fields=' + campos +
              '&limit=' + POR_PERFIL + '&access_token=' + encodeURIComponent(token);

  const r = await pega(url);
  const midias = (r && r.data) || [];
  const itens = [];

  for (const m of midias) {
    const fonteImg = m.media_type === 'VIDEO' ? (m.thumbnail_url || null) : (m.media_url || null);
    itens.push({
      perfil: perfil,
      legenda: legenda(m.caption),
      data: String(m.timestamp || '').slice(0, 10),
      link: m.permalink,
      imagem: await baixaImagem(fonteImg, perfil + '-' + m.id),
      tipo: m.media_type === 'VIDEO' ? 'video' : 'foto'
    });
  }
  return itens;
}

async function principal() {
  if (!fs.existsSync(ARQUIVO)) {
    console.error('Não achei site/dados/instagram.json. Ele precisa existir antes.');
    process.exit(1);
  }
  const atual = JSON.parse(fs.readFileSync(ARQUIVO, 'utf8'));

  const manuais = (atual.itens || []).filter(i => i.manual === true);
  const automaticos = [];
  let houveFalha = false;

  for (const perfil of Object.keys(atual.perfis || {})) {
    let token = TOKENS[perfil];
    if (!token) {
      console.log(perfil + ': sem token, pulando. Os posts dele continuam entrando à mão.');
      continue;
    }
    console.log(perfil + ': buscando…');
    try {
      token = await renova(perfil, token);
      const itens = await doPerfil(perfil, token);
      console.log('  ' + itens.length + ' posts.');
      automaticos.push(...itens);
    } catch (e) {
      console.log('  falhou (' + e.message + ').');
      houveFalha = true;
    }
  }

  if (!automaticos.length && houveFalha) {
    console.log('\nNenhum perfil respondeu. O arquivo antigo fica como está.');
    return;
  }

  const todos = manuais.concat(automaticos)
    .filter(i => i.link && i.data)
    .sort((a, b) => String(b.data).localeCompare(String(a.data)))
    .slice(0, LIMITE);

  atual.atualizado = new Date().toISOString();
  atual.itens = todos;

  fs.writeFileSync(ARQUIVO, JSON.stringify(atual, null, 2) + '\n', 'utf8');

  console.log('\n' + todos.length + ' posts gravados em site/dados/instagram.json');
  console.log('À mão: ' + manuais.length + ' | da API: ' + automaticos.length +
              ' | com imagem: ' + todos.filter(i => i.imagem).length);
  if (todos.length) console.log('Mais recente: ' + todos[0].data + ' (@' +
    ((atual.perfis[todos[0].perfil] || {}).usuario || todos[0].perfil) + ')');
}

principal().catch(e => {
  console.error('Erro inesperado:', e);
  process.exit(1);
});
