import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Package, MapPin, Heart, Bell, Settings, LogOut, ChevronRight, Store, Shield, MessageSquare, Bike } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { SiteSettings } from '../../../types';

export default function Profile() {
  const { profile, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const [showAbout, setShowAbout] = React.useState(false);
  const [supportNumber, setSupportNumber] = React.useState<string>('+9779700694631');

  React.useEffect(() => {
    getDocs(collection(db, 'settings')).then(snap => {
      if (!snap.empty) {
        const settings = snap.docs[0].data() as SiteSettings;
        if (settings.supportWhatsapp) setSupportNumber(settings.supportWhatsapp);
      }
    }).catch(err => console.error("Error fetching support number:", err));
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const menuItems = [
    { name: 'My Orders', icon: Package, path: '/orders', color: 'text-blue-500', bg: 'bg-blue-50' },
    { name: t('my_addresses'), icon: MapPin, path: '/addresses', color: 'text-red-500', bg: 'bg-red-50' },
    { name: 'Wishlist', icon: Heart, path: '/wishlist', color: 'text-pink-500', bg: 'bg-pink-50' },
  ];

  if (!profile) return null;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      {/* About Us Modal */}
      <AnimatePresence>
        {showAbout && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full translate-x-1/2 -translate-y-1/2 -z-10" />
              
              <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-orange-100 mx-auto">
                <Store size={32} />
              </div>

              <div className="text-center space-y-4 mb-8">
                <h3 className="text-xl font-black text-gray-900 tracking-tight">About NexaMart</h3>
                <div className="space-y-2 text-sm text-gray-500 font-medium leading-relaxed">
                  <p>NexaMart is a premier marketplace platform, connecting local sellers with customers across the nation.</p>
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Platform Branding</p>
                    <p className="text-gray-900 font-black">NEXAMART - SMART SHOPPING FOR INDIA & NEPAL</p>
                    <p className="text-[10px] text-gray-400">Shop Smart • Delivered Fast</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowAbout(false)}
                className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all text-xs uppercase tracking-widest"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Header */}
      <div className="bg-orange-600 p-8 pt-12 text-white flex flex-col items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-md p-1 border-2 border-white/30 shadow-2xl relative z-10"
        >
          <img 
            src={profile.profileImage || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + profile.userId} 
            className="w-full h-full rounded-[20px] object-cover bg-white" 
            alt={profile.fullName}
          />
        </motion.div>
        <div className="text-center relative z-10">
          <h2 className="text-xl font-black tracking-tight">{profile.fullName}</h2>
          <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mt-1 italic">{profile.email}</p>
        </div>
        
        <div className="flex gap-4 mt-2">
          {profile.role === 'customer' && (
            <Link to="/vendor" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 px-4 py-2 rounded-xl text-xs font-black shadow-lg transition-all">
              <Store size={14} /> Become a Seller
            </Link>
          )}
          {profile.role === 'vendor' && (
            <Link to="/vendor" className="flex items-center gap-2 bg-green-500/20 backdrop-blur-md border border-green-500/30 px-4 py-2 rounded-xl text-xs font-black shadow-lg">
              <Store size={14} /> Vendor Dashboard
            </Link>
          )}
          {profile.role === 'admin' && (
            <Link to="/admin" className="flex items-center gap-2 bg-red-500/20 backdrop-blur-md border border-red-500/30 px-4 py-2 rounded-xl text-xs font-black shadow-lg">
              <Shield size={14} /> Admin Panel
            </Link>
          )}
          {profile.role === 'rider' && (
            <Link to="/rider" className="flex items-center gap-2 bg-orange-500/20 backdrop-blur-md border border-orange-500/30 px-4 py-2 rounded-xl text-xs font-black shadow-lg">
              <Bike size={14} /> Rider Panel
            </Link>
          )}
        </div>
      </div>

      {/* Main Menu */}
      <div className="px-6 -mt-6 relative z-20 space-y-4">
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-2 border border-gray-100">
          <div className="grid grid-cols-1 divide-y divide-gray-50">
            {menuItems.map((item, i) => (
              <Link
                key={i}
                to={item.path}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group"
              >
                <div className={`p-2.5 rounded-xl ${item.bg} ${item.color}`}>
                  <item.icon size={20} />
                </div>
                <span className="flex-1 font-bold text-gray-800 text-sm">{item.name}</span>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500" />
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-2 border border-gray-100">
          <div className="grid grid-cols-1 divide-y divide-gray-50">
            <button 
              onClick={() => setShowAbout(true)}
              className="flex items-center gap-4 p-4 w-full text-left hover:bg-gray-50 transition-colors group"
            >
              <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600">
                <Store size={20} />
              </div>
              <span className="flex-1 font-bold text-gray-800 text-sm">About NexaMart</span>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500" />
            </button>
            <Link to="/account-settings" className="flex items-center gap-4 p-4 w-full text-left hover:bg-gray-50 transition-colors group">
              <div className="p-2.5 rounded-xl bg-gray-50 text-gray-500">
                <Settings size={20} />
              </div>
              <span className="flex-1 font-bold text-gray-800 text-sm">Account Settings</span>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500" />
            </Link>
            
            {profile.role === 'customer' && (
              <Link to="/rider" className="flex items-center gap-4 p-4 w-full text-left hover:bg-gray-50 transition-colors group">
                <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600">
                  <Bike size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800 text-sm">Logistics Network</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Apply to be a Rider</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-orange-500" />
              </Link>
            )}
            
            <a 
              href={`https://wa.me/${supportNumber.replace(/\+/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 w-full text-left hover:bg-gray-50 transition-colors group"
            >
              <div className="p-2.5 rounded-xl bg-green-50 text-green-600">
                <MessageSquare size={20} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-800 text-sm">Customer Support</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Connect on WhatsApp</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500" />
            </a>

            <button 
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-4 p-4 w-full text-left hover:bg-gray-50 transition-colors group"
            >
              <div className="p-2.5 rounded-xl bg-red-50 text-red-500">
                <LogOut size={20} />
              </div>
              <span className="flex-1 font-bold text-red-600 text-sm">Log Out</span>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-red-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full translate-x-1/2 -translate-y-1/2 -z-10" />
              
              <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-red-100 mx-auto">
                <LogOut size={32} />
              </div>

              <div className="text-center space-y-2 mb-8">
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Logging Out?</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">Are you sure you want to end your session on NexaMart?</p>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleLogout}
                  className="w-full bg-red-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-red-100 active:scale-95 transition-all text-xs uppercase tracking-widest"
                >
                  Yes, Log Me Out
                </button>
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full bg-gray-50 text-gray-400 font-black py-4 rounded-2xl active:scale-95 transition-all text-xs uppercase tracking-widest"
                >
                  Stay in App
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center p-8 mt-auto">
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">NexaMart v2.0.0 (Nepal Only)</p>
      </div>
    </div>
  );
}
