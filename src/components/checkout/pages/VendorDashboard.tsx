import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, Package, ShoppingBag, BarChart3, Plus, Search, 
  ChevronRight, Edit3, Trash2, X, Upload, Save, CheckCircle, Store,
  Wallet, MessageSquare, Megaphone, FileText, Settings, ArrowUpRight,
  TrendingUp, Users, DollarSign, Clock, Check, AlertCircle, Eye,
  Camera, Briefcase, CreditCard, Shield, AlertTriangle, Image as ImageIcon,
  Ticket, MapPin, Truck, Bot, Sparkles, Wand2, Loader2
} from 'lucide-react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, setDoc, doc, updateDoc, deleteDoc, orderBy, limit, onSnapshot, writeBatch, increment } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';
import { Product, Vendor, Category, Order, WithdrawalRequest, ProductVariation, ProductSpec, Coupon } from '../../../types';
import { cn, compressImage, formatDate, getApiUrl } from '../../../utils';

function QRModal({ qr, title, onClose }: { qr: string, title: string, onClose: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white p-6 rounded-[32px] w-full max-w-sm space-y-6 relative"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-50 text-gray-400 rounded-full">
          <X size={16} />
        </button>
        <div className="text-center space-y-1">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">{title}</h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Payout Configuration Preview</p>
        </div>
        <div className="aspect-square bg-gray-50 rounded-2xl border-4 border-gray-100 p-4 flex items-center justify-center overflow-hidden">
          <img src={qr} className="w-full h-full object-contain" alt="QR Code" />
        </div>
        <button 
          onClick={onClose}
          className="w-full bg-orange-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] shadow-lg shadow-orange-100"
        >
          Close Preview
        </button>
      </motion.div>
    </motion.div>
  );
}

