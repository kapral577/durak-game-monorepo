// src/main.tsx - ИСПРАВЛЕНО: Bootstrap SCSS кастомизация

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// ✅ ЗАМЕНЕНО: импорт кастомного Bootstrap SCSS вместо Mantine
import './styles/custom-bootstrap.scss';

import App from './App.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* ✅ УБРАНО: MantineProvider не нужен для Bootstrap */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);