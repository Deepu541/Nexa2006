import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, getDoc, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, isQuotaActive } from '../../../firebase';
import { Product, Category } from '../../../types';
import { fallbackProducts, fallbackCategories } from '../../../constants/fallbackData';
import { Search, ChevronLeft, SlidersHorizontal, Star } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import ProductCard from '../../ProductCard';

export default function CategoryProducts() {
  const { id } = useParams();
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    const fallbackCat = fallbackCategories.find(c => c.categoryId === id || (c as any).slug === id || (c?.name || '').toLowerCase() === (id || '').toLowerCase());
    const fallbackProds = fallbackProducts.filter(p => p.categoryId === id || p.subCategoryId === id);

    if (isQuotaActive()) {
      if (fallbackCat) setCategory(fallbackCat);
      setProducts(fallbackProds.length > 0 ? fallbackProds : fallbackProducts);
      setLoading(false);
    }

    // 1. Fetch Category Info
    const fetchCategory = async () => {
      try {
        const catRef = doc(db, 'categories', id);
        const catSnap = await getDoc(catRef);
        if (catSnap.exists()) {
          setCategory({ ...catSnap.data(), categoryId: catSnap.id } as Category);
        } else if (fallbackCat) {
          setCategory(fallbackCat);
        }
      } catch (err) {
        if (fallbackCat) setCategory(fallbackCat);
      }
    };
    fetchCategory();

    let unsubProducts: () => void = () => {};

    const startProductListener = (cat?: Category) => {
      let prodQuery;
      if (cat?.parentId) {
        prodQuery = query(
          collection(db, 'products'), 
          where('subCategoryId', '==', id)
        );
      } else {
        prodQuery = query(
          collection(db, 'products'), 
          where('categoryId', '==', id)
        );
      }

      unsubProducts = onSnapshot(prodQuery, (snap) => {
        const list = snap.docs.map(doc => ({ ...doc.data(), productId: doc.id } as Product));
        const approvedAndSorted = list
          .filter(p => p.status === 'approved')
          .sort((a, b) => {
            const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return tB - tA;
          });
        setProducts(approvedAndSorted.length > 0 ? approvedAndSorted : (fallbackProds.length > 0 ? fallbackProds : fallbackProducts));
        setLoading(false);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'products');
        setProducts(fallbackProds.length > 0 ? fallbackProds : fallbackProducts);
        setLoading(false);
      });
    };

    getDoc(doc(db, 'categories', id)).then(snap => {
      const catData = snap.exists() ? { ...snap.data(), categoryId: snap.id } as Category : fallbackCat;
      if (catData) setCategory(catData);
      startProductListener(catData);
    }).catch(() => {
      if (fallbackCat) setCategory(fallbackCat);
      startProductListener(fallbackCat);
    });

    return () => {
      unsubProducts();
    };
  }, [id]);

  if (loading) return <div className="p-8 text-center">Filtering {id}...</div>;

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center gap-4">
        <Link to="/" className="p-2 -ml-2 text-gray-500 hover:text-orange-600 transition-colors"><ChevronLeft /></Link>
        <h1 className="text-xl font-black text-gray-900 tracking-tight capitalize">{category?.name || id}</h1>
        <div className="ml-auto w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shadow-inner">
           {category?.icon ? <img src={category.icon} className="w-6 h-6 object-contain" /> : <Search size={20} />}
        </div>
      </div>

      <div className="flex gap-2">
        <button className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-100 py-2 rounded-xl text-xs font-bold text-gray-600 shadow-sm active:scale-95 transition-transform"><SlidersHorizontal size={14} /> Filter</button>
        <button className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-100 py-2 rounded-xl text-xs font-bold text-gray-600 shadow-sm active:scale-95 transition-transform">Sort: Latest</button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {products.map((prod) => (
          <ProductCard key={prod.productId} product={prod} />
        ))}
      </div>

      {products.length === 0 && (
        <div className="py-20 text-center space-y-4">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-200"><Search size={32} /></div>
          <p className="text-sm font-bold text-gray-400">No products found in this category.</p>
        </div>
      )}
    </div>
  );
}
