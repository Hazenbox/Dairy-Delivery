import '../styles/globals.css';
import '@fontsource/geist-sans/400.css';
import '@fontsource/geist-sans/500.css';
import '@fontsource/geist-sans/600.css';
import '@fontsource/geist-sans/700.css';
import '@fontsource/geist-mono/400.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { AuthProvider } from '@/lib/auth';

export default function App({ Component, pageProps }: AppProps) {
  const initializeStore = useAppStore((state) => state.initializeStore);

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  return (
    <>
      <Head>
        <title>Dairy Friend</title>
        <meta name="description" content="Mobile PWA for dairy business management" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#008060" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="DairyPro" />
        <link rel="icon" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      
      <AuthProvider>
        <div className="font-sans">
          <Component {...pageProps} />
        </div>
      </AuthProvider>
    </>
  );
} 