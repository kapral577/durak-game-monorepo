import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import './assets/grayscale.css';

import { GameSettingsProvider } from './context/GameSettingsContext';
import { GameEngineProvider } from './context/GameEngineProvider';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <GameSettingsProvider>
        <GameEngineProvider>
          <App />
        </GameEngineProvider>
      </GameSettingsProvider>
    </BrowserRouter>
  </React.StrictMode>
);
