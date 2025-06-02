// src/main.tsx - ИСПРАВЛЕНО: добавлен Mantine UI Provider

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// ✅ ДОБАВЛЕНО: импорты Mantine UI
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';

import App from './App.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* ✅ ДОБАВЛЕНО: обернули в MantineProvider */}
    <MantineProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </MantineProvider>
  </React.StrictMode>
);
