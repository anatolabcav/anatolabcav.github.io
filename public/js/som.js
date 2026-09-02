
window.TRATO = window.TRATO || {};

TRATO.Som = (() => {
  const $ = (id) => document.getElementById(id);

  let som = true;
  let musica = true;
  let emPartida = false;

  const BOTOES = {
    som: [
      { botao: 'botaoSom',     rotulo: 'somRotulo',     ligado: 'Som ligado',     desligado: 'Som desligado' },
      { botao: 'botaoSom2',    rotulo: 'somRotulo2',    ligado: 'Som',            desligado: 'Som' },
    ],
    musica: [
      { botao: 'botaoMusica',  rotulo: 'musicaRotulo',  ligado: 'Música ligada',  desligado: 'Música desligada' },
      { botao: 'botaoMusica2', rotulo: 'musicaRotulo2', ligado: 'Música',         desligado: 'Música' },
    ],
  };

  function desenhar() {
    for (const [chave, lista] of Object.entries(BOTOES)) {
      const ligada = chave === 'som' ? som : musica;
      for (const b of lista) {
        const el = $(b.botao);
        if (!el) continue;
        el.setAttribute('aria-pressed', String(ligada));
        const rot = $(b.rotulo);
        if (rot) rot.textContent = ligada ? b.ligado : b.desligado;
      }
    }
  }

  function aplicar() {
    GameSound.enabled = som;
    if (som) GameSound.resume();
    GameSound.music(som && musica && emPartida);
    desenhar();
  }

  function ligarBotoes() {
    for (const b of BOTOES.som) {
      const el = $(b.botao);
      if (el) el.addEventListener('click', () => { som = !som; aplicar(); });
    }
    for (const b of BOTOES.musica) {
      const el = $(b.botao);
      if (el) el.addEventListener('click', () => { musica = !musica; aplicar(); });
    }
    desenhar();
  }

  return {
    ligarBotoes,
    get somLigado() { return som; },
    get musicaLigada() { return musica; },
    /** Chamado quando a partida começa: é aqui que a trilha entra. */
    comecarPartida() { emPartida = true; aplicar(); },
    /** Fim de jogo ou volta para a configuração: a trilha sai. */
    encerrarPartida() { emPartida = false; GameSound.music(false); },
  };
})();
