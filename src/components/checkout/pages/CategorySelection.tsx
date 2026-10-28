import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Category } from '../../../types';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Grid, ChevronRight, Layers } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../../utils';

export default function CategorySelection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMain, setSelectedMain] = useState<string | null>(null);
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    getDocs(query(collection(db, 'categories'), orderBy('order', 'asc'))).then(snap => {
      const cats = snap.docs.map(doc => ({ ...doc.data(), categoryId: doc.id } as Category));
      setCategories(cats);
      setLoading(false);
      const mainCats = cats.filter(c => !c.parentId);
      if (mainCats.length > 0) {
        setSelectedMain(mainCats[0].categoryId);
      }
    });
  }, []);

  const mainCategories = categories.filter(c => !c.parentId);
  const subCategories = categories.filter(c => c.parentId === selectedMain);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="p-6 bg-white shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl text-gray-900 active:scale-95 transition-all"><ChevronLeft size={20} /></button>
          <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase leading-none">{t('categories')}</h1>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (Main Categories) */}
        <div className="w-28 bg-gray-50/50 border-r border-gray-100 overflow-y-auto shrink-0 pb-12">
          {loading ? (
            <div className="p-3 space-y-4">
              {[1,2,3,4,5,6,7].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            mainCategories.map(cat => (
              <button
                key={cat.categoryId}
                onClick={() => setSelectedMain(cat.categoryId)}
                className={cn(
                  "w-full p-4 flex flex-col items-center gap-2 transition-all relative",
                  selectedMain === cat.categoryId 
                    ? "bg-white" 
                    : "hover:bg-white/50"
                )}
              >
                {selectedMain === cat.categoryId && (
                  <motion.div layoutId="activeCat" className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-orange-600 rounded-r-full" />
                )}
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center p-2 transition-colors shadow-inner",
                  selectedMain === cat.categoryId ? "bg-orange-600 text-white" : "bg-white text-gray-400"
                )}>
                  {cat.icon ? <img src={cat.icon} className="w-full h-full object-contain" /> : <Grid size={20} />}
                </div>
                <span className={cn(
                  "text-[8px] font-black uppercase text-center leading-tight tracking-widest",
                  selectedMain === cat.categoryId ? "text-orange-600" : "text-gray-400"
                )}>
                  {cat.name}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Right Content (Sub-categories & Banners) */}
        <div className="flex-1 bg-white overflow-y-auto p-6 space-y-6 pb-24">
          <AnimatePresence mode="wait">
            {!selectedMain ? (
              <motion.div 
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-center opacity-20"
              >
                <Layers size={64} className="mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Select a category</p>
              </motion.div>
            ) : (
              <motion.div 
                key={selectedMain}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                {/* Category Banner if exists */}
                {mainCategories.find(c => c.categoryId === selectedMain)?.banner && (
                  <div className="w-full h-24 rounded-3xl overflow-hidden shadow-lg shadow-gray-100 relative group">
                    <img 
                      src={mainCategories.find(c => c.categoryId === selectedMain)?.banner} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center p-6">
                       <h2 className="text-white text-sm font-black uppercase tracking-widest">{mainCategories.find(c => c.categoryId === selectedMain)?.name} COLLECTION</h2>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <Link 
                    to={`/category/${selectedMain}`}
                    className="col-span-2 bg-orange-600 p-4 rounded-2xl text-white flex justify-between items-center group active:scale-95 transition-all"
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest">View All Products</span>
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Link>

                  {subCategories.map(sub => (
                    <Link
                      key={sub.categoryId}
                      to={`/category/${sub.categoryId}`}
                      className="bg-gray-50 p-4 rounded-3xl border border-gray-100 flex flex-col items-center gap-3 active:scale-95 transition-all group"
                    >
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center p-2 shadow-sm group-hover:shadow-md transition-shadow">
                        {sub.icon ? <img src={sub.icon} className="w-full h-full object-contain" /> : <Grid size={24} className="text-gray-200" />}
                      </div>
                      <span className="text-[9px] font-black text-gray-700 uppercase text-center leading-tight tracking-widest">{sub.name}</span>
                    </Link>
                  ))}
                </div>

                {subCategories.length === 0 && (
                  <div className="py-12 text-center opacity-30">
                     <p className="text-[8px] font-black uppercase tracking-widest">No sub-categories found</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
