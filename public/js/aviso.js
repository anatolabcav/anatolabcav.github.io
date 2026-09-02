
window.TRATO = window.TRATO || {};

TRATO.Aviso = (() => {
  let caixa = null;
  let resolver = null;

  function fechar(resposta) {
    if (!caixa || !caixa.open) return;
    caixa.close();
    const f = resolver;
    resolver = null;
    if (f) f(resposta);
  }

  function montar() {
    if (caixa) return caixa;

    caixa = document.createElement('dialog');
    caixa.className = 'dialogo aviso';
    caixa.innerHTML = `
      <div class="aviso-tarja"></div>
      <div class="aviso-corpo">
        <h3 class="aviso-titulo"></h3>
        <p class="aviso-texto"></p>
        <ul class="aviso-lista"></ul>
      </div>
      <div class="aviso-botoes">
        <button type="button" class="btn btn-fantasma aviso-nao"></button>
        <button type="button" class="btn aviso-sim"></button>
      </div>`;
    document.body.appendChild(caixa);

    caixa.querySelector('.aviso-sim').addEventListener('click', () => fechar(true));
    caixa.querySelector('.aviso-nao').addEventListener('click', () => fechar(false));
    caixa.addEventListener('click', (ev) => { if (ev.target === caixa) fechar(false); });
    caixa.addEventListener('cancel', (ev) => { ev.preventDefault(); fechar(false); });

    return caixa;
  }

  /**
   * @param {object} o
   * @param {string} o.titulo
   * @param {string} [o.texto]
   * @param {string[]} [o.linhas]  lista em monoespaçada (caminhos, códigos)
   * @param {string} [o.sim]       rótulo do botão de confirmar
   * @param {string|null} [o.nao]  rótulo do botão de desistir; null esconde
   * @param {string} [o.tom]       'neutro' | 'erro' | 'atencao'
   */
  function abrir({ titulo, texto = '', linhas = null, sim = 'Entendi',
                   nao = null, tom = 'neutro' }) {
    const el = montar();
    el.dataset.tom = tom;

    el.querySelector('.aviso-titulo').textContent = titulo;

    const pTexto = el.querySelector('.aviso-texto');
    pTexto.textContent = texto;
    pTexto.hidden = !texto;

    const lista = el.querySelector('.aviso-lista');
    lista.replaceChildren(...(linhas || []).map((linha) => {
      const li = document.createElement('li');
      li.textContent = linha;
      return li;
    }));
    lista.hidden = !(linhas && linhas.length);

    const botaoSim = el.querySelector('.aviso-sim');
    const botaoNao = el.querySelector('.aviso-nao');
    botaoSim.textContent = sim;
    botaoNao.textContent = nao || '';
    botaoNao.hidden = !nao;

    return new Promise((f) => {
      resolver = f;
      el.showModal();
      (nao ? botaoNao : botaoSim).focus();
    });
  }

  return {
    /** Uma caixa com um botão só. Resolve quando a pessoa fecha. */
    avisar: (o) => abrir({ sim: 'Entendi', ...o, nao: null }),
    /** Duas escolhas. Resolve true só no botão de confirmar. */
    perguntar: (o) => abrir({ sim: 'Sim', nao: 'Cancelar', ...o }),
  };
})();
