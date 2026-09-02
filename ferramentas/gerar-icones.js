
const fs = require('fs');
const path = require('path');
const { recortarFolha } = require('./recortar-icones');

const RAIZ = path.join(__dirname, '..');
const DESTINO = path.join(RAIZ, 'public', 'assets', 'icons');
const LADO = 160;

const FOLHAS = [
  {
    arquivo: 'origem/icones/1.svg',
    prefixo: 'prato',
    nomes: [
      'Maçã', 'Pizza', 'Croissant', 'Panquecas', 'Sushi',
      'Hambúrguer', 'Abacate', 'Café', 'Rosquinha', 'Lámen',
      'Cachorro-quente', 'Taco', 'Tigela de granola', 'Misto quente', 'Drink',
      'Banana', 'Uvas', 'Morango', 'Abacaxi', 'Melancia',
      'Cerejas', 'Mirtilos', 'Salada de frutas', 'Espetinho de frutas',
    ],
    usar: [
      'Maçã', 'Pizza', 'Croissant', 'Panquecas', 'Sushi',
      'Hambúrguer', 'Café', 'Rosquinha', 'Lámen', 'Cachorro-quente',
      'Misto quente', 'Banana', 'Morango', 'Abacaxi', 'Melancia',
      'Cerejas', 'Mirtilos', 'Espetinho de frutas',
    ],
  },
  {
    arquivo: 'origem/icones/15.svg',
    prefixo: 'carne',
    nomes: [
      'Bife', 'Filé grelhado', 'Carne moída', 'Carne em cubos', 'Costela',
      'Pernil', 'Costelinha', 'Panceta', 'Presunto', 'Lombo fatiado',
      'Frango assado', 'Peito de frango', 'Frango empanado', 'Coxa de frango',
      'Lombo', 'Linguiça', 'Bacon (fatia)', 'Bacon', 'Salame',
      'Salame curado', 'Salsicha branca', 'Toucinho', 'Carne desfiada', 'Linguiça em anel',
    ],
    usar: ['Bife', 'Costelinha', 'Frango assado', 'Bacon'],
  },
];

const apelido = (s) => s
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function principal() {
  if (fs.existsSync(DESTINO)) {
    for (const f of fs.readdirSync(DESTINO)) {
      if (/\.(png|svg)$/.test(f)) fs.unlinkSync(path.join(DESTINO, f));
    }
  }

  const galeria = [];

  for (const folha of FOLHAS) {
    const itens = recortarFolha(path.join(RAIZ, folha.arquivo), DESTINO, folha.prefixo, LADO);

    if (itens.length !== folha.nomes.length) {
      throw new Error(
        `${folha.arquivo}: recortei ${itens.length} ícones, mas tenho ${folha.nomes.length} nomes. `
        + 'A folha mudou. Confira a lista de nomes antes de seguir.'
      );
    }

    const desconhecidos = folha.usar.filter((n) => !folha.nomes.includes(n));
    if (desconhecidos.length) {
      throw new Error(`${folha.arquivo}: "${desconhecidos.join('", "')}" não está na lista de nomes desta folha.`);
    }

    itens.forEach((arquivoBruto, i) => {
      const nome = folha.nomes[i];
      const bruto = path.join(DESTINO, arquivoBruto);
      if (!folha.usar.includes(nome)) { fs.unlinkSync(bruto); return; }

      const id = apelido(nome);
      const arquivo = `${id}.png`;
      fs.renameSync(bruto, path.join(DESTINO, arquivo));
      galeria.push({ id, nome, arquivo });
    });

    console.log(`${folha.arquivo}: ${itens.length} recortados, ${folha.usar.length} na galeria`);
  }

  fs.writeFileSync(path.join(DESTINO, 'icones.json'), JSON.stringify(galeria, null, 2));

  const total = fs.readdirSync(DESTINO)
    .reduce((a, f) => a + fs.statSync(path.join(DESTINO, f)).size, 0);
  console.log(`\n${galeria.length} ícones na galeria · ${(total / 1024).toFixed(0)} KB no total`);
}

if (require.main === module) principal();
