import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom';
import { AITutorProvider } from './context/AITutorContext.jsx';

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AITutorProvider>
        <App />
      </AITutorProvider>
    </BrowserRouter>
  </StrictMode>
);
