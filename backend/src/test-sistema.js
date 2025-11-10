// Teste do arquivo de dados do sistema
const path = require('path');
const ExcelService = require('./services/ExcelService');

console.log('💻 Testando dados do sistema...\n');

async function testarSistema() {
  try {
    // Ler sistema
    const arquivoSistema = path.join(__dirname, '..', 'data', 'input', 'dados_sistema.xlsx');
    const transacoesSistema = ExcelService.lerDadosSistema(arquivoSistema);
    
    console.log(`✅ Total de transações do sistema: ${transacoesSistema.length}\n`);
    
    // Mostrar primeiras 5 transações
    console.log('📝 Primeiras 5 transações do sistema:');
    transacoesSistema.slice(0, 5).forEach((t, i) => {
      console.log(`${i+1}. ${t.getDataFormatada()} | ${t.tipo} | R$ ${t.valor} | ${t.descricao}`);
    });
    
    // Agrupar por data
    const agrupamentoPorData = {};
    transacoesSistema.forEach(t => {
      const data = t.getDataFormatada();
      if (!agrupamentoPorData[data]) {
        agrupamentoPorData[data] = { credit: { qtd: 0, total: 0 }, debit: { qtd: 0, total: 0 } };
      }
      if (t.isCredito()) {
        agrupamentoPorData[data].credit.qtd++;
        agrupamentoPorData[data].credit.total += t.getValorAbsoluto();
      } else {
        agrupamentoPorData[data].debit.qtd++;
        agrupamentoPorData[data].debit.total += t.getValorAbsoluto();
      }
    });
    
    console.log('\n📅 Primeiras 5 datas do sistema:');
    Object.keys(agrupamentoPorData).sort().slice(0, 5).forEach(data => {
      const grupos = agrupamentoPorData[data];
      console.log(`📍 ${data}:`);
      console.log(`   💰 CREDIT: ${grupos.credit.qtd} = R$ ${grupos.credit.total.toFixed(2)}`);
      console.log(`   💸 DEBIT:  ${grupos.debit.qtd} = R$ ${grupos.debit.total.toFixed(2)}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testarSistema();