export default function VendorDashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [vendorData, setVendorData] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedQR, setSelectedQR] = useState<{ qr: string, title: string } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!profile?.userId) {
      setLoading(false);
      return;
    }

    // Main Vendor Profile Listener - This should be fast
    const vendorDocRef = doc(db, 'vendors', profile.userId);
    const unsubscribeVendor = onSnapshot(vendorDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setVendorData({ ...docSnap.data(), vendorId: docSnap.id } as Vendor);
      }
      setLoading(false);
    }, (err) => {
      console.error("Vendor profile error:", err);
      setLoading(false);
    });

    // Sub-data Listeners (Parallel) - Optimized to be index-free with client-side status filtering
    const prodsQuery = query(collection(db, 'products'), where('vendorId', '==', profile.userId));
    const unsubscribeProds = onSnapshot(prodsQuery, (snap) => {
      const allProds = snap.docs.map(d => ({ ...d.data(), productId: d.id } as Product));
      setProducts(allProds.filter(p => p.status !== 'deleted'));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'products');
    });

    const couponQuery = query(collection(db, 'coupons'), where('vendorId', '==', profile.userId));
    const unsubscribeCoupons = onSnapshot(couponQuery, (snap) => {
      setCoupons(snap.docs.map(d => ({ ...d.data() } as Coupon)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'coupons');
    });

    const orderQuery = query(collection(db, 'orders'), where('vendorIds', 'array-contains', profile.userId));
    const unsubscribeOrders = onSnapshot(orderQuery, (snap) => {
      setOrders(snap.docs.map(d => ({ ...d.data(), orderId: d.id } as Order)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'orders');
    });

    return () => {
      unsubscribeVendor();
      unsubscribeProds();
      unsubscribeCoupons();
      unsubscribeOrders();
    };
  }, [profile?.userId]);

  if (loading && !vendorData) return <div className="p-8 text-center text-xs font-black text-gray-400 animate-pulse uppercase tracking-[0.2em] min-h-screen flex items-center justify-center">Authenticating Session...</div>;

  if (!vendorData) {
    return <VendorRegistration onComplete={() => window.location.reload()} />;
  }

  if (vendorData.status === 'pending') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center space-y-6">
        <div className="w-24 h-24 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center animate-bounce shadow-xl shadow-yellow-100">
          <Clock size={48} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-900">Application Under Review</h2>
          <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">Our administrators are verifying your KYC documents. This usually takes 24-48 hours. We'll notify you once approved.</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-2xl w-full max-w-sm border border-gray-100 italic text-[10px] text-gray-400">
          "Patience is the foundation of a great business."
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'products', label: 'Inventory', icon: Package },
    { id: 'promotions', label: 'Offers', icon: Ticket },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-24">
      <AnimatePresence>
        {selectedQR && (
          <QRModal 
            qr={selectedQR.qr} 
            title={selectedQR.title} 
            onClose={() => setSelectedQR(null)} 
          />
        )}
      </AnimatePresence>
      {/* Dynamic Header */}
      <div id="vendor-header" className="bg-gray-900 text-white p-6 pb-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-600 rounded-full translate-x-1/2 -translate-y-1/2 opacity-20 blur-3xl animate-pulse" />
        <div className="flex justify-between items-start relative z-10">
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight">{vendorData.businessName}</h1>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded-full border border-orange-400/20">Official Seller</span>
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full">
                <Clock size={10} />
                {currentTime.toLocaleDateString([], { day: '2-digit', month: 'short' })} • {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Rating: {vendorData.rating}★</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('settings')}
              className="bg-white/10 p-2 rounded-xl backdrop-blur-md border border-white/20 active:scale-90 transition-all"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-16 relative z-20 flex-1 flex flex-col gap-6">
        {/* Real-time Stats */}
        <div id="vendor-stats-grid" className="grid grid-cols-2 gap-3">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white p-5 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 group overflow-hidden relative">
            <div className="absolute -right-2 -bottom-2 text-gray-50 group-hover:text-orange-50 transition-colors">
              <DollarSign size={80} />
            </div>
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Revenue</p>
            </div>
            <p className="text-xl font-black text-gray-900 leading-tight">Rs. {vendorData.totalRevenue?.toLocaleString() || 0}</p>
            <div className="mt-2 text-[8px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-black inline-block whitespace-nowrap">+18.5% Growth</div>
          </motion.div>
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white p-5 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 group overflow-hidden relative">
            <div className="absolute -right-2 -bottom-2 text-gray-50 group-hover:text-orange-50 transition-colors">
              <ShoppingBag size={80} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Sales</p>
            <p className="text-xl font-black text-gray-900 leading-tight">{vendorData.totalSales || 0}</p>
            <div className="mt-2 text-[8px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-black inline-block">12 New Today</div>
          </motion.div>
        </div>

        {/* Tab Navigation (Horizontal Scrollable) */}
        <div id="vendor-nav-tabs" className="flex bg-white rounded-2xl p-1 gap-1 shadow-sm border border-gray-100 overflow-x-auto scrollbar-hide sticky top-4 z-40">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all whitespace-nowrap shrink-0",
                activeTab === item.id ? "bg-orange-600 text-white shadow-lg shadow-orange-200" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              )}
            >
              <item.icon size={14} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                {/* Orders Overview */}
                <div className="grid grid-cols-2 gap-3">
                   <div className="bg-red-50 p-4 rounded-3xl border border-red-100">
                      <p className="text-[8px] font-black text-red-600 uppercase tracking-widest mb-1">New Orders</p>
                      <p className="text-lg font-black text-gray-900">{orders.filter(o => o.status === 'pending').length}</p>
                   </div>
                   <div className="bg-blue-50 p-4 rounded-3xl border border-blue-100">
                      <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest mb-1">Processing</p>
                      <p className="text-lg font-black text-gray-900">{orders.filter(o => o.status === 'processing').length}</p>
                   </div>
                </div>
                {/* Sales Chart Placeholder */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                   <div className="flex justify-between items-center">
                      <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Performance</h3>
                      <BarChart3 size={16} className="text-orange-600" />
                   </div>
                   <div className="h-32 flex items-end gap-1 px-2">
                      {[40, 70, 45, 90, 65, 80, 50, 100, 75, 85, 60, 95].map((h, i) => (
                        <div key={i} className="flex-1 bg-orange-100 rounded-t-sm relative group">
                          <motion.div 
                            initial={{ height: 0 }} 
                            animate={{ height: `${h}%` }} 
                            className="bg-orange-600 rounded-t-sm w-full" 
                          />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-[8px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">Rs. {h * 10}</div>
                        </div>
                      ))}
                   </div>
                   <div className="flex justify-between text-[8px] font-black text-gray-400 uppercase tracking-tighter px-2">
                      <span>Mon</span>
                      <span>Wed</span>
                      <span>Fri</span>
                      <span>Sun</span>
                   </div>
                </div>

              </motion.div>
            )}

            {activeTab === 'orders' && (
              <VendorOrderManager orders={orders} vendorId={profile!.userId} />
            )}

            {activeTab === 'products' && (
              <motion.div key="products" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input type="text" placeholder="Search inventory..." className="w-full bg-white border border-gray-100 rounded-2xl py-3.5 pl-10 pr-4 text-xs font-bold focus:ring-2 focus:ring-orange-500 outline-none shadow-sm" />
                  </div>
                  <button onClick={() => setActiveTab('add_product')} className="bg-orange-600 text-white p-3.5 rounded-2xl shadow-xl shadow-orange-100 active:scale-90 transition-all shrink-0">
                    <Plus size={20} />
                  </button>
                </div>

                <div className="grid gap-3">
                  {products.map(prod => (
                    <div key={prod.productId} className="bg-white p-3 rounded-2xl border border-gray-100 flex gap-4 shadow-sm group active:scale-[0.99] transition-all">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 border border-gray-50 shrink-0 relative">
                        <img src={prod.images[0]} className="w-full h-full object-cover" alt={prod.name} />
                        {prod.stock < 5 && (
                          <div className="absolute top-1 left-1 bg-red-600 text-white text-[7px] font-black px-1 rounded uppercase tracking-tighter">Low Stock</div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <h4 className="text-[10px] font-black text-gray-800 line-clamp-1 uppercase tracking-wider">{prod.name}</h4>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs font-black text-orange-600">Rs. {prod.price}</span>
                            <span className={cn(
                              "text-[8px] font-black px-2 py-0.5 rounded",
                              prod.status === 'approved' ? 'bg-green-50 text-green-600' : 
                              prod.status === 'pending' ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'
                            )}>{prod.status.toUpperCase()}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-2">
                          <button 
                            onClick={async () => {
                              const path = `products/${prod.productId}`;
                              try {
                                await updateDoc(doc(db, 'products', prod.productId), { 
                                  flashSalePrice: prod.flashSalePrice ? null : prod.price * 0.9, 
                                  flashSaleEnd: prod.flashSalePrice ? null : new Date(Date.now() + 86400000).toISOString() 
                                });
                                setProducts(prev => prev.map(p => p.productId === prod.productId ? { ...p, flashSalePrice: p.flashSalePrice ? undefined : p.price * 0.9 } : p));
                              } catch (err) {
                                handleFirestoreError(err, OperationType.UPDATE, path);
                              }
                            }}
                            className={cn(
                              "flex-1 py-1.5 rounded-lg text-[7px] font-black uppercase tracking-widest border transition-all",
                              prod.flashSalePrice ? "bg-orange-600 text-white border-orange-600" : "bg-white text-gray-400 border-gray-100"
                            )}
                          >
                            Flash Sale
                          </button>
                          <button 
                            onClick={async () => {
                              const path = `products/${prod.productId}`;
                              try {
                                await updateDoc(doc(db, 'products', prod.productId), { trending: !prod.trending });
                                setProducts(prev => prev.map(p => p.productId === prod.productId ? { ...p, trending: !p.trending } : p));
                              } catch (err) {
                                handleFirestoreError(err, OperationType.UPDATE, path);
                              }
                            }}
                            className={cn(
                              "flex-1 py-1.5 rounded-lg text-[7px] font-black uppercase tracking-widest border transition-all",
                              prod.trending ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-400 border-gray-100"
                            )}
                          >
                            Trending
                          </button>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => {
                                setEditingProduct(prod);
                                setActiveTab('edit_product');
                              }}
                              className="text-gray-300 hover:text-orange-600 transition-colors p-1"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button className="text-gray-300 hover:text-red-500 transition-colors p-1" onClick={async () => {
                              if (confirm("Delete this product?")) {
                                const path = `products/${prod.productId}`;
                                try {
                                  await updateDoc(doc(db, 'products', prod.productId), { status: 'deleted' });
                                  setProducts(prev => prev.filter(p => p.productId !== prod.productId));
                                } catch (err) {
                                  handleFirestoreError(err, OperationType.WRITE, path);
                                }
                              }
                            }}><Trash2 size={14} /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {products.length === 0 && (
                    <div className="text-center py-20 opacity-30 text-[10px] font-black uppercase tracking-widest">Your inventory is empty</div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'wallet' && vendorData && (
              <WalletTab vendor={vendorData} setVendorData={setVendorData} />
            )}

            {activeTab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-12">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest px-1">Shop Visuals & Payouts</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Logo Upload */}
                      <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="relative w-20 h-20 bg-white rounded-2xl border border-gray-200 overflow-hidden shrink-0 shadow-sm">
                          {vendorData.logo ? (
                            <img src={vendorData.logo} className="w-full h-full object-cover" alt="Shop logo" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                              <ImageIcon size={32} />
                              <span className="text-[7px] font-black uppercase mt-1">Logo</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <p className="text-[10px] font-black text-gray-900 uppercase">Shop Logo</p>
                          <label className="inline-flex bg-orange-600 text-white text-[9px] font-black px-4 py-2 rounded-lg cursor-pointer active:scale-95 transition-all shadow-lg shadow-orange-100">
                            Upload
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = async () => {
                                    const compressed = await compressImage(reader.result as string, 400, 400, 0.6);
                                    await updateDoc(doc(db, 'vendors', vendorData.vendorId), { logo: compressed });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Khalti QR */}
                      <div className="flex items-center gap-6 p-4 bg-purple-50 rounded-2xl border border-purple-100">
                        <div className="relative w-20 h-20 bg-white rounded-2xl border border-purple-200 overflow-hidden shrink-0 shadow-sm flex items-center justify-center">
                          {vendorData.khaltiQrCode ? (
                            <div className="w-full h-full relative group">
                              <img src={vendorData.khaltiQrCode} className="w-full h-full object-cover" alt="Khalti QR" />
                              <button 
                                onClick={() => setSelectedQR({ qr: vendorData.khaltiQrCode!, title: 'Your Khalti QR' })}
                                className="absolute inset-0 bg-black/40 text-white text-[8px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1"
                              >
                                <Eye size={12} /> Preview
                              </button>
                            </div>
                          ) : (
                            <div className="text-purple-600 flex flex-col items-center">
                               <Plus size={24} />
                               <span className="text-[7px] font-black uppercase mt-1">Khalti QR</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                           <p className="text-[10px] font-black text-purple-900 uppercase">Khalti Payout QR</p>
                           <label className="inline-flex bg-purple-600 text-white text-[9px] font-black px-4 py-2 rounded-lg cursor-pointer active:scale-95 transition-all">
                              Upload QR
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = async () => {
                                      const compressed = await compressImage(reader.result as string, 400, 400, 0.6);
                                      await updateDoc(doc(db, 'vendors', vendorData.vendorId), { khaltiQrCode: compressed });
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                           </label>
                        </div>
                      </div>

                      {/* eSewa QR */}
                      <div className="flex items-center gap-6 p-4 bg-green-50 rounded-2xl border border-green-100">
                        <div className="relative w-20 h-20 bg-white rounded-2xl border border-green-200 overflow-hidden shrink-0 shadow-sm flex items-center justify-center">
                          {vendorData.esewaQrCode ? (
                            <div className="w-full h-full relative group">
                              <img src={vendorData.esewaQrCode} className="w-full h-full object-cover" alt="eSewa QR" />
                              <button 
                                onClick={() => setSelectedQR({ qr: vendorData.esewaQrCode!, title: 'Your eSewa QR' })}
                                className="absolute inset-0 bg-black/40 text-white text-[8px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1"
                              >
                                <Eye size={12} /> Preview
                              </button>
                            </div>
                          ) : (
                            <div className="text-green-600 flex flex-col items-center">
                               <Plus size={24} />
                               <span className="text-[7px] font-black uppercase mt-1">eSewa QR</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                           <p className="text-[10px] font-black text-green-900 uppercase">eSewa Payout QR</p>
                           <label className="inline-flex bg-green-600 text-white text-[9px] font-black px-4 py-2 rounded-lg cursor-pointer active:scale-95 transition-all">
                              Upload QR
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = async () => {
                                      const compressed = await compressImage(reader.result as string, 400, 400, 0.6);
                                      await updateDoc(doc(db, 'vendors', vendorData.vendorId), { esewaQrCode: compressed });
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                           </label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Banner Upload */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-gray-900 uppercase px-1">Shop Banner</p>
                        <div className="relative aspect-video bg-gray-100 rounded-[28px] border-2 border-dashed border-gray-200 overflow-hidden group">
                          {vendorData.banner ? (
                            <img src={vendorData.banner} className="w-full h-full object-cover" alt="Shop banner" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                              <Camera size={40} />
                              <span className="text-[10px] font-black uppercase mt-2">Upload Shop Cover</span>
                            </div>
                          )}
                          <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                            <Upload className="text-white" size={32} />
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = async () => {
                                    const compressed = await compressImage(reader.result as string, 1200, 600, 0.6);
                                    await updateDoc(doc(db, 'vendors', vendorData.vendorId), { banner: compressed });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-50 flex flex-col gap-4">
                     <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest px-1">Business Identity</h4>
                     <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Business Name</label>
                          <input 
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 text-sm font-black focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                            value={vendorData.businessName}
                            onChange={e => setVendorData({ ...vendorData, businessName: e.target.value })}
                            onBlur={() => updateDoc(doc(db, 'vendors', vendorData.vendorId), { businessName: vendorData.businessName })}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Shop Description</label>
                          <textarea 
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 text-sm font-medium h-32 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                            value={vendorData.description}
                            onChange={e => setVendorData({ ...vendorData, description: e.target.value })}
                            onBlur={() => updateDoc(doc(db, 'vendors', vendorData.vendorId), { description: vendorData.description })}
                          />
                        </div>
                     </div>
                  </div>
                </div>

                <div className="bg-orange-950 p-6 rounded-3xl text-white space-y-4">
                  <div className="flex items-center gap-3">
                    <Shield className="text-orange-400" size={24} />
                    <h3 className="text-sm font-black uppercase tracking-widest">Ownership & Compliance</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                      <p className="text-[8px] font-black text-orange-400 uppercase tracking-widest mb-1">PAN Number</p>
                      <p className="text-xs font-black">{vendorData.kyc?.panNumber}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                      <p className="text-[8px] font-black text-orange-400 uppercase tracking-widest mb-1">KYC Status</p>
                      <p className="text-xs font-black text-green-400">Verified</p>
                    </div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl text-[8px] text-orange-200/50 uppercase font-bold tracking-widest">To update compliance documents, please contact platform support.</div>
                </div>

                <div className="p-6 bg-orange-50 rounded-3xl border border-orange-100 space-y-3">
                   <div className="flex items-center gap-2 text-orange-600">
                      <Shield size={18} />
                      <h4 className="text-[10px] font-black uppercase tracking-widest">Security & Compliance</h4>
                   </div>
                   <p className="text-[9px] text-orange-700 font-medium">Your account is currently in Good Standing. All financial transactions are secured with military-grade encryption.</p>
                </div>
              </motion.div>
            )}

            {activeTab === 'add_product' && (
              <AddProductForm onComplete={() => setActiveTab('products')} />
            )}

            {activeTab === 'edit_product' && editingProduct && (
              <AddProductForm 
                product={editingProduct} 
                onComplete={() => {
                  setEditingProduct(null);
                  setActiveTab('products');
                }} 
              />
            )}

            {activeTab === 'promotions' && profile?.userId && (
              <CouponManager coupons={coupons} setCoupons={setCoupons} vendorId={profile.userId} />
            )}

            {['chat'].includes(activeTab) && (
              <div className="p-20 text-center opacity-30 flex flex-col items-center gap-4">
                 <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                    <AlertCircle size={40} />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-[0.2em]">{activeTab} system<br/>Coming in next update</p>
              </div>
            )}
          </AnimatePresence>
          
          {/* Official Branding Credit in all tabs at the bottom */}
          <div className="mt-12 py-10 flex flex-col items-center gap-3 text-center opacity-20 hover:opacity-100 transition-opacity">
             <div className="bg-gray-100 p-3 rounded-2xl">
                <Store size={24} className="text-gray-400" />
             </div>
             <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Integrated Marketplace System</p>
                <p className="text-sm font-black text-gray-900 uppercase">NEXAMART - SMART SHOPPING FOR INDIA & NEPAL</p>
             </div>
             <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-gray-100">NexaMart Seller Hub • 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function WalletTab({ vendor, setVendorData }: { vendor: Vendor, setVendorData: React.Dispatch<React.SetStateAction<Vendor | null>> }) {
  const [loading, setLoading] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [method, setMethod] = useState<'khalti' | 'esewa'>('khalti');
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);

  useEffect(() => {
    async function fetchWithdrawals() {
      // Query solely by vendorId to avoid index requirement, and sort descending on the client
      const q = query(collection(db, 'withdrawals'), where('vendorId', '==', vendor.vendorId));
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WithdrawalRequest));
      list.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      setRequests(list);
    }
    fetchWithdrawals();
  }, [vendor.vendorId]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    if (amount < 100) return alert("Minimum withdrawal is Rs. 100");
    if (amount > (vendor.walletBalance || 0)) return alert("Insufficient balance");

    if (method === 'khalti' && !vendor.khaltiQrCode) return alert("Please upload Khalti QR in Settings first.");
    if (method === 'esewa' && !vendor.esewaQrCode) return alert("Please upload eSewa QR in Settings first.");

    setLoading(true);
    const path = 'withdrawals';
    try {
      // Create request and deduct balance immediately to prevent double withdrawal
      const batch = writeBatch(db);
      
      const newRequestRef = doc(collection(db, path));
      batch.set(newRequestRef, {
        vendorId: vendor.vendorId,
        amount,
        method,
        accountDetails: `${method.toUpperCase()} QR`,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      batch.update(doc(db, 'vendors', vendor.vendorId), {
        walletBalance: increment(-amount)
      });

      await batch.commit();
      
      alert("Payout request submitted and balance updated!");
      setWithdrawAmount('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-20">
      <div className="bg-gray-900 p-8 rounded-3xl text-white relative overflow-hidden shadow-xl shadow-gray-200">
        <div className="absolute -right-4 -bottom-4 text-white/5"><Wallet size={120} /></div>
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Withdrawable Balance</p>
            <div className="flex items-end gap-2">
              <h2 className="text-4xl font-black tracking-tight">Rs. {vendor.walletBalance?.toLocaleString() || 0}</h2>
              <div className="bg-green-500/20 text-green-400 p-1 rounded-lg mb-1.5"><ArrowUpRight size={14} /></div>
            </div>
            <p className="text-[9px] text-gray-500 font-bold uppercase mt-4 tracking-widest italic">Earnings update automatically upon order delivery</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest px-1">Request New Payout</h3>
        <div className="grid grid-cols-2 gap-2">
           {['khalti', 'esewa'].map((m) => (
             <button 
               key={m}
               onClick={() => setMethod(m as any)}
               className={cn(
                 "py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all",
                 method === m ? "bg-orange-600 text-white border-orange-600 shadow-lg shadow-orange-100" : "bg-gray-50 text-gray-400 border-transparent hover:border-gray-200"
               )}
             >
               {m}
             </button>
           ))}
        </div>
        <form onSubmit={handleWithdraw} className="space-y-3">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-black">Rs.</div>
            <input 
              type="number" 
              placeholder="Amount (Min 100)"
              className="w-full bg-gray-50 border border-transparent py-4 px-12 rounded-2xl text-sm font-black focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
              value={withdrawAmount}
              onChange={e => setWithdrawAmount(e.target.value)}
            />
          </div>
          <button 
            type="submit"
            disabled={loading || !withdrawAmount}
            className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all text-xs uppercase tracking-widest disabled:opacity-30"
          >
            {loading ? 'Processing...' : 'Confirm Withdrawal'}
          </button>
        </form>
      </div>

      <div className="space-y-3">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Withdrawal Records</h3>
        {requests.map(req => (
          <div key={req.id} className="bg-white p-4 rounded-2xl border border-gray-100 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400"><CreditCard size={20} /></div>
                <div>
                  <p className="text-xs font-black text-gray-800">Payout #P-{req.id.slice(-4).toUpperCase()}</p>
                  <p className="text-[9px] text-gray-400 font-bold">{req.method.toUpperCase()} • {new Date(req.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-gray-900">Rs. {req.amount}</p>
                <p className={cn(
                  "text-[8px] font-black mt-1",
                  req.status === 'pending' ? "text-yellow-600" : req.status === 'completed' ? "text-green-600" : "text-red-600"
                )}>{req.status.toUpperCase()}</p>
              </div>
            </div>
            
            {req.paymentProof && (
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-center justify-between group">
                <div className="flex items-center gap-2">
                   <ImageIcon size={14} className="text-blue-500" />
                   <span className="text-[9px] font-black text-blue-900 uppercase">Payment Proof Uploaded</span>
                </div>
                <button onClick={() => window.open(req.paymentProof, '_blank')} className="text-[9px] font-black text-blue-600 uppercase hover:underline">View</button>
              </div>
            )}
          </div>
        ))}
        {requests.length === 0 && (
          <div className="p-12 text-center opacity-20 italic text-[10px] font-black uppercase tracking-widest">No transaction history found</div>
        )}
      </div>
    </motion.div>
  );
}

function VendorRegistration({ onComplete }: { onComplete: () => void }) {
  const { profile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    description: '',
    phone: '',
    address: '',
    panNumber: '',
    country: 'Nepal' as 'Nepal' | 'India',
    citizenshipFront: 'https://images.unsplash.com/photo-1512403754473-27835f7b9984', // Placeholder
    citizenshipBack: 'https://images.unsplash.com/photo-1554224155-1696413565d3', // Placeholder
    panVatDoc: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85' // Placeholder
  });

  const handleNextStep = () => {
    if (!formData.businessName || !formData.description || !formData.phone || !formData.address) {
      alert("Please fill in all business details first.");
      return;
    }
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }
    setStep(2);
  };

  const handleRegister = async () => {
    if (formData.country === 'India' && !formData.panNumber) {
      alert("Please enter your PAN Card number.");
      return;
    }

    if (formData.citizenshipFront.includes('unsplash')) {
      alert(formData.country === 'India' ? "Please upload your Aadhaar Card." : "Please upload your Citizenship Front.");
      return;
    }

    if (formData.citizenshipBack.includes('unsplash')) {
      alert(formData.country === 'India' ? "Please upload your Shop Photo." : "Please upload your Citizenship Back.");
      return;
    }

    if (formData.panVatDoc.includes('unsplash')) {
      alert(formData.country === 'India' ? "Please upload your PAN Card document." : "Please upload your Shop Photo.");
      return;
    }

    setLoading(true);
    const path = `vendors/${profile!.userId}`;
    try {
      const vendorData: Vendor = {
        vendorId: profile!.userId,
        businessName: formData.businessName,
        description: formData.description,
        status: 'pending',
        rating: 0,
        totalSales: 0,
        totalRevenue: 0,
        walletBalance: 0,
        createdAt: new Date().toISOString(),
        kyc: {
          citizenshipFront: formData.citizenshipFront,
          citizenshipBack: formData.citizenshipBack,
          panVatDoc: formData.panVatDoc,
          panNumber: formData.panNumber || 'Nepal-N/A',
          address: formData.address,
          phone: formData.phone,
          verified: false
        }
      };
      
      await setDoc(doc(db, 'vendors', profile!.userId), {
        ...vendorData,
        country: formData.country
      });

      await setDoc(doc(db, 'users', profile!.userId), { 
        role: 'vendor', 
        country: formData.country 
      }, { merge: true });

      onComplete();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'citizenshipFront' | 'citizenshipBack' | 'panVatDoc') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const compressed = await compressImage(reader.result as string, 800, 800, 0.6);
          setFormData(prev => ({ ...prev, [field]: compressed }));
        } catch (err) {
          setFormData(prev => ({ ...prev, [field]: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const isInd = formData.country === 'India';

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="bg-gray-900 p-8 pt-12 pb-20 relative">
        <div className="flex justify-between items-center relative z-10">
          <div>
            <h2 className="text-2xl font-black text-white">Merchant Program</h2>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">
              Step {step} of 2 • {isInd ? 'India' : 'Nepal'} Vendor Registration
            </p>
          </div>
          <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-white rotate-6">
            <Store size={24} />
          </div>
        </div>
      </div>

      <div className="px-6 -mt-10 relative z-20 space-y-6">
        <div className="bg-white rounded-3xl p-6 shadow-2xl shadow-gray-200 border border-gray-50 text-left">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Vendor Operating Country</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, country: 'Nepal' }))}
                      className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border ${
                        formData.country === 'Nepal'
                          ? 'bg-orange-100 text-orange-700 border-orange-200 shadow-sm'
                          : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100'
                      }`}
                    >
                      🇳🇵 Nepal Merchant
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, country: 'India' }))}
                      className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border ${
                        formData.country === 'India'
                          ? 'bg-orange-100 text-orange-700 border-orange-200 shadow-sm'
                          : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100'
                      }`}
                    >
                      🇮🇳 India Merchant
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Shop Name</label>
                  <input 
                    className="w-full bg-white border border-gray-300 rounded-lg py-2.5 px-4 text-sm font-medium focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all shadow-sm"
                    placeholder="" 
                    value={formData.businessName}
                    onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Shop Description</label>
                  <textarea 
                    className="w-full bg-white border border-gray-300 rounded-lg py-2.5 px-4 text-sm font-medium h-24 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all shadow-sm"
                    placeholder=""
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">
                      Business Mobile ({isInd ? '+91' : '+977'})
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-2.5 text-sm font-semibold text-gray-500">
                        {isInd ? '+91' : '+977'}
                      </span>
                      <input 
                        className="w-full bg-white border border-gray-300 rounded-lg py-2.5 pl-14 pr-4 text-sm font-medium focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all shadow-sm"
                        placeholder=""
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Shop physical Address</label>
                    <input 
                      className="w-full bg-white border border-gray-300 rounded-lg py-2.5 px-4 text-sm font-medium focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all shadow-sm"
                      placeholder=""
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                </div>

                <button onClick={handleNextStep} className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-gray-800 text-sm">
                  Continue to KYC <ChevronRight size={18} />
                </button>
              </motion.div>
            ) : (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                
                {isInd ? (
                  <div className="space-y-5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">PAN Card Number</label>
                      <input 
                        className="w-full bg-white border border-gray-300 rounded-lg py-2.5 px-4 text-sm font-medium focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all uppercase shadow-sm"
                        placeholder=""
                        maxLength={10}
                        value={formData.panNumber}
                        onChange={e => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Aadhaar Card Photo</label>
                        <label className="relative aspect-video bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center p-3 cursor-pointer hover:bg-orange-50/30 transition-all overflow-hidden group h-32">
                          {formData.citizenshipFront.includes('unsplash') ? (
                            <>
                              <Camera size={20} className="text-gray-300 mb-1 group-hover:text-orange-500" />
                              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-normal">Front or Full Card</span>
                            </>
                          ) : (
                            <img src={formData.citizenshipFront} className="absolute inset-0 w-full h-full object-cover" />
                          )}
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'citizenshipFront')} />
                        </label>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">PAN Card Document</label>
                        <label className="relative aspect-video bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center p-3 cursor-pointer hover:bg-orange-50/30 transition-all overflow-hidden group h-32">
                          {formData.panVatDoc.includes('unsplash') ? (
                            <>
                              <FileText size={20} className="text-gray-300 mb-1 group-hover:text-orange-500" />
                              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-normal">PAN Card PDF/Image</span>
                            </>
                          ) : (
                            <img src={formData.panVatDoc} className="absolute inset-0 w-full h-full object-cover" />
                          )}
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'panVatDoc')} />
                        </label>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Shop / Business Photo</label>
                        <label className="relative aspect-video bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center p-3 cursor-pointer hover:bg-orange-50/30 transition-all overflow-hidden group h-32">
                          {formData.citizenshipBack.includes('unsplash') ? (
                            <>
                              <Camera size={20} className="text-gray-300 mb-1 group-hover:text-orange-500" />
                              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-normal">Front Storefront View</span>
                            </>
                          ) : (
                            <img src={formData.citizenshipBack} className="absolute inset-0 w-full h-full object-cover" />
                          )}
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'citizenshipBack')} />
                        </label>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Citizenship Front</label>
                        <label className="relative aspect-video bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center p-3 cursor-pointer hover:bg-orange-50/30 transition-all overflow-hidden group h-32">
                          {formData.citizenshipFront.includes('unsplash') ? (
                            <>
                              <Camera size={20} className="text-gray-300 mb-1 group-hover:text-orange-500" />
                              <span className="text-[8px] font-black text-gray-450 uppercase tracking-widest leading-normal">Citizenship Front</span>
                            </>
                          ) : (
                            <img src={formData.citizenshipFront} className="absolute inset-0 w-full h-full object-cover" />
                          )}
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'citizenshipFront')} />
                        </label>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Citizenship Back</label>
                        <label className="relative aspect-video bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center p-3 cursor-pointer hover:bg-orange-50/30 transition-all overflow-hidden group h-32">
                          {formData.citizenshipBack.includes('unsplash') ? (
                            <>
                              <Camera size={20} className="text-gray-300 mb-1 group-hover:text-orange-500" />
                              <span className="text-[8px] font-black text-gray-450 uppercase tracking-widest leading-normal">Citizenship Back</span>
                            </>
                          ) : (
                            <img src={formData.citizenshipBack} className="absolute inset-0 w-full h-full object-cover" />
                          )}
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'citizenshipBack')} />
                        </label>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Shop Front Photo</label>
                        <label className="relative aspect-video bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center p-3 cursor-pointer hover:bg-orange-50/30 transition-all overflow-hidden group h-32">
                          {formData.panVatDoc.includes('unsplash') ? (
                            <>
                              <Camera size={20} className="text-gray-300 mb-1 group-hover:text-orange-500" />
                              <span className="text-[8px] font-black text-gray-450 uppercase tracking-widest leading-normal">Front Storefront View</span>
                            </>
                          ) : (
                            <img src={formData.panVatDoc} className="absolute inset-0 w-full h-full object-cover" />
                          )}
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'panVatDoc')} />
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <button onClick={() => setStep(1)} className="flex-1 bg-gray-100 text-gray-500 font-black py-4 rounded-2xl active:scale-95 transition-all text-xs uppercase tracking-widest">Back</button>
                  <button 
                    onClick={handleRegister} 
                    disabled={loading}
                    className="flex-[2] bg-orange-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-orange-100 active:scale-95 transition-all text-xs uppercase tracking-widest disabled:opacity-50"
                  >
                    {loading ? 'Submitting...' : 'Register as Seller'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-3 bg-orange-50 p-4 rounded-2xl border border-orange-100">
          <Shield size={20} className="text-orange-600 shrink-0" />
          <p className="text-[9px] text-orange-800 font-bold leading-relaxed uppercase tracking-widest opacity-80">
            {isInd 
              ? 'Your Aadhaar, PAN and Store photos are protected and encrypted according to India regulatory digital merchant rules.'
              : 'Your Nepal Citizenship documentation is encrypted and strictly used for seller verification as per Nepal regulatory guidelines.'}
          </p>
        </div>
      </div>
    </div>
  );
}

function VendorOrderManager({ 
  orders, 
  vendorId
}: { 
  orders: Order[], 
  vendorId: string
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'>('all');

  const filteredOrders = orders.filter(o => {
    const matchesSearch = (o?.orderId || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    const matchesFilter = filter === 'all' || o?.status === filter;
    return matchesSearch && matchesFilter;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <motion.div key="vendor_orders" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
       <div className="space-y-4">
          <div className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
             <input 
               type="text" 
               placeholder="Search Order ID..." 
               className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
          </div>

          <div className="flex bg-white rounded-2xl border border-gray-100 p-1 overflow-x-auto scrollbar-hide">
             {(['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const).map(f => (
                <button 
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-4 py-3 text-[8px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap",
                    filter === f ? "bg-gray-900 text-white" : "text-gray-400"
                  )}
                >
                  {f}
                </button>
             ))}
          </div>
       </div>

       <div className="space-y-3">
          {filteredOrders.map(o => {
            const vendorItems = o.items.filter(i => i.vendorId === vendorId);
            const vendorTotal = vendorItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
            
            return (
              <div key={o.orderId} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                 <div className="flex justify-between items-start">
                    <div>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">#{o.orderId.slice(-8)}</p>
                       <p className="text-[9px] font-bold text-gray-400 mt-1">
                         {formatDate(o.createdAt)}
                       </p>
                       <div className="flex items-center gap-1.5 mt-2">
                          <div className="flex items-center gap-1 bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded text-[8px] font-black uppercase">
                             <MapPin size={10} />
                             {o.shippingAddress.city}
                          </div>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-black text-orange-600">Rs. {vendorTotal.toLocaleString()}</p>
                       <span className={cn(
                          "text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest border",
                          o.status === 'delivered' ? "bg-green-50 text-green-600 border-green-100" :
                          o.status === 'cancelled' ? "bg-red-50 text-red-600 border-red-100" :
                          "bg-blue-50 text-blue-600 border-blue-100"
                       )}>
                          {o.status}
                       </span>
                    </div>
                 </div>

                 <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Your Items ({vendorItems.length})</p>
                    <div className="space-y-3">
                       {vendorItems.map((item, idx) => (
                         <div key={idx} className="flex gap-3 items-center">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-gray-100 shrink-0">
                               <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                            </div>
                            <div className="flex-1 min-w-0">
                               <p className="text-[9px] font-black text-gray-900 truncate uppercase">{item.name}</p>
                               <div className="flex justify-between items-center mt-0.5">
                                  <p className="text-[8px] font-bold text-gray-400">Qty: {item.quantity} × Rs. {item.price.toLocaleString()}</p>
                                  <p className="text-[9px] font-black text-gray-900">Rs. {(item.price * item.quantity).toLocaleString()}</p>
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="bg-orange-50/50 p-4 rounded-2xl space-y-2 border border-orange-50">
                    <p className="text-[8px] font-black text-orange-400 uppercase tracking-widest flex items-center gap-1">
                       <Truck size={10} />
                       Delivery Info
                    </p>
                    <p className="text-[10px] font-black text-gray-900 uppercase">
                       {o.shippingAddress.city}, Ward {o.shippingAddress.ward}
                       <br />
                       {o.shippingAddress.streetAddress}, {o.shippingAddress.landmark}
                    </p>
                 </div>

                 <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex items-center justify-center gap-2">
                    <Clock size={10} className="text-gray-400" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order Managed by Admin</p>
                 </div>
              </div>
            );
          })}
          {filteredOrders.length === 0 && (
            <div className="text-center py-20 opacity-30">
               <ShoppingBag size={48} className="mx-auto mb-4" />
               <p className="text-[10px] font-black uppercase tracking-[0.3em]">No orders for your items</p>
            </div>
          )}
       </div>
    </motion.div>
  );
}

function AddProductForm({ onComplete, product }: { onComplete: () => void, product?: Product }) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price?.toString() || '',
    discountPrice: product?.discountPrice?.toString() || '',
    stock: product?.stock?.toString() || '',
    sku: product?.sku || '',
    categoryId: product?.categoryId || '',
    subCategoryId: product?.subCategoryId || '',
    videoUrl: product?.videoUrl || '',
    images: product?.images || []
  });

  const mainCategories = categories.filter(c => !c.parentId);
  const subCategories = categories.filter(c => c.parentId && c.parentId === formData.categoryId);

  const [variations, setVariations] = useState<ProductVariation[]>(product?.variations || []);
  const [specs, setSpecs] = useState<ProductSpec[]>(product?.specifications || []);

  const runAIAnalysis = async () => {
    if (formData.images.length === 0) return;
    setIsAIProcessing(true);
    try {
      const response = await fetch(getApiUrl('/api/ai/analyze-image'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageBase64: formData.images[0],
          country: profile?.country || 'Nepal'
        })
      });
      const data = await response.json();
      
      setFormData(prev => ({
        ...prev,
        name: prev.name || data.suggestedName,
        description: prev.description || data.description,
        price: prev.price || data.suggestedPrice?.toString() || '',
        categoryId: prev.categoryId || categories.find(c => (c?.name || '').toLowerCase().includes((data?.category || '').toLowerCase()))?.categoryId || ''
      }));

      // Add tags as specs or variations? The request says auto-fill product tags/keywords
      if (specs.length === 0) {
        setSpecs(data.tags.map((tag: string) => ({ key: 'Tag', value: tag })));
      }
    } catch (err) {
      console.error("AI Analysis failed:", err);
    } finally {
      setIsAIProcessing(false);
    }
  };

  const optimizeImage = async (index: number) => {
    setIsAIProcessing(true);
    try {
       const response = await fetch(getApiUrl('/api/ai/optimize-image'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: formData.images[index] })
      });
      const data = await response.json();
      const newImages = [...formData.images];
      newImages[index] = data.imageUrl;
      setFormData(prev => ({ ...prev, images: newImages }));
    } catch (err) {
      console.error("AI Optimization failed:", err);
    } finally {
      setIsAIProcessing(false);
    }
  };

  useEffect(() => {
    getDocs(collection(db, 'categories')).then(snap => {
      setCategories(snap.docs.map(doc => ({ ...doc.data(), categoryId: doc.id } as Category)));
    });
  }, []);

  const addVariation = () => {
    const id = Date.now().toString();
    setVariations([...variations, { id, name: '', options: [''] }]);
  };

  const addSpec = () => {
    setSpecs([...specs, { key: '', value: '' }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (product) {
        const path = `products/${product.productId}`;
        await updateDoc(doc(db, 'products', product.productId), {
          ...formData,
          price: Number(formData.price),
          discountPrice: formData.discountPrice ? Number(formData.discountPrice) : null,
          stock: Number(formData.stock),
          variations,
          specifications: specs,
          // If was rejected/deleted and edited, reset to pending
          status: (product.status === 'rejected' || product.status === 'deleted') ? 'pending' : product.status,
          updatedAt: serverTimestamp()
        });
      } else {
        const path = 'products';
        await addDoc(collection(db, path), {
          ...formData,
          price: Number(formData.price),
          discountPrice: formData.discountPrice ? Number(formData.discountPrice) : null,
          stock: Number(formData.stock),
          vendorId: profile!!.userId,
          variations,
          specifications: specs,
          rating: 0,
          totalReviews: 0,
          featured: false,
          trending: false,
          status: profile?.role === 'admin' ? 'approved' : 'pending',
          createdAt: serverTimestamp()
        });
      }
      onComplete();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, product ? `products/${product.productId}` : 'products');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        const promise = new Promise<string>((resolve) => {
          reader.onloadend = async () => {
            try {
              const compressed = await compressImage(reader.result as string, 1200, 1200, 0.7);
              resolve(compressed);
            } catch (err) {
              resolve(reader.result as string);
            }
          };
        });
        reader.readAsDataURL(files[i]);
        newImages.push(await promise);
      }
      setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages].filter(img => !img.includes('unsplash')) }));
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white p-6 rounded-3xl space-y-6 shadow-sm border border-gray-100 overflow-y-auto max-h-[80vh]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onComplete} className="p-2 -ml-2 text-gray-400"><X size={20} /></button>
          <h2 className="text-lg font-black text-gray-900 tracking-tight uppercase">{product ? 'Update Details' : 'List Item'}</h2>
        </div>
        {formData.images.length > 0 && (
          <button 
            type="button"
            onClick={runAIAnalysis}
            disabled={isAIProcessing}
            className="flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all disabled:opacity-50"
          >
            {isAIProcessing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            AI Auto-Fill
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 pb-12">
        <div className="space-y-4">
           {/* Section 1: Images */}
           <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Images</label>
                <p className="text-[8px] font-bold text-orange-500 uppercase tracking-tighter">AI Magic Available</p>
              </div>
              <div className="flex flex-wrap gap-2">
                 {formData.images.map((img, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-100 group">
                       <img src={img} className="w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1">
                          <button 
                            type="button" 
                            onClick={() => optimizeImage(idx)}
                            disabled={isAIProcessing}
                            className="bg-white text-orange-600 p-1.5 rounded-lg active:scale-90 transition-all flex items-center gap-1"
                            title="AI Background Removal & Optimization"
                          >
                            <Wand2 size={12} />
                            <span className="text-[6px] font-black uppercase">Polish</span>
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setFormData({ ...formData, images: formData.images.filter((_, i) => i !== idx) })}
                            className="bg-red-600 text-white p-1.5 rounded-lg active:scale-90 transition-all font-black"
                          >
                            <X size={12} />
                          </button>
                       </div>
                    </div>
                 ))}
                 <label className="w-20 h-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-orange-50/30 transition-all">
                    <Plus size={20} className="text-gray-300" />
                    <input type="file" multiple className="hidden" accept="image/*" onChange={handleImageUpload} />
                 </label>
              </div>
           </div>

           {/* Section 2: Basic Stats */}
           <div className="space-y-4">
              <input 
                required 
                placeholder="Product Title" 
                className="w-full bg-gray-50 border border-transparent rounded-xl py-4 px-5 text-sm font-black focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
              <textarea 
                required 
                placeholder="Product Description" 
                className="w-full bg-gray-50 border border-transparent rounded-xl py-4 px-5 text-sm font-medium h-32 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <input 
                  required 
                  type="number" 
                  placeholder="Price" 
                  className="w-full bg-gray-50 border border-transparent rounded-xl py-4 px-5 text-sm font-black focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
                />
                <input 
                  type="number" 
                  placeholder="Discount Price (Optional)" 
                  className="w-full bg-gray-50 border border-transparent rounded-xl py-4 px-5 text-sm font-black focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                  value={formData.discountPrice}
                  onChange={e => setFormData({ ...formData, discountPrice: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input 
                  required 
                  type="number" 
                  placeholder="Stock" 
                  className="w-full bg-gray-50 border border-transparent rounded-xl py-4 px-5 text-sm font-black focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                  value={formData.stock}
                  onChange={e => setFormData({ ...formData, stock: e.target.value })}
                />
                <input 
                  placeholder="SKU" 
                  className="w-full bg-gray-50 border border-transparent rounded-xl py-4 px-5 text-sm font-black focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                  value={formData.sku}
                  onChange={e => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>
           </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Category Cluster</label>
                <select 
                  required
                  className="w-full bg-gray-50 border border-transparent rounded-2xl p-4 text-xs font-black outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 transition-all font-bold appearance-none"
                  value={formData.categoryId}
                  onChange={e => setFormData({ ...formData, categoryId: e.target.value, subCategoryId: '' })}
                >
                  <option value="">Choose Category</option>
                  {mainCategories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-orange-600">Specific Sub-Cluster</label>
                <select 
                  className="w-full bg-gray-50 border border-transparent rounded-2xl p-4 text-xs font-black outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 transition-all font-bold appearance-none disabled:opacity-30"
                  value={formData.subCategoryId}
                  onChange={e => setFormData({ ...formData, subCategoryId: e.target.value })}
                  disabled={!formData.categoryId}
                >
                  <option value="">Choose Sub Category</option>
                  {subCategories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.name}</option>)}
                </select>
              </div>
            </div>


           {/* Variations System */}
           <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-[9px] font-black text-gray-900 uppercase tracking-widest">Variations (Color/Size)</h3>
                <button type="button" onClick={addVariation} className="text-orange-600"><Plus size={14} /></button>
              </div>
              {variations.length === 0 && <p className="text-[9px] text-gray-400 italic px-1">No variations added yet.</p>}
              {variations.map((v, i) => (
                <div key={v.id} className="flex gap-2 items-end">
                   <div className="flex-1">
                      <input 
                        placeholder="Variation Name (e.g. Size)" 
                        className="w-full bg-gray-50 border border-gray-100 p-2.5 rounded-xl text-[9px] font-black outline-none"
                        value={v.name}
                        onChange={e => {
                          const newV = [...variations];
                          newV[i].name = e.target.value;
                          setVariations(newV);
                        }}
                      />
                   </div>
                   <div className="flex-[2]">
                    <input 
                        placeholder="Options (comma separated)" 
                        className="w-full bg-gray-50 border border-gray-100 p-2.5 rounded-xl text-[9px] font-black outline-none"
                        onChange={e => {
                          const newV = [...variations];
                          newV[i].options = e.target.value.split(',').map(o => o.trim());
                          setVariations(newV);
                        }}
                      />
                   </div>
                </div>
              ))}
           </div>

           {/* Specifications */}
           <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-[9px] font-black text-gray-900 uppercase tracking-widest">Detailed Specs</h3>
                <button type="button" onClick={addSpec} className="text-orange-600"><Plus size={14} /></button>
              </div>
              {specs.map((s, i) => (
                <div key={i} className="flex gap-2">
                   <input 
                     placeholder="Key (e.g. Material)" 
                     className="flex-1 bg-gray-50 border border-gray-100 p-2.5 rounded-xl text-[9px] font-black outline-none"
                     value={s.key}
                     onChange={e => {
                       const newS = [...specs];
                       newS[i].key = e.target.value;
                       setSpecs(newS);
                     }}
                   />
                   <input 
                     placeholder="Value (e.g. Cotton)" 
                     className="flex-[2] bg-gray-50 border border-gray-100 p-2.5 rounded-xl text-[9px] font-black outline-none"
                     value={s.value}
                     onChange={e => {
                        const newS = [...specs];
                        newS[i].value = e.target.value;
                        setSpecs(newS);
                      }}
                   />
                </div>
              ))}
           </div>

           <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Product Story (Description)</label>
              <textarea 
                className="w-full border border-gray-100 bg-gray-50 rounded-2xl p-4 text-xs font-medium h-32 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                placeholder="Tell customers what makes this special..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
           </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs uppercase tracking-widest"
        >
          {loading ? 'Processing...' : <><Save size={18} /> {product ? 'Save Changes' : 'Publish to Market'}</>}
        </button>
      </form>
    </motion.div>
  );
}

function CouponManager({ coupons, setCoupons, vendorId }: { coupons: Coupon[], setCoupons: React.Dispatch<React.SetStateAction<Coupon[]>>, vendorId: string }) {
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({
    code: '',
    type: 'percentage',
    value: 0,
    minSpend: 0,
    status: 'active',
    vendorId: vendorId,
    usageLimit: 0,
    expiryDate: ''
  });

  const filteredCoupons = coupons.filter(c => c.vendorId === vendorId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.value) return;
    setLoading(true);
    try {
      const couponId = `cpn-${Date.now()}`;
      const couponData: Coupon = {
        ...newCoupon,
        couponId,
        code: newCoupon.code!.toUpperCase(),
        usedCount: 0,
        createdAt: new Date().toISOString(),
        status: 'active'
      } as Coupon;
      
      await setDoc(doc(db, 'coupons', couponId), couponData);
      setCoupons(prev => [couponData, ...prev]);
      setIsAdding(false);
      setNewCoupon({ code: '', type: 'percentage', value: 0, minSpend: 0, status: 'active', vendorId, usageLimit: 0, expiryDate: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this offer permanently?")) return;
    try {
      await deleteDoc(doc(db, 'coupons', id));
      setCoupons(prev => prev.filter(c => c.couponId !== id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `coupons/${id}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Offers & Coupons</h3>
        <button 
          onClick={() => setIsAdding(!isAdding)} 
          className={cn(
            "p-2 rounded-xl transition-all active:scale-95",
            isAdding ? "bg-red-50 text-red-600" : "bg-orange-600 text-white shadow-lg"
          )}
        >
          {isAdding ? <X size={20} /> : <Plus size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleSubmit}
            className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4 overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Promo Code</label>
                <input 
                  placeholder="e.g. FESTIVAL50" 
                  required
                  className="w-full bg-gray-50 border border-transparent rounded-xl p-3 text-xs outline-none focus:bg-white focus:border-red-100 transition-all font-black uppercase"
                  value={newCoupon.code}
                  onChange={e => setNewCoupon({...newCoupon, code: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Benefit Type</label>
                <select 
                  className="w-full bg-gray-50 border border-transparent rounded-xl p-3 text-[10px] font-black uppercase outline-none"
                  value={newCoupon.type}
                  onChange={e => setNewCoupon({...newCoupon, type: e.target.value as any})}
                >
                  <option value="percentage">% Percentage</option>
                  <option value="fixed">Rs Fixed Amt</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Value</label>
                <input 
                  type="number"
                  placeholder="20" 
                  required
                  className="w-full bg-gray-50 border border-transparent rounded-xl p-3 text-xs outline-none focus:bg-white focus:border-red-100 transition-all font-bold"
                  value={newCoupon.value}
                  onChange={e => setNewCoupon({...newCoupon, value: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Min Spend (Rs)</label>
                <input 
                  type="number"
                  placeholder="500" 
                  className="w-full bg-gray-50 border border-transparent rounded-xl p-3 text-xs outline-none focus:bg-white focus:border-red-100 transition-all font-bold"
                  value={newCoupon.minSpend}
                  onChange={e => setNewCoupon({...newCoupon, minSpend: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Expires On</label>
                <input 
                  type="date"
                  className="w-full bg-gray-50 border border-transparent rounded-xl p-3 text-[10px] outline-none focus:bg-white focus:border-red-100 transition-all font-bold"
                  value={newCoupon.expiryDate}
                  onChange={e => setNewCoupon({...newCoupon, expiryDate: e.target.value})}
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-orange-600 text-white font-black py-4 rounded-xl uppercase tracking-widest text-[10px] shadow-lg shadow-orange-100">
              {loading ? 'Creating...' : 'Launch Offer'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-3">
        {filteredCoupons.map(c => (
          <div key={c.couponId} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group overflow-hidden relative">
            <div className={cn(
              "absolute top-0 left-0 w-1.5 h-full",
              vendorId === 'global' ? "bg-red-600" : "bg-blue-600"
            )} />
            <div className="space-y-0.5">
              <p className="text-[10px] font-black text-gray-900 tracking-wider uppercase flex items-center gap-2">
                {c.code}
                {vendorId === 'global' && <Shield size={10} className="text-red-500" />}
              </p>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                {c.type === 'percentage' ? `${c.value}% Reduct` : `Rs. ${c.value} Cred`} • MIN RS. {c.minSpend}
              </p>
              {c.expiryDate && <p className="text-[8px] text-red-600 font-bold uppercase italic mt-1 bg-red-50 inline-block px-1 rounded">Exp: {new Date(c.expiryDate).toLocaleDateString()}</p>}
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right mr-3">
                <p className="text-[7px] font-black text-gray-400 uppercase tracking-tighter leading-none">Uses</p>
                <p className="text-sm font-black text-gray-900 leading-none">{c.usedCount}</p>
              </div>
              <button onClick={() => handleDelete(c.couponId)} className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:text-red-600 transition-all active:scale-90">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {filteredCoupons.length === 0 && (
          <div className="text-center py-20 opacity-30 text-[10px] font-black uppercase tracking-widest border-2 border-dashed border-gray-200 rounded-3xl">No Promotions Active</div>
        )}
      </div>
    </div>
  );
}
