
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) {
    return Array.prototype.slice.call((r || document).querySelectorAll(s));
  };

  var MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun',
               'jul', 'ago', 'set', 'out', 'nov', 'dez'];

  function dataCurta(iso) {
    if (!iso) return '';
    var p = String(iso).slice(0, 10).split('-');
    if (p.length !== 3) return '';
    return Number(p[2]) + ' ' + MESES[Number(p[1]) - 1] + ' ' + p[0];
  }

  function seguro(t) {
    return String(t == null ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  var externo = function (url) { return /^https?:\/\//i.test(String(url || '')); };

  function endereco(url, raiz) {
    var u = String(url || '');
    if (externo(u)) return u;
    if (/^[a-z][a-z0-9+.-]*:/i.test(u) || u.indexOf('//') === 0) return '#';
    return raiz + u.replace(/^\.?\//, '');
  }

  function capaData(iso) {
    var p = String(iso || '').slice(0, 10).split('-');
    if (p.length !== 3) return '<span class="capa-dia">·</span>';
    return '<span class="capa-dia">' + Number(p[2]) + '</span>' +
           '<span class="capa-mes">' + MESES[Number(p[1]) - 1] + ' ' + p[0] + '</span>';
  }

  function cartao(n, raiz) {
    var capa = n.imagem
      ? '<div class="noticia-capa"><img src="' +
        seguro(externo(n.imagem) ? n.imagem : raiz + n.imagem) +
        '" alt="" loading="lazy" decoding="async" data-data="' + seguro(n.data) + '"></div>'
      : '<div class="noticia-capa noticia-capa--vazia" aria-hidden="true">' +
        capaData(n.data) + '</div>';

    var etiqueta = (n.tags && n.tags.length) ? ' · ' + seguro(n.tags[0]) : '';
    var fora = externo(n.link) ? ' target="_blank" rel="noopener noreferrer"' : '';

    if (!n.link) {
      return '<article class="noticia noticia--sem-link entra">' +
               capa +
               '<div class="noticia-corpo">' +
                 '<div class="noticia-meta"><span>' + seguro(n.fonte || '') + '</span>' +
                   '<span>' + dataCurta(n.data) + etiqueta + '</span></div>' +
                 '<h3>' + seguro(n.titulo) + '</h3>' +
                 (n.resumo ? '<p>' + seguro(n.resumo) + '</p>' : '') +
               '</div>' +
             '</article>';
    }

    return '<a class="noticia entra" href="' + seguro(endereco(n.link, raiz)) + '"' + fora + '>' +
             capa +
             '<div class="noticia-corpo">' +
               '<div class="noticia-meta"><span>' + seguro(n.fonte || '') + '</span>' +
                 '<span>' + dataCurta(n.data) + etiqueta + '</span></div>' +
               '<h3>' + seguro(n.titulo) + '</h3>' +
               (n.resumo ? '<p>' + seguro(n.resumo) + '</p>' : '') +
               '<span class="noticia-ler">Ler <span class="seta" aria-hidden="true">&rarr;</span></span>' +
             '</div>' +
           '</a>';
  }

  var MURAL = 'https://docs.google.com/spreadsheets/d/'
            + '1K6v7waYlY6CObD6B8fr_HyXkOrn5f85UzD61Yxf6t_c'
            + '/export?format=csv&gid=775082452';

  function leCSV(texto) {
    var linhas = [], campo = '', linha = [], aspas = false, i;
    for (i = 0; i < texto.length; i++) {
      var c = texto[i];
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
    var cab = linhas.shift().map(function (h) { return h.trim(); });
    return linhas.filter(function (l) {
      return l.some(function (c) { return c.trim() !== ''; });
    }).map(function (l) {
      var o = {};
      cab.forEach(function (h, k) { o[h] = (l[k] || '').trim(); });
      return o;
    });
  }

  function coluna(linha, nome) {
    if (nome in linha) return linha[nome];
    var alvo = nome.toLowerCase().replace(/[^a-z?]/g, '');
    for (var k in linha) {
      if (k.toLowerCase().replace(/[^a-z?]/g, '') === alvo) return linha[k];
    }
    return '';
  }

  function paraISO(bruta) {
    var s = String(bruta || '').trim();
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
    if (m) return m[1] + '-' + m[2] + '-' + m[3];
    m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s);
    if (m) {
      return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
    }
    return '';
  }

  function idDrive(url) {
    var m = /[?&]id=([A-Za-z0-9_-]{10,})/.exec(url || '') ||
            /\/d\/([A-Za-z0-9_-]{10,})/.exec(url || '');
    return m ? m[1] : null;
  }

  function idYoutube(url) {
    var m = /(?:youtu\.be\/|v=|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})/.exec(url || '');
    return m ? m[1] : null;
  }

  var muralPromessa = null;

  function doMural() {
    if (muralPromessa) return muralPromessa;
    muralPromessa = fetch(MURAL, { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.text() : null; })
      .then(function (texto) {
        if (!texto || /^\s*</.test(texto)) return [];
        return leCSV(texto).map(function (l) {
          if (coluna(l, 'Aparecer no site?').toLowerCase().indexOf('n') === 0) return null;
          var titulo = coluna(l, 'Título');
          if (!titulo) return null;
          var link = coluna(l, 'Link');
          var arquivo = coluna(l, 'Arquivo') || coluna(l, 'Imagem');
          var etiqueta = coluna(l, 'Etiqueta');
          var descricao = coluna(l, 'Descrição') || coluna(l, 'Resumo');
          var n = {
            tipo: (coluna(l, 'Tipo') || 'Notícia').trim(),
            titulo: titulo,
            data: paraISO(coluna(l, 'Data')),
            fonte: 'Laboratório',
            arquivoId: idDrive(arquivo),
            videoId: idYoutube(link)
          };
          if (descricao) n.resumo = descricao;
          if (/^https?:\/\//i.test(link) || /\.html?($|[?#])/i.test(link)) n.link = link;
          if (etiqueta) n.tags = [etiqueta];
          return n;
        }).filter(Boolean);
      })
      .catch(function () { return []; });
    return muralPromessa;
  }

  function ehTipo(n, alvo) {
    return String(n.tipo || '').toLowerCase().indexOf(alvo) === 0;
  }

  function carrega(caminho) {
    return fetch(caminho, { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  function noticias() {
    var lugares = $$('[data-noticias]');
    if (!lugares.length) return;

    var raiz = document.body.getAttribute('data-raiz') || '';

    Promise.all([
      carrega(raiz + 'dados/lihof.json'),
      carrega(raiz + 'dados/ufpe.json'),
      doMural()
    ]).then(function (res) {
      var mural = (res[2] || []).filter(function (n) {
        return n.data && (ehTipo(n, 'not') || !n.tipo);
      });
      var guardadas = (res[0] && res[0].itens) || [];
      var manuais = guardadas.filter(function (n) { return n.manual === true; });
      var lihof = mural.length ? manuais.concat(mural) : guardadas;
      var ufpe = (res[1] && res[1].itens) || [];

      lihof.forEach(function (n) { n.fonte = n.fonte || 'Laboratório'; });
      ufpe.forEach(function (n) { n.fonte = n.fonte || 'UFPE'; });

      var tudo = lihof.concat(ufpe).sort(function (a, b) {
        return String(b.data || '').localeCompare(String(a.data || ''));
      });

      lugares.forEach(function (lugar) { monta(lugar, tudo, lihof, ufpe, res, raiz); });
    });
  }

  function monta(lugar, tudo, lihof, ufpe, brutos, raiz) {
    var limite = parseInt(lugar.getAttribute('data-limite'), 10) || 0;
    var painel = lugar.getAttribute('data-filtros')
      ? $(lugar.getAttribute('data-filtros'))
      : null;
    var campo = lugar.getAttribute('data-busca') ? $(lugar.getAttribute('data-busca')) : null;

    var fonteAtual = 'todas';
    var termo = '';

    var casaPrimeiro = lugar.hasAttribute('data-destaque');

    function lista() {
      var base = fonteAtual === 'lihof' ? lihof
               : fonteAtual === 'ufpe' ? ufpe
               : casaPrimeiro ? lihof.concat(ufpe)
               : tudo;
      if (termo) {
        var t = termo.toLowerCase();
        base = base.filter(function (n) {
          return ((n.titulo || '') + ' ' + (n.resumo || '') + ' ' +
                  (n.tags || []).join(' ')).toLowerCase().indexOf(t) > -1;
        });
      }
      return limite ? base.slice(0, limite) : base;
    }

    function desenha() {
      var itens = lista();

      if (!itens.length) {
        var nadaCarregou = !brutos[0] && !brutos[1];
        lugar.innerHTML = '<div class="vazio">' + (nadaCarregou
          ? '<p><strong>Não foi possível carregar as notícias.</strong></p>' +
            '<p style="margin-top:8px;font-size:13px">Se você abriu o arquivo com dois cliques, ' +
            'o navegador bloqueia a leitura dos dados. Sirva a pasta <code>site/</code> ' +
            'por um servidor (por exemplo <code>npx serve site</code>) ou publique-a.</p>'
          : '<p>Nenhuma notícia encontrada para esta busca.</p>') + '</div>';
        return;
      }

      lugar.innerHTML = itens.map(function (n) { return cartao(n, raiz); }).join('');

      $$('.noticia-capa img', lugar).forEach(function (img) {
        img.addEventListener('error', function () {
          var capa = img.parentElement;
          if (!capa) return;
          capa.className = 'noticia-capa noticia-capa--vazia';
          capa.setAttribute('aria-hidden', 'true');
          capa.innerHTML = capaData(img.getAttribute('data-data'));
        });
      });

      if (window.SiteLab) window.SiteLab.entradas();
    }

    if (painel) {
      $$('.filtro', painel).forEach(function (b) {
        b.addEventListener('click', function () {
          $$('.filtro', painel).forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
          b.setAttribute('aria-pressed', 'true');
          fonteAtual = b.getAttribute('data-fonte') || 'todas';
          desenha();
        });
      });
    }

    if (campo) {
      var esperando;
      campo.addEventListener('input', function () {
        clearTimeout(esperando);
        esperando = setTimeout(function () {
          termo = campo.value.trim();
          desenha();
        }, 160);
      });
    }

    desenha();
  }

  function postCartao(p, perfis, raiz) {
    var perfil = perfis[p.perfil] || {};
    var usuario = perfil.usuario ? '@' + perfil.usuario : (p.perfil || '');

    var capa = p.imagem
      ? '<div class="post-capa"><img src="' +
        seguro(externo(p.imagem) ? p.imagem : raiz + p.imagem) +
        '" alt="" loading="lazy" decoding="async" data-data="' + seguro(p.data) + '"></div>'
      : '<div class="post-capa post-capa--vazia" aria-hidden="true">' + capaData(p.data) + '</div>';

    return '<a class="post entra" href="' + seguro(p.link) + '" ' +
             'target="_blank" rel="noopener noreferrer">' +
             capa +
             '<div class="post-corpo">' +
               '<div class="post-meta"><span>' + seguro(usuario) + '</span>' +
                 '<span>' + dataCurta(p.data) + '</span></div>' +
               (p.legenda ? '<p>' + seguro(p.legenda) + '</p>' : '') +
             '</div>' +
           '</a>';
  }

  function instagram() {
    var lugar = $('[data-posts]');
    if (!lugar) return;

    var secao = lugar.closest('[data-instagram]');
    var raiz = document.body.getAttribute('data-raiz') || '';

    carrega(raiz + 'dados/instagram.json').then(function (d) {
      var itens = (d && d.itens) || [];
      var perfis = (d && d.perfis) || {};

      if (!itens.length) return;

      lugar.innerHTML = itens.map(function (p) {
        return postCartao(p, perfis, raiz);
      }).join('');

      var elos = $('[data-perfis]');
      if (elos) {
        elos.innerHTML = Object.keys(perfis).map(function (k) {
          return '<a class="perfil-elo" href="' + seguro(perfis[k].url) + '" ' +
                 'target="_blank" rel="noopener noreferrer">@' +
                 seguro(perfis[k].usuario) + '</a>';
        }).join('');
      }

      $$('.post-capa img', lugar).forEach(function (img) {
        img.addEventListener('error', function () {
          var capa = img.parentElement;
          if (!capa) return;
          capa.className = 'post-capa post-capa--vazia';
          capa.setAttribute('aria-hidden', 'true');
          capa.innerHTML = capaData(img.getAttribute('data-data'));
        });
      });

      if (secao) secao.removeAttribute('hidden');
      if (window.SiteLab) window.SiteLab.entradas();
    });
  }

  function cartaoGaleria(n) {
    var capa;
    if (n.videoId) {
      capa = '<div class="galeria-capa galeria-capa--video"><img src="https://img.youtube.com/vi/' +
             seguro(n.videoId) + '/hqdefault.jpg" alt="" loading="lazy" decoding="async"></div>';
    } else if (n.arquivoId) {
      capa = '<div class="galeria-capa"><img src="https://drive.google.com/thumbnail?id=' +
             seguro(n.arquivoId) + '&sz=w1200" alt="" loading="lazy" decoding="async"></div>';
    } else {
      capa = '<div class="galeria-capa galeria-capa--vazia" aria-hidden="true">' +
             capaData(n.data) + '</div>';
    }

    var destino = n.videoId ? 'https://www.youtube.com/watch?v=' + n.videoId
                : (n.link || (n.arquivoId ? 'https://drive.google.com/file/d/' + n.arquivoId + '/view' : ''));

    var corpo = '<div class="galeria-corpo">' +
                  (n.data ? '<div class="galeria-meta">' + dataCurta(n.data) +
                    ((n.tags && n.tags.length) ? ' · ' + seguro(n.tags[0]) : '') + '</div>' : '') +
                  '<h3>' + seguro(n.titulo) + '</h3>' +
                  (n.resumo ? '<p>' + seguro(n.resumo) + '</p>' : '') +
                '</div>';

    if (!destino) return '<article class="galeria-item entra">' + capa + corpo + '</article>';
    return '<a class="galeria-item entra" href="' + seguro(destino) +
           '" target="_blank" rel="noopener noreferrer">' + capa + corpo + '</a>';
  }

  function cartaoMaterial(n) {
    var destino = n.arquivoId ? 'https://drive.google.com/file/d/' + n.arquivoId + '/view' : n.link;
    var etiqueta = (n.tags && n.tags.length) ? '<span class="material-etiqueta">' +
                   seguro(n.tags[0]) + '</span>' : '';
    var miolo = '<div class="material-corpo">' + etiqueta +
                  '<h3>' + seguro(n.titulo) + '</h3>' +
                  (n.resumo ? '<p>' + seguro(n.resumo) + '</p>' : '') +
                '</div>';
    if (!destino) return '<article class="material">' + miolo + '</article>';
    return '<a class="material entra" href="' + seguro(destino) +
           '" target="_blank" rel="noopener noreferrer">' + miolo +
           '<span class="material-abrir">Abrir <span class="seta" aria-hidden="true">&rarr;</span></span></a>';
  }

  function porData(a, b) {
    return String(b.data || '').localeCompare(String(a.data || ''));
  }

  function preenche(seletor, itens, monta) {
    var lugar = $(seletor);
    if (!lugar || !itens.length) return false;
    lugar.innerHTML = itens.map(monta).join('');
    var secao = lugar.closest('section');
    if (secao) secao.removeAttribute('hidden');
    return true;
  }

  function galeria() {
    if (!$('[data-galeria-itens]') && !$('[data-materiais-itens]')) return;

    doMural().then(function (tudo) {
      var projetos = tudo.filter(function (n) { return ehTipo(n, 'proj'); }).sort(porData);
      var videos = tudo.filter(function (n) { return ehTipo(n, 'víd') || ehTipo(n, 'vid'); }).sort(porData);
      var materiais = tudo.filter(function (n) { return ehTipo(n, 'mat'); }).sort(porData);

      var houve = false;
      if (preenche('[data-galeria-itens]', projetos, cartaoGaleria)) houve = true;
      if (preenche('[data-videos-itens]', videos, cartaoGaleria)) houve = true;
      if (preenche('[data-materiais-itens]', materiais, cartaoMaterial)) houve = true;

      var vazio = $('[data-galeria-vazia]');
      if (vazio && houve) vazio.setAttribute('hidden', '');

      if (window.SiteLab) window.SiteLab.entradas();
    });
  }

  function inicia() {
    noticias();
    instagram();
    galeria();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicia);
  } else {
    inicia();
  }
})();
