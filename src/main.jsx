// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import './assets/grayscale.css';

import { GameSettingsProvider } from './context/GameSettingsContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <GameSettingsProvider>
        <App />
      </GameSettingsProvider>
    </BrowserRouter>
  </React.StrictMode>
);
