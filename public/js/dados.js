
window.TRATO = window.TRATO || {};

TRATO.CASAS = [
  {n:1,x:204.2,y:461.1,r:10}, {n:2,x:209.4,y:435.6,r:10}, {n:3,x:216.1,y:410.5,r:10}, {n:4,x:224.5,y:386,r:10},
  {n:5,x:237.1,y:363.2,r:10}, {n:6,x:256.1,y:345.5,r:10}, {n:7,x:278.6,y:332.5,r:10}, {n:8,x:303.6,y:325.4,r:10},
  {n:9,x:329.6,y:325.2,r:10}, {n:10,x:359.4,y:327.3,r:10}, {n:11,x:427.3,y:329.4,r:10}, {n:12,x:494,y:317.3,r:10},
  {n:13,x:550.7,y:281.3,r:10}, {n:14,x:596.9,y:231.5,r:10}, {n:15,x:653.9,y:227.7,r:10}, {n:16,x:690.1,y:276.4,r:10},
  {n:17,x:692.9,y:339.9,r:10}, {n:18,x:688.5,y:403.2,r:10}, {n:19,x:719.5,y:425.9,r:10}, {n:20,x:755.8,y:419.4,r:10},
  {n:21,x:773.5,y:400.4,r:10}, {n:22,x:812.2,y:350.4,r:10}, {n:23,x:858.4,y:288.7,r:10}, {n:24,x:857.5,y:210.5,r:10},
  {n:25,x:905.1,y:262.3,r:10}, {n:26,x:957.4,y:320.7,r:10}, {n:27,x:902.4,y:333.9,r:10}, {n:28,x:851.8,y:387.9,r:10},
  {n:29,x:896.3,y:416.7,r:10}, {n:30,x:974.5,y:419.6,r:10}, {n:31,x:997.6,y:369.1,r:10}, {n:32,x:971.7,y:295.1,r:10},
  {n:33,x:944.5,y:221.5,r:10}, {n:34,x:944.7,y:258.8,r:10}, {n:35,x:930.7,y:335.7,r:10}, {n:36,x:934.6,y:413.5,r:10},
  {n:37,x:955.7,y:488.9,r:10}, {n:38,x:924.3,y:488.9,r:10}, {n:39,x:840.2,y:498.6,r:10}, {n:40,x:763.1,y:482.4,r:10},
  {n:41,x:781.8,y:375.8,r:10}, {n:42,x:797.4,y:318.7,r:10}, {n:43,x:781.3,y:237.6,r:10}, {n:44,x:745.4,y:160.9,r:10},
  {n:45,x:809.3,y:145.9,r:10}, {n:46,x:893.2,y:155.9,r:10}, {n:47,x:975.5,y:170.6,r:10}, {n:48,x:1027.3,y:235.1,r:10},
  {n:49,x:1038.5,y:313.4,r:10}, {n:50,x:1120.4,y:327.7,r:10},
];
TRATO.PRIMEIRA_CASA = 1;
TRATO.ULTIMA_CASA = TRATO.CASAS.length;

TRATO.REGIOES = [
  { casa:  1, nome: 'Boca',              categorias: ['boca'] },
  { casa:  5, nome: 'Faringe',           categorias: ['faringe'] },
  { casa:  9, nome: 'Esôfago',           categorias: ['esofago'] },
  { casa: 14, nome: 'Estômago',          categorias: ['estomago'] },
  { casa: 18, nome: 'Duodeno',           categorias: ['duodeno', 'figado', 'pancreas'] },
  { casa: 22, nome: 'Intestino delgado', categorias: ['intestino delgado', 'figado', 'pancreas'] },
  { casa: 37, nome: 'Intestino grosso',  categorias: ['intestino grosso'] },
];

/** Em que região está uma casa (1..50). */
TRATO.regiaoDaCasa = (n) => {
  let atual = TRATO.REGIOES[0];
  for (const r of TRATO.REGIOES) if (n >= r.casa) atual = r;
  return atual;
};

TRATO.APELIDOS_DE_CATEGORIA = {
  'boca':              ['boca', 'cavidade oral', 'oral', 'lingua', 'dentes'],
  'faringe':           ['faringe', 'garganta', 'degluticao'],
  'esofago':           ['esofago'],
  'estomago':          ['estomago', 'gastrico'],
  'duodeno':           ['duodeno'],
  'intestino delgado': ['intestino delgado', 'delgado', 'jejuno', 'ileo'],
  'intestino grosso':  ['intestino grosso', 'grosso', 'colon', 'ceco', 'reto', 'anus', 'apendice'],
  'figado':            ['figado e vias biliares', 'figado', 'vias biliares', 'vesicula biliar', 'bile'],
  'pancreas':          ['pancreas'],
  'geral':             ['geral', 'geral do trato', 'trato digestorio', ''],
};

/**
 * As categorias que valem quando a região da casa não tem mais pergunta.
 *
 * Só as gerais. O fígado e o pâncreas já estão catalogados onde participam:
 * duodeno e intestino delgado, 20 casas somadas, que é para onde vai a maior
 * parte da partida. Não precisam da reserva para serem sorteados, e deixá-los
 * nela só faria uma pergunta de bile aparecer no meio da boca.
 */
TRATO.CATEGORIAS_RESERVA = ['geral'];

