import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TenantProvider } from './shared/contexts/TenantContext';
import { AuthProvider } from './domains/auth/contexts/AuthContext';
import { UserProvider } from './domains/auth/contexts/UserContext';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <TenantProvider>
        <UserProvider>
          <App />
        </UserProvider>
      </TenantProvider>
    </AuthProvider>
  </StrictMode>
);
