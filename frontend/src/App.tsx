import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SecurityScanPage from './pages/SecurityScanPage';
import SecurityEventsPage from './pages/SecurityEventsPage';
import AIAnalysisPage from './pages/AIAnalysisPage';
import AnalyticsPage from './pages/AnalyticsPage';
import CompliancePage from './pages/CompliancePage';
import IncidentsPage from './pages/IncidentsPage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="scans" element={<SecurityScanPage />} />
            <Route path="events" element={<SecurityEventsPage />} />
            <Route path="incidents" element={<IncidentsPage />} />
            <Route path="ai-analysis" element={<AIAnalysisPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="compliance" element={<CompliancePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
