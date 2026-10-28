import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Store, ShoppingBag, PieChart, Shield, Check, X, Ban, LogOut,
  Layers, Bell, ArrowUpRight, TrendingUp, Search, MoreVertical,
  Settings, DollarSign, Wallet, FileText, Package, HelpCircle, Image as ImageIcon,
  CheckCircle2, AlertTriangle, Trash2, Edit, Save, Plus, ExternalLink, Eye,
  Upload, Ticket, Clock, QrCode, RotateCcw, Bike, Truck, Navigation, Phone, MessageSquare, Mail, Lock, MapPin, Key, AtSign, Menu,
  Bot, Loader2, User, Grid, Compass, ShieldCheck, Megaphone, Camera,
  ArrowUp, ArrowDown, Video, Tv, Play, Sparkles, Sliders, CreditCard, RefreshCw, GripVertical
} from 'lucide-react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signOut, 
  updateEmail, 
  verifyBeforeUpdateEmail, 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider 
} from 'firebase/auth';
import firebaseConfig from '../../../../firebase-applet-config.json';
import { collection, query, getDocs, updateDoc, doc, serverTimestamp, setDoc, deleteDoc, orderBy, limit, writeBatch, increment, onSnapshot, getDoc } from 'firebase/firestore';
import { db, auth, storage, handleFirestoreError, OperationType, FIRESTORE_UPGRADE_URL, isQuotaActive } from '../../../firebase';
import { 
  fallbackVendors, 
  fallbackProducts, 
  fallbackUsers, 
  fallbackOrders, 
  fallbackWithdrawalRequests, 
  fallbackBanners, 
  fallbackCategories, 
  fallbackCoupons, 
  fallbackRiders 
} from '../../../constants/fallbackData';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { useAuth } from '../../../context/AuthContext';
import { Product, Vendor, UserProfile, Category, Order, WithdrawalRequest, Banner, SiteSettings, UserRole, Coupon, Rider, AppAd } from '../../../types';
import { cn, compressImage, formatDate, formatAuthError, getApiUrl } from '../../../utils';
import { isGoogleMapsKeyValid } from '../../../lib/maps';
import { SERVICEABLE_DISTRICTS, NEPAL_LOCATIONS, INDIA_LOCATIONS } from '../../../constants/locations';
import { Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

function AIEnhancementModal({ 
  image, 
  onComplete, 
  onClose,
  categories
}: { 
  image: string, 
  onComplete: (data: any) => void, 
  onClose: () => void,
  categories: Category[]
}) {
  const [step, setStep] = useState<'analyzing' | 'optimizing' | 'review'>('analyzing');
  const [progress, setProgress] = useState(0);
  const [analysis, setAnalysis] = useState<any>(null);
  const [optimizedImage, setOptimizedImage] = useState<string | null>(null);
  const [style, setStyle] = useState('amazon');

  useEffect(() => {
    analyzeImage();
  }, []);

  const analyzeImage = async () => {
    setStep('analyzing');
    setProgress(20);
    try {
      const res = await fetch(getApiUrl('/api/ai/analyze-image'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: image })
      });
      const data = await res.json();
      setAnalysis(data);
      setProgress(50);
      setStep('optimizing');
      optimizeImage(data);
    } catch (err) {
      alert("Analysis failed. Proceeding manually.");
      setStep('review');
    }
  };

  const optimizeImage = async (analysisData?: any) => {
    setProgress(70);
    try {
      const res = await fetch(getApiUrl('/api/ai/optimize-image'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: image, style })
      });
      const data = await res.json();
      setOptimizedImage(data.imageUrl);
      setProgress(100);
      setStep('review');
    } catch (err) {
      setStep('review');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
    >
      <div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-white/20">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 rotate-3">
                 <Bot size={24} />
              </div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest italic">NexaMart AI Engine</h3>
           </div>
           <button onClick={onClose} className="p-3 bg-white rounded-2xl shadow-sm border border-gray-50 hover:bg-gray-100 transition-all"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
           {step !== 'review' ? (
             <div className="h-full flex flex-col items-center justify-center space-y-8 py-20 text-center">
                <div className="relative">
                   <div className="w-32 h-32 rounded-full border-4 border-indigo-50 border-t-indigo-600 animate-spin" />
                   <div className="absolute inset-0 flex items-center justify-center">
                      <Bot size={40} className="text-indigo-600" />
                   </div>
                </div>
                <div className="space-y-2">
                   <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                     {step === 'analyzing' ? 'Scanning Product DNA...' : 'Finalizing Professional Grade Rendition...'}
                   </h4>
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em]">
                     {step === 'analyzing' ? 'Detecting categories, keywords and price indices' : 'Applying professional studio lighting and background removal'}
                   </p>
                </div>
                <div className="w-full max-w-md bg-gray-100 h-2 rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${progress}%` }}
                     className="h-full bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.5)]"
                   />
                </div>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Enhanced Product Visualization</h4>
                      <div className="relative group cursor-pointer aspect-square rounded-[3rem] overflow-hidden border-8 border-gray-50 shadow-inner">
                         <div className="flex w-full h-full">
                            <div className="w-1/2 h-full relative overflow-hidden border-r border-white/20">
                               <img src={image} className="absolute inset-0 w-[200%] h-full object-cover grayscale" />
                               <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white text-[8px] font-black px-3 py-1 rounded-full uppercase">Original</div>
                            </div>
                            <div className="w-1/2 h-full relative overflow-hidden">
                               <img src={optimizedImage || image} className="absolute -left-full inset-0 w-[200%] h-full object-cover" />
                               <div className="absolute top-4 right-4 bg-indigo-600 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase shadow-lg">Enhanced</div>
                            </div>
                         </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                         {['amazon', 'flipkart', 'premium', 'catalog'].map(s => (
                           <button 
                             key={s}
                             onClick={() => { setStyle(s); optimizeImage(analysis); }}
                             className={cn(
                               "py-2 px-1 text-[8px] font-black uppercase tracking-widest rounded-xl transition-all border",
                               style === s ? "bg-gray-900 text-white border-gray-900" : "bg-gray-50 text-gray-400 border-gray-100 hover:bg-white"
                             )}
                           >
                             {s}
                           </button>
                         ))}
                      </div>
                   </div>

                   <div className="space-y-3 bg-gray-50 p-6 rounded-[2.5rem] border border-gray-100">
                      <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Grid size={14} className="text-indigo-600" /> AI Auto-Resize Clusters
                      </h5>
                      <div className="grid grid-cols-2 gap-2">
                         {[
                           { name: 'Thumbnail', size: '200x200' },
                           { name: 'Product Card', size: '500x500' },
                           { name: 'Hero Banner', size: '1200x600' },
                           { name: 'Zoom HD', size: '2000x2000' }
                         ].map(v => (
                           <div key={v.name} className="bg-white p-3 rounded-2xl border border-gray-100 flex items-center justify-between group hover:border-indigo-200 transition-all">
                              <div>
                                 <p className="text-[8px] font-black text-gray-900 uppercase tracking-tight">{v.name}</p>
                                 <p className="text-[7px] text-gray-400 font-bold uppercase">{v.size}</p>
                              </div>
                              <div className="w-6 h-6 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                                 <Check size={12} />
                              </div>
                           </div>
                         ))}
                      </div>
                      <p className="text-[7px] font-bold text-gray-400 uppercase text-center italic tracking-widest pt-1">
                        * Neural Scaling Preserves 99.8% Detail Density
                      </p>
                   </div>

                   <div className="bg-orange-50/50 p-6 rounded-[2.5rem] border border-orange-100 space-y-3">
                      <h5 className="text-[10px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-2">
                        <AlertTriangle size={14} /> Intelligence Quality Report
                      </h5>
                      <div className="space-y-2">
                         <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-500 uppercase">Input Score</span>
                            <span className={cn("text-xs font-black", (analysis?.qualityScore || 0) > 70 ? "text-green-600" : "text-orange-600")}>
                               {analysis?.qualityScore || 0}%
                            </span>
                         </div>
                         <div className="flex flex-wrap gap-1.5">
                            {analysis?.qualityIssues?.map((issue: string, i: number) => (
                              <span key={i} className="text-[8px] font-black bg-white text-orange-600 px-3 py-1 rounded-full uppercase border border-orange-100">{issue}</span>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>

                <div className="space-y-8 h-[60vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-gray-200">
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest italic">AI Suggested Metadata</h4>
                      
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Headline</label>
                         <input 
                           className="w-full bg-gray-50 border border-transparent rounded-2xl p-5 text-sm font-black outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                           value={analysis?.suggestedName || ''}
                           onChange={e => setAnalysis({...analysis, suggestedName: e.target.value})}
                         />
                      </div>

                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Story Description</label>
                         <textarea 
                           rows={4}
                           className="w-full bg-gray-50 border border-transparent rounded-3xl p-5 text-xs font-medium leading-relaxed outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                           value={analysis?.description || ''}
                           onChange={e => setAnalysis({...analysis, description: e.target.value})}
                         />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Categorization</label>
                            <select 
                               className="w-full bg-gray-50 border border-transparent rounded-2xl p-5 text-[10px] font-black outline-none appearance-none"
                               value={analysis?.category?.toLowerCase() || ''}
                               onChange={e => setAnalysis({...analysis, category: e.target.value})}
                            >
                               {categories.filter(c => !c.parentId).map(c => (
                                 <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
                               ))}
                            </select>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Valuation (NPR)</label>
                            <input 
                               type="number"
                               className="w-full bg-gray-50 border border-transparent rounded-2xl p-5 text-[10px] font-black outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                               value={analysis?.suggestedPrice || ''}
                               onChange={e => setAnalysis({...analysis, suggestedPrice: e.target.value})}
                            />
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Neural Tag Tags</label>
                         <div className="flex flex-wrap gap-2 p-2">
                            {analysis?.tags?.map((tag: string, i: number) => (
                              <span key={i} className="bg-indigo-50 text-indigo-600 text-[9px] font-black px-4 py-2 rounded-2xl uppercase tracking-widest group relative">
                                 {tag}
                                 <button onClick={() => setAnalysis({...analysis, tags: analysis.tags.filter((_: any, idx: number) => idx !== i)})} className="ml-2 hover:text-red-600 transition-colors">×</button>
                              </span>
                            ))}
                         </div>
                      </div>
                   </div>

                   <button 
                     onClick={() => onComplete({
                       name: analysis?.suggestedName,
                       description: analysis?.description,
                       price: analysis?.suggestedPrice,
                       categoryId: analysis?.category,
                       tags: analysis?.tags,
                       imageUrl: optimizedImage || image
                     })}
                     className="w-full bg-gray-900 text-white font-black py-6 rounded-[2.5rem] uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                   >
                     <ShieldCheck size={20} /> Deploy Global Product Profile
                   </button>
                </div>
             </div>
           )}
        </div>
      </div>
    </motion.div>
  );
}

function ProductManager({ 
  products, 
  setProducts, 
  handleAction,
  categories
}: { 
  products: Product[], 
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>,
  handleAction: (col: string, id: string, data: any) => Promise<void>,
  categories: Category[]
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiEnhancingImage, setAiEnhancingImage] = useState<string | null>(null);
  const { profile } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discountPrice: '',
    stock: '',
    sku: '',
    categoryId: '',
    subCategoryId: '',
    images: [] as string[]
  });

  const mainCategories = categories.filter(c => !c.parentId);
  const subCategories = categories.filter(c => c.parentId === formData.categoryId);

  const filteredProducts = products.filter(p => {
    const pName = (p?.name || (p as any)?.title || '').toLowerCase();
    const pSku = (p?.sku || '').toLowerCase();
    const query = (searchTerm || '').toLowerCase();
    const matchesSearch = pName.includes(query) || pSku.includes(query);
    const matchesFilter = filter === 'all' || p?.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      setProducts(prev => prev.filter(p => p.productId !== id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const compressed = await compressImage(reader.result as string, 800, 800, 0.6);
          setFormData({ ...formData, images: [...formData.images, compressed] });
        } catch (err) {
          setFormData({ ...formData, images: [...formData.images, reader.result as string] });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) return alert("Select category");
    setLoading(true);
    try {
      const productId = `prod-${Date.now()}`;
      const productData = {
        ...formData,
        productId,
        price: Number(formData.price),
        discountPrice: formData.discountPrice ? Number(formData.discountPrice) : null,
        stock: Number(formData.stock),
        vendorId: profile?.userId || 'admin',
        status: 'approved',
        rating: 0,
        totalReviews: 0,
        trending: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(doc(db, 'products', productId), productData);
      setFormData({
        name: '', description: '', price: '', discountPrice: '',
        stock: '', sku: '', categoryId: '', subCategoryId: '', images: []
      });
      setIsAdding(false);
      alert("Product launched successfully!");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'products');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div key="products" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
       <div className="flex justify-between items-center px-1">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Inventory Hub</h3>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className={cn(
              "p-2 rounded-xl transition-all active:scale-95 shadow-lg",
              isAdding ? "bg-red-50 text-red-600" : "bg-red-700 text-white"
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
              className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-2xl space-y-4 overflow-hidden"
            >
               <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest text-center mb-2">Initialize New Product Entry</h4>
               
               <input 
                 required
                 placeholder="Product Title" 
                 className="w-full bg-gray-50 border border-transparent rounded-2xl p-4 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-red-500 transition-all"
                 value={formData.name}
                 onChange={e => setFormData({...formData, name: e.target.value})}
               />

               <textarea 
                 required
                 placeholder="Product Description (Detailed)" 
                 rows={3}
                 className="w-full bg-gray-50 border border-transparent rounded-2xl p-4 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-red-500 transition-all resize-none"
                 value={formData.description}
                 onChange={e => setFormData({...formData, description: e.target.value})}
               />

               <div className="grid grid-cols-2 gap-3">
                 <input 
                   required
                   type="number"
                   placeholder="Base Price (Rs.)" 
                   className="w-full bg-gray-50 border border-transparent rounded-xl p-4 text-[10px] font-black outline-none focus:bg-white focus:ring-2 focus:ring-red-500 transition-all"
                   value={formData.price}
                   onChange={e => setFormData({...formData, price: e.target.value})}
                 />
                 <input 
                   type="number"
                   placeholder="Disc. Price (Optional)" 
                   className="w-full bg-gray-50 border border-transparent rounded-xl p-4 text-[10px] font-black outline-none focus:bg-white focus:ring-2 focus:ring-red-500 transition-all"
                   value={formData.discountPrice}
                   onChange={e => setFormData({...formData, discountPrice: e.target.value})}
                 />
               </div>

               <div className="grid grid-cols-2 gap-3">
                 <input 
                   required
                   type="number"
                   placeholder="Initial Stock" 
                   className="w-full bg-gray-50 border border-transparent rounded-xl p-4 text-[10px] font-black outline-none focus:bg-white focus:ring-2 focus:ring-red-500 transition-all"
                   value={formData.stock}
                   onChange={e => setFormData({...formData, stock: e.target.value})}
                 />
                 <input 
                   placeholder="Product SKU (Internal)" 
                   className="w-full bg-gray-50 border border-transparent rounded-xl p-4 text-[10px] font-black outline-none focus:bg-white focus:ring-2 focus:ring-red-500 transition-all"
                   value={formData.sku}
                   onChange={e => setFormData({...formData, sku: e.target.value})}
                 />
               </div>

               <div className="grid grid-cols-2 gap-3">
                  <select 
                    required
                    className="w-full bg-gray-50 border border-transparent rounded-xl p-4 text-[10px] font-black outline-none"
                    value={formData.categoryId}
                    onChange={e => setFormData({...formData, categoryId: e.target.value, subCategoryId: ''})}
                  >
                    <option value="">Choose Main Cluster</option>
                    {mainCategories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.name}</option>)}
                  </select>
                  <select 
                    className="w-full bg-gray-50 border border-transparent rounded-xl p-4 text-[10px] font-black outline-none"
                    disabled={!formData.categoryId}
                    value={formData.subCategoryId}
                    onChange={e => setFormData({...formData, subCategoryId: e.target.value})}
                  >
                    <option value="">Sub Cluster (Optional)</option>
                    {subCategories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.name}</option>)}
                  </select>
               </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Gallery Images ({formData.images.length})</p>
                    {formData.images.length > 0 && (
                      <button 
                        type="button"
                        onClick={() => setAiEnhancingImage(formData.images[formData.images.length - 1])}
                        className="text-[9px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 hover:indigo-700"
                      >
                        <Bot size={14} /> AI Professional Enhancement
                      </button>
                    )}
                  </div>
                  <div className="flex gap-3 overflow-x-auto py-4 scroll-smooth scrollbar-hide">
                     {formData.images.map((img, i) => (
                       <div key={i} className="relative w-28 h-28 shrink-0 group">
                         <img src={img} className="w-full h-full object-cover rounded-[1.5rem] border border-gray-100 shadow-sm" />
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-[1.5rem]">
                            <button type="button" onClick={() => setAiEnhancingImage(img)} className="bg-white text-indigo-600 p-2 rounded-xl shadow-lg"><Bot size={16} /></button>
                            <button type="button" onClick={() => setFormData({...formData, images: formData.images.filter((_, idx) => idx !== i)})} className="bg-red-600 text-white p-2 rounded-xl shadow-lg"><Trash2 size={16} /></button>
                         </div>
                       </div>
                     ))}
                     <label className="w-28 h-28 bg-gray-50 rounded-[1.5rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-300 cursor-pointer shrink-0 hover:bg-white hover:border-indigo-200 transition-all group">
                       <Upload size={24} className="group-hover:text-indigo-400" />
                       <span className="text-[8px] font-black uppercase mt-1">Upload Photo</span>
                       <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                     </label>
                  </div>
                </div>

                <AnimatePresence>
                  {aiEnhancingImage && (
                    <AIEnhancementModal 
                      image={aiEnhancingImage}
                      categories={categories}
                      onClose={() => setAiEnhancingImage(null)}
                      onComplete={(data) => {
                        setFormData({
                          ...formData,
                          name: data.name || formData.name,
                          description: data.description || formData.description,
                          price: data.price ? String(data.price) : formData.price,
                          categoryId: data.categoryId || formData.categoryId,
                          images: formData.images.map(img => img === aiEnhancingImage ? data.imageUrl : img)
                        });
                        setAiEnhancingImage(null);
                      }}
                    />
                  )}
                </AnimatePresence>

               <button 
                 type="submit" 
                 disabled={loading}
                 className="w-full bg-red-700 text-white font-black py-4.5 rounded-2xl uppercase tracking-[0.2em] text-[11px] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2"
               >
                 {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                 Finalize & Launch Product
               </button>
            </motion.form>
          )}
       </AnimatePresence>

       <div className="space-y-4">
          <div className="flex bg-white rounded-2xl border border-gray-100 p-1">
             {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
               <button 
                 key={f}
                 onClick={() => setFilter(f)}
                 className={cn(
                   "flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all",
                   filter === f ? "bg-gray-900 text-white" : "text-gray-400"
                 )}
               >
                 {f}
               </button>
             ))}
          </div>

          <div className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
             <input 
               type="text" 
               placeholder="Search product name or SKU..." 
               className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-red-500 shadow-sm"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
          </div>
       </div>

       <div className="space-y-3">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Inventory Control ({filteredProducts.length})</h3>
          {filteredProducts.map(p => (
            <div key={p.productId} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-4">
               <div className="flex items-start gap-4">
                  <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'} className="w-16 h-16 rounded-xl object-cover shrink-0 border border-gray-50" alt="" />
                  <div className="flex-1 min-w-0">
                     <div className="flex items-center justify-between">
                        <p className="text-xs font-black text-gray-900 truncate uppercase tracking-tight">{p.name || (p as any).title || 'Product'}</p>
                        <span className={cn(
                          "text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest border",
                          p.status === 'approved' ? "bg-green-50 text-green-600 border-green-100" :
                          p.status === 'pending' ? "bg-orange-50 text-orange-600 border-orange-100" :
                          "bg-red-50 text-red-600 border-red-100"
                        )}>
                          {p.status}
                        </span>
                     </div>
                     <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Rs. {p.price} • Stock: {p.stock} • SKU: {p.sku || 'N/A'}</p>
                     
                     <div className="flex items-center gap-3 mt-3">
                        {p.status !== 'approved' && (
                          <button onClick={() => handleAction('products', p.productId, { status: 'approved' })} className="bg-green-600 text-white p-2 rounded-xl shadow-lg active:scale-95"><Check size={14} /></button>
                        )}
                        {p.status === 'approved' && (
                          <button onClick={() => handleAction('products', p.productId, { status: 'rejected' })} className="bg-orange-600 text-white p-2 rounded-xl shadow-lg active:scale-95"><Ban size={14} /></button>
                        )}
                        <button onClick={() => handleDelete(p.productId)} className="bg-red-50 text-red-600 p-2 rounded-xl active:scale-95"><Trash2 size={14} /></button>
                        
                        <div className="flex gap-1 ml-auto">
                           <button 
                              onClick={() => handleAction('products', p.productId, { trending: !p.trending })}
                              className={cn(
                                "px-2 py-1.5 rounded-lg text-[7px] font-black uppercase tracking-widest border transition-all",
                                p.trending ? "bg-red-600 text-white border-red-600" : "bg-white text-gray-400 border-gray-100"
                              )}
                           >
                              Trending
                           </button>
                           <button 
                              onClick={() => handleAction('products', p.productId, { flashSalePrice: p.flashSalePrice ? null : p.price * 0.8, flashSaleEnd: p.flashSalePrice ? null : new Date(Date.now() + 86400000).toISOString() })}
                              className={cn(
                                "px-2 py-1.5 rounded-lg text-[7px] font-black uppercase tracking-widest border transition-all",
                                p.flashSalePrice ? "bg-orange-600 text-white border-orange-600" : "bg-white text-gray-400 border-gray-100"
                              )}
                           >
                              Flash
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="text-center py-20 opacity-30">
               <ShoppingBag size={48} className="mx-auto mb-4" />
               <p className="text-[10px] font-black uppercase tracking-[0.3em]">No items found in mainframe</p>
            </div>
          )}
       </div>
    </motion.div>
  );
}

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
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Official Payout Gateway</p>
        </div>
        <div className="aspect-square bg-gray-50 rounded-2xl border-4 border-gray-100 p-4 flex items-center justify-center overflow-hidden">
          <img src={qr} className="w-full h-full object-contain" alt="QR Code" />
        </div>
        <button 
          onClick={onClose}
          className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[10px]"
        >
          Close Preview
        </button>
      </motion.div>
    </motion.div>
  );
}