/** A chave de categoria de uma pergunta, ou 'geral' se não reconhecermos. */
TRATO.categoriaDaPergunta = (p) => {
  const bruta = (p && p.categoriaChave) || '';
  for (const [chave, apelidos] of Object.entries(TRATO.APELIDOS_DE_CATEGORIA)) {
    if (apelidos.includes(bruta)) return chave;
  }
  return 'geral';
};

/** Esta pergunta serve para alguma destas categorias? */
TRATO.perguntaServe = (p, categorias) => categorias.includes(TRATO.categoriaDaPergunta(p));

const casaDaRegiao = (nome) => TRATO.REGIOES.find((r) => r.nome === nome).casa;

TRATO.PENALIDADES_PADRAO = [
  { id:"carie",        nome:"Cárie",            efeito:"Perca a vez.",                          tipo:"pular",      valor:1,
    regioes:["Boca","Faringe"] },
  { id:"refluxo",      nome:"Refluxo",          efeito:"Volte para o início do esôfago.",        tipo:"voltarPara", alvo:casaDaRegiao("Esôfago"),
    regioes:["Esôfago","Estômago"] },
  { id:"ulcera",       nome:"Úlcera",           efeito:"Volte 3 casas.",                        tipo:"voltar",     valor:3,
    regioes:["Estômago","Duodeno"] },
  { id:"nausea",       nome:"Náusea",           efeito:"Volte 2 casas.",                        tipo:"voltar",     valor:2,
    regioes:["Faringe","Esôfago","Estômago"] },
  { id:"apendicite",   nome:"Apendicite",       efeito:"Volte ao início do intestino delgado.", tipo:"voltarPara", alvo:casaDaRegiao("Intestino delgado"),
    regioes:["Intestino grosso"] },
  { id:"prisao",       nome:"Prisão de ventre", efeito:"Fique 1 rodada parado.",                tipo:"pular",      valor:1,
    regioes:["Intestino grosso"] },
  { id:"calculo",      nome:"Cálculo biliar",   efeito:"Pule a sua próxima jogada.",            tipo:"pular",      valor:1,
    regioes:["Duodeno"] },
  { id:"intoxicacao",  nome:"Intoxicação",      efeito:"Volte 4 casas.",                        tipo:"voltar",     valor:4 },
];

TRATO.VANTAGENS_PADRAO = [
  { id:"saliva",          nome:"Saliva a jato",           efeito:"A amilase já começou o trabalho: avance 2 casas.", tipo:"avancar",     valor:2,
    regioes:["Boca","Faringe"] },
  { id:"mastigacao",      nome:"Boa mastigação",          efeito:"Bolo alimentar bem formado: role o dado de novo.", tipo:"jogarDeNovo",
    regioes:["Boca","Faringe","Esôfago"] },
  { id:"peristalse",      nome:"Peristalse forte",        efeito:"A onda te empurrou: avance 3 casas.",              tipo:"avancar",     valor:3,
    regioes:["Esôfago","Estômago"] },
  { id:"bile",            nome:"Bile em dia",             efeito:"Gordura emulsificada: avance 2 casas.",            tipo:"avancar",     valor:2,
    regioes:["Estômago","Duodeno"] },
  { id:"enzimas",         nome:"Enzimas pancreáticas",    efeito:"Tudo quebrado em pedaços: role o dado de novo.",   tipo:"jogarDeNovo",
    regioes:["Duodeno","Intestino delgado"] },
  { id:"vilosidades",     nome:"Vilosidades ativas",      efeito:"Absorção a todo vapor: avance 3 casas.",           tipo:"avancar",     valor:3,
    regioes:["Intestino delgado"] },
  { id:"fibra",           nome:"Fibra alimentar",         efeito:"Alimenta a microbiota: avance 2 casas.",           tipo:"avancar",     valor:2,
    regioes:["Intestino grosso"] },
  { id:"lactobacillus",   nome:"Lactobacillus",           efeito:"Bactéria boa: avance 3 casas.",                    tipo:"avancar",     valor:3,
    bacteria:true, regioes:["Intestino delgado","Intestino grosso"] },
  { id:"bifidobacterium", nome:"Bifidobacterium",         efeito:"Bactéria boa: fique imune à próxima penalidade.",  tipo:"escudo",      valor:1,
    bacteria:true, regioes:["Intestino grosso"] },
  { id:"probiotico",      nome:"Probiótico",              efeito:"Bactéria boa reforçada: role o dado de novo.",     tipo:"jogarDeNovo",
    bacteria:true, regioes:["Intestino delgado","Intestino grosso"] },
  { id:"microbiota",      nome:"Microbiota equilibrada",  efeito:"Bactérias boas em maioria: fique imune à próxima penalidade.", tipo:"escudo", valor:1,
    bacteria:true, regioes:["Intestino delgado","Intestino grosso"] },
];

/** Esta carta pode cair nesta casa? Sem `regioes`, cai em qualquer uma. */
TRATO.cartaCabeNaCasa = (carta, casa) =>
  !carta.regioes || carta.regioes.includes(TRATO.regiaoDaCasa(casa).nome);

TRATO.PALETA_EQUIPES = [
  "#54DEDC",
  "#5479DE",
  "#9754DE",
  "#DE54BE",
  "#DE5456",
  "#DEB954",
  "#9BDE54",
  "#54DE74",
];
