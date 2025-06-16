import React, { useState } from 'react';

function JobInput() {
  const [jobUrl, setJobUrl] = useState('');
  const [file, setFile] = useState(null);

  const handleSend = () => {
    if (jobUrl) {
      // Send the job URL via WebSocket or HTTP POST (your backend should handle this)
      const payload = { type: 'job_context', url: jobUrl };
      window.ws?.send(JSON.stringify(payload));
    }

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        const payload = {
          type: 'job_context_pdf',
          filename: file.name,
          content: base64
        };
        window.ws?.send(JSON.stringify(payload));
      };
      reader.readAsDataURL(file);
    }

    setJobUrl('');
    setFile(null);
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <h4>Job Posting</h4>
      <input
        type="text"
        value={jobUrl}
        onChange={e => setJobUrl(e.target.value)}
        placeholder="Paste job posting URL"
        style={{ width: '60%' }}
      />
      <input
        type="file"
        accept=".pdf"
        onChange={e => setFile(e.target.files[0])}
        style={{ marginLeft: '10px' }}
      />
      <button onClick={handleSend} style={{ marginLeft: '10px' }}>
        Submit
      </button>
    </div>
  );
}

export default JobInput;
