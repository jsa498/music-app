import './globals.css';
import { Inter } from 'next/font/google';
import RootLayoutClient from '../components/RootLayoutClient';
import Layout from '../components/Layout';
import type { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Music App',
  description: 'A modern music streaming application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Layout>
          {children}
        </Layout>
        <RootLayoutClient />
      </body>
    </html>
  );
} 