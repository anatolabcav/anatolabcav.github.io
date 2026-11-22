
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
  { id:"carie",     nome:"Cárie dentária",      tipo:"pular",  valor:1, regioes:["Boca"],
    efeito:"Você não escovou bem os dentes e a fermentação dos alimentos provocou cáries dentárias. Sua dor de dente o impossibilitará de comer. Fique uma vez sem jogar." },
  { id:"faringite", nome:"Infecção na garganta", tipo:"voltar", valor:2, regioes:["Faringe","Esôfago"],
    efeito:"Você teve uma infecção na garganta e está com dificuldades para deglutir. Volte duas casas." },
  { id:"refluxo",   nome:"Esofagite de refluxo", tipo:"voltar", valor:2, regioes:["Esôfago"],
    efeito:"Você está com uma hérnia de hiato e, consequentemente, teve uma esofagite de refluxo. Volte duas casas." },
  { id:"nausea",    nome:"Náusea",              tipo:"pular",  valor:2, regioes:["Esôfago","Estômago"],
    efeito:"Sua comida estava estragada e você ficou com náuseas. Fique duas vezes sem jogar." },
  { id:"gordura",   nome:"Excesso de gordura",  tipo:"voltar", valor:3, regioes:["Estômago","Duodeno"],
    efeito:"Você consumiu muita gordura, por isso passará mais tempo no estômago. Volte 3 casas." },
  { id:"gastrite",  nome:"Gastrite",            tipo:"pular",  valor:1, regioes:["Estômago"],
    efeito:"Você foi contaminado pela bactéria H. pylori e está com gastrite. Fique uma vez sem jogar." },
  { id:"calculo",   nome:"Cálculo biliar",      tipo:"pular",  valor:1, regioes:["Duodeno"],
    efeito:"Um cálculo biliar migrou até a ampola hepatopancreática e lá ficou preso, provocando uma pancreatite. Fique uma vez sem jogar." },
  { id:"ressaca",   nome:"Ressaca",             tipo:"pular",  valor:1, regioes:["Duodeno","Intestino delgado"],
    efeito:"Você consumiu muita bebida alcoólica e seu fígado ainda não conseguiu metabolizar tudo. Vá curtir sua ressaca ficando uma vez sem jogar." },
  { id:"prisao",    nome:"Prisão de ventre",    tipo:"pular",  valor:1, regioes:["Intestino grosso"],
    efeito:"Você consumiu poucas fibras e bebeu pouca água, portanto terá prisão de ventre. Fique uma vez sem jogar." },

  { id:"carie-classica",   nome:"Cárie",            efeito:"Perca a vez.",                         tipo:"pular",      valor:1,
    regioes:["Boca","Faringe"], ativa:false },
  { id:"refluxo-classica", nome:"Refluxo",          efeito:"Volte para o início do esôfago.",       tipo:"voltarPara", alvo:casaDaRegiao("Esôfago"),
    regioes:["Esôfago","Estômago"], ativa:false },
  { id:"ulcera",           nome:"Úlcera",           efeito:"Volte 3 casas.",                       tipo:"voltar",     valor:3,
    regioes:["Estômago","Duodeno"], ativa:false },
  { id:"nausea-classica",  nome:"Náusea",           efeito:"Volte 2 casas.",                       tipo:"voltar",     valor:2,
    regioes:["Faringe","Esôfago","Estômago"], ativa:false },
  { id:"apendicite",       nome:"Apendicite",       efeito:"Volte ao início do intestino delgado.", tipo:"voltarPara", alvo:casaDaRegiao("Intestino delgado"),
    regioes:["Intestino grosso"], ativa:false },
  { id:"prisao-classica",  nome:"Prisão de ventre", efeito:"Fique 1 rodada parado.",               tipo:"pular",      valor:1,
    regioes:["Intestino grosso"], ativa:false },
  { id:"calculo-classica", nome:"Cálculo biliar",   efeito:"Pule a sua próxima jogada.",           tipo:"pular",      valor:1,
    regioes:["Duodeno"], ativa:false },
  { id:"intoxicacao",      nome:"Intoxicação",      efeito:"Volte 4 casas.",                       tipo:"voltar",     valor:4,
    regioes:["Estômago","Duodeno","Intestino delgado","Intestino grosso"], ativa:false },
];

