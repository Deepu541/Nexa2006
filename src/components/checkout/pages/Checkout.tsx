import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, Receipt, CheckCircle2, ChevronRight, X, AlertTriangle, MapPin, ShieldCheck, Wallet, ArrowRight, Loader2, QrCode, Smartphone, Lock, Check, Camera } from 'lucide-react';
import { collection, serverTimestamp, getDocs, updateDoc, setDoc, doc, increment, writeBatch, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';
import { useCart } from '../../../context/CartContext';
import { useLanguage } from '../../../context/LanguageContext';
import GlobalAddressForm from '../GlobalAddressForm';
import { Address, SiteSettings } from '../../../types';
import { cn, scrubUndefined, compressImage } from '../../../utils';
import { NEPAL_LOCATIONS } from '../../../constants/locations';

export default function Checkout() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { items, total, clearCart } = useCart();
  const { t } = useLanguage();
  
  const [step, setStep] = useState(1); // 1 = Checkout screen, 3 = Success screen, 4 = Failed screen
  const [address, setAddress] = useState<Address | null>(
    profile?.addresses?.find(a => a.isDefault) || profile?.addresses?.[0] || null
  );
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [paymentOption, setPaymentOption] = useState<'COD' | 'ONLINE'>('COD');
  const [paymentMethod, setPaymentMethod] = useState<string>('COD');
  const [paymentTransactionId, setPaymentTransactionId] = useState<string>('');
  const [paymentSenderMobile, setPaymentSenderMobile] = useState<string>('');
  const [paymentProof, setPaymentProof] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState<boolean>(false);
  const [isOrdering, setIsOrdering] = useState(false);

  // Secure Online Payment Simulator States
  const [isSecureGatewayProcessing, setIsSecureGatewayProcessing] = useState(false);
  const [gatewayError, setGatewayError] = useState<string | null>(null);
  const [secureGatewayAccount, setSecureGatewayAccount] = useState('');
  const [simulatedStatusText, setSimulatedStatusText] = useState('');
  const [simulatedStatusStep, setSimulatedStatusStep] = useState(0);
  const [simulatedSuccessMode, setSimulatedSuccessMode] = useState(true);
  const [isInstantPayMode, setIsInstantPayMode] = useState(true); // Toggle between Instant Pay Simulation & Screenshot upload
  const [settings, setSettings] = useState<SiteSettings | null>(() => {
    try {
      const cached = localStorage.getItem('site-settings-main');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });
  const [deliveryBlockedError, setDeliveryBlockedError] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(!profile?.addresses?.length);
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);

  // Load Settings in real-time
  React.useEffect(() => {
    return onSnapshot(doc(db, 'settings', 'main'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as SiteSettings;
        setSettings(data);
        localStorage.setItem('site-settings-main', JSON.stringify(data));
      }
    });
  }, []);

  // Auto-select address when profile loads or updates
  React.useEffect(() => {
    if (profile?.addresses?.length) {
      if (!address) {
        const defaultAddr = profile.addresses.find(a => a.isDefault) || profile.addresses[0];
        setAddress(defaultAddr);
        setIsAddingNew(false);
      }
    } else {
      if (!profile) {
        // Still loading or unauthenticated
      } else if (!profile.addresses?.length) {
        setIsAddingNew(true);
      }
    }
  }, [profile, address]);

  // Sync / check serviceability
  React.useEffect(() => {
    if (!address) {
      setDeliveryBlockedError(null);
      return;
    }
    
    getDocs(collection(db, 'areas')).then(snap => {
      const registeredAreas = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      if (registeredAreas.length === 0) {
        // No areas registered - default to allow delivery to prevent total system lockout
        setDeliveryBlockedError(null);
        return;
      }

      const clientCountry = (address.country || '').toLowerCase().trim();
      const clientState = (address.state || (address as any).province || '').toLowerCase().trim();
      const clientDistrict = (address.district || '').toLowerCase().trim();
      const clientCity = (address.city || (address as any).municipality || '').toLowerCase().trim();
      const clientWard = ((address as any).ward || '').toLowerCase().trim();

      // Find matching areas configured in the database
      const matches = registeredAreas.filter(area => {
        const areaCountry = (area.country || '').toLowerCase().trim();
        const areaState = (area.state || '').toLowerCase().trim();
        const areaDistrict = (area.district || '').toLowerCase().trim();
        const areaCity = (area.city || area.municipality || '').toLowerCase().trim();
        const areaWard = (area.ward || '').toLowerCase().trim();

        const countryMatch = areaCountry === clientCountry;
        const stateMatch = !areaState || areaState === clientState;
        const districtMatch = !areaDistrict || areaDistrict === clientDistrict;
        const cityMatch = !areaCity || areaCity === clientCity;
        const wardMatch = !areaWard || areaWard === clientWard;

        return countryMatch && stateMatch && districtMatch && cityMatch && wardMatch;
      });

      if (matches.length > 0) {
        const hasBlockedMatch = matches.some(m => m.status === 'Disabled');
        const hasEnabledMatch = matches.some(m => m.status === 'Enabled');

        if (hasBlockedMatch) {
          setDeliveryBlockedError("Delivery not available in your area");
        } else if (hasEnabledMatch) {
          setDeliveryBlockedError(null);
        } else {
          setDeliveryBlockedError("Delivery not available in your area");
        }
      } else {
        setDeliveryBlockedError("Delivery not available in your area");
      }
    }).catch(err => {
      console.error("Failed to fetch areas for serviceability check:", err);
      // Fallback gracefully on query failures
      setDeliveryBlockedError(null);
    });
  }, [address]);

  const deliveryInfo = settings && address ? (() => {
    const country = address.country;
    const countryConfig = settings.countrySettings?.[country];
    let baseFee = countryConfig?.baseDeliveryFee ?? settings.deliveryFee ?? 100;
    const threshold = countryConfig?.freeDeliveryThreshold ?? settings.minOrderForFreeDelivery ?? 5000;
    const handling = countryConfig?.handlingFee ?? 0;
    if (settings.locationWiseFees?.[country]?.[address.state]?.[address.district]) {
      baseFee = settings.locationWiseFees[country][address.state][address.district];
    }
    const isFree = total >= threshold;
    return { fee: isFree ? 0 : baseFee, free: isFree, handling };
  })() : { fee: 100, free: false, handling: 0 };

  const grandTotal = total + (deliveryInfo?.fee || 0) + (deliveryInfo?.handling || 0);

  const finalCountry = address?.country || profile?.country || 'Nepal';

  // Strictly synchronizing paymentMethod to Cash On Delivery (COD)
  React.useEffect(() => {
    setPaymentOption('COD');
    setPaymentMethod('COD');
  }, [paymentOption]);

  const allowedMethods = React.useMemo(() => ['COD'], []);

  const handleSaveAddress = async (newAddress: Address) => {
    setAddress(newAddress);
    setIsAddingNew(false);
    if (profile) {
      try {
        const userRef = doc(db, 'users', profile.userId);
        const existingAddresses = profile.addresses || [];
        const addressExists = existingAddresses.some(a => 
          a.latitude === newAddress.latitude && 
          a.longitude === newAddress.longitude
        );

        if (!addressExists) {
          const cleanNewAddress = scrubUndefined(newAddress);
          const cleanExisting = scrubUndefined(existingAddresses);
          await setDoc(userRef, {
            addresses: [cleanNewAddress, ...cleanExisting].slice(0, 5)
          }, { merge: true });
        }
      } catch (err) {
        console.error("Failed to sync address to profile:", err);
      }
    }
  };

  // GPS Geolocation Hook for Current Location Auto Detect
  const autoDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // OpenStreetMap Reverse Geocoding Lookup
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=en`
          );
          if (response.ok) {
            const data = await response.json();
            const addr = data.address || {};
            const country = (addr.country === 'India' || addr.country_code === 'in') ? 'India' : 'Nepal';
            const road = addr.road || addr.suburb || 'Auto-Detected Area';
            const pinCode = addr.postcode || '';

            let finalState = addr.state || 'Bagmati Province';
            let finalDistrict = addr.county || addr.district || 'Kathmandu';
            let finalCity = addr.city || addr.town || addr.village || addr.suburb || 'Kathmandu';

            if (country === 'Nepal') {
              const cleanDistrict = finalDistrict.replace(/District|Zone|Development Region/gi, "").trim();
              const cleanCity = finalCity.replace(/Municipality|Sub-Metropolitan|Metropolitan|Sub-Metro|Metro/gi, "").trim();

              let matchedDistrict = "";
              let matchedProvince = "";

              for (const prov of NEPAL_LOCATIONS.provinces) {
                const dMatch = prov.districts.find(d => 
                  d.toLowerCase() === cleanDistrict.toLowerCase() || 
                  d.toLowerCase().includes(cleanDistrict.toLowerCase()) ||
                  cleanDistrict.toLowerCase().includes(d.toLowerCase())
                );
                if (dMatch) {
                  matchedDistrict = dMatch;
                  matchedProvince = prov.name;
                  break;
                }
              }

              if (!matchedDistrict && cleanCity) {
                for (const prov of NEPAL_LOCATIONS.provinces) {
                  const dMatch = prov.districts.find(d => 
                    d.toLowerCase() === cleanCity.toLowerCase() || 
                    cleanCity.toLowerCase().includes(d.toLowerCase())
                  );
                  if (dMatch) {
                    matchedDistrict = dMatch;
                    matchedProvince = prov.name;
                    break;
                  }
                }
              }

              if (!matchedDistrict) {
                matchedDistrict = "Kathmandu";
                matchedProvince = "Bagmati Province";
              }

              const standardMuniList = (NEPAL_LOCATIONS.municipalities as any)[matchedDistrict] || [];
              let matchedCity = finalCity;

              if (standardMuniList.length > 0) {
                const matchedMuni = standardMuniList.find((m: string) => 
                  m.toLowerCase().includes(cleanCity.toLowerCase()) || 
                  cleanCity.toLowerCase().includes(m.toLowerCase())
                );
                if (matchedMuni) {
                  matchedCity = matchedMuni;
                } else {
                  matchedCity = standardMuniList[0];
                }
              } else {
                matchedCity = finalCity || matchedDistrict;
              }

              finalState = matchedProvince;
              finalDistrict = matchedDistrict;
              finalCity = matchedCity;
            }

            const detectedAddress: Address = {
              id: 'detected-' + Date.now(),
              fullName: profile?.fullName || '',
              phone: profile?.phone || '',
              country: country as 'Nepal' | 'India',
              state: finalState,
              district: finalDistrict,
              city: finalCity,
              streetAddress: road,
              pinCode: pinCode,
              latitude: latitude,
              longitude: longitude,
              isDefault: true,
              label: 'Home'
            };
            setAddress(detectedAddress);
            setIsAddingNew(false);
          } else {
            throw new Error("Unable to parse spatial results");
          }
        } catch (e) {
          console.warn("Nominatim reverse lookup error. Using coordinate fallback:", e);
          const fallbackAddress: Address = {
            id: 'coords-' + Date.now(),
            fullName: profile?.fullName || '',
            phone: profile?.phone || '',
            country: 'Nepal',
            state: 'Bagmati Province',
            district: 'Kathmandu',
            city: 'Kathmandu',
            streetAddress: `GPS Spot (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`,
            latitude,
            longitude,
            isDefault: true,
            label: 'Home'
          };
          setAddress(fallbackAddress);
          setIsAddingNew(false);
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        console.error("GPS error:", error);
        alert(`Could not automatically detect spatial location: ${error.message}`);
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const handleDownloadQR = async (url: string, name: string) => {
    try {
      if (!url) return;
      if (url.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = url;
        link.download = `${name}_QR.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${name}_QR.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(url, '_blank');
    }
  };

  const handleScreenshotChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingProof(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          const compressed = await compressImage(base64, 1000, 1000, 0.7);
          setPaymentProof(compressed);
        } catch (compressErr) {
          console.error("Compression failed, using fallback:", compressErr);
          setPaymentProof(base64);
        } finally {
          setUploadingProof(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Image load failed:", err);
      alert("Failed to load screenshot image.");
      setUploadingProof(false);
    }
  };

  const triggerOnlinePaymentSimulation = async (gatewayAccount: string) => {
    if (!gatewayAccount.trim()) {
      alert(`Please enter your valid ${paymentMethod} Credentials or ID to authorize payment.`);
      return;
    }

    setIsSecureGatewayProcessing(true);
    setGatewayError(null);
    setSimulatedStatusStep(0);
    setSimulatedStatusText("🔐 Establishing dual-socket secure tunnel...");

    const steps = [
      { text: "🔐 Establishing dual-socket secure tunnel...", step: 0 },
      { text: `📡 Accessing secure API gateway: https://api.${paymentMethod.toLowerCase()}.com/v2/secure-token...`, step: 1 },
      { text: `⚡ Querying transaction consensus from ${paymentMethod} ledger node...`, step: 2 },
      { text: "🛰️ Finalizing instant cryptographic settlement signature...", step: 3 }
    ];

    let currentStep = 0;
    const interval = setInterval(async () => {
      currentStep++;
      if (currentStep < steps.length) {
        setSimulatedStatusStep(currentStep);
        setSimulatedStatusText(steps[currentStep].text);
      } else {
        clearInterval(interval);
        if (simulatedSuccessMode) {
          await completeSimulatedOnlineOrder(gatewayAccount);
        } else {
          await failSimulatedOnlineOrder();
        }
      }
    }, 950);
  };

  const completeSimulatedOnlineOrder = async (gatewayAccount: string) => {
    setIsOrdering(true);
    try {
      const batch = writeBatch(db);
      
      // Reduce Stock
      for (const item of items) {
        const productRef = doc(db, 'products', item.productId);
        batch.update(productRef, {
          stock: increment(-item.quantity)
        });
      }

      // Generate Order Record Directly
      const orderId = `NPM-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
      const txnId = `TXN-${paymentMethod.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`;
      
      const orderData = {
        orderId,
        customerId: profile?.userId || 'guest-user',
        items,
        vendorIds: Array.from(new Set(items.map(item => item.vendorId))),
        totalAmount: grandTotal,
        deliveryFee: deliveryInfo.fee,
        handlingFee: deliveryInfo.handling,
        country: address?.country || 'Nepal',
        status: 'confirmed', // Auto-confirmed after successful payment!
        shippingAddress: scrubUndefined(address),
        paymentMethod: paymentMethod,
        paymentStatus: 'paid', // Marked paid instantly!
        paymentProof: null,
        paymentTransactionId: txnId,
        paymentSenderMobile: gatewayAccount,
        deliveryStatus: 'assigned', // Sent instant rider notification!
        
        customerFullName: address?.fullName || 'NexaMart Shopper',
        customerPhone: address?.phone || '',
        customerDeliveryAddress: `${address?.streetAddress}${address?.area ? `, ${address.area}` : ''}, ${address?.city}, ${address?.district}, ${address?.state}, ${address?.country}`,
        customerLocation: address?.latitude && address?.longitude ? {
          latitude: address.latitude,
          longitude: address.longitude
        } : null,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const orderRef = doc(db, 'orders', orderId);
      batch.set(orderRef, orderData);

      // Create Payment Ledger entry for Admin Dashboard
      const paymentRef = doc(db, 'payments', txnId);
      const paymentData = {
        id: txnId,
        paymentId: txnId,
        orderId: orderId,
        customerName: address?.fullName || 'N/A',
        customerEmail: profile?.email || 'shopper@nexamart.com',
        customerPhone: address?.phone || '',
        paymentMethod: paymentMethod,
        currency: finalCountry === 'India' ? 'INR' : 'NPR',
        amount: grandTotal,
        paymentStatus: 'success', // Success status!
        transactionId: txnId,
        senderAccount: gatewayAccount,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      batch.set(paymentRef, paymentData);

      await batch.commit();

      setConfirmedOrder({ ...orderData, id: orderId });
      clearCart();
      setIsSecureGatewayProcessing(false);
      setStep(3); // Standard Checkout Success Page
    } catch (err) {
      console.error("Simulation database commit error:", err);
      alert("Failed to commit order. Please retry simulation.");
    } finally {
      setIsOrdering(false);
    }
  };

  const failSimulatedOnlineOrder = async () => {
    setIsOrdering(true);
    try {
      const orderId = `NPM-FAIL-${Date.now().toString().slice(-4)}`;
      const txnId = `TXN-FAIL-${Date.now().toString().slice(-4)}`;
      
      setConfirmedOrder({
        orderId,
        totalAmount: grandTotal,
        paymentMethod,
        createdAt: new Date().toISOString()
      });

      // Write failed transaction to database
      const paymentRef = doc(db, 'payments', txnId);
      const paymentData = {
        id: txnId,
        paymentId: txnId,
        orderId: orderId,
        customerName: address?.fullName || 'N/A',
        customerEmail: profile?.email || 'shopper@nexamart.com',
        customerPhone: address?.phone || '',
        paymentMethod: paymentMethod,
        currency: finalCountry === 'India' ? 'INR' : 'NPR',
        amount: grandTotal,
        paymentStatus: 'failed', // Failed!
        transactionId: 'VIRTUAL-GATEWAY-REJECT',
        errorDescription: "SIMULATED-GATEWAY-DECLINE: Insufficient funds in consumer wallet.",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(paymentRef, paymentData);

      setIsSecureGatewayProcessing(false);
      setGatewayError("SIMULATED-GATEWAY-DECLINE: Transaction rejected by sandboxed clearinghouse. Insufficient funds in consumer account (Error Code: ERR-GATEWAY-INSUFFICIENT-FUNDS).");
      setStep(4); // Display detailed Payment Failed Page
    } catch (err) {
      console.error("Failed simulator write:", err);
      setIsSecureGatewayProcessing(false);
      setStep(4);
    } finally {
      setIsOrdering(float => false);
    }
  };

  const handlePlaceOrder = async () => {
    if (isAddingNew || !address) {
      alert("Please enter and save your delivery details (Name, Phone Number, and Address) before placing the order.");
      return;
    }
    if (!address.fullName || !address.phone || !address.streetAddress) {
      alert("Name, Phone Number, and Delivery Address are required to place your order.");
      return;
    }
    if (deliveryBlockedError) {
      alert(`Cannot proceed with order placement: ${deliveryBlockedError}`);
      return;
    }

    setIsOrdering(true);
    
    try {
      const batch = writeBatch(db);
      
      // Reduce Stock
      for (const item of items) {
        const productRef = doc(db, 'products', item.productId);
        batch.update(productRef, {
          stock: increment(-item.quantity)
        });
      }

      // Generate Order Record Directly
      const orderId = `NPM-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
      const orderData = {
        orderId,
        customerId: profile?.userId || 'guest-user',
        items,
        vendorIds: Array.from(new Set(items.map(item => item.vendorId))),
        totalAmount: grandTotal,
        deliveryFee: deliveryInfo.fee,
        handlingFee: deliveryInfo.handling,
        country: address.country || 'Nepal',
        status: 'pending',
        shippingAddress: scrubUndefined(address),
        paymentMethod: 'COD',
        paymentStatus: 'unpaid',
        paymentProof: null,
        paymentTransactionId: '',
        paymentSenderMobile: '',
        
        customerFullName: address.fullName,
        customerPhone: address.phone,
        customerDeliveryAddress: `${address.streetAddress}${address.area ? `, ${address.area}` : ''}, ${address.city}, ${address.district}, ${address.state}, ${address.country}`,
        customerLocation: address.latitude && address.longitude ? {
          latitude: address.latitude,
          longitude: address.longitude
        } : null,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const orderRef = doc(db, 'orders', orderId);
      batch.set(orderRef, orderData);

      await batch.commit();
      
      setConfirmedOrder({ ...orderData, id: orderId });
      clearCart();
      setStep(3); // Go to direct success screen
    } catch (err) {
      console.error("Direct order submission failed:", err);
      alert("Could not place your order. Please try again.");
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full max-w-xl mx-auto bg-gray-50/50 pb-20 p-2">
      <div className="p-4">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="text-center py-4">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Checkout</h1>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Secure Checkout Page</p>
              </div>

              {/* 1. PRODUCT DETAILS */}
              <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Selected Products</p>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.productId} className="flex gap-4 items-center border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                      <img 
                        src={item.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff'} 
                        className="w-16 h-16 rounded-2xl object-cover shadow-sm border border-gray-50 shrink-0 animate-fade-in" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-gray-805 truncate uppercase tracking-tight">{item.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Qty: {item.quantity} × Rs.{item.price}</p>
                      </div>
                      <span className="text-sm font-black text-gray-950 shrink-0">Rs. {item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. SHIPPING ADDRESS */}
              <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Delivery Address</p>
                  <button 
                    type="button"
                    onClick={() => setIsAddingNew(prev => !prev)} 
                    className="text-[10px] font-black text-orange-600 uppercase tracking-widest px-3 py-1 bg-orange-50 rounded-lg border border-orange-100"
                  >
                    {isAddingNew ? 'Hide Form' : 'Add / Change Details'}
                  </button>
                </div>

                {/* GPS Current Location Auto Detect Button */}
                <button
                  type="button"
                  onClick={autoDetectLocation}
                  disabled={isDetectingLocation}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-50 to-orange-100/30 text-orange-650 font-black tracking-wider text-[11px] uppercase py-4 rounded-2xl border border-orange-100 active:scale-[0.98] transition-all"
                >
                  <MapPin size={16} className={cn("text-orange-600 shrink-0", isDetectingLocation && "animate-bounce")} />
                  {isDetectingLocation ? "Getting your location..." : "Use Current Location"}
                </button>

                {address && !isAddingNew ? (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2 text-left">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <span className="bg-gray-900 text-white text-[8px] font-black px-2.5 py-0.5 rounded uppercase tracking-widest">Selected Address</span>
                      <button
                        type="button"
                        onClick={() => setIsAddingNew(true)}
                        className="text-[9px] font-black text-orange-655 hover:bg-orange-100 px-2.5 py-1 rounded-lg border border-orange-150 transition-all select-none cursor-pointer"
                      >
                        ✏️ Change Address
                      </button>
                    </div>
                    <p className="text-xs text-gray-750 leading-relaxed font-bold uppercase mt-1">
                      {address.houseNumber ? `${address.houseNumber}, ` : ''}{address.streetAddress}{address.area ? `, ${address.area}` : ''}
                    </p>
                    <div className="flex justify-between items-end gap-2">
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                        {address.city}, {address.district}, {address.state} {address.country === 'Nepal' ? `Ward ${address.ward}` : address.pinCode}
                      </p>
                      <p className="font-bold text-[10px] text-gray-800 shrink-0">{address.fullName} ({address.phone})</p>
                    </div>
                  </div>
                ) : (
                  isAddingNew ? (
                    <div className="rounded-2xl border border-gray-100 overflow-hidden">
                      {profile?.addresses && profile.addresses.length > 0 && (
                        <div className="p-4 bg-gray-50 border-b border-gray-100 space-y-2">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Saved Addresses</p>
                          <div className="grid gap-2">
                            {profile.addresses.map((addr) => (
                              <button
                                key={addr.id}
                                type="button"
                                onClick={() => { setAddress(addr); setIsAddingNew(false); }}
                                className="w-full bg-white p-3 rounded-xl border border-gray-200 text-left text-xs font-bold hover:border-orange-500 transition-all flex justify-between items-center"
                              >
                                <span className="truncate max-w-[80%] uppercase text-[10px]">{addr.fullName} - {addr.streetAddress}, {addr.city}</span>
                                <ChevronRight size={14} className="text-gray-400" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="p-3 bg-white">
                        <GlobalAddressForm onSave={handleSaveAddress} />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      No delivery address selected. Click detection or enter details above.
                    </div>
                  )
                )}

                {deliveryBlockedError && (
                  <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-150 flex items-center gap-2 font-black uppercase text-[9px] tracking-wider animate-pulse">
                     <AlertTriangle size={18} className="text-red-500 shrink-0" />
                     <span>{deliveryBlockedError}</span>
                  </div>
                )}
              </div>

               {/* 3. PAYMENT OPTIONS */}
              <div id="payment-options-container" className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4 text-left">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Payment Method</p>
                  <p className="text-[8px] font-bold text-gray-400 uppercase px-1">Settle order with cash upon package arrival</p>
                </div>
                
                <div className="p-4 rounded-2xl border border-orange-500 bg-orange-50/10 ring-2 ring-orange-500/10 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0">
                    <Receipt size={20} />
                  </div>
                  <div>
                    <span className="font-black text-xs text-gray-950 block uppercase tracking-tight">Cash On Delivery (COD)</span>
                    <span className="text-[8px] font-semibold text-gray-500 uppercase tracking-wider block mt-0.5">Please pay with exact change to the rider at your doorstep.</span>
                  </div>
                </div>

                <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/70 text-left font-sans space-y-2">
                  <h5 className="text-[8.5px] font-black text-gray-400 uppercase tracking-widest">How COD Works:</h5>
                  <ol className="list-decimal list-inside text-[9.5px] leading-relaxed font-semibold text-gray-600 space-y-1">
                    <li>Submit order below to dispatch local courier.</li>
                    <li>Receive automated SMS updates & rider confirmation call.</li>
                    <li>Inspect package contents and hand cash payment to the courier.</li>
                  </ol>
                </div>
              </div>

              {/* 4. PLACE ORDER SECTION */}
              <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                <div className="flex justify-between items-baseline px-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Grand Total</span>
                  <span className="text-2xl font-black text-gray-900 tracking-tighter">Rs. {grandTotal}</span>
                </div>

                <button 
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={isOrdering || !!deliveryBlockedError || !address}
                  className={cn(
                    "w-full text-white font-black py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer relative overflow-hidden",
                    (isOrdering || !!deliveryBlockedError || !address)
                      ? "bg-gray-200 text-gray-400 shadow-none cursor-not-allowed pointer-events-none" 
                      : "bg-gray-900 hover:bg-orange-600 active:scale-95 shadow-orange-150"
                  )}
                >
                   {isOrdering && <Loader2 className="animate-spin text-white shrink-0" size={18} />}
                   <span className="uppercase tracking-[0.15em] text-[11px] font-black">
                     {isOrdering ? 'Placing Order...' : 'Place Order'}
                   </span>
                </button>
              </div>
            </motion.div>
          ) : step === 3 ? (
            // 5. SUCCESS MESSAGE WITH DETAILED INVOICE GENERATOR
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-6 space-y-6 max-w-md mx-auto"
            >
              <div className="relative text-center">
                 <div className="absolute inset-0 bg-green-400 blur-3xl opacity-25 animate-pulse rounded-full"></div>
                 <div className="relative w-16 h-16 bg-white rounded-full shadow-2xl flex items-center justify-center text-green-600 border border-green-50 mx-auto">
                    <CheckCircle2 size={36} strokeWidth={2.5} />
                 </div>
                 <div className="mt-4 space-y-1">
                    <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase">Order Confirmed Successfully</h2>
                    <p className="text-[9px] font-black text-green-600 uppercase tracking-[0.3em] font-mono">Invoice successfully compiled & verified</p>
                 </div>
              </div>

              {/* AUTOMATED INVOICE CARD */}
              <div id="invoice-receipt-card" className="w-full bg-white border border-gray-150 rounded-[2.5rem] shadow-2xl p-6 relative overflow-hidden font-sans space-y-4">
                {/* Visual Accent */}
                <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-orange-500 via-indigo-600 to-green-600"></div>
                
                <div className="flex justify-between items-center pb-3 border-b border-dashed border-gray-200">
                  <div className="space-y-0.5">
                    <span className="text-[12px] font-black tracking-tight text-gray-900 uppercase">NexaMart Ltd.</span>
                    <p className="text-[7.5px] font-black text-gray-400 uppercase tracking-widest leading-none">Pan-Regional Logistics</p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="text-[10px] font-mono font-black text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-lg">
                      {confirmedOrder?.orderId || 'NPM-50284'}
                    </span>
                    <p className="text-[7.5px] font-bold text-gray-400 uppercase tracking-tight">Invoice Receipt ID</p>
                  </div>
                </div>

                {/* Details list */}
                <div className="space-y-2.5 text-[10px]">
                  <div className="grid grid-cols-2">
                    <span className="font-bold text-gray-400 uppercase tracking-wide">Merchant Country:</span>
                    <span className="font-black text-gray-800 text-right uppercase tracking-wide">
                      {confirmedOrder?.country || finalCountry}
                    </span>
                  </div>

                  <div className="grid grid-cols-2">
                    <span className="font-bold text-gray-400 uppercase tracking-wide">Payment Status:</span>
                    <span className="font-black text-green-600 text-right uppercase tracking-widest flex items-center justify-end gap-1">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
                      {confirmedOrder?.paymentStatus === 'paid' ? 'SUCCESS / PAID' : 'VERIFICATION_PENDING'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2">
                    <span className="font-bold text-gray-400 uppercase tracking-wide">Payment Gateway:</span>
                    <span className="font-black text-indigo-700 text-right uppercase tracking-wide font-mono">
                      {confirmedOrder?.paymentMethod || paymentMethod}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 select-all">
                    <span className="font-bold text-gray-400 uppercase tracking-wide">Transaction Signature:</span>
                    <span className="font-mono text-[8px] text-gray-600 text-right font-black break-all uppercase">
                      {confirmedOrder?.paymentTransactionId || 'TXN-UNKNOWN'}
                    </span>
                  </div>

                  <div className="border-t border-gray-100 my-2 pt-2 space-y-1">
                    <span className="text-[8.5px] font-black text-gray-400 uppercase tracking-widest block mb-1">Shipping Consignee</span>
                    <div className="bg-gray-50/75 p-3 rounded-2xl border border-gray-100 space-y-1">
                      <p className="font-black text-gray-800 uppercase leading-none">{address?.fullName}</p>
                      <p className="text-[9px] text-gray-500 leading-tight font-medium">
                        {address?.streetAddress}, {address?.city}, {address?.district}, {address?.state}, {address?.country}
                      </p>
                      <p className="text-[8.5px] font-mono text-gray-400 font-bold tracking-tight">Phone: {address?.phone}</p>
                    </div>
                  </div>

                  {/* Summary grid */}
                  <div className="border-t border-dashed border-gray-200 mt-3 pt-3 space-y-1.5">
                    <div className="flex justify-between text-gray-500">
                      <span className="font-bold uppercase tracking-wide text-[9px]">Items Subtotal ({items.length || 1} lines):</span>
                      <span className="font-black font-mono">Rs. {total}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span className="font-bold uppercase tracking-wide text-[9px]">Delivery Fee ({address?.country}):</span>
                      <span className="font-black font-mono">Rs. {deliveryInfo?.fee || 0}</span>
                    </div>
                    {deliveryInfo?.handling > 0 && (
                      <div className="flex justify-between text-gray-500">
                        <span className="font-bold uppercase tracking-wide text-[9px]">Regional Handling:</span>
                        <span className="font-black font-mono">Rs. {deliveryInfo.handling}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-900 pt-2 border-t border-gray-150 leading-none">
                      <span className="font-black uppercase tracking-widest text-[10px]">Consolidated Total:</span>
                      <span className="font-black text-xs font-mono text-indigo-650 bg-indigo-50/50 px-2 py-0.5 rounded-md">
                        Rs. {confirmedOrder?.totalAmount || grandTotal}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Print button accent */}
                <button
                  id="print-invoice-btn"
                  type="button"
                  onClick={() => window.print()}
                  className="w-full text-center py-2 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 text-[8.5px] font-extrabold text-gray-500 uppercase tracking-widest transition-all hover:scale-[1.01]"
                >
                  🖨 Print Invoice Statement
                </button>
              </div>

              <div className="flex flex-col gap-2.5 w-full px-4">
                 <button 
                   id="track-order-btn"
                   type="button"
                   onClick={() => navigate('/orders')}
                   className="w-full py-4.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-[0.98] transition-all text-center flex items-center justify-center gap-2"
                 >
                    <span>Track Package Status</span>
                    <ArrowRight size={14} />
                 </button>
                 <button 
                   id="continue-shopping-btn"
                   type="button"
                   onClick={() => navigate('/')}
                   className="w-full py-4.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-500 hover:text-gray-800 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm active:scale-[0.98] transition-all text-center"
                 >
                    Continue Shopping
                 </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-6 space-y-6 max-w-md mx-auto"
            >
              <div className="relative text-center">
                 <div className="absolute inset-0 bg-red-400 blur-3xl opacity-20 rounded-full animate-pulse"></div>
                 <div className="relative w-16 h-16 bg-white rounded-full shadow-2xl flex items-center justify-center text-red-650 border border-red-50 mx-auto">
                    <AlertTriangle size={36} strokeWidth={2.5} />
                 </div>
                 <div className="mt-4 space-y-1">
                    <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase">Authorization Failed</h2>
                    <p className="text-[9px] font-black text-red-600 uppercase tracking-[0.3em] font-mono">Simulated clearing verification declined</p>
                 </div>
              </div>

              {/* AUTOMATED FAIL DESCRIPTION CARD */}
              <div className="w-full bg-white border border-gray-150 rounded-[2.5rem] shadow-2xl p-6 relative overflow-hidden font-sans space-y-4">
                <div className="absolute top-0 inset-x-0 h-2 bg-red-600"></div>
                
                <div className="flex justify-between items-center pb-3 border-b border-dashed border-gray-200">
                  <div className="space-y-0.5 animate-pulse">
                    <span className="text-[12px] font-black tracking-tight text-gray-900 uppercase">NexaMart Ltd.</span>
                    <p className="text-[7.5px] font-black text-gray-400 uppercase tracking-widest leading-none">Security Center Handshake</p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="text-[10px] font-mono font-black text-red-650 bg-red-50 px-2.5 py-0.5 rounded-lg uppercase font-semibold">
                      {confirmedOrder?.orderId || 'NPM-FAIL-PAY'}
                    </span>
                    <p className="text-[7.5px] font-bold text-gray-400 uppercase tracking-tight">Failure Log Reference</p>
                  </div>
                </div>

                <div className="space-y-3.5 text-xs text-left">
                  <div className="p-4 bg-red-50/50 text-red-700/95 rounded-2xl border border-red-150 font-bold text-[10.5px] leading-relaxed">
                    {gatewayError || "The virtual gateway declined the authorized transfer request or encountered a connection signature timeout."}
                  </div>
                  
                  <div className="space-y-2 text-[9.5px] border-t border-gray-100 pt-3 font-semibold text-gray-650">
                    <p className="font-gray-400 font-extrabold uppercase text-[8px] tracking-widest">Diagnostic Details:</p>
                    <div className="grid grid-cols-2">
                      <span>Gateway Account:</span>
                      <span className="text-right font-black text-gray-800">{secureGatewayAccount || 'N/A'}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span>Active Sandbox Interface:</span>
                      <span className="text-right font-black text-indigo-650 uppercase font-mono">{paymentMethod} SIMULATOR</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span>Clearing Currency:</span>
                      <span className="text-right font-black text-gray-850 uppercase">{finalCountry === 'India' ? 'INR' : 'NPR'}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span>Consolidated Total:</span>
                      <span className="text-right font-black text-gray-850">Rs. {grandTotal}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 w-full px-4">
                 <button 
                   type="button"
                   onClick={() => {
                     setStep(1);
                     setGatewayError(null);
                   }}
                   className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-orange-100 active:scale-[0.98] transition-all text-center flex items-center justify-center gap-2"
                 >
                    <span>Retry with {paymentMethod} sandbox</span>
                 </button>
                 <button 
                   type="button"
                   onClick={() => {
                     setStep(1);
                     setPaymentOption('COD');
                     setPaymentMethod('COD');
                     setGatewayError(null);
                   }}
                   className="w-full py-4 bg-white border border-gray-200 hover:border-gray-300 text-gray-500 hover:text-gray-800 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-[0.98] transition-all text-center"
                 >
                    Switch to Cash On Delivery (COD)
                 </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SECURE VIRTUAL GATEWAY MODAL INTERACTIVE POPUP */}
      {isSecureGatewayProcessing && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.95, y: 15 }} 
            animate={{ scale: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden flex flex-col shadow-2xl border border-gray-100 p-6 space-y-6 text-left"
          >
            {/* Header */}
            <div className="text-center space-y-1.5 font-sans">
              <div className="w-12 h-12 bg-gradient-to-tr from-indigo-505 to-purple-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-150 mx-auto">
                <ShieldCheck size={26} className="text-white" />
              </div>
              <h3 className="text-md font-black text-gray-900 uppercase tracking-tight">Authorize {paymentMethod} Secure</h3>
              <p className="text-[8px] font-mono tracking-widest text-indigo-650 bg-indigo-50 px-2.5 py-0.5 rounded-full inline-block uppercase font-black">Virtual Escrow Sandbox</p>
            </div>

            {/* Input and Details */}
            <div className="space-y-4 font-sans">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                <div className="flex justify-between text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                  <span>Merchant Escrow:</span>
                  <span className="text-gray-850 font-extrabold text-right">Nexamart Ltd.</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                  <span>Total Amount:</span>
                  <span className="text-indigo-650 font-black text-right">Rs. {grandTotal}</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                  <span>Target Currency:</span>
                  <span className="text-gray-805 text-right">{finalCountry === 'India' ? 'INR' : 'NPR'}</span>
                </div>
              </div>

              {/* Credentials Identifier input */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider ml-1 block">
                  {paymentMethod === 'UPI' || paymentMethod === 'PhonePe' || paymentMethod === 'GPay' || paymentMethod === 'Paytm' ? 'Enter Virtual Private Address (VPA / UPI ID)' : 'Enter Registered Mobile Number'}
                </label>
                <input 
                  type="text" 
                  value={secureGatewayAccount}
                  onChange={e => setSecureGatewayAccount(e.target.value)}
                  placeholder=""
                  className="w-full bg-white border border-gray-300 rounded-lg py-2 pl-4 pr-4 text-xs font-semibold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-center placeholder-gray-400/80"
                />
              </div>

              {/* Simulation Mode Selector */}
              <div className="p-3 bg-indigo-50/20 border border-indigo-100 rounded-2xl space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[8.5px] font-black text-indigo-650 uppercase tracking-widest flex items-center gap-1.5">
                    ⚙️ Simulation Protocol
                  </span>
                  <span className="text-[8.5px] font-black text-gray-400 uppercase">Test Scenario</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[9px] font-black uppercase">
                  <button
                    type="button"
                    onClick={() => setSimulatedSuccessMode(true)}
                    className={cn(
                      "py-2 px-3 rounded-xl border text-center transition-all cursor-pointer",
                      simulatedSuccessMode 
                        ? "bg-green-500/10 text-green-600 border-green-200" 
                        : "bg-white text-gray-400 border-gray-150 hover:bg-gray-50"
                    )}
                  >
                    🟢 Success Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulatedSuccessMode(false)}
                    className={cn(
                      "py-2 px-3 rounded-xl border text-center transition-all cursor-pointer",
                      !simulatedSuccessMode 
                        ? "bg-red-500/10 text-red-500 border-red-300" 
                        : "bg-white text-gray-400 border-gray-150 hover:bg-gray-50"
                    )}
                  >
                    🔴 Fail Mode
                  </button>
                </div>
              </div>
            </div>

            {/* Simulated Live Processing Feeds */}
            {simulatedStatusText && (
              <div className="p-3.5 bg-gray-900 text-white rounded-2xl border border-gray-800 space-y-1.5 text-left font-mono">
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin text-orange-500 shrink-0" size={11} />
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block font-sans">Processing live simulated handshake</span>
                </div>
                <p className="text-[9.5px] font-black text-orange-450 leading-relaxed uppercase tracking-tight">{simulatedStatusText}</p>
                <div className="w-full bg-gray-800 rounded-full h-1 mt-1 overflow-hidden">
                  <div 
                    className="bg-orange-500 h-1 transition-all duration-300"
                    style={{ width: `${(simulatedStatusStep + 1) * 25}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 w-full pt-1">
               <button
                 type="button"
                 onClick={() => {
                   setIsSecureGatewayProcessing(false);
                   setSimulatedStatusText('');
                   setSimulatedStatusStep(0);
                 }}
                 className="flex-1 py-3.5 bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-500 text-[9.5px] font-black uppercase tracking-widest rounded-xl active:scale-[0.98] transition-all"
               >
                 Cancel
               </button>
               <button
                 type="button"
                 onClick={() => triggerOnlinePaymentSimulation(secureGatewayAccount)}
                 className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[9.5px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-100 active:scale-[0.98] transition-all"
               >
                 Authorize
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
