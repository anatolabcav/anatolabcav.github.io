
const os = require('os');

/**
 * Lista os endereços IPv4 da máquina, do mais provável para o menos.
 * Quando o professor liga o hotspot do celular, o notebook recebe um IP
 * privado nessa rede, quase sempre 192.168.x.x. Por isso essa faixa vem
 * primeiro na ordenação.
 */
function enderecosLocais() {
  const achados = [];

  for (const [nome, entradas] of Object.entries(os.networkInterfaces())) {
    for (const e of entradas || []) {
      if (e.family !== 'IPv4' && e.family !== 4) continue;
      if (e.internal) continue;
      achados.push({ interface: nome, ip: e.address });
    }
  }

  const prioridade = (ip) => {
    if (ip.startsWith('192.168.')) return 0;
    if (ip.startsWith('172.')) return 1;
    if (ip.startsWith('10.')) return 2;
    if (ip.startsWith('169.254.')) return 9;
    return 3;
  };

  return achados.sort((a, b) => prioridade(a.ip) - prioridade(b.ip));
}

/** O endereço mais provável de funcionar, ou null se a máquina está offline. */
function melhorEndereco() {
  return enderecosLocais()[0] || null;
}

module.exports = { enderecosLocais, melhorEndereco };