TRATO.VANTAGENS_PADRAO = [
  { id:"flora",        nome:"Flora gastrintestinal", tipo:"jogarDeNovo", regioes:["Boca","Faringe"],
    efeito:"Você está com uma flora gastrintestinal muito boa, portanto sua digestão será um sucesso. Jogue o dado mais uma vez." },
  { id:"sentidos",     nome:"Fase cefálica",         tipo:"avancarPara", alvo:casaDaRegiao("Faringe"), regioes:["Boca"],
    efeito:"Agora que os alimentos estimularam todos os seus sentidos, sua digestão será um sucesso. Vá direto para a faringe." },
  { id:"higiene",      nome:"Higiene bucal",         tipo:"avancar",     valor:2, regioes:["Boca","Faringe"],
    efeito:"Sua higiene bucal é excelente. Continue assim e será um vencedor. Adiante duas casas." },
  { id:"refeicaoLeve", nome:"Refeição leve",         tipo:"avancarPara", alvo:casaDaRegiao("Duodeno"), regioes:["Esôfago","Estômago"],
    efeito:"Você fez uma refeição leve, portanto vá direto para o duodeno." },
  { id:"absorcao",     nome:"Flora intestinal",      tipo:"avancarPara", alvo:casaDaRegiao("Intestino grosso"), regioes:["Intestino delgado"],
    efeito:"Parabéns, sua flora intestinal está indo muito bem e seus nutrientes serão fermentados e bem absorvidos. Vá direto para o intestino grosso." },
  { id:"fibras",       nome:"Fibras solúveis",       tipo:"avancar",     valor:3, regioes:["Intestino grosso"],
    efeito:"Você fez uma refeição rica em fibras solúveis e bebeu bastante água. Suas fezes serão macias. Avance 3 casas." },

  { id:"saliva",          nome:"Saliva a jato",          efeito:"A amilase já começou o trabalho: avance 2 casas.", tipo:"avancar",     valor:2,
    regioes:["Boca","Faringe"], ativa:false },
  { id:"mastigacao",      nome:"Boa mastigação",         efeito:"Bolo alimentar bem formado: role o dado de novo.", tipo:"jogarDeNovo",
    regioes:["Boca","Faringe","Esôfago"], ativa:false },
  { id:"peristalse",      nome:"Peristalse forte",       efeito:"A onda te empurrou: avance 3 casas.",              tipo:"avancar",     valor:3,
    regioes:["Esôfago","Estômago"], ativa:false },
  { id:"bile",            nome:"Bile em dia",            efeito:"Gordura emulsificada: avance 2 casas.",            tipo:"avancar",     valor:2,
    regioes:["Estômago","Duodeno"], ativa:false },
  { id:"enzimas",         nome:"Enzimas pancreáticas",   efeito:"Tudo quebrado em pedaços: role o dado de novo.",   tipo:"jogarDeNovo",
    regioes:["Duodeno","Intestino delgado"], ativa:false },
  { id:"vilosidades",     nome:"Vilosidades ativas",     efeito:"Absorção a todo vapor: avance 3 casas.",           tipo:"avancar",     valor:3,
    regioes:["Intestino delgado"], ativa:false },
  { id:"fibra",           nome:"Fibra alimentar",        efeito:"Alimenta a microbiota: avance 2 casas.",           tipo:"avancar",     valor:2,
    regioes:["Intestino grosso"], ativa:false },
  { id:"lactobacillus",   nome:"Lactobacillus",          efeito:"Bactéria boa: avance 3 casas.",                    tipo:"avancar",     valor:3,
    regioes:["Intestino delgado","Intestino grosso"], ativa:false },
  { id:"bifidobacterium", nome:"Bifidobacterium",        efeito:"Bactéria boa: fique imune à próxima penalidade.",  tipo:"escudo",      valor:1,
    regioes:["Intestino grosso"], ativa:false },
  { id:"probiotico",      nome:"Probiótico",             efeito:"Bactéria boa reforçada: role o dado de novo.",     tipo:"jogarDeNovo",
    regioes:["Intestino delgado","Intestino grosso"], ativa:false },
  { id:"microbiota",      nome:"Microbiota equilibrada", efeito:"Bactérias boas em maioria: fique imune à próxima penalidade.", tipo:"escudo", valor:1,
    regioes:["Intestino delgado","Intestino grosso"], ativa:false },
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
