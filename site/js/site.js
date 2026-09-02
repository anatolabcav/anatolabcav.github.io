
(function () {
  'use strict';

  var menosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');

  var $ = function (s, raiz) { return (raiz || document).querySelector(s); };
  var $$ = function (s, raiz) {
    return Array.prototype.slice.call((raiz || document).querySelectorAll(s));
  };

  var CHAVE = 'lihof-tema';

  function aplicaTema(tema) {
    if (tema === 'dia') {
      document.documentElement.setAttribute('data-tema', 'dia');
    } else {
      document.documentElement.removeAttribute('data-tema');
    }
    $$('.tema').forEach(function (b) {
      b.setAttribute('aria-pressed', tema === 'dia' ? 'true' : 'false');
      b.setAttribute('aria-label', tema === 'dia'
        ? 'Mudar para o tema escuro' : 'Mudar para o tema claro');
    });
  }

  function tema() {
    var atual = document.documentElement.getAttribute('data-tema') === 'dia' ? 'dia' : 'noite';
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
    var temHeroi = !!$(".abertura");

    var aoRolar = function () {
      var y = window.scrollY;
      topo.classList.toggle('desceu', y > 12);
      if (temHeroi) topo.classList.toggle('no-heroi', y <= 12);
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

  var FUSAO = 1.4;

  function lacoSuave() {
    var caixa = $('[data-laco]');
    if (!caixa) return;
    var vs = $$('video', caixa);
    if (vs.length < 2) return;

    vs.forEach(function (v) {
      v.muted = true;
      v.defaultMuted = true;
      v.playsInline = true;
      v.removeAttribute('loop');
      v.pause();
    });

    if (menosMovimento.matches) {
      vs[1].style.display = 'none';
      return;
    }

    var ativo = 0;
    var raf = 0;
    var naTela = false;

    function toca(v) {
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    }

    function quadro() {
      var v = vs[ativo];
      var o = vs[1 - ativo];
      var d = v.duration;

      if (isFinite(d) && d > FUSAO) {
        var restante = d - v.currentTime;

        if (restante <= FUSAO) {
          if (o.paused) { o.currentTime = 0; toca(o); }
          var k = Math.max(0, Math.min(1, restante / FUSAO));
          v.style.opacity = k;
          o.style.opacity = 1 - k;
        }

        if (restante <= 0.08) {
          v.pause();
          v.currentTime = 0;
          v.style.opacity = 0;
          o.style.opacity = 1;
          ativo = 1 - ativo;
        }
      }

      if (naTela) raf = requestAnimationFrame(quadro);
    }

    function liga() {
      if (naTela) return;
      naTela = true;
      if (vs[ativo].paused) toca(vs[ativo]);
      raf = requestAnimationFrame(quadro);
    }

    function desliga() {
      naTela = false;
      cancelAnimationFrame(raf);
      vs.forEach(function (v) { v.pause(); });
    }

    vs[0].style.opacity = 1;
    vs[1].style.opacity = 0;

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (itens) {
        if (itens[0].isIntersecting) liga(); else desliga();
      }, { threshold: 0 }).observe(caixa);
    } else {
      liga();
    }
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
    lacoSuave();
    ano();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicia);
  } else {
    inicia();
  }

  window.SiteLab = { entradas: entradas };
})();
