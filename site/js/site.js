
(function () {
  'use strict';

  var menosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');

  var $ = function (s, raiz) { return (raiz || document).querySelector(s); };
  var $$ = function (s, raiz) {
    return Array.prototype.slice.call((raiz || document).querySelectorAll(s));
  };

  var CHAVE = 'lihof-tema';

  function aplicaTema(tema) {
    if (tema === 'noite') {
      document.documentElement.setAttribute('data-tema', 'noite');
    } else {
      document.documentElement.removeAttribute('data-tema');
    }
    $$('.tema').forEach(function (b) {
      b.setAttribute('aria-pressed', tema === 'noite' ? 'true' : 'false');
      b.setAttribute('aria-label', tema === 'noite'
        ? 'Mudar para o tema claro' : 'Mudar para o tema escuro');
    });
  }

  function tema() {
    var atual = document.documentElement.getAttribute('data-tema') === 'noite' ? 'noite' : 'dia';
    aplicaTema(atual);

    $$('.tema').forEach(function (botao) {
      botao.addEventListener('click', function () {
        atual = atual === 'dia' ? 'noite' : 'dia';
        aplicaTema(atual);
        try { localStorage.setItem(CHAVE, atual); } catch (e) {}
      });
    });
  }

  function cabecalho() {
    var topo = $('.topo');
    if (!topo) return;

    var ultimo = window.scrollY;
    var travado = false;

    var aoRolar = function () {
      var y = window.scrollY;
      topo.classList.toggle('desceu', y > 12);
      if (!travado) {
        var desceu = y > ultimo + 6;
        var subiu = y < ultimo - 6;
        if (desceu && y > 220) topo.classList.add('oculto');
        else if (subiu) topo.classList.remove('oculto');
      }
      ultimo = y;
    };
    aoRolar();
    window.addEventListener('scroll', aoRolar, { passive: true });

    var botao = $('.menu-botao');
    var gaveta = $('.gaveta');
    if (!botao || !gaveta) return;

    var fecha = function () {
      botao.setAttribute('aria-expanded', 'false');
      gaveta.classList.remove('aberta');
      document.body.style.overflow = '';
      travado = false;
    };

    botao.addEventListener('click', function () {
      if (botao.getAttribute('aria-expanded') === 'true') { fecha(); return; }
      botao.setAttribute('aria-expanded', 'true');
      gaveta.classList.add('aberta');
      topo.classList.remove('oculto');
      travado = true;
      document.body.style.overflow = 'hidden';
    });

    $$('a', gaveta).forEach(function (a) { a.addEventListener('click', fecha); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') fecha();
    });
  }

  function entradas() {
    var alvos = $$('.entra:not(.dentro)');

    var pais = [];
    $$('.revela').forEach(function (el) {
      var pai = el.parentElement;
      if (pai && !pai.classList.contains('dentro') && pais.indexOf(pai) < 0) {
        pais.push(pai);
      }
    });
    alvos = alvos.concat(pais);

    if (!alvos.length) return;

    if (menosMovimento.matches || !('IntersectionObserver' in window)) {
      alvos.forEach(function (el) { el.classList.add('dentro'); });
      return;
    }

    var obs = new IntersectionObserver(function (itens) {
      itens.forEach(function (item) {
        if (!item.isIntersecting) return;
        item.target.classList.add('dentro');
        obs.unobserve(item.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });

    alvos.forEach(function (el) { obs.observe(el); });
  }

  function contadores() {
    var alvos = $$('[data-conta]');
    if (!alvos.length) return;

    var anima = function (el) {
      var fim = parseFloat(el.getAttribute('data-conta'));
      var sufixo = el.getAttribute('data-sufixo') || '';
      if (menosMovimento.matches || isNaN(fim)) {
        el.textContent = fim + sufixo;
        return;
      }
      var dur = 1300;
      var t0 = performance.now();
      var passo = function (t) {
        var p = Math.min((t - t0) / dur, 1);
        var e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(fim * e) + sufixo;
        if (p < 1) requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    };

    if (!('IntersectionObserver' in window)) { alvos.forEach(anima); return; }

    var obs = new IntersectionObserver(function (itens) {
      itens.forEach(function (item) {
        if (!item.isIntersecting) return;
        anima(item.target);
        obs.unobserve(item.target);
      });
    }, { threshold: 0.5 });
    alvos.forEach(function (el) { obs.observe(el); });
  }

  function videos() {
    var caixas = $$('[data-video]');
    if (!caixas.length) return;

    caixas.forEach(function (caixa) {
      var v = caixa.matches('video') ? caixa : $('video', caixa);
      if (!v) return;

      v.muted = true;
      v.defaultMuted = true;
      v.playsInline = true;
      v.loop = true;

      if (menosMovimento.matches) { v.pause(); return; }

      var naTela = false;

      var ajusta = function () {
        if (!naTela) {
          v.pause();
        } else {
          var p = v.play();
          if (p && p.catch) p.catch(function () {});
        }
      };

      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (itens) {
          naTela = itens[0].isIntersecting;
          ajusta();
        }, { threshold: 0.1 }).observe(caixa);
      } else {
        naTela = true;
        ajusta();
      }
    });
  }

  function ano() {
    $$('[data-ano]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  function paginaAtual() {
    var arquivo = location.pathname.split('/').pop() || 'index.html';
    $$('.nav a, .gaveta a').forEach(function (a) {
      var alvo = a.getAttribute('href') || '';
      if (alvo.indexOf('#') === 0 || alvo.indexOf('http') === 0) return;
      var dele = alvo.split('/').pop() || 'index.html';
      if (dele === arquivo) a.setAttribute('aria-current', 'page');
    });
  }

  function inicia() {
    tema();
    cabecalho();
    paginaAtual();
    entradas();
    contadores();
    videos();
    ano();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicia);
  } else {
    inicia();
  }

  function tituloPronto() {
    var titulo = $('.abertura h1');
    if (titulo) titulo.classList.add('dentro');
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(tituloPronto);
  } else {
    window.addEventListener('load', tituloPronto);
  }

  window.SiteLab = { entradas: entradas };
})();
