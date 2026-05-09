export type Movimentacao = {
  id: string;
  caixa_id: string | null;
  tipo: string;
  forma_pagamento: string;
  numero_pedido: string | null;
  maquineta: string | null;
  banco: string | null;
  valor: number;
  descricao: string | null;
  criado_em: string | null;
};

export function computeTotais(movs: Movimentacao[], valorAbertura = 0) {
  let entradasDinheiro = 0;
  let saidasDinheiro = 0;
  let cartao = 0;
  let pix = 0;

  for (const m of movs) {
    const v = Number(m.valor) || 0;
    const signed = m.tipo === "saida" ? -v : v;
    if (m.forma_pagamento === "dinheiro") {
      if (m.tipo === "entrada") entradasDinheiro += v;
      else saidasDinheiro += v;
    } else if (m.forma_pagamento === "cartao") cartao += signed;
    else if (m.forma_pagamento === "pix") pix += signed;
  }

  // Saldo físico do caixa só é afetado por dinheiro
  const saldoDinheiro = valorAbertura + entradasDinheiro - saidasDinheiro;
  const totalEntradas = entradasDinheiro + Math.max(cartao, 0) + Math.max(pix, 0);
  const totalSaidas = saidasDinheiro + Math.max(-cartao, 0) + Math.max(-pix, 0);
  const saldoFinal = saldoDinheiro;

  return {
    entradasDinheiro,
    saidasDinheiro,
    cartao,
    pix,
    transferencia: 0,
    saldoDinheiro,
    totalEntradas,
    totalSaidas,
    saldoFinal,
  };
}
