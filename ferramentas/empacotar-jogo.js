'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const RAIZ = path.join(__dirname, '..');
const SAIDA = path.join(RAIZ, 'anatomia-interativa.zip');
const PASTA_NO_ZIP = 'anatomia-interativa';

const INCLUIR = [
  'public',
  'src',
  'server.js',
  'package-lock.json',
  'INICIAR.bat',
  'Perguntas-modelo.xlsx',
];

const SCRIPTS_DO_PACOTE = { start: 'node server.js' };

const TABELA_CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) c = (c >>> 8) ^ TABELA_CRC[(c ^ buf[i]) & 0xff];
  return (c ^ -1) >>> 0;
}

function dataDOS(d) {
  const hora = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() / 2)) & 0xffff;
  const dia = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xffff;
  return { hora, dia };
}

function listar(alvo, prefixo) {
  const cheio = path.join(RAIZ, alvo);
  if (!fs.existsSync(cheio)) return [];
  if (fs.statSync(cheio).isFile()) {
    return [{ nome: prefixo + '/' + alvo.replace(/\\/g, '/'), caminho: cheio }];
  }
  const saida = [];
  (function anda(dir, rel) {
    for (const item of fs.readdirSync(dir).sort()) {
      const p = path.join(dir, item);
      const r = rel + '/' + item;
      if (fs.statSync(p).isDirectory()) anda(p, r);
      else saida.push({ nome: prefixo + r, caminho: p });
    }
  })(cheio, '/' + alvo.replace(/\\/g, '/'));
  return saida;
}

function packageJsonDoPacote() {
  const p = JSON.parse(fs.readFileSync(path.join(RAIZ, 'package.json'), 'utf8'));
  return Buffer.from(JSON.stringify({
    name: p.name,
    version: p.version,
    private: p.private,
    description: p.description,
    main: p.main,
    scripts: SCRIPTS_DO_PACOTE,
    dependencies: p.dependencies,
  }, null, 2) + '\n', 'utf8');
}

function principal() {
  const arquivos = [];
  for (const alvo of INCLUIR) arquivos.push(...listar(alvo, PASTA_NO_ZIP));
  arquivos.push({ nome: PASTA_NO_ZIP + '/package.json', conteudo: packageJsonDoPacote() });

  if (!arquivos.length) {
    console.error('Nao achei nada para empacotar. Rode a partir da raiz do projeto.');
    process.exit(1);
  }

  const agora = dataDOS(new Date());
  const locais = [];
  const central = [];
  let deslocamento = 0;
  let cruas = 0;

  for (const a of arquivos) {
    const dados = a.conteudo || fs.readFileSync(a.caminho);
    const comprimido = zlib.deflateRawSync(dados, { level: 9 });
    const nome = Buffer.from(a.nome, 'utf8');
    const soma = crc32(dados);
    cruas += dados.length;

    const cabecalho = Buffer.alloc(30);
    cabecalho.writeUInt32LE(0x04034b50, 0);
    cabecalho.writeUInt16LE(20, 4);
    cabecalho.writeUInt16LE(0x0800, 6);
    cabecalho.writeUInt16LE(8, 8);
    cabecalho.writeUInt16LE(agora.hora, 10);
    cabecalho.writeUInt16LE(agora.dia, 12);
    cabecalho.writeUInt32LE(soma, 14);
    cabecalho.writeUInt32LE(comprimido.length, 18);
    cabecalho.writeUInt32LE(dados.length, 22);
    cabecalho.writeUInt16LE(nome.length, 26);
    cabecalho.writeUInt16LE(0, 28);
    locais.push(cabecalho, nome, comprimido);

    const dir = Buffer.alloc(46);
    dir.writeUInt32LE(0x02014b50, 0);
    dir.writeUInt16LE(20, 4);
    dir.writeUInt16LE(20, 6);
    dir.writeUInt16LE(0x0800, 8);
    dir.writeUInt16LE(8, 10);
    dir.writeUInt16LE(agora.hora, 12);
    dir.writeUInt16LE(agora.dia, 14);
    dir.writeUInt32LE(soma, 16);
    dir.writeUInt32LE(comprimido.length, 20);
    dir.writeUInt32LE(dados.length, 24);
    dir.writeUInt16LE(nome.length, 28);
    dir.writeUInt32LE(0, 30);
    dir.writeUInt32LE(0, 34);
    dir.writeUInt32LE(deslocamento, 42);
    central.push(dir, nome);

    deslocamento += cabecalho.length + nome.length + comprimido.length;
  }

  const corpoCentral = Buffer.concat(central);
  const fim = Buffer.alloc(22);
  fim.writeUInt32LE(0x06054b50, 0);
  fim.writeUInt16LE(arquivos.length, 8);
  fim.writeUInt16LE(arquivos.length, 10);
  fim.writeUInt32LE(corpoCentral.length, 12);
  fim.writeUInt32LE(deslocamento, 16);

  const zip = Buffer.concat([...locais, corpoCentral, fim]);
  fs.mkdirSync(path.dirname(SAIDA), { recursive: true });
  fs.writeFileSync(SAIDA, zip);

  const mb = (n) => (n / 1048576).toFixed(2) + ' MB';
  console.log(arquivos.length + ' arquivos empacotados');
  console.log('  cru:        ' + mb(cruas));
  console.log('  compactado: ' + mb(zip.length));
  console.log('  em:         anatomia-interativa.zip, na pasta do projeto');
}

principal();
