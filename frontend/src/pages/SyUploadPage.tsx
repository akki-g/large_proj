import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import NavBar from '../pages/NavBar'; 
import styles from './SyUploadPage.module.css'; // Import CSS module

const SyUploadPage: React.FC = () => {
  const [className, setClassName] = useState<string>('');
  const [classNumber, setClassNumber] = useState<string>('');
  const [syllabus, setSyllabus] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const navigate = useNavigate(); 

  const jwtToken = localStorage.getItem('token');

  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file size (20MB limit)
      if (file.size > 20 * 1024 * 1024) {
        setError('File is too large. Maximum size is 20MB.');
        return;
      }
      
      // Validate file type
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are allowed.');
        return;
      }
      
      setError(''); // Clear previous errors
      setSyllabus(file);
      console.log(`Selected file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!className || !classNumber || !syllabus || !jwtToken) {
      setError('All fields are required.');
      return;
    }

    setLoading(true);
    setError('');
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('name', className);
    formData.append('number', classNumber);
    formData.append('syllabus', syllabus);
    formData.append('jwtToken', jwtToken);

    try {
      // Log upload attempt
      console.log('Attempting upload:', {
        className,
        classNumber,
        fileName: syllabus.name,
        fileSize: `${(syllabus.size / 1024 / 1024).toFixed(2)}MB`,
        fileType: syllabus.type
      });

      const response = await axios.post(
        'https://api.scuba2havefun.xyz/api/classes/create',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000, // 60 second timeout
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            setUploadProgress(percentCompleted);
            console.log(`Upload progress: ${percentCompleted}%`);
          }
        }
      );

      alert('Class created successfully!');
      console.log('Response:', response.data);
      navigate('/main'); // Navigate to main page on success
    } catch (error: any) {
      console.error('Upload error details:', error);
      
      // Handle different error scenarios
      if (error.response) {
        // The server responded with a status code outside the 2xx range
        console.error('Server response error:', error.response.data);
        
        if (error.response.status === 413) {
          setError('File is too large for the server to process. Please use a smaller file (under 20MB).');
        } else {
          setError(`Server error: ${error.response.data.message || error.response.statusText || 'Unknown error'}`);
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        setError('No response from server. Please check your internet connection and try again.');
      } else {
        // Something happened in setting up the request
        console.error('Request setup error:', error.message);
        setError(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Navigate back to main page
  const handleBackToMain = () => {
    navigate('/main');
  };

  return (
    <div>
      <NavBar />
      <div className={styles.syContainer}>
        <div className={styles.syCard}>
          <h2 className={styles.syName}>Create New Class</h2>
          
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className={styles.syForm}>
            <input
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="Enter class name"
              className={styles.syInput}
              required
              disabled={loading}
            />

            <input
              type="text"
              value={classNumber}
              onChange={(e) => setClassNumber(e.target.value)}
              placeholder="Enter class number"
              className={styles.syInput}
              required
              disabled={loading}
            />

            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className={styles.syInput}
              required
              disabled={loading}
            />
            
            {syllabus && (
              <div className={styles.fileInfo}>
                Selected file: {syllabus.name} ({(syllabus.size / 1024 / 1024).toFixed(2)}MB)
              </div>
            )}
            
            {loading && uploadProgress > 0 && (
              <div className={styles.progressContainer}>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <div className={styles.progressText}>
                  {uploadProgress}%
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button type="submit" className={styles.syButton} disabled={loading}>
              {loading ? 'Creating...' : 'Create Class'}
            </button>

            {/* Back to Main Button */}
            <button
              type="button"
              onClick={handleBackToMain}
              className={styles.syBackToMainButton}
              disabled={loading}
            >
              ← Back to Main
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SyUploadPage;