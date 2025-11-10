// Debug das datas para ver o que está acontecendo
const XLSX = require('xlsx');
const path = require('path');

console.log('🔍 Debug das datas...\n');

try {
  const arquivoExtrato = path.join(__dirname, '..', 'data', 'input', 'extrato_banco.xlsx');
  const workbook = XLSX.readFile(arquivoExtrato);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  
  const dados = XLSX.utils.sheet_to_json(worksheet, { 
    header: 1,
    range: 0
  });
  
  console.log('📊 Analisando as primeiras 10 datas:\n');
  
  for (let i = 1; i <= 10; i++) {
    const [tipo, data, valor, descricao] = dados[i];
    
    console.log(`Linha ${i}:`);
    console.log(`  Data original: ${data} (tipo: ${typeof data})`);
    
    // Testar diferentes conversões
    if (typeof data === 'number') {
      // Método 1: Fórmula padrão
      const metodo1 = new Date((data - 25569) * 86400 * 1000);
      console.log(`  Método 1: ${metodo1.toISOString().split('T')[0]}`);
      
      // Método 2: Usando XLSX utils
      const metodo2 = XLSX.SSF.parse_date_code(data);
      console.log(`  Método 2: ${metodo2 ? `${metodo2.y}-${String(metodo2.m).padStart(2,'0')}-${String(metodo2.d).padStart(2,'0')}` : 'ERRO'}`);
      
      // Método 3: Direto como timestamp
      const metodo3 = new Date(data * 24 * 60 * 60 * 1000);
      console.log(`  Método 3: ${metodo3.toISOString().split('T')[0]}`);
      
    } else {
      console.log(`  Data já é string/outro: ${data}`);
    }
    
    console.log(''); // linha em branco
  }
  
} catch (error) {
  console.error('❌ Erro:', error.message);
}