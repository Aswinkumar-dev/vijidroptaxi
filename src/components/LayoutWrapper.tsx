'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from './Navbar';
import Footer from './Footer';
import WhatsAppFloat from './WhatsAppFloat';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);

  // Pages that show no chrome at all (no navbar, footer, whatsapp)
  const isBarePage =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/admin/login' ||
    pathname === '/admin/signup' ||
    pathname === '/driver/login' ||
    pathname === '/driver/signup';

  useEffect(() => {
    // Fetch role to conditionally hide WhatsApp for admin/driver
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        setUserRole(data?.role || null);
      } else {
        setUserRole(null);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        setUserRole(data?.role || null);
      } else {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Hide WhatsApp for admin and driver users — they don't book rides
  const showWhatsApp = !isBarePage && userRole !== 'admin' && userRole !== 'driver' && userRole !== 'pending_admin';

  return (
    <div className="app-container">
      {!isBarePage && <Navbar />}
      <main className="main-content">
        {children}
      </main>
      {!isBarePage && <Footer />}
      {showWhatsApp && <WhatsAppFloat />}
    </div>
  );
}
