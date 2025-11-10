const XLSX = require('xlsx');
const path = require('path');

/**
 * Serviço responsável pela geração de relatórios de conciliação
 */
class RelatorioService {
  /**
   * Gera relatório completo de conciliação em uma planilha com múltiplas abas
   */
  static gerarRelatorioCompleto(resultadoConciliacao, caminhoSaida) {
    console.log('📝 Gerando relatório completo de conciliação...');
    
    const dadosPorAba = {
      'Resumo Geral': this.gerarResumoGeral(resultadoConciliacao),
      'INCLUIR NO SISTEMA': this.gerarAbaIncluir(resultadoConciliacao.incluirNoSistema),
      'EXCLUIR DO SISTEMA': this.gerarAbaExcluir(resultadoConciliacao.excluirDoSistema),
      'Detalhes por Data': this.gerarDetalhesPorData(resultadoConciliacao.detalhesPorData)
    };

    this.criarArquivoMultiAbas(dadosPorAba, caminhoSaida);
    
    console.log('✅ Relatório completo gerado com sucesso!');
    return caminhoSaida;
  }

  /**
   * Gera dados para a aba "Resumo Geral"
   */
  static gerarResumoGeral(resultadoConciliacao) {
    const agora = new Date().toLocaleString('pt-BR');
    const totalDias = resultadoConciliacao.resumoGeral.length;
    const diasConciliados = resultadoConciliacao.resumoGeral.filter(r => r.status === 'CONCILIADO').length;
    const diasComDiferenca = totalDias - diasConciliados;
    
    // Cabeçalho e estatísticas gerais
    const dados = [
      ['RELATÓRIO COMPLETO DE CONCILIAÇÃO BANCÁRIA'],
      ['Gerado em:', agora],
      [''],
      ['RESUMO GERAL'],
      ['Total de dias analisados:', totalDias],
      ['Dias conciliados:', diasConciliados],
      ['Dias com diferenças:', diasComDiferenca],
      ['Taxa de conciliação:', `${((diasConciliados / totalDias) * 100).toFixed(1)}%`],
      ['Lançamentos para incluir:', resultadoConciliacao.incluirNoSistema.length],
      ['Lançamentos para excluir:', resultadoConciliacao.excluirDoSistema.length],
      [''],
      ['Data', 'Banco - Total', 'Banco - Créditos', 'Banco - Débitos', 'Banco - Qtd Créd', 'Banco - Qtd Déb', 
       'Sistema - Total', 'Sistema - Créditos', 'Sistema - Débitos', 'Sistema - Qtd Créd', 'Sistema - Qtd Déb',
       'Diferença Total', 'Diferença Créditos', 'Diferença Débitos', 'Status']
    ];

    // Dados detalhados
    resultadoConciliacao.resumoGeral.forEach(item => {
      dados.push([
        item.data,
        item.bancoTotal.toFixed(2),
        item.bancoCreditos.toFixed(2),
        item.bancoDebitos.toFixed(2),
        item.bancoQtdCreditos,
        item.bancoQtdDebitos,
        item.sistemaTotal.toFixed(2),
        item.sistemaCreditos.toFixed(2),
        item.sistemaDebitos.toFixed(2),
        item.sistemaQtdCreditos,
        item.sistemaQtdDebitos,
        item.diferencaTotal.toFixed(2),
        item.diferencaCreditos.toFixed(2),
        item.diferencaDebitos.toFixed(2),
        item.status
      ]);
    });

    return dados;
  }

  /**
   * Gera dados para a aba "INCLUIR NO SISTEMA"
   */
  static gerarAbaIncluir(incluirNoSistema) {
    const dados = [
      ['LANÇAMENTOS PARA INCLUIR NO SISTEMA'],
      ['Total de lançamentos:', incluirNoSistema.length],
      [''],
      ['Data', 'Tipo', 'Valor', 'Descrição', 'ID', 'Ação']
    ];

    incluirNoSistema.forEach(item => {
      dados.push([
        item.data,
        item.tipo,
        item.valor,
        item.descricao,
        item.id,
        item.acao
      ]);
    });

    return dados;
  }

  /**
   * Gera dados para a aba "EXCLUIR DO SISTEMA"
   */
  static gerarAbaExcluir(excluirDoSistema) {
    const dados = [
      ['LANÇAMENTOS PARA EXCLUIR DO SISTEMA'],
      ['Total de lançamentos:', excluirDoSistema.length],
      [''],
      ['Data', 'Tipo', 'Valor', 'Cliente/Fornecedor', 'Categoria', 'Ação']
    ];

    excluirDoSistema.forEach(item => {
      dados.push([
        item.data,
        item.tipo,
        item.valor,
        item.cliente_fornecedor,
        item.categoria,
        item.acao
      ]);
    });

    return dados;
  }

 /**
 * Gera dados para a aba "Detalhes por Data"
 */
static gerarDetalhesPorData(detalhesPorData) {
  const dados = [
    ['ANÁLISE DETALHADA POR DATA'],
    [''],
    ['Data', 'Origem', 'Tipo Transação', 'Qtd Total', 'Qtd Créditos', 'Qtd Débitos', 'Valor Total Créditos', 'Valor Total Débitos', 'Status']
  ];

  detalhesPorData.forEach(item => {
    dados.push([
      item.data,
      item.origem,
      item.tipoTransacao,
      item.qtdLancamentos, // Total (créditos + débitos)
      item.qtdCreditos,    // Só créditos
      item.qtdDebitos,     // Só débitos
      item.valorTotalCreditos.toFixed(2),
      item.valorTotalDebitos.toFixed(2),
      item.status
    ]);
  });

  return dados;
}

  /**
   * Cria arquivo Excel com múltiplas abas
   */
  static criarArquivoMultiAbas(dadosPorAba, caminhoArquivo) {
    try {
      const workbook = XLSX.utils.book_new();
      
      Object.entries(dadosPorAba).forEach(([nomeAba, dados]) => {
        const worksheet = XLSX.utils.aoa_to_sheet(dados);
        XLSX.utils.book_append_sheet(workbook, worksheet, nomeAba);
      });
      
      XLSX.writeFile(workbook, caminhoArquivo);
      
      const totalAbas = Object.keys(dadosPorAba).length;
      const totalRegistros = Object.values(dadosPorAba).reduce((total, aba) => total + aba.length, 0);
      
      console.log(`✅ Arquivo multi-abas criado: ${path.basename(caminhoArquivo)}`);
      console.log(`📑 ${totalAbas} abas criadas com ${totalRegistros} registros totais`);
    } catch (error) {
      console.error(`❌ Erro ao criar arquivo multi-abas ${caminhoArquivo}:`, error.message);
      throw new Error(`Falha na criação do arquivo Excel multi-abas: ${error.message}`);
    }
  }
}

module.exports = RelatorioService;