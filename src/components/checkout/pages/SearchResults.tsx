import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { collection, query, onSnapshot, where, limit } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Product } from '../../../types';
import { Search, ChevronLeft, SlidersHorizontal, Star, X } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import ProductCard from '../../ProductCard';

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryParam = searchParams.get('q') || '';
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(queryParam);

  const [suggestions, setSuggestions] = useState<{ id: string; name: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    // Real-time suggestions (up to 100 approved products)
    const sugQuery = query(collection(db, 'products'), where('status', '==', 'approved'), limit(100));
    const unsubSuggestions = onSnapshot(sugQuery, (snap) => {
      setSuggestions(snap.docs.map(doc => ({ id: doc.id, name: doc.data().name || (doc.data() as any).title || '' })));
    });

    return () => unsubSuggestions();
  }, []);

  const filteredSuggestions = searchInput.trim().length > 0 
    ? suggestions.filter(s => (s.name || '').toLowerCase().includes(searchInput.toLowerCase())).slice(0, 5)
    : [];

  useEffect(() => {
    if (!queryParam) {
      setProducts([]);
      return;
    }
    setLoading(true);
    setShowSuggestions(false);

    // Listen to all approved products to filter client-side for real-time search
    const prodQuery = query(collection(db, 'products'), where('status', '==', 'approved'));
    const unsubProducts = onSnapshot(prodQuery, (snap) => {
      const allProds = snap.docs.map(doc => ({ ...doc.data(), productId: doc.id } as Product));
      const filtered = allProds.filter(p => {
        const pName = (p?.name || (p as any)?.title || '').toLowerCase();
        const pDesc = (p?.description || '').toLowerCase();
        const q = (queryParam || '').toLowerCase();
        return pName.includes(q) || pDesc.includes(q);
      });
      setProducts(filtered);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsubProducts();
  }, [queryParam]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput });
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500"><ChevronLeft size={24} /></button>
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            autoFocus
            value={searchInput}
            onChange={e => {
              setSearchInput(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder={t('search')} 
            className="w-full bg-white border border-gray-200 rounded-full py-3 pl-10 pr-10 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none shadow-sm transition-all"
          />
          {searchInput && (
            <button type="button" onClick={() => { setSearchInput(''); setShowSuggestions(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"><X size={16} /></button>
          )}
          
          {/* Suggestions Dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-[200] overflow-hidden py-2 animate-in slide-in-from-top-2">
              {filteredSuggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSearchInput(s.name);
                    setSearchParams({ q: s.name });
                    setShowSuggestions(false);
                  }}
                  className="w-full text-left px-5 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <Search size={14} className="text-gray-300" />
                  <span className="text-sm font-medium text-gray-700">{s.name}</span>
                </button>
              ))}
            </div>
          )}
          
          {/* Click-away backdrop */}
          {showSuggestions && (
            <div 
              className="fixed inset-0 z-[-1]" 
              onClick={() => setShowSuggestions(false)} 
            />
          )}
        </form>
      </div>

      <div className="flex justify-between items-center px-1">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{products.length} Results for "{queryParam}"</p>
        <button className="flex items-center gap-2 text-[10px] font-black text-gray-900 border border-gray-100 bg-white px-3 py-1.5 rounded-full shadow-sm"><SlidersHorizontal size={12} /> Filter</button>
      </div>

      {loading ? (
        <div className="py-20 text-center animate-pulse">Searching marketplace...</div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {products.map((prod) => (
            <ProductCard key={prod.productId} product={prod} />
          ))}
        </div>
      )}

      {!loading && products.length === 0 && queryParam && (
        <div className="py-20 text-center space-y-4">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-200"><Search size={32} /></div>
          <p className="text-sm font-bold text-gray-400">No matching products found.</p>
          <button onClick={() => navigate('/')} className="text-xs font-black text-orange-600 bg-orange-50 px-6 py-2 rounded-full border border-orange-100">Browse All Categories</button>
        </div>
      )}
    </div>
  );
}
