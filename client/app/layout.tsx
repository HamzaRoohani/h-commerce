import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AuthBootstrap } from '@/components/auth/AuthBootstrap';
import { CartDrawer } from '@/components/cart/CartDrawer';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'H. — Online Store',
    template: '%s | H.',
  },
  description: 'H. — clothing, unstitched fabric, and accessories.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col font-sans">
        <AuthBootstrap />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
      </body>
    </html>
  );
}
