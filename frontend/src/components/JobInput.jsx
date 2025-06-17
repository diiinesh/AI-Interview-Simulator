import React, { useState, useRef, useCallback, useEffect } from 'react';

// Constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const FILE_READ_TIMEOUT = 30000; // 30 seconds

// Helper functions
const validateFile = (file) => {
  if (!file) return { valid: false, error: 'No file selected' };
  if (file.type !== 'application/pdf') return { valid: false, error: 'Please select a PDF file' };
  if (file.size > MAX_FILE_SIZE) return { valid: false, error: 'File too large (max 10MB)' };
  return { valid: true };
};

const formatFileSize = (bytes) => (bytes / 1024 / 1024).toFixed(2);

const isWebSocketReady = () => window.ws?.readyState === WebSocket.OPEN;

function JobInput() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const readerRef = useRef(null);
  const timeoutRef = useRef(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (readerRef.current?.readyState === FileReader.LOADING) {
      readerRef.current.abort();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setFile(null);
    setFileName('');
    setIsUploading(false);
    readerRef.current = null;
  }, []);

  // File selection handler
  const handleFileSelect = useCallback((e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const validation = validateFile(selectedFile);
    if (!validation.valid) {
      setUploadStatus(`❌ ${validation.error}`);
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setUploadStatus('');
  }, []);

  // File reading with promise
  const readFileAsBase64 = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      readerRef.current = reader;

      reader.onload = () => {
        if (reader.readyState !== FileReader.DONE) {
          reject(new Error('FileReader not in DONE state'));
          return;
        }

        const result = reader.result;
        if (!result || typeof result !== 'string' || !result.startsWith('data:')) {
          reject(new Error('Invalid file data format'));
          return;
        }

        const base64 = result.split(',')[1];
        if (!base64) {
          reject(new Error('Failed to extract base64 data'));
          return;
        }

        resolve(base64);
      };

      reader.onerror = () => reject(new Error('Error reading file'));
      reader.onabort = () => reject(new Error('File reading was aborted'));

      // Set timeout
      timeoutRef.current = setTimeout(() => {
        if (reader.readyState === FileReader.LOADING) {
          reader.abort();
          reject(new Error('File reading timed out'));
        }
      }, FILE_READ_TIMEOUT);

      reader.readAsDataURL(file);
    });
  }, []);

  // Upload handler
  const handleUpload = useCallback(async () => {
    if (!file || isUploading) return;

    if (!isWebSocketReady()) {
      setUploadStatus('❌ WebSocket not connected');
      return;
    }

    setIsUploading(true);
    setUploadStatus('🔄 Processing file...');

    try {
      const base64Content = await readFileAsBase64(file);
      
      const payload = {
        type: 'job_context_pdf',
        filename: file.name,
        content: base64Content
      };

      // Double-check WebSocket is still connected
      if (!isWebSocketReady()) {
        throw new Error('WebSocket disconnected during processing');
      }

      window.ws.send(JSON.stringify(payload));
      setUploadStatus(`✅ Sent PDF: ${file.name}`);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus(`❌ Failed to upload: ${error.message}`);
    } finally {
      cleanup();
    }
  }, [file, isUploading, readFileAsBase64, cleanup]);

  // Cleanup on unmount
  useEffect(() => cleanup, [cleanup]);

  // Status message styling
  const getStatusStyle = (status) => ({
    marginTop: '8px',
    color: status.includes('✅') ? 'green' : 
           status.includes('❌') ? 'red' : 
           status.includes('🔄') ? 'blue' : 'green'
  });

  return (
    <div style={{ marginBottom: '20px' }}>
      <h4>Job Posting PDF</h4>
      <p style={{ fontSize: '0.9em', color: '#666' }}>
        💡 Please upload a PDF version of the job posting. On most job platforms, 
        you can click "Print" and select "Save as PDF".
      </p>
      
      <input
        type="file"
        accept="application/pdf"
        onChange={handleFileSelect}
        disabled={isUploading}
        style={{ marginBottom: '10px' }}
      />
      
      {fileName && (
        <p style={{ marginTop: '6px', marginBottom: '10px' }}>
          📄 Selected: <strong>{fileName}</strong>
          {file && ` (${formatFileSize(file.size)} MB)`}
        </p>
      )}
      
      <button
        onClick={handleUpload}
        disabled={!file || isUploading}
        style={{ 
          padding: '8px 16px',
          backgroundColor: (!file || isUploading) ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: (!file || isUploading) ? 'not-allowed' : 'pointer',
          fontSize: '14px'
        }}
      >
        {isUploading ? 'Processing...' : 'Upload PDF'}
      </button>
      
      {uploadStatus && (
        <p style={getStatusStyle(uploadStatus)}>
          {uploadStatus}
        </p>
      )}
    </div>
  );
}

export default JobInput;