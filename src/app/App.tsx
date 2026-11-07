import { RouterProvider } from 'react-router';
import { useState } from 'react';
import { AppProviders } from './providers/AppProviders';
import { createAppRouter } from './router';

export function App() {
  const [router] = useState(createAppRouter);
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
