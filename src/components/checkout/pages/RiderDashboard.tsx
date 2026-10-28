import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bike, Package, CheckCircle2, Navigation, Phone, MessageSquare, TrendingUp,
  History, LogOut, ChevronRight, MapPin, Clock, Search, Truck,
  AlertCircle, ShieldCheck, User, CreditCard, Save, QrCode, Camera, Loader2, Map as MapIcon, RotateCcw, PenTool,
  ArrowLeft, ArrowRight, CornerUpLeft, CornerUpRight, Compass, Flag, Play, ArrowUp
} from 'lucide-react';
import { 
  collection, query, where, getDocs, updateDoc, doc, 
  serverTimestamp, onSnapshot, orderBy, limit, setDoc, arrayUnion,
  increment, deleteDoc, getDoc
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, isQuotaActive, isQuotaExceededError } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';
import { Rider, Order, UserProfile } from '../../../types';
import { fallbackOrders, fallbackRiders } from '../../../constants/fallbackData';
import { cn, formatDate, compressImage, getDistance } from '../../../utils';
import { useNavigate } from 'react-router-dom';
import { isGoogleMapsKeyValid } from '../../../lib/maps';
import { FreeDeliveryNavMap } from '../FreeDeliveryNavMap';
import { FreeRadarMap } from '../FreeRadarMap';

function OperationalMetrics({ rider, orders }: { rider: Rider, orders: Order[] }) {
  const today = new Date().toISOString().split('T')[0];
  const deliveredToday = orders.filter(o => o.deliveredAt?.startsWith(today)).length;
  const earningsToday = deliveredToday * 50;
  
  return (
    <div className="grid grid-cols-4 gap-2 px-6 -mt-10 mb-6">
       <div className="bg-white p-3 rounded-2xl shadow-xl shadow-gray-100 flex flex-col items-center justify-center border border-gray-50 aspect-square">
          <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-1"><CheckCircle2 size={16}/></div>
          <p className="text-sm font-black text-gray-900">{deliveredToday}</p>
          <p className="text-[7px] font-bold text-gray-400 uppercase">Hits</p>
       </div>
       <div className="bg-white p-3 rounded-2xl shadow-xl shadow-gray-100 flex flex-col items-center justify-center border border-gray-50 aspect-square">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-1"><Package size={16}/></div>
          <p className="text-sm font-black text-gray-900">{orders.filter(o => o.deliveryStatus && o.deliveryStatus !== 'delivered').length}</p>
          <p className="text-[7px] font-bold text-gray-400 uppercase">Load</p>
       </div>
       <div className="bg-white p-3 rounded-2xl shadow-xl shadow-gray-100 flex flex-col items-center justify-center border border-gray-50 aspect-square">
          <div className="w-8 h-8 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-1"><TrendingUp size={16}/></div>
          <p className="text-sm font-black text-gray-900">{earningsToday}</p>
          <p className="text-[7px] font-bold text-gray-400 uppercase">Earnings</p>
       </div>
       <div className="bg-white p-3 rounded-2xl shadow-xl shadow-gray-100 flex flex-col items-center justify-center border border-gray-50 aspect-square">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-1"><User size={16}/></div>
          <p className="text-sm font-black text-gray-900">{rider.rating}</p>
          <p className="text-[7px] font-bold text-gray-400 uppercase">Score</p>
       </div>
    </div>
  );
}

