import React from 'react';

function ProcessingStatus({ processing, result, error }) {
  if (!processing && !result && !error) {
    return null;
  }

  return (
    <div className="status-section">
      {processing && (
        <div className="status processing">
          <div className="loading-spinner"></div>
          <div className="status-content">
            <h3>⏳ Processando Conciliação</h3>
            <p>Aguarde enquanto analisamos os dados...</p>
            <div className="progress-steps">
              <div className="step">📖 Lendo arquivos Excel</div>
              <div className="step">🔍 Realizando conciliação</div>
              <div className="step">📊 Gerando relatório</div>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className={`status ${result.success ? 'success' : 'error'}`}>
          <div className="status-icon">
            {result.success ? '✅' : '❌'}
          </div>
          <div className="status-content">
            <h3>{result.success ? 'Conciliação Concluída!' : 'Erro na Conciliação'}</h3>
            <p>{result.message}</p>
            {result.success && (
              <div className="success-details">
                <p>📁 O arquivo foi baixado automaticamente</p>
                <p>📊 Verifique a pasta de downloads do seu navegador</p>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="status error">
          <div className="status-icon">❌</div>
          <div className="status-content">
            <h3>Erro no Processamento</h3>
            <p>{error}</p>
            <div className="error-help">
              <p><strong>Possíveis soluções:</strong></p>
              <ul>
                <li>Verifique se os arquivos estão no formato Excel (.xlsx ou .xls)</li>
                <li>Certifique-se de que os arquivos não estão corrompidos</li>
                <li>Verifique se o servidor backend está rodando</li>
                <li>Tente novamente com arquivos diferentes</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProcessingStatus;