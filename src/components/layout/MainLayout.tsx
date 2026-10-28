import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingCart, User, Grid, Sun, Moon } from 'lucide-react';
import AIChatBot from '../support/AIChatBot';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { cn } from '../../utils';

export default function MainLayout() {
  const { pathname } = useLocation();
  const { profile } = useAuth();
  const { items } = useCart();
  const { t, language, setLanguage } = useLanguage();

  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Browsers show their own generic message, but we must trigger it
      e.preventDefault();
      e.returnValue = 'Are you sure you want to close NexaMart?';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const navItems = [
    { name: t('home'), icon: Home, path: '/' },
    { name: t('search'), icon: Search, path: '/search' },
    { name: t('cart'), icon: ShoppingCart, path: '/cart', badge: items.length },
    { 
      name: profile?.role === 'customer' ? 'Dashboard' : t('profile'), 
      icon: User, 
      path: profile ? (profile.role === 'customer' ? '/user/dashboard' : '/profile') : '/login' 
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto shadow-xl ring-1 ring-gray-200">
      {/* Top Header */}
      <header id="main-header" className="fixed top-0 left-0 right-0 max-w-md mx-auto z-[100] bg-orange-600 text-white p-4 pt-[calc(env(safe-area-inset-top)+1rem)] flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2">
          <Link to="/" className="text-2xl font-black tracking-tighter">NexaMart</Link>
          <button 
            type="button"
            onClick={() => {
              if (language === 'en') setLanguage('hi');
              else if (language === 'hi') setLanguage('np');
              else setLanguage('en');
            }}
            className="text-[10px] font-black border border-white/40 bg-white/10 rounded-lg px-2 py-1.5 hover:bg-white/20 transition-all uppercase tracking-wider leading-none flex items-center justify-center gap-1 cursor-pointer"
            title="Switch Language"
          >
            🌐 {language === 'en' ? 'ENG' : language === 'hi' ? 'हिन्दी' : 'नेपाली'}
          </button>
          <button 
            type="button"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="text-[10px] font-black border border-white/40 bg-white/10 rounded-lg p-2 hover:bg-white/20 transition-all uppercase leading-none flex items-center justify-center gap-1 cursor-pointer"
            title={theme === 'light' ? "Activate Dark Mode" : "Activate Light Mode"}
          >
            {theme === 'light' ? <Moon size={12} strokeWidth={2.5} /> : <Sun size={12} strokeWidth={2.5} />}
          </button>
        </div>
        <div className="flex items-center gap-2">
          {(!profile || profile.role === 'customer') && (
            <Link 
              to="/vendor" 
              className="bg-white text-orange-600 px-3.5 py-2 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm transition-all active:scale-95 duration-150 hover:bg-orange-50"
            >
              Become Seller
            </Link>
          )}
          {profile?.role === 'admin' && (
            <Link 
              to="/admin" 
              className="bg-black text-white px-3.5 py-2 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm transition-all active:scale-95 duration-150 hover:bg-neutral-900 animate-pulse"
            >
              Admin Dashboard
            </Link>
          )}
          {profile?.role === 'rider' && (
            <Link 
              to="/rider" 
              className="bg-slate-900 text-white px-3.5 py-2 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm transition-all active:scale-95 duration-150 hover:bg-slate-800"
            >
              Rider Panel
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-20 md:pt-16 pb-20 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation (Mobile Style) */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] flex justify-between items-center z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center gap-1 p-1 transition-all relative",
              pathname === item.path ? "text-orange-600 scale-110" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <item.icon size={22} strokeWidth={pathname === item.path ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{item.name}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>
      <AIChatBot />
    </div>
  );
}
