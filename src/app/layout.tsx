import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WhatsAppFloat from '@/components/WhatsAppFloat';

export const metadata: Metadata = {
  title: 'Viji Drop Taxi - Premium One-Way & Round-Trip Taxi Service',
  description: 'Book premium hatchback, sedan, or SUV rides for one-way drops and round-trips. Highly professional drivers, transparent flat fares, and 24/7 service.',
  icons: {
    icon: '/assets/viji%20drop%20taxi%20logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            {children}
          </main>
          <Footer />
          <WhatsAppFloat />
        </div>
      </body>
    </html>
  );
}
