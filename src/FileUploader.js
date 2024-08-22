import React, { useState } from 'react';
import axios from 'axios';

const FileUploader = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setUploadProgress(0); // Reset progress
  };

  const handleUploadAndProcessFile = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    try {
      const filename = `uploads/${Date.now()}_${selectedFile.name}`;

      // Step 1: Generate Signed URL
      const signedUrlResponse = await axios.get('http://localhost:3001/generateSignedUrl', {
        params: { filename },
      });

      const uploadUrl = signedUrlResponse.data.url;
      console.log('Signed URL:', uploadUrl);

      // Step 2: Upload File to MinIO with Progress Tracking
      const uploadResponse = await axios.put(uploadUrl, selectedFile, {
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      if (uploadResponse.status === 200) {
        setUploadStatus('File uploaded successfully');
        console.log('File uploaded successfully');

        // Step 3: Trigger Backend Processing with the Same Filename
        const processResponse = await axios.post('http://localhost:3001/processUploadedFile', {
          filename,
        });

        if (processResponse.status === 200) {
          setUploadStatus('File has been uploaded and queued for processing');
          console.log('File has been uploaded and queued for processing');
        }
      }
    } catch (error) {
      console.error('Error during file upload and processing:', error);
      setUploadStatus('Error during file upload and processing');
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>File Uploader</h2>
      <input type="file" onChange={handleFileChange} style={styles.fileInput} />
      <br />
      <button onClick={handleUploadAndProcessFile} disabled={!selectedFile} style={styles.button}>
        Upload and Process File
      </button>
      <br />
      {uploadProgress > 0 && (
        <div style={styles.progressContainer}>
          <div style={{ ...styles.progressBar, width: `${uploadProgress}%` }} />
        </div>
      )}
      {uploadStatus && <p style={styles.status}>{uploadStatus}</p>}
    </div>
  );
};


const styles = {
  container: {
    maxWidth: '400px',
    margin: '50px auto',
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    fontFamily: 'Arial, sans-serif',
  },
  heading: {
    marginBottom: '20px',
    color: '#333',
  },
  fileInput: {
    marginBottom: '20px',
    padding: '10px',
    fontSize: '16px',
  },
  button: {
    padding: '10px 20px',
    fontSize: '16px',
    color: '#fff',
    backgroundColor: '#007BFF',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  progressContainer: {
    width: '100%',
    backgroundColor: '#f3f3f3',
    borderRadius: '5px',
    marginTop: '10px',
  },
  progressBar: {
    height: '10px',
    backgroundColor: '#4caf50',
    borderRadius: '5px',
  },
  status: {
    marginTop: '20px',
    fontSize: '14px',
    color: '#333',
  },
};

export default FileUploader;
