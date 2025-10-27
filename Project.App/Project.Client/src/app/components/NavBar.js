'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { authService } from '@/lib/api';

export default function NavBar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    console.log('[NavBar] Logout clicked');

    try {
      await authService.logout();
      console.log('[NavBar] Logout successful, redirecting to /login');
      window.location.href = '/login';
    } catch (error) {
      console.error('[NavBar] Logout error:', error);
      // Redirect anyway to force re-authentication
      window.location.href = '/login';
    }
  };

  let links = [];
  if (pathname.startsWith('/player/')) {
    links = [{ href: '/rooms', label: 'Rooms' }];
  } else if (pathname.startsWith('/rooms')) {
    links = [{ href: '/player/1', label: 'Profile' }];
  } else if (pathname.startsWith('/game/')) {
    // No additional links in game view - leave button is in the game UI
    links = [];
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full bg-black/80 border-b-2 border-yellow-600 py-3 px-6 flex gap-6 items-center shadow-lg backdrop-blur">
      <span className="font-bold text-yellow-400 text-xl tracking-wide">Double Down Devito</span>
      <div className="flex gap-4 ml-auto">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-yellow-100 hover:text-yellow-400 font-semibold px-3 py-1 rounded transition"
          >
            {link.label}
          </Link>
        ))}
        {/* Show logout button only on protected pages */}
        {(pathname.startsWith('/player/') || pathname.startsWith('/rooms') || pathname.startsWith('/game/')) && (
          <button
            onClick={handleLogout}
            className="text-yellow-100 hover:text-yellow-400 font-semibold px-3 py-1 rounded transition"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
