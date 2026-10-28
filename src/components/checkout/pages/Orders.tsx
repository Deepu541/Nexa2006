import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, ChevronRight, Package, Clock, CheckCircle2, XCircle, Star, Send, Camera, X } from 'lucide-react';
import { collection, query, where, getDocs, orderBy, addDoc, serverTimestamp, updateDoc, doc, increment } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';
import { Order, Review, OrderItem } from '../../../types';
import { cn, formatDate, compressImage } from '../../../utils';
import { useNavigate } from 'react-router-dom';

function ReviewModal({ 
  orderId, 
  item, 
  onClose, 
  onSuccess 
}: { 
  orderId: string, 
  item: OrderItem, 
  onClose: () => void, 
  onSuccess: () => void 
}) {
  const { profile } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (comment.length < 5) return alert("Please provide a more detailed review.");
    
    setSubmitting(true);
    try {
      const reviewData: Partial<Review> = {
        productId: item.productId,
        orderId: orderId,
        customerId: profile.userId,
        customerName: profile.fullName,
        customerImage: profile.profileImage,
        rating,
        comment,
        images,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'reviews'), reviewData);
      
      // Update product rating (simple increment for now)
      await updateDoc(doc(db, 'products', item.productId), {
        totalReviews: increment(1),
        // Average rating calculation would be more complex in a real batch, 
        // but for this MVP we'll just track count.
      });

      alert("Review submitted successfully!");
      onSuccess();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'reviews');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string, 600, 600, 0.6);
        setImages(prev => [...prev, compressed]);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="bg-white w-full max-w-sm rounded-[32px] p-6 space-y-6 relative max-h-[90vh] overflow-y-auto"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-50 text-gray-400 rounded-full"><X size={16} /></button>
        
        <div className="text-center space-y-2">
          <h3 className="text-lg font-black text-gray-900 tracking-tight">Rate Product</h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Share your experience with other customers</p>
        </div>

        <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-2xl">
          <img src={item.image} className="w-12 h-12 rounded-xl object-cover shrink-0" alt="" />
          <p className="text-xs font-black text-gray-900 truncate">{item.name}</p>
        </div>

        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map(s => (
            <button key={s} onClick={() => setRating(s)} className={cn("transition-transform active:scale-90", s <= rating ? "text-yellow-400" : "text-gray-200")}>
              <Star size={32} fill={s <= rating ? "currentColor" : "none"} strokeWidth={2.5} />
            </button>
          ))}
        </div>

        <textarea 
          className="w-full bg-gray-50 border border-transparent rounded-2xl p-4 text-xs h-32 outline-none focus:bg-white focus:border-orange-100 transition-all font-medium"
          placeholder="What did you like or dislike about the product?"
          value={comment}
          onChange={e => setComment(e.target.value)}
        />

        <div className="space-y-3">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Photo Review (Optional)</p>
          <div className="flex flex-wrap gap-2">
            {images.map((img, idx) => (
              <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-100">
                <img src={img} className="w-full h-full object-cover" alt="" />
                <button onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1 right-1 bg-red-600 text-white p-0.5 rounded-full"><X size={8} /></button>
              </div>
            ))}
            {images.length < 3 && (
              <label className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-300 cursor-pointer hover:bg-gray-50 transition-colors">
                <Camera size={20} />
                <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageUpload} />
              </label>
            )}
          </div>
        </div>

        <button 
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-orange-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-orange-100 active:scale-95 transition-all text-xs uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? "Publishing Review..." : <><Send size={16} /> Submit Review</>}
        </button>
      </motion.div>
    </motion.div>
  );
}

import { Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Bike, User, Map as MapIcon, RotateCcw, PenTool, Navigation as NavIcon } from 'lucide-react';
import { onSnapshot } from 'firebase/firestore';
import { isGoogleMapsKeyValid } from '../../../lib/maps';

