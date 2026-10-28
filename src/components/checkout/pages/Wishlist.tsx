import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, ShoppingCart, Trash2, ChevronLeft, ShoppingBag } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayRemove, collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';
import { useCart } from '../../../context/CartContext';
import { Product } from '../../../types';
import { cn } from '../../../utils';

export default function Wishlist() {
  const { profile } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWishlist() {
      if (!profile?.wishlist || profile.wishlist.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, 'products'),
          where(documentId(), 'in', profile.wishlist.slice(0, 30)) // Firestore limit is 30 for 'in' queries
        );
        const snap = await getDocs(q);
        setProducts(snap.docs.map(doc => ({ ...doc.data(), productId: doc.id } as Product)));
      } catch (err) {
        console.error('Error fetching wishlist:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchWishlist();
  }, [profile?.wishlist]);

  const handleRemove = async (productId: string) => {
    if (!profile) return;
    try {
      const userRef = doc(db, 'users', profile.userId);
      await updateDoc(userRef, {
        wishlist: arrayRemove(productId)
      });
      setProducts(prev => prev.filter(p => p.productId !== productId));
    } catch (err) {
      console.error('Error removing from wishlist:', err);
    }
  };

  const handleAddToCart = (product: Product) => {
    addItem({
      productId: product.productId,
      name: product.name,
      price: product.discountPrice || product.price,
      quantity: 1,
      vendorId: product.vendorId,
      image: product.images[0]
    });
  };

  if (loading) return <div className="p-8 text-center">Loading your favorites...</div>;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white p-6 pt-12 flex items-center gap-4 border-b border-gray-100 sticky top-0 z-30">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-black text-gray-900 tracking-tight">Saved Items</h1>
        <div className="ml-auto bg-pink-50 text-pink-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
          {products.length} Items
        </div>
      </div>

      <div className="p-4 space-y-4">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-8">
            <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center text-pink-500 mb-6">
              <Heart size={40} />
            </div>
            <h2 className="text-lg font-black text-gray-900 mb-2">Your wishlist is empty</h2>
            <p className="text-sm text-gray-400 font-medium mb-8">Save items you like to see them here and get notified when they drop in price.</p>
            <Link 
              to="/" 
              className="bg-orange-600 text-white font-black px-8 py-4 rounded-2xl shadow-lg shadow-orange-200 flex items-center gap-2"
            >
              <ShoppingBag size={20} /> Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence>
              {products.map((product) => (
                <motion.div
                  key={product.productId}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white p-3 rounded-3xl shadow-sm border border-gray-100 flex gap-4 group"
                >
                  <Link to={`/product/${product.productId}`} className="w-24 h-24 bg-gray-50 rounded-2xl overflow-hidden shrink-0 border border-gray-50">
                    <img 
                      src={product.images[0]} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      alt={product.name}
                    />
                  </Link>
                  
                  <div className="flex-1 py-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-black text-gray-900 line-clamp-1 mb-1">{product.name}</h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-black text-orange-600">Rs. {product.discountPrice || product.price}</span>
                        {product.discountPrice && (
                          <span className="text-[10px] text-gray-400 line-through font-bold">Rs. {product.price}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleAddToCart(product)}
                        className="flex-1 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest py-2 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
                      >
                        <ShoppingCart size={14} /> Add to Cart
                      </button>
                      <button 
                        onClick={() => handleRemove(product.productId)}
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
