
const XLSX = require('xlsx');
const path = require('path');

const BANCO = {

  'Boca': {
    m: [
      ['Qual o nome da depressão mediana que vai do subsepto nasal ao lábio superior?','Filtro','Rima labial','Sulco mentolabial','Tubérculo labial','A','Fácil'],
      ['Qual sulco está localizado entre as bochechas e os lábios?','Sulco nasolabial','Sulco mentolabial','Sulco labiogeniano','Sulco terminal','C','Média'],
      ['Qual espaço comunica o vestíbulo oral com a cavidade oral propriamente dita quando a boca está fechada?','Istmo das fauces','Espaço retromolar','Fossa tonsilar','Sulco gengivolabial','B','Média'],
      ['Qual músculo faz parte da estrutura dos lábios?','Bucinador','Masseter','Orbicular da boca','Milo-hióideo','C','Fácil'],
      ['Qual sulco está localizado entre o lábio inferior e o mento?','Sulco mentolabial','Sulco nasolabial','Sulco labiogeniano','Sulco terminal','A','Fácil'],
      ['Qual sulco parte do nariz em direção aos lábios?','Sulco mentolabial','Sulco labiogeniano','Sulco nasolabial','Sulco gengivolabial','C','Fácil'],
      ['Como se chamam os encontros laterais dos lábios quando eles estão fechados?','Ângulo labial','Comissuras labiais','Rima labial','Filtro','B','Média'],
      ['Qual linha é originada pelo encontro dos lábios superior e inferior?','Rima labial','Comissura labial','Filtro','Sulco labiogeniano','A','Fácil'],
      ['Em qual estrutura desemboca o ducto parotídeo?','Carúncula sublingual','Prega sublingual','Papila parotídea','Papila duodenal menor','C','Média'],
      ['Qual é o limite anterolateral do vestíbulo oral?','Lábios e bochechas','Arcadas dentárias','Palato duro e palato mole','Istmo das fauces','A','Média'],
    ],
    v: [
      ['O ângulo labial corresponde ao encontro lateral dos lábios quando eles estão abertos.','V','Média'],
    ],
  },

  'Cavidade oral': {
    m: [
      ['A língua apresenta duas faces. Quais são elas e para onde estão voltadas?','Dorsal, voltada para cima, e ventral, voltada para baixo','Superior e inferior, ambas voltadas para a faringe','Anterior, voltada para os dentes, e posterior, voltada para o palato','Medial e lateral, voltadas para as bochechas','A','Fácil'],
      ['A organização das papilas valadas (circunvaladas) forma qual estrutura?','Sulco mediano da língua','"V" lingual','Frênulo lingual','Tórus tubário','B','Média'],
      ['O que forma o teto da cavidade oral propriamente dita?','Palato duro e palato mole','Assoalho da boca e língua','Arcos palatoglosso e palatofaríngeo','Processo alveolar da mandíbula','A','Fácil'],
      ['Qual sulco separa a raiz da língua do corpo da língua?','Sulco mediano','Sulco terminal','Sulco nasolabial','Sulco labiogeniano','B','Média'],
      ['Quais estruturas ósseas formam o palato duro?','Processo palatino da maxila e lâmina horizontal do osso palatino','Lâmina perpendicular do osso palatino e vômer','Processo alveolar da maxila e corpo da mandíbula','Asa maior do esfenoide e osso zigomático','A','Difícil'],
      ['Qual prega mediana se fixa na face ventral da língua?','Prega sublingual','Frênulo lingual','Prega salpingopalatina','Prega ileocecal','B','Fácil'],
      ['Onde desembocam os ductos das glândulas sublinguais?','Carúnculas sublinguais','Pregas sublinguais','Papila parotídea','Espaço retromolar','B','Difícil'],
      ['Quais são as glândulas salivares maiores?','Parótida, sublingual e submandibular','Parótida, lingual e palatina','Sublingual, labial e bucal','Submandibular, tireóidea e parótida','A','Fácil'],
      ['Onde desemboca o ducto da glândula submandibular?','Pregas sublinguais','Papila parotídea','Carúnculas sublinguais','Fossa tonsilar','C','Difícil'],
      ['Quais estruturas formam o V lingual?','Papilas filiformes','Papilas circunvaladas (valadas)','Papilas folhadas','Tonsilas linguais','B','Média'],
    ],
    v: [
      ['As papilas folhadas estão localizadas nas margens laterais da língua.','V','Média'],
    ],
  },

  'Faringe': {
    m: [
      ['Qual a delimitação da porção nasal da faringe?','Vai das coanas à úvula','Vai da úvula à epiglote','Vai da epiglote à cartilagem cricóidea','Vai do istmo das fauces ao esôfago','A','Média'],
      ['Que estrutura é encontrada superiormente ao óstio faríngeo da tuba auditiva?','Tórus tubário','Tonsila palatina','Úvula','Epiglote','A','Difícil'],
      ['Qual estrutura comunica a cavidade oral com a porção oral da faringe?','Óstio faríngeo da tuba auditiva','Istmo das fauces','Coanas','Espaço retromolar','B','Média'],
      ['Que abertura, na porção nasal da faringe, comunica essa porção com a orelha média?','Coana','Óstio faríngeo da tuba auditiva','Fossa tonsilar','Ádito da laringe','B','Média'],
      ['Qual a delimitação da porção laríngea da faringe?','Vai das coanas à úvula','Vai da úvula à margem superior da epiglote','Vai da epiglote à margem inferior da cartilagem cricóidea','Vai da cartilagem cricóidea à bifurcação da traqueia','C','Difícil'],
      ['Quais arcos constituem o istmo das fauces?','Arco palatoglosso e arco palatofaríngeo','Arco zigomático e arco alveolar','Arco anterior e arco posterior do atlas','Arco superciliar e arco palatino','A','Média'],
      ['Quais são as três porções da faringe?','Nasal, oral e laríngea','Superior, média e inferior','Cervical, torácica e abdominal','Anterior, média e posterior','A','Fácil'],
      ['Qual a delimitação da porção oral da faringe?','Vai das coanas à úvula','Vai da úvula à margem superior da epiglote','Vai da epiglote à cartilagem cricóidea','Vai do istmo das fauces às coanas','B','Média'],
      ['Quais pregas são encontradas anterior e posteriormente ao óstio faríngeo da tuba auditiva?','Pregas sublinguais e vestibulares','Prega salpingopalatina e prega salpingofaríngea','Prega palatoglossa e prega palatofaríngea','Prega ileocólica e prega ileocecal','B','Difícil'],
    ],
    v: [
      ['A tonsila palatina está localizada na fossa tonsilar, entre os arcos palatoglosso e palatofaríngeo.','V','Fácil'],
    ],
  },

  'Esôfago': {
    m: [
      ['Qual movimento é realizado pelo esôfago para conduzir o bolo alimentar?','Movimento de segmentação','Movimento peristáltico','Movimento pendular','Movimento de massa','B','Fácil'],
      ['Com qual estrutura o esôfago se relaciona anteriormente em sua porção torácica?','Traqueia','Aorta descendente','Coluna vertebral','Diafragma','A','Média'],
      ['Qual a orientação das fibras da camada muscular do esôfago?','Circulares externas e longitudinais internas','Longitudinais externas e circulares internas','Apenas longitudinais','Apenas circulares','B','Difícil'],
      ['Qual constrição do esôfago decorre da sua relação com o brônquio principal esquerdo e a artéria aorta?','Constrição cervical','Constrição broncoaórtica','Constrição diafragmática','Constrição cricofaríngea','B','Difícil'],
      ['A constrição diafragmática do esôfago decorre da sua relação com qual estrutura?','Coração','Diafragma','Artéria aorta','Traqueia','B','Fácil'],
      ['Qual o nome da abertura deixada no diafragma pela passagem do esôfago?','Hiato aórtico','Forame da veia cava','Hiato esofágico','Anel inguinal','C','Fácil'],
      ['Qual a primeira porção do esôfago?','Porção cervical','Porção torácica','Porção abdominal','Porção laríngea','A','Fácil'],
      ['A partir de qual estrutura podemos determinar o início do esôfago?','Cartilagem tireóidea','Cartilagem cricóidea, na altura de C6','Epiglote','Osso hioide','B','Média'],
    ],
    v: [
      ['A porção abdominal é a menor das três porções do esôfago.','V','Média'],
    ],
  },

  'Estômago': {
    m: [
      ['Quais faces constituem o estômago?','Parede anterior e parede posterior','Face visceral e face diafragmática','Face superior e face inferior','Face medial e face lateral','A','Fácil'],
      ['Quais óstios encontramos no estômago?','Óstio cárdico e óstio pilórico','Óstio ileal e óstio apendicular','Óstio faríngeo e óstio esofágico','Óstio duodenal e óstio jejunal','A','Fácil'],
      ['Que nome se dá às margens do estômago?','Curvatura maior e curvatura menor','Margem direita e margem esquerda','Tênia livre e tênia omental','Borda anterior e borda posterior','A','Fácil'],
      ['Como é dividido o estômago?','Cabeça, corpo e cauda','Fundo, corpo e região pilórica','Fundo, colo e ápice','Superior, descendente e horizontal','B','Fácil'],
      ['Quais túnicas constituem a parede do estômago?','Mucosa, submucosa, muscular e serosa','Mucosa, muscular e adventícia','Serosa, adventícia e mucosa','Epitelial, conjuntiva e adiposa','A','Média'],
      ['Quais incisuras são importantes para a divisão do estômago?','Incisura cárdica e incisura angular','Incisura isquiática e incisura angular','Incisura cárdica e incisura pilórica','Incisura jugular e incisura cárdica','A','Difícil'],
      ['Qual esfíncter é considerado verdadeiro (anatômico) no estômago?','Esfíncter cárdico','Esfíncter pilórico','Esfíncter esofágico superior','Esfíncter ileocecal','B','Média'],
      ['Em que é dividida a região pilórica do estômago?','Antro pilórico, canal pilórico e piloro','Fundo, corpo e colo','Cárdia, fundo e antro','Cabeça, colo e cauda','A','Difícil'],
      ['Quais pregas são encontradas no interior do estômago e de qual túnica fazem parte?','Pregas circulares, da túnica muscular','Pregas gástricas, da túnica mucosa','Pregas semilunares, da túnica serosa','Pregas sublinguais, da túnica submucosa','B','Média'],
      ['Qual percurso faz o omento maior a partir da curvatura maior do estômago?','Desce em direção ao intestino e se curva posteriormente, fixando-se no cólon transverso','Sobe em direção ao diafragma e se fixa no fígado','Segue diretamente para o baço, sem contato com o intestino','Envolve o duodeno e se fixa no pâncreas','A','Difícil'],
      ['Que estrutura parte da curvatura menor do estômago em direção ao fígado?','Omento maior','Omento menor','Mesentério','Ligamento falciforme','B','Média'],
    ],
    v: [
      ['O esfíncter cárdico é um esfíncter fisiológico, e não anatômico.','V','Média'],
      ['As pregas gástricas aumentam a capacidade de distensão do estômago.','V','Média'],
    ],
  },

  'Fígado e vias biliares': {
    m: [
      ['O ducto colédoco resulta da união de quais ductos?','Ducto hepático direito e ducto hepático esquerdo','Ducto hepático comum e ducto cístico','Ducto pancreático principal e ducto pancreático acessório','Ducto cístico e ducto pancreático principal','B','Média'],
      ['Quais lobos estão presentes no fígado?','Direito, esquerdo, quadrado e caudado','Direito, esquerdo e médio','Superior, inferior e medial','Anterior, posterior e lateral','A','Fácil'],
      ['Em quais das nove regiões do abdome o fígado se encontra?','Hipocôndrio direito, epigástrio e hipocôndrio esquerdo','Flanco direito, mesogástrio e flanco esquerdo','Fossa ilíaca direita, hipogástrio e fossa ilíaca esquerda','Apenas no hipocôndrio direito','A','Média'],
      ['Quais ligamentos são contínuos ao ligamento coronário lateralmente?','Ligamentos triangulares','Ligamento falciforme','Ligamento redondo','Ligamento venoso','A','Difícil'],
      ['Qual estrutura é originada pela união do ducto pancreático principal com o ducto colédoco?','Papila duodenal maior','Ampola hepatopancreática','Ducto hepático comum','Ducto cístico','B','Média'],
      ['Que estrutura hepática é originada a partir do resquício embrionário do ducto venoso?','Ligamento redondo do fígado','Ligamento venoso','Ligamento falciforme','Ligamento coronário','B','Difícil'],
      ['Qual ligamento está presente entre os lobos direito e esquerdo do fígado?','Ligamento falciforme','Ligamento triangular direito','Ligamento venoso','Ligamento hepatoduodenal','A','Média'],
      ['Qual a divisão da vesícula biliar?','Cabeça, corpo e cauda','Fundo, corpo e colo','Fundo, corpo e região pilórica','Colo, istmo e ampola','B','Fácil'],
      ['Que estruturas formam a tríade hepática (portal)?','Veia porta, artéria hepática e ductos biliares','Veia cava, aorta e ducto torácico','Artéria esplênica, veia esplênica e ducto pancreático','Veia porta, veia cava e ducto colédoco','A','Média'],
      ['Qual estrutura hepática é originada a partir do resquício embrionário da veia umbilical?','Ligamento venoso','Ligamento redondo do fígado','Ligamento coronário','Ligamento triangular esquerdo','B','Difícil'],
      ['Onde está localizada a vesícula biliar?','Na fossa da vesícula biliar, entre os lobos direito e quadrado','Na porta do fígado, entre os lobos caudado e esquerdo','Na área nua, junto ao diafragma','No interior do ligamento falciforme','A','Média'],
      ['Quais ductos recolhem a bile proveniente dos lobos hepáticos?','Ducto cístico e ducto colédoco','Ducto hepático direito e ducto hepático esquerdo','Ducto pancreático principal e ducto pancreático acessório','Ductos biliares e ampola hepatopancreática','B','Média'],
    ],
    v: [
      ['A área nua é a região do fígado que não é revestida pelo peritônio.','V','Média'],
      ['A bile é produzida pelos hepatócitos.','V','Fácil'],
      ['O ligamento venoso é visualizado na face visceral do fígado.','V','Difícil'],
    ],
  },

  'Duodeno': {
    m: [
      ['Qual estrutura delimita a porção descendente da porção horizontal do duodeno?','Flexura duodenal superior','Flexura duodenal inferior','Flexura duodenojejunal','Flexura cólica direita','B','Difícil'],
      ['Qual estrutura é uma variação anatômica encontrada na porção descendente do duodeno?','Papila duodenal maior','Papila duodenal menor','Ampola hepatopancreática','Flexura duodenal superior','B','Difícil'],
      ['Quais são as porções do duodeno?','Superior, descendente, horizontal e ascendente','Cervical, torácica e abdominal','Fundo, corpo e região pilórica','Cabeça, corpo e cauda','A','Média'],
      ['Onde desemboca a ampola hepatopancreática?','Papila duodenal menor','Papila duodenal maior','Flexura duodenojejunal','Óstio pilórico','B','Média'],
      ['Qual estrutura delimita a porção superior da porção descendente do duodeno?','Flexura duodenal superior','Flexura duodenal inferior','Piloro','Flexura duodenojejunal','A','Difícil'],
      ['Qual estrutura determina o final do duodeno e o início do jejuno?','Flexura duodenal inferior','Flexura duodenojejunal','Óstio ileal','Papila duodenal maior','B','Média'],
      ['Quais pregas são encontradas no interior do duodeno?','Pregas gástricas','Pregas circulares','Pregas semilunares','Pregas sublinguais','B','Média'],
      ['Em que porção do duodeno desemboca a ampola hepatopancreática?','Porção superior','Porção descendente','Porção horizontal','Porção ascendente','B','Média'],
      ['O que delimita a porção horizontal da porção ascendente do duodeno?','O cruzamento com os vasos mesentéricos','A flexura duodenal superior','O piloro','A papila duodenal menor','A','Difícil'],
    ],
    v: [
      ['Bile e suco pancreático chegam à porção descendente do duodeno.','V','Fácil'],
    ],
  },

  'Pâncreas': {
    m: [
      ['Com qual estrutura se relaciona a cabeça do pâncreas?','Com a porção descendente do duodeno','Com o fundo do estômago','Com o cólon sigmoide','Com o lobo caudado do fígado','A','Média'],
      ['Qual estrutura encontramos entre a cabeça e o corpo do pâncreas?','Colo do pâncreas','Cauda do pâncreas','Processo uncinado','Ampola hepatopancreática','A','Média'],
      ['Qual a função exócrina do pâncreas?','Produção de insulina e glucagon','Produção do suco pancreático','Produção da bile','Armazenamento de glicogênio','B','Fácil'],
      ['Quais ductos podemos encontrar no pâncreas?','Ducto hepático comum e ducto cístico','Ducto pancreático principal e ducto pancreático acessório','Ducto colédoco e ducto cístico','Ducto torácico e ducto linfático direito','B','Média'],
      ['Qual a divisão do pâncreas?','Fundo, corpo e colo','Cabeça, corpo e cauda','Superior, descendente e horizontal','Direito, esquerdo e médio','B','Fácil'],
      ['Que estruturas pancreáticas formam a porção endócrina do pâncreas?','Ácinos pancreáticos','Ilhotas pancreáticas','Ductos pancreáticos','Hepatócitos','B','Média'],
      ['Onde desemboca o ducto pancreático acessório?','Papila duodenal maior','Papila duodenal menor','Ampola hepatopancreática','Flexura duodenojejunal','B','Difícil'],
      ['Que estrutura emoldura a cabeça do pâncreas?','O estômago','O duodeno','O baço','O fígado','B','Média'],
    ],
    v: [
      ['Com relação ao peritônio, o pâncreas está situado no espaço retroperitoneal.','V','Média'],
    ],
  },

  'Intestino delgado': {
    m: [
      ['Qual a segunda porção do intestino delgado?','Duodeno','Jejuno','Íleo','Ceco','B','Fácil'],
      ['Onde desemboca o íleo?','No óstio pilórico','No óstio ileal','No óstio do apêndice vermiforme','Na flexura duodenojejunal','B','Média'],
      ['Qual estrutura indica o início do jejuno?','Flexura duodenojejunal','Flexura duodenal inferior','Óstio ileal','Papila duodenal maior','A','Média'],
      ['Qual a última porção do intestino delgado?','Jejuno','Íleo','Duodeno','Ceco','B','Fácil'],
      ['Qual a diferença de espessura entre o jejuno e o íleo?','O jejuno é mais espesso que o íleo','O íleo é mais espesso que o jejuno','Os dois têm a mesma espessura','A espessura varia conforme a refeição','A','Média'],
      ['Qual parte do peritônio é responsável por unir o intestino delgado à parede abdominal?','Omento maior','Omento menor','Mesentério','Mesocólon transverso','C','Média'],
    ],
    v: [
      ['O jejuno apresenta mais pregas circulares em seu interior do que o íleo.','V','Média'],
    ],
  },

  'Intestino grosso': {
    m: [
      ['Quais são as três tênias encontradas nos cólons?','Tênia mesocólica, tênia livre e tênia omental','Tênia superior, tênia média e tênia inferior','Tênia ascendente, tênia transversa e tênia descendente','Tênia longitudinal, tênia circular e tênia oblíqua','A','Difícil'],
      ['Qual abertura é encontrada no ceco, proveniente do apêndice vermiforme?','Óstio ileal','Óstio do apêndice vermiforme','Óstio pilórico','Óstio cárdico','B','Média'],
      ['Quais cólons estão presentes no intestino grosso?','Ascendente, transverso, descendente e sigmoide','Superior, médio e inferior','Direito, esquerdo e médio','Cervical, torácico e abdominal','A','Fácil'],
      ['Quais pregas constituem a válvula ileocecal?','Prega ileocólica e prega ileocecal','Pregas semilunares','Pregas circulares','Prega salpingofaríngea e prega salpingopalatina','A','Difícil'],
      ['Qual o nome das dilatações presentes no intestino grosso?','Haustros (saculações)','Vilosidades','Apêndices omentais','Tênias','A','Média'],
      ['Qual o limite entre o ceco e o cólon ascendente?','A linha tangente ao óstio ileal','A flexura cólica direita','O óstio do apêndice vermiforme','A prega ileocecal','A','Difícil'],
      ['Como denominamos as pequenas bolsas de gordura encontradas nos cólons?','Haustros','Tênias','Apêndices omentais','Vilosidades','C','Média'],
      ['Quais flexuras estão presentes nos cólons?','Flexura cólica direita e flexura cólica esquerda','Flexura sacral e flexura anorretal','Flexura duodenojejunal e flexura duodenal inferior','Flexura superior e flexura inferior','A','Média'],
      ['Que estruturas encontramos entre as colunas anais?','Válvulas anais','Seios anais','Haustros','Apêndices omentais','B','Difícil'],
      ['Quais flexuras são encontradas no reto em um corte sagital mediano?','Flexura sacral e flexura anorretal','Flexura cólica direita e flexura cólica esquerda','Flexura superolateral e flexura ínferolateral','Apenas a flexura duodenojejunal','A','Difícil'],
      ['Qual o nome da estrutura encontrada na porção final dos seios anais?','Colunas anais','Válvulas anais','Tênias','Haustros','B','Difícil'],
      ['Quais flexuras são encontradas no reto em um corte coronal?','Flexura sacral e flexura anorretal','Flexura superolateral direita, flexura ínferolateral direita e flexura intermédio-lateral esquerda','Flexura cólica direita e flexura cólica esquerda','Apenas a flexura anorretal','B','Difícil'],
    ],
    v: [
      ['O ceco é a primeira porção do intestino grosso.','V','Fácil'],
      ['O controle da eliminação fecal depende do esfíncter externo e do esfíncter interno do ânus.','V','Fácil'],
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
      ['Qual é a sequência correta dos órgãos do tubo digestório, da boca ao ânus?','Boca, faringe, esôfago, estômago, intestino delgado e intestino grosso','Boca, esôfago, faringe, estômago, intestino grosso e intestino delgado','Boca, faringe, estômago, esôfago, intestino delgado e intestino grosso','Boca, esôfago, estômago, faringe, intestino grosso e intestino delgado','A','Fácil'],
      ['Qual membrana serosa reveste a cavidade abdominal e as vísceras nela contidas?','Pleura','Pericárdio','Peritônio','Dura-máter','C','Fácil'],
      ['Qual artéria emite o tronco celíaco e as artérias mesentéricas, irrigando o tubo digestório abdominal?','Aorta abdominal','Veia porta hepática','Artéria ilíaca comum','Artéria renal','A','Média'],
      ['Para onde vai o sangue rico em nutrientes drenado do intestino antes de alcançar a circulação sistêmica?','Direto para o coração','Para o fígado, pela veia porta hepática','Para os rins, pela veia renal','Para o baço, pela veia esplênica','B','Média'],
      ['Qual músculo separa a cavidade torácica da cavidade abdominal e é atravessado pelo esôfago?','Transverso do abdome','Diafragma','Psoas maior','Oblíquo interno','B','Fácil'],
      ['Qual destas estruturas NÃO faz parte do tubo digestório propriamente dito?','Faringe','Esôfago','Pâncreas','Ceco','C','Média'],
      ['O tronco celíaco irriga principalmente quais órgãos?','Estômago, fígado e baço','Cólon descendente e reto','Rins e glândulas suprarrenais','Apenas o jejuno e o íleo','A','Difícil'],
      ['Qual túnica do tubo digestório abriga os vasos sanguíneos maiores e o plexo submucoso?','Mucosa','Submucosa','Muscular','Serosa','B','Média'],
      ['A artéria mesentérica superior irriga principalmente qual segmento?','Estômago e esôfago','Intestino delgado e a parte inicial do intestino grosso','Reto e canal anal','Fígado e vesícula biliar','B','Difícil'],
      ['Qual é a função principal do intestino delgado?','Absorção dos nutrientes','Armazenamento das fezes','Produção da bile','Trituração mecânica do alimento','A','Fácil'],
      ['Como se chamam as duas lâminas do peritônio, conforme revistam a parede abdominal ou os órgãos?','Peritônio parietal e peritônio visceral','Peritônio superior e peritônio inferior','Peritônio seroso e peritônio mucoso','Peritônio interno e peritônio externo','A','Média'],
    ],
    v: [
      ['O plexo mioentérico de Auerbach fica entre as camadas musculares.','V','Difícil'],
      ['Todos os órgãos do sistema digestório são intraperitoneais.','F','Média'],
      ['O sistema nervoso entérico é capaz de funcionar com certa autonomia.','V','Média'],
      ['O esôfago percorre as regiões cervical, torácica e abdominal.','V','Média'],
      ['O peritônio visceral é a lâmina que reveste a parede interna da cavidade abdominal.','F','Média'],
      ['A digestão química dos alimentos se completa no intestino delgado.','V','Média'],
      ['A veia porta hepática leva sangue do fígado para o coração.','F','Média'],
    ],
    a: [
      ['Quais são as quatro túnicas da parede do tubo digestório?','Média'],
      ['Descreva o trajeto completo do alimento, da boca ao ânus, citando os órgãos.','Média'],
      ['Cite as glândulas anexas do sistema digestório e diga o que cada uma produz.','Média'],
      ['Explique a diferença entre peritônio parietal e peritônio visceral.','Média'],
      ['Explique o que é o mesentério e qual é a sua função.','Média'],
      ['Diga o que são órgãos intraperitoneais e retroperitoneais, dando um exemplo de cada.','Difícil'],
      ['Explique o papel do fígado na digestão das gorduras.','Média'],
      ['Cite esfíncteres do tubo digestório e diga onde cada um está localizado.','Difícil'],
      ['Explique por que o alimento não entra nas vias respiratórias durante a deglutição.','Média'],
      ['Descreva o caminho de uma refeição rica em gordura, do estômago até a absorção.','Difícil'],
      ['Explique a diferença entre a porção exócrina e a porção endócrina do pâncreas.','Média'],
      ['Diga qual é a função do intestino grosso e o que acontece ali com a água e as fibras.','Fácil'],
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
