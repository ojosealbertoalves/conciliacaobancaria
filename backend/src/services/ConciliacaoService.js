const _ = require('lodash');

/**
 * Serviço responsável pela lógica de conciliação bancária
 */
class ConciliacaoService {
  /**
   * Executa a conciliação completa entre extrato e sistema
   */
  static conciliar(transacoesExtrato, transacoesSistema) {
    console.log('🔄 Iniciando processo de conciliação...');
    
    // Agrupa transações por data
    const extratoAgrupado = this.agruparTransacoesPorData(transacoesExtrato);
    const sistemaAgrupado = this.agruparTransacoesPorData(transacoesSistema);

    // Realiza comparações
    const resultado = {
      resumoGeral: this.criarResumoGeral(extratoAgrupado, sistemaAgrupado),
      incluirNoSistema: this.encontrarParaIncluir(transacoesExtrato, transacoesSistema),
      excluirDoSistema: this.encontrarParaExcluir(transacoesExtrato, transacoesSistema),
      detalhesPorData: this.criarDetalhesPorData(extratoAgrupado, sistemaAgrupado)
    };

    console.log('✅ Conciliação concluída!');
    this.imprimirEstatisticas(resultado);
    
    return resultado;
  }

  /**
   * Agrupa transações por data
   */
  static agruparTransacoesPorData(transacoes) {
    const agrupado = {};
    
    transacoes.forEach(transacao => {
      const data = transacao.getDataFormatada();
      if (!agrupado[data]) {
        agrupado[data] = { credit: [], debit: [] };
      }
      
      if (transacao.isCredito()) {
        agrupado[data].credit.push(transacao);
      } else {
        agrupado[data].debit.push(transacao);
      }
    });
    
    return agrupado;
  }

  /**
   * Cria resumo geral da conciliação
   */
  static criarResumoGeral(extratoAgrupado, sistemaAgrupado) {
    const todasAsDatas = _.union(Object.keys(extratoAgrupado), Object.keys(sistemaAgrupado)).sort();
    
    const resumoPorData = todasAsDatas.map(data => {
      const transacoesExtrato = extratoAgrupado[data] || { credit: [], debit: [] };
      const transacoesSistema = sistemaAgrupado[data] || { credit: [], debit: [] };
      
      // Calcular totais do extrato
      const bancoCreditos = _.sumBy(transacoesExtrato.credit, t => t.getValorAbsoluto());
      const bancoDebitos = _.sumBy(transacoesExtrato.debit, t => t.getValorAbsoluto());
      const bancoQtdCreditos = transacoesExtrato.credit.length;
      const bancoQtdDebitos = transacoesExtrato.debit.length;
      
      // Calcular totais do sistema
      const sistemaCreditos = _.sumBy(transacoesSistema.credit, t => t.getValorAbsoluto());
      const sistemaDebitos = _.sumBy(transacoesSistema.debit, t => t.getValorAbsoluto());
      const sistemaQtdCreditos = transacoesSistema.credit.length;
      const sistemaQtdDebitos = transacoesSistema.debit.length;
      
      const bancoTotal = bancoCreditos - bancoDebitos;
      const sistemaTotal = sistemaCreditos - sistemaDebitos;
      
      return {
        data,
        bancoTotal,
        bancoCreditos,
        bancoDebitos,
        bancoQtdCreditos,
        bancoQtdDebitos,
        sistemaTotal,
        sistemaCreditos,
        sistemaDebitos,
        sistemaQtdCreditos,
        sistemaQtdDebitos,
        diferencaTotal: bancoTotal - sistemaTotal,
        diferencaCreditos: bancoCreditos - sistemaCreditos,
        diferencaDebitos: bancoDebitos - sistemaDebitos,
        status: (Math.abs(bancoTotal - sistemaTotal) < 0.01) ? 'CONCILIADO' : 'COM DIFERENÇAS'
      };
    });

    return resumoPorData;
  }

  /**
   * Encontra lançamentos que devem ser incluídos no sistema
   */
  static encontrarParaIncluir(transacoesExtrato, transacoesSistema) {
    // Criar mapa de transações do sistema para comparação
    const sistemaMap = new Map();
    transacoesSistema.forEach(transacao => {
      const chave = `${transacao.getDataFormatada()}_${transacao.tipo}_${transacao.valor}`;
      if (!sistemaMap.has(chave)) {
        sistemaMap.set(chave, []);
      }
      sistemaMap.get(chave).push(transacao);
    });

    const paraIncluir = [];
    
    transacoesExtrato.forEach(transacaoExtrato => {
      const chave = `${transacaoExtrato.getDataFormatada()}_${transacaoExtrato.tipo}_${transacaoExtrato.valor}`;
      const transacoesSistemaCorrespondentes = sistemaMap.get(chave) || [];
      
      // Se não há transações correspondentes no sistema, deve incluir
      if (transacoesSistemaCorrespondentes.length === 0) {
        paraIncluir.push({
          data: transacaoExtrato.getDataFormatada(),
          tipo: transacaoExtrato.tipo,
          valor: transacaoExtrato.valor,
          descricao: transacaoExtrato.descricao,
          id: transacaoExtrato.id,
          acao: 'INCLUIR NO SISTEMA'
        });
      } else {
        // Remove uma correspondência para evitar duplicatas
        transacoesSistemaCorrespondentes.pop();
        if (transacoesSistemaCorrespondentes.length === 0) {
          sistemaMap.delete(chave);
        }
      }
    });

    return paraIncluir;
  }

