import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Landing from './pages/Landing';
import About from './pages/About';
import Login from './pages/Login';
import DashboardLayout from './pages/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Finance from './pages/Finance';
import Donors from './pages/Donors';
import Programs from './pages/Programs';
import PublicLedger from './pages/PublicLedger';
import Verify from './pages/Verify';
import Guide from './pages/Guide';
import HowItWorks from './pages/HowItWorks';
import SolanaAnchor from './pages/SolanaAnchor';
import ActivityLog from './pages/ActivityLog';

function ProtectedRoute({ children }) {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;
    return children;
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/dashboard" element={
                        <ProtectedRoute>
                            <DashboardLayout />
                        </ProtectedRoute>
                    }>
                        <Route index element={<Dashboard />} />
                        <Route path="finance" element={<Finance />} />
                        <Route path="donors" element={<Donors />} />
                        <Route path="programs" element={<Programs />} />
                        <Route path="guide" element={<Guide />} />
                        <Route path="solana" element={<SolanaAnchor />} />
                        <Route path="activity" element={<ActivityLog />} />
                    </Route>
                    <Route path="/public" element={<PublicLedger />} />
                    <Route path="/public/how-it-works" element={<HowItWorks />} />
                    <Route path="/public/verify" element={<Verify />} />
                    <Route path="/public/verify/:txId" element={<Verify />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
