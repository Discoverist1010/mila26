import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { WebsiteLanding } from './website/WebsiteLanding';
import './styles.css';

export function Root() {
  if (window.location.pathname === '/site') return <WebsiteLanding />;
  return <App />;
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