  /**
   * Encontra lançamentos que devem ser excluídos do sistema
   */
  static encontrarParaExcluir(transacoesExtrato, transacoesSistema) {
    // Criar mapa de transações do extrato para comparação
    const extratoMap = new Map();
    transacoesExtrato.forEach(transacao => {
      const chave = `${transacao.getDataFormatada()}_${transacao.tipo}_${transacao.valor}`;
      if (!extratoMap.has(chave)) {
        extratoMap.set(chave, []);
      }
      extratoMap.get(chave).push(transacao);
    });

    const paraExcluir = [];
    
    transacoesSistema.forEach(transacaoSistema => {
      const chave = `${transacaoSistema.getDataFormatada()}_${transacaoSistema.tipo}_${transacaoSistema.valor}`;
      const transacoesExtratoCorrespondentes = extratoMap.get(chave) || [];
      
      // Se não há transações correspondentes no extrato, deve excluir
      if (transacoesExtratoCorrespondentes.length === 0) {
        paraExcluir.push({
          data: transacaoSistema.getDataFormatada(),
          tipo: transacaoSistema.tipo,
          valor: transacaoSistema.valor,
          cliente_fornecedor: transacaoSistema.descricao,
          categoria: transacaoSistema.categoria,
          acao: 'EXCLUIR DO SISTEMA'
        });
      } else {
        // Remove uma correspondência para evitar duplicatas
        transacoesExtratoCorrespondentes.pop();
        if (transacoesExtratoCorrespondentes.length === 0) {
          extratoMap.delete(chave);
        }
      }
    });

    return paraExcluir;
  }

  /**
 * Cria análise detalhada por data
 */
static criarDetalhesPorData(extratoAgrupado, sistemaAgrupado) {
  const todasAsDatas = _.union(Object.keys(extratoAgrupado), Object.keys(sistemaAgrupado)).sort();
  const detalhes = [];
  
  todasAsDatas.forEach(data => {
    const transacoesExtrato = extratoAgrupado[data] || { credit: [], debit: [] };
    const transacoesSistema = sistemaAgrupado[data] || { credit: [], debit: [] };
    
    // Análise do banco (extrato)
    const extratoCredTotal = _.sumBy(transacoesExtrato.credit, t => t.getValorAbsoluto());
    const extratoDebTotal = _.sumBy(transacoesExtrato.debit, t => t.getValorAbsoluto());
    const extratoQtdCreditos = transacoesExtrato.credit.length;
    const extratoQtdDebitos = transacoesExtrato.debit.length;
    
    detalhes.push({
      data,
      origem: 'BANCO',
      tipoTransacao: 'TOTAL',
      qtdLancamentos: extratoQtdCreditos + extratoQtdDebitos, // Total
      qtdCreditos: extratoQtdCreditos,                        // Só créditos
      qtdDebitos: extratoQtdDebitos,                          // Só débitos
      valorTotalCreditos: extratoCredTotal,
      valorTotalDebitos: extratoDebTotal,
      status: 'Referência'
    });
    
    // Análise do sistema
    const sistemaCredTotal = _.sumBy(transacoesSistema.credit, t => t.getValorAbsoluto());
    const sistemaDebTotal = _.sumBy(transacoesSistema.debit, t => t.getValorAbsoluto());
    const sistemaQtdCreditos = transacoesSistema.credit.length;
    const sistemaQtdDebitos = transacoesSistema.debit.length;
    
    const temDiferenca = (Math.abs(sistemaCredTotal - extratoCredTotal) > 0.01) || 
                        (Math.abs(sistemaDebTotal - extratoDebTotal) > 0.01);
    
    detalhes.push({
      data,
      origem: 'SISTEMA',
      tipoTransacao: 'TOTAL',
      qtdLancamentos: sistemaQtdCreditos + sistemaQtdDebitos, // Total
      qtdCreditos: sistemaQtdCreditos,                        // Só créditos
      qtdDebitos: sistemaQtdDebitos,                          // Só débitos
      valorTotalCreditos: sistemaCredTotal,
      valorTotalDebitos: sistemaDebTotal,
      status: temDiferenca ? 'COM DIFERENÇAS' : 'CONCILIADO'
    });
  });
  
  return detalhes;
}

  /**
   * Imprime estatísticas do processo de conciliação
   */
  static imprimirEstatisticas(resultado) {
    console.log('\n📊 ESTATÍSTICAS DA CONCILIAÇÃO:');
    console.log(`   📅 Total de dias analisados: ${resultado.resumoGeral.length}`);
    console.log(`   ➕ Lançamentos para incluir no sistema: ${resultado.incluirNoSistema.length}`);
    console.log(`   ➖ Lançamentos para excluir do sistema: ${resultado.excluirDoSistema.length}`);
    
    const diasConciliados = resultado.resumoGeral.filter(r => r.status === 'CONCILIADO').length;
    const diasComDiferenca = resultado.resumoGeral.length - diasConciliados;
    
    console.log(`   ✅ Dias conciliados: ${diasConciliados}`);
    console.log(`   ⚠️  Dias com diferenças: ${diasComDiferenca}`);
    console.log(`   📊 Taxa de conciliação: ${((diasConciliados / resultado.resumoGeral.length) * 100).toFixed(1)}%`);
  }
}

module.exports = ConciliacaoService;