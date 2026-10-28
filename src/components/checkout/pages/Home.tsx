import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Flame, TrendingUp, ChevronRight, Grid, Sparkles, LogOut, X, Store } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, where, limit, orderBy, getDocs, doc } from 'firebase/firestore';
import { App } from '@capacitor/app';
import { db, handleFirestoreError, OperationType, isQuotaActive, FIRESTORE_UPGRADE_URL } from '../../../firebase';
import { Product, Category, Banner } from '../../../types';
import { fallbackProducts, fallbackCategories, fallbackBanners } from '../../../constants/fallbackData';
import { useLanguage } from '../../../context/LanguageContext';
import ProductCard from '../../ProductCard';

export default function Home() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>(() => isQuotaActive() ? fallbackProducts : []);
  const [categories, setCategories] = useState<Category[]>(() => isQuotaActive() ? fallbackCategories : []);
  const [banners, setBanners] = useState<Banner[]>(() => isQuotaActive() ? fallbackBanners : []);
  const [loading, setLoading] = useState(() => isQuotaActive() ? false : true);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [bannerSettings, setBannerSettings] = useState({
    autoPlay: true,
    autoScroll: true,
    autoSlideTiming: 5
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (isQuotaActive()) {
      setProducts(fallbackProducts);
      setCategories(fallbackCategories);
      setBanners(fallbackBanners);
      setLoading(false);
    }

    // Real-time listener for products - Latest first
    const prodQuery = query(
      collection(db, 'products'), 
      where('status', '==', 'approved'), 
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    const unsubProducts = onSnapshot(prodQuery, (snap) => {
      const list = snap.docs.map(doc => ({ ...doc.data(), productId: doc.id } as Product));
      setProducts(list.length > 0 ? list : fallbackProducts);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
      setProducts(prev => prev.length > 0 ? prev : fallbackProducts);
      setLoading(false);
    });

    // Real-time listener for categories
    const unsubCategories = onSnapshot(collection(db, 'categories'), (snap) => {
      const list = snap.docs.map(doc => ({ ...doc.data(), categoryId: doc.id } as Category));
      setCategories(list.length > 0 ? list : fallbackCategories);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'categories');
      setCategories(prev => prev.length > 0 ? prev : fallbackCategories);
    });

    // Real-time listener for banners
    const unsubBanners = onSnapshot(collection(db, 'banners'), (snap) => {
      const bList = snap.docs.map(doc => ({ ...doc.data(), bannerId: doc.id } as Banner));
      // Show banners whose active is either missing/undefined or explicitly true
      const activeBanners = bList.filter(b => b.active !== false);
      activeBanners.sort((a, b) => (a.order || 0) - (b.order || 0));
      setBanners(activeBanners.length > 0 ? activeBanners : fallbackBanners);
    }, (error: any) => {
      handleFirestoreError(error, OperationType.LIST, 'banners');
      setBanners(prev => prev.length > 0 ? prev : fallbackBanners);
    });

    // Real-time listener for banners/offers master settings
    const unsubSettings = onSnapshot(doc(db, 'settings', 'banners'), (snap: any) => {
      if (snap.exists()) {
        const data = snap.data();
        setBannerSettings({
          autoPlay: data.autoPlay !== false,
          autoScroll: data.autoScroll !== false,
          autoSlideTiming: data.autoSlideTiming || 5
        });
      }
    }, (error: any) => {
      console.warn("Banner settings not found or inaccessible:", error);
    });

    return () => {
      unsubProducts();
      unsubCategories();
      unsubBanners();
      unsubSettings();
    };
  }, []);

  // Back button confirmation logic
  useEffect(() => {
    const handleBackButton = () => {
      // If we are on Home page, intercept exit
      if (window.location.pathname === '/') {
        setShowExitConfirm(true);
      }
    };

    const listener = App.addListener('backButton', handleBackButton);

    return () => {
      listener.then(l => l.remove());
    };
  }, []);

  // Web back button intercepter (push state for exit confirmation)
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (window.location.pathname === '/') {
        setShowExitConfirm(true);
        // Push state back so we stay on home
        window.history.pushState(null, '', window.location.pathname);
      }
    };

    // Only push on initial load of Home to catch the first back click
    window.history.pushState(null, '', window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const combinedBanners = banners;

  // Safely clamp the active index to prevent out-of-bounds exceptions when banners are modified/deleted in runtime
  const activeBannerIndex = Math.min(Math.max(0, currentBanner), Math.max(0, combinedBanners.length - 1));

  // Auto-adjust currentBanner index if it gets deleted, added, or out of bounds
  useEffect(() => {
    if (combinedBanners.length === 0) {
      if (currentBanner !== 0) {
        setCurrentBanner(0);
      }
    } else if (currentBanner >= combinedBanners.length) {
      setCurrentBanner(combinedBanners.length - 1);
    }
  }, [combinedBanners.length, currentBanner]);

  // Auto-scroll logic for banners
  useEffect(() => {
    if (!bannerSettings.autoScroll || combinedBanners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentBanner((prev: number) => (prev + 1) % combinedBanners.length);
    }, bannerSettings.autoSlideTiming * 1000); 

    return () => clearInterval(interval);
  }, [combinedBanners.length, bannerSettings.autoScroll, bannerSettings.autoSlideTiming]);

  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState<{ id: string; name: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    async function fetchSuggestions() {
      try {
        const snap = await getDocs(query(collection(db, 'products'), where('status', '==', 'approved'), limit(50)));
        setSuggestions(snap.docs.map(doc => ({ id: doc.id, name: (doc.data() as Product).name })));
      } catch (err) {}
    }
    fetchSuggestions();
  }, []);

  const filteredSuggestions = searchInput.trim().length > 0 
    ? suggestions.filter(s => s.name.toLowerCase().includes(searchInput.toLowerCase())).slice(0, 5)
    : [];

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (searchInput.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col gap-6 p-4 animate-in fade-in duration-500 pb-20">
      {/* Top Welcome Section with Real-time Clock */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Namaste, NexaMart</h2>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
            <Sparkles size={10} className="text-orange-500" />
            {currentTime.toLocaleDateString('ne-NP', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200">
           <p className="text-[10px] font-black text-gray-900 tracking-tighter tabular-nums">
             {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
           </p>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full translate-x-1/2 -translate-y-1/2 -z-10" />
              
              <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-red-100 mx-auto">
                <LogOut size={32} />
              </div>

              <div className="text-center space-y-2 mb-8">
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Exit NexaMart?</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">Are you sure you want to close the application?</p>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => App.exitApp()}
                  className="w-full bg-red-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-red-100 active:scale-95 transition-all text-xs uppercase tracking-widest"
                >
                  Yes, Close NexaMart
                </button>
                <button 
                  onClick={() => setShowExitConfirm(false)}
                  className="w-full bg-gray-50 text-gray-400 font-black py-4 rounded-2xl active:scale-95 transition-all text-xs uppercase tracking-widest"
                >
                  No, Keep Shopping
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Improved Search Bar with Suggestions */}
      <div id="home-search-bar" className="relative z-50">
        <form onSubmit={handleSearch} className="relative flex items-center group">
          <Search className="absolute left-4 text-gray-400 group-hover:text-red-500 transition-colors" size={18} />
          <input 
            type="text"
            value={searchInput}
            onFocus={() => setShowSuggestions(true)}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setShowSuggestions(true);
            }}
            placeholder={t('search')}
            className="w-full bg-white border-2 border-gray-100 rounded-2xl py-4 pl-12 pr-4 shadow-sm transition-all focus:border-red-500 outline-none placeholder:text-gray-400 text-sm font-bold"
          />
          {searchInput && (
            <button 
              type="button" 
              onClick={() => { setSearchInput(''); setShowSuggestions(false); }}
              className="absolute right-4 text-gray-300 hover:text-gray-500"
            >
              <X size={18} />
            </button>
          )}

          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && filteredSuggestions.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-3 bg-white rounded-[24px] shadow-2xl border border-gray-50 z-[100] overflow-hidden py-3"
              >
                {filteredSuggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSearchInput(s.name);
                      navigate(`/search?q=${encodeURIComponent(s.name)}`);
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-6 py-4 hover:bg-gray-50 flex items-center gap-4 transition-colors group"
                  >
                    <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                      <Search size={14} />
                    </div>
                    <span className="text-sm font-bold text-gray-700">{s.name}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </form>
        
        {/* Click-away backdrop */}
        {showSuggestions && (
          <div 
            className="fixed inset-0 z-[-1]" 
            onClick={() => setShowSuggestions(false)} 
          />
        )}
      </div>

      {/* Hero Banner with Auto-Scroll / Slider Track */}
      {!loading && combinedBanners.length > 0 && (
        <section id="hero-banner" className="relative overflow-hidden rounded-3xl h-44 shadow-lg group bg-zinc-950 select-none">
          <div className="w-full h-full relative overflow-hidden">
            {/* Sliding Track */}
            <div 
              className="flex h-full w-full transition-transform duration-700 ease-out"
              style={{ transform: `translateX(-${activeBannerIndex * 100}%)` }}
            >
              {combinedBanners.map((banner) => {
                return (
                  <div 
                    key={banner.bannerId} 
                    className="w-full h-full shrink-0 relative cursor-pointer"
                    onClick={() => {
                      if (banner.link) {
                        navigate(banner.link);
                      }
                    }}
                  >
                    <img 
                      src={banner.imageUrl} 
                      alt={banner.title} 
                      loading="lazy" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-white font-black uppercase tracking-widest flex items-center gap-1.5 z-10 pointer-events-none font-sans">
                      {banner.title}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Manual Navigation Controls */}
            {combinedBanners.length > 1 && (
              <>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentBanner((prev: number) => (prev - 1 + combinedBanners.length) % combinedBanners.length);
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/60 backdrop-blur-sm text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-20 active:scale-90 border border-white/5 cursor-pointer"
                >
                  <ChevronRight className="rotate-180" size={16} />
                </button>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentBanner((prev: number) => (prev + 1) % combinedBanners.length);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/60 backdrop-blur-sm text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-20 active:scale-90 border border-white/5 cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}
          </div>

          {/* Indicators */}
          {combinedBanners.length > 1 && (
            <div className="absolute bottom-3 right-4 flex gap-1.5 z-10 pointer-events-none">
              {combinedBanners.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1 rounded-full transition-all duration-300 ${i === activeBannerIndex ? 'w-4 bg-white' : 'w-1 bg-white/40'}`}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Categories Horizontal Slider */}
      <section id="categories-slider">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900">{t('categories')}</h3>
          <Link to="/categories" className="text-xs font-semibold text-orange-600 flex items-center gap-0.5">
            View All <ChevronRight size={14} />
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {loading ? (
             [1,2,3,4,5].map(i => (
              <div key={i} className="flex flex-col items-center gap-2 min-w-[70px]">
                <div className="w-14 h-14 rounded-full bg-gray-100 animate-pulse" />
                <div className="w-10 h-2 bg-gray-50 rounded animate-pulse" />
              </div>
            ))
          ) : (
            categories.filter(c => !c.parentId).map((cat) => (
              <motion.div 
                key={cat.categoryId}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center gap-2 min-w-[70px]"
                onClick={() => navigate(`/category/${cat.categoryId}`)}
              >
                <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center p-3 text-orange-600 shadow-inner">
                  {cat.icon ? <img src={cat.icon} className="w-full h-full object-contain" /> : <Grid size={24} />}
                </div>
                <span className="text-[10px] font-bold text-gray-600 text-center line-clamp-1">{cat.name}</span>
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* Flash Sale */}
      {loading ? (
         <div className="grid grid-cols-2 gap-3">
            {[1,2].map(i => <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />)}
         </div>
      ) : products.some(p => p.flashSalePrice) && (
        <section id="flash-sale-section" className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Flame className="text-orange-600 animate-bounce" size={20} />
              <h3 className="font-bold text-gray-900">{t('flash_sale')}</h3>
            </div>
            <div className="bg-orange-600 text-white text-[10px] font-black px-2 py-1 rounded">HOT NOW</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {products.filter(p => p.flashSalePrice).slice(0, 4).map((prod) => (
              <ProductCard key={prod.productId} product={prod} />
            ))}
          </div>
        </section>
      )}



      {/* Recommended (Main list) */}
      <section id="recommended-products">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="text-blue-600" size={20} />
          <h3 className="font-bold text-gray-900">Recommended for You</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {loading ? (
             [1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />)
          ) : (
            products.slice(0, 30).map((prod) => (
              <ProductCard key={prod.productId} product={prod} />
            ))
          )}
        </div>
      </section>

      {/* Official Branding Footer */}
      <div className="mt-12 py-10 border-t border-gray-100 flex flex-col items-center gap-3 text-center opacity-40 hover:opacity-100 transition-opacity pb-10">
         <div className="bg-gray-100 p-3 rounded-2xl">
            <Store size={24} className="text-gray-400" />
         </div>
         <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Integrated Marketplace System</p>
            <p className="text-sm font-black text-gray-500 uppercase">DEVELOPED BY AKASH KALWAR</p>
         </div>
         <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full border border-gray-100">NEXAMART FRAMEWORK • 2026</p>
      </div>

    </div>
  );
}
