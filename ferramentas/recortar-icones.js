
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function decodificarPNG(buffer) {
  if (buffer.readUInt32BE(0) !== 0x89504e47) throw new Error('não é um PNG');

  let pos = 8;
  let largura = 0, altura = 0, canais = 0;
  const pedacos = [];

  while (pos < buffer.length) {
    const tam = buffer.readUInt32BE(pos);
    const tipo = buffer.toString('ascii', pos + 4, pos + 8);
    const dados = buffer.subarray(pos + 8, pos + 8 + tam);

    if (tipo === 'IHDR') {
      largura = dados.readUInt32BE(0);
      altura = dados.readUInt32BE(4);
      const profundidade = dados[8], tipoCor = dados[9], entrelace = dados[12];
      if (profundidade !== 8) throw new Error('só sei ler PNG de 8 bits por canal');
      if (entrelace !== 0) throw new Error('não sei ler PNG entrelaçado');
      canais = { 0: 1, 2: 3, 4: 2, 6: 4 }[tipoCor];
      if (!canais) throw new Error('tipo de cor não suportado: ' + tipoCor);
    } else if (tipo === 'IDAT') {
      pedacos.push(dados);
    } else if (tipo === 'IEND') break;

    pos += 12 + tam;
  }

  const cru = zlib.inflateSync(Buffer.concat(pedacos));
  const passo = largura * canais;
  const saida = Buffer.alloc(altura * passo);

  for (let y = 0; y < altura; y++) {
    const filtro = cru[y * (passo + 1)];
    const linha = cru.subarray(y * (passo + 1) + 1, (y + 1) * (passo + 1));
    const destino = y * passo;
    const anterior = destino - passo;

    for (let i = 0; i < passo; i++) {
      const a = i >= canais ? saida[destino + i - canais] : 0;
      const b = y > 0 ? saida[anterior + i] : 0;
      const c = (y > 0 && i >= canais) ? saida[anterior + i - canais] : 0;
      let v = linha[i];
      switch (filtro) {
        case 1: v += a; break;
        case 2: v += b; break;
        case 3: v += (a + b) >> 1; break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
          v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
          break;
        }
      }
      saida[destino + i] = v & 0xff;
    }
  }

  return { largura, altura, canais, dados: saida };
}

function codificarPNG(largura, altura, rgb) {
  const passo = largura * 3;
  const cru = Buffer.alloc(altura * (passo + 1));
  for (let y = 0; y < altura; y++) {
    cru[y * (passo + 1)] = 0;
    rgb.copy(cru, y * (passo + 1) + 1, y * passo, (y + 1) * passo);
  }

  const pedaco = (tipo, dados) => {
    const p = Buffer.alloc(12 + dados.length);
    p.writeUInt32BE(dados.length, 0);
    p.write(tipo, 4, 'ascii');
    dados.copy(p, 8);
    p.writeInt32BE(crc32(p.subarray(4, 8 + dados.length)) | 0, 8 + dados.length);
    return p;
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(largura, 0);
  ihdr.writeUInt32BE(altura, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pedaco('IHDR', ihdr),
    pedaco('IDAT', zlib.deflateSync(cru, { level: 9 })),
    pedaco('IEND', Buffer.alloc(0)),
  ]);
}

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
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = TABELA_CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const LIMITE_FUNDO = 244;

function ehConteudo(img, x, y) {
  const i = (y * img.largura + x) * img.canais;
  if (img.canais === 4 && img.dados[i + 3] < 24) return false;
  return Math.min(img.dados[i], img.dados[i + 1], img.dados[i + 2]) < LIMITE_FUNDO;
}

/** Transforma um vetor de contagens em faixas [inicio, fim] com conteúdo. */
function faixas(contagens, minPixels, minVao) {
  const out = [];
  let inicio = -1;
  for (let i = 0; i <= contagens.length; i++) {
    const cheio = i < contagens.length && contagens[i] > minPixels;
    if (cheio && inicio < 0) inicio = i;
    else if (!cheio && inicio >= 0) { out.push([inicio, i - 1]); inicio = -1; }
  }
  const juntas = [];
  for (const f of out) {
    const ultima = juntas[juntas.length - 1];
    if (ultima && f[0] - ultima[1] <= minVao) ultima[1] = f[1];
    else juntas.push([...f]);
  }
  return juntas;
}

