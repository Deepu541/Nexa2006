import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Trash2, Minus, Plus, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../../../context/CartContext';
import { useLanguage } from '../../../context/LanguageContext';

export default function CartPage() {
  const { items, total, updateQuantity, removeItem } = useCart();
  const { t } = useLanguage();

  if (items.length === 0) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-24 h-24 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag size={48} />
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 text-sm font-medium mb-8">Add something to your cart and it will show up here.</p>
        <Link to="/" className="bg-orange-600 text-white font-black px-8 py-3 rounded-full shadow-lg active:scale-95 transition-transform">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-2">
        <ShoppingCart className="text-orange-600" size={24} />
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">{t('cart')}</h1>
      </div>

      <div className="flex flex-col gap-4">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div 
              key={item.productId}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-white p-3 rounded-2xl border border-gray-100 flex gap-4 shadow-sm group"
            >
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-50 border border-gray-50 shrink-0">
                <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
              </div>
              
              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="text-xs font-bold text-gray-800 line-clamp-1 flex-1 pr-2 uppercase tracking-wide">{item.name}</h3>
                    <button onClick={() => removeItem(item.productId)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-xs font-black text-orange-600 mt-1">Rs. {item.price}</p>
                </div>

                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center border border-gray-100 rounded-lg p-0.5 bg-gray-50">
                    <button 
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="p-1 text-gray-400 hover:text-orange-600 transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-xs font-black text-gray-900">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="p-1 text-gray-400 hover:text-orange-600 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="text-sm font-black text-gray-900">Rs. {item.price * item.quantity}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Bill Details */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mt-4">
        <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-widest text-center">Bill Details</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-xs font-medium text-gray-500">
            <span>Items Total</span>
            <span>Rs. {total}</span>
          </div>
          <div className="flex justify-between text-xs font-medium text-gray-500">
            <span>Delivery Fee</span>
            <span className="text-green-600">Calculated at Checkout</span>
          </div>
          <div className="pt-3 border-t border-dashed border-gray-100 flex justify-between items-baseline">
            <span className="text-sm font-black text-gray-900">Grand Total</span>
            <span className="text-xl font-black text-orange-600">Rs. {total}</span>
          </div>
        </div>
      </div>

      <Link 
        to="/checkout"
        className="bg-orange-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-orange-100 flex items-center justify-center gap-2 active:scale-95 transition-transform mt-2"
      >
        Checkout Now <ArrowRight size={20} />
      </Link>
    </div>
  );
}