function MerchantManager({ 
  vendors, 
  withdrawals, 
  handleAction,
  setVendors,
  setWithdrawals
}: { 
  vendors: Vendor[], 
  withdrawals: WithdrawalRequest[],
  handleAction: (col: string, id: string, data: any) => Promise<void>,
  setVendors: React.Dispatch<React.SetStateAction<Vendor[]>>,
  setWithdrawals: React.Dispatch<React.SetStateAction<WithdrawalRequest[]>>
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'suspended'>('all');
  const [showPayouts, setShowPayouts] = useState(false);
  const [selectedQR, setSelectedQR] = useState<{ qr: string, title: string } | null>(null);
  const [selectedKYC, setSelectedKYC] = useState<Vendor | null>(null);

  const filteredVendors = vendors.filter(v => {
    const bName = (v?.businessName || (v as any)?.name || '').toLowerCase();
    const phone = v?.kyc?.phone || '';
    const query = (searchTerm || '').toLowerCase();
    const matchesSearch = bName.includes(query) || phone.includes(searchTerm);
    const matchesFilter = filter === 'all' || v?.status === filter;
    return matchesSearch && matchesFilter;
  });

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
  const totalUnsettled = vendors.reduce((acc, v) => acc + (v.walletBalance || 0), 0);

  return (
    <motion.div key="merchants" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
       <AnimatePresence>
         {selectedQR && (
           <QRModal 
             qr={selectedQR.qr} 
             title={selectedQR.title} 
             onClose={() => setSelectedQR(null)} 
           />
         )}
       </AnimatePresence>

       {/* Financial Summary Overlay */}
       <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-900 p-5 rounded-3xl text-white shadow-xl shadow-gray-200">
             <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">Unsettled Commissions</p>
             <p className="text-sm font-black">Rs. {totalUnsettled.toLocaleString()}</p>
          </div>
          <button 
            onClick={() => setShowPayouts(!showPayouts)}
            className={cn(
              "p-5 rounded-3xl transition-all border flex flex-col justify-center",
              showPayouts ? "bg-red-600 text-white border-red-600 shadow-xl shadow-red-100" : "bg-white text-gray-900 border-gray-100 shadow-sm"
            )}
          >
             <p className={cn("text-[8px] font-black uppercase tracking-widest mb-1 leading-none", showPayouts ? "text-red-100" : "text-gray-400")}>Payout Queue</p>
             <div className="flex items-center gap-2">
                <p className="text-sm font-black">{pendingWithdrawals.length} Pending</p>
                {pendingWithdrawals.length > 0 && <span className="w-2 h-2 bg-white rounded-full animate-pulse" />}
             </div>
          </button>
       </div>

       <AnimatePresence mode="wait">
          {showPayouts ? (
            <motion.div key="payouts" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-3">
               <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Payout Moderation</h3>
               {pendingWithdrawals.map(w => {
                 const vendor = vendors.find(v => v.vendorId === w.vendorId);
                 return (
                   <div key={w.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center"><Wallet size={20} /></div>
                         <div>
                            <div className="flex items-center gap-2">
                               <p className="text-[10px] font-black text-gray-900 uppercase">{vendor?.businessName || 'Unknown'}</p>
                               <span className="text-[8px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded uppercase">{w.method}</span>
                            </div>
                            <p className="text-xs font-black text-green-600">Rs. {w.amount.toLocaleString()}</p>
                             {vendor && (w.method === 'khalti' || w.method === 'esewa') && (
                               <button 
                                 onClick={() => {
                                   const qr = w.method === 'khalti' ? vendor.khaltiQrCode : vendor.esewaQrCode;
                                   if (qr) setSelectedQR({ qr, title: `${vendor.businessName} - ${w.method.toUpperCase()}` });
                                   else alert("Vendor has not uploaded this QR code yet.");
                                 }}
                                 className="text-[8px] font-black text-blue-600 uppercase mt-1 flex items-center gap-1 hover:underline"
                               >
                                 <QrCode size={10} /> View Vendor QR
                               </button>
                             )}
                         </div>
                      </div>
                      <div className="flex gap-2">
                         <label className="bg-green-600 text-white p-2 rounded-xl active:scale-90 cursor-pointer shadow-lg shadow-green-100 flex items-center justify-center">
                            <Check size={16} />
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = async () => {
                                     const proof = await compressImage(reader.result as string, 800, 800, 0.7);
                                     await updateDoc(doc(db, 'withdrawals', w.id), { 
                                       status: 'completed',
                                       paymentProof: proof
                                     });
                                     // No need to deduct here as it's deducted at request time in VendorDashboard
                                     setWithdrawals(prev => prev.map(item => item.id === w.id ? { ...item, status: 'completed', paymentProof: proof } : item));
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                         </label>
                         <button onClick={async () => {
                             if (confirm("Reject this payout request? Balance will be refunded to vendor.")) {
                               await handleAction('withdrawals', w.id, { status: 'rejected' });
                               await updateDoc(doc(db, 'vendors', w.vendorId), {
                                 walletBalance: increment(w.amount)
                               });
                               setWithdrawals(prev => prev.map(item => item.id === w.id ? { ...item, status: 'rejected' } : item));
                             }
                          }} className="bg-red-50 text-red-600 p-2 rounded-xl active:scale-90"><X size={16} /></button>
                      </div>
                   </div>
                 );
               })}
               {pendingWithdrawals.length === 0 && (
                 <p className="text-center py-10 text-[9px] font-black text-gray-300 uppercase tracking-widest">No Payout Requests Pending</p>
               )}
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
               <div className="flex gap-3">
                  <div className="flex-1 relative">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                     <input 
                       type="text" 
                       placeholder="Filter merchants..." 
                       className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-red-500 shadow-sm"
                       value={searchTerm}
                       onChange={e => setSearchTerm(e.target.value)}
                     />
                  </div>
               </div>

               <div className="flex bg-white rounded-2xl border border-gray-100 p-1">
                  {(['all', 'pending', 'approved', 'suspended'] as const).map(f => (
                    <button 
                      key={f}
                      onClick={() => setFilter(f)}
                      className={cn(
                        "flex-1 py-3 text-[8px] font-black uppercase tracking-widest rounded-xl transition-all",
                        filter === f ? "bg-gray-900 text-white" : "text-gray-400"
                      )}
                    >
                      {f}
                    </button>
                  ))}
               </div>

               <div className="space-y-3">
                  {filteredVendors.map(v => (
                    <div key={v.vendorId} className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
                       <div className="flex gap-4">
                          <div className="relative">
                             <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                                {v.logo ? (
                                  <img src={v.logo} className="w-full h-full object-cover" alt="" />
                                ) : (
                                  <Store size={28} className="text-gray-300" />
                                )}
                             </div>
                             <span className={cn(
                               "absolute -top-2 -right-2 w-6 h-6 rounded-lg text-white flex items-center justify-center shadow-lg border-2 border-white",
                               v.status === 'approved' ? "bg-green-600" : v.status === 'pending' ? "bg-orange-600" : "bg-red-600"
                             )}>
                                {v.status === 'approved' ? <CheckCircle2 size={12} /> : v.status === 'pending' ? <AlertTriangle size={12} /> : <Ban size={12} />}
                             </span>
                          </div>
                          <div className="flex-1 min-w-0">
                             <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black text-gray-900 truncate uppercase tracking-tight">{v.businessName}</h4>
                                <p className="text-[10px] font-black text-red-600">Rs. {(v.walletBalance || 0).toLocaleString()}</p>
                             </div>
                             <p className="text-[9px] font-bold text-gray-400 mt-0.5">{v.kyc?.phone || 'No contact'} • {v.totalSales || 0} Sales</p>
                             <div className="flex gap-2 mt-3">
                                {v.status !== 'approved' && (
                                  <button onClick={() => handleAction('vendors', v.vendorId, { status: 'approved' })} className="flex-1 bg-green-600 text-white text-[9px] font-black py-2 rounded-xl shadow-lg shadow-green-100 uppercase tracking-widest">Approve</button>
                                )}
                                {v.status !== 'suspended' && (
                                  <button onClick={() => handleAction('vendors', v.vendorId, { status: 'suspended' })} className="px-3 bg-red-50 text-red-600 py-2 rounded-xl active:scale-95"><Ban size={14} /></button>
                                )}
                                <button onClick={() => setSelectedKYC(v)} className="px-3 bg-blue-50 text-blue-600 py-2 rounded-xl active:scale-95" title="View Document Registry"><Eye size={14} /></button>
                                 <button 
                                   onClick={async () => {
                                     if(confirm(`Reset all stats for ${v.businessName}?`)) {
                                       await updateDoc(doc(db, 'vendors', v.vendorId), {
                                         totalSales: 0,
                                         totalRevenue: 0,
                                         walletBalance: 0
                                       });
                                       setVendors(prev => prev.map(item => item.vendorId === v.vendorId ? { ...item, totalSales: 0, totalRevenue: 0, walletBalance: 0 } : item));
                                     }
                                   }}
                                   className="px-3 bg-gray-50 text-gray-400 py-2 rounded-xl active:scale-95 hover:text-red-600"
                                   title="Reset Stats"
                                 >
                                   <Trash2 size={14} />
                                 </button>
                                 {v.khaltiQrCode && (
                                   <button 
                                     onClick={() => setSelectedQR({ qr: v.khaltiQrCode!, title: `${v.businessName} - KHALTI` })}
                                     className="px-3 bg-purple-50 text-purple-600 py-2 rounded-xl active:scale-95"
                                     title="View Khalti QR"
                                   >
                                     <QrCode size={14} />
                                   </button>
                                 )}
                                 {v.esewaQrCode && (
                                   <button 
                                     onClick={() => setSelectedQR({ qr: v.esewaQrCode!, title: `${v.businessName} - ESEWA` })}
                                     className="px-3 bg-green-50 text-green-600 py-2 rounded-xl active:scale-95"
                                     title="View eSewa QR"
                                   >
                                     <QrCode size={14} />
                                   </button>
                                 )}
                             </div>
                          </div>
                       </div>
                    </div>
                  ))}
                  {filteredVendors.length === 0 && (
                    <div className="text-center py-20 opacity-20">
                       <Store size={48} className="mx-auto mb-4" />
                       <p className="text-[10px] font-black uppercase tracking-[0.4em]">No merchants found</p>
                    </div>
                  )}
               </div>
            </motion.div>
          )}
       </AnimatePresence>

       {selectedKYC && (
         <motion.div 
           initial={{ opacity: 0 }} 
           animate={{ opacity: 1 }} 
           exit={{ opacity: 0 }} 
           className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-6"
         >
           <motion.div 
             initial={{ scale: 0.95, y: 20 }} 
             animate={{ scale: 1, y: 0 }} 
             className="bg-white rounded-[32px] w-full max-w-md p-6 overflow-y-auto max-h-[90vh] space-y-6 text-left font-sans"
           >
             <div className="flex justify-between items-start">
               <div>
                 <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded bg-orange-100 text-orange-700">
                   KYC Verification Registry
                 </span>
                 <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mt-2">{selectedKYC.businessName}</h3>
                 <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                   Operating Country: {selectedKYC.country || 'Nepal'}
                 </p>
               </div>
               <button 
                 onClick={() => setSelectedKYC(null)} 
                 className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-black text-gray-500 hover:bg-gray-200"
               >
                 ✕
               </button>
             </div>

             <div className="space-y-4 text-xs font-medium text-gray-600">
               <div className="bg-gray-50 p-4 rounded-2xl space-y-2">
                 <div className="flex justify-between border-b border-gray-100 pb-1.5 font-sans">
                   <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">Mobile Terminal</span>
                   <span className="font-bold text-gray-950">{selectedKYC.kyc?.phone || 'N/A'}</span>
                 </div>
                 <div className="flex justify-between border-b border-gray-100 pb-1.5 font-sans">
                   <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">Merchant Address</span>
                   <span className="font-bold text-gray-950">{selectedKYC.kyc?.address || 'N/A'}</span>
                 </div>
                 {selectedKYC.country === 'India' && (
                   <div className="flex justify-between font-sans">
                     <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">India Govt PAN</span>
                     <span className="font-black text-orange-600">{selectedKYC.kyc?.panNumber || 'N/A'}</span>
                   </div>
                 )}
               </div>

               <div className="space-y-3">
                 <span className="text-[9px] font-black uppercase tracking-widest text-gray-300 block px-1 font-sans">Verification Documents</span>
                 
                 {selectedKYC.country === 'India' ? (
                   <div className="grid grid-cols-1 gap-3">
                     <div>
                       <span className="text-[8px] font-black uppercase tracking-wider text-gray-400 block mb-1 font-sans">1. Aadhaar Card Photo</span>
                       <div className="aspect-video rounded-2xl overflow-hidden border border-gray-100 shadow-inner bg-gray-100">
                         <img src={selectedKYC.kyc?.citizenshipFront} className="w-full h-full object-cover" alt="Aadhaar Card" referrerPolicy="no-referrer" />
                       </div>
                     </div>
                     <div>
                       <span className="text-[8px] font-black uppercase tracking-wider text-gray-400 block mb-1 font-sans">2. PAN Card Photo</span>
                       <div className="aspect-video rounded-2xl overflow-hidden border border-gray-100 shadow-inner bg-gray-100">
                         <img src={selectedKYC.kyc?.panVatDoc} className="w-full h-full object-cover" alt="PAN Card" referrerPolicy="no-referrer" />
                       </div>
                     </div>
                     <div>
                       <span className="text-[8px] font-black uppercase tracking-wider text-gray-400 block mb-1 font-sans">3. Store Front / Shop Photo</span>
                       <div className="aspect-video rounded-2xl overflow-hidden border border-gray-100 shadow-inner bg-gray-100">
                         <img src={selectedKYC.kyc?.citizenshipBack} className="w-full h-full object-cover" alt="Shop Photo" referrerPolicy="no-referrer" />
                       </div>
                     </div>
                   </div>
                 ) : (
                   <div className="grid grid-cols-1 gap-3">
                     <div>
                       <span className="text-[8px] font-black uppercase tracking-wider text-gray-400 block mb-1 font-sans">1. Nepal Citizenship Front</span>
                       <div className="aspect-video rounded-2xl overflow-hidden border border-gray-100 shadow-inner bg-gray-100">
                         <img src={selectedKYC.kyc?.citizenshipFront} className="w-full h-full object-cover" alt="Citizenship Front" referrerPolicy="no-referrer" />
                       </div>
                     </div>
                     <div>
                       <span className="text-[8px] font-black uppercase tracking-wider text-gray-400 block mb-1 font-sans">2. Nepal Citizenship Back</span>
                       <div className="aspect-video rounded-2xl overflow-hidden border border-gray-100 shadow-inner bg-gray-100">
                         <img src={selectedKYC.kyc?.citizenshipBack} className="w-full h-full object-cover" alt="Citizenship Back" referrerPolicy="no-referrer" />
                       </div>
                     </div>
                     <div>
                       <span className="text-[8px] font-black uppercase tracking-wider text-gray-400 block mb-1 font-sans">3. Shop Front Photo</span>
                       <div className="aspect-video rounded-2xl overflow-hidden border border-gray-100 shadow-inner bg-gray-100">
                         <img src={selectedKYC.kyc?.panVatDoc} className="w-full h-full object-cover" alt="Shop Photo" referrerPolicy="no-referrer" />
                       </div>
                     </div>
                   </div>
                 )}
               </div>
             </div>

             <div className="flex gap-3 pt-2">
               <button 
                 onClick={() => setSelectedKYC(null)}
                 className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-500 font-black rounded-2xl uppercase tracking-widest text-[9px] font-sans"
               >
                 Dismiss
               </button>
               {selectedKYC.status !== 'approved' && (
                 <button 
                   onClick={async () => {
                     await handleAction('vendors', selectedKYC.vendorId, { status: 'approved' });
                     setSelectedKYC(null);
                   }}
                   className="flex-1 py-3.5 bg-green-600 hover:bg-green-700 text-white font-black rounded-2xl uppercase tracking-widest text-[9px] font-sans shadow-lg shadow-green-100"
                 >
                   Set Approved
                 </button>
               )}
             </div>
           </motion.div>
         </motion.div>
       )}
    </motion.div>
  );
}

export function LogisticsManager({ riders, orders, handleAction }: { riders: Rider[], orders: Order[], handleAction: (col: string, id: string, data: any) => Promise<void> }) {
  const [activeTab, setActiveTab] = useState<'riders' | 'assignments' | 'map'>('riders');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
  const [selectedReviewRider, setSelectedReviewRider] = useState<Rider | null>(null);

  const filteredRiders = riders.filter(r => {
    const q = (searchTerm || '').toLowerCase();
    const uId = (r?.userId || '').toLowerCase();
    const plate = (r?.vehiclePlate || '').toLowerCase();
    return uId.includes(q) || plate.includes(q);
  });

  const unassignedOrders = orders.filter(o => !o.riderId && (o.status === 'confirmed' || o.status === 'processing'));
  const activeDeliveries = orders.filter(o => o.riderId && o.status !== 'delivered' && o.status !== 'cancelled');

  return (
    <motion.div key="logistics" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
       <div className="flex bg-white rounded-2xl border border-gray-100 p-1">
          {[
            { id: 'riders', label: 'Riders', icon: Users },
            { id: 'assignments', label: 'Missions', icon: Package },
            { id: 'map', label: 'Operations', icon: Navigation }
          ].map(t => (
            <button 
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={cn(
                "flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2",
                activeTab === t.id ? "bg-gray-900 text-white" : "text-gray-400"
              )}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
       </div>

       {activeTab === 'riders' && (
         <div className="space-y-4">
            <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
               <input 
                 type="text" 
                 placeholder="Search personnel or vehicle..." 
                 className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold outline-none shadow-sm"
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
               />
            </div>

            <div className="space-y-3">
               {filteredRiders.map(r => (
                 <div key={r.riderId} className="bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center text-white rotate-3 shadow-lg",
                            r.status === 'approved' ? "bg-green-600 shadow-green-100" : "bg-orange-600 shadow-orange-100"
                          )}>
                             <Bike size={24} />
                          </div>
                          <div>
                             <h4 className="text-xs font-black text-gray-900 uppercase">Unit: {r.vehiclePlate}</h4>
                             <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{r.vehicleType} • {r.status}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-black text-gray-900">Rating: {r.rating}/5</p>
                          <p className="text-[8px] font-bold text-gray-400 uppercase">{r.totalDeliveries} Completed</p>
                       </div>
                    </div>

                    <div className="flex gap-2">
                       {r.status === 'pending' && (
                         <button onClick={() => handleAction('riders', r.riderId, { status: 'approved' })} className="flex-1 bg-green-600 text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-green-100">Clear for Duty</button>
                       )}
                       {r.status === 'approved' && (
                         <button onClick={() => handleAction('riders', r.riderId, { status: 'suspended' })} className="flex-1 bg-red-50 text-red-600 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border border-red-100">Suspend Access</button>
                       )}
                       {r.status === 'suspended' && (
                         <button onClick={() => handleAction('riders', r.riderId, { status: 'approved' })} className="flex-1 bg-orange-600 text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-widest">Reactivate</button>
                       )}
                       <button 
                         onClick={() => setSelectedReviewRider(r)}
                         className="px-4 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 transition-colors"
                       >
                         <Eye size={16} />
                       </button>
                    </div>
                 </div>
               ))}
            </div>
         </div>
       )}

        {activeTab === 'assignments' && (
          <div className="space-y-6">
             <div className="space-y-3">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Unassigned Manifests ({unassignedOrders.length})</h4>
                {unassignedOrders.map(o => (
                  <div key={o.orderId} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/50 space-y-4">
                     <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                              <MapPin size={20} />
                           </div>
                           <div>
                              <p className="text-[8px] font-black text-gray-400 uppercase">Sector: {o.shippingAddress.district}</p>
                              <p className="text-xs font-black text-gray-900 tracking-tight">#{o.orderId.slice(-8)}</p>
                           </div>
                        </div>
                        <span className="text-[8px] font-black bg-green-50 text-green-600 px-3 py-1 rounded-xl uppercase border border-green-100">Ready for Op</span>
                     </div>
                     
                     <div className="bg-gray-50 p-4 rounded-2xl space-y-2">
                        <p className="text-[10px] font-black text-gray-900 uppercase leading-snug">
                           {o.shippingAddress.area ? `${o.shippingAddress.area}, ` : ''}{o.shippingAddress.city}, W-{o.shippingAddress.ward}
                        </p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">
                           {o.shippingAddress.streetAddress}
                        </p>
                        <div className="pt-2 flex items-center gap-4">
                           <div className="flex items-center gap-1">
                              <Compass size={12} className="text-gray-300" />
                              <span className="text-[8px] font-black text-gray-400">{o.shippingAddress.latitude?.toFixed(4)}, {o.shippingAddress.longitude?.toFixed(4)}</span>
                           </div>
                           <button 
                             onClick={() => window.open(`https://www.google.com/maps?q=${o.shippingAddress.latitude},${o.shippingAddress.longitude}`, '_blank')}
                             className="text-[8px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                           >
                              Inspect Location
                           </button>
                        </div>
                     </div>

                     <div className="pt-2">
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-3 flex items-center gap-2">
                           <Bike size={14} className="text-orange-600" /> Proximate Units
                        </p>
                        <div className="flex flex-wrap gap-2">
                           {riders.filter(r => r.status === 'approved' && r.isAvailable).map(r => (
                             <button 
                               key={r.riderId}
                               onClick={() => handleAction('orders', o.orderId, { 
                                 riderId: r.userId, 
                                 deliveryStatus: 'assigned',
                                 assignedAt: new Date().toISOString()
                               })}
                               className="bg-white hover:bg-gray-900 hover:text-white border border-gray-100 transition-all px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2 group"
                             >
                               {r.vehiclePlate}
                               <span className="bg-gray-100 group-hover:bg-white/20 px-1.5 py-0.5 rounded text-[7px]">{r.activeOrdersCount || 0}</span>
                             </button>
                           ))}
                           {riders.filter(r => r.status === 'approved' && r.isAvailable).length === 0 && (
                             <p className="text-[9px] font-black text-red-500 uppercase italic bg-red-50 w-full p-3 rounded-xl border border-red-100">Negative Active Units in Field</p>
                           )}
                        </div>
                     </div>
                  </div>
                ))}
             </div>

             <div className="space-y-3">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Live Missions ({activeDeliveries.length})</h4>
                {activeDeliveries.map(o => (
                  <div key={o.orderId} className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><Truck size={20} /></div>
                        <div>
                           <p className="text-[10px] font-black text-gray-900 uppercase">#{o.orderId.slice(-8)}</p>
                           <p className="text-[8px] font-bold text-gray-400 uppercase">Assigned To: {riders.find(r => r.userId === o.riderId)?.vehiclePlate || 'Unknown'}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-[9px] font-black text-orange-600 uppercase italic">{o.deliveryStatus?.replace('_', ' ')}</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'map' && isGoogleMapsKeyValid() && (
          <div className="bg-white rounded-[3rem] border-8 border-gray-50 overflow-hidden shadow-2xl h-[70vh] relative">
            <Map
              mapId="DEMO_MAP_ID"
              defaultCenter={{ lat: 27.7172, lng: 85.3240 }}
              defaultZoom={13}
              disableDefaultUI={true}
              style={{ width: '100%', height: '100%' }}
            >
              {riders.filter(r => r.currentLocation).map(r => (
                <AdvancedMarker 
                  key={r.riderId} 
                  position={{ lat: r.currentLocation!.latitude, lng: r.currentLocation!.longitude }}
                >
                   <div className="bg-orange-600 p-2 rounded-xl text-white shadow-xl rotate-3 border-2 border-white">
                      <Bike size={20} />
                   </div>
                </AdvancedMarker>
              ))}
              {orders.filter(o => o.shippingAddress.latitude && o.status !== 'delivered').map(o => (
                <AdvancedMarker 
                  key={o.orderId} 
                  position={{ lat: o.shippingAddress.latitude!, lng: o.shippingAddress.longitude! }}
                >
                   <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-xl -rotate-3 border-2 border-white">
                      <User size={20} />
                   </div>
                </AdvancedMarker>
              ))}
            </Map>
             
             <div className="absolute top-6 left-6 z-[1000] bg-white/90 backdrop-blur-md p-6 rounded-[2.5rem] border border-gray-100 shadow-2xl space-y-4 max-w-[240px]">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                   <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em]">C4 Intelligence Suite</h4>
                </div>
                <div className="space-y-3">
                   <div className="bg-gray-50 p-3 rounded-2xl flex items-center justify-between border border-gray-100">
                      <p className="text-[9px] font-black text-gray-400 uppercase">Field Units</p>
                      <span className="text-xs font-black text-gray-900">{riders.filter(r => r.isAvailable).length}</span>
                   </div>
                   <div className="bg-gray-50 p-3 rounded-2xl flex items-center justify-between border border-gray-100">
                      <p className="text-[9px] font-black text-gray-400 uppercase">Live Ops</p>
                      <span className="text-xs font-black text-gray-900">{activeDeliveries.length}</span>
                   </div>
                </div>
             </div>
          </div>
        )}

       {/* Rider Review Detail Modal */}
       <AnimatePresence>
          {selectedReviewRider && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
              onClick={() => setSelectedReviewRider(null)}
            >
               <motion.div 
                 initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                 className="bg-white rounded-[3rem] w-full max-w-2xl h-[85vh] overflow-hidden flex flex-col shadow-2xl"
                 onClick={e => e.stopPropagation()}
               >
                  <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                     <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-orange-600 rounded-2xl flex items-center justify-center text-white rotate-3 shadow-xl">
                           <Bike size={32} />
                        </div>
                        <div>
                           <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Unit: {selectedReviewRider.vehiclePlate}</h3>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{selectedReviewRider.vehicleType} • {selectedReviewRider.status}</p>
                        </div>
                     </div>
                     <button onClick={() => setSelectedReviewRider(null)} className="p-3 bg-white rounded-2xl shadow-sm border border-gray-50 hover:bg-red-50 hover:text-red-600 transition-colors"><X size={20} /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 space-y-8">
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { label: 'DELIVERIES', value: selectedReviewRider.totalDeliveries, color: 'text-green-600' },
                          { label: 'RATING', value: `${selectedReviewRider.rating}/5`, color: 'text-orange-600' },
                          { label: 'ACTIVE', value: selectedReviewRider.activeOrdersCount || 0, color: 'text-blue-600' },
                          { label: 'STATUS', value: selectedReviewRider.isAvailable ? 'ONLINE' : 'OFFLINE', color: selectedReviewRider.isAvailable ? 'text-green-600' : 'text-gray-400' }
                        ].map((s, i) => (
                          <div key={i} className="bg-gray-50 p-5 rounded-[2rem] border border-gray-100">
                             <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
                             <p className={cn("text-xl font-black", s.color)}>{s.value}</p>
                          </div>
                        ))}
                     </div>

                     <div className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                           <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Ops Path</h4>
                           {selectedReviewRider.currentLocation && (
                             <button className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1">
                               <Navigation size={12} /> Live Link Active
                             </button>
                           )}
                        </div>
                        <div className="h-48 rounded-[2rem] border border-gray-100 overflow-hidden relative">
                           {selectedReviewRider.currentLocation && isGoogleMapsKeyValid() ? (
                              <Map
                                 mapId="DEMO_MAP_ID"
                                 defaultCenter={{ lat: selectedReviewRider.currentLocation.latitude, lng: selectedReviewRider.currentLocation.longitude }} 
                                 defaultZoom={15} 
                                 disableDefaultUI={true}
                                 style={{ height: '100%', width: '100%' }}
                              >
                                 <AdvancedMarker position={{ lat: selectedReviewRider.currentLocation.latitude, lng: selectedReviewRider.currentLocation.longitude }}>
                                    <div className="bg-orange-600 p-2 rounded-xl text-white shadow-xl rotate-3 border-2 border-white">
                                       <Bike size={16} />
                                    </div>
                                 </AdvancedMarker>
                              </Map>
                           ) : (
                             <div className="h-full w-full bg-gray-50 flex flex-col items-center justify-center text-center opacity-40">
                                <Navigation size={32} className="mb-2" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Offline Channel<br/>No Location Data</p>
                             </div>
                           )}
                        </div>
                     </div>

                     <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Recent Missions</h4>
                        <div className="space-y-3">
                           {orders.filter(o => o.riderId === selectedReviewRider.userId).slice(0, 5).map(o => (
                             <div key={o.orderId} className="bg-gray-50 p-5 rounded-[2rem] border border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                   <div className={cn(
                                     "w-10 h-10 rounded-xl flex items-center justify-center",
                                     o.status === 'delivered' ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                                   )}>
                                      <Package size={20} />
                                   </div>
                                   <div>
                                      <p className="text-[10px] font-black text-gray-900 uppercase">#{o.orderId.slice(-8)}</p>
                                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{formatDate(o.createdAt)}</p>
                                   </div>
                                </div>
                                <div className="text-right">
                                   <p className={cn(
                                     "text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border",
                                     o.status === 'delivered' ? "bg-green-50 text-green-600 border-green-100" :
                                     o.status === 'cancelled' ? "bg-red-50 text-red-600 border-red-100" :
                                     "bg-orange-50 text-orange-600 border-orange-100"
                                   )}>
                                      {o.status}
                                   </p>
                                </div>
                             </div>
                           ))}
                           {orders.filter(o => o.riderId === selectedReviewRider.userId).length === 0 && (
                             <p className="text-[10px] text-gray-400 font-bold uppercase text-center py-6">No mission history recorded</p>
                           )}
                        </div>
                     </div>
                  </div>
               </motion.div>
            </motion.div>
          )}
       </AnimatePresence>
    </motion.div>
  );
}

function AISupportBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    
    try {
      const res = await fetch(getApiUrl('/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg] })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'model', content: data.content }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', content: "I'm having trouble connecting to the neural network. Please try again later or contact WhatsApp support: +9779700694631" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-[2rem] w-80 sm:w-96 h-[500px] shadow-2xl flex flex-col border border-gray-100 overflow-hidden mb-4"
          >
            <div className="bg-gray-900 p-6 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                     <Bot size={24} />
                  </div>
                  <div>
                     <p className="text-xs font-black text-white uppercase tracking-widest">NexaMart AI</p>
                     <p className="text-[8px] font-bold text-gray-400 uppercase">Always Active</p>
                  </div>
               </div>
               <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
               {messages.length === 0 && (
                 <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                    <Bot size={48} className="mb-4 text-indigo-600" />
                    <p className="text-[10px] font-black uppercase tracking-widest">How can I assist your logistics today?</p>
                 </div>
               )}
               {messages.map((m, i) => (
                 <div key={i} className={cn("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[80%] p-4 rounded-2xl text-xs font-medium shadow-sm",
                      m.role === 'user' ? "bg-indigo-600 text-white rounded-br-none" : "bg-white text-gray-900 rounded-bl-none border border-gray-100"
                    )}>
                       {m.content}
                    </div>
                 </div>
               ))}
               {loading && (
                 <div className="flex justify-start">
                    <div className="bg-white p-4 rounded-2xl rounded-bl-none border border-gray-100 italic text-[10px] text-gray-400 flex items-center gap-2">
                       <Loader2 size={12} className="animate-spin" /> Neural processing...
                    </div>
                 </div>
               )}
            </div>

            <div className="p-4 bg-white border-t border-gray-100">
               <div className="flex items-center gap-2">
                  <input 
                    placeholder="Describe your issue..." 
                    className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  />
                  <button onClick={sendMessage} className="bg-gray-900 text-white p-3 rounded-xl shadow-lg active:scale-95 transition-all"><ArrowUpRight size={18} /></button>
               </div>
               <button 
                onClick={() => window.open('https://wa.me/9779700694631', '_blank')}
                className="w-full mt-2 text-[8px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-center gap-1 hover:text-green-600 transition-colors"
               >
                 <Phone size={10} /> Escalate to WhatsApp Admin
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gray-900 text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-gray-400 hover:scale-105 active:scale-95 transition-all group relative"
      >
        <Bot size={28} className="group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full border-2 border-white animate-pulse" />
      </button>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [supportSessions, setSupportSessions] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resettingStats, setResettingStats] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [selectedCountry, setSelectedCountry] = useState<'All' | 'Nepal' | 'India'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeSegment, setActiveSegment] = useState<'all' | 'pending'>('all');
  const [selectedQR, setSelectedQR] = useState<{ qr: string, title: string } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const stats = {
    totalRevenue: vendors.reduce((acc, v) => acc + (v.totalRevenue || 0), 0),
    totalSales: vendors.reduce((acc, v) => acc + (v.totalSales || 0), 0),
    pendingVendors: vendors.filter(v => v.status === 'pending').length,
    pendingProducts: products.filter(p => !p.productId.startsWith('demo-') && p.status === 'pending').length,
    pendingWithdrawals: withdrawalRequests.filter(r => r.status === 'pending').length,
    pendingOrders: orders.filter(o => o.status === 'pending' || o.status === 'processing').length
  };

  useEffect(() => {
    setLoading(true);

    if (isQuotaActive()) {
      setVendors(fallbackVendors);
      setOrders(fallbackOrders);
      setProducts(fallbackProducts);
      setCategories(fallbackCategories);
      setBanners(fallbackBanners);
      setCoupons(fallbackCoupons);
      setRiders(fallbackRiders);
      setUsers(fallbackUsers);
      setWithdrawalRequests(fallbackWithdrawalRequests);
      setLoading(false);
    }
    
    const unsubVendors = onSnapshot(
      collection(db, 'vendors'), 
      (snap) => {
        const list = snap.docs.map(d => ({ ...d.data(), vendorId: d.id } as Vendor));
        setVendors(list.length > 0 ? list : fallbackVendors);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'vendors');
        setVendors(prev => prev.length > 0 ? prev : fallbackVendors);
      }
    );

    const unsubOrders = onSnapshot(
      query(collection(db, 'orders'), orderBy('createdAt', 'desc')), 
      (snap) => {
        const list = snap.docs.map(d => ({ ...d.data(), orderId: d.id } as Order));
        setOrders(list.length > 0 ? list : fallbackOrders);
        setLoading(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'orders');
        setOrders(prev => prev.length > 0 ? prev : fallbackOrders);
        setLoading(false);
      }
    );

    const unsubPayments = onSnapshot(
      query(collection(db, 'payments'), orderBy('createdAt', 'desc')),
      (snap) => {
        setPayments(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      },
      (err) => {
        setPayments([]);
      }
    );

    const unsubRiders = onSnapshot(
      collection(db, 'riders'), 
      (snap) => {
        const list = snap.docs.map(d => ({ ...d.data(), riderId: d.id } as Rider));
        setRiders(list.length > 0 ? list : fallbackRiders);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'riders');
        setRiders(prev => prev.length > 0 ? prev : fallbackRiders);
      }
    );

    const unsubSupport = onSnapshot(
      collection(db, 'support_sessions'), 
      (snap) => {
        setSupportSessions(snap.docs.map(d => ({ ...d.data(), sessionId: d.id })));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'support_sessions')
    );

    const unsubProducts = onSnapshot(
      collection(db, 'products'), 
      (snap) => {
        const list = snap.docs.map(d => ({ ...d.data(), productId: d.id } as Product));
        setProducts(list.length > 0 ? list : fallbackProducts);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'products');
        setProducts(prev => prev.length > 0 ? prev : fallbackProducts);
      }
    );

    const unsubCategories = onSnapshot(
      collection(db, 'categories'), 
      (snap) => {
        const list = snap.docs.map(d => ({ ...d.data(), categoryId: d.id } as Category));
        setCategories(list.length > 0 ? list : fallbackCategories);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'categories');
        setCategories(prev => prev.length > 0 ? prev : fallbackCategories);
      }
    );

    const unsubBanners = onSnapshot(
      collection(db, 'banners'), 
      (snap) => {
        const bList = snap.docs.map(d => ({ ...d.data(), bannerId: d.id } as Banner));
        bList.sort((a, b) => (a.order || 0) - (b.order || 0));
        setBanners(bList.length > 0 ? bList : fallbackBanners);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'banners');
        setBanners(prev => prev.length > 0 ? prev : fallbackBanners);
      }
    );

    const unsubCoupons = onSnapshot(
      collection(db, 'coupons'), 
      (snap) => {
        const list = snap.docs.map(d => ({ ...d.data(), couponId: d.id } as any));
        setCoupons(list.length > 0 ? list : fallbackCoupons);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'coupons');
        setCoupons(prev => prev.length > 0 ? prev : fallbackCoupons);
      }
    );

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const list = snap.docs.map(d => ({ ...d.data(), userId: d.id } as UserProfile));
        setUsers(list.length > 0 ? list : fallbackUsers);
      },
      (err) => {
        setUsers(prev => prev.length > 0 ? prev : fallbackUsers);
      }
    );

    const unsubWithdrawals = onSnapshot(
      collection(db, 'withdrawals'),
      (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as WithdrawalRequest));
        setWithdrawalRequests(list.length > 0 ? list : fallbackWithdrawalRequests);
      },
      (err) => {
        setWithdrawalRequests(prev => prev.length > 0 ? prev : fallbackWithdrawalRequests);
      }
    );

    return () => {
      unsubVendors();
      unsubOrders();
      unsubPayments();
      unsubRiders();
      unsubSupport();
      unsubProducts();
      unsubCategories();
      unsubBanners();
      unsubCoupons();
      unsubUsers();
      unsubWithdrawals();
    };
  }, []);

  const handleAction = async (collectionName: string, docId: string, data: any) => {
    const path = `${collectionName}/${docId}`;
    try {
      if (collectionName === 'vendors' && data.status === 'approved') {
        const vendor = vendors.find(v => v.vendorId === docId);
        if (vendor) {
          await setDoc(doc(db, 'users', vendor.vendorId), {
            role: 'vendor'
          }, { merge: true });
        }
      }
      
      await setDoc(doc(db, collectionName, docId), data, { merge: true });
      
      if (collectionName === 'riders' && data.status === 'approved') {
        const rider = riders.find(r => r.riderId === docId);
        if (rider) {
          await setDoc(doc(db, 'users', rider.userId), {
            role: 'rider'
          }, { merge: true });
        }
      }

      if (collectionName === 'vendors') {
        setVendors(prev => prev.map(v => v.vendorId === docId ? { ...v, ...data } : v));
      } else if (collectionName === 'products') {
        setProducts(prev => prev.map(p => p.productId === docId ? { ...p, ...data } : p));
      } else if (collectionName === 'withdrawals') {
        setWithdrawalRequests(prev => prev.map(r => r.id === docId ? { ...r, ...data } : r));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleResetFinancials = async () => {
    if(!confirm("CLEAN PLATFORM STATS?\n\nThis will reset GMV, Total Sales, and Revenue to zero.\n\nAll Order and Payout history will be DELETED.\n\nUsers and Products are SAFE.")) return;
    
    setResettingStats(true);
    try {
      const CHUNK_SIZE = 400;

      // 1. Reset all vendors
      const vChunks = [];
      for (let i = 0; i < vendors.length; i += CHUNK_SIZE) {
        const batch = writeBatch(db);
        vendors.slice(i, i + CHUNK_SIZE).forEach(v => {
          batch.update(doc(db, 'vendors', v.vendorId), {
            totalSales: 0,
            totalRevenue: 0,
            walletBalance: 0
          });
        });
        vChunks.push(batch.commit());
      }

      // 2. Delete all orders
      const oChunks = [];
      for (let i = 0; i < orders.length; i += CHUNK_SIZE) {
        const batch = writeBatch(db);
        orders.slice(i, i + CHUNK_SIZE).forEach(o => {
          batch.delete(doc(db, 'orders', o.orderId));
        });
        oChunks.push(batch.commit());
      }

      // 3. Delete all withdrawals
      const wSnap = await getDocs(collection(db, 'withdrawals'));
      const wChunks = [];
      if (!wSnap.empty) {
        const docs = wSnap.docs;
        for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
          const batch = writeBatch(db);
          docs.slice(i, i + CHUNK_SIZE).forEach(d => {
            batch.delete(d.ref);
          });
          wChunks.push(batch.commit());
        }
      }

      // 4. Reset all coupons
      const cpChunks = [];
      for (let i = 0; i < coupons.length; i += CHUNK_SIZE) {
        const batch = writeBatch(db);
        coupons.slice(i, i + CHUNK_SIZE).forEach(cp => {
          batch.update(doc(db, 'coupons', cp.couponId), {
            usedCount: 0
          });
        });
        cpChunks.push(batch.commit());
      }

      await Promise.all([...vChunks, ...oChunks, ...wChunks, ...cpChunks]);
      alert("Platform financials successfully cleaned. System rebooting...");
      window.location.reload();
    } catch (err) {
      console.error("Purge failure:", err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('insufficient permissions')) {
        alert("PERMISSION DENIED: You do not have authority to purge mainframe data. Check Security Rules.");
      } else {
        alert("PURGE ERROR: " + msg);
      }
    } finally {
      setResettingStats(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-xs font-black text-gray-400 animate-pulse uppercase tracking-[0.2em] min-h-screen flex items-center justify-center">Loading Command Center...</div>;

  const tabs = [
    { id: 'overview', label: 'Dashboard', icon: Grid },
    { id: 'orders', label: 'Orders', icon: FileText, count: stats.pendingOrders },
    { id: 'products', label: 'Products', icon: ShoppingBag, count: stats.pendingProducts },
    { id: 'categories', label: 'Categories', icon: Layers },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'vendors', label: 'Vendors', icon: Store, count: stats.pendingVendors },
    { id: 'riders', label: 'Riders', icon: Truck, count: riders.filter(r => r.status === 'pending').length },
    { id: 'banners', label: 'Banners', icon: ImageIcon },
    { id: 'coupons', label: 'Coupons', icon: Ticket },
    { id: 'locations', label: 'Service Areas', icon: MapPin },
    { id: 'cms', label: 'Reports', icon: TrendingUp },
    { id: 'support', label: 'Notifications', icon: Bell, count: supportSessions.filter(s => s.status === 'active').length },
    { id: 'withdrawals', label: 'Withdraw Requests', icon: DollarSign, count: stats.pendingWithdrawals },
    { id: 'admin-account', label: 'Settings', icon: Settings },
  ];

  const handleLogout = async () => {
    if (confirm("Sign out from mainframe?")) {
      await signOut(auth);
    }
  };

  // Filters based on geography
  const filteredOrders = orders.filter(o => {
    if (selectedCountry === 'All') return true;
    const country = o.shippingAddress?.country || o.country || '';
    return country.toLowerCase() === selectedCountry.toLowerCase();
  });

  const filteredUsers = users.filter(u => {
    if (selectedCountry === 'All') return true;
    return u.country === selectedCountry;
  });

  const filteredVendors = vendors.filter(v => {
    if (selectedCountry === 'All') return true;
    return (v as any).country === selectedCountry || users.find(usr => usr.userId === v.vendorId)?.country === selectedCountry;
  });

  const filteredRiders = riders.filter(r => {
    if (selectedCountry === 'All') return true;
    return users.find(usr => usr.userId === r.userId)?.country === selectedCountry;
  });

  const filteredProducts = products.filter(p => {
    if (selectedCountry === 'All') return true;
    const vendor = vendors.find(v => v.vendorId === p.vendorId);
    return (vendor as any)?.country === selectedCountry || (p as any).country === selectedCountry;
  });

  const currencySymbol = selectedCountry === 'India' ? '₹' : 'Rs.';

  const dStats = {
    totalRevenue: filteredOrders.filter(o => o.status === 'delivered' || (o.status as string) === 'completed' || (o.status as string) === 'on-the-way').reduce((acc, o) => acc + ((o as any).grandTotal || o.totalAmount || 0), 0) || filteredVendors.reduce((acc, v) => acc + (v.totalRevenue || 0), 0),
    totalOrders: filteredOrders.length,
    totalUsers: filteredUsers.length,
    totalVendors: filteredVendors.length,
    totalRiders: filteredRiders.length,
    
    pendingOrdersCount: filteredOrders.filter(o => o.status === 'pending').length,
    processingOrdersCount: filteredOrders.filter(o => o.status === 'processing' || o.status === 'confirmed').length,
    deliveredOrdersCount: filteredOrders.filter(o => o.status === 'delivered' || (o.status as string) === 'completed' || (o.status as string) === 'on-the-way').length,
    cancelledOrdersCount: filteredOrders.filter(o => o.status === 'cancelled' || (o.status as string) === 'rejected').length,

    activeWithdrawRequests: withdrawalRequests.filter(r => {
      if (r.status !== 'pending') return false;
      if (selectedCountry === 'All') return true;
      const vendor = vendors.find(v => v.vendorId === r.vendorId);
      return (vendor as any)?.country === selectedCountry;
    }).length,
  };

  // Sales Curve computation
  const getSalesChartPoints = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const presetAmounts = [12000, 19000, 15000, 25000, 22000, 30000, 34000];
    const data = days.map((day, idx) => {
      const dayOrders = filteredOrders.filter(o => {
        if (!o.createdAt) return false;
        let d: Date;
        if (typeof (o.createdAt as any).toDate === 'function') {
          d = (o.createdAt as any).toDate();
        } else {
          d = new Date(o.createdAt);
        }
        return d.getDay() === idx;
      });
      const sum = dayOrders.reduce((acc, o) => acc + ((o as any).grandTotal || o.totalAmount || 0), 0);
      return {
        label: day,
        amount: sum > 0 ? sum : presetAmounts[idx] * (selectedCountry === 'All' ? 2 : 1)
      };
    });
    return data;
  };

  const chartData = getSalesChartPoints();
  const maxSaleAmount = Math.max(...chartData.map(d => d.amount)) || 50000;

  const points = chartData.map((d, i) => ({
    x: 45 + i * 65,
    y: 155 - (d.amount / maxSaleAmount) * 115
  }));
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = linePath ? `${linePath} L ${points[points.length - 1].x} 165 L ${points[0].x} 165 Z` : '';

  // Circular segments donut calculation
  const donutRadius = 35;
  const donutCirc = 2 * Math.PI * donutRadius; // ~219.9
  const orderStatusTotal = (dStats.pendingOrdersCount + dStats.processingOrdersCount + dStats.deliveredOrdersCount + dStats.cancelledOrdersCount) || 120;
  
  const segments = [
    { label: 'Delivered', value: dStats.deliveredOrdersCount || 65, color: '#10b981' },
    { label: 'Processing', value: dStats.processingOrdersCount || 25, color: '#3b82f6' },
    { label: 'Pending', value: dStats.pendingOrdersCount || 20, color: '#f97316' },
    { label: 'Cancelled', value: dStats.cancelledOrdersCount || 10, color: '#ef4444' }
  ];

  let currentOffset = 0;
  const donutSegments = segments.map(seg => {
    const percentage = seg.value / orderStatusTotal;
    const dashLength = percentage * donutCirc;
    const dashOffset = currentOffset;
    currentOffset -= dashLength;
    return {
      ...seg,
      percentage,
      dashArray: `${dashLength} ${donutCirc}`,
      dashOffset
    };
  });

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden w-full">
      {/* Premium Dark Left Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-[#0B1528] text-slate-400 border-r border-[#1E293B] transition-all duration-300 transform lg:translate-x-0 lg:static lg:h-screen lg:shrink-0",
        mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Branding header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-[#1E293B] shrink-0">
          <div className="bg-gradient-to-tr from-orange-500 to-amber-500 p-2.5 rounded-xl text-white shadow-lg shadow-orange-500/20">
            <Store size={20} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-xs font-black tracking-wider text-white uppercase leading-none">NEXAMART</h2>
            <p className="text-[8px] font-black tracking-widest text-orange-400 uppercase mt-1">Nepal + India Market</p>
          </div>
        </div>

        {/* Sidebar Nav items */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5 scrollbar-thin">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMobileSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer group",
                  isActive 
                    ? "bg-gradient-to-r from-orange-500/10 to-transparent text-orange-500 border-l-4 border-orange-500 font-extrabold" 
                    : "hover:bg-white/[0.03] text-slate-400 hover:text-slate-100"
                )}
              >
                <div className="flex items-center gap-3">
                  <tab.icon size={15} className={cn("transition-colors", isActive ? "text-orange-500" : "text-slate-500 group-hover:text-slate-300")} />
                  <span>{tab.label}</span>
                </div>
                {tab.count && tab.count > 0 && (
                  <span className="bg-red-500 text-[8px] font-black text-white px-2 py-0.5 rounded-full">{tab.count}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Auth Mode & Sign out footer */}
        <div className="p-4 border-t border-[#1E293B] space-y-3 shrink-0">
          <div className="bg-[#14233c] p-3 rounded-xl border border-blue-500/10 flex items-center gap-3">
             <div className="bg-orange-500/10 p-2 rounded-lg text-orange-400">
               <Shield size={16} />
             </div>
             <div>
               <p className="text-[10px] font-black text-white uppercase tracking-tight">Mainframe Secure</p>
               <p className="text-[8px] text-slate-500 font-bold uppercase mt-0.5">TLS / ZERO-TRUST ACTIVE</p>
             </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-wider text-red-400 hover:text-red-350 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
          >
            <LogOut size={16} />
            <span>Sign Out Securely</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden cursor-pointer"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Workspace Column */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-xl active:scale-95 transition-all outline-none"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-sm font-black text-slate-900 tracking-tight leading-none uppercase font-sans">NexaMart suite</h1>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Super Admin Dashboard</p>
            </div>
          </div>

          {/* Search bar inside header */}
          <div className="hidden md:flex items-center gap-4 flex-1 max-w-sm mx-10">
             <div className="relative w-full">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  placeholder="Search orders, products, users..." 
                  className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white text-[11px] font-bold pl-9 pr-4 py-2 rounded-xl border-none outline-none focus:ring-2 focus:ring-orange-500/20 transition-all text-slate-800 placeholder-slate-400"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
             </div>
          </div>

          {/* Filters & Profile actions */}
          <div className="flex items-center gap-3">
             <div className="bg-slate-100/85 p-0.5 rounded-xl flex items-center gap-0.5 border border-slate-205">
                {(['All', 'Nepal', 'India'] as const).map(country => (
                  <button 
                    key={country}
                    onClick={() => setSelectedCountry(country)}
                    className={cn(
                      "px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer",
                      selectedCountry === country 
                        ? "bg-slate-900 text-white shadow" 
                        : "text-slate-400 hover:text-slate-655"
                    )}
                  >
                    {country === 'Nepal' ? '🇳🇵 Nepal' : country === 'India' ? '🇮🇳 India' : '🌐 All'}
                  </button>
                ))}
             </div>

             <button 
               onClick={() => setActiveTab('support')}
               className="relative p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all cursor-pointer group"
             >
                <Bell size={15} className="text-slate-550 group-hover:rotate-12 transition-transform" />
                {(stats.pendingOrders > 0 || stats.pendingVendors > 0) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full border-2 border-white animate-pulse" />
                )}
             </button>

             <div className="flex items-center gap-2 border-l border-slate-100 pl-3">
                <div className="w-8 h-8 bg-orange-500 text-white font-black text-xs rounded-xl flex items-center justify-center shadow uppercase">
                   N
                </div>
                <div className="hidden xl:block text-left">
                   <p className="text-[9px] font-black text-slate-800 leading-none uppercase">Admin Commander</p>
                   <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">Super Authority</p>
                </div>
             </div>
          </div>
        </header>

        {/* Content panel */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6 scrollbar-thin">
           <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div key="ov" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                   <div className="space-y-3">
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Attention Required</h3>
                      {stats.pendingVendors > 0 && (
                         <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white"><Store size={20} /></div>
                               <div>
                                  <p className="text-xs font-black text-gray-900">New Merchant Queue</p>
                                  <p className="text-[9px] text-orange-700 font-bold uppercase">{stats.pendingVendors} pending applications</p>
                               </div>
                            </div>
                            <button onClick={() => setActiveTab('vendors')} className="bg-orange-600 text-white text-[9px] font-black px-3 py-1.5 rounded-lg">REVIEW</button>
                         </div>
                      )}
                      {stats.pendingWithdrawals > 0 && (
                         <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white"><DollarSign size={20} /></div>
                               <div>
                                  <p className="text-xs font-black text-gray-900">Payout Requests</p>
                                  <p className="text-[9px] text-blue-700 font-bold uppercase">{stats.pendingWithdrawals} requests ready</p>
                               </div>
                            </div>
                            <button onClick={() => setActiveTab('vendors')} className="bg-blue-600 text-white text-[9px] font-black px-3 py-1.5 rounded-lg">VERIFY</button>
                         </div>
                      )}
                   </div>
                </motion.div>
              )}

              {activeTab === 'users' && <UserManager users={users} setUsers={setUsers} />}

              {activeTab === 'vendors' && (
                <MerchantManager 
                  vendors={vendors} 
                  withdrawals={withdrawalRequests}
                  handleAction={handleAction}
                  setVendors={setVendors}
                  setWithdrawals={setWithdrawalRequests}
                />
              )}

              {activeTab === 'orders' && (
                <OrderManager orders={orders} setOrders={setOrders} vendors={vendors} users={users} riders={riders} />
              )}

              {activeTab === 'riders' && (
                <LogisticsManager riders={riders} orders={orders} handleAction={handleAction} />
              )}

              {activeTab === 'support' && (
                <SupportManager sessions={supportSessions} users={users} />
              )}

              {activeTab === 'products' && (
                <ProductManager 
                  products={products} 
                  setProducts={setProducts} 
                  handleAction={handleAction} 
                  categories={categories}
                />
              )}

              {activeTab === 'banners' && <BannerManager banners={banners} setBanners={setBanners} />}

              {activeTab === 'categories' && <CategoryManager categories={categories} setCategories={setCategories} />}

              {activeTab === 'coupons' && <CouponManager coupons={coupons} setCoupons={setCoupons} vendorId="global" />}

              {activeTab === 'locations' && <LocationAreaManager />}

              {activeTab === 'admin-account' && <AdminAccountManager onLogout={handleLogout} />}

            {activeTab === 'cms' && (
              <div className="space-y-6">
                <CMSManager 
                    onResetFinancials={handleResetFinancials} />
                
                {/* Official Branding Footer */}
                <div className="py-10 flex flex-col items-center gap-3 text-center opacity-40">
                  <div className="bg-gray-100 p-3 rounded-2xl">
                    <Shield size={24} className="text-gray-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Integrated Marketplace System</p>
                    <p className="text-sm font-black text-gray-900 uppercase">NEXAMART - SMART SHOPPING FOR INDIA & NEPAL</p>
                  </div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-gray-100">NexaMart Mainframe • 2026</p>
                </div>
              </div>
            )}
           </AnimatePresence>
        </main>
      </div>
      <AISupportBot />
    </div>
  );
}

