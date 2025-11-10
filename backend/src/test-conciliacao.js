// Teste completo de conciliação entre extrato e sistema - PERÍODO 10/08 a 20/08
const path = require('path');
const ExcelService = require('./services/ExcelService');

console.log('🔄 Teste de conciliação - PERÍODO: 10/08/2025 a 20/08/2025\n');

async function testarConciliacao() {
  try {
    // Ler ambos os arquivos
    const arquivoExtrato = path.join(__dirname, '..', 'data', 'input', 'extrato_banco.xlsx');
    const arquivoSistema = path.join(__dirname, '..', 'data', 'input', 'dados_sistema.xlsx');
    
    console.log('📖 Carregando dados...');
    const transacoesExtrato = ExcelService.lerExtratoBancario(arquivoExtrato);
    const transacoesSistema = ExcelService.lerDadosSistema(arquivoSistema);
    
    console.log(`✅ Extrato: ${transacoesExtrato.length} transações`);
    console.log(`✅ Sistema: ${transacoesSistema.length} transações\n`);
    
    // Filtrar período específico: 10/08 a 20/08
    const dataInicio = '2025-08-10';
    const dataFim = '2025-08-20';
    
    const extratoFiltrado = transacoesExtrato.filter(t => {
      const data = t.getDataFormatada();
      return data >= dataInicio && data <= dataFim;
    });
    
    const sistemaFiltrado = transacoesSistema.filter(t => {
      const data = t.getDataFormatada();
      return data >= dataInicio && data <= dataFim;
    });
    
    console.log(`🔍 PERÍODO FILTRADO (${dataInicio} a ${dataFim}):`);
    console.log(`   🏦 Extrato: ${extratoFiltrado.length} transações`);
    console.log(`   💻 Sistema: ${sistemaFiltrado.length} transações\n`);
    
    // Agrupar extrato por data
    const extratoAgrupado = {};
    extratoFiltrado.forEach(t => {
      const data = t.getDataFormatada();
      if (!extratoAgrupado[data]) {
        extratoAgrupado[data] = { credit: { qtd: 0, total: 0 }, debit: { qtd: 0, total: 0 } };
      }
      if (t.isCredito()) {
        extratoAgrupado[data].credit.qtd++;
        extratoAgrupado[data].credit.total += t.getValorAbsoluto();
      } else {
        extratoAgrupado[data].debit.qtd++;
        extratoAgrupado[data].debit.total += t.getValorAbsoluto();
      }
    });
    
    // Agrupar sistema por data
    const sistemaAgrupado = {};
    sistemaFiltrado.forEach(t => {
      const data = t.getDataFormatada();
      if (!sistemaAgrupado[data]) {
        sistemaAgrupado[data] = { credit: { qtd: 0, total: 0 }, debit: { qtd: 0, total: 0 } };
      }
      if (t.isCredito()) {
        sistemaAgrupado[data].credit.qtd++;
        sistemaAgrupado[data].credit.total += t.getValorAbsoluto();
      } else {
        sistemaAgrupado[data].debit.qtd++;
        sistemaAgrupado[data].debit.total += t.getValorAbsoluto();
      }
    });
    
    // Obter todas as datas do período
    const todasAsDatas = [];
    for (let data = new Date(dataInicio); data <= new Date(dataFim); data.setDate(data.getDate() + 1)) {
      todasAsDatas.push(data.toISOString().split('T')[0]);
    }
    
    console.log('📊 COMPARAÇÃO DETALHADA POR DATA:\n');
    
    let diasConciliados = 0;
    let diasComDiferenca = 0;
    let incluirNoSistema = [];
    let excluirDoSistema = [];
    
    todasAsDatas.forEach(data => {
      const extrato = extratoAgrupado[data] || { credit: { qtd: 0, total: 0 }, debit: { qtd: 0, total: 0 } };
      const sistema = sistemaAgrupado[data] || { credit: { qtd: 0, total: 0 }, debit: { qtd: 0, total: 0 } };
      
      // Pular dias sem movimentação em nenhum dos dois
      if (extrato.credit.qtd === 0 && extrato.debit.qtd === 0 && sistema.credit.qtd === 0 && sistema.debit.qtd === 0) {
        return;
      }
      
      console.log(`📅 ${data}:`);
      console.log(`   🏦 EXTRATO  - CREDIT: ${extrato.credit.qtd} lançamentos = R$ ${extrato.credit.total.toFixed(2)}`);
      console.log(`   🏦 EXTRATO  - DEBIT:  ${extrato.debit.qtd} lançamentos = R$ ${extrato.debit.total.toFixed(2)}`);
      console.log(`   💻 SISTEMA  - CREDIT: ${sistema.credit.qtd} lançamentos = R$ ${sistema.credit.total.toFixed(2)}`);
      console.log(`   💻 SISTEMA  - DEBIT:  ${sistema.debit.qtd} lançamentos = R$ ${sistema.debit.total.toFixed(2)}`);
      
      // Calcular diferenças
      const difCredQtd = extrato.credit.qtd - sistema.credit.qtd;
      const difCredVal = extrato.credit.total - sistema.credit.total;
      const difDebQtd = extrato.debit.qtd - sistema.debit.qtd;
      const difDebVal = extrato.debit.total - sistema.debit.total;
      
      console.log(`   📊 DIFERENÇAS:`);
      console.log(`      CREDIT: ${difCredQtd > 0 ? '+' : ''}${difCredQtd} lançamentos, R$ ${difCredVal > 0 ? '+' : ''}${difCredVal.toFixed(2)}`);
      console.log(`      DEBIT:  ${difDebQtd > 0 ? '+' : ''}${difDebQtd} lançamentos, R$ ${difDebVal > 0 ? '+' : ''}${difDebVal.toFixed(2)}`);
      
      // Status da conciliação
      const conciliado = (Math.abs(difCredVal) < 0.01 && Math.abs(difDebVal) < 0.01); // Tolerância de 1 centavo
      if (conciliado) {
        console.log(`   ✅ STATUS: CONCILIADO`);
        diasConciliados++;
      } else {
        console.log(`   ⚠️ STATUS: COM DIFERENÇAS`);
        diasComDiferenca++;
        
        // Análise detalhada do dia com diferenças
        const transacoesExtratoDia = extratoFiltrado.filter(t => t.getDataFormatada() === data);
        const transacoesSistemaDia = sistemaFiltrado.filter(t => t.getDataFormatada() === data);
        
        // Criar mapa de transações do sistema para comparação
        const sistemaMap = new Map();
        transacoesSistemaDia.forEach(t => {
          const chave = `${t.tipo}_${t.valor}`;
          if (!sistemaMap.has(chave)) {
            sistemaMap.set(chave, []);
          }
          sistemaMap.get(chave).push(t);
        });
        
        // Verificar o que do extrato não está no sistema
        transacoesExtratoDia.forEach(tExtrato => {
          const chave = `${tExtrato.tipo}_${tExtrato.valor}`;
          const correspondentes = sistemaMap.get(chave) || [];
          
          if (correspondentes.length === 0) {
            incluirNoSistema.push({
              data: tExtrato.getDataFormatada(),
              tipo: tExtrato.tipo,
              valor: tExtrato.valor,
              descricao: tExtrato.descricao.substring(0, 80)
            });
          } else {
            // Remove uma correspondência
            correspondentes.pop();
            if (correspondentes.length === 0) {
              sistemaMap.delete(chave);
            }
          }
        });
        
        // O que sobrou no sistema (não tem no extrato)
        sistemaMap.forEach(transacoes => {
          transacoes.forEach(tSistema => {
            excluirDoSistema.push({
              data: tSistema.getDataFormatada(),
              tipo: tSistema.tipo,
              valor: tSistema.valor,
              descricao: tSistema.descricao.substring(0, 80)
            });
          });
        });
        
        console.log(`   🔍 Análise: ${incluirNoSistema.filter(i => i.data === data).length} para incluir, ${excluirDoSistema.filter(e => e.data === data).length} para excluir`);
      }
      
      console.log(''); // linha em branco
    });
    
    // Estatísticas do período
    console.log('📈 ESTATÍSTICAS DO PERÍODO (10/08 a 20/08):');
    console.log(`   📅 Dias com movimentação: ${diasConciliados + diasComDiferenca}`);
    console.log(`   ✅ Dias conciliados: ${diasConciliados}`);
    console.log(`   ⚠️ Dias com diferenças: ${diasComDiferenca}`);
    console.log(`   📊 Taxa de conciliação: ${((diasConciliados / (diasConciliados + diasComDiferenca)) * 100).toFixed(1)}%`);
    
    console.log('\n📋 AÇÕES NECESSÁRIAS:');
    console.log(`   ➕ Total para incluir no sistema: ${incluirNoSistema.length} transações`);
    console.log(`   ➖ Total para excluir do sistema: ${excluirDoSistema.length} transações`);
    
    // Mostrar exemplos das ações necessárias
    if (incluirNoSistema.length > 0) {
      console.log('\n📝 INCLUIR NO SISTEMA (primeiros 10):');
      incluirNoSistema.slice(0, 10).forEach((item, i) => {
        console.log(`   ${i+1}. ${item.data} | ${item.tipo} | R$ ${item.valor} | ${item.descricao}`);
      });
    }
    
    if (excluirDoSistema.length > 0) {
      console.log('\n📝 EXCLUIR DO SISTEMA (primeiros 10):');
      excluirDoSistema.slice(0, 10).forEach((item, i) => {
        console.log(`   ${i+1}. ${item.data} | ${item.tipo} | R$ ${item.valor} | ${item.descricao}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testarConciliacao();