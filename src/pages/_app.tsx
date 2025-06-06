import type { AppProps } from 'next/app';
import Head from 'next/head';
import { Providers } from '@/lib/providers';
import Header from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/ui/cart-drawer';
import { cn } from '@/lib/utils';
import { geistSans, geistMono, playfair } from '@/lib/fonts';
import { useRouter } from 'next/router';
import '@/styles/globals.css';
import { useEffect, useState } from 'react';
import { ThemeProvider, useTheme } from 'next-themes';
import { LanguageProvider } from "@/lib/LanguageContext";
import { Inter } from 'next/font/google';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { Suspense, lazy } from 'react';
import { registerServiceWorker } from '@/lib/registerServiceWorker';

// Load dynamic components with proper code splitting
const ErrorFallback = lazy(() => import('@/components/ui/ErrorFallback'));

// Use system font with fallbacks for better performance
const inter = Inter({ 
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  weight: ['400', '500', '600', '700'],
  display: 'swap', // Ensure text remains visible during webfont load
  variable: '--font-inter',
});

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const canonicalUrl = `https://elispavlova.com${router.asPath}`;
  const title = "Elis Pavlova - Personal Development & Creative Writing";
  const description = "Join Elis Pavlova's transformative journey through creative writing, personal development workshops, and professional consultations. Discover your creative potential today.";
  const [mounted, setMounted] = useState(false);

  // Hydration fix
  useEffect(() => {
    setMounted(true);
    
    // Register service worker for production environments
    registerServiceWorker();
  }, []);

  return (
    <ErrorBoundary 
      FallbackComponent={({ error, resetErrorBoundary }) => (
        <div className="flex min-h-screen flex-col">
          <Header />
          <Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading error handler...</div>}>
            <ErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />
          </Suspense>
          <Footer />
        </div>
      )}
      onReset={() => {
        // Reset application state here if needed
        window.location.href = '/';
      }}
    >
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <LanguageProvider>
          <Providers>
            <Head>
              {/* Essential Meta Tags */}
              <meta charSet="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <meta name="theme-color" content="#10B981" />
              
              {/* Override z-index for navigation dropdowns */}
              <style dangerouslySetInnerHTML={{ 
                __html: `
                  /* Dropdown z-index fix */
                  .dropdown-content {
                    z-index: 9999 !important;
                  }
                  .dropdown-container {
                    position: relative !important;
                  }
                  .dropdown-container:hover {
                    z-index: 9999 !important;
                  }
                  .hero-section {
                    z-index: 0 !important;
                  }
                  #header-wrapper {
                    z-index: 9999 !important;
                  }
                `
              }} />
              
              {/* Primary Meta Tags */}
              <title>{title}</title>
              <meta name="title" content={title} />
              <meta name="description" content={description} />
              <meta name="author" content="Elis Pavlova" />
              <meta name="keywords" content="personal development, creative writing, workshops, consultations, professional development, writing skills, self-improvement" />
              
              {/* Open Graph / Facebook */}
              <meta property="og:type" content="website" />
              <meta property="og:url" content={canonicalUrl} />
              <meta property="og:title" content={title} />
              <meta property="og:description" content={description} />
              <meta property="og:image" content="https://elispavlova.com/og-image.jpg" />
              <meta property="og:site_name" content="Elis Pavlova" />
              <meta property="og:locale" content="en_US" />

              {/* Twitter */}
              <meta name="twitter:card" content="summary_large_image" />
              <meta name="twitter:url" content={canonicalUrl} />
              <meta name="twitter:title" content={title} />
              <meta name="twitter:description" content={description} />
              <meta name="twitter:image" content="https://elispavlova.com/og-image.jpg" />
              <meta name="twitter:creator" content="@elispavlova" />

              {/* Canonical URL */}
              <link rel="canonical" href={canonicalUrl} />
              
              {/* Indexing directives */}
              <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
              <meta name="googlebot" content="index, follow" />
              
              {/* Additional SEO */}
              <meta name="format-detection" content="telephone=no" />
              <meta name="apple-mobile-web-app-capable" content="yes" />
              <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
            </Head>
            <div className={cn(
              geistSans.variable, 
              geistMono.variable, 
              playfair.variable, 
              "min-h-screen flex flex-col antialiased bg-white dark:bg-gray-900 text-black dark:text-white relative"
            )}>
              <Header />
              {mounted && <main className="flex-grow">
                <Component {...pageProps} />
              </main>}
              <Footer />
              <CartDrawer />
              <div id="database-error-banner-container" />
            </div>
            <Toaster />
          </Providers>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
} 