import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import InstantAnalysis from './InstantAnalysis.tsx';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
createRoot(document.getElementById('root')!).render(
  <BrowserRouter>

  <StrictMode>
  <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
  <Routes>
    <Route path="/" element={ <App />} />
    <Route path="/instant-analysis" element={ <InstantAnalysis />} />
    </Routes>
  </StrictMode>
  </BrowserRouter>

);
