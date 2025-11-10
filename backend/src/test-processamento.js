// Teste específico de agrupamento por data e soma de valores
const path = require('path');
const ExcelService = require('./services/ExcelService');

console.log('📊 Teste de agrupamento por data e soma de valores...\n');

async function testarAgrupamento() {
  try {
    // Ler extrato
    const arquivoExtrato = path.join(__dirname, '..', 'data', 'input', 'extrato_banco.xlsx');
    const transacoesExtrato = ExcelService.lerExtratoBancario(arquivoExtrato);
    
    console.log(`✅ Total de transações carregadas: ${transacoesExtrato.length}\n`);
    
    // Agrupar por data com totais
    const agrupamentoPorData = {};
    
    transacoesExtrato.forEach(transacao => {
      const data = transacao.getDataFormatada();
      
      // Inicializar se não existe
      if (!agrupamentoPorData[data]) {
        agrupamentoPorData[data] = {
          credit: {
            quantidade: 0,
            valorTotal: 0,
            valores: []
          },
          debit: {
            quantidade: 0,
            valorTotal: 0,
            valores: []
          }
        };
      }
      
      // Adicionar transação
      if (transacao.isCredito()) {
        agrupamentoPorData[data].credit.quantidade++;
        agrupamentoPorData[data].credit.valorTotal += transacao.getValorAbsoluto();
        agrupamentoPorData[data].credit.valores.push(transacao.valor);
      } else {
        agrupamentoPorData[data].debit.quantidade++;
        agrupamentoPorData[data].debit.valorTotal += transacao.getValorAbsoluto();
        agrupamentoPorData[data].debit.valores.push(transacao.valor);
      }
    });
    
    // Mostrar resultados das primeiras 10 datas
    console.log('📅 AGRUPAMENTO POR DATA E TOTAIS:\n');
    const datas = Object.keys(agrupamentoPorData).sort().slice(0, 10);
    
    datas.forEach(data => {
      const grupos = agrupamentoPorData[data];
      
      console.log(`📍 ${data}:`);
      console.log(`   💰 CREDIT: ${grupos.credit.quantidade} lançamentos = R$ ${grupos.credit.valorTotal.toFixed(2)}`);
      console.log(`   💸 DEBIT:  ${grupos.debit.quantidade} lançamentos = R$ ${grupos.debit.valorTotal.toFixed(2)}`);
      console.log(`   📊 SALDO DO DIA: R$ ${(grupos.credit.valorTotal - grupos.debit.valorTotal).toFixed(2)}`);
      
      // Mostrar alguns valores individuais se tiver muitos
      if (grupos.credit.quantidade > 0) {
        const exemplosCredit = grupos.credit.valores.slice(0, 3);
        console.log(`   📋 Exemplos CREDIT: ${exemplosCredit.map(v => `R$ ${v}`).join(', ')}${grupos.credit.quantidade > 3 ? '...' : ''}`);
      }
      
      if (grupos.debit.quantidade > 0) {
        const exemplosDebit = grupos.debit.valores.slice(0, 3);
        console.log(`   📋 Exemplos DEBIT: ${exemplosDebit.map(v => `R$ ${v}`).join(', ')}${grupos.debit.quantidade > 3 ? '...' : ''}`);
      }
      
      console.log(''); // Linha em branco
    });
    
    // Estatísticas gerais
    console.log('📈 ESTATÍSTICAS GERAIS:');
    const totalDias = Object.keys(agrupamentoPorData).length;
    let totalCreditGeral = 0;
    let totalDebitGeral = 0;
    let totalTransacoesGeral = 0;
    
    Object.values(agrupamentoPorData).forEach(dia => {
      totalCreditGeral += dia.credit.valorTotal;
      totalDebitGeral += dia.debit.valorTotal;
      totalTransacoesGeral += dia.credit.quantidade + dia.debit.quantidade;
    });
    
    console.log(`   📅 Total de dias: ${totalDias}`);
    console.log(`   🔢 Total de transações: ${totalTransacoesGeral}`);
    console.log(`   💰 Total CREDIT: R$ ${totalCreditGeral.toFixed(2)}`);
    console.log(`   💸 Total DEBIT: R$ ${totalDebitGeral.toFixed(2)}`);
    console.log(`   📊 SALDO GERAL: R$ ${(totalCreditGeral - totalDebitGeral).toFixed(2)}`);
    
    // Procurar dias com valores específicos (exemplo do seu caso)
    console.log('\n🔍 PROCURANDO PADRÕES:');
    datas.forEach(data => {
      const grupos = agrupamentoPorData[data];
      
      // Procurar dias com muitos lançamentos de valores similares
      if (grupos.credit.quantidade >= 5) {
        console.log(`📍 ${data}: ${grupos.credit.quantidade} CREDITs = R$ ${grupos.credit.valorTotal.toFixed(2)}`);
      }
      if (grupos.debit.quantidade >= 5) {
        console.log(`📍 ${data}: ${grupos.debit.quantidade} DEBITs = R$ ${grupos.debit.valorTotal.toFixed(2)}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testarAgrupamento();