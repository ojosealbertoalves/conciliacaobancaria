// Teste simples para ler o extrato bancário
const XLSX = require('xlsx');
const path = require('path');

console.log('🔍 Testando leitura do extrato bancário...\n');

// Caminho do arquivo
const arquivoExtrato = path.join(__dirname, '..', 'data', 'input', 'extrato_banco.xlsx');

try {
  // Verificar se arquivo existe
  const fs = require('fs');
  if (!fs.existsSync(arquivoExtrato)) {
    console.log('❌ Arquivo não encontrado:', arquivoExtrato);
    console.log('📁 Coloque o arquivo extrato_banco.xlsx em: data/input/');
    process.exit(1);
  }

  console.log('✅ Arquivo encontrado!');
  
  // Ler arquivo Excel
  const workbook = XLSX.readFile(arquivoExtrato);
  console.log('📊 Abas disponíveis:', workbook.SheetNames);
  
  // Pegar primeira aba
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  console.log('📋 Range:', worksheet['!ref']);
  
  // Converter para array (primeiras 10 linhas)
  const dados = XLSX.utils.sheet_to_json(worksheet, { 
    header: 1,
    range: 0
  });
  
  console.log('\n📝 Primeiras 5 linhas:');
  dados.slice(0, 5).forEach((linha, index) => {
    console.log(`Linha ${index}:`, linha);
  });
  
  console.log('\n📈 Estatísticas:');
  console.log(`Total de linhas: ${dados.length}`);
  console.log(`Colunas na primeira linha: ${dados[0] ? dados[0].length : 0}`);
  
  // Tentar identificar header
  console.log('\n🔍 Procurando header...');
  for (let i = 0; i < Math.min(5, dados.length); i++) {
    const linha = dados[i];
    if (linha && linha.join) {
      const textoLinha = linha.join(' ').toLowerCase();
      if (textoLinha.includes('tipo') || textoLinha.includes('data') || textoLinha.includes('valor')) {
        console.log(`✅ Possível header encontrado na linha ${i}:`, linha);
        break;
      }
    }
  }
  
} catch (error) {
  console.error('❌ Erro:', error.message);
}