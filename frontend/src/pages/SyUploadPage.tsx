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
  const navigate = useNavigate(); 

  const jwtToken = localStorage.getItem('token');


  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSyllabus(e.target.files[0]);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!className || !classNumber || !syllabus || !jwtToken) {
      alert('All fields are required.');
      return;
    }

    setLoading(true);

  

    const formData = new FormData();
    formData.append('name', className);
    formData.append('number', classNumber);
    formData.append('syllabus', syllabus);
    formData.append('jwtToken', jwtToken);

    try {
      const response = await axios.post(
        'https://api.scuba2havefun.xyz/api/classes/create',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      alert('Class created successfully!');
      console.log('Response:', response.data);
    } catch (error) {
      alert('Error creating class.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Navigate back to main page
  const handleBackToMain = () => {
    navigate('/main'); // Navigate to MainPage
  };

  return (
    <div>
      <NavBar />
      <div className={styles.syContainer}>
        <div className={styles.syCard}>
          <h2 className={styles.syName}>Create New Class</h2>
          <form onSubmit={handleSubmit} className={styles.syForm}>
            <input
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="Enter class name"
              className={styles.syInput}
              required
            />

            <input
              type="text"
              value={classNumber}
              onChange={(e) => setClassNumber(e.target.value)}
              placeholder="Enter class number"
              className={styles.syInput}
              required
            />

            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className={styles.syInput}
              required
            />

            {/* Submit Button */}
            <button type="submit" className={styles.syButton} disabled={loading}>
              {loading ? 'Creating...' : 'Create Class'}
            </button>

            {/* Back to Main Button */}
            <button
              type="button"
              onClick={handleBackToMain}
              className={styles.syBackToMainButton}
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