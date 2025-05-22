import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { GameEngineProvider } from './context/GameEngineProvider';

import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import './assets/grayscale.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <GameEngineProvider>
        <App />
      </GameEngineProvider>
    </BrowserRouter>
  </React.StrictMode>
);