import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Camera, Save, ChevronLeft, Phone, Mail, Loader2, CheckCircle2, Lock, AtSign, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { reauthenticateWithCredential, EmailAuthProvider, updateEmail, verifyBeforeUpdateEmail } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';
import { cn, compressImage, formatAuthError } from '../../../utils';

export default function AccountSettings() {
  const navigate = useNavigate();
  const { profile, setProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    fullName: profile?.fullName || '',
    phone: profile?.phone || '',
    profileImage: profile?.profileImage || '',
    newEmail: '',
    password: ''
  });

  const [isEditingEmail, setIsEditingEmail] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = await compressImage(reader.result as string, 400, 400, 0.7);
          setFormData(prev => ({ ...prev, profileImage: base64 }));
        } catch (err) {
          console.error("Image upload failed:", err);
          setFormData(prev => ({ ...prev, profileImage: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !auth.currentUser) return;
    
    setLoading(true);
    setSuccess('');
    setError('');
    const path = `users/${profile.userId}`;
    
    try {
      // 1. If email is being changed, we need re-authentication
      if (isEditingEmail && formData.newEmail && formData.newEmail !== profile.email) {
        if (!formData.password) {
          setError("Verification password is required to update identity.");
          setLoading(false);
          return;
        }

        try {
          const credential = EmailAuthProvider.credential(auth.currentUser.email!, formData.password);
          await reauthenticateWithCredential(auth.currentUser, credential);
          
          try {
            await updateEmail(auth.currentUser, formData.newEmail);
            await updateDoc(doc(db, 'users', profile.userId), {
              email: formData.newEmail
            });
          } catch (emailErr: any) {
            const emailErrCode = emailErr.code || (emailErr.message?.includes('auth/invalid-credential') ? 'auth/invalid-credential' : '');
            if (emailErrCode === 'auth/operation-not-allowed') {
              await verifyBeforeUpdateEmail(auth.currentUser, formData.newEmail);
              setSuccess("Verification sent. Please confirm your new identity in your inbox.");
            } else {
              throw emailErr;
            }
          }
        } catch (err: any) {
          setError(formatAuthError(err));
          setLoading(false);
          return;
        }
      }

      // 2. Update other profile fields in Firestore
      await updateDoc(doc(db, 'users', profile.userId), {
        fullName: formData.fullName,
        phone: formData.phone,
        profileImage: formData.profileImage,
        updatedAt: new Date().toISOString()
      });
      
      if (setProfile) {
        setProfile({
          ...profile,
          fullName: formData.fullName,
          phone: formData.phone,
          profileImage: formData.profileImage,
          email: (isEditingEmail && formData.newEmail) ? formData.newEmail : profile.email
        });
      }
      
      if (!success) setSuccess("Profile synchronization complete.");
      setIsEditingEmail(false);
      setFormData(prev => ({ ...prev, password: '', newEmail: '' }));
      
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white p-6 pt-12 flex items-center gap-4 border-b border-gray-100 sticky top-0 z-30">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-black text-gray-900 tracking-tight">Account Settings</h1>
      </div>

      <div className="p-4 max-w-md mx-auto w-full">
        <form onSubmit={handleSave} className="space-y-6">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest shadow-sm"
              >
                <AlertTriangle size={16} /> {error}
              </motion.div>
            )}
            {success && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="bg-green-50 text-green-600 p-4 rounded-2xl border border-green-100 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest shadow-sm"
              >
                <CheckCircle2 size={16} /> {success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Profile Image Section */}
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-white border-4 border-white shadow-xl">
                {formData.profileImage ? (
                  <img src={formData.profileImage} className="w-full h-full object-cover" alt="Profile" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                    <User size={64} />
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-orange-700 transition-colors">
                <Camera size={20} />
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Update Profile Photo</p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                   type="text"
                   required
                   value={formData.fullName}
                   onChange={e => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                   className="w-full bg-white border border-gray-300 rounded-lg py-2.5 pl-11 pr-4 text-sm font-medium shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all"
                   placeholder=""
                />
              </div>
            </div>

            <div className="space-y-1 relative">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest animate-none">Identity Record</label>
                {!isEditingEmail && profile?.role === 'admin' && (
                  <button 
                    type="button" 
                    onClick={() => setIsEditingEmail(true)}
                    className="text-[9px] font-black text-orange-600 uppercase tracking-widest hover:underline"
                  >
                    Revise Identity
                  </button>
                )}
              </div>
              <div className="relative">
                <Mail className={cn("absolute left-4 top-1/2 -translate-y-1/2", isEditingEmail ? "text-orange-500" : "text-gray-400")} size={18} />
                <input 
                  type="email"
                  disabled={!isEditingEmail}
                  value={isEditingEmail ? formData.newEmail : (profile?.email || '')}
                  onChange={e => setFormData(prev => ({ ...prev, newEmail: e.target.value }))}
                  className={cn(
                    "w-full rounded-lg py-2.5 pl-11 pr-4 text-sm font-medium transition-all shadow-sm",
                    isEditingEmail 
                      ? "bg-white border border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none" 
                      : "bg-gray-150 border border-gray-250 text-gray-400"
                  )}
                  placeholder=""
                />
              </div>
              {!isEditingEmail && <p className="text-[9px] text-gray-400 font-medium ml-1">Identity locked. Level 4 privilege required to revise.</p>}
            </div>

            <AnimatePresence>
              {isEditingEmail && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-1 overflow-hidden font-sans"
                >
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Your Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-600" size={18} />
                    <input 
                      type="password"
                      required
                      value={formData.password}
                      onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder=""
                      className="w-full bg-white border border-orange-500 rounded-lg py-2.5 pl-11 pr-4 text-sm font-medium shadow-sm focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all"
                    />
                  </div>
                  <p className="text-[8px] text-orange-600 font-bold uppercase tracking-widest mt-1 ml-1 flex items-center gap-1">
                    <AlertTriangle size={10} /> Password required to update profile info
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full bg-white border border-gray-300 rounded-lg py-2.5 pl-11 pr-4 text-sm font-medium shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all"
                  placeholder=""
                />
              </div>
            </div>
          </div>

          <button 
             type="submit"
             disabled={loading}
             className={cn(
               "w-full py-5 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 uppercase tracking-widest text-[11px]",
               !!success ? "bg-green-600 shadow-green-100" : "bg-gray-900 shadow-gray-200"
             )}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : !!success ? (
              <><CheckCircle2 size={20} /> Sync Complete</>
            ) : (
              <><Save size={20} /> Deploy Changes</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
