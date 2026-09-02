
const XLSX = require('xlsx');
const path = require('path');

const BANCO = {

  'Boca': {
    m: [
      ['Qual enzima inicia a digestão do amido ainda na cavidade oral?','Pepsina','Amilase salivar (ptialina)','Lipase pancreática','Tripsina','B','Fácil'],
      ['Quantos pares de glândulas salivares maiores existem?','Um','Dois','Três','Quatro','C','Fácil'],
      ['Qual é o tecido mais duro do corpo humano, que recobre a coroa do dente?','Dentina','Esmalte','Cemento','Polpa','B','Fácil'],
      ['Quantos dentes tem a dentição permanente completa do adulto?','20','28','32','36','C','Fácil'],
      ['Quantos dentes tem a dentição decídua (de leite)?','16','20','24','28','B','Média'],
      ['Qual músculo eleva a mandíbula e é um dos principais da mastigação?','Bucinador','Masseter','Milo-hióideo','Platisma','B','Fácil'],
      ['Qual das glândulas salivares maiores é a maior de todas?','Submandibular','Parótida','Sublingual','Todas têm o mesmo tamanho','B','Fácil'],
      ['O ducto parotídeo (de Stensen) desemboca na cavidade oral na altura de qual dente?','Incisivo central inferior','Canino superior','Segundo molar superior','Terceiro molar inferior','C','Difícil'],
      ['Qual nervo faz a sensibilidade geral dos dois terços anteriores da língua?','Glossofaríngeo','Nervo lingual, ramo do trigêmeo','Hipoglosso','Vago','B','Média'],
      ['Qual nervo craniano é responsável pela motricidade da língua?','Facial','Glossofaríngeo','Hipoglosso','Vago','C','Média'],
      ['Qual nervo leva a sensibilidade gustativa dos dois terços anteriores da língua?','Corda do tímpano, ramo do facial','Glossofaríngeo','Hipoglosso','Trigêmeo','A','Difícil'],
      ['Que tipo de papila lingual NÃO possui botões gustativos?','Filiforme','Fungiforme','Valada (circunvalada)','Folhada','A','Difícil'],
      ['O palato duro é formado por quais ossos?','Maxila e palatino','Esfenoide e vômer','Frontal e etmoide','Mandíbula e zigomático','A','Média'],
      ['Qual músculo da mastigação é responsável principalmente pela protrusão da mandíbula?','Masseter','Temporal','Pterigóideo lateral','Bucinador','C','Difícil'],
      ['Qual é a porção central e vascularizada do dente, que contém nervos?','Esmalte','Dentina','Polpa','Cemento','C','Fácil'],
      ['A saliva é composta majoritariamente por quê?','Enzimas','Água','Muco','Bicarbonato','B','Fácil'],
      ['Qual enzima da saliva tem ação antibacteriana?','Amilase','Lisozima','Lipase lingual','Pepsina','B','Média'],
      ['Qual estrutura fixa a língua ao assoalho da boca?','Úvula','Frênulo lingual','Rafe palatina','Tonsila lingual','B','Fácil'],
      ['O que é o bolo alimentar?','O alimento já absorvido','A massa de alimento mastigada e misturada à saliva','O conteúdo do estômago','As fezes em formação','B','Fácil'],
      ['Qual nervo craniano inerva os músculos da mastigação?','Facial','Trigêmeo (ramo mandibular)','Hipoglosso','Glossofaríngeo','B','Média'],
    ],
    v: [
      ['A digestão química do amido começa na boca, pela amilase salivar.','V','Fácil'],
      ['O esmalte dentário é capaz de se regenerar depois de perdido.','F','Média'],
      ['A parótida é a maior das glândulas salivares.','V','Fácil'],
      ['A língua é formada por músculo estriado esquelético.','V','Média'],
      ['A digestão de proteínas começa na boca.','F','Fácil'],
    ],
    a: [
      ['Cite as três glândulas salivares maiores.','Fácil'],
      ['Explique o papel da mastigação na digestão.','Fácil'],
      ['Quais são as camadas do dente, da mais externa para a mais interna?','Média'],
    ],
  },

  'Faringe': {
    m: [
      ['Quais são as três porções da faringe, de cima para baixo?','Nasofaringe, orofaringe e laringofaringe','Orofaringe, nasofaringe e laringofaringe','Laringofaringe, orofaringe e nasofaringe','Nasofaringe, laringofaringe e orofaringe','A','Fácil'],
      ['A deglutição tem três fases. Qual delas é voluntária?','Oral','Faríngea','Esofágica','Nenhuma delas','A','Média'],
      ['Qual estrutura fecha a entrada da laringe durante a deglutição?','Úvula','Epiglote','Palato mole','Cartilagem cricoide','B','Fácil'],
      ['Que porção da faringe é comum às vias respiratória e digestória?','Nasofaringe apenas','Orofaringe e laringofaringe','Apenas a laringofaringe','Nenhuma: os trajetos nunca se cruzam','B','Média'],
      ['Qual estrutura impede que o alimento suba para a cavidade nasal na deglutição?','Epiglote','Palato mole e úvula','Cartilagem tireoide','Tonsila faríngea','B','Média'],
      ['A tuba auditiva (de Eustáquio) desemboca em qual porção da faringe?','Nasofaringe','Orofaringe','Laringofaringe','Esôfago','A','Média'],
      ['As tonsilas palatinas ficam em qual porção da faringe?','Nasofaringe','Orofaringe','Laringofaringe','Todas as anteriores','B','Fácil'],
      ['O anel linfático de Waldeyer é formado por quê?','Linfonodos cervicais','Um conjunto de tonsilas em volta da faringe','Placas de Peyer','Vasos linfáticos do pescoço','B','Difícil'],
      ['Quantos são os músculos constritores da faringe de cada lado?','Dois','Três','Quatro','Cinco','B','Média'],
      ['Que tipo de músculo forma a parede da faringe?','Liso, involuntário','Estriado esquelético','Cardíaco','Liso e cardíaco','B','Média'],
      ['Qual nervo craniano é o principal responsável pela motricidade dos músculos da faringe?','Trigêmeo','Facial','Vago','Hipoglosso','C','Difícil'],
      ['Qual nervo leva a sensibilidade da orofaringe e dispara o reflexo do vômito?','Glossofaríngeo','Hipoglosso','Facial','Trigêmeo','A','Difícil'],
      ['A tonsila faríngea aumentada é conhecida popularmente como quê?','Amígdala','Adenoide','Úvula','Pólipo','B','Média'],
      ['Onde a faringe termina e o esôfago começa?','Na altura de C6, na borda inferior da cartilagem cricoide','Na altura de T4','No osso hioide','Na altura de T10','A','Difícil'],
      ['Em que fase da deglutição a respiração é momentaneamente interrompida?','Oral','Faríngea','Esofágica','A respiração nunca é interrompida','B','Média'],
      ['O que é a disfagia?','Dor ao respirar','Dificuldade de deglutir','Perda do paladar','Refluxo do conteúdo gástrico','B','Fácil'],
    ],
    v: [
      ['A epiglote fecha a traqueia durante a deglutição.','V','Fácil'],
      ['A faringe faz parte apenas do sistema digestório.','F','Fácil'],
      ['A fase faríngea da deglutição é involuntária.','V','Média'],
      ['Os músculos da faringe são de músculo liso.','F','Média'],
    ],
    a: [
      ['Cite as três porções da faringe, na ordem de cima para baixo.','Fácil'],
      ['Explique como o corpo impede que o alimento entre na via respiratória durante a deglutição.','Média'],
    ],
  },

  'Esôfago': {
    m: [
      ['Em que nível vertebral o esôfago atravessa o diafragma?','T8','T10','T12','L1','B','Média'],
      ['Qual epitélio reveste a mucosa do esôfago?','Simples colunar','Estratificado pavimentoso não queratinizado','Pseudoestratificado ciliado','De transição','B','Média'],
      ['Qual estrutura impede o refluxo do conteúdo gástrico para o esôfago?','Esfíncter esofágico superior','Esfíncter esofágico inferior (cárdia)','Esfíncter pilórico','Válvula ileocecal','B','Fácil'],
      ['Qual é o comprimento aproximado do esôfago no adulto?','10 cm','25 cm','50 cm','75 cm','B','Média'],
      ['Quais são as três porções do esôfago?','Cervical, torácica e abdominal','Superior, média e inferior','Proximal, medial e distal','Cranial, torácica e pélvica','A','Média'],
      ['Qual porção do esôfago é a mais curta?','Cervical','Torácica','Abdominal','Todas têm o mesmo comprimento','C','Difícil'],
      ['Que tipo de músculo predomina no terço superior do esôfago?','Liso','Estriado esquelético','Cardíaco','Não há músculo nessa região','B','Difícil'],
      ['Que tipo de músculo predomina no terço inferior do esôfago?','Estriado esquelético','Liso','Cardíaco','Elástico','B','Difícil'],
      ['O esôfago passa por trás de qual estrutura no tórax?','Aorta','Traqueia','Coluna vertebral','Diafragma','B','Média'],
      ['A que estrutura o esôfago é anterior ao longo do tórax?','Coração','Coluna vertebral','Esterno','Traqueia','B','Média'],
      ['O esôfago tem quantas constrições anatômicas principais?','Uma','Duas','Três','Quatro','C','Difícil'],
      ['O que é a hérnia de hiato?','Deslocamento do estômago para o tórax pelo hiato esofágico','Ruptura do diafragma','Dilatação do esôfago','Estreitamento do piloro','A','Média'],
      ['Qual camada NÃO existe na maior parte do esôfago, diferente do resto do tubo digestório?','Mucosa','Submucosa','Muscular','Serosa','D','Difícil'],
      ['A doença do refluxo gastroesofágico atinge principalmente qual estrutura?','Esfíncter esofágico inferior','Piloro','Válvula ileocecal','Esfíncter de Oddi','A','Fácil'],
      ['Qual nervo acompanha o esôfago e faz sua inervação parassimpática?','Frênico','Vago','Intercostal','Simpático torácico','B','Média'],
      ['O que é acalasia?','Falha do esfíncter esofágico inferior em relaxar','Excesso de ácido no estômago','Inflamação da vesícula','Ausência de peristalse gástrica','A','Difícil'],
      ['Como se chama o movimento que empurra o bolo alimentar ao longo do esôfago?','Segmentação','Peristalse','Difusão','Emulsificação','B','Fácil'],
    ],
    v: [
      ['O esôfago produz enzimas digestivas.','F','Fácil'],
      ['O esôfago atravessa o diafragma pelo hiato esofágico.','V','Fácil'],
      ['A peristalse do esôfago depende da gravidade para funcionar.','F','Média'],
      ['O epitélio do esôfago é estratificado pavimentoso, adaptado ao atrito.','V','Média'],
      ['A maior parte do esôfago está no abdome.','F','Média'],
    ],
    a: [
      ['Descreva o trajeto do bolo alimentar da faringe até o estômago.','Média'],
      ['Explique por que o refluxo gastroesofágico causa queimação.','Média'],
    ],
  },

  'Estômago': {
    m: [
      ['Quais são as regiões anatômicas do estômago?','Cárdia, fundo, corpo e piloro','Antro, istmo e bulbo','Fundo, colo e cauda','Cabeça, corpo e cauda','A','Fácil'],
      ['O que as células parietais (oxínticas) da mucosa gástrica produzem?','Pepsinogênio','Ácido clorídrico e fator intrínseco','Muco alcalino','Gastrina','B','Média'],
      ['O que as células principais (zimogênicas) do estômago secretam?','Ácido clorídrico','Pepsinogênio','Somatostatina','Bicarbonato','B','Média'],
      ['Quais células produzem a gastrina?','Células G do antro pilórico','Células parietais','Células D','Células caliciformes','A','Média'],
      ['Qual estrutura controla a passagem do conteúdo gástrico para o duodeno?','Esfíncter esofágico inferior','Esfíncter pilórico','Válvula ileocecal','Esfíncter de Oddi','B','Fácil'],
      ['A absorção da vitamina B12 depende de qual substância produzida no estômago?','Pepsina','Fator intrínseco','Gastrina','Muco','B','Média'],
      ['Como se chamam as dobras da mucosa gástrica no estômago vazio?','Vilosidades','Rugas (pregas gástricas)','Haustros','Tênias','B','Fácil'],
      ['A camada muscular do estômago tem quantas subcamadas?','Uma','Duas','Três','Quatro','C','Difícil'],
      ['Qual subcamada muscular é exclusiva do estômago no tubo digestório?','Longitudinal','Circular','Oblíqua','Transversa','C','Difícil'],
      ['O que é o quimo?','O bolo alimentar ainda na boca','A massa semilíquida e ácida formada no estômago','As fezes formadas','A bile concentrada','B','Fácil'],
      ['O que ativa o pepsinogênio, transformando-o em pepsina?','A bile','O ácido clorídrico','O bicarbonato','A amilase','B','Média'],
      ['Qual é o pH aproximado do suco gástrico?','1 a 3','5 a 6','7, neutro','8 a 9','A','Fácil'],
      ['A curvatura maior do estômago dá inserção a qual estrutura?','Omento menor','Omento maior','Ligamento falciforme','Mesentério','B','Média'],
      ['Qual porção do estômago fica acima do nível da cárdia?','Fundo','Corpo','Antro','Piloro','A','Média'],
      ['Quais são as três fases da secreção gástrica?','Cefálica, gástrica e intestinal','Oral, faríngea e esofágica','Inicial, média e final','Ácida, básica e neutra','A','Difícil'],
      ['O que protege a mucosa gástrica da autodigestão?','A camada de muco e bicarbonato','O fator intrínseco','A gastrina','A pepsina','A','Média'],
      ['Que hormônio, liberado pelo duodeno, inibe a secreção gástrica?','Gastrina','Secretina','Insulina','Renina','B','Difícil'],
    ],
    v: [
      ['O estômago absorve a maior parte dos nutrientes da dieta.','F','Média'],
      ['A digestão de proteínas começa no estômago, pela ação da pepsina.','V','Fácil'],
      ['O estômago é capaz de absorver álcool e alguns medicamentos.','V','Média'],
      ['O fator intrínseco é produzido pelas células principais.','F','Difícil'],
    ],
    a: [
      ['Explique por que o estômago não se digere.','Média'],
      ['Cite as quatro regiões anatômicas do estômago.','Fácil'],
      ['Qual é o papel do ácido clorídrico na digestão?','Média'],
    ],
  },

  'Duodeno': {
    m: [
      ['Quantas porções tem o duodeno?','Duas','Três','Quatro','Cinco','C','Média'],
      ['Em qual porção do duodeno desemboca a ampola hepatopancreática (de Vater)?','Primeira (superior)','Segunda (descendente)','Terceira (horizontal)','Quarta (ascendente)','B','Média'],
      ['Qual estrutura controla a saída da bile e do suco pancreático no duodeno?','Esfíncter pilórico','Esfíncter de Oddi','Válvula ileocecal','Cárdia','B','Média'],
      ['Qual estrutura marca o limite entre o duodeno e o jejuno?','Válvula ileocecal','Ângulo duodenojejunal (ligamento de Treitz)','Esfíncter de Oddi','Papila duodenal maior','B','Difícil'],
      ['Que glândulas são exclusivas da submucosa do duodeno?','Glândulas de Brunner','Criptas de Lieberkühn','Glândulas gástricas','Placas de Peyer','A','Difícil'],
      ['Qual é a função da secreção das glândulas de Brunner?','Digerir proteínas','Neutralizar o quimo ácido com muco alcalino','Absorver água','Emulsificar gorduras','B','Difícil'],
      ['Qual é o formato característico do duodeno?','Em U','Em C, abraçando a cabeça do pâncreas','Em S','Retilíneo','B','Fácil'],
      ['A maior parte do duodeno ocupa que posição em relação ao peritônio?','Intraperitoneal','Retroperitoneal','Subperitoneal','Extra-abdominal','B','Difícil'],
      ['Qual é o comprimento aproximado do duodeno?','10 cm','25 cm','60 cm','1,5 m','B','Média'],
    ],
    v: [
      ['O duodeno é a primeira porção do intestino delgado.','V','Fácil'],
      ['A bile e o suco pancreático são lançados no jejuno.','F','Média'],
    ],
    a: [
      ['Explique o que chega ao duodeno vindo do estômago, do fígado e do pâncreas.','Média'],
    ],
  },

  'Fígado e vias biliares': {
    m: [
      ['Qual é a principal função da bile?','Digerir proteínas','Emulsificar gorduras','Neutralizar a pepsina','Absorver glicose','B','Fácil'],
      ['Onde a bile é armazenada e concentrada?','Fígado','Vesícula biliar','Pâncreas','Duodeno','B','Fácil'],
      ['Quantos lobos anatômicos tem o fígado?','Dois','Três','Quatro','Cinco','C','Média'],
      ['Qual vaso leva sangue rico em nutrientes do intestino para o fígado?','Artéria hepática própria','Veia porta hepática','Veia cava inferior','Veia esplênica','B','Média'],
      ['O ligamento falciforme divide externamente o fígado em quais partes?','Lobo quadrado e lobo caudado','Lobo direito e lobo esquerdo','Segmentos anterior e posterior','Cabeça e corpo','B','Média'],
      ['O ducto colédoco é formado pela união de quais ductos?','Ducto cístico e ducto hepático comum','Ducto pancreático e ducto cístico','Dois ductos hepáticos direitos','Ducto cístico e ducto pancreático','A','Média'],
      ['A bile contém enzimas digestivas?','Sim, várias','Não: ela emulsifica, mas não digere quimicamente','Sim, apenas a lipase','Sim, apenas a amilase','B','Média'],
      ['Em que quadrante do abdome o fígado se localiza predominantemente?','Superior direito','Superior esquerdo','Inferior direito','Inferior esquerdo','A','Fácil'],
      ['Qual é a unidade funcional microscópica do fígado?','Néfron','Lóbulo hepático','Alvéolo','Ácino pancreático','B','Média'],
      ['A icterícia, que deixa a pele amarelada, decorre do acúmulo de quê?','Colesterol','Bilirrubina','Glicose','Ureia','B','Média'],
      ['Qual estrutura conduz a bile da vesícula até o ducto colédoco?','Ducto hepático comum','Ducto cístico','Ducto pancreático','Ducto de Wirsung','B','Média'],
    ],
    v: [
      ['O fígado produz a bile, mas quem a armazena é a vesícula biliar.','V','Fácil'],
      ['A bile digere quimicamente as gorduras, quebrando-as em ácidos graxos.','F','Difícil'],
      ['O fígado é a maior glândula do corpo humano.','V','Fácil'],
    ],
    a: [
      ['Diga duas funções do fígado no processo digestivo.','Média'],
      ['Explique a diferença entre emulsificar e digerir uma gordura.','Difícil'],
    ],
  },

  'Pâncreas': {
    m: [
      ['As enzimas pancreáticas tripsina e quimotripsina digerem principalmente o quê?','Carboidratos','Proteínas','Lipídios','Ácidos nucleicos','B','Fácil'],
      ['Qual a função do bicarbonato do suco pancreático no duodeno?','Ativar a pepsina','Neutralizar o quimo ácido vindo do estômago','Emulsificar gorduras','Absorver vitaminas lipossolúveis','B','Média'],
      ['O pâncreas é uma glândula de que tipo?','Exclusivamente exócrina','Exclusivamente endócrina','Mista: exócrina e endócrina','Nenhuma das anteriores','C','Fácil'],
      ['O que as ilhotas de Langerhans do pâncreas produzem?','Amilase e lipase','Insulina e glucagon','Bile','Pepsinogênio','B','Fácil'],
      ['Quais são as partes do pâncreas?','Cabeça, colo, corpo e cauda','Fundo, corpo e antro','Lobo direito e esquerdo','Base e ápice','A','Média'],
      ['Qual enzima pancreática digere gorduras?','Tripsina','Lipase pancreática','Amilase','Nuclease','B','Fácil'],
      ['Como se chama o ducto pancreático principal?','Ducto de Wirsung','Ducto de Santorini','Ducto cístico','Ducto colédoco','A','Difícil'],
      ['O pâncreas ocupa que posição em relação ao peritônio?','Intraperitoneal','Retroperitoneal','Subperitoneal','Fora da cavidade abdominal','B','Média'],
      ['Que parte do pâncreas fica abraçada pelo duodeno?','Cabeça','Corpo','Cauda','Colo','A','Média'],
      ['Que hormônio duodenal estimula a secreção de bicarbonato pelo pâncreas?','Gastrina','Secretina','Insulina','Glucagon','B','Difícil'],
    ],
    v: [
      ['O pâncreas lança o suco pancreático diretamente na corrente sanguínea.','F','Média'],
      ['A insulina é produzida pela porção endócrina do pâncreas.','V','Fácil'],
      ['As enzimas pancreáticas são secretadas já ativas, prontas para digerir.','F','Difícil'],
    ],
    a: [
      ['Explique a diferença entre a função exócrina e a endócrina do pâncreas.','Média'],
    ],
  },

  'Intestino delgado': {
    m: [
      ['Quais são as três porções do intestino delgado, na ordem?','Duodeno, jejuno e íleo','Jejuno, duodeno e íleo','Íleo, jejuno e duodeno','Duodeno, íleo e jejuno','A','Fácil'],
      ['O que são as vilosidades intestinais?','Dobras de músculo liso','Projeções da mucosa que aumentam a superfície de absorção','Glândulas produtoras de bile','Nódulos linfáticos isolados','B','Fácil'],
      ['As placas de Peyer são encontradas principalmente em qual porção?','Duodeno','Jejuno','Íleo','Ceco','C','Média'],
      ['As pregas circulares (válvulas de Kerckring) são mais desenvolvidas em qual região?','Duodeno distal e jejuno proximal','Estômago','Íleo terminal','Cólon transverso','A','Difícil'],
      ['Qual porção do intestino delgado é a mais longa?','Duodeno','Jejuno','Íleo','Todas têm o mesmo comprimento','C','Difícil'],
      ['Onde ocorre a maior parte da absorção dos nutrientes?','Estômago','Intestino delgado','Intestino grosso','Esôfago','B','Fácil'],
      ['Os quilomícrons formados na absorção de gorduras são lançados inicialmente em quê?','Capilares sanguíneos','Vasos linfáticos (quilíferos)','Veia porta hepática','Ductos biliares','B','Difícil'],
      ['Qual é o comprimento aproximado do intestino delgado no adulto vivo?','1 metro','3 a 4 metros','10 metros','15 metros','B','Média'],
      ['O que são as microvilosidades?','Dobras da mucosa visíveis a olho nu','Projeções da membrana das células absortivas, formando a borda em escova','Glândulas da submucosa','Nódulos linfáticos','B','Média'],
      ['Qual estrutura prende as alças do intestino delgado à parede posterior do abdome?','Omento maior','Mesentério','Ligamento falciforme','Peritônio parietal','B','Média'],
      ['A vitamina B12 é absorvida principalmente em qual porção?','Duodeno','Jejuno','Íleo terminal','Ceco','C','Difícil'],
      ['Qual estrutura separa o intestino delgado do intestino grosso?','Esfíncter pilórico','Válvula ileocecal','Esfíncter de Oddi','Ângulo de Treitz','B','Fácil'],
      ['Qual movimento do intestino delgado mistura o quimo sem empurrá-lo adiante?','Peristalse','Segmentação','Mastigação','Deglutição','B','Média'],
      ['As criptas de Lieberkühn se localizam onde?','Na submucosa do duodeno','Entre as bases das vilosidades','No interior das placas de Peyer','Na camada serosa','B','Difícil'],
      ['Qual enzima da borda em escova digere a lactose?','Maltase','Lactase','Sacarase','Peptidase','B','Fácil'],
      ['Como o jejuno se distingue do íleo à inspeção?','O jejuno tem parede mais espessa e mais pregas circulares','O íleo é mais avermelhado','O jejuno tem mais placas de Peyer','Não há como distinguir','A','Difícil'],
      ['Que vaso irriga a maior parte do intestino delgado?','Artéria mesentérica superior','Artéria mesentérica inferior','Tronco celíaco','Artéria ilíaca','A','Difícil'],
      ['Os produtos finais da digestão de proteínas absorvidos no delgado são quais?','Ácidos graxos','Aminoácidos e pequenos peptídeos','Monossacarídeos','Glicerol','B','Fácil'],
      ['A doença celíaca danifica principalmente qual estrutura?','As tênias do cólon','As vilosidades do intestino delgado','O esfíncter pilórico','As glândulas salivares','B','Média'],
      ['Que camada do intestino delgado contém o plexo de Meissner?','Mucosa','Submucosa','Muscular','Serosa','B','Difícil'],
    ],
    v: [
      ['As vilosidades intestinais aumentam a superfície de absorção do delgado.','V','Fácil'],
      ['O duodeno é a porção mais longa do intestino delgado.','F','Média'],
      ['A absorção de gorduras ocorre principalmente por via linfática.','V','Difícil'],
      ['O intestino delgado é mais calibroso que o intestino grosso.','F','Fácil'],
      ['O jejuno e o íleo são fixados pelo mesentério.','V','Média'],
    ],
    a: [
      ['Cite as três porções do intestino delgado, na ordem.','Fácil'],
      ['O que acontece com a gordura da dieta depois de emulsificada pela bile?','Difícil'],
      ['Explique como a estrutura do intestino delgado aumenta a superfície de absorção.','Média'],
    ],
  },

  'Intestino grosso': {
    m: [
      ['Qual é a ordem correta das porções do intestino grosso?','Ceco, cólon ascendente, transverso, descendente, sigmoide e reto','Ceco, sigmoide, transverso e reto','Cólon ascendente, ceco, descendente e reto','Reto, sigmoide, ceco e cólon','A','Fácil'],
      ['O apêndice vermiforme está fixado a qual estrutura?','Íleo','Ceco','Cólon sigmoide','Reto','B','Fácil'],
      ['As tênias do cólon são faixas de qual tecido?','Músculo estriado esquelético','Músculo liso longitudinal','Tecido conjuntivo denso','Epitélio glandular','B','Média'],
      ['Qual é a principal função do intestino grosso?','Absorção de proteínas','Absorção de água e eletrólitos e formação das fezes','Produção de bile','Digestão de gorduras','B','Fácil'],
      ['A válvula ileocecal separa quais estruturas?','Estômago e duodeno','Íleo e ceco','Cólon e reto','Duodeno e jejuno','B','Fácil'],
      ['O esfíncter anal interno é composto por qual tipo de músculo?','Estriado esquelético, sob controle voluntário','Liso, sob controle involuntário','Cardíaco','Apenas tecido elástico','B','Média'],
      ['Como se chamam as bolsas formadas pela contração das tênias no cólon?','Vilosidades','Haustros','Rugas','Pregas circulares','B','Média'],
      ['Que vitaminas são produzidas pela microbiota do intestino grosso?','Vitamina C e A','Vitamina K e algumas do complexo B','Vitamina D','Vitamina E','B','Média'],
      ['A linha pectínea do canal anal marca a transição entre quê?','Cólon e reto','Endoderma e ectoderma, com mudança de epitélio e de inervação','Ceco e apêndice','Sigmoide e reto','B','Difícil'],
      ['Qual é o comprimento aproximado do intestino grosso?','50 cm','1,5 metro','4 metros','7 metros','B','Média'],
      ['Os apêndices omentais (epiploicos) são projeções de quê?','Músculo liso','Tecido adiposo recoberto por peritônio','Tecido linfoide','Mucosa','B','Difícil'],
      ['Qual é a porção mais longa do intestino grosso?','Ceco','Cólon transverso','Cólon descendente','Reto','B','Média'],
      ['A flexura esplênica (cólica esquerda) fica entre quais porções?','Ceco e ascendente','Transverso e descendente','Descendente e sigmoide','Sigmoide e reto','B','Média'],
      ['A flexura hepática (cólica direita) fica entre quais porções?','Ascendente e transverso','Transverso e descendente','Íleo e ceco','Sigmoide e reto','A','Média'],
      ['Qual porção do intestino grosso é a mais dilatada?','Ceco','Cólon transverso','Cólon descendente','Sigmoide','A','Média'],
      ['Que tipo de célula é abundante no epitélio do cólon, produzindo muco?','Célula parietal','Célula caliciforme','Célula de Paneth','Enterócito com borda em escova','B','Média'],
      ['O intestino grosso possui vilosidades?','Sim, tantas quanto o delgado','Não: a mucosa dele é lisa, com criptas mas sem vilosidades','Sim, apenas no ceco','Sim, apenas no reto','B','Difícil'],
      ['Qual artéria irriga o cólon descendente e o sigmoide?','Mesentérica superior','Mesentérica inferior','Tronco celíaco','Artéria gástrica esquerda','B','Difícil'],
      ['Qual porção do intestino grosso é intraperitoneal e tem mesocólon próprio?','Cólon ascendente','Cólon transverso','Cólon descendente','Reto','B','Difícil'],
      ['A apendicite costuma causar dor em qual ponto do abdome?','Ponto de McBurney, na fossa ilíaca direita','Epigástrio','Hipocôndrio esquerdo','Região suprapúbica','A','Média'],
    ],
    v: [
      ['O apêndice vermiforme se prende ao cólon sigmoide.','F','Média'],
      ['O esfíncter anal externo está sob controle voluntário.','V','Média'],
      ['O intestino grosso absorve a maior parte dos nutrientes da dieta.','F','Fácil'],
      ['O intestino grosso é mais curto e mais calibroso que o delgado.','V','Fácil'],
      ['As tênias do cólon percorrem também o reto.','F','Difícil'],
      ['A maior parte da água que chega ao intestino grosso é reabsorvida.','V','Média'],
    ],
    a: [
      ['Cite as porções do intestino grosso, na ordem.','Fácil'],
      ['Explique o papel da microbiota intestinal na saúde do intestino grosso.','Média'],
      ['Cite três diferenças anatômicas entre o intestino delgado e o grosso.','Média'],
      ['O que acontece com o bolo fecal ao longo do cólon?','Fácil'],
    ],
  },

  'Geral': {
    m: [
      ['Quantas camadas (túnicas) compõem a parede do tubo digestório?','Duas','Três','Quatro','Cinco','C','Média'],
      ['Os plexos de Meissner e de Auerbach pertencem a qual sistema?','Sistema nervoso somático','Sistema nervoso entérico','Sistema límbico','Sistema linfático','B','Média'],
      ['Qual nervo craniano fornece a inervação parassimpática da maior parte do tubo digestório?','Trigêmeo','Facial','Vago','Acessório','C','Média'],
      ['O peritônio que liga a pequena curvatura do estômago ao fígado é chamado de quê?','Omento maior','Omento menor','Mesentério','Ligamento redondo do fígado','B','Média'],
      ['Qual destes órgãos do sistema digestório é retroperitoneal?','Estômago','Pâncreas','Cólon transverso','Baço','B','Média'],
      ['Qual é a ordem correta das túnicas, da luz do órgão para fora?','Mucosa, submucosa, muscular e serosa','Serosa, muscular, submucosa e mucosa','Muscular, mucosa, serosa e submucosa','Submucosa, mucosa, serosa e muscular','A','Média'],
      ['Como se chama o movimento que empurra o alimento ao longo de todo o tubo digestório?','Segmentação','Peristalse','Difusão','Emulsificação','B','Fácil'],
      ['Qual é a diferença entre digestão mecânica e química?','Não há diferença','A mecânica quebra fisicamente o alimento; a química usa enzimas','A química ocorre só na boca','A mecânica só ocorre no intestino','B','Fácil'],
      ['Quais são os órgãos anexos do sistema digestório?','Fígado, vesícula biliar, pâncreas e glândulas salivares','Estômago e intestinos','Faringe e esôfago','Baço e rins','A','Fácil'],
    ],
    v: [
      ['O plexo mioentérico de Auerbach fica entre as camadas musculares.','V','Difícil'],
      ['Todos os órgãos do sistema digestório são intraperitoneais.','F','Média'],
      ['O sistema nervoso entérico é capaz de funcionar com certa autonomia.','V','Média'],
    ],
    a: [
      ['Quais são as quatro túnicas da parede do tubo digestório?','Média'],
      ['Descreva o trajeto completo do alimento, da boca ao ânus, citando os órgãos.','Média'],
    ],
  },
};

