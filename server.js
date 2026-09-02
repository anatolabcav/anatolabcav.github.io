
const path = require('path');
const express = require('express');
const QRCode = require('qrcode');

const { lerPerguntas, lerPerguntasDeBuffer, pastasDeAreaDeTrabalho, NOME_ARQUIVO } = require('./src/planilha');
const { enderecosLocais, melhorEndereco } = require('./src/rede');
const { criarHub } = require('./src/tempo-real');

const PORTA = Number(process.env.PORT) || 3000;
const app = express();

app.use(express.json({ limit: '2mb' }));

app.use(express.static(path.join(__dirname, 'public'), { etag: false, maxAge: 0 }));

/**
 * GET /api/perguntas
 * Lê o Perguntas.xlsx. Aceita ?caminho=... quando o professor escolheu o
 * arquivo na mão. Devolve sempre 200 com {ok:false, erro} em caso de
 * problema. A tela mostra a mensagem em vez de um erro genérico de rede.
 */
app.get('/api/perguntas', (req, res) => {
  const r = lerPerguntas(req.query.caminho);
  if (!r.ok) {
    console.warn('[perguntas]', r.codigo, '-', r.erro);
    return res.json(r);
  }
  console.log(`[perguntas] ${r.perguntas.length} carregadas de ${r.caminho}`);
  res.json(r);
});

/**
 * POST /api/perguntas/arquivo
 * O professor escolheu a planilha na mão (ela não estava na área de trabalho).
 * O navegador manda os bytes crus; aqui passam pelo mesmo interpretador.
 */
app.post('/api/perguntas/arquivo',
  express.raw({ type: '*/*', limit: '25mb' }),
  (req, res) => {
    const nome = String(req.query.nome || 'arquivo enviado');
    if (!req.body || !req.body.length) {
      return res.json({ ok: false, codigo: 'VAZIO', erro: 'O arquivo chegou vazio. Tente escolher de novo.' });
    }
    const r = lerPerguntasDeBuffer(req.body, nome);
    if (!r.ok) console.warn('[perguntas/arquivo]', r.codigo, '-', r.erro);
    else console.log(`[perguntas/arquivo] ${r.perguntas.length} carregadas de ${nome}`);
    res.json(r);
  });

/** GET /api/onde-procurei: ajuda a diagnosticar "não achei o arquivo". */
app.get('/api/onde-procurei', (_req, res) => {
  res.json({ nomeArquivo: NOME_ARQUIVO, pastas: pastasDeAreaDeTrabalho() });
});

/** GET /api/rede: IPs da máquina, para o QR e o aviso na tela. */
app.get('/api/rede', (_req, res) => {
  const eu = melhorEndereco();
  res.json({
    porta: PORTA,
    enderecos: enderecosLocais(),
    melhor: eu,
    enderecoDasEquipes: eu ? `http://${eu.ip}:${PORTA}/celular.html` : null,
  });
});

/**
 * GET /api/qr: QR code do endereço que as equipes devem abrir.
 * Vem como SVG para ficar nítido no projetor em qualquer tamanho, e é gerado
 * aqui dentro (biblioteca local) porque em sala não há internet.
 */
app.get('/api/qr', async (req, res) => {
  const eu = melhorEndereco();
  const alvo = req.query.texto || (eu && `http://${eu.ip}:${PORTA}/celular.html`);

  if (!alvo) {
    return res.status(503).json({
      ok: false,
      erro: 'O computador não está em nenhuma rede. Ligue o hotspot do celular e conecte o notebook nele.',
    });
  }

  try {
    const svg = await QRCode.toString(String(alvo), {
      type: 'svg', margin: 1, errorCorrectionLevel: 'M',
      color: { dark: '#2A2320', light: '#0000' },
    });
    res.type('image/svg+xml').set('Cache-Control', 'no-store').send(svg);
  } catch (e) {
    res.status(500).json({ ok: false, erro: 'Não consegui gerar o QR code: ' + e.message });
  }
});

const servidor = app.listen(PORTA, '0.0.0.0', () => {
  const eu = melhorEndereco();
  const barra = '='.repeat(58);

  console.log('\n' + barra);
  console.log('  Anatomia Interativa: o jogo está no ar');
  console.log(barra);
  console.log(`  Neste computador (telão):  http://localhost:${PORTA}`);
  if (eu) {
    console.log(`  Celulares das equipes:     http://${eu.ip}:${PORTA}/celular.html`);
    console.log(`                             (${eu.interface}, é este o endereço do QR)`);
  } else {
    console.log('  Na rede do hotspot:        (sem rede: ligue o hotspot do celular');
    console.log('                              e conecte o notebook nele)');
  }
  console.log(barra);
  console.log('  Para encerrar: feche esta janela ou aperte Ctrl+C\n');

  const r = lerPerguntas();
  if (r.ok) console.log(`  Perguntas.xlsx: ${r.perguntas.length} perguntas prontas.\n`);
  else console.log(`  Atenção: ${r.erro}\n`);
});

criarHub(servidor);

servidor.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`\n  A porta ${PORTA} já está ocupada.`);
    console.error('  Provavelmente o jogo já está aberto em outra janela.');
    console.error(`  Feche a outra janela, ou inicie assim:  set PORT=3001 && npm start\n`);
    process.exit(1);
  }
  throw e;
});

module.exports = { app, servidor };
