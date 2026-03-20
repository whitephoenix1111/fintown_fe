'use client';

import { ReactNode } from 'react';
import { Provider } from 'react-redux';
import store from '@/src/redux/store';
import TopLoader from 'nextjs-toploader';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      <TopLoader color="#25B770" height={4} showSpinner={false} />
      <Provider store={store}>
        {children}
      </Provider>
    </>
  );
}
