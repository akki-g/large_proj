import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import MainPage from './pages/MainPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import 'bootstrap/dist/css/bootstrap.min.css';
import ChatPage from './pages/ChatPage';
import SyUploadPage from './pages/SyUploadPage';
import CoursePage from './pages/CoursePage';
import QuizPage from './pages/QuizPage';
import UserSettings from './pages/UserSettings';
import ProtectedRoute from '../src/ProtectedRoute';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Redirect root path to /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Public routes - no token required */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        {/* Protected routes - token required */}
        <Route path="/main" element={<ProtectedRoute><MainPage /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute><SyUploadPage /></ProtectedRoute>} />
        <Route path="/course/:classID" element={<ProtectedRoute><CoursePage /></ProtectedRoute>} />
        <Route path="/course/:classID/:chapterID" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><UserSettings /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
};

export default App;