
const path = require('path');
const XLSX = require('xlsx');
const { lerPerguntas } = require('../src/planilha');

const CABECALHO = ['Pergunta', 'Tipo', 'A', 'B', 'C', 'D', 'Correta', 'Categoria', 'Dificuldade'];
const ROTULO = { multipla: 'Múltipla', vf: 'V/F', aberta: 'Aberta' };

const EXEMPLOS_VF = [
  ['A digestão química do amido começa na boca, pela amilase salivar.', 'V/F', '', '', '', '', 'V', 'Boca', 'Fácil'],
  ['O esôfago produz enzimas digestivas.', 'V/F', '', '', '', '', 'F', 'Esôfago', 'Fácil'],
  ['O estômago absorve a maior parte dos nutrientes da dieta.', 'V/F', '', '', '', '', 'F', 'Estômago', 'Média'],
  ['O fígado produz a bile, mas quem a armazena é a vesícula biliar.', 'V/F', '', '', '', '', 'V', 'Fígado e vias biliares', 'Fácil'],
  ['O pâncreas lança o suco pancreático diretamente na corrente sanguínea.', 'V/F', '', '', '', '', 'F', 'Pâncreas', 'Média'],
  ['As vilosidades intestinais aumentam a superfície de absorção do delgado.', 'V/F', '', '', '', '', 'V', 'Intestino delgado', 'Fácil'],
  ['O apêndice vermiforme se prende ao cólon sigmoide.', 'V/F', '', '', '', '', 'F', 'Intestino grosso', 'Média'],
  ['O esfíncter anal externo está sob controle voluntário.', 'V/F', '', '', '', '', 'V', 'Intestino grosso', 'Média'],
];

const EXEMPLOS_ABERTAS = [
  ['Cite as três porções do intestino delgado, na ordem.', 'Aberta', '', '', '', '', '', 'Intestino delgado', 'Fácil'],
  ['Descreva o trajeto do bolo alimentar da boca até o estômago.', 'Aberta', '', '', '', '', '', 'Geral', 'Média'],
  ['Explique por que o estômago não se digere.', 'Aberta', '', '', '', '', '', 'Estômago', 'Média'],
  ['Quais são as quatro túnicas da parede do tubo digestório?', 'Aberta', '', '', '', '', '', 'Geral', 'Média'],
  ['Diga duas funções do fígado no processo digestivo.', 'Aberta', '', '', '', '', '', 'Fígado e vias biliares', 'Média'],
  ['O que acontece com a gordura da dieta depois de emulsificada pela bile?', 'Aberta', '', '', '', '', '', 'Intestino delgado', 'Difícil'],
];

function principal() {
  const alvo = path.resolve(process.argv[2] || 'Perguntas.xlsx');

  const r = lerPerguntas(alvo);
  if (!r.ok) { console.error('Não consegui ler a planilha: ' + r.erro); process.exit(1); }

  const linhas = r.perguntas.map((p) => {
    const alt = { A: '', B: '', C: '', D: '' };
    for (const o of p.opcoes) if (alt[o.letra] !== undefined) alt[o.letra] = o.texto;
    return [p.texto, ROTULO[p.tipo], alt.A, alt.B, alt.C, alt.D, p.correta, p.categoria, p.dificuldade];
  });

  const jaTem = (tipo) => r.perguntas.some((p) => p.tipo === tipo);
  if (!jaTem('vf')) linhas.push(...EXEMPLOS_VF);
  if (!jaTem('aberta')) linhas.push(...EXEMPLOS_ABERTAS);

  const aba = XLSX.utils.aoa_to_sheet([CABECALHO, ...linhas]);
  aba['!cols'] = [{ wch: 78 }, { wch: 10 }, { wch: 32 }, { wch: 32 }, { wch: 32 },
                  { wch: 32 }, { wch: 8 }, { wch: 22 }, { wch: 12 }];
  aba['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: linhas.length, c: 8 } }) };

  const livro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(livro, aba, 'Perguntas');
  XLSX.writeFile(livro, alvo);

  const conta = linhas.reduce((c, l) => { c[l[1]] = (c[l[1]] || 0) + 1; return c; }, {});
  console.log(`${alvo}`);
  console.log(`  ${linhas.length} perguntas: `
    + Object.entries(conta).map(([t, n]) => `${n} ${t}`).join(' · '));
}

if (require.main === module) principal();

module.exports = { CABECALHO, ROTULO, EXEMPLOS_VF, EXEMPLOS_ABERTAS };
