
const fs = require('fs');
const path = require('path');
const os = require('os');
const XLSX = require('xlsx');

const NOME_ARQUIVO = 'Perguntas.xlsx';

function pastasDeAreaDeTrabalho() {
  const lar = os.homedir();
  const cand = [];

  const push = (p) => { if (p && !cand.includes(p)) cand.push(p); };

  push(process.env.OneDrive && path.join(process.env.OneDrive, 'Desktop'));
  push(process.env.OneDrive && path.join(process.env.OneDrive, 'Área de Trabalho'));
  push(process.env.OneDriveCommercial && path.join(process.env.OneDriveCommercial, 'Desktop'));
  push(process.env.OneDriveConsumer && path.join(process.env.OneDriveConsumer, 'Desktop'));

  push(path.join(lar, 'OneDrive', 'Desktop'));
  push(path.join(lar, 'OneDrive', 'Área de Trabalho'));
  try {
    for (const nome of fs.readdirSync(lar)) {
      if (/^OneDrive/i.test(nome)) {
        push(path.join(lar, nome, 'Desktop'));
        push(path.join(lar, nome, 'Área de Trabalho'));
      }
    }
  } catch {  }

  push(path.join(lar, 'Desktop'));
  push(path.join(lar, 'Área de Trabalho'));

  push(process.env.PUBLIC && path.join(process.env.PUBLIC, 'Desktop'));

  push(path.join(lar, 'Documents'));
  push(path.join(lar, 'Documentos'));

  push(process.cwd());

  return cand;
}

const PARECE_PLANILHA = /^perguntas.*\.(xlsx|xlsm|xls|csv)$/i;

function planilhaNaPasta(pasta) {
  const exato = path.join(pasta, NOME_ARQUIVO);
  if (fs.existsSync(exato)) return exato;
  try {
    const achado = fs.readdirSync(pasta).filter((n) => PARECE_PLANILHA.test(n)).sort()[0];
    if (achado) return path.join(pasta, achado);
  } catch {  }
  return null;
}

/**
 * Procura o Perguntas.xlsx. Se `caminhoManual` vier preenchido (o professor
 * escolheu o arquivo na mão), ele tem prioridade absoluta.
 * @returns {{caminho:string|null, tentados:string[]}}
 */
function localizarPlanilha(caminhoManual) {
  if (caminhoManual) {
    const p = path.resolve(caminhoManual);
    return { caminho: fs.existsSync(p) ? p : null, tentados: [p] };
  }

  const tentados = [];
  for (const pasta of pastasDeAreaDeTrabalho()) {
    tentados.push(path.join(pasta, NOME_ARQUIVO));
    const achado = planilhaNaPasta(pasta);
    if (achado) return { caminho: achado, tentados };
  }
  return { caminho: null, tentados };
}

