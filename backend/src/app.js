const path = require('path');
const fs = require('fs');
require('colors');
const ExcelService = require('./services/ExcelService');
const ConciliacaoService = require('./services/ConciliacaoService');
const RelatorioService = require('./services/RelatorioService');

/**
 * Aplicação principal de conciliação bancária
 */
class ConciliacaoBancaria {
  constructor() {
    this.caminhoInput = path.join(__dirname, '..', 'data', 'input');
    this.caminhoOutput = path.join(__dirname, '..', 'data', 'output');
    this.arquivoExtrato = path.join(this.caminhoInput, 'extrato_banco.xlsx');
    this.arquivoSistema = path.join(this.caminhoInput, 'dados_sistema.xlsx');
    this.arquivoRelatorio = path.join(this.caminhoOutput, 'relatorio_conciliacao_completa.xlsx');
  }

  /**
   * Executa o processo completo de conciliação
   */
  async executar() {
    try {
      console.log('🚀 Iniciando aplicação de conciliação bancária...'.cyan.bold);
      console.log('='.repeat(60));
      
      // 1. Validações iniciais
      this.validarArquivos();
      this.criarDiretorioOutput();
      
      // 2. Leitura dos dados
      console.log('\n📖 Carregando dados...'.yellow);
      const transacoesExtrato = ExcelService.lerExtratoBancario(this.arquivoExtrato);
      const transacoesSistema = ExcelService.lerDadosSistema(this.arquivoSistema);
      
      // 3. Processo de conciliação
      console.log('\n🔍 Realizando conciliação...'.yellow);
      const resultadoConciliacao = ConciliacaoService.conciliar(transacoesExtrato, transacoesSistema);
      
      // 4. Geração de relatórios
      console.log('\n📊 Gerando relatórios...'.yellow);
      RelatorioService.gerarRelatorioCompleto(resultadoConciliacao, this.arquivoRelatorio);
      
      // 5. Resumo final
      this.exibirResumoFinal(resultadoConciliacao);
      
      console.log('\n✅ Processo concluído com sucesso!'.green.bold);
      console.log(`📁 Relatório salvo em: ${this.arquivoRelatorio}`.green);
      console.log('='.repeat(60));
      
    } catch (error) {
      console.error('\n❌ Erro durante a execução:'.red.bold, error.message);
      process.exit(1);
    }
  }

  /**
   * Valida se os arquivos de entrada existem
   */
  validarArquivos() {
    console.log('🔍 Validando arquivos de entrada...'.yellow);
    
    try {
      if (!fs.existsSync(this.arquivoExtrato)) {
        throw new Error(`Arquivo não encontrado: ${this.arquivoExtrato}`);
      }
      
      if (!fs.existsSync(this.arquivoSistema)) {
        throw new Error(`Arquivo não encontrado: ${this.arquivoSistema}`);
      }
      
      console.log(`   ✅ Extrato bancário: ${path.basename(this.arquivoExtrato)}`.green);
      console.log(`   ✅ Dados do sistema: ${path.basename(this.arquivoSistema)}`.green);
      
    } catch (error) {
      throw new Error(`Validação de arquivos falhou: ${error.message}`);
    }
  }

  /**
   * Cria diretório de output se não existir
   */
  criarDiretorioOutput() {
    if (!fs.existsSync(this.caminhoOutput)) {
      fs.mkdirSync(this.caminhoOutput, { recursive: true });
      console.log(`📁 Diretório de saída criado: ${this.caminhoOutput}`.yellow);
    }
  }

  /**
   * Exibe resumo final da conciliação
   */
  exibirResumoFinal(resultado) {
    const totalDias = resultado.resumoGeral.length;
    const diasConciliados = resultado.resumoGeral.filter(r => r.status === 'CONCILIADO').length;
    const diasComDiferenca = totalDias - diasConciliados;
    const taxaConciliacao = ((diasConciliados / totalDias) * 100).toFixed(1);
    
    console.log('\n📋 RESUMO FINAL DA CONCILIAÇÃO'.cyan.bold);
    console.log('-'.repeat(40));
    console.log(`📅 Período analisado: ${totalDias} dias`);
    console.log(`✅ Dias conciliados: ${diasConciliados} (${taxaConciliacao}%)`);
    console.log(`⚠️  Dias com diferenças: ${diasComDiferenca}`);
    console.log(`➕ Para incluir no sistema: ${resultado.incluirNoSistema.length} lançamentos`);
    console.log(`➖ Para excluir do sistema: ${resultado.excluirDoSistema.length} lançamentos`);
    
    if (diasComDiferenca === 0) {
      console.log('\n🎉 PARABÉNS! Todas as datas estão conciliadas!'.green.bold);
    } else {
      console.log(`\n⚠️  ${diasComDiferenca} dias necessitam de ajustes`.yellow);
    }
  }
}

/**
 * Função principal - ponto de entrada da aplicação
 */
async function main() {
  const app = new ConciliacaoBancaria();
  await app.executar();
}

// Executar apenas se este arquivo for chamado diretamente
if (require.main === module) {
  main().catch(error => {
    console.error('\n💥 Erro fatal:'.red.bold, error.message);
    process.exit(1);
  });
}

module.exports = ConciliacaoBancaria;