function LiveTrackingMap({ orderId, riderId, customerLocation }: { orderId: string, riderId: string, customerLocation: { latitude: number, longitude: number } }) {
  const [riderLocation, setRiderLocation] = useState<{ latitude: number, longitude: number } | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'riders', riderId), (snap) => {
      if (snap.exists() && snap.data().currentLocation) {
        setRiderLocation(snap.data().currentLocation);
      }
    });
    return () => unsub();
  }, [riderId]);

  if (!isGoogleMapsKeyValid()) return null;

  return (
    <div className="w-full aspect-[4/3] rounded-[2rem] overflow-hidden border border-gray-100 shadow-inner relative mt-4">
      <Map
        mapId="DEMO_MAP_ID"
        defaultCenter={{ lat: customerLocation.latitude, lng: customerLocation.longitude }}
        defaultZoom={15}
        disableDefaultUI={true}
        className="w-full h-full"
      >
        <AdvancedMarker position={{ lat: customerLocation.latitude, lng: customerLocation.longitude }}>
           <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-xl rotate-3 border-2 border-white">
              <User size={16} />
           </div>
        </AdvancedMarker>
        {riderLocation && (
          <AdvancedMarker position={{ lat: riderLocation.latitude, lng: riderLocation.longitude }}>
             <div className="bg-orange-600 p-2 rounded-xl text-white shadow-xl -rotate-3 border-2 border-white">
                <Bike size={16} />
             </div>
          </AdvancedMarker>
        )}
      </Map>
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-gray-100 shadow-xl flex items-center gap-3">
         <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-lg"><NavIcon size={16} /></div>
         <div>
            <p className="text-[10px] font-black text-gray-900 uppercase tracking-tighter">Live Delivery Tracking</p>
            <p className="text-[8px] font-bold text-gray-400 uppercase">Rider is en route to your sector</p>
         </div>
      </div>
    </div>
  );
}