function SignaturePad({ onSave, onCancel }: { onSave: (data: string | null) => void, onCancel: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    // Fill white background for the signature so it doesn't look transparent
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const start = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDrawing(true);
    const pos = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.beginPath();
    ctx?.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return;
    const pos = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.lineTo(pos.x, pos.y);
    ctx?.stroke();
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  const save = () => {
    const data = canvasRef.current?.toDataURL();
    if (data) onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 space-y-4">
        <div className="text-center">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Customer Signature</h3>
          <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">Optional Authentication</p>
        </div>
        <canvas 
          ref={canvasRef}
          width={400} 
          height={200}
          onMouseDown={start} onMouseMove={draw} onMouseUp={() => setIsDrawing(false)}
          onTouchStart={start} onTouchMove={draw} onTouchEnd={() => setIsDrawing(false)}
          className="w-full h-48 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl cursor-crosshair shadow-inner"
        />
        <div className="flex flex-wrap gap-2">
          <button onClick={clear} className="flex-1 py-3 text-[10px] font-black uppercase text-gray-400 border border-gray-100 rounded-xl">Clear</button>
          <button onClick={() => onSave(null)} className="flex-1 py-3 text-[10px] font-black uppercase text-orange-600 border border-orange-100 rounded-xl">Skip</button>
          <button onClick={onCancel} className="flex-1 py-3 text-[10px] font-black uppercase text-gray-400 border border-gray-100 rounded-xl">Back</button>
          <button onClick={save} className="w-full bg-orange-600 text-white py-4 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-orange-100">Confirm Signature</button>
        </div>
      </div>
    </div>
  );
}

export default function RiderDashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [rider, setRider] = useState<Rider | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'deliveries' | 'market' | 'map' | 'history' | 'profile'>('deliveries');
  
  // Profile, Financials and Notifications States
  const [profileSubTab, setProfileSubTab] = useState<'details' | 'earnings' | 'notifications'>('details');
  const [phoneInput, setPhoneInput] = useState('');
  const [vehiclePlateInput, setVehiclePlateInput] = useState('');
  const [vehicleTypeInput, setVehicleTypeInput] = useState('Bike');
  const [licenseNumberInput, setLicenseNumberInput] = useState('');
  const [bankNameInput, setBankNameInput] = useState('');
  const [bankAccountNoInput, setBankAccountNoInput] = useState('');
  const [bankAccountNameInput, setBankAccountNameInput] = useState('');
  const [riderPhotoData, setRiderPhotoData] = useState<string | null>(null);
  const [licensePhotoData, setLicensePhotoData] = useState<string | null>(null);
  const [idCardPhotoData, setIdCardPhotoData] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [payoutRequests, setPayoutRequests] = useState<any[]>([]);

  const [currentGPS, setCurrentGPS] = useState<{ latitude: number, longitude: number } | null>(null);
  const [activeRiders, setActiveRiders] = useState<Rider[]>([]);
  const [selectedMapItem, setSelectedMapItem] = useState<{ type: 'self' | 'rider' | 'order', data: any } | null>(null);
  const [mapFilter, setMapFilter] = useState<'all' | 'riders' | 'orders'>('all');
  const [claimingOnMap, setClaimingOnMap] = useState(false);

  // Live Location Tracking
  useEffect(() => {
    if (!user || activeTab === 'profile') return;

    if (!navigator.geolocation) {
      setCurrentGPS({ latitude: 27.7172, longitude: 85.3240 });
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setCurrentGPS(coords);
        if (rider?.riderId && !isQuotaActive()) {
          try {
            await updateDoc(doc(db, 'riders', rider.riderId), {
              currentLocation: {
                ...coords,
                updatedAt: new Date().toISOString()
              }
            });
          } catch(err) {
            // Location sync is non-blocking
          }
        }
      },
      (err) => {
        // Fallback gracefully to default coordinates when geolocation is blocked or denied
        setCurrentGPS((prev) => prev || { latitude: 27.7172, longitude: 85.3240 });
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [user, rider?.riderId, activeTab]);

  useEffect(() => {
    if (!user) return;

    if (isQuotaActive()) {
      const defaultR = fallbackRiders[0];
      setRider({
        ...defaultR,
        riderId: user.uid,
        userId: user.uid,
        email: user.email || 'rider@nexamart.com'
      });
      setOrders(fallbackOrders);
      setAvailableOrders([]);
      setLoading(false);
    }

    const unsubRider = onSnapshot(doc(db, 'riders', user.uid), (snap) => {
      if (snap.exists()) {
        setRider({ ...snap.data(), riderId: snap.id } as Rider);
      } else if (profile?.role === 'admin' || profile?.role === 'super_admin' || user.email?.includes('rider')) {
        const defaultR = fallbackRiders[0];
        setRider({
          ...defaultR,
          riderId: user.uid,
          userId: user.uid,
          email: user.email || 'rider@nexamart.com'
        });
      } else {
        setRider(null);
      }
      setLoading(false);
    }, (err) => {
      if (!isQuotaExceededError(err)) {
        console.warn("Rider profile listener error:", err);
      }
      const defaultR = fallbackRiders[0];
      setRider({
        ...defaultR,
        riderId: user.uid,
        userId: user.uid,
        email: user.email || 'rider@nexamart.com'
      });
      setLoading(false);
    });

    const unsubOrders = onSnapshot(
      query(
        collection(db, 'orders'), 
        where('riderId', '==', user.uid),
        orderBy('updatedAt', 'desc')
      ), 
      (snap) => {
        const list = snap.docs.map(d => ({ ...d.data(), orderId: d.id } as Order));
        setOrders(list.length > 0 ? list : fallbackOrders);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'orders');
        setOrders(prev => prev.length > 0 ? prev : fallbackOrders);
      }
    );

    const unsubMarket = onSnapshot(
      query(
        collection(db, 'orders'),
        where('status', 'in', ['confirmed', 'processing']),
        where('riderId', '==', null),
        limit(20)
      ),
      (snap) => {
        setAvailableOrders(snap.docs.map(d => ({ ...d.data(), orderId: d.id } as Order)));
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'orders');
      }
    );

    return () => {
      unsubRider();
      unsubOrders();
      unsubMarket();
    };
  }, [user]);

  // Bind form inputs with database synced rider data
  useEffect(() => {
    if (rider) {
      setPhoneInput(rider.phone || '');
      setVehiclePlateInput(rider.vehiclePlate || '');
      setVehicleTypeInput(rider.vehicleType || 'Bike');
      setLicenseNumberInput(rider.licenseNumber || '');
      setBankNameInput(rider.bankName || '');
      setBankAccountNoInput(rider.bankAccountNo || '');
      setBankAccountNameInput(rider.bankAccountName || '');
      setRiderPhotoData(rider.riderPhoto || null);
      setLicensePhotoData(rider.licensePhoto || null);
      setIdCardPhotoData(rider.idCardPhoto || null);
    }
  }, [rider]);

  // Real-time payout request subscription with index resilience
  useEffect(() => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'withdrawals'), 
        where('vendorId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const unsub = onSnapshot(q, (snap) => {
        setPayoutRequests(snap.docs.map(d => ({ requestId: d.id, ...d.data() })));
      }, (err) => {
        console.warn("Payout log composite index not registered yet, falling back to simple query...", err);
        const basicQ = query(collection(db, 'withdrawals'), where('vendorId', '==', user.uid));
        onSnapshot(basicQ, (s) => {
          const list = s.docs.map(d => ({ requestId: d.id, ...d.data() }));
          list.sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''));
          setPayoutRequests(list);
        });
      });
      return () => unsub();
    } catch(err) {
      console.error("Failed to construct layout of payouts", err);
    }
  }, [user]);

  // Real-time synchronization of other rider locations
  useEffect(() => {
    if (!user) return;
    const unsubRiders = onSnapshot(
      query(collection(db, 'riders'), where('status', '==', 'approved')),
      (snap) => {
        const list = snap.docs.map(d => ({ ...d.data(), riderId: d.id } as Rider));
        setActiveRiders(list);
      },
      (err) => {
        console.error("Riders live location error in Dashboard:", err);
        handleFirestoreError(err, OperationType.LIST, 'riders');
      }
    );
    return () => unsubRiders();
  }, [user]);

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'rider' | 'license' | 'id') => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const compressed = await compressImage(reader.result as string, 600, 600, 0.7);
          if (field === 'rider') setRiderPhotoData(compressed);
          if (field === 'license') setLicensePhotoData(compressed);
          if (field === 'id') setIdCardPhotoData(compressed);
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error("Profile image upload load error:", err);
      }
    }
  };

  const handleRequestPayout = async () => {
    if (!user) {
      alert("No active session found.");
      return;
    }
    if (!rider || !rider.walletBalance || rider.walletBalance <= 0) {
      alert("No payout funds available in logistics wallet vault.");
      return;
    }
    if (!confirm(`Submit an official settlement payout request for Rs. ${rider.walletBalance}?`)) return;
    try {
      const balance = rider.walletBalance;
      const ref = doc(collection(db, 'withdrawals'));
      await setDoc(ref, {
        requestId: ref.id,
        vendorId: user.uid,
        amount: balance,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      await updateDoc(doc(db, 'riders', rider.riderId), {
        walletBalance: 0
      });
      alert("Withdrawal settlement requested from NexaMart dispatch head office!");
    } catch (err) {
      console.error(err);
      alert("Error submitting withdrawal request to central databases.");
    }
  };

  const handleClaimFromMap = async (orderId: string) => {
    if (!rider) return;
    if (!confirm("Claim this mission for assignment?")) return;
    setClaimingOnMap(true);
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        riderId: rider.riderId,
        deliveryStatus: 'assigned',
        assignedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      await updateDoc(doc(db, 'riders', rider.riderId), {
        activeOrdersCount: increment(1)
      });
      setSelectedMapItem(null);
      alert("Mission claim successful!");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    } finally {
      setClaimingOnMap(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-black text-gray-400 uppercase tracking-widest text-[10px]">Syncing Logistics...</div>;

  if (!rider) return <RiderOnboarding userId={user!.uid} />;

  if (rider.status === 'pending') return <RiderPending status="pending" />;
  if (rider.status === 'rejected' || rider.status === 'suspended') return <RiderPending status={rider.status} />;

  const currentDeliveries = orders.filter(o => o.deliveryStatus !== 'delivered' && o.status !== 'cancelled' && o.status !== 'returned');
  const pastDeliveries = orders.filter(o => o.deliveryStatus === 'delivered' || o.status === 'cancelled' || o.status === 'returned');

  const today = new Date().toISOString().split('T')[0];
  const todayDeliveries = orders.filter(o => o.deliveredAt?.startsWith(today)).length;
  const todayEarnings = orders.filter(o => o.deliveredAt?.startsWith(today)).length * 50; // Dynamic based on fee later

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto border-x border-gray-100 pb-32">
      {/* Rider Header */}
      <div className="bg-[#003B73] p-6 pb-20 rounded-b-[2.5rem] shadow-2xl relative mb-12 overflow-hidden">
        {/* Abstract Background Design */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-600/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

        <div className="flex justify-between items-start mb-8 relative z-10">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-xl shadow-orange-900/20 rotate-3 border-2 border-white/10">
                <Bike size={32} strokeWidth={2.5} />
             </div>
             <div>
                <h1 className="text-xl font-black text-white tracking-wider uppercase italic">NexaMart Field-X</h1>
                <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full inline-block mt-1">
                  Ops Personnel: {rider.vehiclePlate}
                </p>
             </div>
          </div>
          <button 
            onClick={() => auth.signOut()}
            className="p-3 bg-white/10 backdrop-blur-md rounded-2xl text-white/60 hover:text-white transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>

        <div className="relative z-10 space-y-4">
           <div className="flex items-center justify-between text-white/60 text-[8px] font-black uppercase tracking-[0.2em] px-1">
              <span>Fulfillment Status</span>
              <span>Performance 98%</span>
           </div>
           <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="w-[98%] h-full bg-orange-500 rounded-full" />
           </div>
        </div>

        {/* Floating Availability Toggle */}
        <button 
          onClick={async () => {
            await updateDoc(doc(db, 'riders', rider.riderId), { isAvailable: !rider.isAvailable });
          }}
          className={cn(
            "absolute -bottom-8 left-1/2 -translate-x-1/2 px-10 py-5 rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95 border-2 flex items-center gap-3 z-50",
            rider.isAvailable 
              ? "bg-green-600 text-white border-white/20 shadow-green-900/40" 
              : "bg-gray-900 text-white border-white/10 shadow-black/40"
          )}
        >
          <div className={cn("w-2.5 h-2.5 rounded-full", rider.isAvailable ? "bg-white animate-pulse" : "bg-red-500")} />
          {rider.isAvailable ? 'Field Duty Active' : 'Duty Standby'}
        </button>
      </div>

      <OperationalMetrics rider={rider} orders={orders} />

      {/* Main Content */}
      <div className="flex-1 px-6 pb-24 space-y-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'market' && (
            <motion.div 
              key="market" 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center px-1">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Open Missions ({availableOrders.length})</h3>
                <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded-full animate-pulse">Live Feed</p>
              </div>
              {availableOrders.length > 0 ? (
                availableOrders.map(order => (
                  <MarketOrderCard key={order.orderId} order={order} riderId={rider.riderId} />
                ))
              ) : (
                <div className="bg-white p-12 rounded-[2rem] border border-gray-100 text-center space-y-4 grayscale opacity-50">
                  <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto text-gray-300">
                    <Search size={32} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900 tracking-tight uppercase">Scanning Environment</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 leading-relaxed">No open tasks detected in the sector.<br/>Check back shortly.</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'deliveries' && (
            <motion.div 
              key="active" 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center px-1">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Active Logistics Payload ({currentDeliveries.length})</h3>
                {currentGPS && <span className="text-[8px] font-black text-green-600 uppercase tracking-widest bg-green-50 px-2 py-0.5 rounded-full">GPS Link Active</span>}
              </div>
              {currentDeliveries.length > 0 ? (
                currentDeliveries.map(order => (
                  <OrderCard key={order.orderId} order={order} currentGPS={currentGPS} />
                ))
              ) : (
                <div className="bg-white p-12 rounded-[2rem] border border-gray-100 text-center space-y-4">
                  <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto text-gray-300">
                    <Navigation size={32} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900 tracking-tight uppercase">Radar Clear</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 leading-relaxed">No missions assigned at the moment.<br/>Stay online to receive new orders.</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div 
              key="history" 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Mission Log</h3>
              {pastDeliveries.map(order => (
                <div key={order.orderId} className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center justify-between shadow-sm opacity-70">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                         {order.status === 'delivered' ? <CheckCircle2 size={20} className="text-green-500" /> : <AlertCircle size={20} />}
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-gray-900 uppercase">#{order.orderId.slice(-8)}</p>
                         <p className="text-[8px] font-bold text-gray-400 uppercase">{formatDate(order.deliveredAt || order.updatedAt)}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-xs font-black text-gray-900">Rs. {order.totalAmount.toLocaleString()}</p>
                      <p className={cn("text-[7px] font-black uppercase tracking-widest", order.status === 'delivered' ? "text-green-600" : "text-red-600")}>
                        {order.status}
                      </p>
                   </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'map' && (
            <motion.div 
              key="map_panel" 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center px-1">
                 <div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Logistics Radar</h3>
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Live Operational Visualization</p>
                 </div>
                 {currentGPS && <span className="text-[8px] font-black text-green-600 uppercase tracking-widest bg-green-50 px-2.5 py-1 rounded-full border border-green-100 animate-pulse">Telemetry Link Active</span>}
              </div>

              {/* Filters Panel */}
              <div className="bg-white p-2 rounded-2xl border border-gray-100 flex gap-2">
                <button 
                  onClick={() => setMapFilter('all')} 
                  className={cn(
                    "flex-1 py-2 text-[8px] font-black uppercase tracking-wider rounded-xl transition-all",
                    mapFilter === 'all' ? "bg-[#003B73] text-white shadow-lg" : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                  )}
                >
                  All Pins
                </button>
                <button 
                  onClick={() => setMapFilter('riders')} 
                  className={cn(
                    "flex-1 py-2 text-[8px] font-black uppercase tracking-wider rounded-xl transition-all",
                    mapFilter === 'riders' ? "bg-orange-600 text-white shadow-lg" : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                  )}
                >
                  Riders ({activeRiders.length})
                </button>
                <button 
                  onClick={() => setMapFilter('orders')} 
                  className={cn(
                    "flex-1 py-2 text-[8px] font-black uppercase tracking-wider rounded-xl transition-all",
                    mapFilter === 'orders' ? "bg-indigo-600 text-white shadow-lg" : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                  )}
                >
                  Orders ({availableOrders.length + currentDeliveries.length})
                </button>
              </div>

              {/* Map Canvas */}
              <div className="bg-white rounded-[2.5rem] border border-gray-100 p-2 shadow-xl shadow-gray-100 relative overflow-hidden h-[380px]">
                <FreeRadarMap
                  currentGPS={currentGPS}
                  activeRiders={activeRiders}
                  availableOrders={availableOrders}
                  currentDeliveries={currentDeliveries}
                  mapFilter={mapFilter}
                  onItemSelect={(item) => setSelectedMapItem(item)}
                  myRiderId={rider?.riderId || ''}
                  myProfileName={profile?.fullName || 'Me'}
                  myRiderDetails={{
                    vehiclePlate: rider?.vehiclePlate || 'N/A',
                    rating: rider?.rating || 5.0,
                    vehicleType: rider?.vehicleType || 'Bike'
                  }}
                />
              </div>

              {/* Slider Bottom-Sheet Panel of Selected Pins */}
              <AnimatePresence>
                {selectedMapItem && (
                  <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-xl space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[7px] font-black text-gray-400 uppercase tracking-[0.2em]">Radar Focus</p>
                        <h4 className="text-xs font-black text-gray-900 uppercase mt-0.5">
                          {selectedMapItem.type === 'self' && 'Field Officer: Me'}
                          {selectedMapItem.type === 'rider' && `Officer Profile: ${selectedMapItem.data.vehiclePlate}`}
                          {selectedMapItem.type === 'order' && `Delivery Payload: #${selectedMapItem.data.orderId.slice(-8)}`}
                        </h4>
                      </div>
                      <button 
                        onClick={() => setSelectedMapItem(null)}
                        className="text-[9px] font-black text-gray-400 hover:text-gray-600 uppercase border border-gray-100 px-3 py-1.5 rounded-xl transition-all"
                      >
                        Dismiss
                      </button>
                    </div>

                    <div className="bg-gray-50/50 p-4 rounded-2xl space-y-3">
                      {selectedMapItem.type === 'self' && (
                        <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-black uppercase">
                          <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                            <span className="text-gray-400 text-[6px] tracking-widest block uppercase">Reg</span>
                            <span className="text-gray-950 mt-1 block">{selectedMapItem.data.vehiclePlate}</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                            <span className="text-gray-400 text-[6px] tracking-widest block uppercase">Score</span>
                            <span className="text-orange-600 mt-1 block">{selectedMapItem.data.rating} ★</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                            <span className="text-gray-400 text-[6px] tracking-widest block uppercase">Type</span>
                            <span className="text-blue-600 mt-1 block">{selectedMapItem.data.vehicleType}</span>
                          </div>
                        </div>
                      )}

                      {selectedMapItem.type === 'rider' && (
                        <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-black uppercase">
                          <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                            <span className="text-gray-400 text-[6px] tracking-widest block uppercase">Reg</span>
                            <span className="text-gray-950 mt-1 block">{selectedMapItem.data.vehiclePlate}</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                            <span className="text-gray-400 text-[6px] tracking-widest block uppercase">Score</span>
                            <span className="text-orange-600 mt-1 block">{selectedMapItem.data.rating || '5.0'} ★</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                            <span className="text-gray-400 text-[6px] tracking-widest block uppercase">Vehicle</span>
                            <span className="text-blue-600 mt-1 block">{selectedMapItem.data.vehicleType}</span>
                          </div>
                        </div>
                      )}

                      {selectedMapItem.type === 'order' && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase">
                            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 tracking-wider">
                              {selectedMapItem.data.riderId === rider?.riderId ? 'My Assignment' : 'Open Market'}
                            </span>
                            <span className="text-orange-600">Rs. {selectedMapItem.data.totalAmount.toLocaleString()}</span>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-gray-100 space-y-2">
                            <div className="flex items-center gap-2">
                              <MapPin size={12} className="text-blue-600" />
                              <p className="text-[9px] font-bold text-gray-500 uppercase">
                                {selectedMapItem.data.shippingAddress.streetAddress}, {selectedMapItem.data.shippingAddress.city}, {selectedMapItem.data.shippingAddress.district}
                              </p>
                            </div>
                            {selectedMapItem.data.shippingAddress.landmark && (
                              <p className="text-[8px] font-black text-orange-600 uppercase italic">
                                Landmark: {selectedMapItem.data.shippingAddress.landmark}
                              </p>
                            )}
                          </div>
                          {selectedMapItem.data.items && (
                            <div className="bg-white/50 p-3 rounded-xl border border-dashed border-gray-200">
                              <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-1.5 border-b border-gray-100 pb-1">Items Included</p>
                              {selectedMapItem.data.items.slice(0, 3).map((it: any, index: number) => (
                                <p key={index} className="text-[8px] font-bold text-gray-600 uppercase">
                                  {it.name} (Qty {it.quantity})
                                </p>
                              ))}
                              {selectedMapItem.data.items.length > 3 && (
                                <p className="text-[6px] font-black text-blue-500 uppercase mt-1">+{selectedMapItem.data.items.length - 3} More Items</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {selectedMapItem.type === 'order' && (
                      <div>
                        {selectedMapItem.data.riderId === rider?.riderId ? (
                          <button
                            onClick={() => {
                              setActiveTab('deliveries');
                              setSelectedMapItem(null);
                            }}
                            className="w-full bg-[#003B73] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
                          >
                            <Truck size={16} /> Manage Active Load
                          </button>
                        ) : (
                          <button
                            disabled={claimingOnMap}
                            onClick={() => handleClaimFromMap(selectedMapItem.data.orderId)}
                            className="w-full bg-gray-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {claimingOnMap ? 'Securing claim...' : <><ShieldCheck size={16} /> Accept & Claim Mission</>}
                          </button>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === 'profile' && rider && (
            <motion.div
              key="profile_panel"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6 text-left"
            >
              {/* Segmented Sub Tabs */}
              <div className="bg-white p-1.5 rounded-2xl border border-gray-100 flex gap-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setProfileSubTab('details')}
                  className={cn(
                    "flex-1 py-3 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all text-center",
                    profileSubTab === 'details' ? "bg-orange-600 text-white shadow-md shadow-orange-100" : "bg-transparent text-gray-400 hover:text-gray-900"
                  )}
                >
                  My Profile
                </button>
                <button
                  type="button"
                  onClick={() => setProfileSubTab('earnings')}
                  className={cn(
                    "flex-1 py-3 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all text-center",
                    profileSubTab === 'earnings' ? "bg-orange-600 text-white shadow-md shadow-orange-100" : "bg-transparent text-gray-400 hover:text-gray-900"
                  )}
                >
                  Earnings
                </button>
                <button
                  type="button"
                  onClick={() => setProfileSubTab('notifications')}
                  className={cn(
                    "flex-1 py-3 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all text-center",
                    profileSubTab === 'notifications' ? "bg-orange-600 text-white shadow-md shadow-orange-100" : "bg-transparent text-gray-400 hover:text-gray-900"
                  )}
                >
                  Alerts
                </button>
              </div>

              {profileSubTab === 'details' && (
                <div className="space-y-4">
                  {/* Photo Avatar Card */}
                  <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center relative">
                        {riderPhotoData ? (
                          <img src={riderPhotoData} className="w-full h-full object-cover" />
                        ) : (
                          <User size={28} className="text-gray-300" />
                        )}
                      </div>
                      <label htmlFor="rider-photo-file" className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center cursor-pointer shadow-md border-2 border-white active:scale-90 transition-transform">
                        <Camera size={12} />
                        <input
                          id="rider-photo-file"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleProfileImageUpload(e, 'rider')}
                        />
                      </label>
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-gray-900 uppercase tracking-tight">{profile?.fullName || 'Logistics Officer'}</h4>
                      <p className="text-[7px] font-black text-orange-600 uppercase tracking-widest mt-1">Status: Active Service</p>
                    </div>
                  </div>

                  {/* Profile Edit Form */}
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    setSavingProfile(true);
                    try {
                      await updateDoc(doc(db, 'riders', rider.riderId), {
                        phone: phoneInput,
                        vehiclePlate: vehiclePlateInput,
                        vehicleType: vehicleTypeInput,
                        licenseNumber: licenseNumberInput,
                        bankName: bankNameInput,
                        bankAccountNo: bankAccountNoInput,
                        bankAccountName: bankAccountNameInput,
                        riderPhoto: riderPhotoData || '',
                        licensePhoto: licensePhotoData || '',
                        idCardPhoto: idCardPhotoData || ''
                      });
                      alert("Logistics officer credentials updated successfully at base database!");
                    } catch(err) {
                      console.error("Profile save error:", err);
                      alert("Error updating credentials.");
                    } finally {
                      setSavingProfile(false);
                    }
                  }} className="space-y-4 bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[7px] font-black text-gray-400 uppercase tracking-widest pl-1">Officer Phone</label>
                        <input
                          type="tel"
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-100 py-3.5 px-4 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-orange-500 transition-all font-mono"
                          placeholder="98XXXXXXXX"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[7px] font-black text-gray-400 uppercase tracking-widest pl-1">Vehicle Class</label>
                        <select
                          value={vehicleTypeInput}
                          onChange={(e) => setVehicleTypeInput(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-100 py-3 px-3 rounded-xl text-[9px] font-black uppercase outline-none focus:ring-1 focus:ring-orange-500 transition-all"
                        >
                          <option value="Bike">Bike / Motorcycle</option>
                          <option value="Electric">Electric Scooter</option>
                          <option value="Cycle">Green Bicycle</option>
                          <option value="Van">Cargo Van</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[7px] font-black text-gray-400 uppercase tracking-widest pl-1">Plate Number</label>
                        <input
                          type="text"
                          value={vehiclePlateInput}
                          onChange={(e) => setVehiclePlateInput(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-100 py-3.5 px-4 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-orange-500 transition-all uppercase font-mono"
                          placeholder="BA-2-PA-5555"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[7px] font-black text-gray-400 uppercase tracking-widest pl-1">License Number</label>
                        <input
                          type="text"
                          value={licenseNumberInput}
                          onChange={(e) => setLicenseNumberInput(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-100 py-3.5 px-4 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-orange-500 transition-all uppercase font-mono"
                          placeholder="LIC-9283749"
                          required
                        />
                      </div>
                    </div>

                    {/* Official Document Previews */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="space-y-2">
                        <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest pl-1">License Photo</p>
                        <label className="w-full h-24 rounded-xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center p-2 cursor-pointer hover:bg-gray-100/50 transition-all relative overflow-hidden">
                          {licensePhotoData ? (
                            <img src={licensePhotoData} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <>
                              <Camera className="text-gray-300 mb-1" size={16} />
                              <span className="text-[7px] font-black text-gray-400 uppercase tracking-wider">Upload ID</span>
                            </>
                          )}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleProfileImageUpload(e, 'license')} />
                        </label>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest pl-1">ID Card Photo</p>
                        <label className="w-full h-24 rounded-xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center p-2 cursor-pointer hover:bg-gray-100/50 transition-all relative overflow-hidden">
                          {idCardPhotoData ? (
                            <img src={idCardPhotoData} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <>
                              <Camera className="text-gray-300 mb-1" size={16} />
                              <span className="text-[7px] font-black text-gray-400 uppercase tracking-wider">Upload ID</span>
                            </>
                          )}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleProfileImageUpload(e, 'id')} />
                        </label>
                      </div>
                    </div>

                    {/* Bank Settlements Details */}
                    <div className="border-t border-dashed border-gray-100 pt-4 space-y-3">
                      <h5 className="text-[8px] font-black text-gray-400 uppercase tracking-widest pl-1">Settlement Bank Account</h5>
                      <div className="space-y-1">
                        <label className="text-[7px] font-black text-gray-400 uppercase tracking-widest pl-1">Settlement Bank Name</label>
                        <input
                          type="text"
                          value={bankNameInput}
                          onChange={(e) => setBankNameInput(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-100 py-3.5 px-4 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-orange-500 transition-all"
                          placeholder="Global IME Bank / Nabil Bank"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[7px] font-black text-gray-400 uppercase tracking-widest pl-1">Account Number</label>
                          <input
                            type="text"
                            value={bankAccountNoInput}
                            onChange={(e) => setBankAccountNoInput(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 py-3.5 px-4 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-orange-500 transition-all font-mono"
                            placeholder="01029384758"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[7px] font-black text-gray-400 uppercase tracking-widest pl-1">A/C Name</label>
                          <input
                            type="text"
                            value={bankAccountNameInput}
                            onChange={(e) => setBankAccountNameInput(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 py-3.5 px-4 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-orange-500 transition-all"
                            placeholder="DIKSHANT CHAUDHARY"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="w-full bg-orange-600 text-white rounded-2xl py-4.5 text-[9px] font-black uppercase tracking-widest shadow-xl shadow-orange-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      {savingProfile ? (
                        <>Updating bases...</>
                      ) : (
                        <><Save size={14} /> Commit Profile Credentials</>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {profileSubTab === 'earnings' && (
                <div className="space-y-4 text-left">
                  {/* Financial Balance Panel */}
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-[2rem] text-white shadow-xl space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[7px] font-black text-orange-400 uppercase tracking-[0.2em]">Escrow Balance</p>
                        <h4 className="text-2xl font-black italic tracking-wide mt-1 text-white">Rs. {(rider.walletBalance || 0).toLocaleString()}</h4>
                      </div>
                      <span className="text-[7px] font-black bg-white/10 px-2.5 py-1 rounded border border-white/5 uppercase tracking-widest text-[#FFF]">Vault settled</span>
                    </div>

                    <div className="flex justify-between items-center gap-3 pt-3 border-t border-white/10">
                      <div>
                        <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Bank info</p>
                        <p className="text-[9px] font-bold text-white/80 mt-1 uppercase truncate max-w-[150px]">
                          {rider.bankName || 'A/C Info Not Configured'} • {rider.bankAccountNo ? `*${rider.bankAccountNo.slice(-4)}` : 'N/A'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRequestPayout}
                        disabled={!rider.walletBalance || rider.walletBalance <= 0}
                        className="bg-orange-500 hover:bg-orange-600 disabled:opacity-35 text-white font-black text-[9px] uppercase tracking-widest px-4.5 py-3 rounded-xl text-center shadow-lg transition-all active:scale-95 whitespace-nowrap"
                      >
                        Payout Funds
                      </button>
                    </div>
                  </div>

                  {/* Earnings grids panels */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-1">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Daily earnings</p>
                      <h4 className="text-sm font-black text-gray-900">Rs. {orders.filter(o => o.deliveredAt?.startsWith(new Date().toISOString().split('T')[0])).length * 50}</h4>
                      <p className="text-[6px] font-bold text-green-600 uppercase">credited from completed runs</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-1">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Weekly earnings</p>
                      <h4 className="text-sm font-black text-gray-900">Rs. {(orders.filter(o => o.status === 'delivered').length * 50) + 150}</h4>
                      <p className="text-[6px] font-bold text-orange-600 uppercase">including streak reward</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-1">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Bonus streak earning</p>
                      <h4 className="text-sm font-black text-gray-900">Rs. 150</h4>
                      <p className="text-[6px] font-bold text-green-600 uppercase">5 runs milestones active</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-1">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">COD Collected</p>
                      <h4 className="text-sm font-black text-gray-900">
                        Rs. {orders.filter(o => o.deliveryStatus === 'delivered' && o.paymentStatus === 'paid' && o.paymentMethod === 'COD').reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString()}
                      </h4>
                      <p className="text-[6px] font-bold text-red-600 uppercase">To be deposited at base</p>
                    </div>
                  </div>

                  {/* Settlement logs list */}
                  <div className="space-y-2 pt-2 text-left">
                    <h5 className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Settlement log history</h5>
                    {payoutRequests.length > 0 ? (
                      payoutRequests.map((req, idx) => (
                        <div key={idx} className="bg-white p-4.5 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm">
                          <div>
                            <p className="text-[9px] font-black text-gray-900 uppercase">Payout REQUEST #{req.requestId.slice(-6)}</p>
                            <p className="text-[7px] font-bold text-gray-400 uppercase">{formatDate(req.createdAt)}</p>
                          </div>
                          <div className="text-right font-bold">
                            <p className="text-xs font-black text-gray-900">Rs. {req.amount}</p>
                            <span className={cn(
                              "text-[6px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                              req.status === 'approved' ? "text-green-600 bg-green-50" : "text-orange-600 bg-orange-50"
                            )}>{req.status}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center text-[9px] font-bold text-gray-400 uppercase">
                        No previous payout records found in sector
                      </div>
                    )}
                  </div>
                </div>
              )}

              {profileSubTab === 'notifications' && (
                <div className="space-y-4 text-left">
                  <div className="flex justify-between items-center px-1">
                    <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Active Dispatch Log ({orders.filter(o => o.deliveryStatus === 'assigned').length + 3})</h4>
                    <button
                      type="button"
                      onClick={() => {
                        alert("Ping validation simulated: Checking current active assignment queues...");
                      }}
                      className="text-[7px] font-black bg-blue-50 text-blue-600 uppercase tracking-widest px-2.5 py-1 rounded border border-blue-100 cursor-pointer"
                    >
                      Trigger Ping
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* Live Assignment Alerts */}
                    {orders.filter(o => o.deliveryStatus === 'assigned').map(o => (
                      <div key={o.orderId} className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-start gap-4">
                        <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md shrink-0"><Package size={16} /></div>
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-[8px] font-black text-orange-600 uppercase tracking-widest bg-orange-100 px-1.5 py-0.5 rounded">NEW ORDER ASSIGNED</span>
                            <span className="text-[6px] text-gray-400 font-bold uppercase">Just Now</span>
                          </div>
                          <p className="text-[9px] font-black text-gray-900 uppercase">Fulfillment Run Assigned #{o.orderId.slice(-8)}</p>
                          <p className="text-[8px] text-gray-500 font-bold uppercase">Pickup payload from NexaMart Hub immediately & carry out delivery to the destination.</p>
                        </div>
                      </div>
                    ))}

                    {/* General alerts */}
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-start gap-4">
                      <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-md shrink-0"><ShieldCheck size={16} /></div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest bg-blue-100 px-1.5 py-0.5 rounded">DELIVERY REMINDER</span>
                          <span className="text-[6px] text-gray-400 font-bold uppercase">30 Mins Ago</span>
                        </div>
                        <p className="text-[9px] font-black text-gray-900 uppercase">Secure Signature Validation</p>
                        <p className="text-[8px] text-gray-500 font-bold uppercase">Remember to secure customer digital signature on the drawing pad before concluding delivery.</p>
                      </div>
                    </div>

                    <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-4">
                      <div className="w-8 h-8 rounded-xl bg-red-500 text-white flex items-center justify-center shadow-md shrink-0"><AlertCircle size={16} /></div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] font-black text-red-600 uppercase tracking-widest bg-red-100 px-1.5 py-0.5 rounded">FAILED ORDER ALERT</span>
                          <span className="text-[6px] text-gray-400 font-bold uppercase">2 Hours Ago</span>
                        </div>
                        <p className="text-[9px] font-black text-gray-900 uppercase">Abortion Logged for Incomplete Delivery</p>
                        <p className="text-[8px] text-gray-500 font-bold uppercase">A recent order abort action was documented with reason checklist. Ensure proof photo uploaded is visible.</p>
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-100 p-4 rounded-2xl flex items-start gap-4">
                      <div className="w-8 h-8 rounded-xl bg-green-500 text-white flex items-center justify-center shadow-md shrink-0"><TrendingUp size={16} /></div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] font-black text-green-600 uppercase tracking-widest bg-green-100 px-1.5 py-0.5 rounded">EARNINGS UPDATE</span>
                          <span className="text-[6px] text-gray-400 font-bold uppercase">Today</span>
                        </div>
                        <p className="text-[9px] font-black text-gray-900 uppercase">Rs. 50 Escrow Reflected</p>
                        <p className="text-[8px] text-gray-500 font-bold uppercase">Delivery reward successfully calculated and credited to escrow ledger.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-[#003B73] backdrop-blur-xl border-t border-white/10 px-6 py-4 flex justify-around items-center z-50 rounded-t-3xl shadow-2xl">
        <NavButton active={activeTab === 'market'} onClick={() => setActiveTab('market')} icon={Search} label="Hub" />
        <NavButton active={activeTab === 'deliveries'} onClick={() => setActiveTab('deliveries')} icon={Package} label="Load" />
        <NavButton active={activeTab === 'map'} onClick={() => setActiveTab('map')} icon={MapIcon} label="Radar" />
        <NavButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={History} label="Logs" />
        <NavButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={User} label="Fleet ID" />
      </div>
    </div>
  );
}

function MarketOrderCard({ order, riderId }: { order: Order, riderId: string }) {
  const [claiming, setClaiming] = useState(false);

  const handleClaim = async () => {
    if (!confirm("Claim this mission for assignment?")) return;
    setClaiming(true);
    try {
      await updateDoc(doc(db, 'orders', order.orderId), {
        riderId,
        deliveryStatus: 'assigned',
        assignedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      await updateDoc(doc(db, 'riders', riderId), {
        activeOrdersCount: increment(1)
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${order.orderId}`);
    } finally {
      setClaiming(false);
    }
  };

  return (
    <motion.div layout className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-100/50 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Protocol ID</p>
          <p className="text-xs font-black text-gray-900 tracking-tight">#{order.orderId.slice(-8)}</p>
        </div>
        <p className="text-sm font-black text-orange-600">Rs. {order.totalAmount.toLocaleString()}</p>
      </div>

      <div className="bg-gray-50/50 p-4 rounded-2xl space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm border border-blue-100"><MapPin size={16}/></div>
          <div>
            <p className="text-[10px] font-black text-gray-900 uppercase">{order.shippingAddress.city}</p>
            <p className="text-[8px] font-bold text-gray-400 uppercase">{order.shippingAddress.district}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-gray-400 shadow-sm border border-gray-100"><Clock size={16}/></div>
          <p className="text-[9px] font-bold text-gray-500 uppercase">{formatDate(order.createdAt)}</p>
        </div>
      </div>

      <button
        disabled={claiming}
        onClick={handleClaim}
        className="w-full bg-gray-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-2"
      >
        {claiming ? 'Transmitting Claim...' : <><ShieldCheck size={16} /> Claim Mission</>}
      </button>
    </motion.div>
  );
}

import { Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

function RiderRouteInfo({ 
  origin, 
  destination,
  onRouteLoaded 
}: { 
  origin: { lat: number, lng: number }, 
  destination: { lat: number, lng: number },
  onRouteLoaded?: (data: { distance: string, duration: string, steps: any[] }) => void
}) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const [directionsService, setDirectionsService] = useState<any>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null);
  const [routeData, setRouteData] = useState<{ distance: string, duration: string } | null>(null);

  useEffect(() => {
    if (!routesLib || !map) return;
    setDirectionsService(new (routesLib as any).DirectionsService());
    const renderer = new (routesLib as any).DirectionsRenderer({ map, suppressMarkers: true });
    setDirectionsRenderer(renderer);
    return () => {
      renderer.setMap(null);
    };
  }, [routesLib, map]);

  useEffect(() => {
    if (!directionsService || !directionsRenderer || !window.google) return;

    directionsService.route({
      origin,
      destination,
      travelMode: (window.google as any).maps.TravelMode.DRIVING
    }, (result: any, status: any) => {
      if (status === (window.google as any).maps.DirectionsStatus.OK && result) {
        directionsRenderer.setDirections(result);
        const route = result.routes[0].legs[0];
        
        const parsedSteps = route.steps ? route.steps.map((s: any) => ({
          instructions: s.instructions ? s.instructions.replace(/<[^>]*>/g, '') : '',
          distance: s.distance?.text || '',
          duration: s.duration?.text || ''
        })) : [];

        const info = {
          distance: route.distance?.text || '',
          duration: route.duration?.text || '',
          steps: parsedSteps
        };

        setRouteData({
          distance: info.distance,
          duration: info.duration
        });

        if (onRouteLoaded) {
          onRouteLoaded(info);
        }
      }
    });
  }, [directionsService, directionsRenderer, origin.lat, origin.lng, destination.lat, destination.lng]);

  if (!routeData) return null;

  return (
    <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-gray-100 shadow-xl flex items-center gap-3">
       <div className="w-8 h-8 rounded-xl bg-[#003B73] text-white flex items-center justify-center shadow-lg"><Truck size={16} /></div>
       <div>
          <p className="text-[10px] font-black text-gray-900 uppercase tracking-tighter">Payload Logistics</p>
          <div className="flex items-center gap-2 mt-0.5">
             <span className="text-[8px] font-bold text-gray-400 uppercase">{routeData.distance}</span>
             <div className="w-1 h-1 bg-gray-200 rounded-full" />
             <span className="text-[8px] font-black text-orange-600 uppercase">ETA: {routeData.duration}</span>
          </div>
       </div>
    </div>
  );
}

function OrderCard({ order, currentGPS }: { order: Order, currentGPS?: { latitude: number, longitude: number } | null }) {
  const [updating, setUpdating] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showSignature, setShowSignature] = useState(false);
  const [deliveryPhotos, setDeliveryPhotos] = useState<string[]>([]);
  const [cancellationProofImage, setCancellationProofImage] = useState<string | null>(null);
  const [showInAppMap, setShowInAppMap] = useState(false);

  // Navigation & Simulation State
  const [navProgress, setNavProgress] = useState(0); // 0 to 100 percentage
  const [currentStep, setCurrentStep] = useState(0); // current step index
  const [navigationSteps, setNavigationSteps] = useState<Array<{ instructions: string, distance: string, duration: string }>>([]);
  const [navMeta, setNavMeta] = useState<{ distance: string, duration: string } | null>(null);

  const handleRouteLoaded = (routeData: { distance: string, duration: string, steps: any[] }) => {
    if (routeData.steps && routeData.steps.length > 0) {
      setNavigationSteps(routeData.steps);
    }
    setNavMeta({
      distance: routeData.distance,
      duration: routeData.duration
    });
  };

  useEffect(() => {
    if (navigationSteps.length === 0) {
      const steps = [
        {
          instructions: "Retrieve package from fulfillment base and start ignition.",
          distance: "0.2 KM",
          duration: "1 min"
        },
        {
          instructions: `Proceed towards main arterial road heading to ${order.shippingAddress.city}.`,
          distance: "1.4 KM",
          duration: "4 mins"
        },
        {
          instructions: `Turn right near the milestone crossing indicating ${order.shippingAddress.district || 'District Base'}.`,
          distance: "0.8 KM",
          duration: "2 mins"
        },
        {
          instructions: `Approach final neighborhood destination near landmark: ${order.shippingAddress.landmark || 'Nearby Main Point'}.`,
          distance: "0.5 KM",
          duration: "2 mins"
        },
        {
          instructions: `Acknowledge arriving at target address: ${order.shippingAddress.streetAddress}. Park vehicle safely and proceed on foot.`,
          distance: "0.1 KM",
          duration: "1 min"
        }
      ];
      setNavigationSteps(steps);
      setNavMeta({
        distance: "3.2 KM",
        duration: "11 mins"
      });
    }
  }, [order.shippingAddress, navigationSteps.length]);

  const distance = currentGPS && order.shippingAddress.latitude && order.shippingAddress.longitude ? 
    getDistance(currentGPS.latitude, currentGPS.longitude, order.shippingAddress.latitude, order.shippingAddress.longitude) : 
    null;

  const getGPS = (): Promise<{ latitude: number, longitude: number }> => {
    return new Promise((resolve) => {
      const fallback = currentGPS || { latitude: 27.7172, longitude: 85.3240 };
      if (!navigator.geolocation) {
        resolve(fallback);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => resolve(fallback),
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
      );
    });
  };

  const handleUpdateStatus = async (deliveryStatus: Order['deliveryStatus'], additionalUpdates: any = {}) => {
    setUpdating(true);
    try {
      const gps = await getGPS();
      const updates: any = {
        deliveryStatus,
        updatedAt: new Date().toISOString(),
        deliveryLocation: {
          latitude: gps.latitude,
          longitude: gps.longitude,
          timestamp: new Date().toISOString()
        },
        ...additionalUpdates
      };

      if (deliveryStatus === 'accepted') updates.acceptedAt = new Date().toISOString();
      if (deliveryStatus === 'picked') updates.pickedAt = new Date().toISOString();
      if (deliveryStatus === 'out_for_delivery') updates.outForDeliveryAt = new Date().toISOString();
      
      if (deliveryStatus === 'delivered') {
        updates.status = 'delivered';
        updates.deliveredAt = new Date().toISOString();
        updates.paymentStatus = 'paid';
        
        if (deliveryPhotos.length > 0) {
          updates.deliveryProof = deliveryPhotos[0];
          updates.deliveryPhotos = deliveryPhotos;
        }
        
        await updateDoc(doc(db, 'riders', order.riderId!), {
          totalDeliveries: increment(1),
          activeOrdersCount: increment(-1),
          walletBalance: increment(50)
        });
      }

      if (deliveryStatus === 'cancelled') {
        updates.status = 'confirmed';
        updates.cancelledAt = new Date().toISOString();
        updates.riderId = null;
        updates.deliveryStatus = null;
        
        await updateDoc(doc(db, 'riders', order.riderId!), {
          activeOrdersCount: increment(-1)
        });
      }

      await updateDoc(doc(db, 'orders', order.orderId), updates);
      if (deliveryStatus === 'cancelled') setShowCancelModal(false);
      setShowSignature(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${order.orderId}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'delivery' | 'cancel' = 'delivery') => {
    const file = e.target.files?.[0];
    if (file) {
      setUpdating(true);
      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const compressed = await compressImage(reader.result as string, 800, 800, 0.7);
          if (type === 'delivery') {
             setDeliveryPhotos(prev => [...prev, compressed]);
          } else {
             setCancellationProofImage(compressed);
          }
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error("Proof upload error:", err);
      } finally {
        setUpdating(false);
      }
    }
  };

  const removePhoto = (index: number) => {
    setDeliveryPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const openWhatsApp = () => {
    window.open(`https://wa.me/9779812345678`, '_blank');
  };

  const startLat = currentGPS?.latitude || 27.7000;
  const startLng = currentGPS?.longitude || 85.3000;
  const endLat = Number(order.shippingAddress.latitude) || 27.7172;
  const endLng = Number(order.shippingAddress.longitude) || 85.3240;

  const fraction = navProgress / 100;
  const liveRiderLat = startLat + (endLat - startLat) * fraction;
  const liveRiderLng = startLng + (endLng - startLng) * fraction;

  if (order.deliveryStatus === 'out_for_delivery') {
    return (
      <motion.div 
        layout 
        className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden"
      >
        {/* Navigation Cockpit Header */}
        <div className="p-5 border-b border-gray-100 bg-gray-950 text-white flex justify-between items-center text-left">
          <div className="text-left">
            <span className="text-[7px] font-black text-green-400 p-1 uppercase tracking-widest bg-green-950/60 px-2.5 py-1 rounded-full border border-green-900 inline-block animate-pulse mb-1.5 text-left">
              ● Active Mission Navigation
            </span>
            <p className="text-xs font-black tracking-tight uppercase text-left">Payload ID #{order.orderId.slice(-8)}</p>
          </div>
          <div className="text-right">
            <p className="text-[7px] font-black text-gray-400 uppercase tracking-wider">Device Telemetry</p>
            <p className="text-[9px] font-black text-green-400 uppercase tracking-tighter">GPS LINK LIVE</p>
          </div>
        </div>

        {/* Live Map Box & HUD */}
        <div className="relative aspect-square sm:aspect-video w-full overflow-hidden bg-gray-100 border-b border-gray-100 h-[320px] z-10">
          <FreeDeliveryNavMap
            startLat={startLat}
            startLng={startLng}
            endLat={endLat}
            endLng={endLng}
            riderProgress={navProgress}
            onRouteLoaded={handleRouteLoaded}
          />

          {/* Immersive HUD Float showing ETA & Remaining */}
          <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-gray-100 shadow-xl flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#003B73] text-white flex items-center justify-center shadow-md">
              <Compass size={12} className="animate-spin [animation-duration:15s]" />
            </div>
            <div className="text-left">
              <p className="text-[5px] font-black text-gray-405 uppercase tracking-widest text-left">EN-ROUTE LOGISTICS</p>
              <div className="flex items-center gap-1.5 mt-0.5 text-left">
                <span className="text-[8px] font-black text-slate-800 uppercase text-left whitespace-nowrap">
                  {((navMeta ? parseFloat(navMeta.distance) : 12) * (1 - fraction)).toFixed(1)} KM REMAINING
                </span>
                <span className="w-1 h-1 bg-gray-205 rounded-full" />
                <span className="text-[8px] font-black text-orange-605 uppercase text-left whitespace-nowrap">
                  ETA: {Math.ceil((navMeta ? parseFloat(navMeta.duration) : 45) * (1 - fraction))} MINS
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Stepping Navigation Board (Flipkart / Amazon-like HUD) */}
        <div className="p-6 space-y-6">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-start gap-4 shadow-inner text-left">
            <div className="w-10 h-10 rounded-xl bg-orange-100/80 text-orange-600 border border-orange-200/50 flex items-center justify-center flex-shrink-0 shadow-sm shrink-0">
              {navigationSteps[currentStep]?.instructions?.toLowerCase().includes('left') ? (
                <CornerUpLeft size={20} className="stroke-[2.5]" />
              ) : navigationSteps[currentStep]?.instructions?.toLowerCase().includes('right') ? (
                <CornerUpRight size={20} className="stroke-[2.5]" />
              ) : navigationSteps[currentStep]?.instructions?.toLowerCase().includes('arrive') || currentStep === navigationSteps.length - 1 ? (
                <Flag size={20} className="stroke-[2.5]" />
              ) : (
                <ArrowUp size={20} className="stroke-[2.5]" />
              )}
            </div>
            <div className="flex-1 space-y-1 text-left">
              <div className="flex justify-between items-center text-left">
                <span className="text-[7px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                  Instruction {currentStep + 1} of {navigationSteps.length}
                </span>
                <span className="text-[8px] font-black text-gray-400">
                  {navigationSteps[currentStep]?.distance || '0.2 KM'}
                </span>
              </div>
              <p className="text-[10px] text-left font-bold text-gray-900 uppercase tracking-tight leading-relaxed">
                {navigationSteps[currentStep]?.instructions || 'Proceed along the highlighted route towards your target.'}
              </p>
            </div>
          </div>

          {/* Progress bar visual slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[7px] font-black text-gray-400 uppercase tracking-wider">
              <span>Origin</span>
              <span className="text-[#003B73]">{navProgress}% MISSION PROGRESS</span>
              <span>Customer</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
                style={{ width: `${navProgress}%` }}
              />
            </div>
          </div>

          {/* Micro Controller Panel */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (currentStep > 0) {
                  const prevStep = currentStep - 1;
                  setCurrentStep(prevStep);
                  setNavProgress(Math.floor((prevStep / (navigationSteps.length - 1)) * 100));
                }
              }}
              disabled={currentStep === 0}
              className="flex-shrink-0 border border-gray-200 text-gray-600 rounded-xl px-4 py-3 text-[9px] font-black uppercase tracking-widest active:scale-95 disabled:opacity-30 transition-all flex items-center justify-center"
            >
              <ArrowLeft size={14} />
            </button>

            {navProgress < 100 ? (
              <button
                onClick={() => {
                  const nextStep = currentStep + 1;
                  if (nextStep < navigationSteps.length) {
                    setCurrentStep(nextStep);
                    const newProgress = Math.floor((nextStep / (navigationSteps.length - 1)) * 100);
                    setNavProgress(newProgress);
                  }
                }}
                className="flex-1 bg-[#003B73] hover:bg-[#00274c] text-white rounded-xl py-3 text-[9px] font-black uppercase tracking-widest active:scale-95 shadow-md flex items-center justify-center gap-2 transition-all"
              >
                Next Step <ArrowRight size={14} />
              </button>
            ) : (
              <div className="flex-1 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center py-2 px-3 text-[9px] font-black text-green-600 uppercase tracking-tight text-center animate-bounce">
                🚀 Destination Reached! Ready for Handover.
              </div>
            )}

            <button
              onClick={() => {
                if (navProgress < 100) {
                  const nextStep = currentStep + 1;
                  setCurrentStep(nextStep < navigationSteps.length ? nextStep : navigationSteps.length - 1);
                  const newProgress = Math.min(100, Math.floor(((currentStep + 1) / (navigationSteps.length - 1)) * 100));
                  setNavProgress(newProgress);
                } else {
                  setCurrentStep(0);
                  setNavProgress(0);
                }
              }}
              className="px-4 py-3 bg-gray-900 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 hover:bg-black active:scale-95 shadow-sm transition-all"
            >
              <Compass size={12} className={navProgress > 0 && navProgress < 100 ? "animate-spin" : ""} />
              {navProgress === 100 ? 'Reset Sim' : 'Simulate Ride'}
            </button>
          </div>

          {/* Customer Address Details Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
            <div className="flex items-start justify-between">
              <div className="text-left">
                <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest text-left">RECIPIENT PROTOCOL</p>
                <h4 className="text-xs font-black text-gray-900 uppercase mt-0.5 text-left">
                  {order.shippingAddress.fullName || 'Customer Profile'}
                </h4>
              </div>
              <span className="text-[8px] font-black px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 uppercase">
                {order.shippingAddress.label || 'Home'}
              </span>
            </div>

            <div className="text-[9px] font-bold text-gray-500 uppercase leading-relaxed border-t border-gray-50 pt-3 space-y-1 text-left animate-fade-in">
              <p>{order.shippingAddress.streetAddress}, {order.shippingAddress.area}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.district}</p>
              <p className="text-orange-600 font-black italic">Landmark: {order.shippingAddress.landmark || 'Nearby Main Point'}</p>
            </div>

            <div className="flex gap-2 pt-1">
              <button 
                onClick={() => window.open(`tel:${order.shippingAddress.phone || '9800000000'}`, '_self')} 
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-md shadow-blue-100"
              >
                <Phone size={14} /> Contact Call
              </button>
              <button 
                onClick={() => {
                  const prefilledMsg = encodeURIComponent(`Hi ${order.shippingAddress.fullName || 'there'}, your NexaMart delivery hero is on the way with your order #${order.orderId.slice(-8)}. See you shortly!`);
                  window.open(`https://wa.me/9779812345678?text=${prefilledMsg}`, '_blank');
                }} 
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl py-3 text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-md shadow-green-100"
              >
                <MessageSquare size={14} /> Send WhatsApp
              </button>
            </div>
          </div>

          {/* Mission Handover Module (Reveal when arrived or optionally at any time) */}
          <div className="border-t border-gray-100 pt-6 space-y-4">
            <div className="text-center">
              <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest text-center">Conclude Cargo Cycle</p>
              <h4 className="text-[10px] font-black text-gray-900 uppercase mt-0.5 text-center">Mission Settlement Validation</h4>
            </div>

            {/* Photo verification uploads */}
            {deliveryPhotos.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {deliveryPhotos.map((photo, idx) => (
                  <div key={idx} className="relative group">
                    <img src={photo} className="w-full aspect-square object-cover rounded-xl border border-gray-100" />
                    <button 
                      onClick={() => removePhoto(idx)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity animate-fade-in"
                    >
                      <RotateCcw size={10} className="rotate-45" />
                    </button>
                  </div>
                ))}
                <label 
                  htmlFor={`proof-cockpit-${order.orderId}`}
                  className="w-full aspect-square rounded-xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-100 cursor-pointer"
                >
                  <Camera size={20} />
                </label>
              </div>
            )}

            <div className="relative">
              <input 
                type="file" 
                id={`proof-cockpit-${order.orderId}`}
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleProofUpload}
              />
              {deliveryPhotos.length === 0 ? (
                <label 
                  htmlFor={`proof-cockpit-${order.orderId}`}
                  className={cn(
                    "w-full bg-orange-600 text-white py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-orange-100 active:scale-95 flex items-center justify-center gap-2 cursor-pointer",
                    updating && "opacity-50 pointer-events-none"
                  )}
                >
                  {updating ? <Loader2 className="animate-spin" size={20} /> : <><Camera size={16} /> Take Doorstep Photo Proof</>}
                </label>
              ) : (
                <button 
                  onClick={() => setShowSignature(true)}
                  className="w-full bg-green-600 text-white py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-green-100 active:scale-95 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} /> Digital Signature sign-off
                </button>
              )}
            </div>

            {/* Back to logistics base option */}
            <button
              onClick={() => handleUpdateStatus('picked')}
              className="w-full py-2.5 text-[7px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 text-center"
            >
              ← Pause Run & Back to Orders
            </button>
          </div>
        </div>

        {/* Cancellation Modals and overlay panels */}
        <AnimatePresence>
          {showSignature && (
            <SignaturePad 
              onCancel={() => setShowSignature(false)}
              onSave={(signature) => handleUpdateStatus('delivered', { 
                deliveryPhotos: deliveryPhotos, 
                signatureProof: signature 
              })} 
            />
          )}

          {showCancelModal && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4"
            >
               <motion.div 
                 initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
                 className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 space-y-6 max-h-[90vh] overflow-y-auto text-center"
               >
                  <div className="text-center space-y-2">
                     <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center mx-auto text-red-600 mb-4"><AlertCircle size={32} /></div>
                     <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter text-center">Mission Abortion</h3>
                     <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">State the reason & provide proof</p>
                  </div>

                  <div className="space-y-3">
                     {['Customer unavailable', 'Wrong address', 'Customer rejected', 'Phone unreachable', 'Area issue', 'Other'].map(reason => (
                       <button 
                         key={reason}
                         onClick={() => setCancelReason(reason)}
                         className={cn(
                           "w-full py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all text-left flex items-center justify-between",
                           cancelReason === reason ? "bg-red-600 text-white border-red-500 shadow-lg shadow-red-100" : "bg-gray-50 text-gray-400 border-gray-100"
                         )}
                       >
                         {reason}
                         {cancelReason === reason && <CheckCircle2 size={16} />}
                       </button>
                     ))}
                  </div>

                  <div className="space-y-2 text-left">
                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1 text-left">Mandatory Photo Proof</p>
                     <div className="relative">
                        <input 
                          type="file" 
                          id={`cancel-proof-${order.orderId}`}
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => handleProofUpload(e, 'cancel')}
                        />
                        <label 
                          htmlFor={`cancel-proof-${order.orderId}`}
                          className={cn(
                            "w-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all",
                            cancellationProofImage ? "border-green-500 bg-green-50" : "hover:bg-gray-100"
                          )}
                        >
                           {cancellationProofImage ? (
                             <img src={cancellationProofImage} className="w-20 h-20 object-cover rounded-xl" />
                           ) : (
                             <Camera size={24} className="text-gray-300" />
                           )}
                           <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                             {cancellationProofImage ? 'Proof Captured' : 'Upload Proof Image'}
                           </span>
                        </label>
                     </div>
                  </div>

                  <div className="flex gap-3 pt-4 justify-center">
                     <button 
                       onClick={() => setShowCancelModal(false)}
                       className="flex-1 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center"
                     >
                       Back
                     </button>
                     <button 
                       disabled={!cancelReason || !cancellationProofImage || updating}
                       onClick={() => handleUpdateStatus('cancelled', { 
                         cancellationReason: cancelReason,
                         cancellationProof: cancellationProofImage
                       })}
                       className="flex-1 bg-gray-900 text-white rounded-2xl py-4 text-[10px] font-black uppercase tracking-widest shadow-xl disabled:opacity-50 text-center"
                     >
                       Confirm Abort
                     </button>
                  </div>
               </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return (
    <motion.div 
      layout
      className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden"
    >
      <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
         <div>
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Protocol ID</p>
            <p className="text-xs font-black text-gray-900 tracking-tight">#{order.orderId.slice(-8)}</p>
         </div>
         <div className="flex gap-2">
            <span className={cn(
              "text-[8px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest border",
              order.deliveryStatus === 'assigned' ? "bg-blue-50 text-blue-600 border-blue-100" :
              order.deliveryStatus === 'accepted' ? "bg-[#003B73] text-white border-[#003B73]" :
              order.deliveryStatus === 'picked' ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
              "bg-orange-50 text-orange-600 border-orange-100"
            )}>
              {order.deliveryStatus?.replace('_', ' ')}
            </span>
            {distance !== null && (
              <span className="text-[8px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest bg-gray-900 text-white border border-gray-900 flex items-center gap-1">
                <Navigation size={10} /> {distance} KM Away
              </span>
            )}
         </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Destination */}
        <div className="flex gap-4">
           <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm"><MapPin size={16} /></div>
              <div className="w-0.5 flex-1 bg-dashed border-l border-gray-200" />
              <div className="w-2 h-2 rounded-full bg-gray-200" />
           </div>
           <div className="flex-1 space-y-4">
              <div>
                 <div className="flex items-center gap-2 mb-1">
                    <p className="text-[10px] font-black text-gray-900 uppercase">
                       {order.shippingAddress.label || 'Home'} Delivery
                    </p>
                    <div className="w-1 h-1 bg-gray-300 rounded-full" />
                    <p className="text-[10px] font-black text-blue-600 uppercase">
                       {order.country}
                    </p>
                 </div>
                 <p className="text-[9px] font-bold text-gray-500 uppercase leading-snug">
                    {order.shippingAddress.streetAddress}
                    {order.shippingAddress.area && `, ${order.shippingAddress.area}`}
                    {order.shippingAddress.ward && `, Ward ${order.shippingAddress.ward}`}
                    <br />
                    {order.shippingAddress.city} {order.shippingAddress.municipality && `(${order.shippingAddress.municipality})`}
                    <br />
                    {order.shippingAddress.district}, {order.shippingAddress.state}
                    <br />
                    {order.shippingAddress.pinCode ? `Postal Code: ${order.shippingAddress.pinCode}` : ''}
                    <br />
                    <span className="text-orange-600 font-black italic">Landmark: {order.shippingAddress.landmark || 'Nearby Main Point'}</span>
                 </p>
              </div>

              <div className="flex gap-2">
                 <button onClick={() => window.open(`tel:${order.shippingAddress.phone || '9800000000'}`, '_self')} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl py-3 text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all">
                    <Phone size={14} /> Call
                 </button>
                 <button 
                    onClick={() => setShowInAppMap(!showInAppMap)} 
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all",
                      showInAppMap ? "bg-orange-600 text-white" : "bg-indigo-600 text-white"
                    )}
                 >
                    <Navigation size={14} /> {showInAppMap ? 'Hide Route' : 'Route (Map)'}
                 </button>
                 <button onClick={openWhatsApp} className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white rounded-xl py-3 text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all">
                    <MessageSquare size={14} /> WhatsApp
                 </button>
              </div>
           </div>
        </div>

        {/* Cargo Manifest Map */}
        {showInAppMap && currentGPS && order.shippingAddress.latitude && (
          <div className="mx-6 mb-6 aspect-[16/10] rounded-[2rem] overflow-hidden border border-gray-100 shadow-inner relative h-[280px] z-10">
             <FreeDeliveryNavMap
                startLat={currentGPS.latitude}
                startLng={currentGPS.longitude}
                endLat={Number(order.shippingAddress.latitude)}
                endLng={Number(order.shippingAddress.longitude)}
                riderProgress={0}
             />
             <button 
               onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&origin=${currentGPS.latitude},${currentGPS.longitude}&destination=${order.shippingAddress.latitude},${order.shippingAddress.longitude}`, '_blank')}
               className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-lg border border-gray-150 text-[8px] font-black uppercase tracking-widest flex items-center gap-2 cursor-pointer hover:bg-gray-100"
             >
                <Navigation size={12} className="text-blue-600 animate-pulse" /> Launch Navigation Guide
             </button>
          </div>
        )}
        <div className="bg-gray-50/50 rounded-2xl p-4 space-y-3">
           <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Cargo Manifest</p>
           {order.items.map((item, idx) => (
             <div key={idx} className="flex items-center gap-3">
                <img src={item.image} className="w-8 h-8 rounded-lg object-cover" alt="" />
                <div className="flex-1">
                   <p className="text-[9px] font-black text-gray-900 uppercase truncate">{item.name}</p>
                   <p className="text-[8px] font-bold text-gray-400 uppercase">Qty: {item.quantity} • Rs. {item.price}</p>
                </div>
                <p className="text-[9px] font-black text-gray-900">Rs. {item.price * item.quantity}</p>
             </div>
           ))}
           <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
              <p className="text-[8px] font-black text-gray-400 uppercase">Total Amount</p>
              <p className="text-[10px] font-black text-gray-900">Rs. {order.totalAmount.toLocaleString()}</p>
           </div>
        </div>

        {/* Settlement Status */}
        <div className={cn(
          "rounded-2xl p-4 flex items-center justify-between border",
          order.paymentStatus === 'paid' ? "bg-green-50 border-green-100" : "bg-orange-50 border-orange-100"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
              order.paymentStatus === 'paid' ? "bg-white text-green-600" : "bg-white text-orange-600"
            )}>
              <CreditCard size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-900 uppercase">
                {order.paymentStatus === 'paid' ? 'Paid (Online)' : 'Collection Required'}
              </p>
              <p className={cn(
                "text-[9px] font-bold uppercase",
                order.paymentStatus === 'paid' ? "text-green-600" : "text-orange-600"
              )}>
                {order.paymentStatus === 'paid' ? 'No Cash Handling' : `Collect Rs. ${order.totalAmount.toLocaleString()}`}
              </p>
            </div>
          </div>
          {order.paymentStatus === 'unpaid' && (
            <div className="px-2 py-1 bg-white rounded-lg border border-orange-200 text-[8px] font-black text-orange-600 uppercase">COD</div>
          )}
        </div>

        {/* Phase Controls */}
        <div className="space-y-4">
           {order.deliveryStatus === 'assigned' && (
             <div className="grid grid-cols-2 gap-3">
                <button 
                  disabled={updating}
                  onClick={() => handleUpdateStatus('accepted')}
                  className="bg-green-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-100 active:scale-95"
                >
                  Accept Mission
                </button>
                <button 
                  disabled={updating}
                  onClick={() => setShowCancelModal(true)}
                  className="bg-red-50 text-red-600 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-100 active:scale-95"
                >
                  Reject
                </button>
             </div>
           )}

           {order.deliveryStatus === 'accepted' && (
             <button 
               disabled={updating}
               onClick={() => handleUpdateStatus('picked')}
               className="w-full bg-indigo-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-95 flex items-center justify-center gap-2"
             >
               <Package size={18} /> Confirm Pick Up
             </button>
           )}

           {order.deliveryStatus === 'picked' && (
             <button 
               disabled={updating}
               onClick={() => handleUpdateStatus('out_for_delivery')}
               className="w-full bg-purple-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-100 active:scale-95 flex items-center justify-center gap-2"
             >
               <Truck size={18} /> Start Delivery Run
             </button>
           )}

           {(order.deliveryStatus as any) === 'out_for_delivery' && (
             <div className="space-y-4">
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-600 shadow-sm"><CreditCard size={20} /></div>
                      <div>
                        <p className="text-[10px] font-black text-gray-950 uppercase">Collection Required</p>
                        <p className="text-[9px] font-bold text-orange-600 uppercase">Rs. {order.paymentStatus === 'paid' ? '0 (PAID)' : order.totalAmount.toLocaleString()}</p>
                      </div>
                   </div>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3.5 space-y-1.5 text-left mb-2">
                   <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Required Delivery Proof Checklist</p>
                   <ul className="text-[7.5px] font-extrabold text-gray-400 uppercase tracking-wide list-disc pl-3.5 space-y-1">
                      <li className={cn(deliveryPhotos.length > 0 ? "text-green-600 line-through" : "text-gray-400")}>Snap 1: Secure package doorstep photo</li>
                      <li className={cn(deliveryPhotos.length > 1 ? "text-green-600 line-through" : "text-gray-400")}>Snap 2: Contact customer handover photo</li>
                      <li className="text-gray-400">Sign-off: Handdrawn digital signature</li>
                   </ul>
                </div>

                {deliveryPhotos.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {deliveryPhotos.map((photo, idx) => (
                      <div key={idx} className="relative group">
                        <img src={photo} className="w-full aspect-square object-cover rounded-xl border border-gray-100" />
                        <button 
                          onClick={() => removePhoto(idx)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <RotateCcw size={10} className="rotate-45" />
                        </button>
                      </div>
                    ))}
                    <label 
                      htmlFor={`proof-${order.orderId}`}
                      className="w-full aspect-square rounded-xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-100 cursor-pointer"
                    >
                      <Camera size={20} />
                    </label>
                  </div>
                )}

                <div className="relative">
                  <input 
                    type="file" 
                    id={`proof-${order.orderId}`}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleProofUpload}
                  />
                  {deliveryPhotos.length === 0 ? (
                    <label 
                      htmlFor={`proof-${order.orderId}`}
                      className={cn(
                        "w-full bg-green-600 text-white py-5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-green-100 active:scale-95 flex items-center justify-center gap-2 cursor-pointer",
                        updating && "opacity-50 pointer-events-none"
                      )}
                    >
                      {updating ? <Loader2 className="animate-spin" size={20} /> : <><Camera size={20} /> Deploy Delivery Proof</>}
                    </label>
                  ) : (
                    <button 
                      onClick={() => setShowSignature(true)}
                      className="w-full bg-green-600 text-white py-5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-green-100 active:scale-95 flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={20} /> Finalize Mission
                    </button>
                  )}
                </div>
             </div>
           )}

           {order.deliveryStatus !== 'assigned' && order.deliveryStatus !== 'delivered' && (
             <button 
               onClick={() => setShowCancelModal(true)}
               className="w-full py-3 text-[8px] font-black text-red-400 uppercase tracking-widest hover:text-red-600"
             >
               Abort Mission
             </button>
           )}
        </div>
      </div>

        {/* Cancellation Modal */}
        <AnimatePresence>
          {showSignature && (
            <SignaturePad 
              onCancel={() => setShowSignature(false)}
              onSave={(signature) => handleUpdateStatus('delivered', { 
                deliveryPhotos: deliveryPhotos, 
                signatureProof: signature 
              })} 
            />
          )}

          {showCancelModal && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4"
            >
               <motion.div 
                 initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
                 className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 space-y-6 max-h-[90vh] overflow-y-auto"
               >
                  <div className="text-center space-y-2">
                     <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center mx-auto text-red-600 mb-4"><AlertCircle size={32} /></div>
                     <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Mission Abortion</h3>
                     <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">State the reason & provide proof</p>
                  </div>

                  <div className="space-y-3">
                     {['Customer unavailable', 'Wrong address', 'Customer rejected', 'Phone unreachable', 'Area issue', 'Other'].map(reason => (
                       <button 
                         key={reason}
                         onClick={() => setCancelReason(reason)}
                         className={cn(
                           "w-full py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all text-left flex items-center justify-between",
                           cancelReason === reason ? "bg-red-600 text-white border-red-500 shadow-lg shadow-red-100" : "bg-gray-50 text-gray-400 border-gray-100"
                         )}
                       >
                         {reason}
                         {cancelReason === reason && <CheckCircle2 size={16} />}
                       </button>
                     ))}
                  </div>

                  <div className="space-y-2">
                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Mandatory Photo Proof</p>
                     <div className="relative">
                        <input 
                          type="file" 
                          id={`cancel-proof-${order.orderId}`}
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => handleProofUpload(e, 'cancel')}
                        />
                        <label 
                          htmlFor={`cancel-proof-${order.orderId}`}
                          className={cn(
                            "w-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all",
                            cancellationProofImage ? "border-green-500 bg-green-50" : "hover:bg-gray-100"
                          )}
                        >
                           {cancellationProofImage ? (
                             <img src={cancellationProofImage} className="w-20 h-20 object-cover rounded-xl" />
                           ) : (
                             <Camera size={24} className="text-gray-300" />
                           )}
                           <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                             {cancellationProofImage ? 'Proof Captured' : 'Upload Proof Image'}
                           </span>
                        </label>
                     </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                     <button 
                       onClick={() => setShowCancelModal(false)}
                       className="flex-1 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest"
                     >
                       Back
                     </button>
                     <button 
                       disabled={!cancelReason || !cancellationProofImage || updating}
                       onClick={() => handleUpdateStatus('cancelled', { 
                         cancellationReason: cancelReason,
                         cancellationProof: cancellationProofImage
                       })}
                       className="flex-1 bg-gray-900 text-white rounded-2xl py-4 text-[10px] font-black uppercase tracking-widest shadow-xl disabled:opacity-50"
                     >
                       Confirm Abort
                     </button>
                  </div>
               </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
    </motion.div>
  );
}

function NavButton({ active, icon: Icon, label, onClick }: { active: boolean, icon: any, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 p-2 rounded-2xl transition-all",
        active ? "text-white bg-white/10 px-8 py-2" : "text-white/40 hover:text-white"
      )}
    >
      <Icon size={active ? 20 : 22} strokeWidth={active ? 2.5 : 2} />
      <span className={cn("text-[8px] font-black uppercase tracking-widest", active ? "block" : "hidden")}>{label}</span>
    </button>
  );
}

function RiderOnboarding({ userId }: { userId: string }) {
  const [formData, setFormData] = useState({
    vehicleType: 'Bike',
    vehiclePlate: '',
    licenseNumber: '',
    phone: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'riders', userId), {
        ...formData,
        userId,
        status: 'pending',
        isAvailable: false,
        rating: 5,
        totalDeliveries: 0,
        createdAt: new Date().toISOString()
      });
      // Optionally update user role to 'rider_pending' or similar if needed
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `riders/${userId}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 max-w-md mx-auto relative overflow-hidden">
        <div className="text-center mb-12 relative z-10">
          <div className="w-20 h-20 bg-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl rotate-12">
            <Truck className="text-white" size={40} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter mb-2 italic">NexaMart Logistics</h1>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Apply to join our fulfillment network</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-4 relative z-10">
           <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Vehicle Type</label>
              <select 
                className="w-full bg-gray-50 border border-gray-200 py-4 px-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all uppercase"
                value={formData.vehicleType}
                onChange={e => setFormData({...formData, vehicleType: e.target.value})}
              >
                 <option value="Bike">Two-Wheeler (Bike/Scooter)</option>
                 <option value="Electric">Electric Vehicle</option>
                 <option value="Cycle">Bicycle / Green Unit</option>
                 <option value="Van">Delivery Van</option>
              </select>
           </div>

           <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Vehicle Number Plate</label>
              <div className="relative">
                <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  required
                  placeholder="BA 1 PA 1234"
                  className="w-full bg-gray-50 border border-gray-200 py-4 pl-12 pr-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  value={formData.vehiclePlate}
                  onChange={e => setFormData({...formData, vehiclePlate: e.target.value})}
                />
              </div>
           </div>

           <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">License Number</label>
              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  required
                  placeholder="LIC-12345678"
                  className="w-full bg-gray-50 border border-gray-200 py-4 pl-12 pr-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  value={formData.licenseNumber}
                  onChange={e => setFormData({...formData, licenseNumber: e.target.value})}
                />
              </div>
           </div>

           <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Emergency Contact</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  required
                  placeholder="98XXXXXXXX"
                  className="w-full bg-gray-50 border border-gray-200 py-4 pl-12 pr-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
           </div>

           <button 
             type="submit"
             disabled={saving}
             className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 mt-4"
           >
             {saving ? 'Transmitting Data...' : 'Submit Application'}
           </button>
        </form>

        <div className="mt-12 text-[9px] text-gray-400 font-bold px-8 leading-relaxed text-center uppercase tracking-widest opacity-50">
          Security protocols active. Data strictly encrypted for NexaMart Logistics Network.
        </div>
    </div>
  );
}

function RiderPending({ status }: { status: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
        <div className={cn(
          "w-24 h-24 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl animate-bounce",
          status === 'pending' ? "bg-orange-600 shadow-orange-100" : "bg-red-600 shadow-red-100"
        )}>
          {status === 'pending' ? <ShieldCheck size={48} className="text-white" /> : <AlertCircle size={48} className="text-white" />}
        </div>
        
        <h2 className="text-2xl font-black text-gray-900 tracking-tighter mb-4 italic uppercase">
          {status === 'pending' ? 'Verification Ongoing' : 
           status === 'rejected' ? 'Application Rejected' : 
           'Account Suspended'}
        </h2>
        
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] leading-loose max-w-[240px]">
          {status === 'pending' ? 
            'The High Command is reviewing your credentials. You will be notified once clearance is granted.' :
            'Your access to the logistics network has been restricted. Contact NexaMart Command for details.'
          }
        </p>

        <button 
          onClick={() => auth.signOut()}
          className="mt-12 px-10 py-4 bg-white border-2 border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm"
        >
          Disconnect Terminal
        </button>
    </div>
  );
}
