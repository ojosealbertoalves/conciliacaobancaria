import React, { useState } from 'react';
import axios from 'axios';
import FileUpload from './components/FileUpload';
import ProcessingStatus from './components/ProcessingStatus';
import './App.css';

function App() {
  const [files, setFiles] = useState({
    extrato: null,
    sistema: null
  });
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (type, file) => {
    setFiles(prev => ({
      ...prev,
      [type]: file
    }));
    setError(null);
    setResult(null);
  };

  const handleConciliacao = async () => {
    if (!files.extrato || !files.sistema) {
      setError('Por favor, selecione ambos os arquivos antes de continuar');
      return;
    }

    setProcessing(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('extrato', files.extrato);
    formData.append('sistema', files.sistema);

    try {
      console.log('🚀 Enviando arquivos para API...');
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await axios.post(`${API_URL}/api/conciliar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'blob'
      });

      console.log('✅ Resposta recebida, criando download...');

      // Criar download do arquivo
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `relatorio_conciliacao_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(downloadUrl);

      setResult({
        success: true,
        message: 'Conciliação realizada com sucesso! O relatório foi baixado automaticamente.'
      });

      console.log('🎉 Conciliação concluída!');

    } catch (err) {
      console.error('❌ Erro na conciliação:', err);
      
      let errorMessage = 'Erro ao processar a conciliação. Verifique os arquivos e tente novamente.';
      
      if (err.response) {
        errorMessage = err.response.data?.message || errorMessage;
      } else if (err.request) {
        errorMessage = 'Não foi possível conectar com o servidor. Verifique se a API está rodando.';
      }
      
      setError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setFiles({ extrato: null, sistema: null });
    setResult(null);
    setError(null);
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>🏦 Sistema de Conferência Bancária Logzz</h1>
          <p>Faça upload das planilhas do extrato bancário e dados do sistema para gerar o relatório de conciliação</p>
        </header>

        <main className="main-content">
          <div className="upload-section">
            <FileUpload
              label="📊 Extrato Bancário"
              description="Selecione o arquivo Excel com os dados do extrato bancário"
              file={files.extrato}
              onFileSelect={(file) => handleFileSelect('extrato', file)}
              accept=".xlsx,.xls"
            />

            <FileUpload
              label="💻 Dados do Sistema"
              description="Selecione o arquivo Excel com os dados do sistema"
              file={files.sistema}
              onFileSelect={(file) => handleFileSelect('sistema', file)}
              accept=".xlsx,.xls"
            />
          </div>

          <div className="action-section">
            <button
              className={`btn-primary ${(!files.extrato || !files.sistema || processing) ? 'disabled' : ''}`}
              onClick={handleConciliacao}
              disabled={!files.extrato || !files.sistema || processing}
            >
              {processing ? '⏳ Processando...' : '🔄 Realizar Conciliação'}
            </button>

            {(files.extrato || files.sistema) && (
              <button
                className="btn-secondary"
                onClick={resetForm}
                disabled={processing}
              >
                🗑️ Limpar Arquivos
              </button>
            )}
          </div>

          <ProcessingStatus
            processing={processing}
            result={result}
            error={error}
          />
        </main>

        <footer className="footer">
          <p>
            📁 O relatório será baixado automaticamente após o processamento<br/>
            💡 Certifique-se de que os arquivos estão no formato Excel (.xlsx ou .xls)
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;