function segmentar(img) {
  const { largura, altura } = img;

  const porLinha = new Int32Array(altura);
  const conteudo = new Uint8Array(largura * altura);
  for (let y = 0; y < altura; y++) {
    for (let x = 0; x < largura; x++) {
      if (ehConteudo(img, x, y)) { conteudo[y * largura + x] = 1; porLinha[y]++; }
    }
  }

  const celulas = [];
  const pico = (v) => Math.max(1, Math.max(...v));
  const corteLinha = pico(porLinha) * 0.015;

  for (const [y0, y1] of faixas(porLinha, corteLinha, Math.max(2, Math.round(altura * 0.002)))) {
    const porColuna = new Int32Array(largura);
    for (let y = y0; y <= y1; y++) {
      for (let x = 0; x < largura; x++) if (conteudo[y * largura + x]) porColuna[x]++;
    }
    const corteColuna = pico(porColuna) * 0.02;
    for (const [x0, x1] of faixas(porColuna, corteColuna, Math.max(2, Math.round(largura * 0.004)))) {
      let cy0 = y1, cy1 = y0;
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          if (conteudo[y * largura + x]) { if (y < cy0) cy0 = y; if (y > cy1) cy1 = y; break; }
        }
      }
      const l = x1 - x0, a = cy1 - cy0;
      if (l < largura * 0.02 || a < altura * 0.03) continue;
      celulas.push({ x0, x1, y0: cy0, y1: cy1 });
    }
  }
  return celulas;
}

function recortarQuadrado(img, celula, lado, folga = 0.08) {
  const cx = (celula.x0 + celula.x1) / 2;
  const cy = (celula.y0 + celula.y1) / 2;
  const tam = Math.max(celula.x1 - celula.x0, celula.y1 - celula.y0) * (1 + folga * 2);
  const meio = tam / 2;

  const saida = Buffer.alloc(lado * lado * 3, 255);
  const passo = tam / lado;

  for (let sy = 0; sy < lado; sy++) {
    for (let sx = 0; sx < lado; sx++) {
      const ox0 = Math.round(cx - meio + sx * passo);
      const oy0 = Math.round(cy - meio + sy * passo);
      const ox1 = Math.max(ox0 + 1, Math.round(cx - meio + (sx + 1) * passo));
      const oy1 = Math.max(oy0 + 1, Math.round(cy - meio + (sy + 1) * passo));

      let r = 0, g = 0, b = 0, n = 0;
      for (let y = oy0; y < oy1; y++) {
        if (y < 0 || y >= img.altura) continue;
        if (y < celula.y0 || y > celula.y1) { n++; r += 255; g += 255; b += 255; continue; }
        for (let x = ox0; x < ox1; x++) {
          if (x < 0 || x >= img.largura) continue;
          if (x < celula.x0 || x > celula.x1) { n++; r += 255; g += 255; b += 255; continue; }
          const i = (y * img.largura + x) * img.canais;
          const alfa = img.canais === 4 ? img.dados[i + 3] / 255 : 1;
          r += img.dados[i] * alfa + 255 * (1 - alfa);
          g += img.dados[i + 1] * alfa + 255 * (1 - alfa);
          b += img.dados[i + 2] * alfa + 255 * (1 - alfa);
          n++;
        }
      }
      const d = (sy * lado + sx) * 3;
      if (n) { saida[d] = r / n; saida[d + 1] = g / n; saida[d + 2] = b / n; }
    }
  }
  return saida;
}

function pngDaFolha(caminhoSvg) {
  const svg = fs.readFileSync(caminhoSvg, 'utf8');
  const m = svg.match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/);
  if (!m) throw new Error(`${caminhoSvg} não tem um PNG embutido`);
  return Buffer.from(m[1], 'base64');
}

/**
 * Recorta uma folha inteira.
 * @returns {string[]} nomes dos arquivos, na ordem de leitura da grade
 */
function recortarFolha(caminhoSvg, destino, prefixo, lado) {
  const img = decodificarPNG(pngDaFolha(caminhoSvg));
  const celulas = segmentar(img);
  fs.mkdirSync(destino, { recursive: true });

  return celulas.map((c, i) => {
    const arquivo = `${prefixo}-${String(i + 1).padStart(2, '0')}.png`;
    const pixels = recortarQuadrado(img, c, lado);
    fs.writeFileSync(path.join(destino, arquivo), codificarPNG(lado, lado, pixels));
    return arquivo;
  });
}

function principal() {
  const [folha, destino, prefixo = 'comida', ladoTexto = '160'] = process.argv.slice(2);
  if (!folha || !destino) {
    console.error('uso: node ferramentas/recortar-icones.js <folha.svg> <pasta-destino> [prefixo] [lado]');
    process.exit(1);
  }
  const itens = recortarFolha(folha, destino, prefixo, Number(ladoTexto));
  console.log(`${path.basename(folha)} -> ${itens.length} ícones`);
  itens.forEach((a) => console.log(`   ${a}`));
}

if (require.main === module) principal();
module.exports = {
  decodificarPNG, codificarPNG, segmentar, recortarQuadrado, pngDaFolha, recortarFolha,
};
