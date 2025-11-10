import React, { useRef } from 'react';

function FileUpload({ label, description, file, onFileSelect, accept }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.match(/\.(xlsx|xls)$/i)) {
      onFileSelect(droppedFile);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="file-upload">
      <h3>{label}</h3>
      <p className="description">{description}</p>
      
      <div 
        className={`upload-area ${file ? 'has-file' : ''}`}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        
        {file ? (
          <div className="file-info">
            <div className="file-icon">📎</div>
            <div className="file-details">
              <div className="file-name">{file.name}</div>
              <div className="file-size">{formatFileSize(file.size)}</div>
            </div>
            <div className="file-status">✅ Pronto</div>
          </div>
        ) : (
          <div className="upload-placeholder">
            <div className="upload-icon">📁</div>
            <div className="upload-text">
              <strong>Clique aqui ou arraste o arquivo</strong>
              <br />
              Formatos aceitos: .xlsx, .xls
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FileUpload;