/** "Dificuldade " -> "dificuldade" (sem acento, sem espaço, minúscula) */
const normalizar = (s) => String(s ?? '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .trim().toLowerCase();

const COLUNAS = {
  pergunta:    ['pergunta', 'perguntas', 'questao', 'enunciado'],
  tipo:        ['tipo', 'formato', 'modo'],
  a:           ['a', 'alternativa a', 'opcao a'],
  b:           ['b', 'alternativa b', 'opcao b'],
  c:           ['c', 'alternativa c', 'opcao c'],
  d:           ['d', 'alternativa d', 'opcao d'],
  correta:     ['correta', 'resposta', 'gabarito', 'resposta correta'],
  categoria:   ['categoria', 'tema', 'assunto'],
  dificuldade: ['dificuldade', 'nivel'],
};

const TIPOS = {
  multipla: ['multipla', 'multipla escolha', 'multiplaescolha', 'alternativas', 'objetiva', 'm'],
  vf:       ['vf', 'v/f', 'v ou f', 'verdadeiro ou falso', 'verdadeiro/falso', 'verdadeirofalso'],
  aberta:   ['aberta', 'discursiva', 'livre', 'oral', 'dissertativa'],
};

const tipoDeclarado = (texto) => {
  const t = normalizar(texto).replace(/\s+/g, ' ');
  if (!t) return null;
  for (const [tipo, apelidos] of Object.entries(TIPOS)) {
    if (apelidos.includes(t) || apelidos.includes(t.replace(/\s/g, ''))) return tipo;
  }
  return null;
};

/** "b)", "letra B", "  B " -> "B"; "verdadeiro", "v" -> "V". */
function lerGabarito(bruto) {
  const t = normalizar(bruto).replace(/\s+/g, ' ').trim();
  if (!t) return '';
  if (/^(v|verdadeiro|verdade|true)\b/.test(t)) return 'V';
  if (/^(f|falso|falsa|false)\b/.test(t)) return 'F';
  const letra = t.toUpperCase().match(/\b([ABCD])\b/);
  return letra ? letra[1] : '';
}

/** Acha em qual linha está o cabeçalho e mapeia cada campo para um índice. */
function mapearCabecalho(linhas) {
  for (let i = 0; i < Math.min(linhas.length, 20); i++) {
    const linha = (linhas[i] || []).map(normalizar);
    if (!linha.some((c) => COLUNAS.pergunta.includes(c))) continue;

    const mapa = {};
    for (const [campo, apelidos] of Object.entries(COLUNAS)) {
      const idx = linha.findIndex((c) => c && apelidos.includes(c));
      if (idx >= 0) mapa[campo] = idx;
    }
    return { linhaCabecalho: i, mapa };
  }
  return null;
}

/**
 * Interpreta uma pasta de trabalho já aberta e devolve as perguntas limpas.
 * Fica separado da leitura em disco para que o arquivo escolhido à mão pelo
 * professor passe exatamente pelas mesmas regras.
 * @param {object} planilha  pasta de trabalho do SheetJS
 * @param {string} origem    caminho ou nome do arquivo, só para as mensagens
 */
function interpretarPlanilha(planilha, origem) {
  const aba = planilha.Sheets[planilha.SheetNames[0]];
  const caminho = origem;
  if (!aba) {
    return { ok: false, codigo: 'VAZIO', erro: 'A planilha não tem nenhuma aba com conteúdo.', caminho };
  }

  const linhas = XLSX.utils.sheet_to_json(aba, { header: 1, blankrows: false, defval: '' });
  const cab = mapearCabecalho(linhas);

  if (!cab) {
    return {
      ok: false,
      codigo: 'SEM_CABECALHO',
      erro: 'Não achei a coluna "Pergunta" na planilha. A primeira linha precisa ter os títulos das colunas: Pergunta | A | B | C | D | Correta | Categoria | Dificuldade.',
      caminho,
    };
  }

  const { linhaCabecalho, mapa } = cab;
  const perguntas = [];
  let ignoradas = 0;
  const rebaixadas = [];

  for (let i = linhaCabecalho + 1; i < linhas.length; i++) {
    const linha = linhas[i] || [];
    const pega = (campo) => (mapa[campo] === undefined ? '' : String(linha[mapa[campo]] ?? '').trim());

    const texto = pega('pergunta');
    if (!texto) { if (linha.some((c) => String(c).trim())) ignoradas++; continue; }

    const textos = { A: pega('a'), B: pega('b'), C: pega('c'), D: pega('d') };
    const temAlternativas = Object.values(textos).filter(Boolean).length >= 2;
    const gabarito = lerGabarito(pega('correta'));

    let tipo = tipoDeclarado(pega('tipo'))
      || (temAlternativas ? 'multipla' : (gabarito === 'V' || gabarito === 'F') ? 'vf' : 'aberta');

    let correta = '';
    if (tipo === 'multipla') {
      if (temAlternativas && textos[gabarito]) correta = gabarito;
      else { rebaixadas.push({ linha: i + 1, texto, motivo: temAlternativas ? 'gabarito ausente ou fora de A a D' : 'faltam as alternativas' }); tipo = 'aberta'; }
    } else if (tipo === 'vf') {
      if (gabarito === 'V' || gabarito === 'F') correta = gabarito;
      else { rebaixadas.push({ linha: i + 1, texto, motivo: 'gabarito precisa ser V ou F' }); tipo = 'aberta'; }
    }

    const opcoes = tipo === 'multipla'
      ? ['A', 'B', 'C', 'D'].filter((l) => textos[l]).map((l) => ({ letra: l, texto: textos[l] }))
      : tipo === 'vf'
        ? [{ letra: 'V', texto: 'Verdadeiro' }, { letra: 'F', texto: 'Falso' }]
        : [];

    const categoria = pega('categoria');

    perguntas.push({
      id: perguntas.length + 1,
      texto,
      tipo,
      opcoes,
      correta,
      categoria,
      categoriaChave: normalizar(categoria).replace(/\s+/g, ' '),
      dificuldade: pega('dificuldade'),
    });
  }

  if (!perguntas.length) {
    return {
      ok: false,
      codigo: 'SEM_PERGUNTAS',
      erro: `Achei o arquivo em "${caminho}", mas ele não tem nenhuma pergunta preenchida abaixo do cabeçalho.`,
      caminho,
    };
  }

  const contagem = perguntas.reduce((c, p) => { c[p.tipo] = (c[p.tipo] || 0) + 1; return c; },
                                    { multipla: 0, vf: 0, aberta: 0 });

  return { ok: true, caminho, perguntas, ignoradas, rebaixadas, contagem };
}

/**
 * Procura o Perguntas.xlsx no disco e o interpreta.
 * @returns {{ok:boolean, erro?:string, caminho?:string, perguntas?:object[], ignoradas?:number}}
 */
function lerPerguntas(caminhoManual) {
  const { caminho, tentados } = localizarPlanilha(caminhoManual);

  if (!caminho) {
    return {
      ok: false,
      codigo: 'NAO_ENCONTRADO',
      erro: `Não achei o ${NOME_ARQUIVO}. Coloque o arquivo na área de trabalho (com esse nome exato) ou escolha o arquivo na tela do jogo.`,
      tentados,
    };
  }

  let planilha;
  try {
    planilha = XLSX.readFile(caminho, { cellDates: false });
  } catch {
    return {
      ok: false,
      codigo: 'ILEGIVEL',
      erro: `Achei o arquivo em "${caminho}", mas não consegui abrir. Ele pode estar aberto no Excel neste momento, ou corrompido. Feche o Excel e tente de novo.`,
      caminho,
    };
  }

  return interpretarPlanilha(planilha, caminho);
}

/**
 * Interpreta uma planilha enviada pelo navegador (o professor escolheu o
 * arquivo na mão porque não estava na área de trabalho).
 * @param {Buffer} buffer  conteúdo do arquivo
 * @param {string} nome    nome original, para as mensagens
 */
function lerPerguntasDeBuffer(buffer, nome = 'arquivo enviado') {
  let planilha;
  try {
    planilha = XLSX.read(buffer, { type: 'buffer', cellDates: false });
  } catch {
    return {
      ok: false,
      codigo: 'ILEGIVEL',
      erro: `Não consegui abrir "${nome}". Confira se é mesmo uma planilha do Excel (.xlsx, .xls ou .csv).`,
      caminho: nome,
    };
  }
  return interpretarPlanilha(planilha, nome);
}

module.exports = {
  lerPerguntas, lerPerguntasDeBuffer, interpretarPlanilha,
  localizarPlanilha, pastasDeAreaDeTrabalho, NOME_ARQUIVO,
};
