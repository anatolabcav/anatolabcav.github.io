
(function () {
  'use strict';

  var CHAVE = 'anatomia-tema';

  function aplica(tema) {
    if (tema === 'dia') {
      document.documentElement.setAttribute('data-tema', 'dia');
    } else {
      document.documentElement.removeAttribute('data-tema');
    }
    var botoes = document.querySelectorAll('.tema-jogo');
    for (var i = 0; i < botoes.length; i++) {
      botoes[i].setAttribute('aria-pressed', tema === 'dia' ? 'true' : 'false');
      botoes[i].setAttribute('aria-label', tema === 'dia'
        ? 'Mudar para o tema escuro' : 'Mudar para o tema claro');
    }
  }

  function inicia() {
    var atual = document.documentElement.getAttribute('data-tema') === 'dia' ? 'dia' : 'noite';
    aplica(atual);

    var botoes = document.querySelectorAll('.tema-jogo');
    for (var i = 0; i < botoes.length; i++) {
      botoes[i].addEventListener('click', function () {
        atual = atual === 'dia' ? 'noite' : 'dia';
        aplica(atual);
        try { localStorage.setItem(CHAVE, atual); } catch (e) {}
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicia);
  } else {
    inicia();
  }
})();
