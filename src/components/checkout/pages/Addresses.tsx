import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, CheckCircle2, ChevronLeft, Map, Phone, Pencil, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import GlobalAddressForm from '../GlobalAddressForm';
import { Address } from '../../../types';
import { cn, scrubUndefined } from '../../../utils';

export default function Addresses() {
  const navigate = useNavigate();
  const { profile, setProfile } = useAuth();
  const { t } = useLanguage();
  const [isAdding, setIsAdding] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSelectNewDefault, setShowSelectNewDefault] = useState(false);
  const [remainingAddressesForDefault, setRemainingAddressesForDefault] = useState<Address[]>([]);

  const handleDeleteClick = (addr: Address) => {
    setAddressToDelete(addr);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!profile || !profile.addresses || !addressToDelete) return;

    const id = addressToDelete.id;
    const wasDefault = addressToDelete.isDefault;

    // Optimistically update local state for instant removal!
    const updatedAddresses = profile.addresses.filter(a => a.id !== id);
    setProfile(prev => {
      if (!prev) return null;
      return {
        ...prev,
        addresses: updatedAddresses
      };
    });

    try {
      const userRef = doc(db, 'users', profile.userId);
      await setDoc(userRef, { addresses: scrubUndefined(updatedAddresses) }, { merge: true });
      
      // Close confirmation popup
      setShowDeleteConfirm(false);
      setAddressToDelete(null);

      // If deleted address was default, ask user to select a new one if possible
      if (wasDefault && updatedAddresses.length > 0) {
        setRemainingAddressesForDefault(updatedAddresses);
        setShowSelectNewDefault(true);
      }
    } catch (err) {
      // Revert optimistic update on failure
      setProfile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          addresses: profile.addresses
        };
      });
      handleFirestoreError(err, OperationType.UPDATE, `users/${profile.userId}`);
      setShowDeleteConfirm(false);
      setAddressToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setAddressToDelete(null);
  };

  const handleSelectNewDefault = async (addrId: string) => {
    if (!profile || !profile.addresses) return;
    
    const updated = profile.addresses.map(a => ({
      ...a,
      isDefault: a.id === addrId
    }));

    // Optimistically update
    setProfile(prev => {
      if (!prev) return null;
      return {
        ...prev,
        addresses: updated
      };
    });

    try {
      const userRef = doc(db, 'users', profile.userId);
      await setDoc(userRef, { addresses: scrubUndefined(updated) }, { merge: true });
      setShowSelectNewDefault(false);
      setRemainingAddressesForDefault([]);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${profile.userId}`);
    }
  };

  const handleSave = async (newAddress: Address) => {
    if (!profile) return;
    try {
      const userRef = doc(db, 'users', profile.userId);
      const existingAddresses = profile.addresses || [];
      
      let updatedAddresses = [...existingAddresses];
      
      if (editingAddress) {
        // Update existing
        updatedAddresses = updatedAddresses.map(a => a.id === editingAddress.id ? newAddress : a);
      } else {
        // Add new
        updatedAddresses = [newAddress, ...updatedAddresses];
      }

      // If setting as default, unset others
      if (newAddress.isDefault) {
        updatedAddresses = updatedAddresses.map(a => ({ ...a, isDefault: a.id === newAddress.id }));
      }
      
      updatedAddresses = updatedAddresses.slice(0, 10); // Allow more addresses
      await setDoc(userRef, { addresses: scrubUndefined(updatedAddresses) }, { merge: true });
      setIsAdding(false);
      setEditingAddress(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${profile.userId}`);
    }
  };

  if (!profile) return null;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      <div className="bg-white p-4 sticky top-0 z-30 border-b border-gray-100 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-sm font-black text-gray-900 uppercase tracking-widest flex-1">{t('my_addresses')}</h1>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className={cn(
            "p-2 rounded-xl transition-all active:scale-95",
            isAdding ? "bg-red-50 text-red-600" : "bg-orange-50 text-orange-600"
          )}
        >
          {isAdding ? <Plus className="rotate-45" size={20} /> : <Plus size={20} />}
        </button>
      </div>

      <div className="p-4 md:p-6 space-y-4">
        <AnimatePresence mode="wait">
          {(isAdding || editingAddress) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mb-6">
                <div className="flex items-center justify-between mb-6 px-2">
                  <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                    {editingAddress ? 'Modify Address' : 'New Shipping Point'}
                  </h2>
                  <button 
                    onClick={() => { setIsAdding(false); setEditingAddress(null); }}
                    className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-50 px-3 py-1 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                <GlobalAddressForm 
                  onSave={handleSave} 
                  initialData={editingAddress || undefined} 
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-6">
          {profile.addresses?.map((addr) => (
            <motion.div 
              layout
              key={addr.id} 
              className={cn(
                "bg-white p-6 rounded-[2.5rem] border transition-all relative group overflow-hidden shadow-sm hover:shadow-xl hover:shadow-gray-200/50",
                addr.isDefault ? "border-orange-500 ring-4 ring-orange-50" : "border-gray-100"
              )}
            >
              <div className="flex justify-between items-center mb-6">
                 <div className="flex items-center gap-2">
                    <div className="bg-gray-900 text-white text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest">
                       {addr.label || 'Other'}
                    </div>
                    {addr.isDefault && (
                      <span className="bg-orange-600 text-white text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                        <CheckCircle2 size={12} /> Default Address
                      </span>
                    )}
                 </div>
              </div>
              
              <div className="space-y-4">
                 <div>
                    <p className="font-black text-gray-950 text-lg tracking-tight">{addr.fullName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone size={12} className="text-gray-400" />
                      <p className="text-xs font-bold text-gray-500 tracking-widest">{addr.country === 'Nepal' ? '+977' : '+91'} {addr.phone}</p>
                    </div>
                 </div>

                 <div className="space-y-2 py-4 border-y border-gray-100">
                    <div className="flex items-start gap-3">
                       <Map size={16} className="text-gray-455 mt-1 shrink-0" />
                       <div className="space-y-1">
                          <p className="text-[12px] font-black text-gray-950 leading-normal uppercase tracking-tight">
                             {addr.houseNumber ? `${addr.houseNumber}, ` : ''}{addr.streetAddress}{addr.area ? `, ${addr.area}` : ''}
                          </p>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                             {addr.city}, {addr.district}, {addr.state} {addr.country === 'Nepal' ? `Ward ${addr.ward}` : addr.pinCode}
                          </p>
                       </div>
                    </div>
                    {addr.landmark && (
                       <div className="flex items-center gap-3 ml-7">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                          <p className="text-[10px] font-black text-orange-600 uppercase tracking-wider">Landmark: {addr.landmark}</p>
                       </div>
                    )}
                 </div>

                 {addr.deliveryInstructions && (
                    <div className="p-4 bg-orange-50/25 rounded-2xl border border-orange-100">
                       <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-1 italic">Special Instructions</p>
                       <p className="text-[10px] text-gray-600 font-bold leading-relaxed uppercase">{addr.deliveryInstructions}</p>
                    </div>
                 )}
              </div>

              {/* Action Buttons in Bar - Highly visible Amazon/Flipkart style */}
              <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                {/* Left side: Selection as default toggle */}
                <div>
                  {addr.isDefault ? (
                    <div className="flex items-center gap-1.5 text-xs text-green-700 font-black uppercase tracking-wider">
                      <CheckCircle2 size={14} className="text-green-600" /> Active Delivery Point
                    </div>
                  ) : (
                    <button 
                      type="button"
                      onClick={async () => {
                        const userRef = doc(db, 'users', profile.userId);
                        const updated = profile.addresses!.map(a => ({
                          ...a,
                          isDefault: a.id === addr.id
                        }));
                        await setDoc(userRef, { addresses: scrubUndefined(updated) }, { merge: true });
                      }}
                      className="px-4 py-2 bg-gray-50 hover:bg-orange-50 hover:text-orange-600 text-gray-500 border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                    >
                      Set as Default
                    </button>
                  )}
                </div>

                {/* Right side: Edit & Delete buttons */}
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => { setEditingAddress(addr); setIsAdding(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-750 border border-transparent rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                    title="Edit address"
                  >
                    <Pencil size={12} className="text-gray-500" />
                    Edit
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleDeleteClick(addr)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                    title="Delete address"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {(!profile.addresses || profile.addresses.length === 0) && !isAdding && (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Map size={40} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest">No Saved Addresses</p>
              <p className="text-[9px] font-bold max-w-[200px] mt-2 italic">Add a shipping address to speed up your checkout process.</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="px-8 py-4 opacity-30 text-center">
        <p className="text-[8px] font-black uppercase tracking-widest">NexaMart Shipping Network • Serving Nepal</p>
      </div>

      {/* Modals and Overlays */}
      <AnimatePresence>
        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-950/40 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={cancelDelete}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-2xl relative max-w-sm w-full z-10 text-center space-y-6"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
                <AlertTriangle size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Delete Point</h3>
                <p className="text-xs font-bold text-gray-500 leading-relaxed">
                  Are you sure you want to delete this address?
                </p>
                {addressToDelete && (
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider bg-gray-50 p-2.5 rounded-2xl border border-gray-100 truncate">
                    {addressToDelete.fullName} • {addressToDelete.city}
                  </p>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={cancelDelete}
                  className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-250 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="flex-1 py-3 bg-red-650 hover:bg-red-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-red-600/20 cursor-pointer"
                >
                  Yes
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Change Default Address Selection Dialog */}
        {showSelectNewDefault && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-950/40 backdrop-blur-sm"
              onClick={() => { setShowSelectNewDefault(false); setRemainingAddressesForDefault([]); }}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-2xl relative max-w-md w-full z-10 space-y-6 animate-in fade-in zoom-in-95 duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-600 shrink-0">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Select Default</h3>
                  <p className="text-[10px] font-bold text-gray-400">YOUR DEFAULT DELIVERY POINT WAS DELETED</p>
                </div>
              </div>

              <p className="text-xs font-bold text-gray-650 leading-relaxed">
                Please select a new default address to continue using automated rate calculations:
              </p>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {remainingAddressesForDefault.map(addr => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => handleSelectNewDefault(addr.id)}
                    className="w-full text-left bg-gray-50 border border-gray-150 rounded-2xl p-4 hover:border-orange-500 hover:bg-orange-50/20 hover:shadow-md transition-all group flex items-start gap-3"
                  >
                    <div className="w-5 h-5 bg-white border border-gray-300 rounded-full mt-0.5 flex items-center justify-center group-hover:border-orange-500 shrink-0">
                      <div className="w-2.5 h-2.5 bg-transparent group-hover:bg-orange-500 rounded-full" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <p className="text-xs font-black text-gray-900 uppercase truncate">{addr.fullName}</p>
                      <p className="text-[10px] font-bold text-gray-500 uppercase truncate">
                        {addr.streetAddress}, {addr.city} ({addr.country})
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => { setShowSelectNewDefault(false); setRemainingAddressesForDefault([]); }}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                >
                  I'll select later
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
