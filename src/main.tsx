import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

const App = lazy(() => import('./App').then((module) => ({ default: module.App })));
const WebsiteLanding = lazy(() =>
  import('./website/WebsiteLanding').then((module) => ({ default: module.WebsiteLanding })),
);

export function Root() {
  const route = window.location.pathname === '/site' ? <WebsiteLanding /> : <App />;

  return <Suspense fallback={<main aria-label="MILA26 loading">Loading MILA26...</main>}>{route}</Suspense>;
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