export default function Orders() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReview, setActiveReview] = useState<{ orderId: string, item: OrderItem } | null>(null);
  const [reviewedProductIds, setReviewedProductIds] = useState<string[]>([]);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      if (!profile?.userId) return;
      try {
        const q = query(
          collection(db, 'orders'),
          where('customerId', '==', profile.userId),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        setOrders(snap.docs.map(doc => ({ ...doc.data(), orderId: doc.id } as Order)));
      } catch (err) {
        console.error("Order fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [profile?.userId]);

  // Fetch already reviewed products to avoid double reviews
  useEffect(() => {
    async function fetchReviewed() {
      if (!profile?.userId) return;
      try {
        const q = query(collection(db, 'reviews'), where('customerId', '==', profile.userId));
        const snap = await getDocs(q);
        setReviewedProductIds(snap.docs.map(doc => doc.data().productId));
      } catch (err) {
        console.error("Fetch reviews error:", err);
      }
    }
    fetchReviewed();
  }, [profile?.userId]);

  const handleRequestRefund = async (orderId: string) => {
    if (!confirm("Are you sure you want to request a refund for this order? This will alert the administrators to process cashflow repatriation.")) return;

    try {
      // 1. Update order payment status to 'refund_requested'
      await updateDoc(doc(db, 'orders', orderId), {
        paymentStatus: 'refund_requested',
        updatedAt: serverTimestamp()
      });

      // 2. Query corresponding payment transaction document in Firestore
      const q = query(
        collection(db, 'payments'),
        where('orderId', '==', orderId)
      );
      const paySnap = await getDocs(q);
      if (!paySnap.empty) {
        const payDoc = paySnap.docs[0];
        await updateDoc(doc(db, 'payments', payDoc.id), {
          paymentStatus: 'refund_requested'
        });
      }

      // 3. Local state updates for smooth reactivity
      setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, paymentStatus: 'refund_requested' } : o));
      alert("Your refund request has been logged successfully. The administrator will review and process your remittance.");
    } catch (err: any) {
      console.error("Failed to request refund:", err);
      alert("Error logging refund request: " + err.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-50 text-yellow-600 border-yellow-100';
      case 'processing': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'shipped': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'delivered': return 'bg-green-50 text-green-600 border-green-100';
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={14} />;
      case 'delivered': return <CheckCircle2 size={14} />;
      case 'cancelled': return <XCircle size={14} />;
      default: return <Package size={14} />;
    }
  };

  if (loading) return <div className="p-8 text-center text-xs font-black text-gray-400 animate-pulse uppercase tracking-[0.2em]">Retrieving your orders...</div>;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      <div className="bg-white p-6 border-b border-gray-100 sticky top-0 z-30">
        <h1 className="text-xl font-black text-gray-900 tracking-tight">My Orders</h1>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Order History & Status</p>
      </div>

      <div className="p-4 space-y-4">
        <AnimatePresence>
          {activeReview && (
            <ReviewModal 
              orderId={activeReview.orderId}
              item={activeReview.item}
              onClose={() => setActiveReview(null)}
              onSuccess={() => {
                setReviewedProductIds(prev => [...prev, activeReview.item.productId]);
                setActiveReview(null);
              }}
            />
          )}
        </AnimatePresence>

        {orders.map((order) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={order.orderId}
            className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2">
                <ShoppingBag size={16} className="text-orange-600" />
                <span className="text-xs font-black text-gray-900">#{order.orderId.slice(-6).toUpperCase()}</span>
              </div>
              <div className={cn(
                "text-[9px] font-black px-2 py-1 rounded-full border flex items-center gap-1 uppercase tracking-wider",
                getStatusColor(order.status)
              )}>
                {getStatusIcon(order.status)}
                {order.status}
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {order.items.map((item, idx) => (
                  <div key={idx} className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 shrink-0 shadow-sm">
                    <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-end">
                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total Amount</p>
                    <p className="text-lg font-black text-gray-900 leading-none">Rs. {order.totalAmount}</p>
                    <p className="text-[8px] text-gray-400 font-bold uppercase mt-1">{formatDate(order.createdAt)}</p>
                  </div>
                  
                  <div className="flex flex-col items-start gap-1 p-2 bg-gray-50 rounded-2xl border border-gray-100 max-w-[180px]">
                    <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest block leading-none">Receipt Verification</span>
                    {order.paymentMethod === 'COD' ? (
                      <span className="text-[8.5px] font-extrabold uppercase text-gray-600">Cash On Delivery</span>
                    ) : order.paymentStatus === 'verification_pending' ? (
                      <span className="text-[8.5px] font-extrabold uppercase text-amber-600 font-mono">Payment pending verification</span>
                    ) : order.paymentStatus === 'paid' ? (
                      <span className="text-[8.5px] font-extrabold uppercase text-emerald-600 font-mono">Payment approved</span>
                    ) : order.paymentStatus === 'rejected' ? (
                      <span className="text-[8.5px] font-extrabold uppercase text-red-650 font-mono">Payment rejected</span>
                    ) : order.paymentStatus === 'refund_requested' ? (
                      <span className="text-[8.5px] font-extrabold uppercase text-purple-650 font-mono animate-pulse">Refund Requested</span>
                    ) : order.paymentStatus === 'refunded' ? (
                      <span className="text-[8.5px] font-extrabold uppercase text-indigo-700 font-mono">Refund Approved</span>
                    ) : (
                      <span className="text-[8.5px] font-extrabold uppercase text-gray-500 font-mono">{order.paymentStatus?.replace('_', ' ') || 'Awaiting Proof'}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                   {order.deliveryStatus === 'out_for_delivery' && order.riderId && (
                      <button 
                        onClick={() => setTrackingOrderId(trackingOrderId === order.orderId ? null : order.orderId)}
                        className="text-[8px] font-black bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg border border-blue-100 uppercase tracking-widest active:scale-95 transition-transform flex items-center gap-1"
                      >
                        <NavIcon size={10} /> {trackingOrderId === order.orderId ? 'Hide Tracking' : 'Track Order'}
                      </button>
                   )}
                   {order.status === 'delivered' && order.items.map((item, idx) => (
                      !reviewedProductIds.includes(item.productId) && (
                         <button 
                           key={idx}
                           onClick={() => setActiveReview({ orderId: order.orderId, item })}
                           className="text-[8px] font-black bg-orange-50 text-orange-600 px-2.5 py-1 rounded-lg border border-orange-100 uppercase tracking-widest active:scale-95 transition-transform"
                         >
                           Review {order.items.length > 1 ? `Item ${idx + 1}` : 'Product'}
                         </button>
                      )
                   ))}
                   {order.paymentMethod !== 'COD' && order.paymentStatus === 'paid' && order.status !== 'cancelled' && (
                     <button 
                       type="button"
                       onClick={() => handleRequestRefund(order.orderId)}
                       className="text-[8px] font-black bg-purple-50 hover:bg-purple-600 hover:text-white text-purple-700 px-2.5 py-1.5 rounded-[10px] border border-purple-150 uppercase tracking-widest active:scale-95 transition-all text-center shrink-0"
                     >
                       Request Refund
                     </button>
                   )}
                   <button className="text-[10px] font-black text-orange-600 flex items-center gap-1 group">
                     Details <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                   </button>
                </div>
              </div>

              {trackingOrderId === order.orderId && order.riderId && order.shippingAddress.latitude && order.shippingAddress.longitude && (
                 <LiveTrackingMap 
                    orderId={order.orderId} 
                    riderId={order.riderId} 
                    customerLocation={{ latitude: order.shippingAddress.latitude, longitude: order.shippingAddress.longitude }} 
                 />
              )}
            </div>
          </motion.div>
        ))}

        {orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-300">
              <ShoppingBag size={40} />
            </div>
            <div>
              <p className="font-black text-gray-900">No orders yet</p>
              <p className="text-xs text-gray-400 font-medium">Start shopping to see your orders here!</p>
            </div>
            <button 
              onClick={() => navigate('/')}
              className="bg-orange-600 text-white font-black px-6 py-2.5 rounded-full text-xs shadow-lg shadow-orange-100 active:scale-95 transition-transform"
            >
              Exlpore Marketplace
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
