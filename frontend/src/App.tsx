import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import MainPage from './pages/MainPage'; // Assuming you have this page
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import 'bootstrap/dist/css/bootstrap.min.css';
import ChatPage from './pages/ChatPage';  // Import the ChatPage component
import SyUploadPage from './pages/SyUploadPage';
import CoursePage from './pages/CoursePage';
import QuizPage from './pages/QuizPage';
import UserSettings from './pages/UserSettings';


const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Redirect root path to /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        {/* Login Route */}
        <Route path="/login" element={<LoginPage />} />
        {/* Register Route */}
        <Route path="/register" element={<RegisterPage />} />
        {/* Verify Email Route */}
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        {/* Main Page Route */}
        <Route path="/main" element={<MainPage />} /> {}
        <Route path="/chat" element={<ChatPage />} /> {}
        <Route path="/upload" element={<SyUploadPage />} />
        <Route path="/course/:classID" element={<CoursePage />} />
        <Route path="/course/:classID/:chapterID" element={<QuizPage />} />
        <Route path="/settings" element={<UserSettings />} />

      </Routes>
    </Router>
  );
};

export default App;