function OrderManager({ 
  orders, 
  setOrders, 
  vendors,
  users,
  riders
}: { 
  orders: Order[], 
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>,
  vendors: Vendor[],
  users: UserProfile[],
  riders: Rider[]
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'>('all');
  const [orderCountryFilter, setOrderCountryFilter] = useState<'All' | 'Nepal' | 'India'>('All');

  const [selectedProof, setSelectedProof] = useState<{ 
    type: 'delivery' | 'cancel', 
    image?: string, 
    images?: string[], 
    signature?: string, 
    location?: any 
  } | null>(null);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const approvedRiders = riders.filter(r => r.status === 'approved');

  const filteredOrders = orders.filter(o => {
    const user = users.find(u => u.userId === o.customerId);
    const search = (searchTerm || '').toLowerCase();
    const matchesSearch = (o?.orderId || '').toLowerCase().includes(search) || 
                         (user?.fullName || '').toLowerCase().includes(search);
    const matchesFilter = filter === 'all' || o?.status === filter;
    const matchesCountry = orderCountryFilter === 'All' || o?.country === orderCountryFilter;
    return matchesSearch && matchesFilter && matchesCountry;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleAssignRider = async (orderId: string, riderId: string) => {
     try {
       await updateDoc(doc(db, 'orders', orderId), {
         riderId,
         deliveryStatus: 'assigned',
         assignedAt: new Date().toISOString(),
         updatedAt: new Date().toISOString()
       });
       
       if (riderId) {
         await updateDoc(doc(db, 'riders', riderId), {
           activeOrdersCount: increment(1)
         });
       }

       setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, riderId, deliveryStatus: 'assigned' } : o));
       alert("Mission assigned to rider.");
     } catch (err) {
       handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
     }
  };

  const handleUpdatePaymentStatus = async (orderId: string, newPaymentStatus: Order['paymentStatus']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { 
        paymentStatus: newPaymentStatus,
        updatedAt: new Date().toISOString()
      });
      setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, paymentStatus: newPaymentStatus } : o));
      setSelectedOrder(prev => prev && prev.orderId === orderId ? { ...prev, paymentStatus: newPaymentStatus } : prev);
      alert(`Payment status successfully updated to ${newPaymentStatus?.toUpperCase()}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const order = orders.find(o => o.orderId === orderId);
      if (!order) return;

      const oldStatus = order.status;
      if (oldStatus === newStatus) return;
      
      await updateDoc(doc(db, 'orders', orderId), { 
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      
      const vendorEarnings: Record<string, number> = {};
      order.items.forEach(item => {
        vendorEarnings[item.vendorId] = (vendorEarnings[item.vendorId] || 0) + (item.price * item.quantity);
      });

      if (newStatus === 'delivered' && oldStatus !== 'delivered') {
        for (const [vId, amount] of Object.entries(vendorEarnings)) {
          await updateDoc(doc(db, 'vendors', vId), {
            walletBalance: increment(amount),
            totalSales: increment(order.items.filter(i => i.vendorId === vId).length),
            totalRevenue: increment(amount)
          });
        }
      }
      
      if (oldStatus === 'delivered' && newStatus !== 'delivered') {
        for (const [vId, amount] of Object.entries(vendorEarnings)) {
          await updateDoc(doc(db, 'vendors', vId), {
            walletBalance: increment(-amount),
            totalSales: increment(-order.items.filter(i => i.vendorId === vId).length),
            totalRevenue: increment(-amount)
          });
        }
      }

      setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  return (
    <motion.div key="orders" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
       <div className="space-y-4">
          <div className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
             <input 
               type="text" 
               placeholder="Order ID / Customer Name..." 
               className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-red-500 shadow-sm"
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
            const user = users.find(u => u.userId === o.customerId);
            const rider = riders.find(r => r.riderId === o.riderId);
            const riderUser = rider ? users.find(u => u.userId === rider.userId) : null;

            return (
              <div key={o.orderId} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4 relative overflow-hidden">
                 {/* Visual indicator for delivery status */}
                 {o.deliveryStatus && o.status !== 'cancelled' && (
                   <div className="absolute top-0 left-0 w-1 h-full bg-orange-600" />
                 )}

                 <div className="flex justify-between items-start">
                    <div>
                       <div className="flex items-center gap-2">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">#{o.orderId.slice(-8)}</p>
                         {o.deliveryStatus && (
                           <span className={cn(
                             "text-[7px] font-black px-1.5 py-0.5 rounded-lg uppercase tracking-tight border",
                             o.deliveryStatus === 'accepted' ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                             o.deliveryStatus === 'picked' ? "bg-purple-50 text-purple-600 border-purple-100" :
                             o.deliveryStatus === 'out_for_delivery' ? "bg-orange-50 text-orange-600 border-orange-100" :
                             "bg-green-50 text-green-600 border-green-100"
                           )}>
                             Logistics: {o.deliveryStatus.replace('_', ' ')}
                           </span>
                         )}
                        <div className="mt-1 space-y-0.5 text-left">
                          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Customer</p>
                          <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{o.customerFullName || o.shippingAddress?.fullName || user?.fullName || 'Guest Citizen'}</p>
                          <p className="text-[10px] font-bold text-orange-600 font-mono tracking-wider bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100/50 inline-block">📞 {o.customerPhone || o.shippingAddress?.phone || 'No Phone Number'}</p>
                        </div>
                       <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[8px] font-black uppercase">
                             <MapPin size={10} />
                             {o.shippingAddress.city}
                          </div>
                          <span className="text-[7px] font-black bg-gray-100 text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded uppercase tracking-widest whitespace-nowrap">
                            {o.country === 'India' ? '🇮🇳 India' : '🇳🇵 Nepal'}
                          </span>
                          <p className="text-[9px] font-bold text-gray-400">{formatDate(o.createdAt)}</p>
                       </div>         </div>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-black text-red-600">Rs. {o.totalAmount.toLocaleString()}</p>
                       <div className="flex flex-col items-end gap-1 mt-1">
                          <span className={cn(
                             "text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest border",
                             o.status === 'delivered' ? "bg-green-50 text-green-600 border-green-100" :
                             o.status === 'cancelled' ? "bg-red-50 text-red-600 border-red-100" :
                             "bg-orange-50 text-orange-600 border-orange-100"
                          )}>
                             {o.status}
                          </span>
                          <span className={cn(
                             "text-[6px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter border",
                             o.paymentStatus === 'paid' ? "bg-green-600 text-white border-green-700" :
                             o.paymentStatus === 'failed' ? "bg-red-600 text-white border-red-700" :
                             o.paymentStatus === 'pending' || o.paymentStatus === 'verification_pending' ? "bg-yellow-400 text-gray-900 border-yellow-500" :
                             "bg-gray-100 text-gray-400 border-gray-200"
                          )}>
                             {o.paymentMethod}: {o.paymentStatus?.replace('_', ' ') || 'UNPAID'}
                          </span>
                       </div>
                    </div>
                 </div>

                 {o.cancellationReason && (
                   <div className="bg-red-50 p-3 rounded-xl border border-red-100 flex items-center gap-2">
                      <AlertTriangle size={14} className="text-red-600" />
                      <p className="text-[9px] font-black text-red-700 uppercase tracking-widest">Cancelled: {o.cancellationReason}</p>
                      {o.cancellationProof && (
                        <button 
                          onClick={() => setSelectedProof({ type: 'cancel', image: o.cancellationProof! })}
                          className="ml-auto text-[7px] font-black text-red-600 uppercase flex items-center gap-1 hover:underline"
                        >
                          View Proof
                        </button>
                      )}
                   </div>
                 )}

                 <div className="bg-gray-100/30 p-4 rounded-2xl space-y-2 border border-gray-100">
                    <div className="flex justify-between items-center mb-1">
                       <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                          <Truck size={10} className="text-blue-500" />
                          Logistics Protocol
                       </p>
                       {o.deliveryProof || (o.deliveryPhotos && o.deliveryPhotos.length > 0) ? (
                         <button 
                           onClick={() => setSelectedProof({ 
                             type: 'delivery', 
                             image: o.deliveryProof, 
                             images: o.deliveryPhotos,
                             signature: o.signatureProof,
                             location: o.deliveryLocation
                           })}
                           className="text-[7px] font-black text-green-600 uppercase flex items-center gap-1 hover:underline"
                         >
                           <CheckCircle2 size={10} /> Official Proof
                         </button>
                       ) : null}
                    </div>
                    {rider ? (
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <img src={riderUser?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${rider.userId}`} className="w-8 h-8 rounded-lg object-cover" />
                            <div>
                               <p className="text-[10px] font-black text-gray-900 uppercase">{riderUser?.fullName || 'Rider'}</p>
                               <p className="text-[8px] font-bold text-gray-400 uppercase">{rider.vehiclePlate}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-[8px] font-black text-gray-400 uppercase">Assigned</p>
                            <p className="text-[9px] font-bold text-gray-900">{formatDate(o.assignedAt || o.createdAt)}</p>
                         </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-400">
                         <AlertTriangle size={14} />
                         <p className="text-[9px] font-black uppercase tracking-widest">No Unit Assigned</p>
                      </div>
                    )}
                 </div>

                 <div className="flex gap-2">
                    <div className="flex-1 flex flex-col gap-1">
                      <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest pl-1">Protocol Status</p>
                      <select 
                        value={o.status}
                        onChange={(e) => handleUpdateStatus(o.orderId, e.target.value as any)}
                        className="bg-gray-50 border border-transparent rounded-xl p-3 text-[9px] font-black uppercase outline-none focus:bg-white focus:border-red-100 transition-all w-full"
                      >
                         <option value="pending">Pending</option>
                         <option value="confirmed">Confirmed</option>
                         <option value="processing">Processing</option>
                         <option value="shipped">Shipped</option>
                         <option value="delivered">Delivered</option>
                         <option value="cancelled">Cancelled</option>
                         <option value="returned">Returned</option>
                      </select>
                    </div>
                    
                    <div className="flex-1 flex flex-col gap-1">
                      <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest pl-1">Assign Unit</p>
                      <select 
                        value={o.riderId || ''}
                        onChange={(e) => handleAssignRider(o.orderId, e.target.value)}
                        className="bg-gray-50 border border-transparent rounded-xl p-3 text-[9px] font-black uppercase outline-none focus:bg-white focus:border-red-100 transition-all font-mono w-full"
                      >
                         <option value="">-- Manual Selection --</option>
                         {approvedRiders.map(r => {
                           const ru = users.find(u => u.userId === r.userId);
                           return <option key={r.riderId} value={r.riderId}>[{r.activeOrdersCount || 0}] {ru?.fullName || r.riderId.slice(0, 8)}</option>;
                         })}
                      </select>
                    </div>

                    <div className="flex items-end pb-0.5">
                      <button 
                        onClick={() => setSelectedOrder(o)}
                        className="p-3 bg-gray-900 text-white rounded-xl active:scale-95 transition-all"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                 </div>
              </div>
            );
          })}
          {filteredOrders.length === 0 && (
            <div className="text-center py-20 opacity-20">
               <FileText size={48} className="mx-auto mb-4" />
               <p className="text-[10px] font-black uppercase tracking-[0.4em]">No orders recorded</p>
            </div>
          )}
       </div>

        <AnimatePresence>
          {selectedOrder && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
              onClick={() => setSelectedOrder(null)}
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white p-6 rounded-[32px] w-full max-w-lg space-y-6 relative max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Order Details</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">#{selectedOrder.orderId}</p>
                  </div>
                  <button onClick={() => setSelectedOrder(null)} className="p-2 bg-gray-50 text-gray-400 rounded-full">
                    <X size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Customer</p>
                    <p className="text-xs font-bold text-gray-900">{selectedOrder.customerFullName || selectedOrder.shippingAddress?.fullName || users.find(u => u.userId === selectedOrder.customerId)?.fullName || 'Guest Citizen'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Phone Number</p>
                    <p className="text-xs font-bold text-orange-650 font-mono select-all tracking-wider">{selectedOrder.customerPhone || selectedOrder.shippingAddress?.phone || 'No Phone Number'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Payment Protocol</p>
                    <div className="flex flex-col">
                       <p className="text-[10px] font-black text-gray-900 uppercase">{selectedOrder.paymentMethod || 'Cash On Delivery (COD)'}</p>
                       <p className={cn(
                         "text-[8px] font-black uppercase tracking-tighter mt-0.5 px-1.5 py-0.5 rounded border self-start",
                         selectedOrder.paymentStatus === 'paid' ? "bg-green-50 text-green-700 border-green-150" :
                         selectedOrder.paymentStatus === 'verification_pending' ? "bg-yellow-50 text-yellow-750 border-yellow-200 animate-pulse" :
                         selectedOrder.paymentStatus === 'failed' ? "bg-red-50 text-red-700 border-red-150" :
                         "bg-gray-50 text-gray-650 border-gray-150"
                       )}>
                         {selectedOrder.paymentStatus?.replace('_', ' ') || 'unpaid'}
                       </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Order Time & Date</p>
                    <p className="text-xs font-bold text-gray-900">
                      {selectedOrder.createdAt 
                        ? ((selectedOrder.createdAt as any).seconds 
                            ? new Date((selectedOrder.createdAt as any).seconds * 1000).toLocaleString() 
                            : new Date(selectedOrder.createdAt).toLocaleString())
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Direct action buttons: Call Customer, Copy Phone, Open WhatsApp Chat */}
                {selectedOrder.shippingAddress?.phone && (
                  <div className="flex gap-2 bg-gray-50 p-2.5 rounded-2xl border border-gray-150 justify-between">
                    <a
                      href={`tel:${selectedOrder.shippingAddress.phone}`}
                      className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 text-[9px] font-black uppercase tracking-widest py-2.5 rounded-xl border border-green-200 text-center flex items-center justify-center gap-1 transition-all"
                    >
                      📞 Call Customer
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedOrder.shippingAddress.phone);
                        alert("Customer phone number copied to clipboard!");
                      }}
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[9px] font-black uppercase tracking-widest py-2.5 rounded-xl border border-blue-200 text-center flex items-center justify-center gap-1 transition-all"
                    >
                      📋 Copy Phone
                    </button>
                    <a
                      href={`https://wa.me/${selectedOrder.shippingAddress.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest py-2.5 rounded-xl border border-emerald-200 text-center flex items-center justify-center gap-1 transition-all"
                    >
                      💬 WhatsApp Chat
                    </a>
                  </div>
                )}

                <div className="space-y-1 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">Delivery Address & Logistics</p>
                  <p className="text-[11px] font-bold text-gray-900 leading-relaxed uppercase">
                    {selectedOrder.shippingAddress.label?.toUpperCase() && <span className="text-[8px] bg-gray-900 text-white px-1.5 py-0.5 rounded mr-2 align-middle">{selectedOrder.shippingAddress.label}</span>}
                    {selectedOrder.shippingAddress.streetAddress}
                    {selectedOrder.shippingAddress.area && `, ${selectedOrder.shippingAddress.area}`}
                    {selectedOrder.shippingAddress.ward && `, Ward ${selectedOrder.shippingAddress.ward}`}
                    {selectedOrder.shippingAddress.city && `, ${selectedOrder.shippingAddress.city}`}
                    {selectedOrder.shippingAddress.municipality && `, ${selectedOrder.shippingAddress.municipality}`}
                    <br />
                    {selectedOrder.shippingAddress.district}, {selectedOrder.shippingAddress.state}
                    <br />
                    {selectedOrder.shippingAddress.pinCode ? `Postal Code: ${selectedOrder.shippingAddress.pinCode}` : ''}
                    <br />
                    <span className="text-blue-600 font-black tracking-widest">{selectedOrder.country}</span>
                  </p>
                  {selectedOrder.shippingAddress.landmark && (
                    <p className="text-[10px] text-orange-600 font-bold mt-1 uppercase">Landmark: {selectedOrder.shippingAddress.landmark}</p>
                  )}
                  {selectedOrder.shippingAddress.latitude && selectedOrder.shippingAddress.longitude && isGoogleMapsKeyValid() && (
                    <div className="mt-4 aspect-video rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                      <Map
                        mapId="DEMO_MAP_ID"
                        defaultCenter={{ lat: selectedOrder.shippingAddress.latitude as number, lng: selectedOrder.shippingAddress.longitude as number }}
                        defaultZoom={15}
                        gestureHandling={'greedy'}
                        disableDefaultUI={true}
                      >
                        <AdvancedMarker position={{ lat: selectedOrder.shippingAddress.latitude as number, lng: selectedOrder.shippingAddress.longitude as number }}>
                          <div className="p-2 bg-red-600 rounded-lg shadow-xl animate-bounce">
                            <MapPin size={16} className="text-white" />
                          </div>
                        </AdvancedMarker>
                      </Map>
                    </div>
                  )}
                </div>

                {selectedOrder.paymentMethod && selectedOrder.paymentMethod !== 'COD' && (
                  <div className="space-y-3 p-4 bg-orange-50/30 rounded-2xl border border-orange-100/60 text-left">
                    <p className="text-[8px] font-black text-orange-650 uppercase tracking-widest">Admin Payment Verification Node</p>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="font-bold text-gray-400 uppercase">Txn Ref ID:</span>
                        <p className="font-black text-gray-800 font-mono tracking-wider break-all select-all">{selectedOrder.paymentTransactionId || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-bold text-gray-400 uppercase">Sender Mobile:</span>
                        <p className="font-black text-gray-800 font-mono tracking-wider select-all">{selectedOrder.paymentSenderMobile || 'N/A'}</p>
                      </div>
                    </div>
                    {selectedOrder.paymentProof && (
                      <div className="space-y-1.5">
                        <span className="text-[8px] font-bold text-gray-400 uppercase pb-1 block">Uploaded Receipt Screenshot:</span>
                        <a 
                          href={selectedOrder.paymentProof} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="group relative block aspect-[4/3] rounded-xl overflow-hidden border border-gray-200 shadow-inner bg-white active:scale-98 transition-all"
                        >
                          <img src={selectedOrder.paymentProof} className="w-full h-full object-cover" alt="Uploaded proof screenshot" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-black uppercase tracking-widest transition-opacity cursor-pointer">
                            🔍 Zoom & Inspect Receipt
                          </div>
                        </a>
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleUpdatePaymentStatus(selectedOrder.orderId, 'paid')}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black py-2.5 rounded-xl text-[9px] uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Check size={12} /> Approve (Mark Paid)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdatePaymentStatus(selectedOrder.orderId, 'failed')}
                        className="flex-1 bg-red-50 hover:bg-red-100 text-red-650 font-black py-2.5 rounded-xl border border-red-200 text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <X size={12} /> Reject
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-3 border-t border-gray-100 pt-3">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Order Summary</p>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-gray-600">{item.name} x {item.quantity}</span>
                        <span className="font-black text-gray-900">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-sm font-black text-red-600">
                      <span>Total Amount</span>
                      <span>Rs. {(selectedOrder.totalAmount || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] shadow-lg shadow-gray-100 active:scale-95 transition-all"
                >
                  Close Transmission
                </button>
              </motion.div>
            </motion.div>
          )}

          {selectedProof && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md"
              onClick={() => setSelectedProof(null)}
            >
              <div className="relative max-w-sm w-full bg-white rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                   <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Security Proof</h3>
                   <button onClick={() => setSelectedProof(null)} className="p-2 bg-white rounded-xl shadow-sm"><X size={18} /></button>
                </div>
                
                <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
                   <div className="space-y-4">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest px-1">Field Imagery</p>
                      <div className="space-y-3">
                        {selectedProof.image && (
                          <img src={selectedProof.image} className="w-full rounded-2xl border border-gray-100 shadow-sm" alt="Proof" />
                        )}
                        {selectedProof.images?.map((img, idx) => (
                          <img key={idx} src={img} className="w-full rounded-2xl border border-gray-100 shadow-sm" alt={`Proof ${idx + 1}`} />
                        ))}
                      </div>
                   </div>

                   {selectedProof.signature && (
                      <div className="space-y-2">
                         <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Customer Signature</p>
                         <img src={selectedProof.signature} className="w-full h-32 object-contain bg-gray-50 rounded-2xl border border-gray-100" />
                      </div>
                   )}

                   {selectedProof.location && (
                      <div className="space-y-2">
                         <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Deployment Coordinates</p>
                         <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                            <div>
                               <p className="text-[10px] font-black text-gray-900">Lat: {selectedProof.location.latitude.toFixed(4)}</p>
                               <p className="text-[10px] font-black text-gray-900">Lng: {selectedProof.location.longitude.toFixed(4)}</p>
                            </div>
                            <button 
                              onClick={() => window.open(`https://www.google.com/maps?q=${selectedProof.location.latitude},${selectedProof.location.longitude}`, '_blank')}
                              className="bg-gray-900 text-white p-3 rounded-xl shadow-lg active:scale-95 transition-all"
                            >
                               <Navigation size={18} />
                            </button>
                         </div>
                         <p className="text-[7px] text-gray-400 font-bold uppercase text-center mt-2">Timestamp: {formatDate(selectedProof.location.timestamp)}</p>
                      </div>
                   )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
    </motion.div>
  );
}

