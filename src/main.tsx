// src/main.tsx - ИСПРАВЛЕНО: правильный порядок импортов

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// ✅ ПЕРВЫМ: базовые стили Telegram
import './index.css';

// ✅ ПОСЛЕДНИМ: кастомный Bootstrap (приоритет)
import './styles/custom-bootstrap.scss';

import App from './App.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
