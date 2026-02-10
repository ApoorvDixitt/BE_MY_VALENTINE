import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import LandingPage from './pages/LandingPage';
import FlowPage from './pages/FlowPage';
import GeneratingPage from './pages/GeneratingPage';
import CompletePage from './pages/CompletePage';
import LetterViewPage from './pages/LetterViewPage';
import PaymentReturnPage from './pages/PaymentReturnPage';
import MusicToggle from './components/MusicToggle';
import { Toaster } from './components/ui/sonner';
import './App.css';

// Flow context to share data between steps
export const FlowContext = createContext();

export function FlowProvider({ children }) {
  const [flowData, setFlowData] = useState(() => {
    const saved = localStorage.getItem('unsent-valentine-flow');
    if (saved) {
      try { return JSON.parse(saved); } catch { return {}; }
    }
    return {};
  });

  const updateFlow = (data) => {
    setFlowData(prev => {
      const updated = { ...prev, ...data };
      localStorage.setItem('unsent-valentine-flow', JSON.stringify(updated));
      return updated;
    });
  };

  const resetFlow = () => {
    setFlowData({});
    localStorage.removeItem('unsent-valentine-flow');
  };

  return (
    <FlowContext.Provider value={{ flowData, updateFlow, resetFlow }}>
      {children}
    </FlowContext.Provider>
  );
}

export function useFlow() {
  return useContext(FlowContext);
}

function AppContent() {
  const location = useLocation();

  return (
    <div className="App min-h-screen bg-background">
      <MusicToggle />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/flow/:step" element={<FlowPage />} />
          <Route path="/flow/generating/:orderId" element={<GeneratingPage />} />
          <Route path="/flow/complete/:orderId" element={<CompletePage />} />
          <Route path="/flow/payment-return" element={<PaymentReturnPage />} />
          <Route path="/letter/:type/:token" element={<LetterViewPage />} />
        </Routes>
      </AnimatePresence>
      <Toaster position="bottom-center" />
    </div>
  );
}

function App() {
  return (
    <Router>
      <FlowProvider>
        <AppContent />
      </FlowProvider>
    </Router>
  );
}

export default App;
