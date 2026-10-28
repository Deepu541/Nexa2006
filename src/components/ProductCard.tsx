import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Star, ShoppingCart } from 'lucide-react';
import { motion } from 'motion/react';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Product } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { cn } from '../utils';

interface ProductCardProps {
  product: Product;
}

export default React.memo(function ProductCard({ product }: ProductCardProps) {
  const { profile } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const discount = product.discountPrice ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;
  
  const isInWishlist = profile?.wishlist?.includes(product.productId);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!profile) return navigate('/login');

    const userRef = doc(db, 'users', profile.userId);
    try {
      if (isInWishlist) {
        await updateDoc(userRef, { wishlist: arrayRemove(product.productId) });
      } else {
        await updateDoc(userRef, { wishlist: arrayUnion(product.productId) });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${profile.userId}`);
    }
  };

  const handleQuickBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.productId,
      name: product.name,
      price: product.discountPrice || product.price,
      quantity: 1,
      vendorId: product.vendorId,
      image: product.images[0]
    });
    navigate('/checkout');
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full"
    >
      <Link 
        id={`product-card-${product.productId}`}
        to={`/product/${product.productId}`} 
        className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col h-full group active:scale-[0.98] hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300"
      >
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <img 
            id={`product-img-${product.productId}`}
            src={product.images[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=300'} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            alt={product.name}
            loading="lazy"
          />
          {discount > 0 && (
            <div id={`product-discount-${product.productId}`} className="absolute top-2 left-2 bg-gradient-to-r from-red-600 to-orange-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full z-10 shadow-lg uppercase tracking-tighter">
              {discount}% OFF
            </div>
          )}
          <button 
            id={`product-wishlist-btn-${product.productId}`}
            onClick={toggleWishlist}
            className={cn(
              "absolute top-2 right-2 p-2 rounded-full backdrop-blur-md transition-all active:scale-75 shadow-sm z-10",
              isInWishlist ? "bg-red-50 text-red-500" : "bg-white/80 text-gray-400 hover:text-red-500"
            )}
          >
            <Heart size={14} fill={isInWishlist ? "currentColor" : "none"} />
          </button>
        </div>
        <div className="p-3 flex flex-col flex-1 gap-1">
          <div className="flex items-center gap-1">
            <Star size={10} className="text-yellow-400" fill="currentColor" />
            <span className="text-[9px] font-bold text-gray-400">{product.rating}</span>
          </div>
          <h4 id={`product-name-${product.productId}`} className="text-xs font-black text-gray-800 line-clamp-2 leading-tight h-8 group-hover:text-red-600 transition-colors uppercase tracking-tight">{product.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span id={`product-price-${product.productId}`} className="text-sm font-black text-red-600">Rs. {product.discountPrice || product.price}</span>
            {discount > 0 && <span className="text-[10px] text-gray-300 line-through font-bold">Rs. {product.price}</span>}
          </div>
          <div className="flex items-center justify-between gap-1 mt-2">
            <p className="text-[8px] font-bold text-gray-400 uppercase truncate max-w-[60px]">Stock: {product.stock}</p>
            <button 
              id={`product-quickbuy-btn-${product.productId}`}
              onClick={handleQuickBuy}
              className="p-2.5 bg-gray-900 text-white rounded-xl shadow-lg active:scale-90 transition-all hover:bg-red-600 group-hover:shadow-red-100"
              title="Buy Now"
            >
              <ShoppingCart size={14} />
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
});
