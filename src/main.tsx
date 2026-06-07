import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

const App = lazy(() => import('./App').then((module) => ({ default: module.App })));
const WebsiteLanding = lazy(() =>
  import('./website/WebsiteLanding').then((module) => ({ default: module.WebsiteLanding })),
);

export function Root() {
  const isWebsiteRoute = window.location.pathname === '/site';
  const route = isWebsiteRoute ? <WebsiteLanding /> : <App />;
  const loadingName = isWebsiteRoute ? 'ZiLiOS' : 'MILA26';

  return <Suspense fallback={<main aria-label={`${loadingName} loading`}>Loading {loadingName}...</main>}>{route}</Suspense>;
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
