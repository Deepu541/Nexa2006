import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Heart, Share2, Star, ChevronLeft, Minus, Plus, ShieldCheck, Truck, RefreshCw, Download, Maximize2, X } from 'lucide-react';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, collection, query, where, orderBy, limit, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, isQuotaActive } from '../../../firebase';
import { Product, Vendor, Review } from '../../../types';
import { fallbackProducts, fallbackVendors } from '../../../constants/fallbackData';
import { useAuth } from '../../../context/AuthContext';
import { useCart } from '../../../context/CartContext';
import { useLanguage } from '../../../context/LanguageContext';
import { cn, formatDate } from '../../../utils';
import ReactMarkdown from 'react-markdown';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { addItem } = useCart();
  const { t } = useLanguage();
  const [product, setProduct] = useState<Product | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showFullImage, setShowFullImage] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);

  const isInWishlist = profile?.wishlist?.includes(id || '');

  const toggleWishlist = async () => {
    if (!profile) return navigate('/login');
    if (!id) return;

    const userRef = doc(db, 'users', profile.userId);
    try {
      if (isInWishlist) {
        await updateDoc(userRef, { wishlist: arrayRemove(id) });
      } else {
        await updateDoc(userRef, { wishlist: arrayUnion(id) });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${profile.userId}`);
    }
  };

  const handleDownload = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback for base64 if direct fetch fails
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `${filename}.png`;
      link.click();
    }
  };

  const handleShare = async () => {
    if (!product) return;
    const shareData = {
      title: product.name,
      text: `Check out this product: ${product.name}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  useEffect(() => {
    if (!id) return;

    if (isQuotaActive()) {
      const match = fallbackProducts.find(p => p.productId === id) || fallbackProducts[0];
      if (match) {
        setProduct(match);
        const v = fallbackVendors.find(v => v.vendorId === match.vendorId) || fallbackVendors[0];
        setVendor(v);
        setLoading(false);
      }
    }
    
    // Real-time product listener
    const unsubProduct = onSnapshot(doc(db, 'products', id), (snap) => {
      if (snap.exists()) {
        const data = { ...snap.data(), productId: snap.id } as Product;
        setProduct(data);
        
        // Fetch/update vendor if not loaded or if vendorId changed
        if (data.vendorId) {
          getDoc(doc(db, 'vendors', data.vendorId)).then(vSnap => {
            if (vSnap.exists()) {
              setVendor({ ...vSnap.data(), vendorId: vSnap.id } as Vendor);
            }
          }).catch(() => {
            const v = fallbackVendors.find(v => v.vendorId === data.vendorId) || fallbackVendors[0];
            setVendor(v);
          });
        }
        setLoading(false);
      } else {
        const match = fallbackProducts.find(p => p.productId === id);
        if (match) {
          setProduct(match);
          const v = fallbackVendors.find(v => v.vendorId === match.vendorId) || fallbackVendors[0];
          setVendor(v);
        } else {
          setProduct(null);
        }
        setLoading(false);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `products/${id}`);
      const match = fallbackProducts.find(p => p.productId === id) || fallbackProducts[0];
      if (match) {
        setProduct(match);
        const v = fallbackVendors.find(v => v.vendorId === match.vendorId) || fallbackVendors[0];
        setVendor(v);
      }
      setLoading(false);
    });

    // Real-time reviews listener
    const q = query(
      collection(db, 'reviews'),
      where('productId', '==', id),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsubReviews = onSnapshot(q, (snap) => {
      setReviews(snap.docs.map(doc => ({ ...doc.data(), reviewId: doc.id } as Review)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'reviews');
    });

    return () => {
      unsubProduct();
      unsubReviews();
    };
  }, [id]);

  if (loading) return <div className="p-8 text-center">Loading details...</div>;
  if (!product) return <div className="p-8 text-center text-red-500 font-bold">Product not found.</div>;

  const handleAddToCart = () => {
    addItem({
      productId: product.productId,
      name: product.name,
      price: product.discountPrice || product.price,
      quantity,
      vendorId: product.vendorId,
      image: product.images[0]
    });
    // Visual feedback or toast
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/checkout');
  };

  return (
    <div className="flex flex-col bg-white">
      {/* Header Actions */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md p-4 flex justify-between items-center border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <ChevronLeft size={24} className="text-gray-900" />
        </button>
        <div className="flex gap-2">
          <button onClick={handleShare} className="p-2 rounded-full hover:bg-gray-100 transition-colors"><Share2 size={20} /></button>
          <button 
            onClick={toggleWishlist}
            className={cn(
              "p-2 rounded-full transition-all active:scale-90",
              isInWishlist ? "text-pink-500 bg-pink-50" : "hover:bg-gray-100 text-gray-900"
            )}
          >
            <Heart size={20} fill={isInWishlist ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      {/* Image Carousel */}
      <section className="relative aspect-square cursor-zoom-in" onClick={() => setShowFullImage(true)}>
        <AnimatePresence mode="wait">
          <motion.img 
            key={selectedImage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            src={product.images[selectedImage] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff'}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </AnimatePresence>
        
        {/* Image Actions Overlay */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); handleDownload(product.images[selectedImage], `Product_${product.name}_${selectedImage}`); }}
            className="p-3 bg-white/90 backdrop-blur-md rounded-2xl text-gray-900 shadow-xl active:scale-90 transition-all"
            title="Download Image"
          >
            <Download size={20} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setShowFullImage(true); }}
            className="p-3 bg-white/90 backdrop-blur-md rounded-2xl text-gray-900 shadow-xl active:scale-90 transition-all"
            title="View Full Image"
          >
            <Maximize2 size={20} />
          </button>
        </div>

        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {product.images.map((_, i) => (
            <button 
              key={i} 
              onClick={() => setSelectedImage(i)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                selectedImage === i ? "bg-orange-600 w-6" : "bg-white/50"
              )}
            />
          ))}
        </div>
      </section>

      {/* Content */}
      <div className="p-6 flex flex-col gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded uppercase">Verified Vendor</span>
            <div className="flex items-center gap-1">
              <Star size={12} className="text-yellow-400" fill="currentColor" />
              <span className="text-xs font-bold text-gray-700">{product.rating} ({product.totalReviews} reviews)</span>
            </div>
          </div>
          <h1 className="text-xl font-black text-gray-900 leading-tight mb-2">{product.name}</h1>
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-black text-orange-600">Rs. {product.discountPrice || product.price}</span>
            {product.discountPrice && (
              <span className="text-sm text-gray-400 line-through font-bold">Rs. {product.price}</span>
            )}
            {product.discountPrice && (
              <span className="text-xs font-black text-green-600 border border-green-200 bg-green-50 px-2 py-0.5 rounded">
                SAVE {Math.round((1 - product.discountPrice/product.price) * 100)}%
              </span>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-3 gap-2 py-4 border-y border-gray-100">
          <div className="flex flex-col items-center gap-1 text-center">
            <Truck size={20} className="text-orange-500" />
            <span className="text-[10px] font-bold text-gray-600">Standard Delivery</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-center border-x border-gray-100">
            <ShieldCheck size={20} className="text-blue-500" />
            <span className="text-[10px] font-bold text-gray-600">Secure Payment</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <RefreshCw size={20} className="text-green-500" />
            <span className="text-[10px] font-bold text-gray-600">7 Days Return</span>
          </div>
        </div>

        {/* Quantity and Actions */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between bg-gray-50 p-2 rounded-2xl border border-gray-100">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-4">Quantity</span>
            <div className="flex items-center bg-white border border-gray-200 rounded-xl px-1 shadow-sm">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 text-gray-500 hover:text-orange-600 transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus size={18} />
              </button>
              <span className="w-8 text-center font-black text-gray-900">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="p-2 text-gray-500 hover:text-orange-600 transition-colors"
                aria-label="Increase quantity"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleAddToCart}
              className="bg-white text-orange-600 border-2 border-orange-600 font-black py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all text-xs uppercase tracking-widest"
            >
              <ShoppingCart size={18} />
              Add to Cart
            </button>
            <button 
              onClick={handleBuyNow}
              className="bg-orange-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-orange-100 flex items-center justify-center gap-2 active:scale-95 transition-all text-xs uppercase tracking-widest"
            >
              Buy Now
            </button>
          </div>
        </div>

        {/* Description */}
        <section>
          <h3 className="font-black text-gray-900 mb-3 border-b border-orange-500 inline-block pb-1">Product Description</h3>
          <div className="text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none">
            <ReactMarkdown>{product.description}</ReactMarkdown>
          </div>
        </section>

        {/* Vendor Info */}
        {vendor && (
          <section className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white p-2 shadow-sm border border-gray-100">
                <img src={vendor.logo || 'https://via.placeholder.com/100'} loading="lazy" className="w-full h-full object-contain" alt="" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900">{vendor.businessName}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{vendor.totalSales} Sales</span>
                  <div className="flex items-center gap-1">
                    <Star size={10} className="text-yellow-400" fill="currentColor" />
                    <span className="text-[10px] font-bold text-gray-500">{vendor.rating} Ratings</span>
                  </div>
                </div>
              </div>
              <button className="text-[10px] font-black text-orange-600 bg-white border border-orange-200 px-3 py-1.5 rounded-full shadow-sm">FOLLOW STORE</button>
            </div>
          </section>
        )}

        {/* Customer Reviews Section */}
        <section className="space-y-6 pt-4 border-t border-gray-100">
           <div className="flex justify-between items-center">
              <h3 className="font-black text-gray-900 uppercase tracking-wide">Customer Reviews</h3>
              <div className="flex items-center gap-1">
                 <Star size={14} className="text-yellow-400" fill="currentColor" />
                 <span className="text-xs font-black">{product.rating} / 5</span>
              </div>
           </div>

           {reviews.length > 0 ? (
             <div className="space-y-6">
                {reviews.map((rev) => (
                  <div key={rev.reviewId} className="space-y-2 border-b border-gray-50 pb-6 last:border-0">
                     <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                           <img 
                             src={rev.customerImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${rev.customerId}`} 
                             className="w-8 h-8 rounded-full border border-gray-100" 
                             alt="" 
                           />
                           <div>
                              <p className="text-xs font-black text-gray-900">{rev.customerName}</p>
                              <div className="flex items-center gap-0.5 mt-0.5">
                                 {[1, 2, 3, 4, 5].map(s => (
                                   <Star key={s} size={10} className={s <= rev.rating ? "text-yellow-400" : "text-gray-200"} fill={s <= rev.rating ? "currentColor" : "none"} />
                                 ))}
                              </div>
                           </div>
                        </div>
                        <span className="text-[8px] font-bold text-gray-400 uppercase">{formatDate(rev.createdAt)}</span>
                     </div>
                     <p className="text-xs text-gray-600 leading-relaxed font-medium italic">"{rev.comment}"</p>
                     {rev.images && rev.images.length > 0 && (
                       <div className="flex gap-2 pt-2 overflow-x-auto scrollbar-hide">
                          {rev.images.map((img, idx) => (
                            <img key={idx} src={img} className="w-20 h-20 rounded-xl object-cover border border-gray-100 shadow-sm" alt="" />
                          ))}
                       </div>
                     )}
                  </div>
                ))}
             </div>
           ) : (
             <div className="bg-gray-50 p-8 rounded-3xl text-center border border-dashed border-gray-200">
                <Star size={32} className="mx-auto mb-2 text-gray-200" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-loose">No customer experiences recorded yet.<br/>Be the first if you've purchased this!</p>
             </div>
           )}
        </section>
      </div>

      {/* Full Image Preview Modal */}
      <AnimatePresence>
        {showFullImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md"
            onClick={() => setShowFullImage(false)}
          >
            <button 
              onClick={() => setShowFullImage(false)}
              className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <X size={24} />
            </button>
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-[90vw] max-h-[85vh] flex flex-col items-center gap-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-full h-full bg-white rounded-3xl overflow-hidden shadow-2xl p-2">
                <img 
                  src={product.images[selectedImage]} 
                  className="w-full h-full object-contain max-h-[70vh] rounded-2xl" 
                  alt="Full preview" 
                />
              </div>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => handleDownload(product.images[selectedImage], `Product_${product.name}`)}
                  className="bg-white text-gray-900 font-black px-8 py-4 rounded-2xl shadow-xl flex items-center gap-2 active:scale-95 transition-transform"
                >
                  <Download size={20} /> Download Original
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