const CABECALHO = ['Pergunta', 'Tipo', 'A', 'B', 'C', 'D', 'Correta', 'Categoria', 'Dificuldade'];

const linhas = [];
const resumo = [];

for (const [categoria, banco] of Object.entries(BANCO)) {
  const m = banco.m || [], v = banco.v || [], a = banco.a || [];

  for (const [q, A, B, C, D, ok, dif] of m) {
    linhas.push([q, 'Múltipla', A, B, C, D, ok, categoria, dif]);
  }
  for (const [q, ok, dif] of v) {
    linhas.push([q, 'V/F', '', '', '', '', ok, categoria, dif]);
  }
  for (const [q, dif] of a) {
    linhas.push([q, 'Aberta', '', '', '', '', '', categoria, dif]);
  }

  resumo.push({ categoria, m: m.length, v: v.length, a: a.length, total: m.length + v.length + a.length });
}

const aba = XLSX.utils.aoa_to_sheet([CABECALHO, ...linhas]);
aba['!cols'] = [{ wch: 78 }, { wch: 10 }, { wch: 34 }, { wch: 34 }, { wch: 34 },
                { wch: 34 }, { wch: 8 }, { wch: 24 }, { wch: 12 }];
aba['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: linhas.length, c: 8 } }) };

const livro = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(livro, aba, 'Perguntas');

const destino = path.join(process.argv[2] || '.', 'Perguntas-modelo.xlsx');
XLSX.writeFile(livro, destino);

console.log(`${linhas.length} perguntas em ${destino}`);
console.log('');
console.log('  categoria                múltipla   V/F  aberta   total');
for (const r of resumo) {
  console.log(`  ${r.categoria.padEnd(24)}${String(r.m).padStart(8)}`
              + `${String(r.v).padStart(6)}${String(r.a).padStart(8)}`
              + `${String(r.total).padStart(8)}`);
}
const tipos = linhas.reduce((c, l) => { c[l[1]] = (c[l[1]] || 0) + 1; return c; }, {});
console.log('');
console.log(`  total: ${Object.entries(tipos).map(([k, v]) => `${v} ${k}`).join(' · ')}`);
