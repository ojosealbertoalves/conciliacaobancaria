/**
 * Modelo para representar uma transação bancária
 */
class Transacao {
  constructor(data) {
    this.tipo = data.tipo; // 'CREDIT' ou 'DEBIT'
    this.data = data.data; // Data da transação
    this.valor = data.valor; // Valor da transação
    this.descricao = data.descricao; // Descrição da transação
    this.origem = data.origem; // 'EXTRATO' ou 'SISTEMA'
    this.id = data.id || null; // ID único (quando disponível)
    this.categoria = data.categoria || null; // Categoria (do sistema)
    this.situacao = data.situacao || null; // Situação (do sistema)
  }

  /**
   * Converte a data para formato YYYY-MM-DD para agrupamento
   */
  getDataFormatada() {
    const date = new Date(this.data);
    return date.toISOString().split('T')[0];
  }

  /**
   * Retorna valor absoluto (sempre positivo)
   */
  getValorAbsoluto() {
    return Math.abs(this.valor);
  }

  /**
   * Verifica se é uma transação de crédito
   */
  isCredito() {
    return this.tipo === 'CREDIT';
  }

  /**
   * Verifica se é uma transação de débito
   */
  isDebito() {
    return this.tipo === 'DEBIT';
  }

  /**
   * Cria chave única para comparação (data + tipo)
   */
  getChaveAgrupamento() {
    return `${this.getDataFormatada()}_${this.tipo}`;
  }

  /**
   * Converte para objeto simples para relatórios
   */
  toReportObject() {
    return {
      data: this.getDataFormatada(),
      tipo: this.tipo,
      valor: this.valor,
      valorAbsoluto: this.getValorAbsoluto(),
      descricao: this.descricao,
      origem: this.origem,
      categoria: this.categoria,
      situacao: this.situacao,
      id: this.id
    };
  }

  /**
   * Cria uma transação a partir de dados do extrato bancário
   */
  static fromExtrato(row) {
    return new Transacao({
      tipo: row.tipo,
      data: row.data,
      valor: row.valor,
      descricao: row.descricao,
      id: row.id,
      origem: 'EXTRATO'
    });
  }

  /**
   * Cria uma transação a partir de dados do sistema
   */
  static fromSistema(row) {
    return new Transacao({
      tipo: row.tipo,
      data: row.data,
      valor: row.valor,
      descricao: row['Cliente ou Fornecedor (Nome Fantasia)'],
      categoria: row.categoria,
      situacao: row.situacao,
      origem: 'SISTEMA'
    });
  }
}

module.exports = Transacao;