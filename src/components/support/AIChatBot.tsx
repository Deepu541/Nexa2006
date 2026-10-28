import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, X, Bot, Headset, Loader2, ArrowRight, User, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs, doc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { cn, getApiUrl } from '../../utils';
import { Order } from '../../types';

export default function AIChatBot() {
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<{ role: 'user' | 'ai' | 'admin', content: string, timestamp: any }[]>([]);
  const [input, setInput] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const [recentOrders, setRecentOrders] = React.useState<Order[]>([]);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(scrollToBottom, [messages, isTyping]);

  React.useEffect(() => {
    if (isOpen && user) {
      // Fetch recent orders for context
      const q = query(
        collection(db, 'orders'),
        where('customerId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(3)
      );
      getDocs(q).then(snap => {
        setRecentOrders(snap.docs.map(doc => ({ ...doc.data(), orderId: doc.id }) as Order));
      });
      
      // Load previous messages if any (simplified for preview, usually would be a specific session)
      if (messages.length === 0) {
        setMessages([
          { role: 'ai', content: `Namaste ${profile?.fullName || ''}! I am your NexaMart AI Assistant. How can I help you today?`, timestamp: new Date() }
        ]);
      }
    }
  }, [isOpen, user, profile]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg, timestamp: new Date() }]);
    setIsTyping(true);

    try {
      const response = await fetch(getApiUrl('/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.concat({ role: 'user', content: userMsg, timestamp: new Date() }),
          orderInfo: recentOrders.map(o => ({ id: o.orderId, status: o.status, total: o.totalAmount, date: o.createdAt })),
          customerInfo: { name: profile?.fullName, email: profile?.email }
        })
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.content, timestamp: new Date() }]);
      
      // Also sync to firestore for admin visibility
      if (user) {
        await setDoc(doc(db, 'support_sessions', user.uid), {
          customerId: user.uid,
          customerName: profile?.fullName,
          messages: messages.concat(
            { role: 'user', content: userMsg, timestamp: new Date() },
            { role: 'ai', content: data.content, timestamp: new Date() }
          ),
          status: 'active',
          lastMessageAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, { role: 'ai', content: "I'm having some technical trouble. Would you like to contact our team on WhatsApp?", timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleEscalate = () => {
    const text = `Namaste NexaMart Support, I need help with my orders. \nCustomer: ${profile?.fullName}\nPhone: ${profile?.phone || 'Not provided'}`;
    const url = `https://wa.me/+9779700694631?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-[999] w-14 h-14 bg-orange-600 text-white rounded-full flex items-center justify-center shadow-2xl border-4 border-white active:bg-orange-700"
      >
        <MessageSquare size={24} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed inset-0 z-[1000] flex items-end justify-center p-4 sm:p-6"
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
            
            <div className="bg-white w-full max-w-sm h-[80vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden relative border border-gray-100">
              {/* Header */}
              <div className="bg-orange-600 p-6 flex justify-between items-center text-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                    <Bot size={24} />
                  </div>
                  <div>
                    <h3 className="text-[11px] font-black uppercase tracking-widest leading-none">NexaMart Smart AI</h3>
                    <p className="text-[9px] font-bold opacity-70 uppercase tracking-widest mt-1">Online & Professional</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: m.role === 'user' ? 10 : -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "flex flex-col max-w-[85%]",
                      m.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    <div className={cn(
                      "p-4 rounded-2xl text-[13px] font-medium leading-relaxed shadow-sm",
                      m.role === 'user' 
                        ? "bg-orange-600 text-white rounded-tr-none" 
                        : "bg-white text-gray-800 rounded-tl-none border border-gray-100"
                    )}>
                      {m.content}
                    </div>
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1 px-1">
                      {m.role.toUpperCase()} • {new Date(m.timestamp?.toDate ? m.timestamp.toDate() : m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </motion.div>
                ))}
                {isTyping && (
                  <div className="flex flex-col mr-auto max-w-[85%] items-start">
                    <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex gap-1">
                      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions / Context */}
              {messages.length === 1 && recentOrders.length > 0 && (
                <div className="px-6 py-4 bg-white border-t border-gray-100 overflow-x-auto shrink-0 flex gap-2 no-scrollbar">
                  {recentOrders.map(order => (
                    <button
                      key={order.orderId}
                      onClick={() => {
                        setInput(`Where is my order #${order.orderId.slice(-6)}?`);
                      }}
                      className="shrink-0 bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl text-[9px] font-black uppercase text-gray-600 hover:bg-orange-50 hover:border-orange-100 transition-all"
                    >
                      Check Order #{order.orderId.slice(-6)}
                    </button>
                  ))}
                  <button onClick={handleEscalate} className="shrink-0 bg-green-50 border border-green-100 px-3 py-2 rounded-xl text-[9px] font-black uppercase text-green-600 flex items-center gap-1.5">
                    <Headset size={12} /> WhatsApp Escalate
                  </button>
                </div>
              )}

              {/* Escalation Prompt */}
              {messages.length > 4 && (
                <div className="px-6 py-2 bg-orange-50 shrink-0 border-t border-orange-100">
                   <button 
                    onClick={handleEscalate}
                    className="w-full flex items-center justify-between group"
                   >
                     <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest">Issue not resolved? Talk to human</p>
                     <ArrowRight size={14} className="text-orange-600 group-hover:translate-x-1 transition-transform" />
                   </button>
                </div>
              )}

              {/* Input */}
              <form onSubmit={handleSend} className="p-6 bg-white shrink-0">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Type your question..."
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-3 pl-4 pr-12 text-[13px] font-bold outline-none focus:bg-white focus:border-orange-500 transition-all placeholder:text-gray-300"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isTyping}
                    className="absolute right-2 w-10 h-10 bg-orange-600 text-white rounded-xl flex items-center justify-center hover:bg-orange-700 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                  >
                    {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </div>
                <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest text-center mt-4">
                  NexaMart Intelligent Infrastructure • Kathmandu, Nepal
                </p>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
