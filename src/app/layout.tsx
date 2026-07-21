import type { Metadata } from 'next';
import './globals.css';
import LayoutWrapper from '@/components/LayoutWrapper';

export const metadata: Metadata = {
  title: 'Viji Drop Taxi - Premium One-Way & Round-Trip Taxi Service',
  description: 'Book premium Sedan, SUV, or Innova rides for one-way drops and round-trips. Highly professional drivers, transparent flat fares, and 24/7 service.',
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
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
