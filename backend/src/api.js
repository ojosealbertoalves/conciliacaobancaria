const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const ExcelService = require('./services/ExcelService');
const ConciliacaoService = require('./services/ConciliacaoService');
const RelatorioService = require('./services/RelatorioService');

const app = express();
const PORT = process.env.PORT || 3001;

// Configurações básicas
app.use(cors());
app.use(express.json());

// Criar pasta para uploads temporários - USAR /tmp na Vercel
const uploadDir = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, '..', 'temp');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurar upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}_${timestamp}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.originalname.match(/\.(xlsx|xls)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos Excel são permitidos'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ROTA PRINCIPAL - Processar conciliação
app.post('/api/conciliar', upload.fields([
  { name: 'extrato', maxCount: 1 },
  { name: 'sistema', maxCount: 1 }
]), async (req, res) => {
  let arquivoExtrato = null;
  let arquivoSistema = null;
  let arquivoRelatorio = null;

  try {
    console.log('Iniciando conciliação via API...');

    if (!req.files || !req.files.extrato || !req.files.sistema) {
      return res.status(400).json({
        error: 'Você precisa enviar os dois arquivos: extrato e sistema'
      });
    }

    arquivoExtrato = req.files.extrato[0].path;
    arquivoSistema = req.files.sistema[0].path;

    console.log('Extrato:', req.files.extrato[0].originalname);
    console.log('Sistema:', req.files.sistema[0].originalname);

    const transacoesExtrato = ExcelService.lerExtratoBancario(arquivoExtrato);
    const transacoesSistema = ExcelService.lerDadosSistema(arquivoSistema);
    const resultado = ConciliacaoService.conciliar(transacoesExtrato, transacoesSistema);

    const nomeRelatorio = `relatorio_${Date.now()}.xlsx`;
    arquivoRelatorio = path.join(uploadDir, nomeRelatorio);
    
    RelatorioService.gerarRelatorioCompleto(resultado, arquivoRelatorio);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${nomeRelatorio}"`);
    
    const fileStream = fs.createReadStream(arquivoRelatorio);
    fileStream.pipe(res);

    fileStream.on('end', () => {
      setTimeout(() => {
        [arquivoExtrato, arquivoSistema, arquivoRelatorio].forEach(arquivo => {
          if (arquivo && fs.existsSync(arquivo)) {
            fs.unlinkSync(arquivo);
          }
        });
      }, 1000);
    });

    console.log('Conciliação concluída!');

  } catch (error) {
    console.error('Erro:', error.message);
    console.error('Stack:', error.stack);
    
    [arquivoExtrato, arquivoSistema, arquivoRelatorio].forEach(arquivo => {
      if (arquivo && fs.existsSync(arquivo)) {
        fs.unlinkSync(arquivo);
      }
    });
    
    res.status(500).json({
      error: 'Erro ao processar',
      message: error.message
    });
  }
});

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor apenas local
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log('API rodando em http://localhost:' + PORT);
  });
}

module.exports = app;