const XLSX = require('xlsx');
const path = require('path');
const Transacao = require('../models/Transacao');

/**
 * Serviço para manipulação de arquivos Excel
 */
class ExcelService {
  /**
   * Converte número Excel para data (MÉTODO 1 - funcionando!)
   */
  static converterDataExcel(numeroData) {
    if (typeof numeroData === 'number') {
      // Fórmula que está funcionando: (numero - 25569) * 86400 * 1000
      const dataExcel = new Date((numeroData - 25569) * 86400 * 1000);
      return dataExcel.toISOString().split('T')[0]; // YYYY-MM-DD
    }
    if (typeof numeroData === 'string' && numeroData.includes('-')) {
      return numeroData; // Já está no formato correto
    }
    return numeroData;
  }

  /**
   * Lê e processa dados do extrato bancário
   */
  static lerExtratoBancario(caminhoArquivo) {
    try {
      console.log('🏦 Lendo extrato bancário...');
      
      const workbook = XLSX.readFile(caminhoArquivo);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      const dados = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        range: 0
      });
      
      console.log(`📊 Total de linhas no extrato: ${dados.length}`);
      
      // Processar dados (pular header)
      const transacoes = [];
      for (let i = 1; i < dados.length; i++) {
        const [tipo, data, valor, descricao, id, checksum] = dados[i];
        
        // Pular linhas vazias
        if (!tipo || !data) continue;
        
        // CORREÇÃO: Converter a data ANTES de criar a transação
        const dataConvertida = this.converterDataExcel(data);
        
        const transacao = Transacao.fromExtrato({
          tipo,
          data: dataConvertida, // Usar a data já convertida
          valor,
          descricao,
          id
        });
        
        transacoes.push(transacao);
      }
      
      console.log(`✅ Extrato processado: ${transacoes.length} transações`);
      return transacoes;
      
    } catch (error) {
      console.error(`❌ Erro ao ler extrato bancário:`, error.message);
      throw new Error(`Falha na leitura do extrato: ${error.message}`);
    }
  }

  /**
   * Lê e processa dados do sistema
   */
  static lerDadosSistema(caminhoArquivo) {
    try {
      console.log('💻 Lendo dados do sistema...');
      
      const workbook = XLSX.readFile(caminhoArquivo);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      const dados = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        range: 0
      });
      
      console.log(`📊 Total de linhas no sistema: ${dados.length}`);
      
      // Processar dados (pular header)
      const transacoes = [];
      for (let i = 1; i < dados.length; i++) {
        const [situacao, data, clienteFornecedor, categoria, valor, tipo] = dados[i];
        
        // Pular linhas vazias
        if (!tipo || !data) continue;
        
        // CORREÇÃO: Converter a data ANTES de criar a transação
        const dataConvertida = this.converterDataExcel(data);
        
        const transacao = Transacao.fromSistema({
          situacao,
          data: dataConvertida, // Usar a data já convertida
          'Cliente ou Fornecedor (Nome Fantasia)': clienteFornecedor,
          categoria,
          valor,
          tipo
        });
        
        transacoes.push(transacao);
      }
      
      console.log(`✅ Sistema processado: ${transacoes.length} transações`);
      return transacoes;
      
    } catch (error) {
      console.error(`❌ Erro ao ler dados do sistema:`, error.message);
      throw new Error(`Falha na leitura dos dados do sistema: ${error.message}`);
    }
  }
}

module.exports = ExcelService;