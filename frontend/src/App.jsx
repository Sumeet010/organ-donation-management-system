import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Web3Provider } from './context/Web3Context';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import NetworkAlert from './components/NetworkAlert';
import Home from './pages/Home';
import DonorRegistration from './pages/DonorRegistration';
import RecipientRequest from './pages/RecipientRequest';
import AdminDashboard from './pages/AdminDashboard';
import AuditTrail from './pages/AuditTrail';

function App() {
  return (
    <Web3Provider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
          <NetworkAlert />
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/donor" element={<DonorRegistration />} />
              <Route path="/recipient" element={<RecipientRequest />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/audit" element={<AuditTrail />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </Web3Provider>
  );
}

export default App;