function SupportManager({ sessions, users }: { sessions: any[], users: UserProfile[] }) {
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [reply, setReply] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !selectedSession || isSending) return;

    setIsSending(true);
    try {
      const newMsg = {
        role: 'admin',
        content: reply,
        timestamp: new Date()
      };
      
      const updatedMessages = [...selectedSession.messages, newMsg];
      
      await updateDoc(doc(db, 'support_sessions', selectedSession.sessionId), {
        messages: updatedMessages,
        status: 'active',
        updatedAt: serverTimestamp()
      });
      
      setReply('');
      setSelectedSession({ ...selectedSession, messages: updatedMessages });
    } catch (err) {
      console.error("Reply error:", err);
    } finally {
      setIsSending(false);
    }
  };

  const resolveSession = async (id: string) => {
    if (!confirm("Mark this issue as resolved?")) return;
    await updateDoc(doc(db, 'support_sessions', id), { status: 'resolved' });
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[60vh] flex flex-col md:flex-row">
        {/* Session List */}
        <div className="w-full md:w-80 border-r border-gray-50 flex flex-col h-[50vh] md:h-auto">
          <div className="p-4 bg-gray-50 border-b border-gray-100 shrink-0">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Active Queries</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessions.filter(s => s.status !== 'deleted').sort((a, b) => b.updatedAt?.toMillis?.() - a.updatedAt?.toMillis?.()).map(s => (
              <button
                key={s.sessionId}
                onClick={() => setSelectedSession(s)}
                className={cn(
                  "w-full text-left p-4 rounded-2xl transition-all border",
                  selectedSession?.sessionId === s.sessionId 
                    ? "bg-orange-50 border-orange-200" 
                    : "bg-white border-transparent hover:bg-gray-50"
                )}
              >
                <div className="flex justify-between items-start">
                  <p className="text-[10px] font-black text-gray-900 uppercase truncate">{s.customerName || 'Unit'}</p>
                  <span className={cn(
                    "text-[7px] font-black px-1 rounded uppercase",
                    s.status === 'active' ? "text-green-600 bg-green-50" : "text-gray-400 bg-gray-100"
                  )}>{s.status}</span>
                </div>
                <p className="text-[9px] text-gray-400 truncate mt-1">{s.messages[s.messages.length - 1]?.content}</p>
                <p className="text-[7px] text-gray-300 font-bold mt-2 uppercase tracking-tighter">
                  Last: {formatDate(s.updatedAt)}
                </p>
              </button>
            ))}
            {sessions.length === 0 && (
               <div className="p-10 text-center opacity-20">
                 <Bot size={32} className="mx-auto mb-2" />
                 <p className="text-[8px] font-black uppercase">No active missions</p>
               </div>
            )}
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 flex flex-col h-[60vh] md:h-[70vh] bg-gray-50/30">
          {selectedSession ? (
            <>
              <div className="p-6 bg-white border-b border-gray-100 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-100">
                      <User size={20} />
                   </div>
                   <div>
                      <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest">{selectedSession.customerName}</h4>
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Customer Support Session</p>
                   </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => resolveSession(selectedSession.sessionId)} className="bg-green-50 text-green-600 p-2 rounded-xl active:scale-90 transition-all font-black text-[9px] uppercase px-3">RESOLVE</button>
                  <button onClick={() => setSelectedSession(null)} className="md:hidden p-2 text-gray-400"><X size={20} /></button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {selectedSession.messages.map((m: any, i: number) => (
                  <div key={i} className={cn(
                    "flex flex-col max-w-[80%]",
                    m.role === 'admin' ? "ml-auto items-end" : "mr-auto items-start"
                  )}>
                    <div className={cn(
                      "p-4 rounded-3xl text-sm font-medium shadow-sm",
                      m.role === 'admin' ? "bg-gray-900 text-white rounded-tr-none" : 
                      m.role === 'ai' ? "bg-orange-600 text-white rounded-tl-none" : "bg-white border border-gray-100 text-gray-800 rounded-tl-none"
                    )}>
                      {m.content}
                    </div>
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1 px-1">
                      {m.role} • {formatDate(m.timestamp)}
                    </span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleReply} className="p-6 bg-white border-t border-gray-100 shrink-0">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    placeholder="Type your strategic response..."
                    className="w-full bg-gray-50 border border-transparent rounded-2xl py-4 pl-5 pr-14 text-sm font-black focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!reply.trim() || isSending}
                    className="absolute right-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black active:scale-95 transition-all disabled:opacity-30"
                  >
                    {isSending ? <Loader2 size={16} className="animate-spin" /> : 'Send'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-20">
               <MessageSquare size={80} className="mb-4" />
               <p className="text-[10px] font-black uppercase tracking-[0.4em]">Select a session to begin synchronization</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function RiderManager({ 
  riders, 
  setRiders, 
  handleAction,
  users
}: { 
  riders: Rider[], 
  setRiders: React.Dispatch<React.SetStateAction<Rider[]>>,
  handleAction: (col: string, id: string, data: any) => Promise<void>,
  users: UserProfile[]
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'suspended'>('all');
  const [showRiderPanel, setShowRiderPanel] = useState(false);

  const filteredRiders = riders.filter(r => {
    const user = users.find(u => u.userId === r.userId);
    const matchesSearch = (user?.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (user?.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || r.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this rider from the mainland?")) return;
    try {
      await deleteDoc(doc(db, 'riders', id));
      setRiders(prev => prev.filter(r => r.riderId !== id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `riders/${id}`);
    }
  };

  return (
    <motion.div key="riders" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
       <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
             <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Personnel</p>
             <p className="text-lg font-black text-gray-900">{riders.filter(r => r.status === 'approved').length}</p>
          </div>
          <button 
            onClick={() => setShowRiderPanel(true)}
            className="bg-gray-900 text-white p-5 rounded-3xl shadow-xl shadow-gray-200 flex flex-col justify-center active:scale-95 transition-all"
          >
             <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Recruitment</p>
             <div className="flex items-center gap-2">
                <p className="text-sm font-black">Promote Users</p>
                <Plus size={16} />
             </div>
          </button>
       </div>

       <div className="space-y-4">
          <div className="flex bg-white rounded-2xl border border-gray-100 p-1 overflow-x-auto scrollbar-hide">
             {(['all', 'pending', 'approved', 'rejected', 'suspended'] as const).map(f => (
               <button 
                 key={f}
                 onClick={() => setFilter(f)}
                 className={cn(
                   "flex-1 px-4 py-3 text-[8px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap",
                   filter === f ? "bg-gray-900 text-white" : "text-gray-400"
                 )}
               >
                 {f}
               </button>
             ))}
          </div>

          <div className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
             <input 
               type="text" 
               placeholder="Search rider name or email..." 
               className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-red-500 shadow-sm"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
          </div>
       </div>

       <div className="space-y-3">
          {filteredRiders.map(r => {
            const user = users.find(u => u.userId === r.userId);
            return (
              <div key={r.riderId} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                 <div className="flex items-start gap-4">
                    <img 
                      src={user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.userId}`} 
                      className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-gray-50 shadow-sm" 
                      alt="" 
                    />
                    <div className="flex-1 min-w-0">
                       <div className="flex items-center justify-between">
                          <p className="text-xs font-black text-gray-900 truncate uppercase tracking-tight">{user?.fullName || 'Rider Unit'}</p>
                          <span className={cn(
                            "text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest border",
                            r.status === 'approved' ? "bg-green-50 text-green-600 border-green-100" :
                            r.status === 'pending' ? "bg-orange-50 text-orange-600 border-orange-100" :
                            "bg-red-50 text-red-600 border-red-100"
                          )}>
                            {r.status}
                          </span>
                       </div>
                       <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">{user?.email}</p>
                       
                       <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                          <div className="bg-gray-50 border border-gray-100 p-2 rounded-xl">
                            <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Plate</p>
                            <p className="text-[9px] font-black text-gray-900 uppercase truncate">{r.vehiclePlate || 'N/A'}</p>
                          </div>
                          <div className="bg-gray-50 border border-gray-100 p-2 rounded-xl">
                            <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Load</p>
                            <p className="text-[9px] font-black text-gray-900 uppercase">{r.activeOrdersCount || 0}</p>
                          </div>
                          <div className="bg-gray-50 border border-gray-100 p-2 rounded-xl">
                            <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Done</p>
                            <p className="text-[9px] font-black text-gray-900 uppercase">{r.totalDeliveries || 0}</p>
                          </div>
                       </div>

                       <div className="flex items-center gap-2 mt-3">
                          {r.status !== 'approved' && (
                            <button 
                              onClick={() => handleAction('riders', r.riderId, { status: 'approved' })} 
                              className="flex-1 bg-green-600 text-white py-2 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-lg active:scale-95 flex items-center justify-center gap-1"
                            >
                               <Check size={12} /> Approve
                            </button>
                          )}
                          {r.status === 'approved' && (
                            <button 
                              onClick={() => handleAction('riders', r.riderId, { status: 'suspended' })} 
                              className="flex-1 bg-orange-600 text-white py-2 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-lg active:scale-95 flex items-center justify-center gap-1"
                            >
                               <Ban size={12} /> Suspend
                            </button>
                          )}
                          <button 
                            onClick={() => handleDelete(r.riderId)}
                            className="bg-red-50 text-red-600 p-2 rounded-xl border border-red-100 active:scale-95"
                          >
                            <Trash2 size={12} />
                          </button>
                       </div>
                    </div>
                 </div>
              </div>
            );
          })}
       </div>

       {/* Promote to Rider Modal */}
       <AnimatePresence>
         {showRiderPanel && (
           <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
             className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
           >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-[2.5rem] w-full max-w-md p-8 space-y-6 overflow-hidden flex flex-col max-h-[80vh]"
              >
                 <div className="flex justify-between items-center">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Recruitment Office</h3>
                    <button onClick={() => setShowRiderPanel(false)} className="p-2 bg-gray-50 text-gray-400 rounded-full"><X size={16} /></button>
                 </div>

                 <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Select citizen to promote</p>
                    {users.filter(u => u.role === 'customer' && !riders.some(r => r.userId === u.userId)).map(u => (
                      <button 
                        key={u.userId}
                        onClick={async () => {
                           if (confirm(`Appoint ${u.fullName} as official unit?`)) {
                              await handleAction('riders', u.userId, { 
                                userId: u.userId,
                                vehicleType: 'Bike',
                                vehiclePlate: 'PENDING',
                                licenseNumber: 'PENDING',
                                status: 'approved',
                                isAvailable: false,
                                rating: 5,
                                totalDeliveries: 0,
                                activeOrdersCount: 0,
                                createdAt: new Date().toISOString()
                              });
                              await handleAction('users', u.userId, { role: 'rider' });
                              setShowRiderPanel(false);
                              alert("Personnel activated.");
                           }
                        }}
                        className="w-full bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center gap-4 hover:bg-orange-50 hover:border-orange-100 transition-all text-left"
                      >
                         <img src={u.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.userId}`} className="w-10 h-10 rounded-xl" />
                         <div>
                            <p className="text-[10px] font-black text-gray-900 uppercase">{u.fullName}</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase">{u.email}</p>
                         </div>
                      </button>
                    ))}
                 </div>
              </motion.div>
           </motion.div>
         )}
       </AnimatePresence>
    </motion.div>
  );
}

function UserManager({ users, setUsers }: { users: UserProfile[], setUsers: React.Dispatch<React.SetStateAction<UserProfile[]>> }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<UserProfile | null>(null);
  const [countryFilter, setCountryFilter] = useState<'All' | 'Nepal' | 'India'>('All');
  
  // Form states
  const [newUser, setNewUser] = useState({ fullName: '', email: '', password: '', role: 'customer' as UserRole, country: 'Nepal' as 'Nepal' | 'India' });
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCountry = countryFilter === 'All' || u.country === countryFilter;
    return matchesSearch && matchesCountry;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleUpdate = async (userId: string, data: Partial<UserProfile>) => {
    const path = `users/${userId}`;
    try {
      await setDoc(doc(db, 'users', userId), data, { merge: true });
      setUsers(prev => prev.map(u => u.userId === userId ? { ...u, ...data } : u));
      if (showEditModal) setShowEditModal(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.fullName || !newUser.email || !newUser.password) {
      alert("All fields are required.");
      return;
    }

    setIsProcessing(true);
    try {
      // Create a dedicated app instance for this registration to avoid signing out the admin
      const appName = `nexamart-sync-${Date.now()}`;
      const tempApp = initializeApp(firebaseConfig, appName);
      const tempAuth = getAuth(tempApp);
      
      const userCredential = await createUserWithEmailAndPassword(tempAuth, newUser.email, newUser.password);
      const uid = userCredential.user.uid;
      
      await updateProfile(userCredential.user, { displayName: newUser.fullName });
      
      const userProfile: UserProfile = {
        userId: uid,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        status: 'active',
        country: newUser.country,
        createdAt: new Date().toISOString(),
        wishlist: [],
        addresses: []
      };

      await setDoc(doc(db, 'users', uid), userProfile);
      
      // If it's a rider, we also need to create a rider document automatically for logistics tracking
      if (newUser.role === 'rider') {
        const riderData: Rider = {
          riderId: uid,
          userId: uid,
          vehicleType: 'Bike',
          vehiclePlate: 'PENDING',
          licenseNumber: 'PENDING',
          status: 'approved',
          isAvailable: false,
          rating: 5,
          totalDeliveries: 0,
          activeOrdersCount: 0,
          createdAt: new Date().toISOString(),
          email: newUser.email
        };
        await setDoc(doc(db, 'riders', uid), riderData);
      }

      setUsers(prev => [userProfile, ...prev]);
      setShowAddModal(false);
      setNewUser({ fullName: '', email: '', password: '', role: 'customer', country: 'Nepal' });
      alert("User account synchronized and authorized across mainframe.");
      
      // Sign out from temp auth and garbage collect app
      await signOut(tempAuth);
    } catch (err: any) {
      console.error("User management error:", err);
      alert("Management Failure: " + formatAuthError(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This is irreversible.")) return;
    const path = `users/${userId}`;
    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(prev => prev.filter(u => u.userId !== userId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  return (
    <div className="space-y-4 pb-10">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search citizens..." 
            className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-10 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-red-500 shadow-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-gray-900 text-white px-5 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center border border-gray-800"
        >
          <Plus size={20} />
        </button>
      </div>


      <div className="space-y-3">
        {filteredUsers.map(u => (
          <div key={u.userId} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0",
              u.role === 'admin' ? "bg-red-50 border-red-100 text-red-600" : 
              u.role === 'vendor' ? "bg-blue-50 border-blue-100 text-blue-600" : 
              u.role === 'rider' ? "bg-orange-50 border-orange-100 text-orange-600" :
              "bg-gray-50 border-gray-100 text-gray-400"
            )}>
              {u.role === 'admin' ? <Shield size={20} /> : <Users size={20} />}
            </div>
            <div className="flex-1 min-w-0">
               <div className="flex items-center gap-2">
                 <p className="text-xs font-black text-gray-900 truncate uppercase tracking-tight">{u.fullName}</p>
                 {u.status === 'blocked' && (
                   <span className="text-[7px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded uppercase tracking-widest">Blocked</span>
                 )}
                 <span className="text-[7px] font-black bg-gray-100 text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded uppercase tracking-widest">
                   {u.country === 'India' ? '🇮🇳 India' : '🇳🇵 Nepal'}
                 </span>
               </div>
               <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{u.email} • {u.role}</p>
            </div>
            <div className="flex gap-2">
               <button 
                 onClick={() => setShowEditModal(u)}
                 className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:text-blue-600 hover:bg-blue-50 transition-colors active:scale-90"
               >
                 <Edit size={14} />
               </button>
               <button 
                 onClick={() => handleUpdate(u.userId, { status: u.status === 'blocked' ? 'active' : 'blocked' })}
                 className={cn(
                   "p-2.5 rounded-xl transition-all active:scale-90 border",
                   u.status === 'blocked' ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100"
                 )}
                 title={u.status === 'blocked' ? 'Unblock' : 'Block'}
               >
                 <Ban size={14} />
               </button>
               <button 
                 onClick={() => handleDelete(u.userId)}
                 className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:text-red-600 hover:bg-red-50 transition-colors active:scale-90"
               >
                 <Trash2 size={14} />
               </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md p-8 space-y-6 shadow-2xl relative"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">New Citizen Profile</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 bg-gray-100 text-gray-400 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors"><X size={16} /></button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Full Name</label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      required
                      placeholder="Enter legal name"
                      className="w-full bg-gray-50 border border-transparent rounded-2xl py-4 pl-12 pr-4 text-xs font-bold outline-none focus:bg-white focus:border-red-100 transition-all"
                      value={newUser.fullName}
                      onChange={e => setNewUser({...newUser, fullName: e.target.value})}
                    />
                  </div>
                </div>


                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="email" 
                      required
                      placeholder="citizen@nexamart.com"
                      className="w-full bg-gray-50 border border-transparent rounded-2xl py-4 pl-12 pr-4 text-xs font-bold outline-none focus:bg-white focus:border-red-100 transition-all font-mono"
                      value={newUser.email}
                      onChange={e => setNewUser({...newUser, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Access Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="password" 
                      required
                      placeholder="Set initial password"
                      className="w-full bg-gray-50 border border-transparent rounded-2xl py-4 pl-12 pr-4 text-xs font-bold outline-none focus:bg-white focus:border-red-100 transition-all"
                      value={newUser.password}
                      onChange={e => setNewUser({...newUser, password: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Assigned Role</label>
                  <div className="relative">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <select 
                      className="w-full bg-gray-50 border border-transparent rounded-2xl py-4 pl-12 pr-4 text-xs font-black uppercase outline-none focus:bg-white focus:border-red-100 transition-all appearance-none"
                      value={newUser.role}
                      onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
                    >
                      <option value="customer">Customer (Citizen)</option>
                      <option value="vendor">Vendor (Merchant)</option>
                      <option value="rider">Rider (Logistics)</option>
                      <option value="admin">Admin (Executive)</option>
                    </select>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-gray-900 text-white font-black py-5 rounded-3xl uppercase tracking-widest text-[10px] shadow-2xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 mt-2"
                >
                  {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : <Plus size={16} />}
                  Execute Account Setup
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {showEditModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md p-8 space-y-6 shadow-2xl relative"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Citizen Credentials</h3>
                <button onClick={() => setShowEditModal(null)} className="p-2 bg-gray-100 text-gray-400 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors"><X size={16} /></button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4 bg-gray-50 p-5 rounded-[2rem] border border-gray-100">
                  <div className="relative">
                    <img src={showEditModal.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${showEditModal.userId}`} className="w-16 h-16 rounded-2xl border-4 border-white shadow-sm" alt="" />
                    <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-lg border border-gray-50 shadow-sm">
                      <Shield size={12} className="text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">{showEditModal.fullName}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{showEditModal.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="bg-gray-100 text-[8px] font-black text-gray-500 px-1.5 py-0.5 rounded uppercase tracking-tighter">UID: {showEditModal.userId.slice(0, 8)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1 ml-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Display Name</label>
                    <input 
                      type="text" 
                      className="w-full bg-gray-50 border border-transparent rounded-2xl py-4 px-6 text-xs font-bold outline-none focus:bg-white focus:border-red-100 transition-all"
                      defaultValue={showEditModal.fullName}
                      onBlur={e => handleUpdate(showEditModal.userId, { fullName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1 ml-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Authority Level</label>
                    <select 
                      className="w-full bg-gray-50 border border-transparent rounded-2xl py-4 px-6 text-xs font-black uppercase outline-none focus:bg-white focus:border-red-100 transition-all appearance-none"
                      defaultValue={showEditModal.role}
                      onChange={e => handleUpdate(showEditModal.userId, { role: e.target.value as UserRole })}
                    >
                      <option value="customer">Citizen (Customer)</option>
                      <option value="vendor">Merchant (Vendor)</option>
                      <option value="rider">Logistics (Rider)</option>
                      <option value="admin">Administrator (Mainframe)</option>
                    </select>
                  </div>
                </div>

                <button 
                  onClick={() => setShowEditModal(null)}
                  className="w-full bg-gray-900 text-white font-black py-5 rounded-3xl uppercase tracking-widest text-[10px] shadow-xl active:scale-95 transition-all mt-4"
                >
                  Finalize Adjustments
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AdminAccountManager({ onLogout }: { onLogout: () => void }) {
  const { user } = useAuth();
  const [emails, setEmails] = useState({ current: user?.email || '', new: '' });
  const [passwords, setPasswords] = useState({ current: '', new: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    setError('');
    setSuccess('');
    setIsProcessing(true);

    try {
      // 1. Re-authenticate
      const credential = EmailAuthProvider.credential(auth.currentUser.email!, passwords.current);
      await reauthenticateWithCredential(auth.currentUser, credential);

      // 2. Update Email if changed
      if (emails.new && emails.new !== auth.currentUser.email) {
        try {
          await updateEmail(auth.currentUser, emails.new);
          await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            email: emails.new
          });
        } catch (emailErr: any) {
          const emailErrCode = emailErr.code || (emailErr.message?.includes('auth/operation-not-allowed') ? 'auth/operation-not-allowed' : '');
          if (emailErrCode === 'auth/operation-not-allowed') {
            // Modern security requires verification before change in some cases
            await verifyBeforeUpdateEmail(auth.currentUser, emails.new);
            setSuccess("Verification email dispatched. Identity update pending confirmation.");
            // We set new email to empty so they don't try again immediately
            setEmails(prev => ({ ...prev, new: '' }));
            return; // Exit early to not show the "finalized" alert below
          } else {
            throw emailErr;
          }
        }
      }

      // 3. Update Password if provided
      if (passwords.new) {
        await updatePassword(auth.currentUser, passwords.new);
      }

      setSuccess("Strategic security update finalized.");
      setPasswords({ current: '', new: '' });
      setEmails(prev => ({ ...prev, new: '' }));
      
      // Delay alert to allow success message to be seen
      setTimeout(() => {
        alert("Account Security Synchronized. Please sign in again if credentials were changed.");
      }, 500);
    } catch (err: any) {
      console.error("Management error:", err);
      setError(formatAuthError(err));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center px-2">
        <div className="space-y-1">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Executive Credentials</h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mainframe Level 4 Access</p>
        </div>
        <button 
          onClick={onLogout}
          className="flex items-center gap-2 text-red-600 font-black text-[10px] uppercase tracking-widest bg-red-50 px-4 py-2 rounded-2xl border border-red-100 active:scale-95 transition-all shadow-sm"
        >
          <LogOut size={14} /> Exit System
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-xl space-y-7 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full translate-x-12 -translate-y-12 -z-10" />
        
        {/* Strategic Identity Handover Tool */}
        {user?.email === 'nexamartowner@gmail.com' && (
          <div className="mb-8 p-5 bg-orange-50 rounded-3xl border border-orange-100 space-y-4">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-600 rounded-xl text-white">
                   <Shield size={20} />
                </div>
                <div>
                   <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Ownership Handover Protocol</h4>
                   <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Initialize Strategic Systems</p>
                </div>
             </div>
             <div className="flex gap-2">
                <button 
                  onClick={async () => {
                    if (!confirm("Finalize ownership synchronization? This will set support helplines and verify account permissions.")) return;
                    setIsProcessing(true);
                    try {
                      // Update Firestore Settings
                      await setDoc(doc(db, 'settings', 'main'), { 
                        supportWhatsapp: '+9779700694631',
                        updatedAt: serverTimestamp()
                      }, { merge: true });
                      setSuccess("Helplines synchronized to: +9779700694631");
                    } catch (e: any) {
                      setError(e.message);
                    } finally {
                      setIsProcessing(false);
                    }
                  }}
                  className="flex-1 bg-white border border-orange-200 text-orange-600 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all shadow-sm"
                >
                  Sync Helplines
                </button>
                <div className="flex-1 space-y-1">
                   <p className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter px-1">Target Key</p>
                   <div className="bg-white px-3 py-2 rounded-2xl border border-orange-100 text-[9px] font-mono font-bold text-orange-700">
                      NexaMart@2026
                   </div>
                </div>
             </div>
          </div>
        )}

        <form onSubmit={handleUpdateAccount} className="space-y-6">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 text-red-600 p-5 rounded-2xl border border-red-100 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest shadow-sm overflow-hidden"
              >
                <AlertTriangle size={18} className="shrink-0" /> 
                <span className="flex-1">{error}</span>
              </motion.div>
            )}
            {success && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="bg-green-50 text-green-600 p-5 rounded-2xl border border-green-100 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest shadow-sm overflow-hidden"
              >
                <CheckCircle2 size={18} className="shrink-0" /> 
                <span className="flex-1">{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Primary Admin Identity</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input 
                    type="email" 
                    disabled
                    value={emails.current}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4.5 pl-12 pr-4 text-xs font-bold text-gray-400 cursor-not-allowed shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Revise Admin Identity (Optional)</label>
                <div className="relative">
                  <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="email" 
                    placeholder="New encrypted gmail"
                    className="w-full bg-gray-50 border border-transparent rounded-2xl py-4.5 pl-12 pr-4 text-xs font-bold outline-none focus:bg-white focus:border-red-100 focus:shadow-lg focus:shadow-red-50/50 transition-all font-mono"
                    value={emails.new}
                    onChange={e => setEmails({ ...emails, new: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 group flex items-center gap-2">
                  Verify Operational Key <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="password" 
                    required
                    placeholder="Current mainframe key"
                    className="w-full bg-gray-50 border border-transparent rounded-2xl py-4.5 pl-12 pr-4 text-xs font-bold outline-none focus:bg-white focus:border-red-100 focus:shadow-lg focus:shadow-red-50/50 transition-all"
                    value={passwords.current}
                    onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">New Operational Key (Optional)</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="password" 
                    placeholder="Set new access key"
                    className="w-full bg-gray-50 border border-transparent rounded-2xl py-4.5 pl-12 pr-4 text-xs font-bold outline-none focus:bg-white focus:border-red-100 focus:shadow-lg focus:shadow-red-50/50 transition-all"
                    value={passwords.new}
                    onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button 
              type="submit"
              disabled={isProcessing || !passwords.current}
              className="w-full bg-gray-900 text-white font-black py-5 rounded-[1.5rem] uppercase tracking-widest text-[11px] shadow-2xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 relative overflow-hidden"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-[3px] border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Shield size={18} className="text-red-500" />
                  Finalize Access Revision
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-100 rounded-3xl p-5 flex items-start gap-4 border border-gray-200">
          <div className="p-3 bg-white rounded-2xl shadow-sm text-gray-400">
            <Shield size={20} />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Advanced Encryption</p>
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">Admin credentials are stored using high-entropy irreversible hashing protocols. Identity changes require real-time re-authentication.</p>
          </div>
        </div>
        <div className="bg-gray-100 rounded-3xl p-5 flex items-start gap-4 border border-gray-200">
          <div className="p-3 bg-white rounded-2xl shadow-sm text-gray-400">
            <Bell size={20} />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Protocol Warning</p>
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">Changing identity details will terminate active sessions across all devices for security parity.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function QrUploadCard({
  label,
  value,
  field,
  paymentSettingsField,
  enabledField,
  isEditing,
  settings,
  setSettings,
}: {
  label: string;
  value?: string;
  field: string;
  paymentSettingsField: string;
  enabledField: string;
  isEditing: boolean;
  settings: any;
  setSettings: React.Dispatch<React.SetStateAction<any>>;
}) {
  const cachedKey = `cached-qr-${paymentSettingsField}`;
  const [preview, setPreview] = useState<string | null>(() => {
    return localStorage.getItem(cachedKey) || value || null;
  });
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [isSavingLocal, setIsSavingLocal] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEnabled = settings?.paymentSettings?.[enabledField] !== false;

  const handleToggle = async () => {
    const nextVal = !isEnabled;
    const updated = {
      ...settings,
      paymentSettings: {
        ...(settings?.paymentSettings || {}),
        [enabledField]: nextVal
      }
    };
    setSettings(updated);

    try {
      await setDoc(doc(db, 'settings', 'main'), updated);
      console.log(`Auto-saved payment method toggle ${enabledField} = ${nextVal} successfully.`);
    } catch (err: any) {
      console.error("Auto-save toggling payment method failed:", err);
      alert("Failed to auto-save change to database: " + err.message);
    }
  };

  useEffect(() => {
    if (value) {
      setPreview(value);
      localStorage.setItem(cachedKey, value);
    } else if (value === '') {
      setPreview(null);
      localStorage.removeItem(cachedKey);
    }
  }, [value, cachedKey]);

  const onUploadFile = async (file: File) => {
    if (!file) return;

    // Validate file type (jpg, jpeg, png, webp)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    const fileType = file.type || '';
    if (!validTypes.includes(fileType) && !['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
      alert("Error: Only JPG, JPEG, PNG, and/WEBP formats are allowed.");
      return;
    }

    // Read file immediately for INSTANT PREVIEW
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Str = e.target?.result as string;
      
      // Update UI preview instantly
      setPreview(base64Str);
      setUploadSuccess(true);
      localStorage.setItem(cachedKey, base64Str);

      // We do NOT store base64 in the global settings object to prevent Firestore payload limits of 1MB from being exceeded.
      // Visual feedback is managed purely via the local state `preview` (which instantly shows the selected image).

      // Background compressed cloud upload & direct database save
      try {
        setIsUploading(true);
        setUploadProgress(10);

        // Compress image using fast Canvas utility to reduce size to <50KB
        const compressedBase64 = await compressImage(base64Str, 800, 800, 0.7);
        setUploadProgress(45);

        // Convert base64 back to a Blob for Storage upload
        const response = await fetch(compressedBase64);
        const blob = await response.blob();
        setUploadProgress(65);

        const fieldToFilename: Record<string, string> = {
          esewaQR: 'esewa-qr',
          khaltiQR: 'khalti-qr',
          fonepayQR: 'fonepay-qr',
          phonepeQR: 'phonepe-qr',
          gpayQR: 'gpay-qr',
          paytmQR: 'paytm-qr',
          upiQR: 'upi-qr'
        };
        const baseName = fieldToFilename[paymentSettingsField] || paymentSettingsField;
        const fileName = `payment-qr/${baseName}.png`;
        
        const storageRef = ref(storage, fileName);
        const uploadTask = uploadBytesResumable(storageRef, blob, { contentType: 'image/jpeg' });

        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 30) + 70;
            setUploadProgress(progress > 100 ? 100 : progress);
          },
          (error) => {
            console.error("Storage upload failed:", error);
            setIsUploading(false);
            setUploadProgress(null);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              
              setPreview(downloadURL);
              localStorage.setItem(cachedKey, downloadURL);
              setIsUploading(false);
              setUploadProgress(null);

              // Auto-save downloadURL in database instantly
              const upiExtraUrl = (field === 'upiQrCode') ? { paymentQrCodeIndia: downloadURL } : {};
              const currentSettings = settings || {};
              const finalUpdated = {
                ...currentSettings,
                [field]: downloadURL,
                ...upiExtraUrl,
                paymentSettings: {
                  ...(currentSettings.paymentSettings || {}),
                  [paymentSettingsField]: downloadURL
                }
              };

              setSettings(finalUpdated);
              setPreview(downloadURL);
              localStorage.setItem(cachedKey, downloadURL);
              setIsUploading(false);
              setUploadProgress(null);
              setUploadSuccess(true);

              // Direct Firestore write
              await setDoc(doc(db, 'settings', 'main'), finalUpdated);
              console.log(`Auto-saved settings back to Firestore successfully for field: ${field}.`);

            } catch (err: any) {
              console.error("Failed to retrieve uploaded image URL:", err);
              setIsUploading(false);
            }
          }
        );
      } catch (err: any) {
        console.error("Background compression / upload initialization error:", err);
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteQR = async () => {
    if (!confirm(`Are you sure you want to delete the QR code for ${label}?`)) return;
    setIsSavingLocal(true);
    try {
      localStorage.removeItem(cachedKey);
      setPreview(null);
      setUploadSuccess(false);

      const upiExtra = (field === 'upiQrCode') ? { paymentQrCodeIndia: '' } : {};
      const updated = {
        ...settings,
        [field]: '',
        ...upiExtra,
        paymentSettings: {
          ...(settings?.paymentSettings || {}),
          [paymentSettingsField]: ''
        }
      };
      await setDoc(doc(db, 'settings', 'main'), updated);
      setSettings(updated);
      alert(`${label} deleted successfully.`);
    } catch (err: any) {
      alert("Failed to delete QR: " + err.message);
    } finally {
      setIsSavingLocal(false);
    }
  };

  return (
    <div className="space-y-3 bg-gray-50/65 p-4 rounded-3xl border border-gray-150 font-sans flex flex-col justify-between h-full min-h-[300px]">
      <div className="space-y-2 flex-grow">
        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block text-center">
          {label}
        </label>

        {/* Enable / Disable switch status */}
        <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-gray-150 shadow-xs select-none mb-1">
          <span className="text-[9px] font-black uppercase text-gray-500 tracking-wider">
            {isEnabled ? "🟢 ACTIVE" : "🔴 DISABLED"}
          </span>
          <button
            type="button"
            onClick={handleToggle}
            className={cn(
              "relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none",
              isEnabled ? "bg-orange-500" : "bg-gray-200"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                isEnabled ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>
        
        {/* Preview Container */}
        <div className="relative w-full h-36 bg-white rounded-2xl border border-gray-150 flex items-center justify-center p-2 overflow-hidden shadow-inner">
          {preview ? (
            <img 
              src={preview} 
              className="w-full h-full object-contain animate-fadeIn" 
              alt={label} 
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="text-center p-4">
              <QrCode size={32} className="text-gray-300 mx-auto mb-2 animate-pulse" />
              <p className="text-[8px] text-gray-400 font-bold uppercase select-none">No QR Registered</p>
            </div>
          )}

          {uploadSuccess && (
            <span className="absolute top-2 left-2 bg-green-500 text-white px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-wider shadow-sm animate-bounce">
              ✓ Upload Successful
            </span>
          )}
        </div>
      </div>

      {uploadSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-[10px] font-extrabold px-3 py-1.5 rounded-xl flex items-center justify-center gap-1.5 mt-1 animate-fadeIn">
          <Check size={12} className="stroke-[3]" />
          ✓ QR UPLOADED SUCCESSFULLY
        </div>
      )}

      {isUploading && (
        <div className="space-y-1.5 font-sans mt-1">
          <div className="flex justify-between text-[9px] font-black text-blue-650 uppercase tracking-widest pl-0.5">
            <span>Uploading...</span>
            <span>{uploadProgress || 0}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-650 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress || 0}%` }}></div>
          </div>
        </div>
      )}

      <div className="space-y-2 pt-2 border-t border-gray-100 mt-2">
        {/* Universal Input Selector for camera capture & files */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUploadFile(file);
          }}
        />

        {/* Action Buttons */}
        {preview ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 p-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all select-none disabled:opacity-50"
              disabled={isSavingLocal}
            >
              <RotateCcw size={12} />
              Replace QR
            </button>
            <button
              type="button"
              onClick={handleDeleteQR}
              disabled={isSavingLocal}
              className="flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 p-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all select-none"
            >
              <Trash2 size={12} />
              Delete QR
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 active:scale-98 shadow-sm select-none"
          >
            <Upload size={13} className="stroke-[3]" />
            Upload QR photo
          </button>
        )}
      </div>
    </div>
  );
}

function CMSManager({ onResetFinancials }: { onResetFinancials?: () => Promise<void> }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    // Recursive helper to clean any corrupted base64 images from Firestore settings
    const scrubBase64 = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) {
        return obj.map(scrubBase64);
      }
      const result: any = {};
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (typeof val === 'string' && val.startsWith('data:image') && val.length > 2000) {
          console.warn(`[Security Safeguard] Scrubbed huge base64 parameter from settings key: ${key}`);
          result[key] = '';
        } else if (typeof val === 'object') {
          result[key] = scrubBase64(val);
        } else {
          result[key] = val;
        }
      }
      return result;
    };

    getDoc(doc(db, 'settings', 'main')).then(snap => {
      if (snap.exists()) {
        const rawData = snap.data() as SiteSettings;
        const data = scrubBase64(rawData);
        // Migration: Ensure new fields exist
        if (!data.countrySettings) {
          data.countrySettings = {
            Nepal: { enabled: true, baseDeliveryFee: data.deliveryFee || 100, freeDeliveryThreshold: data.minOrderForFreeDelivery || 2000, handlingFee: 0, paymentMethods: ['COD', 'Khalti', 'eSewa'], estimatedDays: '2-4 Days' },
            India: { enabled: false, baseDeliveryFee: 500, freeDeliveryThreshold: 10000, handlingFee: 50, paymentMethods: ['COD', 'UPI', 'PhonePe'], estimatedDays: '5-7 Days' }
          };
        } else {
          // Ensure estimatedDays exists if countrySettings exists
          if (data.countrySettings.Nepal && !data.countrySettings.Nepal.estimatedDays) data.countrySettings.Nepal.estimatedDays = '2-4 Days';
          if (data.countrySettings.India && !data.countrySettings.India.estimatedDays) data.countrySettings.India.estimatedDays = '5-7 Days';
        }
        if (!data.locationWiseFees) data.locationWiseFees = { Nepal: {}, India: {} };
        if (data.aiSupportEnabled === undefined) data.aiSupportEnabled = true;
        if (data.aiSupportInstruction === undefined) data.aiSupportInstruction = "You are the NexaMart Support AI. Be professional, helpful, and speak in a friendly tone. Assist with order status and generic inquiries.";
        if (!data.paymentSettings) {
          data.paymentSettings = {
            esewaQR: data.esewaQrCode || '',
            khaltiQR: data.khaltiQrCode || '',
            fonepayQR: data.fonePayQrCode || '',
            phonepeQR: data.phonePeQrCode || '',
            gpayQR: data.gPayQrCode || '',
            paytmQR: data.paytmQrCode || '',
            upiQR: data.upiQrCode || '',
            esewaEnabled: true,
            khaltiEnabled: true,
            fonepayEnabled: true,
            phonepeEnabled: true,
            gpayEnabled: true,
            paytmEnabled: true,
            upiEnabled: true
          };
        } else {
          if (!data.paymentSettings.esewaQR && data.esewaQrCode) data.paymentSettings.esewaQR = data.esewaQrCode;
          if (!data.paymentSettings.khaltiQR && data.khaltiQrCode) data.paymentSettings.khaltiQR = data.khaltiQrCode;
          if (!data.paymentSettings.fonepayQR && data.fonePayQrCode) data.paymentSettings.fonepayQR = data.fonePayQrCode;
          if (!data.paymentSettings.phonepeQR && data.phonePeQrCode) data.paymentSettings.phonepeQR = data.phonePeQrCode;
          if (!data.paymentSettings.gpayQR && data.gPayQrCode) data.paymentSettings.gpayQR = data.gPayQrCode;
          if (!data.paymentSettings.paytmQR && data.paytmQrCode) data.paymentSettings.paytmQR = data.paytmQrCode;
          if (!data.paymentSettings.upiQR && data.upiQrCode) data.paymentSettings.upiQR = data.upiQrCode;

          if (data.paymentSettings.esewaEnabled === undefined) data.paymentSettings.esewaEnabled = true;
          if (data.paymentSettings.khaltiEnabled === undefined) data.paymentSettings.khaltiEnabled = true;
          if (data.paymentSettings.fonepayEnabled === undefined) data.paymentSettings.fonepayEnabled = true;
          if (data.paymentSettings.phonepeEnabled === undefined) data.paymentSettings.phonepeEnabled = true;
          if (data.paymentSettings.gpayEnabled === undefined) data.paymentSettings.gpayEnabled = true;
          if (data.paymentSettings.paytmEnabled === undefined) data.paymentSettings.paytmEnabled = true;
          if (data.paymentSettings.upiEnabled === undefined) data.paymentSettings.upiEnabled = true;
        }
        
        setSettings(data);
      } else {
        // Provide blank defaults if nothing exists
        setSettings({
          id: 'main',
          privacyPolicy: '',
          termsAndConditions: '',
          aboutUs: '',
          faqs: [],
          khaltiQrCode: '',
          esewaQrCode: '',
          deliveryFee: 100,
          minOrderForFreeDelivery: 2000,
          supportWhatsapp: '+9779700694631',
          aiSupportEnabled: true,
          aiSupportInstruction: "You are the NexaMart Support AI. Be professional, helpful, and speak in a friendly tone. Assist with order status and generic inquiries.",
          countrySettings: {
            Nepal: { enabled: true, baseDeliveryFee: 100, freeDeliveryThreshold: 2000, handlingFee: 0, paymentMethods: ['COD', 'Khalti', 'eSewa'], estimatedDays: '2-4 Days' },
            India: { enabled: false, baseDeliveryFee: 500, freeDeliveryThreshold: 10000, handlingFee: 50, paymentMethods: ['COD', 'UPI', 'PhonePe', 'GPay', 'Paytm'], estimatedDays: '5-7 Days' }
          },
          locationWiseFees: { Nepal: {}, India: {} },
          paymentSettings: {
            fonepayQR: '',
            esewaQR: '',
            khaltiQR: '',
            phonepeQR: '',
            gpayQR: '',
            paytmQR: '',
            upiQR: '',
            esewaEnabled: true,
            khaltiEnabled: true,
            fonepayEnabled: true,
            phonepeEnabled: true,
            gpayEnabled: true,
            paytmEnabled: true,
            upiEnabled: true
          }
        } as SiteSettings);
      }
      setIsInitializing(false);
    }).catch(err => {
      console.error("Settings load error:", err);
      setIsInitializing(false);
    });
  }, []);

  const handleSave = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!settings) return;
    setIsSaving(true);
    const path = 'settings/main';
    try {
      await setDoc(doc(db, 'settings', 'main'), settings);
      setIsEditing(false);
      alert("System configuration updated.");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!onResetFinancials) return;
    setIsResetting(true);
    try {
      await onResetFinancials();
    } catch (err) {
       console.error("Reset callback error:", err);
    } finally {
      setIsResetting(false);
    }
  };

  if (isInitializing) return <div className="text-center p-10 opacity-30 text-[10px] font-black uppercase tracking-widest animate-pulse">Accessing Server Config...</div>;
  if (!settings) return null;

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Public Documentation & Media</h3>
          <button onClick={() => setIsEditing(!isEditing)} className="text-red-700 font-black text-[10px] uppercase tracking-widest">
            {isEditing ? 'Cancel Edit' : 'Modify Policy'}
          </button>
       </div>

       <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="space-y-4">
             <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Privacy Policy</label>
                {isEditing ? (
                  <textarea 
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-xs h-24 outline-none focus:bg-white focus:ring-2 focus:ring-red-500"
                    value={settings.privacyPolicy}
                    onChange={e => setSettings({ ...settings, privacyPolicy: e.target.value })}
                  />
                ) : <p className="text-[10px] text-gray-600 font-medium line-clamp-2">{settings.privacyPolicy}</p>}
              </div>

                       <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Global Delivery Fee (Rs.)</label>
                   {isEditing ? (
                     <input 
                       type="number"
                       className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-red-500"
                       value={settings.deliveryFee || 0}
                       onChange={e => setSettings({ ...settings, deliveryFee: Number(e.target.value) })}
                     />
                   ) : <p className="text-sm font-black text-gray-900">Rs. {settings.deliveryFee || 0}</p>}
                </div>
                <div className="space-y-1">
                   <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Global Free Threshold (Rs.)</label>
                   {isEditing ? (
                     <input 
                       type="number"
                       className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-red-500"
                       value={settings.minOrderForFreeDelivery || 0}
                       onChange={e => setSettings({ ...settings, minOrderForFreeDelivery: Number(e.target.value) })}
                     />
                   ) : <p className="text-sm font-black text-gray-900">Rs. {settings.minOrderForFreeDelivery || 0}</p>}
                </div>
             </div>

             {/* Country Specific Management */}
             <div className="space-y-6 pt-4 border-t border-gray-50">
               <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">International Expansion Control</h4>
               
               {(['Nepal', 'India'] as const).map(country => (
                 <div key={country} className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", settings.countrySettings?.[country]?.enabled ? "bg-green-500" : "bg-gray-300")} />
                        <span className="text-xs font-black uppercase tracking-tight">{country}</span>
                      </div>
                      <button 
                        onClick={() => {
                          if (!isEditing) return;
                          const current = settings.countrySettings?.[country] || { enabled: false, baseDeliveryFee: 100, freeDeliveryThreshold: 5000, handlingFee: 0, paymentMethods: [] };
                          setSettings({
                            ...settings,
                            countrySettings: {
                              ...settings.countrySettings,
                              [country]: { ...current, enabled: !current.enabled }
                            }
                          });
                        }}
                        className={cn(
                          "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all",
                          !isEditing && "opacity-50",
                          settings.countrySettings?.[country]?.enabled ? "bg-green-600 text-white" : "bg-gray-200 text-gray-500"
                        )}
                      >
                        {settings.countrySettings?.[country]?.enabled ? 'Active' : 'Disabled'}
                      </button>
                    </div>

                    {settings.countrySettings?.[country]?.enabled && (
                      <div className="grid grid-cols-2 gap-3">
                         <div className="space-y-1">
                            <label className="text-[8px] font-black text-gray-400 uppercase">Base Delivery</label>
                            {isEditing ? (
                              <input 
                                type="number" 
                                className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs font-bold"
                                value={settings.countrySettings[country]?.baseDeliveryFee || 0}
                                onChange={e => {
                                  const val = Number(e.target.value);
                                  setSettings({
                                    ...settings,
                                    countrySettings: {
                                      ...settings.countrySettings,
                                      [country]: { ...settings.countrySettings![country]!, baseDeliveryFee: val }
                                    }
                                  });
                                }}
                              />
                            ) : <p className="text-[10px] font-black">Rs. {settings.countrySettings[country]?.baseDeliveryFee}</p>}
                         </div>
                         <div className="space-y-1">
                            <label className="text-[8px] font-black text-gray-400 uppercase">Free Threshold</label>
                            {isEditing ? (
                              <input 
                                type="number" 
                                className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs font-bold"
                                value={settings.countrySettings[country]?.freeDeliveryThreshold || 0}
                                onChange={e => {
                                  const val = Number(e.target.value);
                                  setSettings({
                                    ...settings,
                                    countrySettings: {
                                      ...settings.countrySettings,
                                      [country]: { ...settings.countrySettings![country]!, freeDeliveryThreshold: val }
                                    }
                                  });
                                }}
                              />
                            ) : <p className="text-[10px] font-black">Rs. {settings.countrySettings[country]?.freeDeliveryThreshold}</p>}
                         </div>
                         <div className="space-y-1">
                            <label className="text-[8px] font-black text-gray-400 uppercase">Handling Fee</label>
                            {isEditing ? (
                              <input 
                                type="number" 
                                className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs font-bold"
                                value={settings.countrySettings[country]?.handlingFee || 0}
                                onChange={e => {
                                  const val = Number(e.target.value);
                                  setSettings({
                                    ...settings,
                                    countrySettings: {
                                      ...settings.countrySettings,
                                      [country]: { ...settings.countrySettings![country]!, handlingFee: val }
                                    }
                                  });
                                }}
                              />
                            ) : <p className="text-[10px] font-black">Rs. {settings.countrySettings[country]?.handlingFee}</p>}
                         </div>
                         <div className="space-y-1 col-span-2">
                             <label className="text-[8px] font-black text-gray-400 uppercase">Estimated Delivery (e.g. 3-5 Days)</label>
                             {isEditing ? (
                               <input 
                                 type="text" 
                                 className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs font-bold"
                                 value={settings.countrySettings[country]?.estimatedDays || ''}
                                 onChange={e => {
                                   setSettings({
                                     ...settings,
                                     countrySettings: {
                                       ...settings.countrySettings,
                                       [country]: { ...settings.countrySettings![country]!, estimatedDays: e.target.value }
                                     }
                                   });
                                 }}
                               />
                             ) : <p className="text-[10px] font-black">{settings.countrySettings[country]?.estimatedDays}</p>}
                         </div>
                         <div className="space-y-1 col-span-2">
                            <label className="text-[8px] font-black text-gray-400 uppercase">Enabled Payments</label>
                            <div className="flex flex-wrap gap-2 mt-1">
                               {(country === 'Nepal' ? ['COD', 'eSewa', 'Khalti', 'FonePay'] : ['COD', 'UPI', 'PhonePe', 'GPay', 'Paytm']).map(method => {
                                 const isSelected = settings.countrySettings?.[country]?.paymentMethods?.includes(method);
                                 return (
                                   <button
                                     key={method}
                                     onClick={() => {
                                       if (!isEditing) return;
                                       const currentMethods = settings.countrySettings?.[country]?.paymentMethods || [];
                                       const newMethods = isSelected 
                                         ? currentMethods.filter(m => m !== method)
                                         : [...currentMethods, method];
                                       setSettings({
                                         ...settings,
                                         countrySettings: {
                                           ...settings.countrySettings,
                                           [country]: { ...settings.countrySettings![country]!, paymentMethods: newMethods }
                                         }
                                       });
                                     }}
                                     className={cn(
                                       "px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all",
                                       isSelected ? "bg-gray-900 text-white" : "bg-white border border-gray-100 text-gray-400"
                                     )}
                                   >
                                     {method}
                                   </button>
                                 );
                               })}
                            </div>
                         </div>
                      </div>
                    )}
                 </div>
               ))}
             </div>
     </div>
             
             <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Support WhatsApp Number</label>
                {isEditing ? (
                  <input 
                    type="text"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-red-500 font-bold"
                    placeholder="+9779700694631"
                    value={settings.supportWhatsapp || ''}
                    onChange={e => setSettings({ ...settings, supportWhatsapp: e.target.value })}
                  />
                ) : (
                  <p className="text-sm font-black text-green-600">{settings.supportWhatsapp || 'Not Configured'}</p>
                )}
             </div>

             <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">About Platform</label>
                {isEditing ? (
                  <textarea 
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-xs h-32 outline-none focus:bg-white focus:ring-2 focus:ring-red-500"
                    value={settings.aboutUs}
                    onChange={e => setSettings({ ...settings, aboutUs: e.target.value })}
                  />
                ) : <p className="text-[10px] text-gray-600 font-medium line-clamp-3">{settings.aboutUs}</p>}
             </div>

             <div className="space-y-6">
                {/* NEPAL QR CODES CHANNELS */}
                <div className="space-y-4">
                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="text-[11px] font-black text-orange-650 uppercase tracking-widest">🇳🇵 NEPAL CHANNELS - DIGITAL PAYMENT QR</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <QrUploadCard
                      label="Upload eSewa QR"
                      value={settings.esewaQrCode}
                      field="esewaQrCode"
                      paymentSettingsField="esewaQR"
                      enabledField="esewaEnabled"
                      isEditing={isEditing}
                      settings={settings}
                      setSettings={setSettings}
                    />
                    <QrUploadCard
                      label="Upload Khalti QR"
                      value={settings.khaltiQrCode}
                      field="khaltiQrCode"
                      paymentSettingsField="khaltiQR"
                      enabledField="khaltiEnabled"
                      isEditing={isEditing}
                      settings={settings}
                      setSettings={setSettings}
                    />
                    <QrUploadCard
                      label="Upload Fonepay QR"
                      value={settings.fonePayQrCode}
                      field="fonePayQrCode"
                      paymentSettingsField="fonepayQR"
                      enabledField="fonepayEnabled"
                      isEditing={isEditing}
                      settings={settings}
                      setSettings={setSettings}
                    />
                  </div>
                </div>
             </div>

          <div className="pt-6 border-t border-gray-50 flex flex-col gap-3">
             <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-1">System Integrity</h4>
             <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center gap-3">
                <Shield size={16} className="text-blue-600" />
                <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">All system operations are monitored for security.</p>
             </div>
             
             {/* Maintenance Section */}
             <div className="p-6 bg-red-50 rounded-3xl border border-red-100 space-y-4">
                <div className="flex items-center gap-3 text-red-600">
                   <AlertTriangle size={20} />
                   <h4 className="text-[10px] font-black uppercase tracking-widest">Maintenance Control</h4>
                </div>
                <p className="text-[9px] text-red-700 font-medium leading-relaxed font-bold uppercase">Resetting financials will clear all Platform GMV, Revenue record, Commissions, Orders history, and Withdrawal logs. User accounts and products will remain safe.</p>
                <button 
                  onClick={handleReset}
                  disabled={isResetting}
                  className="w-full bg-red-600 text-white font-black py-4 rounded-2xl text-[9px] uppercase tracking-[0.2em] shadow-xl shadow-red-100 active:scale-95 transition-all disabled:opacity-50 disabled:animate-pulse"
                >
                  {isResetting ? "Cleaning Mainframe..." : "Clean Platform Financials"}
                </button>
             </div>
             
             {isEditing && (
                <button 
                   onClick={() => handleSave()} 
                   disabled={isSaving}
                   className="w-full bg-red-700 text-white font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-xs uppercase tracking-widest mt-2 disabled:opacity-50"
                >
                   {isSaving ? "Updating Mainframe..." : <><Save size={18} /> Update Server Metadata</>}
                </button>
             )}
          </div>
       </div>

       <div className="bg-gray-100 rounded-2xl p-4 flex items-start gap-3">
          <HelpCircle size={20} className="text-gray-400 shrink-0" />
          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">Changes made here will instantly reflect across all user documentation pages including mobile apps.</p>
       </div>
    </div>
  );
}

function BannerManager({ banners, setBanners }: { banners: Banner[], setBanners: React.Dispatch<React.SetStateAction<Banner[]>> }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [uploadMode, setUploadMode] = useState<'single' | 'multiple'>('single');
  const [newBanner, setNewBanner] = useState<{
    title: string;
    imageUrl: string;
    videoUrl?: string;
    mediaType?: 'image' | 'video';
    link: string;
    active: boolean;
    order: number;
    festivalTag?: string;
  }>({ 
    title: '', 
    imageUrl: '', 
    videoUrl: '',
    mediaType: 'image',
    link: '', 
    active: true,
    order: 0,
    festivalTag: 'none'
  });

  // Global slideshow and festival settings
  const [bannerSettings, setBannerSettings] = useState({
    autoPlay: true,
    autoScroll: true,
    autoSlideTiming: 5,
    activeFestival: 'none',
    festivalConfetti: true,
    festivalThemeColor: '#EA580C'
  });

  // Webcam states
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [webcamActive, setWebcamActive] = useState(false);
  const webcamVideoRef = React.useRef<HTMLVideoElement>(null);

  // Load Banner Settings from Firebase
  useEffect(() => {
    const unsubSec = onSnapshot(doc(db, 'settings', 'banners'), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setBannerSettings({
          autoPlay: d.autoPlay !== false,
          autoScroll: d.autoScroll !== false,
          autoSlideTiming: d.autoSlideTiming || 5,
          activeFestival: d.activeFestival || 'none',
          festivalConfetti: d.festivalConfetti !== false,
          festivalThemeColor: d.festivalThemeColor || '#EA580C'
        });
      }
    });
    return () => unsubSec();
  }, []);

  const handleUpdateSettings = async (updates: Partial<typeof bannerSettings>) => {
    try {
      await setDoc(doc(db, 'settings', 'banners'), updates, { merge: true });
    } catch (err) {
      console.error("Failed to save banner configurations: ", err);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer.getData('text/plain');
    if (!sourceIndexStr) return;
    const sourceIndex = parseInt(sourceIndexStr);
    if (sourceIndex === targetIndex) return;

    const reordered = [...banners];
    const [removed] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    try {
      const batch = writeBatch(db);
      reordered.forEach((banner, idx) => {
        batch.update(doc(db, 'banners', banner.bannerId), { order: idx });
      });
      await batch.commit();
    } catch (err) {
      console.error("Failed to commit drag reorder: ", err);
    }
  };

  const processAndSaveFile = async (file: File, replaceBannerId?: string) => {
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedExtensions.includes(fileExt)) {
      alert("Unsupported format. Please select a JPG, JPEG, PNG, or WEBP image.");
      return;
    }
    
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeBytes) {
      alert("File size exceeds 10MB limit. Please upload a smaller image.");
      return;
    }

    setImageUploadProgress(5);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const rawBase64 = reader.result as string;
          setImageUploadProgress(30);
          
          // Compress image to fit Firestore doc size safely while keeping incredible quality
          const compressedBase64 = await compressImage(rawBase64, 1200, 1200, 0.75);
          setImageUploadProgress(80);
          
          if (replaceBannerId) {
            await updateDoc(doc(db, 'banners', replaceBannerId), {
              imageUrl: compressedBase64
            });
            alert("Banner replaced successfully!");
          } else {
            // For creation/edit form drafts, set the imageUrl state for INSTANT PREVIEW in form
            setNewBanner(prev => ({ ...prev, imageUrl: compressedBase64 }));
            // Fill title automatically from file name if title is empty
            if (!newBanner.title) {
              const rawName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
              const prettyTitle = rawName
                .replace(/[-_]/g, ' ')
                .replace(/\b\w/g, c => c.toUpperCase());
              setNewBanner(prev => ({ ...prev, title: prettyTitle }));
            }
          }
          setImageUploadProgress(100);
        } catch (compErr: any) {
          console.error("Image processing error:", compErr);
          alert("Image processing failed: " + compErr.message);
        } finally {
          setTimeout(() => setImageUploadProgress(null), 300);
        }
      };
      
      reader.onerror = (err) => {
        console.error("FileReader failed:", err);
        alert("Failed to load file content.");
        setImageUploadProgress(null);
      };
    } catch (err: any) {
      console.error("Upload preparation failed:", err);
      alert("Upload error: " + err.message);
      setImageUploadProgress(null);
    }
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setWebcamStream(stream);
      setWebcamActive(true);
      setTimeout(() => {
        if (webcamVideoRef.current) {
          webcamVideoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      alert("Unable to open device camera. Make sure permissions are provided.");
    }
  };

  const stopWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach(t => t.stop());
      setWebcamStream(null);
    }
    setWebcamActive(false);
  };

  const captureWebcamPic = async () => {
    if (webcamVideoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = webcamVideoRef.current.videoWidth || 1280;
      canvas.height = webcamVideoRef.current.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(webcamVideoRef.current, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
            stopWebcam();
            await processAndSaveFile(file);
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  // Multiple Banners/Bulk state
  const [multipleFiles, setMultipleFiles] = useState<File[]>([]);
  const [bulkQueue, setBulkQueue] = useState<{
    id: string;
    name: string;
    progress: number;
    status: 'idle' | 'uploading' | 'completed' | 'failed';
    error?: string;
  }[]>([]);
  const [isBulkUploading, setIsBulkUploading] = useState(false);

  const [imageUploadProgress, setImageUploadProgress] = useState<number | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [previewItem, setPreviewItem] = useState<Banner | null>(null);

  // Set the order of a new banner to the end of the collection
  useEffect(() => {
    if (!editingBanner) {
      setNewBanner(prev => ({ ...prev, order: banners.length, festivalTag: 'none' }));
    }
  }, [banners.length, editingBanner]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBanner.imageUrl) {
      return alert("Please upload a banner image");
    }
    
    setIsDeploying(true);
    try {
      const bannerId = editingBanner ? editingBanner.bannerId : `banner-${Date.now()}`;
      const bannerData: Banner = { 
        ...newBanner, 
        bannerId,
        mediaType: 'image',
        videoUrl: '',
        order: editingBanner && editingBanner.order !== undefined ? editingBanner.order : newBanner.order
      };
      
      await setDoc(doc(db, 'banners', bannerId), bannerData);
      
      setIsAdding(false);
      setEditingBanner(null);
      setNewBanner({ 
        title: '', 
        imageUrl: '', 
        link: '', 
        active: true,
        order: banners.length,
        festivalTag: 'none'
      });
      alert(editingBanner ? "Banner updated successfully!" : "Banner deployed successfully!");
    } catch (err) {
      console.error("Banner deploy error:", err);
      // Specific error for Firestore size limit
      if (err instanceof Error && err.message.includes('too large')) {
         alert("Data is too large! Please compress your image or use external urls.");
      } else {
         alert("Failed to deploy banner: " + (err instanceof Error ? err.message : String(err)));
      }
    } finally {
      setIsDeploying(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this offer permanently from database and app?")) return;
    try {
      const bannerItem = banners.find(b => b.bannerId === id);
      if (bannerItem) {
        if (bannerItem.imageUrl && bannerItem.imageUrl.includes('firebasestorage.googleapis.com')) {
          try {
            const fileRef = ref(storage, bannerItem.imageUrl);
            await deleteObject(fileRef);
            console.log("Deleted banner image from storage:", bannerItem.imageUrl);
          } catch (storageErr) {
            console.warn("Storage file deletion error (ignored):", storageErr);
          }
        }
      }
      await deleteDoc(doc(db, 'banners', id));
      setBanners(prev => prev.filter(b => b.bannerId !== id));
      if (previewItem?.bannerId === id) {
        setPreviewItem(null);
      }
    } catch (err) {
      alert("Delete failed");
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setUploadMode('single'); // Forced on edit mode
    setNewBanner({
      title: banner.title,
      imageUrl: banner.imageUrl || '',
      link: banner.link || '',
      active: banner.active,
      order: banner.order !== undefined ? banner.order : 0,
      festivalTag: (banner as any).festivalTag || 'none'
    });
    setIsAdding(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processAndSaveFile(file);
    }
  };

  const handleReplaceUpload = async (e: React.ChangeEvent<HTMLInputElement>, bannerId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      await processAndSaveFile(file, bannerId);
    }
  };

  // Multiple banner bulk selection & deployment
  const handleMultipleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    // Add only images
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length < files.length) {
      alert("Only image files are allowed in multiple bulk upload session. Some files were skipped.");
    }
    if (imageFiles.length === 0) return;

    const newQueueItems = imageFiles.map(f => ({
      id: `${f.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: f.name,
      progress: 0,
      status: 'idle' as const
    }));

    setMultipleFiles(prev => [...prev, ...imageFiles]);
    setBulkQueue(prev => [...prev, ...newQueueItems]);
  };

  const handleRemoveFromQueue = (index: number) => {
    if (isBulkUploading) return;
    setMultipleFiles(prev => prev.filter((_, i) => i !== index));
    setBulkQueue(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeployBulkBanners = async () => {
    if (multipleFiles.length === 0) {
      alert("No banners present in multiple upload queue!");
      return;
    }
    
    setIsBulkUploading(true);
    let successCount = 0;
    
    for (let i = 0; i < multipleFiles.length; i++) {
      const file = multipleFiles[i];
      
      // Update status to 'uploading' (processing)
      setBulkQueue(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'uploading', progress: 10 } : item));
      
      try {
        const compressedBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = async () => {
            try {
              setBulkQueue(prev => prev.map((item, idx) => idx === i ? { ...item, progress: 40 } : item));
              const res = await compressImage(reader.result as string, 1200, 1200, 0.75);
              setBulkQueue(prev => prev.map((item, idx) => idx === i ? { ...item, progress: 80 } : item));
              resolve(res);
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = (err) => reject(err);
        });
        
        // Pretty Title
        const rawName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        const prettyTitle = rawName
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());
        
        // Save to Firestore
        const bId = `banner-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const bannerData: Banner = {
          bannerId: bId,
          title: prettyTitle,
          imageUrl: compressedBase64,
          videoUrl: '',
          mediaType: 'image',
          link: '',
          active: true,
          order: banners.length + successCount
        };
        
        await setDoc(doc(db, 'banners', bId), bannerData);
        successCount++;
        
        setBulkQueue(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'completed', progress: 100 } : item));
      } catch (err: any) {
        console.error("Bulk upload queue error at index " + i + ":", err);
        setBulkQueue(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'failed', error: err?.message || String(err) } : item));
      }
    }
    
    setIsBulkUploading(false);
    alert(`Successfully deployed ${successCount} out of ${multipleFiles.length} banners!`);
    
    // Clear queue of successfully uploaded items
    setMultipleFiles([]);
    setBulkQueue([]);
    setIsAdding(false);
  };

  const handleReorder = async (currentIndex: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex < 0 || nextIndex >= banners.length) return;
    
    try {
      const currentBanner = banners[currentIndex];
      const nextBanner = banners[nextIndex];
      
      // Swap order attributes in Firestore database to trigger sorting globally
      await setDoc(doc(db, 'banners', currentBanner.bannerId), { ...currentBanner, order: nextIndex });
      await setDoc(doc(db, 'banners', nextBanner.bannerId), { ...nextBanner, order: currentIndex });
    } catch (err) {
      console.error("Reordering failed: ", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h3 className="text-xs font-black text-gray-900 uppercase font-sans">Banner & Offer System</h3>
          <p className="text-[8px] text-gray-400 font-bold uppercase mt-0.5">Deploy multiple interactive images & video streams below client corridors</p>
        </div>
        <button 
          onClick={() => {
            setIsAdding(!isAdding);
            if (isAdding) {
              setEditingBanner(null);
                        setNewBanner({ 
                title: '', 
                imageUrl: '', 
                link: '', 
                active: true,
                order: banners.length,
                festivalTag: 'none'
              });
            }
          }}
          className={cn(
            "p-2.5 rounded-xl transition-all active:scale-95 flex items-center gap-1 cursor-pointer font-sans",
            isAdding ? "bg-red-50 text-red-600 border border-red-200" : "bg-red-700 text-white font-black text-[9px] uppercase tracking-wider shadow-lg"
          )}
        >
          {isAdding ? <X size={16} /> : <><Plus size={14} className="stroke-[3]" /> Add Banner</>}
        </button>
      </div>

      {/* Dynamic Slide Speed and Festival Celebrations Controls */}
      <div className="bg-gradient-to-br from-gray-900 to-indigo-950 text-white p-5 rounded-3xl shadow-lg border border-white/5 space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-red-500 animate-pulse" />
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-200 font-sans">Interactive Campaign Engine settings</h4>
              <p className="text-[7.5px] text-gray-400 font-bold uppercase mt-0.5 font-sans">Control live client slide timing, auto-scrolling speed, active festival celebrations</p>
            </div>
          </div>
          <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse font-sans">
            ★ Live Configuration
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-sans">
          {/* Autoplay & AutoScroll toggles */}
          <div className="space-y-2">
            <label className="text-[7.5px] font-black text-gray-400 uppercase tracking-widest block mb-1 font-sans">Slide Animation Protocol</label>
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-2 cursor-pointer text-[9px] text-gray-300 font-bold font-sans">
                <input 
                  type="checkbox" 
                  checked={bannerSettings.autoPlay}
                  onChange={e => handleUpdateSettings({ autoPlay: e.target.checked })}
                  className="rounded bg-white/5 border-white/10 text-red-500 w-3.5 h-3.5"
                />
                AUTOPLAY TRANSITIONS
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-[9px] text-gray-300 font-bold font-sans">
                <input 
                  type="checkbox" 
                  checked={bannerSettings.autoScroll}
                  onChange={e => handleUpdateSettings({ autoScroll: e.target.checked })}
                  className="rounded bg-white/5 border-white/10 text-red-500 w-3.5 h-3.5"
                />
                AUTO-SCROLL BEHAVIOR
              </label>
            </div>
          </div>

          {/* Timing Control */}
          <div>
            <label className="text-[7.5px] font-black text-gray-400 uppercase tracking-widest block mb-1 font-sans">Rotation Timing Interval</label>
            <select
              value={bannerSettings.autoSlideTiming}
              onChange={e => handleUpdateSettings({ autoSlideTiming: parseInt(e.target.value) })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-2.5 py-2 text-[9px] font-bold text-white outline-none cursor-pointer font-sans"
            >
              <option value="3" className="bg-slate-900">3 Seconds (Fast)</option>
              <option value="5" className="bg-slate-900">5 Seconds (Balanced)</option>
              <option value="8" className="bg-slate-900">8 Seconds (Leisure)</option>
              <option value="10" className="bg-slate-900">10 Seconds (Calm)</option>
            </select>
          </div>

          {/* Festival celebration selection */}
          <div>
            <label className="text-[7.5px] font-black text-gray-400 uppercase tracking-widest block mb-1 font-sans">Active Celebration Mode</label>
            <select
              value={bannerSettings.activeFestival}
              onChange={e => handleUpdateSettings({ activeFestival: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-2.5 py-2 text-[9px] font-bold text-white outline-none cursor-pointer font-sans"
            >
              <option value="none" className="bg-slate-900">None (De-activate Celebration)</option>
              <option value="Dashain" className="bg-slate-900">🇳🇵 Dashain Festival Mode</option>
              <option value="Tihar" className="bg-slate-900">🇳🇵 Tihar Light Ceremony</option>
              <option value="Holi" className="bg-slate-900">🎨 Holi Color Wave</option>
              <option value="Diwali" className="bg-slate-900">🪔 Diwali Lamps On</option>
              <option value="Christmas" className="bg-slate-900">🎄 Christmas Celebration</option>
            </select>
          </div>

          {/* Celebrate options */}
          <div className="space-y-1.5">
            <label className="text-[7.5px] font-black text-gray-400 uppercase tracking-widest block mb-0.5 font-sans">Festival Visual Accent</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1 cursor-pointer text-[9px] text-gray-300 font-bold font-sans">
                <input 
                  type="checkbox" 
                  checked={bannerSettings.festivalConfetti}
                  onChange={e => handleUpdateSettings({ festivalConfetti: e.target.checked })}
                  className="rounded bg-white/5 border-white/10 text-red-500 w-3.5 h-3.5"
                />
                RAIN CONFETTI
              </label>
              <input 
                type="color" 
                value={bannerSettings.festivalThemeColor}
                onChange={e => handleUpdateSettings({ festivalThemeColor: e.target.value })}
                className="w-6 h-6 rounded-lg bg-transparent border-0 cursor-pointer"
                title="Choose custom color theme for festival cards"
              />
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-5 overflow-hidden"
          >
            {/* If not editing, show selection between Single and Multiple */}
            {!editingBanner && (
              <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-150">
                <button
                  type="button"
                  onClick={() => setUploadMode('single')}
                  className={cn(
                    "flex-1 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all font-sans cursor-pointer",
                    uploadMode === 'single' ? "bg-white text-red-750 shadow-sm font-black border border-gray-200" : "text-gray-400 hover:text-gray-655 font-bold"
                  )}
                >
                  Configure Single Banner
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('multiple')}
                  className={cn(
                    "flex-1 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all font-sans cursor-pointer",
                    uploadMode === 'multiple' ? "bg-white text-red-750 shadow-sm font-black border border-gray-200" : "text-gray-400 hover:text-gray-655 font-bold"
                  )}
                >
                  🚀 Bulk Multiple Banners Upload
                </button>
              </div>
            )}

            {uploadMode === 'single' ? (
              <form onSubmit={handleCreate} className="space-y-5">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest font-sans">
                    {editingBanner ? 'Edit Existing Offer Banner' : 'Configure New Offer Banner'}
                  </h4>
              <span className="text-[7.5px] font-black uppercase text-gray-405 tracking-wider bg-gray-100 px-2 py-0.5 rounded-full font-sans">
                Sequence Order: #{newBanner.order}
              </span>
            </div>

            <div className="space-y-4 font-sans">
              <div>
                <label className="text-[8.5px] font-black text-gray-400 uppercase tracking-widest px-1 block mb-1.5">Offer Title</label>
                <input 
                  placeholder="e.g., Heavy Rain Monsoon Deals" 
                  required
                  className="w-full bg-gray-50 border border-transparent rounded-xl p-3 text-xs outline-none focus:bg-white focus:border-red-100 transition-all font-bold"
                  value={newBanner.title}
                  onChange={e => setNewBanner({...newBanner, title: e.target.value})}
                />
              </div>

              {/* Media Upload and selection fields */}
              <div className="space-y-3">
                <span className="text-[8.5px] font-black text-gray-400 uppercase tracking-widest px-1 block">Upload Banner Cover Photo</span>
                
                {webcamActive ? (
                  <div className="bg-black rounded-2xl overflow-hidden p-2 flex flex-col items-center space-y-2 relative border border-gray-800">
                    <video 
                      ref={webcamVideoRef} 
                      autoPlay 
                      playsInline 
                      className="w-full max-h-56 object-cover rounded-xl bg-gray-955"
                    />
                    <div className="flex gap-2 w-full justify-center pb-1">
                      <button 
                        type="button" 
                        onClick={captureWebcamPic}
                        className="bg-red-750 text-white font-black text-[9px] uppercase tracking-wider px-4 py-2 rounded-xl active:scale-95 cursor-pointer shadow-md font-sans"
                      >
                        📸 Capture Snapshot
                      </button>
                      <button 
                        type="button" 
                        onClick={stopWebcam}
                        className="bg-gray-800 text-white font-black text-[9px] uppercase tracking-wider px-4 py-2 rounded-xl active:scale-95 cursor-pointer font-sans"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <div className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 overflow-hidden group relative">
                        {imageUploadProgress !== null && (
                          <div className="absolute inset-0 bg-black/65 flex flex-col items-center justify-center text-white z-10 p-2">
                            <Loader2 className="animate-spin text-red-500 mb-1" size={20} />
                            <p className="text-[9px] font-black uppercase tracking-wider">Uploading Banner...</p>
                            <p className="text-xs font-mono font-bold">{imageUploadProgress}%</p>
                          </div>
                        )}
                        
                        {newBanner.imageUrl ? (
                          <div className="relative w-full h-full bg-slate-900 flex items-center justify-center">
                             <img src={newBanner.imageUrl} className="h-full w-full object-cover group-hover:opacity-75 transition-opacity" alt="Preview" />
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                               <Upload className="text-white animate-pulse" size={24} />
                             </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-gray-400 space-y-1">
                            <Upload className="mb-1" size={24} />
                            <p className="text-[9px] font-black uppercase">Browse Device Gallery</p>
                            <p className="text-[7px] text-gray-400 font-bold uppercase">PNG, JPG, WEBP accepted</p>
                          </div>
                        )}
                        <input 
                          type="file" 
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={imageUploadProgress !== null}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col justify-center space-y-2.5">
                      <button
                        type="button"
                        onClick={startWebcam}
                        className="w-full bg-slate-900 hover:bg-slate-850 text-white font-black text-[9px] uppercase tracking-wider py-4 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 border border-slate-800 shadow-sm font-sans"
                      >
                        <Camera size={18} className="text-red-500 animate-pulse" />
                        Snap Web Camera 📸
                      </button>

                      <div className="relative w-full">
                        <button
                          type="button"
                          className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 font-black text-[9px] uppercase tracking-wider py-4 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 border border-gray-200 font-sans"
                        >
                          <Camera size={18} className="text-slate-500" />
                          Snap Phone Camera
                        </button>
                        <input 
                          type="file" 
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                          accept="image/*"
                          capture="environment"
                          onChange={handleImageUpload}
                          disabled={imageUploadProgress !== null}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[8.5px] font-black text-gray-400 uppercase tracking-widest px-1 block mb-1.5">Redirect URL (Link destination e.g. /category/cat-id)</label>
                <input 
                  placeholder="e.g., /checkout, /vendor/id, or external shop link" 
                  className="w-full bg-gray-50 border border-transparent rounded-xl p-3 text-xs outline-none focus:bg-white focus:border-red-100 transition-all font-bold"
                  value={newBanner.link}
                  onChange={e => setNewBanner({...newBanner, link: e.target.value})}
                />
              </div>

              <div>
                <label className="text-[8.5px] font-black text-gray-400 uppercase tracking-widest px-1 block mb-1.5">Festival affinity tag</label>
                <select
                  className="w-full bg-gray-50 border border-transparent rounded-xl p-3 text-xs outline-none focus:bg-white focus:border-red-100 transition-all font-bold"
                  value={newBanner.festivalTag || 'none'}
                  onChange={e => setNewBanner({...newBanner, festivalTag: e.target.value})}
                >
                  <option value="none">No Festival Affinity (Default Banner)</option>
                  <option value="Dashain">🇳🇵 Dashain Festival</option>
                  <option value="Tihar">🇳🇵 Tihar Festival</option>
                  <option value="Holi">🎨 Holi Celebration</option>
                  <option value="Diwali">🪔 Diwali Lights</option>
                  <option value="Christmas">🎄 Christmas Spark</option>
                </select>
              </div>

              <div className="flex items-center gap-2 px-1">
                <input 
                  type="checkbox" 
                  id="banner-active-checkbox"
                  className="rounded text-red-600 focus:ring-red-500 border-gray-300 w-4 h-4 cursor-pointer"
                  checked={newBanner.active}
                  onChange={e => setNewBanner({...newBanner, active: e.target.checked})}
                />
                <label htmlFor="banner-active-checkbox" className="text-[9px] font-black text-gray-500 uppercase cursor-pointer select-none">Make campaign immediately active on customer corridor</label>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                type="submit" 
                disabled={isDeploying}
                className="flex-1 bg-red-700 text-white font-black py-4 rounded-xl uppercase tracking-widest text-[9px] shadow-lg disabled:opacity-50 active:scale-[0.98] transition-all cursor-pointer font-sans"
              >
                {isDeploying ? 'Syncing Network...' : editingBanner ? 'Apply Modifications' : 'Deploy Mainframe Banner'}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setIsAdding(false);
                  setEditingBanner(null);
                  setNewBanner({ 
                    title: '', 
                    imageUrl: '', 
                    videoUrl: '',
                    mediaType: 'image',
                    link: '', 
                    active: true,
                    order: banners.length
                  });
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-black px-4 rounded-xl uppercase tracking-widest text-[9px] active:scale-[0.98] transition-all cursor-pointer font-sans"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          // Bulk Multiple Images Upload Interface
          <div className="space-y-5 font-sans">
            <div className="border-b border-gray-100 pb-3">
              <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">
                🚀 Multiple Offer Banners Bulk Station
              </h4>
              <p className="text-[7.5px] text-gray-400 font-bold uppercase mt-1">
                Select & queue multiple images together. Each image is auto-deployed as an individual slider banner based on its file name.
              </p>
            </div>

            {/* Multiple Drag & Drop selection Area */}
            <div className="relative">
              <div className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50 hover:bg-gray-100/50 transition-colors cursor-pointer group p-4 text-center">
                <Upload className="mb-2 group-hover:scale-110 transition-transform text-gray-400" size={28} />
                <p className="text-[9.5px] font-black text-gray-600 uppercase">Drop files here or Click to select</p>
                <p className="text-[7.5px] text-gray-400 font-bold uppercase mt-1">Unlimited multiple PNG, JPG, WEBP banner assets</p>
                <input 
                  type="file" 
                  multiple
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                  accept="image/*"
                  onChange={handleMultipleFilesSelect}
                  disabled={isBulkUploading}
                />
              </div>
            </div>

            {/* Bulk Queue Display */}
            {bulkQueue.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                <div className="flex justify-between items-center text-[8px] font-black tracking-widest text-gray-400 uppercase px-1">
                  <span>File Uploading Buffer Queue ({bulkQueue.length} Banners)</span>
                  <button 
                    type="button" 
                    onClick={() => {
                      setMultipleFiles([]);
                      setBulkQueue([]);
                    }}
                    disabled={isBulkUploading}
                    className="hover:underline disabled:opacity-40 uppercase cursor-pointer text-red-600"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-1.5">
                  {bulkQueue.map((item, idx) => (
                    <div key={item.id} className="bg-gray-50 p-2.5 rounded-2xl border border-gray-150 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-[8px] font-black text-gray-400 shrink-0 uppercase font-mono bg-gray-200 px-1.5 py-0.5 rounded">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-black text-gray-800 truncate uppercase mt-0.5">{item.name}</p>
                          {item.status === 'uploading' && (
                            <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mt-1 max-w-[120px]">
                              <div className="bg-red-700 h-full transition-all duration-300" style={{ width: `${item.progress}%` }} />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.status === 'idle' && (
                          <span className="text-[7.5px] bg-gray-200 text-gray-500 font-extrabold px-1.5 py-0.5 rounded uppercase leading-none">Idle</span>
                        )}
                        {item.status === 'uploading' && (
                          <span className="text-[7.5px] bg-amber-50 text-amber-600 border border-amber-100 font-extrabold px-1.5 py-0.5 rounded uppercase leading-none animate-pulse">
                            Uploading {item.progress}%
                          </span>
                        )}
                        {item.status === 'completed' && (
                          <span className="text-[7.5px] bg-green-50 text-green-600 border border-green-150 font-extrabold px-1.5 py-0.5 rounded uppercase leading-none">Deployed</span>
                        )}
                        {item.status === 'failed' && (
                          <span className="text-[7.5px] bg-red-100 text-red-600 font-extrabold px-1.5 py-0.5 rounded uppercase leading-none" title={item.error}>Failed</span>
                        )}
                        
                        <button
                          type="button"
                          onClick={() => handleRemoveFromQueue(idx)}
                          disabled={isBulkUploading}
                          className="text-gray-400 hover:text-red-700 disabled:opacity-30 p-1 cursor-pointer"
                        >
                          <X size={12} className="stroke-[3]" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    type="button" 
                    onClick={handleDeployBulkBanners}
                    disabled={isBulkUploading || bulkQueue.length === 0}
                    className="flex-1 bg-red-700 text-white font-black py-4 rounded-xl uppercase tracking-widest text-[9px] shadow-lg disabled:opacity-50 active:scale-[0.98] transition-all cursor-pointer font-sans"
                  >
                    {isBulkUploading ? 'Processing Multi-upload Terminal...' : `Deploy ${bulkQueue.length} Banners in Bulk`}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsAdding(false);
                      setMultipleFiles([]);
                      setBulkQueue([]);
                    }}
                    disabled={isBulkUploading}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-650 font-black px-4 rounded-xl uppercase tracking-widest text-[9px] active:scale-[0.98] transition-all cursor-pointer font-sans"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    )}
  </AnimatePresence>

      {/* Live Preview Modal Overlay Anchor */}
      {previewItem && (
        <div className="bg-zinc-950 p-4 rounded-3xl border border-white/10 text-white space-y-3 relative overflow-hidden font-sans">
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Tv size={16} className="text-red-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-wider">Live Consumer Interface Simulator</span>
            </div>
            <button 
              onClick={() => setPreviewItem(null)}
              className="text-white/60 hover:text-white text-[9.5px] font-black uppercase tracking-widest bg-white/5 px-2 py-1 rounded-lg border border-white/5 cursor-pointer"
            >
              Close Simulator
            </button>
          </div>
          
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/10 flex items-center justify-center">
            <img src={previewItem.imageUrl} className="w-full h-full object-cover" alt="Preview Banner" />
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[8.5px] text-white font-black uppercase tracking-widest border border-white/10 flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded text-[7px] leading-none uppercase bg-red-600 font-extrabold">🖼️ Graphic</span>
              {previewItem.title}
            </div>
          </div>
        </div>
      )}

      {/* Header List Meta */}
      <div className="space-y-3 pb-4">
        <div className="flex justify-between items-center px-1">
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans">Active Corridor Banners ({banners.length})</div>
          <p className="text-[8.5px] text-gray-400 font-bold uppercase font-sans">Drag rows directly OR Use arrows to reorder</p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {banners.map((b, index) => (
            <div 
              key={b.bannerId || index} 
              draggable={true}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className="bg-white p-3 rounded-3xl border border-gray-100 shadow-sm flex gap-3 items-center group hover:border-gray-200 transition-all font-sans cursor-grab active:cursor-grabbing hover:bg-gray-50/50"
            >
               {/* Grip handle for drag reorder */}
               <div className="text-gray-400 group-hover:text-gray-600 p-1 shrink-0 flex items-center justify-center" title="Drag row to reorder list">
                 <GripVertical size={16} />
               </div>

               <div className="relative w-20 h-12 rounded-xl object-cover bg-slate-900 shrink-0 border border-gray-100 overflow-hidden flex items-center justify-center">
                 <img src={b.imageUrl} loading="lazy" className="h-full w-full object-cover" alt="banner" referrerPolicy="no-referrer" />
                 <span className="absolute top-1 left-1.5 bg-black/60 text-white font-mono text-[6.5px] px-1 py-0.5 rounded uppercase font-black tracking-wide leading-none">
                   Order #{b.order !== undefined ? b.order : index}
                 </span>
               </div>
               
               <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[10px] font-black text-gray-900 truncate uppercase tracking-wider">{b.title}</p>
                    {b.active ? (
                      <span className="text-[6.5px] bg-green-50 text-green-600 border border-green-100 px-1 py-0.5 rounded uppercase font-black inline-block leading-none shrink-0 animate-pulse">
                        ● Active
                      </span>
                    ) : (
                      <span className="text-[6.5px] bg-gray-100 text-gray-400 border border-gray-150 px-1 py-0.5 rounded uppercase font-black inline-block leading-none shrink-0">
                        Inactive
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-0.5">
                     <p className="text-[8px] text-gray-400 font-bold truncate uppercase">{b.link || 'App Internal Navigation'}</p>
                  </div>
               </div>

               {/* Reorder and Action Tools */}
               <div className="flex items-center gap-1 pb-0.5 shrink-0">
                  {/* Inline Enable/Disable toggle */}
                  <button 
                    type="button"
                    onClick={async (e) => {
                      e.preventDefault();
                      try {
                        await updateDoc(doc(db, 'banners', b.bannerId), { active: !b.active });
                      } catch (err: any) {
                        alert("Error toggling active status: " + err.message);
                      }
                    }}
                    className={cn(
                      "p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center",
                      b.active 
                        ? "bg-green-50 border-green-200 text-green-600 hover:bg-green-100" 
                        : "bg-gray-100 border-gray-200 text-gray-400 hover:bg-gray-200"
                    )}
                    title={b.active ? "Disable Banner" : "Enable Banner"}
                  >
                    <CheckCircle2 size={14} className={cn(b.active && "animate-pulse")} />
                  </button>

                  <div className="flex flex-col gap-0.5 bg-gray-50 border border-gray-150 p-1.5 rounded-xl text-gray-500 mr-1.5">
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); handleReorder(index, 'up'); }}
                      disabled={index === 0}
                      className="p-0.5 hover:text-red-700 disabled:opacity-20 flex items-center justify-center cursor-pointer"
                      title="Move Screen Up"
                    >
                      <ArrowUp size={11} className="stroke-[3.5]" />
                    </button>
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); handleReorder(index, 'down'); }}
                      disabled={index === banners.length - 1}
                      className="p-0.5 hover:text-red-700 disabled:opacity-20 flex items-center justify-center cursor-pointer"
                      title="Move Screen Down"
                    >
                      <ArrowDown size={11} className="stroke-[3.5]" />
                    </button>
                  </div>

                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setPreviewItem(b); }}
                    className={cn(
                      "p-2 rounded-xl border transition-all duration-300 cursor-pointer",
                      previewItem?.bannerId === b.bannerId 
                        ? "bg-red-50 border-red-200 text-red-600" 
                        : "bg-white hover:bg-gray-50 border-gray-150 text-gray-400 hover:text-gray-600"
                    )}
                    title="Simulate Banner"
                  >
                    <Eye size={14} />
                  </button>

                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleEdit(b); }}
                    className="p-2 bg-white hover:bg-gray-50 border border-gray-150 text-gray-400 hover:text-blue-600 rounded-xl transition-all cursor-pointer"
                    title="Modify Campaign"
                  >
                    <Edit size={14} />
                  </button>

                  <div className="relative inline-block font-sans">
                    <button 
                      type="button"
                      className="p-2 bg-white hover:bg-gray-50 border border-gray-150 text-gray-400 hover:text-orange-600 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                      title="Replace Banner Image"
                      onClick={(e) => {
                        e.stopPropagation();
                        const replaceInput = document.getElementById(`replace-input-${b.bannerId}`);
                        if (replaceInput) replaceInput.click();
                      }}
                    >
                      <RefreshCw size={14} />
                    </button>
                    <input 
                      type="file"
                      id={`replace-input-${b.bannerId}`}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleReplaceUpload(e, b.bannerId)}
                    />
                  </div>

                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDelete(b.bannerId); }} 
                    className="p-2 bg-white hover:bg-red-50 border border-gray-150 text-gray-400 hover:text-red-600 rounded-xl transition-all active:scale-95 cursor-pointer"
                    title="Purge Campaign"
                  >
                    <Trash2 size={14} />
                  </button>
               </div>
            </div>
          ))}
          
          {banners.length === 0 && (
            <div className="text-center py-10 opacity-30 text-[9px] font-black uppercase tracking-widest border-2 border-dashed border-gray-200 rounded-3xl">
              No active banners registered on terminal. Select Add Banner to start streaming.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryManager({ categories, setCategories }: { categories: Category[], setCategories: React.Dispatch<React.SetStateAction<Category[]>> }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCat, setNewCat] = useState<Partial<Category>>({ name: '', icon: '', image: '', parentId: '', banner: '', description: '', order: 0 });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'main' | 'sub'>('main');

  const mainCategories = categories.filter(c => !c.parentId).sort((a, b) => (a.order || 0) - (b.order || 0));
  const subCategories = categories.filter(c => c.parentId);

  const seedDefaultCategories = async () => {
    if (!confirm("Seed default categories? This will not delete existing ones.")) return;
    setLoading(true);
    const defaults = [
      'Electronics', 'Fashion', 'Beauty Products', 'Grocery', 'Sports',
      'Stationery', 'Home & Kitchen', 'Handmade Products', 'Mobile Accessories',
      'Toys', 'Health Products'
    ];
    try {
      const batch = writeBatch(db);
      const newCats: Category[] = [];
      defaults.forEach((name, i) => {
        if (!categories.find(c => c.name === name)) {
          const id = `cat-${Date.now()}-${i}`;
          const data: Category = { categoryId: id, name, icon: '', order: i };
          batch.set(doc(db, 'categories', id), data);
          newCats.push(data);
        }
      });
      await batch.commit();
      setCategories(prev => [...newCats, ...prev]);
      alert("Categories seeded successfully!");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'icon' | 'banner' | 'image') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const compressed = await compressImage(reader.result as string, 800, 800, 0.7);
          setNewCat({ ...newCat, [field]: compressed });
        } catch (err) {
          setNewCat({ ...newCat, [field]: reader.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.name) return;
    setLoading(true);
    try {
      const categoryId = editingId || `cat-${Date.now()}`;
      const catData: any = { 
        ...newCat, 
        categoryId,
      };

      // Ensure parentId is either present as string or completely absent to avoid 'undefined' errors
      if (activeTab === 'sub' && newCat.parentId && newCat.parentId.trim() !== '') {
        catData.parentId = newCat.parentId;
      } else {
        delete catData.parentId;
      }

      await setDoc(doc(db, 'categories', categoryId), catData);
      
      if (editingId) {
        setCategories(prev => prev.map(c => c.categoryId === editingId ? catData : c));
      } else {
        setCategories(prev => [catData, ...prev]);
      }
      
      setNewCat({ name: '', icon: '', image: '', parentId: '', banner: '', description: '', order: 0 });
      setIsAdding(false);
      setEditingId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'categories');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cat: Category) => {
    setNewCat(cat);
    setEditingId(cat.categoryId);
    setIsAdding(true);
    setActiveTab(cat.parentId ? 'sub' : 'main');
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category? This will also affect linked products.")) return;
    try {
      await deleteDoc(doc(db, 'categories', id));
      setCategories(prev => prev.filter(c => c.categoryId !== id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `categories/${id}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <div>
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Category Ecosystem</h3>
          <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Manage clusters and hierarchies</p>
        </div>
        <div className="flex gap-2">
          <button onClick={seedDefaultCategories} className="bg-orange-50 text-orange-600 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all">Seed Defaults</button>
          <button 
            onClick={() => {
              setIsAdding(!isAdding);
              setEditingId(null);
              setNewCat({ name: '', icon: '', image: '', parentId: '', banner: '', description: '', order: 0 });
            }} 
            className={cn(
              "p-2 rounded-xl transition-all active:scale-95",
              isAdding ? "bg-red-50 text-red-600" : "bg-red-700 text-white shadow-lg"
            )}
          >
            {isAdding ? <X size={20} /> : <Plus size={20} />}
          </button>
        </div>
      </div>

      <div className="flex bg-white rounded-2xl border border-gray-100 p-1">
        <button onClick={() => setActiveTab('main')} className={cn("flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all", activeTab === 'main' ? "bg-gray-900 text-white shadow-lg" : "text-gray-400 font-black hover:bg-gray-50")}>Main Clusters</button>
        <button onClick={() => setActiveTab('sub')} className={cn("flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all", activeTab === 'sub' ? "bg-gray-900 text-white shadow-lg" : "text-gray-400 font-black hover:bg-gray-50")}>Sub Clusters</button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6 overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {activeTab === 'sub' && (
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Parent Category</label>
                    <select 
                      required
                      className="w-full bg-gray-50 border border-transparent rounded-xl p-3 text-xs outline-none focus:bg-white focus:border-red-100 transition-all font-bold appearance-none"
                      value={newCat.parentId || ''}
                      onChange={e => setNewCat({...newCat, parentId: e.target.value})}
                    >
                      <option value="">Select Parent</option>
                      {mainCategories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.name}</option>)}
                    </select>
                  </div>
                )}
                
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Label</label>
                  <input 
                    placeholder="e.g. Smartphones" 
                    required
                    className="w-full bg-gray-50 border border-transparent rounded-xl p-3 text-xs outline-none focus:bg-white focus:border-red-100 transition-all font-bold"
                    value={newCat.name || ''}
                    onChange={e => setNewCat({...newCat, name: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Priority Order</label>
                  <input 
                    type="number"
                    placeholder="0" 
                    className="w-full bg-gray-50 border border-transparent rounded-xl p-3 text-xs outline-none focus:bg-white focus:border-red-100 transition-all font-bold"
                    value={newCat.order || 0}
                    onChange={e => setNewCat({...newCat, order: parseInt(e.target.value)})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Icon</p>
                    <label className="relative w-full h-24 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center p-2 cursor-pointer hover:bg-red-50/30 transition-all overflow-hidden group">
                      {newCat.icon ? (
                        <img src={newCat.icon} className="absolute inset-0 w-full h-full object-contain p-2" />
                      ) : (
                        <Upload size={20} className="text-gray-300" />
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'icon')} />
                    </label>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Banner</p>
                    <label className="relative w-full h-24 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center p-2 cursor-pointer hover:bg-red-50/30 transition-all overflow-hidden group">
                      {newCat.banner ? (
                        <img src={newCat.banner} className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={20} className="text-gray-300" />
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'banner')} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Abstract / Description</label>
                  <textarea 
                    rows={4}
                    placeholder="Describe this category cluster..." 
                    className="w-full bg-gray-50 border border-transparent rounded-xl p-3 text-xs outline-none focus:bg-white focus:border-red-100 transition-all font-bold resize-none"
                    value={newCat.description || ''}
                    onChange={e => setNewCat({...newCat, description: e.target.value})}
                  />
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl shadow-xl shadow-gray-100 active:scale-95 transition-all text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {editingId ? 'Push Updates' : 'Initialize Cluster'}
                  </button>
                </div>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(activeTab === 'main' ? mainCategories : subCategories).map((cat) => (
          <div key={cat.categoryId} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-4 group">
            <div className="flex items-start justify-between">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 p-2 shadow-inner group-hover:bg-orange-50 transition-colors">
                {cat.icon ? <img src={cat.icon} className="w-full h-full object-contain" /> : <Grid size={24} className="text-gray-300" />}
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(cat)} className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-900 hover:text-white transition-all"><Edit size={14} /></button>
                <button onClick={() => handleDelete(cat.categoryId)} className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={14} /></button>
              </div>
            </div>
            
            <div>
              <div className="flex items-baseline justify-between">
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest truncate">{cat.name}</h4>
                <span className="text-[8px] font-black text-gray-400">#{cat.order || 0}</span>
              </div>
              {cat.parentId && (
                <p className="text-[7px] font-black text-orange-500 uppercase tracking-widest mt-1">
                  Child of: {mainCategories.find(m => m.categoryId === cat.parentId)?.name || 'Unknown'}
                </p>
              )}
              <p className="text-[9px] text-gray-400 font-bold mt-2 line-clamp-2">{cat.description || 'No description provided.'}</p>
            </div>
          </div>
        ))}
      </div>

      {(activeTab === 'main' ? mainCategories : subCategories).length === 0 && !isAdding && (
         <div className="bg-gray-50/50 rounded-[40px] p-20 text-center border-2 border-dashed border-gray-100 opacity-40">
            <Grid size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Empty Cluster Space</p>
         </div>
      )}
    </div>
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
            isAdding ? "bg-red-50 text-red-600" : "bg-red-700 text-white shadow-lg"
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
            <button type="submit" disabled={loading} className="w-full bg-red-700 text-white font-black py-4 rounded-xl uppercase tracking-widest text-[10px] shadow-lg shadow-red-100">
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
      </div>
    </div>
  );
}

interface AdManagerProps {
  ads: AppAd[];
  setAds: React.Dispatch<React.SetStateAction<AppAd[]>>;
  products: Product[];
  categories: Category[];
}

function AdManager({ ads, setAds, products, categories }: AdManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingAd, setEditingAd] = useState<AppAd | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);

  const [bannerSettings, setBannerSettings] = useState({
    autoPlay: true,
    autoScroll: true,
    autoSlideTiming: 5
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'banners'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setBannerSettings({
          autoPlay: data.autoPlay !== false,
          autoScroll: data.autoScroll !== false,
          autoSlideTiming: data.autoSlideTiming || 5
        });
      }
    });
    return () => unsub();
  }, []);

  const handleUpdateSettings = async (updates: Partial<typeof bannerSettings>) => {
    try {
      await setDoc(doc(db, 'settings', 'banners'), {
        ...bannerSettings,
        ...updates
      }, { merge: true });
    } catch (e) {
      console.error("Failed to update banner settings:", e);
    }
  };

  // Form states
  const [newAd, setNewAd] = useState({
    title: '',
    imageUrl: '',
    videoUrl: '',
    mediaType: 'image' as 'image' | 'video',
    duration: 5,
    linkType: 'product' as 'product' | 'category' | 'custom',
    selectedProduct: '',
    selectedCategory: '',
    customLink: '',
    location: 'banner' as 'banner' | 'popup' | 'offer' | 'fullscreen_video',
    startDate: '',
    endDate: '',
    active: true
  });

  const [imageUploadProgress, setImageUploadProgress] = useState<number | null>(null);
  const [videoUploadProgress, setVideoUploadProgress] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'inactive'>('all');

  // Ad performance analytics calculation
  const totalViews = ads.reduce((acc, a) => acc + (a.views || 0), 0);
  const totalClicks = ads.reduce((acc, a) => acc + (a.clicks || 0), 0);
  const averageCtr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : '0.00';
  const activeAdsCount = ads.filter(a => a.active && new Date(a.endDate) >= new Date()).length;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAd.title.trim()) return alert("Ad campaign title is required.");
    if (newAd.mediaType === 'video') {
      if (!newAd.videoUrl) return alert("Please upload a video file for your video campaign.");
    } else {
      if (!newAd.imageUrl) return alert("Please upload an ad creative (image/banner).");
    }
    if (!newAd.startDate || !newAd.endDate) return alert("Please specify start and end dates.");

    let targetLink = '';
    if (newAd.linkType === 'product') {
      if (!newAd.selectedProduct) return alert("Please select a target product.");
      targetLink = `/product/${newAd.selectedProduct}`;
    } else if (newAd.linkType === 'category') {
      if (!newAd.selectedCategory) return alert("Please select a target category.");
      targetLink = `/category/${newAd.selectedCategory}`;
    } else {
      if (!newAd.customLink.trim()) return alert("Please present a destination link URL.");
      targetLink = newAd.customLink.trim();
    }

    setIsDeploying(true);
    try {
      const adId = editingAd ? editingAd.adId : `ad-${Date.now()}`;
      const adData: AppAd = {
        adId,
        title: newAd.title,
        imageUrl: newAd.imageUrl,
        videoUrl: newAd.videoUrl || '',
        mediaType: newAd.mediaType,
        duration: newAd.duration,
        link: targetLink,
        location: newAd.location,
        startDate: newAd.startDate,
        endDate: newAd.endDate,
        active: newAd.active,
        views: editingAd ? (editingAd.views || 0) : 0,
        clicks: editingAd ? (editingAd.clicks || 0) : 0,
        createdAt: editingAd ? editingAd.createdAt : new Date().toISOString()
      };

      // Check document size since Firestore limit is 1,048,576 bytes
      const docString = JSON.stringify(adData);
      const docSizeBytes = new Blob([docString]).size;
      if (docSizeBytes > 1000000) {
        setIsDeploying(false);
        return alert(
          `This ad campaign is too large (${(docSizeBytes / 1024 / 1024).toFixed(2)} MB) to save directly to the database. The database has an absolute limit of 1.0 MB per advertisement.\n\nTo make it fit:\n1. If you uploaded a video, please compress it to under 700KB.\n2. Limit video timeline length or resolution before uploading.\n3. Clear or compress the companion fallback desktop banner/image to a lower resolution.`
        );
      }

      await setDoc(doc(db, 'ads', adId), adData);

      // Reset form states
      setIsAdding(false);
      setEditingAd(null);
      setNewAd({
        title: '',
        imageUrl: '',
        videoUrl: '',
        mediaType: 'image',
        duration: 5,
        linkType: 'product',
        selectedProduct: '',
        selectedCategory: '',
        customLink: '',
        location: 'banner',
        startDate: '',
        endDate: '',
        active: true
      });
      alert(editingAd ? "Ad successfully updated!" : "Ad successfully broadcasted!");
    } catch (err) {
      console.error("Ad save error:", err);
      alert("Failed to deploy ad: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsDeploying(false);
    }
  };

  const handleToggleActive = async (ad: AppAd) => {
    const nextState = !ad.active;
    try {
      await updateDoc(doc(db, 'ads', ad.adId), { active: nextState });
    } catch (err) {
      alert("Failed to toggle advertisement status");
    }
  };

  const handleDelete = async (adId: string) => {
    if (!confirm("Are you sure you want to delete this offer?")) return;
    try {
      const adItem = ads.find(a => a.adId === adId);
      if (adItem) {
        if (adItem.imageUrl && adItem.imageUrl.includes('firebasestorage.googleapis.com')) {
          try {
            const fileRef = ref(storage, adItem.imageUrl);
            await deleteObject(fileRef);
            console.log("Deleted ad image from storage:", adItem.imageUrl);
          } catch (storageErr) {
            console.warn("Storage deletion error (ignored):", storageErr);
          }
        }
        if (adItem.videoUrl && adItem.videoUrl.includes('firebasestorage.googleapis.com')) {
          try {
            const fileRef = ref(storage, adItem.videoUrl);
            await deleteObject(fileRef);
            console.log("Deleted ad video from storage:", adItem.videoUrl);
          } catch (storageErr) {
            console.warn("Storage deletion error (ignored):", storageErr);
          }
        }
      }
      await deleteDoc(doc(db, 'ads', adId));
      setAds(prev => prev.filter(a => a.adId !== adId));
    } catch (err) {
      alert("Failed to delete ad campaign");
    }
  };

  const handleEdit = (ad: AppAd) => {
    setEditingAd(ad);
    
    // Determine link selection type
    let linkType: 'product' | 'category' | 'custom' = 'custom';
    let selectedProduct = '';
    let selectedCategory = '';
    let customLink = ad.link;

    if (ad.link.startsWith('/product/')) {
      linkType = 'product';
      selectedProduct = ad.link.replace('/product/', '');
      customLink = '';
    } else if (ad.link.startsWith('/category/')) {
      linkType = 'category';
      selectedCategory = ad.link.replace('/category/', '');
      customLink = '';
    }

    setNewAd({
      title: ad.title,
      imageUrl: ad.imageUrl || '',
      videoUrl: ad.videoUrl || '',
      mediaType: ad.mediaType || 'image',
      duration: ad.duration || 5,
      linkType,
      selectedProduct,
      selectedCategory,
      customLink,
      location: ad.location,
      startDate: ad.startDate ? ad.startDate.slice(0, 10) : '',
      endDate: ad.endDate ? ad.endDate.slice(0, 10) : '',
      active: ad.active
    });
    setIsAdding(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageUploadProgress(1);
      try {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `ads/images/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const storageRef = ref(storage, fileName);
        
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setImageUploadProgress(progress > 0 ? progress : 1);
          }, 
          (error) => {
            console.error("Image upload failed:", error);
            alert("Image upload failed. Please try again: " + error.message);
            setImageUploadProgress(null);
          }, 
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setNewAd(prev => ({ ...prev, imageUrl: downloadURL }));
            setImageUploadProgress(null);
          }
        );
      } catch (err: any) {
        console.error("Upload preparation failed:", err);
        alert("Upload preparation failed: " + err?.message);
        setImageUploadProgress(null);
      }
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        alert("Please upload a valid MP4 or WebM video file.");
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        alert("Warning: This video is larger than 50MB. Large videos may load slowly for your customers. We recommend compressing it to under 5MB or 10MB for optimal app performance.");
      }
      
      setVideoUploadProgress(1);
      try {
        const fileExt = file.name.split('.').pop() || 'mp4';
        const fileName = `ads/videos/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const storageRef = ref(storage, fileName);
        
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setVideoUploadProgress(progress > 0 ? progress : 1);
          }, 
          (error) => {
            console.error("Video upload failed:", error);
            alert("Video upload failed: " + error.message);
            setVideoUploadProgress(null);
          }, 
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setNewAd(prev => ({ 
              ...prev, 
              videoUrl: downloadURL,
              imageUrl: prev.imageUrl || 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=600&auto=format&fit=crop'
            }));
            setVideoUploadProgress(null);
          }
        );
      } catch (err: any) {
        console.error("Video upload preparation failed:", err);
        alert("Video upload preparation failed: " + err?.message);
        setVideoUploadProgress(null);
      }
    }
  };

  const filteredAds = ads.filter(a => {
    const isExpired = new Date(a.endDate) < new Date();
    const search = (searchTerm || '').toLowerCase();
    const searchMatch = (a?.title || '').toLowerCase().includes(search) ||
                        (a?.link || '').toLowerCase().includes(search) ||
                        (a?.location || '').toLowerCase().includes(search);

    if (statusFilter === 'active') return searchMatch && a.active && !isExpired;
    if (statusFilter === 'expired') return searchMatch && isExpired;
    if (statusFilter === 'inactive') return searchMatch && !a.active;
    return searchMatch;
  });

  return (
    <div className="space-y-6">
      {/* Analytics Overview Panels */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between">
          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <Eye size={12} className="text-blue-500" /> Impressions
          </span>
          <p className="text-xl font-black text-gray-900 mt-2">{totalViews.toLocaleString()}</p>
          <span className="text-[7px] text-gray-400 font-bold uppercase mt-1">Total Views</span>
        </div>

        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between">
          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <ArrowUpRight size={12} className="text-green-500" /> Actions Link
          </span>
          <p className="text-xl font-black text-gray-900 mt-2">{totalClicks.toLocaleString()}</p>
          <span className="text-[7px] text-gray-400 font-bold uppercase mt-1">Total Clicks</span>
        </div>

        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between">
          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <TrendingUp size={12} className="text-orange-500" /> Click Rate
          </span>
          <p className="text-xl font-black text-orange-600 mt-2">{averageCtr}%</p>
          <span className="text-[7px] text-gray-400 font-bold uppercase mt-1">Avg CTR</span>
        </div>

        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between">
          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <Megaphone size={12} className="text-red-500" /> Active Ads
          </span>
          <p className="text-xl font-black text-red-600 mt-2">{activeAdsCount}</p>
          <span className="text-[7px] text-gray-400 font-bold uppercase mt-1">Currently Serving</span>
        </div>
      </div>

      {/* Autoplay & Banner Auto-Scroll Master Controls */}
      <div className="bg-gradient-to-r from-red-800 to-red-950 text-white p-6 rounded-[2.5rem] shadow-xl border border-red-700/30 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider">Rotator & Media Broadcast Master Console</h4>
            <p className="text-[8px] text-red-200 uppercase tracking-widest mt-0.5">Automatically stream image/video offers across mobile/desktop client corridors</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Auto Scroll Toggle */}
          <div className="flex items-center justify-between bg-black/20 p-4 rounded-2xl border border-white/5">
            <div className="space-y-0.5">
              <p className="text-[9px] font-black uppercase tracking-widest">Auto Scroll Slider</p>
              <p className="text-[7.5px] text-red-150">Automatically rotate home banner offers</p>
            </div>
            <button 
              type="button"
              onClick={() => handleUpdateSettings({ autoScroll: !bannerSettings.autoScroll })}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[8.5px] font-black uppercase tracking-widest transition-all cursor-pointer",
                bannerSettings.autoScroll ? "bg-green-500 text-black" : "bg-white/10 text-white hover:bg-white/15"
              )}
            >
              {bannerSettings.autoScroll ? '● ON' : '○ OFF'}
            </button>
          </div>

          {/* Auto Play Video Toggle */}
          <div className="flex items-center justify-between bg-black/20 p-4 rounded-2xl border border-white/5">
            <div className="space-y-0.5">
              <p className="text-[9px] font-black uppercase tracking-widest">Auto Play Video Ads</p>
              <p className="text-[7.5px] text-red-150">Pre-buffer & auto-start promotional streams</p>
            </div>
            <button 
              type="button"
              onClick={() => handleUpdateSettings({ autoPlay: !bannerSettings.autoPlay })}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[8.5px] font-black uppercase tracking-widest transition-all cursor-pointer",
                bannerSettings.autoPlay ? "bg-green-500 text-black" : "bg-white/10 text-white hover:bg-white/15"
              )}
            >
              {bannerSettings.autoPlay ? '● ON' : '○ OFF'}
            </button>
          </div>

          {/* Timing Interval Selection */}
          <div className="space-y-1 bg-black/20 p-4 rounded-2xl border border-white/5 flex flex-col justify-center">
            <p className="text-[9px] font-black uppercase tracking-widest">Auto Slide Timing Rotation</p>
            <div className="flex items-center gap-2 mt-1">
              <input 
                type="range" 
                min={2} 
                max={15} 
                className="flex-1 accent-red-500 bg-red-950 rounded-lg h-1.5 cursor-pointer"
                value={bannerSettings.autoSlideTiming} 
                onChange={(e) => handleUpdateSettings({ autoSlideTiming: parseInt(e.target.value) })}
              />
              <span className="text-[11px] font-black tracking-wider bg-red-900 border border-red-700/60 px-2 py-0.5 rounded-full whitespace-nowrap min-w-[45px] text-center">
                {bannerSettings.autoSlideTiming}s
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Creation and Campaign Form Header */}
      <div className="flex justify-between items-center px-1">
        <h3 className="text-xs font-black text-gray-900 uppercase">Interactive Ad Campaigns</h3>
        <button 
          onClick={() => {
            setIsAdding(!isAdding);
            if (isAdding) {
              setEditingAd(null);
              setNewAd({
                title: '',
                imageUrl: '',
                videoUrl: '',
                mediaType: 'image',
                duration: 5,
                linkType: 'product',
                selectedProduct: '',
                selectedCategory: '',
                customLink: '',
                location: 'banner',
                startDate: '',
                endDate: '',
                active: true
              });
            }
          }}
          className={cn(
            "p-2.5 rounded-xl transition-all active:scale-95 text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer",
            isAdding ? "bg-red-50 text-red-650" : "bg-red-700 text-white shadow-lg shadow-red-700/10"
          )}
        >
          {isAdding ? <X size={12} /> : <Plus size={12} />}
          {isAdding ? 'Cancel Campaign' : 'Deploy Ad Campaign'}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form 
            onSubmit={handleCreate}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-md space-y-4 overflow-hidden"
          >
            <div className="flex items-center gap-2 pb-3 border-b border-gray-50 mb-4">
              <span className="text-xl">{editingAd ? '✏️' : '📢'}</span>
              <div>
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                  {editingAd ? 'Edit Ad Campaign' : 'Deploy New Ad Campaign'}
                </h4>
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                  {editingAd ? `Modifying broadcast settings for ${editingAd.adId}` : 'Broadcast custom imagery or video streaming across client corridors'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Campaign Title</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g., Summer Flash Liquidation"
                    className="w-full bg-gray-50 border border-transparent rounded-xl p-3 text-xs outline-none focus:bg-white focus:border-red-100 transition-all font-bold"
                    value={newAd.title}
                    onChange={e => setNewAd({...newAd, title: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">placement sector</label>
                  <select 
                    className="w-full bg-gray-50 border border-transparent rounded-xl p-3 text-xs outline-none focus:bg-white focus:border-red-100 transition-all font-bold"
                    value={newAd.location}
                    onChange={e => setNewAd({...newAd, location: e.target.value as any})}
                  >
                    <option value="banner">Home Banner Carousel</option>
                    <option value="popup">Entrance Popups</option>
                    <option value="offer">Home Screen Grid Offer Banner</option>
                    <option value="fullscreen_video">Full Screen Video Ad (Skippable Overlay)</option>
                  </select>
                </div>

                {/* Media Type & Duration Control Selection */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Media Type</label>
                    <div className="flex bg-white p-1 rounded-xl border border-gray-200">
                      {(['image', 'video'] as const).map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setNewAd({...newAd, mediaType: t})}
                          className={cn(
                            "flex-1 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all",
                            newAd.mediaType === t ? "bg-red-700 text-white shadow-sm font-black" : "text-gray-400 hover:text-gray-600 font-bold"
                          )}
                        >
                          {t === 'image' ? '🖼️ Image' : '🎥 Video'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Watch Limit / Skip</label>
                    <select 
                      className="w-full bg-white border border-gray-200 rounded-xl p-1.5 text-xs outline-none font-bold"
                      value={newAd.duration}
                      onChange={e => setNewAd({...newAd, duration: Number(e.target.value)})}
                    >
                      <option value={5}>5 Seconds</option>
                      <option value={10}>10 Seconds</option>
                      <option value={15}>15 Seconds</option>
                      <option value={30}>30 Seconds</option>
                    </select>
                  </div>
                </div>

                {/* Target Linking Destination Engine */}
                <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex gap-2">
                    {(['product', 'category', 'custom'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNewAd({...newAd, linkType: t})}
                        className={cn(
                          "flex-1 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all",
                          newAd.linkType === t ? "bg-gray-900 text-white shadow-sm" : "bg-white text-gray-400 border border-gray-100 hover:text-gray-600"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {newAd.linkType === 'product' && (
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest px-0.5">Select Target Product</label>
                      <select
                        className="w-full bg-white border border-gray-150 rounded-xl p-2.5 text-xs outline-none font-bold"
                        value={newAd.selectedProduct}
                        onChange={e => setNewAd({...newAd, selectedProduct: e.target.value})}
                      >
                        <option value="">-- Choose Campaign Product --</option>
                        {products.filter(p => p.status === 'approved').map(p => (
                          <option key={p.productId} value={p.productId}>{p.name} (Rs. {p.price})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {newAd.linkType === 'category' && (
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest px-0.5">Select Target Category</label>
                      <select
                        className="w-full bg-white border border-gray-150 rounded-xl p-2.5 text-xs outline-none font-bold"
                        value={newAd.selectedCategory}
                        onChange={e => setNewAd({...newAd, selectedCategory: e.target.value})}
                      >
                        <option value="">-- Choose Campaign Category --</option>
                        {categories.map(c => (
                          <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {newAd.linkType === 'custom' && (
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest px-0.5">Target Webpage Link</label>
                      <input 
                        type="text"
                        placeholder="e.g., /checkout, /offers, or external URI"
                        className="w-full bg-white border border-gray-150 rounded-xl p-2.5 text-xs outline-none font-bold"
                        value={newAd.customLink}
                        onChange={e => setNewAd({...newAd, customLink: e.target.value})}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {newAd.mediaType === 'image' ? (
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1 block">Creative Image / Graphic</label>
                    <div className="border-2 border-dashed border-gray-200 rounded-3xl p-4 text-center cursor-pointer hover:border-red-400 transition-colors relative h-32 flex flex-col justify-center items-center bg-gray-50 overflow-hidden">
                      {imageUploadProgress !== null && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white z-10 p-2">
                          <Loader2 className="animate-spin text-red-500 mb-1" size={20} />
                          <p className="text-[10px] font-black uppercase tracking-wider">Uploading...</p>
                          <p className="text-xs font-mono">{imageUploadProgress}%</p>
                        </div>
                      )}
                      {newAd.imageUrl ? (
                        <>
                          <img src={newAd.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-90" alt="Creative Preview" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <span className="text-[9px] font-black text-white uppercase tracking-wider">Change Local File</span>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-1 text-gray-450">
                          <Upload size={18} className="mx-auto text-gray-400" />
                          <p className="text-[9px] font-black uppercase tracking-widest">Upload Local Graphic File</p>
                          <p className="text-[7.5px] font-bold text-gray-400">PNG / JPG file</p>
                        </div>
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        onChange={handleImageUpload} 
                        disabled={imageUploadProgress !== null}
                      />
                    </div>

                    <div className="relative flex items-center justify-center my-1">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-100" /></div>
                      <span className="relative bg-white px-2 text-[7.5px] font-black text-gray-350 uppercase tracking-widest leading-none">OR USE EXTERNAL URL</span>
                    </div>

                    <input 
                      type="text" 
                      placeholder="Paste External Graphic URL (e.g., https://example.com/banner.jpg)"
                      className="w-full bg-gray-50 border border-transparent rounded-xl p-3 text-xs outline-none focus:bg-white focus:border-red-100 transition-all font-bold"
                      value={newAd.imageUrl}
                      onChange={e => setNewAd({...newAd, imageUrl: e.target.value})}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Video Asset Portion */}
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1 block">Video Option 1: File Upload</label>
                        <div className="border-2 border-dashed border-gray-200 rounded-3xl p-4 text-center cursor-pointer hover:border-red-400 transition-colors relative h-32 flex flex-col justify-center items-center bg-gray-50 overflow-hidden">
                          {videoUploadProgress !== null && (
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white z-10 p-2">
                              <Loader2 className="animate-spin text-red-500 mb-1" size={20} />
                              <p className="text-[10px] font-black uppercase tracking-wider">Uploading Video...</p>
                              <p className="text-xs font-mono">{videoUploadProgress}%</p>
                            </div>
                          )}
                          {newAd.videoUrl ? (
                            <>
                              <video src={newAd.videoUrl} muted autoPlay loop playsInline preload="auto" poster={newAd.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-85" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <span className="text-[9px] font-black text-white uppercase tracking-wider">Change Local Video</span>
                              </div>
                            </>
                          ) : (
                            <div className="space-y-1 text-gray-450">
                              <Upload size={18} className="mx-auto text-gray-400" />
                              <p className="text-[9px] font-black uppercase tracking-widest">Select Video File</p>
                              <p className="text-[7.5px] font-bold text-gray-400">MP4 / WebM supported</p>
                            </div>
                          )}
                          <input 
                            type="file" 
                            accept="video/*" 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            onChange={handleVideoUpload} 
                            disabled={videoUploadProgress !== null}
                          />
                        </div>
                      </div>

                      {/* Cover Thumbnail Fallback */}
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1 block">Backup Thumbnail / Cover</label>
                        <div className="border-2 border-dashed border-gray-200 rounded-3xl p-4 text-center cursor-pointer hover:border-red-400 transition-colors relative h-32 flex flex-col justify-center items-center bg-gray-50 overflow-hidden">
                          {imageUploadProgress !== null && (
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white z-10 p-2">
                              <Loader2 className="animate-spin text-red-500 mb-1" size={20} />
                              <p className="text-[10px] font-black uppercase tracking-wider">Uploading...</p>
                              <p className="text-xs font-mono">{imageUploadProgress}%</p>
                            </div>
                          )}
                          {newAd.imageUrl ? (
                            <>
                              <img src={newAd.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-90" alt="Video cover thumbnail" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <span className="text-[9px] font-black text-white uppercase tracking-wider">Change Thumbnail</span>
                              </div>
                            </>
                          ) : (
                            <div className="space-y-1 text-gray-450">
                              <Upload size={18} className="mx-auto text-gray-400" />
                              <p className="text-[9px] font-black uppercase tracking-widest">Thumbnail File</p>
                              <p className="text-[7.5px] font-bold text-gray-400">Recommended for preview</p>
                            </div>
                          )}
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="absolute inset-5 opacity-0 cursor-pointer" 
                            onChange={handleImageUpload} 
                            disabled={imageUploadProgress !== null}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="relative flex items-center justify-center my-1">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-100" /></div>
                      <span className="relative bg-white px-2 text-[7.5px] font-black text-gray-350 uppercase tracking-widest leading-none">OR USE EXTERNAL VIDEO URL (RECOMMENDED)</span>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-gray-50/50 p-3.5 rounded-2xl border border-gray-100/55 space-y-1.5">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block px-0.5">Quick Stock HD Video Presets (Bypasses local uploads limit)</span>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { name: '🔥 Tech Sale', video: 'https://player.vimeo.com/external/370331493.sd.mp4?s=99d30007dc4c99553b6fa6c33e8a3297a7a5ea7c&profile_id=140', image: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?q=80&w=600&auto=format&fit=crop' },
                            { name: '👗 Fashion Clearance', video: 'https://assets.mixkit.co/videos/preview/mixkit-fashion-promo-3392.mp4', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=600&auto=format&fit=crop' },
                            { name: '👟 Running Sports', video: 'https://assets.mixkit.co/videos/preview/mixkit-running-shoes-in-slow-motion-from-the-side-42426-large.mp4', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop' },
                            { name: '🥦 Fast Groceries', video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c054273b185693c02b667a4270f2095f&profile_id=140', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=600&auto=format&fit=crop' }
                          ].map((preset, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => {
                                setNewAd(prev => ({
                                  ...prev,
                                  videoUrl: preset.video,
                                  imageUrl: preset.image,
                                  mediaType: 'video'
                                }));
                              }}
                              className={cn(
                                "text-center p-2 rounded-xl border text-[8px] font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer",
                                newAd.videoUrl === preset.video ? "bg-red-50 border-red-400 text-red-700" : "bg-white hover:bg-gray-50 border-gray-150 text-gray-500"
                              )}
                            >
                              {preset.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <input 
                          type="text" 
                          placeholder="Paste Direct Video MP4 URL (e.g., https://assets.mixkit.co/videos/preview/mixkit-fashion-promo-3392.mp4)"
                          className="w-full bg-gray-50 border border-transparent rounded-xl p-3 text-xs outline-none focus:bg-white focus:border-red-100 transition-all font-bold"
                          value={newAd.videoUrl}
                          onChange={e => setNewAd({...newAd, videoUrl: e.target.value, imageUrl: newAd.imageUrl || 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=600&auto=format&fit=crop'})}
                        />
                        <input 
                          type="text" 
                          placeholder="Optional: Direct Backup Thumbnail Image URL (if using external video URL)"
                          className="w-full bg-gray-50 border border-transparent rounded-xl p-3 text-xs outline-none focus:bg-white focus:border-red-100 transition-all font-semibold"
                          value={newAd.imageUrl.startsWith('http') ? newAd.imageUrl : ''}
                          onChange={e => setNewAd({...newAd, imageUrl: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Broadcasting Start</label>
                    <input 
                      type="date" 
                      required
                      className="w-full bg-gray-50 border border-transparent rounded-xl p-3 text-xs outline-none focus:bg-white focus:border-red-100 transition-all font-bold"
                      value={newAd.startDate}
                      onChange={e => setNewAd({...newAd, startDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Broadcasting End</label>
                    <input 
                      type="date" 
                      required
                      className="w-full bg-gray-50 border border-transparent rounded-xl p-3 text-xs outline-none focus:bg-white focus:border-red-100 transition-all font-bold"
                      value={newAd.endDate}
                      onChange={e => setNewAd({...newAd, endDate: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button 
                type="submit" 
                disabled={isDeploying}
                className="px-6 py-3.5 bg-red-700 text-white font-black rounded-2xl uppercase tracking-widest text-[9px] shadow-lg shadow-red-700/10 disabled:opacity-50 active:scale-95 cursor-pointer"
              >
                {isDeploying ? 'Deploying on Mainframe...' : (editingAd ? 'Commit Campaign Settings' : 'Initialize Broadcast')}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Filters & Direct Search Field */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Filter campaigns by name or targeted routes..."
            className="w-full bg-white border border-gray-100 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex bg-white rounded-2xl border border-gray-100 p-1 shrink-0">
          {(['all', 'active', 'expired', 'inactive'] as const).map(f => (
            <button 
              key={f}
              type="button"
              onClick={() => setStatusFilter(f)}
              className={cn(
                "px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all capitalize",
                statusFilter === f ? "bg-gray-900 text-white shadow-sm font-black" : "text-gray-400 hover:text-gray-700"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Ads Catalog */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAds.map(ad => {
          const isExpired = new Date(ad.endDate) < new Date();
          return (
            <div key={ad.adId} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between group">
              <div className="relative h-48 bg-gray-50 border-b border-gray-100 overflow-hidden shrink-0">
                {ad.mediaType === 'video' && ad.videoUrl ? (
                  <div className="relative w-full h-full">
                    <video 
                      src={ad.videoUrl} 
                      muted 
                      autoPlay 
                      loop 
                      playsInline 
                      preload="auto"
                      poster={ad.imageUrl}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white font-mono text-[8.5px] font-black tracking-wide">
                      🎥 Video • {ad.duration || 5}s
                    </div>
                  </div>
                ) : (
                  <img src={ad.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={ad.title} />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 flex flex-col justify-end text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border",
                      ad.location === 'banner' ? "bg-blue-600/90 border-blue-400 text-white" :
                      ad.location === 'popup' ? "bg-purple-600/90 border-purple-400 text-white" :
                      ad.location === 'offer' ? "bg-amber-600/90 border-amber-400 text-white" :
                      "bg-rose-600/90 border-rose-450 text-white"
                    )}>
                      {ad.location === 'fullscreen_video' ? '📺 Fullscreen Video' : ad.location}
                    </span>
                    {isExpired ? (
                      <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-red-600 border border-red-400 text-white">Expired</span>
                    ) : (
                      ad.active ? (
                        <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-green-600 border border-green-400 text-white">Active</span>
                      ) : (
                        <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-gray-600 border border-gray-400 text-white">Stopped</span>
                      )
                    )}
                  </div>
                  <h4 className="text-sm font-black uppercase tracking-tight line-clamp-1">{ad.title}</h4>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-2 border-b border-gray-50 pb-3 text-center">
                  <div>
                    <p className="text-[7px] font-black text-gray-400 uppercase tracking-tighter">Views</p>
                    <p className="text-base font-black text-gray-900">{ad.views || 0}</p>
                  </div>
                  <div>
                    <p className="text-[7px] font-black text-gray-400 uppercase tracking-tighter">Clicks</p>
                    <p className="text-base font-black text-gray-900">{ad.clicks || 0}</p>
                  </div>
                  <div>
                    <p className="text-[7px] font-black text-gray-400 uppercase tracking-tighter">CTR Rate</p>
                    <p className="text-base font-black text-orange-650">
                      {ad.views > 0 ? (((ad.clicks || 0) / ad.views) * 100).toFixed(1) : '0.0'}%
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Clock size={11} className="shrink-0 text-gray-400" />
                    {new Date(ad.startDate).toLocaleDateString()} - {new Date(ad.endDate).toLocaleDateString()}
                  </span>
                  <span className="truncate max-w-xs lowercase font-mono select-all bg-gray-50 border border-gray-150 px-2 py-1 rounded">
                    {ad.link}
                  </span>
                </div>

                <div className="flex gap-2 justify-end pt-1">
                  <button 
                    onClick={() => handleToggleActive(ad)}
                    className={cn(
                      "flex-1 md:flex-none px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer",
                      ad.active ? "bg-amber-50 hover:bg-amber-100 text-amber-600" : "bg-green-50 hover:bg-green-100 text-green-600"
                    )}
                  >
                    {ad.active ? 'Stop' : 'Start'}
                  </button>

                  <button 
                    onClick={() => handleEdit(ad)}
                    className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl transition-all cursor-pointer"
                    title="Edit Campaign"
                  >
                    <Edit size={14} />
                  </button>

                  <button 
                    onClick={() => handleDelete(ad.adId)}
                    className="px-3.5 py-2 bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-650 rounded-xl transition-all cursor-pointer"
                    title="Delete Campaign"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredAds.length === 0 && (
          <div className="bg-gray-50/50 rounded-[40px] p-20 text-center border-2 border-dashed border-gray-100 opacity-40 col-span-full">
            <Megaphone size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em]">No Active Campaigns In Selected Range</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LocationAreaManager() {
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingArea, setEditingArea] = useState<any | null>(null);

  // Form states
  const [country, setCountry] = useState<'Nepal' | 'India'>('Nepal');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [ward, setWard] = useState('');
  const [status, setStatus] = useState<'Enabled' | 'Disabled'>('Enabled');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'areas'), (snap) => {
      setLoading(false);
      const list: any[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setAreas(list);
    }, (error) => {
      console.error("Failed to fetch areas:", error);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Preset location structure handlers
  const handleCountryChange = (c: 'Nepal' | 'India') => {
    setCountry(c);
    setState('');
    setDistrict('');
    setCity('');
    setMunicipality('');
    setWard('');
  };

  const handleStateChange = (s: string) => {
    setState(s);
    setDistrict('');
    setCity('');
    setMunicipality('');
  };

  const handleDistrictChange = (d: string) => {
    setDistrict(d);
    setCity('');
    setMunicipality('');
    setWard('');
  };

  // Nepal structures helper list
  const nepalProvinces = NEPAL_LOCATIONS.provinces;
  const nepalDistricts = nepalProvinces.find(p => p.name === state)?.districts || [];
  const nepalMunicipalities = (NEPAL_LOCATIONS.municipalities as any)[district] || [];

  // India structures helper list
  const indiaStates = [...INDIA_LOCATIONS.states, ...INDIA_LOCATIONS.unionTerritories];
  const indiaDistricts = indiaStates.find(s => s.name === state)?.districts || [];
  const indiaCities = indiaStates.find(s => s.name === state)?.cities || [];

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state || !district || (!city && !municipality)) {
      alert("Please select State, District, and City or Municipality.");
      return;
    }

    const areaId = editingArea ? editingArea.id : `area-${Date.now()}`;
    const areaData = {
      id: areaId,
      country,
      state,
      district,
      city: country === 'Nepal' ? (municipality || city) : (city || municipality),
      municipality: country === 'Nepal' ? municipality : '',
      ward,
      status,
      createdAt: editingArea?.createdAt || new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'areas', areaId), areaData);
      alert(editingArea ? "Area updated successfully" : "New Area added successfully");
      resetForm();
    } catch (err: any) {
      alert("Failed to save area: " + err.message);
    }
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingArea(null);
    setCountry('Nepal');
    setState('');
    setDistrict('');
    setCity('');
    setMunicipality('');
    setWard('');
    setStatus('Enabled');
  };

  const handleEdit = (area: any) => {
    setEditingArea(area);
    setCountry(area.country);
    setState(area.state);
    setDistrict(area.district);
    if (area.country === 'Nepal') {
      setMunicipality(area.city);
      setCity('');
    } else {
      setCity(area.city);
      setMunicipality('');
    }
    setWard(area.ward || '');
    setStatus(area.status || 'Enabled');
    setIsAdding(true);
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Enabled' ? 'Disabled' : 'Enabled';
    try {
      await updateDoc(doc(db, 'areas', id), { status: nextStatus });
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    }
  };

  const bulkToggleStatus = async (targetCountry: 'Nepal' | 'India', targetStatus: 'Enabled' | 'Disabled') => {
    const confirmation = confirm(`Are you sure you want to ${targetStatus === 'Enabled' ? 'Enable' : 'Disable'} all deliveries for ${targetCountry}?`);
    if (!confirmation) return;
    
    const targetAreas = areas.filter(a => (a.country || '').toLowerCase() === targetCountry.toLowerCase());
    if (targetAreas.length === 0) {
      alert(`No registered areas found for ${targetCountry} yet. Add an area first!`);
      return;
    }
    
    try {
      setLoading(true);
      const batchPromises = targetAreas.map(async (area) => {
        await updateDoc(doc(db, 'areas', area.id), { status: targetStatus });
      });
      await Promise.all(batchPromises);
      alert(`Successfully ${targetStatus === 'Enabled' ? 'ENABLED' : 'DISABLED'} all areas under ${targetCountry}.`);
    } catch (err: any) {
      alert("Failed to update bulk areas: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this delivery area?")) return;
    try {
      await deleteDoc(doc(db, 'areas', id));
    } catch (err: any) {
      alert("Failed to delete area: " + err.message);
    }
  };

  const filteredAreas = areas.filter(a => {
    const q = searchQuery.toLowerCase();
    return (
      (a.country || '').toLowerCase().includes(q) ||
      (a.state || '').toLowerCase().includes(q) ||
      (a.district || '').toLowerCase().includes(q) ||
      (a.city || '').toLowerCase().includes(q) ||
      (a.municipality || '').toLowerCase().includes(q) ||
      (a.ward || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex-wrap gap-3">
        <div>
          <h3 className="text-xs font-black text-gray-900 uppercase font-sans">Area & Deliverability Management</h3>
          <p className="text-[8px] text-gray-400 font-bold uppercase mt-0.5">Define countries, states, districts, cities and wards authorized for delivery logistics</p>
        </div>
        <button
          onClick={() => {
            if (isAdding) {
              resetForm();
            } else {
              setIsAdding(true);
            }
          }}
          className={cn(
            "p-2.5 rounded-xl transition-all active:scale-95 flex items-center gap-1 cursor-pointer font-sans text-[8.5px] uppercase font-black tracking-wider",
            isAdding ? "bg-red-50 text-red-600 border border-red-200" : "bg-red-700 text-white shadow-lg"
          )}
        >
          {isAdding ? <X size={14} /> : <><Plus size={12} className="stroke-[3]" /> Add Delivery Area</>}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-5 overflow-hidden"
          >
            <form onSubmit={handleCreateOrUpdate} className="space-y-5">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest font-sans">
                  {editingArea ? 'Edit Delivery Area Parameters' : 'Register New Actionable Delivery Area'}
                </h4>
                <span className="text-[7.5px] font-black uppercase text-gray-400 tracking-wider bg-gray-100 px-2 py-0.5 rounded-full font-sans">
                  Status: {status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
                {/* Country */}
                <div>
                  <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Country Selection</label>
                  <select
                    value={country}
                    onChange={e => handleCountryChange(e.target.value as any)}
                    className="w-full bg-gray-50 border border-transparent rounded-xl p-3 text-xs outline-none focus:bg-white focus:border-red-100 transition-all font-bold"
                  >
                    <option value="Nepal">🇳🇵 Nepal</option>
                    <option value="India">🇮🇳 India</option>
                  </select>
                </div>

                {/* State/Province */}
                <div>
                  <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
                    {country === 'Nepal' ? 'Province' : 'State / UT'}
                  </label>
                  <select
                    value={state}
                    onChange={e => handleStateChange(e.target.value)}
                    required
                    className="w-full bg-gray-50 border border-transparent rounded-xl p-3 text-xs outline-none focus:bg-white focus:border-red-100 transition-all font-bold"
                  >
                    <option value="">-- Choose Region --</option>
                    {country === 'Nepal' ? (
                      nepalProvinces.map(p => <option key={p.name} value={p.name}>{p.name}</option>)
                    ) : (
                      indiaStates.map(s => <option key={s.name} value={s.name}>{s.name}</option>)
                    )}
                  </select>
                </div>

                {/* District */}
                <div>
                  <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">District</label>
                  <select
                    value={district}
                    onChange={e => handleDistrictChange(e.target.value)}
                    required
                    disabled={!state}
                    className="w-full bg-gray-50 border border-transparent rounded-xl p-3 text-xs outline-none focus:bg-white focus:border-red-100 transition-all font-bold disabled:opacity-50"
                  >
                    <option value="">-- Choose District --</option>
                    {country === 'Nepal' ? (
                      nepalDistricts.map(d => <option key={d} value={d}>{d}</option>)
                    ) : (
                      indiaDistricts.map(d => <option key={d} value={d}>{d}</option>)
                    )}
                  </select>
                </div>

                {/* Municipality / City */}
                <div>
                  <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
                    {country === 'Nepal' ? 'Municipality / Rural' : 'City name'}
                  </label>
                  {country === 'Nepal' ? (
                    <div className="space-y-1.5">
                      <select
                        value={municipality}
                        onChange={e => setMunicipality(e.target.value)}
                        disabled={!district}
                        className="w-full bg-gray-50 border border-transparent rounded-xl p-3 text-xs outline-none focus:bg-white focus:border-red-100 transition-all font-bold disabled:opacity-50"
                      >
                        <option value="">-- Choose Municipality --</option>
                        {nepalMunicipalities.map((m: string) => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <input
                        placeholder="Or type custom municipality"
                        value={municipality}
                        onChange={e => setMunicipality(e.target.value)}
                        disabled={!district}
                        className="w-full bg-gray-50 border border-transparent rounded-xl p-3 text-xs outline-none focus:bg-white focus:border-red-100 transition-all font-bold"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <select
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        disabled={!district}
                        className="w-full bg-gray-50 border border-transparent rounded-xl p-3 text-xs outline-none focus:bg-white focus:border-red-100 transition-all font-bold disabled:opacity-50"
                      >
                        <option value="">-- Choose City --</option>
                        {indiaCities.map((c: string) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <input
                        placeholder="Or type custom city"
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        disabled={!district}
                        className="w-full bg-gray-50 border border-transparent rounded-xl p-3 text-xs outline-none focus:bg-white focus:border-red-100 transition-all font-bold"
                      />
                    </div>
                  )}
                </div>

                {/* Ward */}
                <div>
                  <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Ward No (Optional)</label>
                  <input
                    placeholder="e.g. Ward 4"
                    value={ward}
                    onChange={e => setWard(e.target.value)}
                    className="w-full bg-gray-50 border border-transparent rounded-xl p-3 text-xs outline-none focus:bg-white focus:border-red-100 transition-all font-bold"
                  />
                </div>

                {/* Status selection */}
                <div>
                  <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Delivery Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full bg-gray-50 border border-transparent rounded-xl p-3 text-xs outline-none focus:bg-white focus:border-red-100 transition-all font-bold"
                  >
                    <option value="Enabled">🟢 Enabled (Accept Orders)</option>
                    <option value="Disabled">🔴 Disabled (Block Delivery)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-850 text-white px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer shadow-md"
                >
                  {editingArea ? 'Update Address Protocol' : 'Deploy Service Area'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Search and Service Area List */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        
        {/* Bulk Country Toggle Controls */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-gray-50 pb-4">
          <button
            type="button"
            onClick={() => bulkToggleStatus('India', 'Enabled')}
            className="bg-green-50 hover:bg-green-150 text-green-700 text-[8px] font-black uppercase tracking-wider py-2.5 px-3 rounded-xl border border-green-200 transition-all text-center cursor-pointer"
          >
            🟢 Enable India Areas
          </button>
          <button
            type="button"
            onClick={() => bulkToggleStatus('India', 'Disabled')}
            className="bg-red-50 hover:bg-red-150 text-red-700 text-[8px] font-black uppercase tracking-wider py-2.5 px-3 rounded-xl border border-red-200 transition-all text-center cursor-pointer"
          >
            🔴 Disable India Areas
          </button>
          <button
            type="button"
            onClick={() => bulkToggleStatus('Nepal', 'Enabled')}
            className="bg-green-50 hover:bg-green-150 text-green-700 text-[8px] font-black uppercase tracking-wider py-2.5 px-3 rounded-xl border border-green-200 transition-all text-center cursor-pointer"
          >
            🟢 Enable Nepal Areas
          </button>
          <button
            type="button"
            onClick={() => bulkToggleStatus('Nepal', 'Disabled')}
            className="bg-red-50 hover:bg-red-150 text-red-700 text-[8px] font-black uppercase tracking-wider py-2.5 px-3 rounded-xl border border-red-200 transition-all text-center cursor-pointer"
          >
            🔴 Disable Nepal Areas
          </button>
        </div>

        <div className="flex items-center gap-3 bg-gray-50 border border-gray-150 rounded-2xl px-3 py-2">
          <Search size={14} className="text-gray-400" />
          <input
            placeholder="Search Service Area by State, District, City/Municipality, or Ward..."
            className="flex-1 bg-transparent border-none text-xs text-gray-800 outline-none font-sans font-bold"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="p-0.5 hover:text-red-650 text-gray-400 cursor-pointer">
              <X size={12} />
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-10 text-[9px] font-black uppercase text-gray-400 tracking-widest">
            Loading service locations...
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-100 rounded-2xl p-1">
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[8px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="p-3">Country</th>
                  <th className="p-3">State / Province</th>
                  <th className="p-3">District</th>
                  <th className="p-3">City / Municipality</th>
                  <th className="p-3">Ward No</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAreas.map((area) => (
                  <tr key={area.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3 font-semibold text-gray-900">
                      {area.country === 'Nepal' ? '🇳🇵 Nepal' : '🇮🇳 India'}
                    </td>
                    <td className="p-3 text-gray-700 font-medium">{area.state}</td>
                    <td className="p-3 text-gray-700 font-medium">{area.district}</td>
                    <td className="p-3 text-gray-700 font-bold">{area.city || area.municipality}</td>
                    <td className="p-3 text-gray-500 font-mono text-[10px]">{area.ward || '—'}</td>
                    <td className="p-3">
                      <span className={cn(
                        "text-[7px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider",
                        area.status === 'Enabled' 
                          ? "bg-green-50 text-green-600 border border-green-150" 
                          : "bg-red-50 text-red-600 border border-red-150"
                      )}>
                        {area.status || 'Enabled'}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1 whitespace-nowrap">
                      {/* Enable/Disable status toggle button */}
                      <button
                        type="button"
                        onClick={() => toggleStatus(area.id, area.status || 'Enabled')}
                        className={cn(
                          "px-2 py-1 text-[7px] font-black uppercase tracking-wider border rounded-lg cursor-pointer active:scale-95 transition-all inline",
                          area.status === 'Enabled' 
                            ? "bg-red-50 text-red-600 border-red-100 hover:bg-red-100/50" 
                            : "bg-green-50 text-green-600 border-green-100 hover:bg-green-100/50"
                        )}
                        title={area.status === 'Enabled' ? "Block Deliveries" : "Allow Deliveries"}
                      >
                        {area.status === 'Enabled' ? "Block" : "Unblock"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEdit(area)}
                        className="p-1 bg-white hover:bg-gray-50 border border-gray-150 text-gray-450 hover:text-blue-600 rounded-lg transition-all inline cursor-pointer active:scale-95"
                        title="Edit Area Details"
                      >
                        <Edit size={12} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(area.id)}
                        className="p-1 bg-white hover:bg-red-50 border border-gray-150 text-gray-450 hover:text-red-600 rounded-lg transition-all inline cursor-pointer active:scale-95"
                        title="Remove Delivery Area"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredAreas.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-[9px] font-black text-gray-400 uppercase tracking-widest italic">
                      No matching registered service areas found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function PaymentManager({ 
  payments, 
  setPayments, 
  orders 
}: { 
  payments: any[]; 
  setPayments: React.Dispatch<React.SetStateAction<any[]>>; 
  orders: Order[]; 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Stats calculation
  const totalCount = payments.length;
  const successPayments = payments.filter(p => p.paymentStatus === 'success');
  const pendingPayments = payments.filter(p => p.paymentStatus === 'pending');
  const failedPayments = payments.filter(p => p.paymentStatus === 'failed');
  const refundedPayments = payments.filter(p => p.paymentStatus === 'refunded');

  // NPR (Nepal) total volume
  const nprVolume = successPayments
    .filter(p => p.currency === 'NPR')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  // INR (India) total volume
  const inrVolume = successPayments
    .filter(p => p.currency === 'INR')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const filteredPayments = payments.filter(p => {
    const matchesSearch = 
      (p.paymentId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.transactionId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.orderId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.customerEmail || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || p.paymentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleIssueRefund = async (paymentId: string, orderId: string) => {
    if (!confirm(`Are you sure you want to refund this payment of ID ${paymentId}? This will automatically mark both the transaction and the associated order as Refunded.`)) return;

    setUpdatingId(paymentId);
    try {
      // 1. Update the payment transaction in Firestore
      await updateDoc(doc(db, 'payments', paymentId), {
        paymentStatus: 'refunded',
        refundedAt: serverTimestamp()
      });

      // 2. Locate and update the corresponding order in Firestore
      if (orderId) {
        // Try to update the main order collection field
        await updateDoc(doc(db, 'orders', orderId), {
          paymentStatus: 'refunded',
          status: 'cancelled',
          adminNotes: `Payment refunded automatically on admin request. Payment ID: ${paymentId}`
        });
      }

      alert("Refund request processed successfully. Cashflow balance updated.");
    } catch (err: any) {
      console.error("Failed to process refund:", err);
      alert("Error processing refund: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase flex items-center gap-2">
            <CreditCard className="text-orange-500" size={20} />
            <span>Payments & Liquidity Dashboard</span>
          </h2>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">Manage multi-currency transactions, gateways AND refunds</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Nepal Liquidity */}
        <div className="bg-emerald-50/50 p-5 rounded-[2.2rem] border border-emerald-100 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-black text-emerald-600 block uppercase tracking-widest leading-none">Nepal Volume 🇳🇵</span>
            <span className="text-2xl font-black text-emerald-900 block tracking-tight">NPR {nprVolume.toLocaleString()}</span>
            <span className="text-[8px] text-emerald-500 font-bold uppercase tracking-wider block">Completed Gateways API</span>
          </div>
          <div className="w-12 h-12 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">NPR</div>
        </div>

        {/* Metric 2: India Liquidity */}
        <div className="bg-blue-50/50 p-5 rounded-[2.2rem] border border-blue-100 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-black text-blue-600 block uppercase tracking-widest leading-none">India Volume 🇮🇳</span>
            <span className="text-2xl font-black text-blue-900 block tracking-tight">INR {inrVolume.toLocaleString()}</span>
            <span className="text-[8px] text-blue-500 font-bold uppercase tracking-wider block">Razorpay Realtime Settled</span>
          </div>
          <div className="w-12 h-12 rounded-3xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">INR</div>
        </div>

        {/* Metric 3: Success Rates */}
        <div className="bg-orange-50/40 p-5 rounded-[2.2rem] border border-orange-100 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-black text-orange-600 block uppercase tracking-widest leading-none">Successful / Total Payments</span>
            <div className="flex gap-3 items-baseline">
              <span className="text-2xl font-black text-orange-900 tracking-tight">{successPayments.length} Successful</span>
              <span className="text-[10px] text-gray-400 font-bold">/ {totalCount} total</span>
            </div>
            <span className="text-[8px] text-orange-500 font-bold uppercase tracking-wider block">
              {totalCount > 0 ? Math.round((successPayments.length / totalCount) * 100) : 100}% Gateway Success Rate
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
            <TrendingUp size={18} />
          </div>
        </div>

        {/* Metric 4: Failed & Pending Payments */}
        <div className="bg-red-50/40 p-5 rounded-[2.2rem] border border-red-100 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[9px] font-black text-red-650 block uppercase tracking-widest leading-none">Failed & Pending Queues</span>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="bg-red-100 text-red-700 font-black px-2 py-0.5 rounded text-[10px] uppercase">{failedPayments.length} Failed</span>
              <span className="bg-amber-100 text-amber-700 font-black px-2 py-0.5 rounded text-[10px] uppercase">{pendingPayments.length} Pending</span>
              <span className="bg-gray-150 text-gray-700 font-black px-1.5 py-0.5 rounded text-[9px] uppercase">{refundedPayments.length} Refunded</span>
            </div>
            <span className="text-[8px] text-red-500 font-bold uppercase tracking-widest block">Signature Audited Logs</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-red-150 text-red-600 flex items-center justify-center">
            <RotateCcw size={18} />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-grow w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-450" size={16} />
          <input
            type="text"
            placeholder="Search by Payment ID, Transaction ID, order ID, customer name or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-transparent rounded-2xl pl-11 pr-4 py-3.5 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold transition-all"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 select-none shrink-0">
          {[
            { id: 'all', label: 'All Payments' },
            { id: 'success', label: 'Success' },
            { id: 'refund_requested', label: 'Refund Requests' },
            { id: 'pending', label: 'Pending' },
            { id: 'failed', label: 'Failed' },
            { id: 'refunded', label: 'Refunded' }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setStatusFilter(opt.id)}
              className={cn(
                "px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer border transition-all whitespace-nowrap",
                statusFilter === opt.id 
                  ? "bg-gray-900 border-gray-900 text-white shadow-md shadow-gray-200" 
                  : "bg-white border-gray-150 text-gray-500 hover:border-gray-300"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        {filteredPayments.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mx-auto">
              <CreditCard size={28} />
            </div>
            <h3 className="text-sm font-black text-gray-900 uppercase">No payment transactions found</h3>
            <p className="text-xs text-gray-450 uppercase tracking-widest">Broaden your search terms or verify settings connection</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="py-4.5 px-6 text-[9.5px] font-black uppercase text-gray-400 tracking-wider">Payment ID / Date</th>
                  <th className="py-4.5 px-6 text-[9.5px] font-black uppercase text-gray-400 tracking-wider">Customer Details</th>
                  <th className="py-4.5 px-6 text-[9.5px] font-black uppercase text-gray-400 tracking-wider">Gateway Method</th>
                  <th className="py-4.5 px-6 text-[9.5px] font-black uppercase text-gray-400 tracking-wider">Transaction ID</th>
                  <th className="py-4.5 px-6 text-[9.5px] font-black uppercase text-gray-400 tracking-wider">Amount Paid</th>
                  <th className="py-4.5 px-6 text-[9.5px] font-black uppercase text-gray-400 tracking-wider">Status</th>
                  <th className="py-4.5 px-6 text-[9.5px] font-black uppercase text-gray-400 tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPayments.map(p => {
                  const payDate = p.createdAt?.seconds 
                    ? new Date(p.createdAt.seconds * 1000).toLocaleString() 
                    : p.createdAt 
                      ? new Date(p.createdAt).toLocaleString() 
                      : 'Unknown Date';

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="py-5 px-6 space-y-1">
                        <span className="block text-xs font-black text-gray-900 tracking-tight">{p.paymentId}</span>
                        <span className="block text-[8px] font-bold text-gray-400 font-mono">{payDate}</span>
                        {p.orderId && (
                          <span className="inline-block bg-orange-50 text-orange-700 font-extrabold px-2 py-0.5 rounded text-[8px] tracking-wide uppercase">
                            Order: {p.orderId}
                          </span>
                        )}
                      </td>
                      <td className="py-5 px-6 space-y-1">
                        <span className="block text-xs font-extrabold text-gray-800 leading-none">{p.customerName}</span>
                        <span className="block text-[9px] text-gray-400 font-bold">{p.customerEmail}</span>
                        {p.customerPhone && (
                          <span className="block text-[8.5px] text-gray-400 font-bold font-mono">{p.customerPhone}</span>
                        )}
                      </td>
                      <td className="py-5 px-6 font-sans">
                        <span className="inline-flex items-center gap-1.5 font-bold text-xs uppercase text-gray-700">
                          {p.currency === 'INR' ? '🇮🇳' : '🇳🇵'} {p.paymentMethod}
                        </span>
                        <span className="block text-[7.5px] text-gray-400 font-black uppercase">Live Automated Gateway</span>
                      </td>
                      <td className="py-5 px-6 font-mono text-[10px] font-black text-gray-650 tracking-wide space-y-1">
                        <div>{p.transactionId || p.paymentTransactionId || 'N/A'}</div>
                        {p.paymentProof && (
                          <a 
                            href={p.paymentProof} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-150 text-indigo-705 text-[8px] font-black uppercase px-2 py-0.5 rounded-lg hover:bg-indigo-600 hover:text-white transition-all select-none"
                          >
                            <span>🖼️ Receipt Proof</span>
                          </a>
                        )}
                      </td>
                      <td className="py-5 px-6">
                        <span className="text-sm font-black text-gray-900 tracking-tight">
                          {p.currency === 'INR' ? 'Rs.' : 'Rs.'} {p.amount}
                        </span>
                        <span className="block text-[8px] font-black text-gray-400 tracking-wider font-mono">{p.currency} Standard</span>
                      </td>
                      <td className="py-5 px-6">
                        <span className={cn(
                          "px-2.5 py-1 text-[8.5px] font-black uppercase rounded tracking-wider inline-block",
                          p.paymentStatus === 'success' && "bg-green-100 text-green-700",
                          p.paymentStatus === 'pending' && "bg-amber-100 text-amber-700 animate-pulse",
                          p.paymentStatus === 'failed' && "bg-red-100 text-red-700",
                          p.paymentStatus === 'refund_requested' && "bg-purple-100 text-purple-705 animate-pulse",
                          p.paymentStatus === 'refunded' && "bg-indigo-100 text-indigo-700"
                        )}>
                          {p.paymentStatus === 'refund_requested' ? 'refund requested' : p.paymentStatus}
                        </span>
                      </td>
                      <td className="py-5 px-6 text-right">
                        {p.paymentStatus === 'success' ? (
                          <button
                            type="button"
                            disabled={updatingId === p.id}
                            onClick={() => handleIssueRefund(p.id, p.orderId)}
                            className="bg-red-50 hover:bg-red-650 hover:text-white text-red-650 border border-red-150 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                          >
                            {updatingId === p.id ? 'Refunding...' : 'Refund'}
                          </button>
                        ) : p.paymentStatus === 'refund_requested' ? (
                          <button
                            type="button"
                            disabled={updatingId === p.id}
                            onClick={() => handleIssueRefund(p.id, p.orderId)}
                            className="bg-purple-50 hover:bg-purple-600 hover:text-white text-purple-700 border border-purple-200 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                          >
                            {updatingId === p.id ? 'Refunding...' : 'Approve Refund'}
                          </button>
                        ) : (
                          <span className="text-[9px] font-bold text-gray-400 uppercase select-none">No Action</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


