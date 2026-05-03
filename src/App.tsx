/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, MouseEvent, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Menu, 
  X, 
  ArrowRight, 
  Instagram, 
  Twitter, 
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Check,
  Edit2,
  Package,
  History,
  TrendingUp,
  Database,
  ClipboardList,
  Image as ImageIcon,
  DollarSign,
  Tag as TagIcon
} from 'lucide-react';

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import firebaseConfigJson from '../firebase-applet-config.json';
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId,
};

const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfigJson.firestoreDatabaseId;

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, databaseId);
const auth = getAuth(app);

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: { uid: auth.currentUser?.uid },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  window.alert(`Protocol Failure: ${errInfo.error}`);
}

// Technical Line-Art Scorpion Logo (Biological but clean)
const ScorpionLogo = ({ className = "w-10 h-10" }: { className?: string }) => (
  <svg 
    viewBox="0 0 100 100" 
    className={className} 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      {/* Segmented Body Carapace */}
      <path d="M50 22C46 22 42 26 42 35C42 45 46 52 50 54C54 52 58 45 58 35C58 26 54 22 50 22Z" />
      <path d="M43 32H57" strokeWidth="0.5" opacity="0.4" />
      <path d="M42 38H58" strokeWidth="0.5" opacity="0.4" />
      <path d="M43 45H57" strokeWidth="0.5" opacity="0.4" />
      
      {/* Tail - Realistic Segments */}
      <path d="M50 54L48 62C47 65 49 68 52 68L50 76C49 79 51 82 54 82C62 82 68 76 70 68C72 60 68 54 62 50" />
      <path d="M48 62H52" strokeWidth="0.5" opacity="0.3" />
      <path d="M50 76H54" strokeWidth="0.5" opacity="0.3" />
      
      {/* Detailed Stinger */}
      <path d="M62 50L68 42L74 38C76 36 78 38 76 42L70 48" strokeWidth="1.5" />
      <circle cx="76" cy="40" r="1.5" fill="currentColor" />

      {/* Articulated Claws */}
      <path d="M42 32Q32 30 25 22L12 12C8 8 5 12 10 18L20 28Q25 32 35 32" />
      <path d="M58 32Q68 30 75 22L88 12C92 8 95 12 90 18L80 28Q75 32 65 32" />
      
      {/* Serrated edge detail for claws */}
      <path d="M12 12L15 15" strokeWidth="2" />
      <path d="M88 12L85 15" strokeWidth="2" />
      
      {/* Legs (Articulated with joints) */}
      <path d="M40 40L25 38L15 45" strokeWidth="0.8" />
      <path d="M60 40L75 38L85 45" strokeWidth="0.8" />
      
      <path d="M38 48L20 52L12 65" strokeWidth="0.8" />
      <path d="M62 48L80 52L88 65" strokeWidth="0.8" />
      
      <path d="M42 52L30 65L25 80" strokeWidth="0.8" />
      <path d="M58 52L70 65L75 80" strokeWidth="0.8" />
    </g>
  </svg>
);

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('L');
  const [cart, setCart] = useState<{ id: string, quantity: number, size: string }[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isCartBumping, setIsCartBumping] = useState(false);
  const [toasts, setToasts] = useState<{ id: number, message: string }[]>([]);

  // Product Editing State
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editingProductData, setEditingProductData] = useState<any>(null);
  const [tempImages, setTempImages] = useState<string[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const SIZES = ['S', 'M', 'L', 'XL'];

  const [isDbConnected, setIsDbConnected] = useState<boolean | null>(null);

  const showToast = (message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  useEffect(() => {
    // Sync Products (Public Access) with persistent monitoring
    setProductsLoading(true);
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(prods);
      setProductsLoading(false);
      setIsDbConnected(true);
      const source = snapshot.metadata.fromCache ? "Cache" : "Server";
      console.log(`Colony Sync: ${prods.length} products integrated from ${source}.`);
    }, (error) => {
      console.error("Colony Data Fetch Failure:", error);
      setIsDbConnected(false);
      setProductsLoading(false);
      handleFirestoreError(error, OperationType.GET, 'products');
    });

    return () => unsubscribe();
  }, []);

  // 3. Conditional Sync for Orders (Only when Admin is logged in)
  useEffect(() => {
    let unsubscribeOrders: () => void = () => {};

    if (isAdminLoggedIn) {
      const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
        setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => {
        console.error("Order sync error:", error);
      });
    }

    return () => unsubscribeOrders();
  }, [isAdminLoggedIn]);

  useEffect(() => {
    // Initial entrance delay
    const timer = setTimeout(() => setIsLoaded(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (selectedProduct) setActiveImageIdx(0);
  }, [selectedProduct]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const categories: string[] = Array.from(new Set(products.map(p => p.category as string))).filter(Boolean) as string[];
  const tags: string[] = Array.from(new Set(products.map(p => p.tag as string))).filter(Boolean) as string[];

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const filteredProducts = products.filter(product => {
    const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(product.category);
    const tagMatch = selectedTags.length === 0 || selectedTags.includes(product.tag);
    return categoryMatch && tagMatch;
  });

  const addToCart = (productId: string, size: string = 'L') => {
    const product = products.find(p => p.id === productId);
    setIsCartBumping(true);
    setTimeout(() => setIsCartBumping(false), 300);

    if (product) {
      showToast(`${product.name.toUpperCase()} DEPLOYED TO BAG`);
      
      // Temporary button feedback for Quick Add buttons
      const btn = document.querySelector(`[data-product-id="${productId}"]`) as HTMLButtonElement;
      if (btn) {
        const originalText = btn.textContent;
        btn.textContent = 'DONE // STRIKE';
        btn.style.backgroundColor = '#ccff00';
        btn.style.color = 'black';
        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.backgroundColor = '';
          btn.style.color = '';
        }, 1500);
      }
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === productId && item.size === size);
      if (existing) {
        return prev.map(item => (item.id === productId && item.size === size) ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { id: productId, quantity: 1, size }];
    });
    
    // Simple feedback logic: maybe just open cart or show toast
    // Not auto-opening to avoid interruption
  };

  const removeFromCart = (productId: string, size: string) => {
    setCart(prev => prev.filter(item => !(item.id === productId && item.size === size)));
  };

  const updateQuantity = (productId: string, size: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId && item.size === size) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((acc, item) => {
    const product = products.find(p => p.id === item.id);
    return acc + (product?.price || 0) * item.quantity;
  }, 0);

  return (
    <div className="min-h-screen bg-[#050505] font-sans selection:bg-[#ccff00] selection:text-black relative overflow-x-hidden">
      <AnimatePresence>
        {!isLoaded && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ 
              opacity: 0,
              y: -100,
              transition: { duration: 1, ease: [0.76, 0, 0.24, 1] }
            }}
            className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
              animate={{ 
                scale: 1, 
                opacity: 1, 
                rotate: 0,
                transition: { duration: 1.2, ease: "easeOut" }
              }}
              className="relative"
            >
              <ScorpionLogo className="w-64 h-64 text-[#ccff00]" />
              <motion.div 
                animate={{ 
                  scale: [1, 1.4, 1],
                  opacity: [0.2, 0.5, 0.2]
                }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="absolute inset-0 bg-[#ccff00]/30 blur-[100px] -z-10 rounded-full" 
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="mt-12 text-center"
            >
              <h2 className="text-5xl font-black tracking-[0.8em] uppercase text-white mb-4">
                AGRAB
              </h2>
              <div className="w-64 h-[2px] bg-white/10 mx-auto relative overflow-hidden">
                <motion.div 
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-[#ccff00]" 
                />
              </div>
              <p className="mt-6 text-[#ccff00] font-mono text-[10px] tracking-[0.5em] uppercase opacity-50">
                Biological Strike Imminent
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Sophisticated Dark Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border-[1px] border-white rounded-full opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border-[1px] border-white rounded-full opacity-10" />
      </div>

      {/* Side Profile Indicator */}
      <div className="fixed left-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-8 items-center z-40">
        <div className="rotate-90 text-[10px] font-bold uppercase tracking-[.5em] opacity-30 origin-center whitespace-nowrap">GEN-Z CURATED CLOTHS</div>
        <div className="w-[1px] h-32 bg-white/10" />
        <div className="flex flex-col gap-4">
          <div className="w-2 h-2 rounded-full bg-white/20" />
          <div className="w-2 h-2 rounded-full bg-[#ccff00]" />
          <div className="w-2 h-2 rounded-full bg-white/20" />
        </div>
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#050505]/90 backdrop-blur-md border-b border-white/5 py-4' : 'bg-transparent py-8'}`}>
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center gap-12">
            {/* Database Connection Status for Admin */}
            {isAdminLoggedIn && (
              <div className="flex items-center gap-2 px-3 py-1 bg-black/50 border border-white/10 rounded-full">
                <div className={`w-1.5 h-1.5 rounded-full ${isDbConnected ? 'bg-[#ccff00] animate-pulse' : 'bg-red-500'}`} />
                <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-400">
                  {isDbConnected ? `Terminal Online (${products.length} Units)` : 'Terminal Offline'}
                </span>
              </div>
            )}
            
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="lg:hidden p-2 hover:text-[#ccff00] transition-colors"
              id="menu-btn"
            >
              <Menu />
            </button>
            <div className="hidden lg:flex items-center gap-10 font-bold text-[10px] tracking-[0.3em] uppercase opacity-70">
              <a href="#" className="hover:text-[#ccff00] transition-colors">Collections</a>
              <a href="#" className="hover:text-[#ccff00] transition-colors">The Lab</a>
              <a href="#" className="hover:text-[#ccff00] transition-colors">Archive</a>
            </div>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 cursor-pointer group" onClick={() => setIsAdminOpen(true)}>
            <ScorpionLogo className="w-8 h-8 text-[#ccff00] transition-transform group-hover:scale-110" />
            <h1 className="text-2xl font-black tracking-tighter uppercase group-hover:text-[#ccff00] transition-colors">
              AGRAB
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <button className="hidden sm:block p-3 bg-white/5 rounded-full hover:bg-[#ccff00] hover:text-black transition-all">
              <Search className="w-4 h-4" />
            </button>
            <div className="relative">
              <motion.button 
                onClick={() => setIsCartOpen(true)}
                animate={isCartBumping ? { scale: [1, 1.2, 1] } : {}}
                className={`px-5 py-2.5 bg-[#ccff00] text-black text-[10px] font-black uppercase tracking-tighter flex items-center gap-2 hover:bg-white transition-colors ${isCartBumping ? 'shadow-[0_0_20px_#ccff00]' : ''}`}
                id="cart-btn"
              >
                CART ({cart.reduce((a, b) => a + b.quantity, 0)})
              </motion.button>
              <AnimatePresence>
                {isCartBumping && (
                  <motion.span
                    initial={{ opacity: 0, y: 0 }}
                    animate={{ opacity: 1, y: -40 }}
                    exit={{ opacity: 0 }}
                    className="absolute -top-2 -right-2 bg-white text-black rounded-full w-8 h-8 flex items-center justify-center text-[10px] font-black shadow-lg z-[60]"
                  >
                    +1
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

      {/* Toast System */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className="bg-[#ccff00] text-black px-6 py-4 font-black text-xs uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(204,255,0,0.3)] flex items-center gap-3 border border-black/10"
            >
              <div className="w-2 h-2 bg-black rounded-full animate-pulse" />
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Hero Section */}
      <header className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black z-10" />
          <img 
            src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80&w=2000" 
            className="w-full h-full object-cover grayscale opacity-50 contrast-125 transition-transform duration-[10s] hover:scale-110"
            alt="Streetwear model"
            referrerPolicy="no-referrer"
          />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.33, 1, 0.68, 1] }}
          className="relative z-20 text-center px-4 flex flex-col items-center"
        >
          <div className="relative mb-8 group">
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.1, 0.2, 0.1]
              }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="absolute inset-0 bg-[#ccff00]/40 blur-[100px] rounded-full" 
            />
            <ScorpionLogo className="w-48 h-48 lg:w-64 lg:h-64 text-[#ccff00] relative z-10 filter drop-shadow-[0_0_30px_rgba(204,255,0,0.5)] transition-transform duration-700 group-hover:scale-110" />
          </div>

          <div className="inline-block px-3 py-1 bg-white text-black font-black text-xs uppercase mb-6 tracking-widest">
            Drop 001 // Venom Series
          </div>
          <h2 className="text-[15vw] lg:text-[140px] font-black leading-[0.85] tracking-tighter uppercase mb-8">
            POISON <br /> <span className="text-outline">STRIKE</span>
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-8">
            <button 
              className="group relative px-12 py-5 bg-white text-black font-black uppercase tracking-widest text-sm transition-all hover:bg-[#ccff00]"
              id="hero-cta"
            >
              Shop New Season
            </button>
            <div className="flex flex-col text-left">
              <span className="text-[10px] opacity-50 uppercase font-black tracking-widest">Release Date</span>
              <span className="text-lg font-mono tracking-tighter">24 . 12 . 2024</span>
            </div>
          </div>
        </motion.div>

        {/* Marquee */}
        <div className="absolute bottom-0 left-0 w-full bg-white text-black py-4 overflow-hidden whitespace-nowrap z-30">
          <div className="flex animate-marquee">
            {[...Array(6)].map((_, i) => (
              <span key={i} className="text-sm font-black uppercase tracking-widest px-8 flex items-center gap-4">
                AGRAB / عـقـرب <div className="w-2 h-2 bg-black rounded-full" />
                NEW DROP ONLINE <div className="w-2 h-2 bg-[#ccff00] rounded-full border border-black" />
                STRIKE THE STREETS <div className="w-2 h-2 bg-black rounded-full" />
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* Anatomy / Blueprint Section */}
      <section className="py-24 px-6 bg-zinc-950 border-y border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] border border-white rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div className="order-2 lg:order-1 flex justify-center">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                viewport={{ once: true }}
                className="relative flex items-center justify-center py-12 lg:py-0"
              >
                <motion.div 
                  animate={{ 
                    scale: [1, 1.15, 1],
                    opacity: [0.1, 0.3, 0.1]
                  }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="absolute inset-0 bg-[#ccff00]/20 blur-[120px] rounded-full" 
                />
                <ScorpionLogo className="w-full max-w-[480px] aspect-square text-[#ccff00] relative z-10 filter drop-shadow-[0_0_30px_rgba(204,255,0,0.4)]" />
              </motion.div>
            </div>
            
            <div className="order-1 lg:order-2">
              <span className="text-[#ccff00] font-mono text-[10px] tracking-[0.6em] mb-6 block opacity-50 uppercase">Origin: Saharan Depths // AGRV-099</span>
              <h3 className="text-6xl lg:text-9xl font-black uppercase tracking-tighter mb-10 leading-[0.8] drop-shadow-2xl">
                BORN IN <br /> <span className="text-[#ccff00] italic">SILENCE.</span>
              </h3>
              
              <div className="space-y-8 mb-16">
                <p className="text-white/90 text-xl lg:text-3xl font-bold leading-[1.1] max-w-xl tracking-tight">
                  AGRAB is the pulse of the underground. 
                  <span className="block mt-4 text-zinc-500 text-lg font-medium leading-relaxed">
                    We craft armor for the modern predator. Each piece is a fusion of biological efficiency and urban edge, designed for those who move with silent authority.
                  </span>
                </p>
                
                <div className="py-8 border-y border-white/10 space-y-3">
                  <motion.p whileHover={{ x: 15, color: "#ccff00" }} className="text-2xl lg:text-4xl font-black italic tracking-tighter cursor-default transition-all duration-300">SCORPIO AIN'T EASY TO READ</motion.p>
                  <motion.p whileHover={{ x: 15, color: "#ccff00" }} className="text-2xl lg:text-4xl font-black italic tracking-tighter cursor-default transition-all duration-300">SILENT MIND, LETHAL DEEDS</motion.p>
                  <motion.p whileHover={{ x: 15, color: "#ccff00" }} className="text-2xl lg:text-4xl font-black italic tracking-tighter cursor-default transition-all duration-300">ALL OR NOTHING TILL THE END</motion.p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-12">
                <div>
                  <h4 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-3 text-[#ccff00]">Biological Architecture</h4>
                  <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Engineered for extreme urban environments and high-velocity movement.</p>
                </div>
                <div>
                  <h4 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-3 text-[#ccff00]">Exoskeleton Tech</h4>
                  <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Reinforced double-stitching inspired by the resilience of the chitinous shell.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <span className="text-[#ccff00] text-xs font-bold tracking-[0.3em] uppercase mb-2 block">Our Arsenal</span>
            <h3 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter">SELECT <br /> DRIP</h3>
          </div>
          
          <div className="flex flex-col gap-4 min-w-[300px]">
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest border transition-all ${
                    selectedCategories.includes(cat) 
                    ? 'bg-[#ccff00] text-black border-[#ccff00]' 
                    : 'bg-transparent text-white border-white/20 hover:border-[#ccff00]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest border transition-all ${
                    selectedTags.includes(tag) 
                    ? 'bg-white text-black border-white' 
                    : 'bg-transparent text-white/50 border-white/10 hover:border-white'
                  }`}
                >
                  #{tag}
                </button>
              ))}
              {(selectedCategories.length > 0 || selectedTags.length > 0) && (
                <button 
                  onClick={() => { setSelectedCategories([]); setSelectedTags([]); }}
                  className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#ccff00] hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>

        {productsLoading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-6">
            <div className="w-16 h-16 border-t-2 border-[#ccff00] rounded-full animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Scanning Arsenal Databanks...</span>
          </div>
        ) : (
          <>
            {filteredProducts.length === 0 ? (
              <div className="py-24 text-center border border-dashed border-white/10">
                <ScorpionLogo className="w-16 h-16 mx-auto mb-6 text-zinc-800" />
                <p className="font-black uppercase tracking-widest text-zinc-500">No venom found in this sector.</p>
                <button 
                  onClick={() => { setSelectedCategories([]); setSelectedTags([]); }}
                  className="mt-4 text-[#ccff00] text-xs font-bold uppercase tracking-widest hover:underline"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <motion.div 
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-100px" }}
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.1
                    }
                  }
                }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
              >
            {filteredProducts.map((product, idx) => (
              <motion.div 
                key={product.id}
                layout
                variants={{
                  hidden: { y: 20, opacity: 0 },
                  show: { y: 0, opacity: 1 }
                }}
                className="group cursor-pointer"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-zinc-900 mb-6 cursor-zoom-in">
                  <div className="absolute top-4 left-4 z-10">
                    <span className="px-2 py-1 bg-[#ccff00] text-black text-[10px] font-black uppercase tracking-widest">
                      {product.tag}
                    </span>
                  </div>
                  <motion.img 
                    src={product.image} 
                    alt={product.name}
                    whileHover={{ scale: 1.05, filter: 'grayscale(0%)' }}
                    initial={{ filter: 'grayscale(100%)' }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    onClick={() => {
                      setSelectedProduct(product);
                      setSelectedSize('L');
                    }}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <button 
                    onClick={(e) => { e.stopPropagation(); addToCart(product.id, 'L'); }}
                    data-product-id={product.id}
                    className="absolute bottom-0 left-0 right-0 bg-white text-black py-4 font-black uppercase text-xs translate-y-full group-hover:translate-y-0 transition-all duration-300"
                  >
                    Quick Add — EGP {product.price}
                  </button>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] text-[#ccff00] font-bold uppercase tracking-[0.2em] mb-1">{product.category}</p>
                    <h4 className="font-bold uppercase tracking-tight text-lg group-hover:text-[#ccff00] transition-colors">{product.name}</h4>
                  </div>
                  <span className="font-mono text-sm tracking-tighter opacity-80">EGP {product.price}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </>
    )}
  </section>

      {/* About Section - Brutalist Style */}
      <section className="bg-[#ccff00] text-black py-24 px-6 overflow-hidden relative">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center"
        >
          <div>
            <h3 className="text-6xl lg:text-9xl font-black leading-none tracking-tighter uppercase mb-12">
              BORN IN <br /> THE <br /> WEB.
            </h3>
            <p className="text-xl lg:text-2xl font-bold uppercase tracking-tight mb-8">
              Agrab is more than a brand. It's a statement for those who move in the shadows and strike with precision.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="border-2 border-black p-4 flex flex-col gap-2 min-w-[120px]">
                <span className="text-xs font-black uppercase">Established</span>
                <span className="text-3xl font-black">2024</span>
              </div>
              <div className="border-2 border-black p-4 flex flex-col gap-2 min-w-[120px]">
                <span className="text-xs font-black uppercase">City</span>
                <span className="text-3xl font-black">CAIRO</span>
              </div>
              <div className="border-2 border-black p-4 flex flex-col gap-2 min-w-[120px]">
                <span className="text-xs font-black uppercase">Vibe</span>
                <span className="text-3xl font-black">STRIKE</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#ccff00] rounded-full blur-3xl opacity-20" />
            <img 
              src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=1000" 
              className="relative z-10 w-full aspect-square object-cover border-8 border-black shadow-[20px_20px_0px_0px_rgba(204,255,0,1)]"
              alt="Brand vibes"
              referrerPolicy="no-referrer"
            />
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-[#050505] text-white pt-24 pb-12 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-24">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <ScorpionLogo className="w-8 h-8 text-[#ccff00]" />
                <h2 className="text-2xl font-black tracking-tighter uppercase">AGRAB</h2>
              </div>
              <p className="max-w-xs text-gray-500 mb-8 font-body text-sm leading-relaxed">
                Refining Gen-Z streetwear through biological precision. Born in the shadows, raised in Cairo.
              </p>
              <div className="flex gap-4">
                <a 
                  href="https://instagram.com/agrab.colony" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="group relative p-3 bg-white/5 border border-white/10 hover:border-[#ccff00] hover:text-[#ccff00] transition-all overflow-hidden"
                >
                  <Instagram className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform" />
                  <div className="absolute inset-0 bg-[#ccff00]/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </a>
                <a 
                  href="https://twitter.com/agrab_colony" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="group relative p-3 bg-white/5 border border-white/10 hover:border-[#ccff00] hover:text-[#ccff00] transition-all overflow-hidden"
                >
                  <Twitter className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform" />
                  <div className="absolute inset-0 bg-[#ccff00]/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-bold uppercase tracking-[0.3em] text-[10px] mb-8 opacity-50">Navigation</h4>
              <ul className="flex flex-col gap-4 text-gray-400 font-bold uppercase text-xs tracking-widest">
                <li><a href="#" className="hover:text-[#ccff00] transition-colors">Collections</a></li>
                <li><a href="#" className="hover:text-[#ccff00] transition-colors">The Lab</a></li>
                <li><a href="#" className="hover:text-[#ccff00] transition-colors">Archive</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold uppercase tracking-[0.3em] text-[10px] mb-8 opacity-50">Specs</h4>
              <ul className="flex flex-col gap-4 text-gray-400 font-mono text-xs">
                <li>Fabric: Heavyweight Cotton</li>
                <li>Fit: Oversized / Boxy</li>
                <li>Style Code: AG-99-BLX</li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-12 border-t border-white/5">
            <p className="text-[10px] text-gray-600 font-bold tracking-[0.3em] uppercase">© 2024 AGRAB. BIOLOGICAL AGENTS ONLY. SITE BY V.01</p>
            <div className="flex gap-8 uppercase text-[10px] font-mono text-gray-600">
              <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#ccff00] animate-pulse" /> CAIRO_SEC_30</span>
              <span className="opacity-50">30.0444° N, 31.2357° E</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '-100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-black p-8 flex flex-col"
          >
            <div className="flex justify-between items-center mb-24">
              <ScorpionLogo className="w-8 h-8 text-[#ccff00]" />
              <button onClick={() => setIsMenuOpen(false)} className="p-2"><X className="w-8 h-8" /></button>
            </div>
            <div className="flex flex-col gap-8">
              {['Shop', 'Drops', 'Archive', 'Culture', 'Web'].map((item) => (
                <a 
                  key={item} 
                  href="#" 
                  className="text-6xl font-black uppercase tracking-tighter hover:text-[#ccff00] transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-zinc-950 z-[110] border-l border-zinc-800 flex flex-col"
            >
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <ShoppingCart className="w-5 h-5 text-[#ccff00]" />
                  <h3 className="font-black uppercase tracking-widest pt-1">Your Colonybag</h3>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-zinc-900 rounded-full transition-colors">
                  <X />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center gap-6 text-center">
                    <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center">
                      <ScorpionLogo className="w-12 h-12 text-zinc-700" />
                    </div>
                    <div>
                      <p className="font-black uppercase tracking-widest text-zinc-500 mb-2">No poison inside yet.</p>
                      <button 
                        onClick={() => setIsCartOpen(false)}
                        className="text-[#ccff00] text-xs font-bold uppercase tracking-widest underline decoration-2 underline-offset-4"
                      >
                        Start Shopping
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-8">
                    {cart.map(item => {
                      const product = products.find(p => p.id === item.id)!;
                      return (
                        <div key={item.id} className="flex gap-4 group">
                          <div className="w-24 aspect-[3/4] bg-zinc-900 overflow-hidden">
                            <img src={product.image} className="w-full h-full object-cover" alt={product.name} referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex-1 flex flex-col justify-between py-1">
                            <div>
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="font-bold uppercase text-sm tracking-tight">{product.name}</h4>
                                <button onClick={() => removeFromCart(item.id, item.size)} className="text-zinc-600 hover:text-red-500 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-4">
                                <span>{product.category}</span>
                                <span className="text-[#ccff00]">SIZE: {item.size}</span>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <button onClick={() => updateQuantity(item.id, item.size, -1)} className="p-1 border border-zinc-800 hover:bg-zinc-800 transition-colors">
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-sm font-black w-4 text-center">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id, item.size, 1)} className="p-1 border border-zinc-800 hover:bg-zinc-800 transition-colors">
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <p className="font-black text-sm">EGP {product.price * item.quantity}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-zinc-800 bg-zinc-950">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-zinc-500 font-bold uppercase text-xs tracking-widest">Subtotal</span>
                    <span className="text-2xl font-black">EGP {cartTotal}</span>
                  </div>
                  <button 
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                    className="w-full bg-[#ccff00] text-black py-4 font-black uppercase tracking-widest text-sm hover:bg-white transition-colors"
                  >
                    Checkout Colony
                  </button>
                  <p className="text-[10px] text-center text-zinc-600 mt-4 font-bold uppercase tracking-widest">
                    Shipping included within Cairo. Returns accepted in 14 days.
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center overflow-y-auto"
          >
            <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 sm:gap-10 p-4 sm:p-10 lg:p-12 relative my-auto">
              {/* Close Button */}
              <button 
                onClick={() => setSelectedProduct(null)}
                className="fixed sm:absolute top-4 right-4 sm:top-8 sm:right-8 z-[210] p-3 sm:p-4 bg-[#ccff00] text-black rounded-full hover:bg-white hover:scale-110 transition-all shadow-[0_0_20px_rgba(204,255,0,0.3)]"
              >
                <X className="w-5 h-5 sm:w-6 h-6" />
              </button>

              {/* Image Group */}
              <div className="w-full lg:w-[55%] flex flex-col gap-4">
                <div className="relative aspect-square sm:aspect-[4/5] lg:aspect-[3/4] bg-zinc-900/50 overflow-hidden cursor-zoom-in group max-h-[60vh] lg:max-h-[80vh]">
                  <AnimatePresence mode="wait">
                    <motion.img 
                      key={selectedProduct.images[activeImageIdx]}
                      src={selectedProduct.images[activeImageIdx]}
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                      transition={{ duration: 0.4 }}
                      className="w-full h-full object-contain sm:object-cover"
                      alt={selectedProduct.name}
                    />
                  </AnimatePresence>
                </div>
                {/* Thumbnails */}
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {selectedProduct.images.map((img, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveImageIdx(idx)}
                      className={`w-24 aspect-square flex-shrink-0 border-2 transition-all ${activeImageIdx === idx ? 'border-[#ccff00]' : 'border-transparent opacity-50 hover:opacity-100'}`}
                    >
                      <img src={img} className="w-full h-full object-cover" alt={`Angle ${idx}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Details Side */}
              <div className="w-full lg:w-2/5 flex flex-col justify-center">
                <div className="mb-12">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="px-3 py-1 bg-[#ccff00] text-black text-[10px] font-black uppercase tracking-widest">
                      {selectedProduct.tag}
                    </span>
                    <span className="text-zinc-500 font-mono text-[10px] uppercase">{selectedProduct.category}</span>
                  </div>
                  <h2 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter mb-4 leading-none">
                    {selectedProduct.name}
                  </h2>
                  <p className="font-mono text-2xl text-[#ccff00]">EGP {selectedProduct.price}</p>
                </div>

                <div className="mb-12">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-black uppercase tracking-widest text-xs">Select Biological Size</h4>
                    <button 
                      onClick={() => setIsSizeGuideOpen(true)}
                      className="text-[10px] uppercase font-bold text-[#ccff00] underline underline-offset-4 hover:text-white transition-colors"
                    >
                      Biological Size Guide
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {SIZES.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`py-4 font-black transition-all border ${
                          selectedSize === size 
                          ? 'bg-[#ccff00] text-black border-[#ccff00]' 
                          : 'bg-transparent text-white border-zinc-800 hover:border-[#ccff00]'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => {
                    addToCart(selectedProduct.id, selectedSize);
                    // We don't close immediately to let the user see the feedback
                    setTimeout(() => setSelectedProduct(null), 1200);
                  }}
                  data-product-id={selectedProduct.id}
                  className="w-full bg-[#ccff00] text-black py-6 font-black uppercase tracking-widest text-sm hover:bg-white transition-all flex items-center justify-center gap-4 group"
                >
                  Deploy to Bag
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </button>
                    
                    {/* Collapsible Info Section */}
                    <div className="mt-8 space-y-6 border-t border-white/10 pt-8">
                      <div>
                        <h4 className="text-[#ccff00] text-[10px] font-black uppercase tracking-[0.2em] mb-3">BIOLOGICAL ARCHITECTURE</h4>
                        <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                          {selectedProduct.description}
                        </p>
                        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                          <div className="p-3 bg-white/5 border border-white/10">
                            <span className="opacity-50 block mb-1 text-[8px]">MATERIAL:</span>
                            {selectedProduct.specs.material}
                          </div>
                          <div className="p-3 bg-white/5 border border-white/10">
                            <span className="opacity-50 block mb-1 text-[8px]">FIT:</span>
                            {selectedProduct.specs.fit}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-[#ccff00] text-[10px] font-black uppercase tracking-[0.2em] mb-2">MAINTENANCE (CARE)</h4>
                        <p className="text-zinc-500 text-[10px] uppercase leading-relaxed font-bold">
                          {selectedProduct.specs.care} — HANDLE WITH LETHAL PRECISION.
                        </p>
                      </div>
                    </div>
                  </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Size Guide Modal */}
      <AnimatePresence>
        {isSizeGuideOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSizeGuideOpen(false)}
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-[300]"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-[#0a0a0a] border border-white/10 p-8 z-[310] max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-12">
                <div className="flex items-center gap-4">
                  <ScorpionLogo className="w-8 h-8 text-[#ccff00]" />
                  <h3 className="text-3xl font-black uppercase tracking-tighter">BIOLOGICAL SIZE GUIDE</h3>
                </div>
                <button onClick={() => setIsSizeGuideOpen(false)} className="p-2 hover:text-[#ccff00] transition-colors">
                  <X className="w-8 h-8" />
                </button>
              </div>

              <div className="grid gap-8">
                <div className="bg-zinc-900/50 p-6 border border-white/5">
                  <h4 className="text-[#ccff00] font-black uppercase tracking-[0.2em] text-xs mb-4">FIT SPECIFICATIONS</h4>
                  <p className="text-gray-400 font-body text-sm leading-relaxed">
                    Agrab items are engineered with a **BOX OVERSIZE** fit. We recommend ordering your true size for the intended silhouette, or sizing down once for a more standard fit.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs uppercase tracking-widest border-collapse">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="py-4 px-2 opacity-50">Size</th>
                        <th className="py-4 px-2 opacity-50">Chest (CM)</th>
                        <th className="py-4 px-2 opacity-50">Length (CM)</th>
                        <th className="py-4 px-2 opacity-50">Shoulder (CM)</th>
                      </tr>
                    </thead>
                    <tbody className="text-white">
                      <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-4 px-2 font-black">S</td>
                        <td className="py-4 px-2">120</td>
                        <td className="py-4 px-2">68</td>
                        <td className="py-4 px-2">56</td>
                      </tr>
                      <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-4 px-2 font-black">M</td>
                        <td className="py-4 px-2">126</td>
                        <td className="py-4 px-2">71</td>
                        <td className="py-4 px-2">58</td>
                      </tr>
                      <tr className="border-b border-[#ccff00]/20 bg-[#ccff00]/5">
                        <td className="py-4 px-2 font-black text-[#ccff00]">L</td>
                        <td className="py-4 px-2">132</td>
                        <td className="py-4 px-2">74</td>
                        <td className="py-4 px-2">61</td>
                      </tr>
                      <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-4 px-2 font-black">XL</td>
                        <td className="py-4 px-2">138</td>
                        <td className="py-4 px-2">77</td>
                        <td className="py-4 px-2">64</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex items-start gap-4 p-6 bg-white/5">
                  <div className="p-2 bg-[#ccff00] text-black">
                    <ScorpionLogo className="w-4 h-4" />
                  </div>
                  <p className="text-[10px] text-gray-500 font-bold leading-relaxed">
                    NOTE: MEASUREMENTS ARE APPROXIMATE AND MAY VARY BY 1-2CM DUE TO THE BIOLOGICAL NATURE OF HEAVYWEIGHT COTTON. ALL PIECES ARE PRE-SHRUNK.
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Admin Login Modal */}
      <AnimatePresence>
        {isAdminOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[600] bg-black flex items-center justify-center p-4 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-sm bg-zinc-950 border border-white/5 p-8 relative"
            >
              <button 
                onClick={() => { setIsAdminOpen(false); setLoginError(false); }}
                className="absolute top-6 right-6 text-zinc-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-10">
                <ScorpionLogo className="w-12 h-12 text-[#ccff00] mx-auto mb-4" />
                <h3 className="text-2xl font-black uppercase tracking-widest text-[#ccff00]">ADMIN PROTOCOL</h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[.3em] mt-2">Authorization Required</p>
              </div>

              {!isAdminLoggedIn ? (
                <form className="space-y-6" onSubmit={(e) => {
                  e.preventDefault();
                  const validUsername = import.meta.env.VITE_ADMIN_USERNAME || 'Mo';
                  const validPassword = import.meta.env.VITE_ADMIN_PASSWORD || '12345';
                  if (adminUsername === validUsername && adminPassword === validPassword) {
                    setIsAdminLoggedIn(true);
                    setLoginError(false);
                  } else {
                    setLoginError(true);
                  }
                }}>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Node Identity</label>
                    <input 
                      type="text" 
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      className="w-full bg-zinc-900/50 border border-white/5 p-4 text-sm font-mono focus:border-[#ccff00] outline-none transition-colors" 
                      placeholder="USER" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Access Key</label>
                    <input 
                      type="password" 
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full bg-zinc-900/50 border border-white/5 p-4 text-sm font-mono focus:border-[#ccff00] outline-none transition-colors" 
                      placeholder="****" 
                    />
                  </div>
                  {loginError && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center">Unauthorized Access Attempt</p>}
                  <button className="w-full bg-[#ccff00] text-black py-4 font-black uppercase tracking-[.2em] text-xs hover:bg-white transition-all">
                    INITIATE LOGIN
                  </button>
                </form>
              ) : (
                <div className="text-center space-y-6">
                  <div className="p-6 bg-[#ccff00]/5 border border-[#ccff00]/20">
                    <h4 className="text-[#ccff00] font-black text-xs uppercase tracking-widest mb-2">Authenticated: Mo</h4>
                    <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest leading-loose italic">
                      "Control is an illusion, but precision is real."
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <button 
                      onClick={() => setIsEditingProduct(true)}
                      className="bg-white/5 p-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors flex flex-col items-center gap-2 group"
                    >
                      <Database className="w-5 h-5 text-[#ccff00] group-hover:scale-110 transition-transform" />
                      Stock
                    </button>
                    <button 
                      onClick={() => setIsOrdersModalOpen(true)}
                      className="bg-white/5 p-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors flex flex-col items-center gap-2 group border border-[#ccff00]/20"
                    >
                      <ClipboardList className="w-5 h-5 text-[#ccff00] group-hover:scale-110 transition-transform" />
                      Orders
                    </button>
                    <button 
                      onClick={() => setIsAdminDashboardOpen(true)}
                      className="bg-white/5 p-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors flex flex-col items-center gap-2 group"
                    >
                      <TrendingUp className="w-5 h-5 text-[#ccff00] group-hover:scale-110 transition-transform" />
                      Data
                    </button>
                  </div>
                  
                  <div className="pt-4 border-t border-white/5 mt-6">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-loose italic">
                      Systems optimal. Monitoring active transmissions via COMMAND LOGISTICS.
                    </p>
                  </div>

                  <button 
                    onClick={() => { setIsAdminLoggedIn(false); setAdminUsername(''); setAdminPassword(''); }}
                    className="w-full border border-red-500/20 text-red-500 py-3 font-black uppercase tracking-widest text-[10px] hover:bg-red-500 hover:text-white transition-all"
                  >
                    TERMINATE SESSION
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Analytics Dashboard */}
      <AnimatePresence>
        {isAdminDashboardOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[800] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-4xl bg-zinc-950 border border-white/5 p-8 lg:p-12 relative"
            >
              <button 
                onClick={() => setIsAdminDashboardOpen(false)}
                className="absolute top-8 right-8 text-zinc-500 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex flex-col lg:flex-row gap-12">
                <div className="flex-1">
                  <h3 className="text-4xl font-black uppercase tracking-tighter text-[#ccff00] mb-8">
                    ANALYTICS <br /> INTELLIGENCE
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="p-6 bg-white/5 border border-white/5">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Total Revenue</p>
                      <p className="text-3xl font-black font-mono">EGP {orders.reduce((s,o) => s + (o.total || 0), 0).toLocaleString()}</p>
                    </div>
                    <div className="p-6 bg-white/5 border border-white/5">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Total Orders</p>
                      <p className="text-3xl font-black font-mono">{orders.length}</p>
                    </div>
                  </div>

                  <div className="p-6 bg-white/5 border border-white/5">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6">Order Volume by Status</p>
                    <div className="space-y-4">
                      {['pending', 'processing', 'shipped'].map(status => {
                        const count = orders.filter(o => o.status === status).length;
                        const percentage = orders.length > 0 ? (count / orders.length) * 100 : 0;
                        return (
                          <div key={status} className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                              <span>{status}</span>
                              <span className="text-[#ccff00]">{count}</span>
                            </div>
                            <div className="h-1 bg-white/5 w-full">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                className="h-full bg-[#ccff00]" 
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="w-full lg:w-80 space-y-6">
                  <div className="p-6 bg-[#ccff00]/5 border border-[#ccff00]/20">
                    <h4 className="text-[10px] font-bold text-[#ccff00] uppercase tracking-widest mb-4">Inventory Distribution</h4>
                    <div className="space-y-3">
                      {categories.map(cat => (
                        <div key={cat} className="flex justify-between items-center text-[10px] font-black uppercase">
                          <span className="text-zinc-400">{cat}</span>
                          <span className="font-mono">{products.filter(p => p.category === cat).length} Units</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 leading-relaxed italic">
                    "Data is the venom of progress. Monitor the spread."
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customer Orders Focused Modal */}
      <AnimatePresence>
        {isOrdersModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[800] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-2xl bg-zinc-950 border border-white/5 p-8 relative flex flex-col max-h-[90vh]"
            >
              <button 
                onClick={() => setIsOrdersModalOpen(false)}
                className="absolute top-8 right-8 text-zinc-500 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="mb-8">
                <h3 className="text-3xl font-black uppercase tracking-tighter text-[#ccff00]">
                  COMMAND <br /> LOGISTICS
                </h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-2 italic">
                  Monitoring transmission history and target delivery status.
                </p>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {orders.length === 0 ? (
                  <div className="py-20 text-center">
                    <History className="w-12 h-12 text-white/10 mx-auto mb-4" />
                    <p className="text-[10px] text-zinc-600 italic uppercase tracking-[0.2em]">Silence in the colony... no active transmissions.</p>
                  </div>
                ) : (
                  orders.map(order => (
                    <div 
                      key={order.id} 
                      onClick={() => setSelectedOrderId(selectedOrderId === order.id ? null : order.id)}
                      className={`p-5 bg-white/5 text-left border-l-2 transition-all cursor-pointer hover:bg-white/10 ${selectedOrderId === order.id ? 'border-[#ccff00] bg-[#ccff00]/5' : 'border-zinc-800'}`}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div className="space-x-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#ccff00]">#{order.id.slice(-8)}</span>
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 ${order.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-[#ccff00]/10 text-[#ccff00]'}`}>
                          {order.status}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-[13px] font-black uppercase tracking-tighter">{order.customerInfo.name}</p>
                          <p className="text-[10px] text-zinc-500 font-mono italic">
                            {order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : '—'}
                          </p>
                        </div>
                        <p className="text-sm font-black font-mono text-white">EGP {order.total.toLocaleString()}</p>
                      </div>
                      
                      <AnimatePresence>
                        {selectedOrderId === order.id && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mt-6 pt-6 border-t border-white/5 space-y-6"
                          >
                            <div className="grid grid-cols-2 gap-8">
                              <div className="space-y-2">
                                <p className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest">Contact Signal</p>
                                <p className="text-[12px] font-mono text-white border-b border-white/5 pb-1 w-fit">{order.customerInfo.phone}</p>
                              </div>
                              <div className="space-y-2">
                                <p className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest">Target Location</p>
                                <p className="text-[12px] uppercase leading-relaxed italic text-white/80">{order.customerInfo.address}</p>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <p className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest">Payload Data</p>
                              <div className="bg-black/60 border border-white/5 p-4 space-y-2">
                                {order.items.map((item: any, idx: number) => (
                                  <div key={idx} className="flex justify-between items-center text-[11px] uppercase">
                                    <div className="flex items-center gap-4">
                                      <span className="text-[#ccff00] font-black font-mono">{item.quantity}x</span>
                                      <span className="font-bold">{item.name}</span>
                                      <span className="text-zinc-600 text-[8px] font-mono border border-zinc-800 px-1">{item.size}</span>
                                    </div>
                                    <span className="text-white/60 font-mono">EGP {item.price * item.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                              {order.status !== 'shipped' && (
                                <button 
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    await updateDoc(doc(db, 'orders', order.id), { status: 'shipped' });
                                  }}
                                  className="flex-1 bg-[#ccff00] text-black py-3 text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_20px_rgba(204,255,0,0.2)]"
                                >
                                  Deploy Shipping
                                </button>
                              )}
                              <button 
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if(confirm('Purge transmission record from colony history?')) await deleteDoc(doc(db, 'orders', order.id));
                                }}
                                className="px-5 border border-red-500/20 text-red-500/50 py-3 text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Product Management Modal */}
      <AnimatePresence>
        {isEditingProduct && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[700] bg-black p-4 lg:p-12 overflow-y-auto"
          >
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-between items-center mb-12">
                <div className="flex items-center gap-6">
                  <Package className="w-10 h-10 text-[#ccff00]" />
                  <h2 className="text-4xl lg:text-6xl font-black uppercase tracking-tighter">CENTRAL <br /> ARSENAL</h2>
                </div>
                <button 
                  onClick={() => { setIsEditingProduct(false); setEditingProductData(null); setTempImages([]); }}
                  className="p-4 bg-white/5 rounded-full hover:bg-red-500 transition-all group"
                >
                  <X className="w-8 h-8 group-hover:scale-110 transition-transform" />
                </button>
              </div>

              <div className="grid lg:grid-cols-3 gap-12">
                {/* Product Form */}
                <div className="lg:col-span-1 space-y-8 h-fit lg:sticky lg:top-12">
                  <div className="p-8 bg-zinc-950 border border-white/5 space-y-6">
                    <h3 className="text-xl font-black uppercase tracking-widest text-[#ccff00] mb-4">
                      {editingProductData ? 'Modify Payload' : 'New Transmission'}
                    </h3>
                    
                        <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center justify-between">
                            <span className="flex items-center gap-2"><ImageIcon className="w-3 h-3" /> Image Payload Network</span>
                            <span className="text-[8px] opacity-50">{tempImages.length}/5 IMAGES</span>
                          </label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              id="product-image-input"
                              placeholder="Direct Image URL"
                              className="flex-1 bg-zinc-900 border border-white/5 p-3 text-xs outline-none focus:border-[#ccff00]"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const input = e.currentTarget;
                                  if (input.value && tempImages.length < 5) {
                                    setTempImages([...tempImages, input.value]);
                                    input.value = '';
                                  }
                                }
                              }}
                            />
                            <button 
                              type="button"
                              onClick={() => {
                                const input = document.getElementById('product-image-input') as HTMLInputElement;
                                if (input.value && tempImages.length < 5) {
                                  setTempImages([...tempImages, input.value]);
                                  input.value = '';
                                }
                              }}
                              className="px-4 py-2 bg-[#ccff00] text-black font-black text-[10px] uppercase tracking-widest hover:bg-white transition-colors"
                            >
                              Add
                            </button>
                            <button 
                              type="button"
                              onClick={() => imageInputRef.current?.click()}
                              className="p-3 bg-zinc-900 border border-white/5 hover:border-[#ccff00] text-zinc-500 hover:text-[#ccff00]"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <input 
                              type="file" 
                              ref={imageInputRef} 
                              className="hidden" 
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file && tempImages.length < 5) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setTempImages([...tempImages, reader.result as string]);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </div>

                          {/* Image Preview List */}
                          <div className="flex flex-wrap gap-2 mt-4">
                            {tempImages.map((img, i) => (
                              <div key={i} className="relative w-16 aspect-square group border border-white/10 overflow-hidden">
                                <img src={img} className="w-full h-full object-cover" alt="" />
                                <button 
                                  onClick={() => setTempImages(tempImages.filter((_, idx) => idx !== i))}
                                  className="absolute inset-0 bg-red-500/80 items-center justify-center hidden group-hover:flex transition-all"
                                >
                                  <X className="w-4 h-4 text-white" />
                                </button>
                              </div>
                            ))}
                            {tempImages.length === 0 && (
                              <div className="w-full py-4 border border-dashed border-white/5 bg-white/[0.02] flex flex-col items-center justify-center">
                                <ImageIcon className="w-4 h-4 text-zinc-700 mb-1" />
                                <span className="text-[8px] text-zinc-600 font-bold uppercase">No images staged</span>
                              </div>
                            )}
                          </div>
                        </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Callsign (Name)</label>
                        <input 
                          type="text" 
                          id="product-name"
                          className="w-full bg-zinc-900 border border-white/5 p-3 text-xs outline-none focus:border-[#ccff00]" 
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                            <DollarSign className="w-3 h-3" /> Value (EGP)
                          </label>
                          <input 
                            type="number" 
                            id="product-price"
                            className="w-full bg-zinc-900 border border-white/5 p-3 text-xs outline-none focus:border-[#ccff00]" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                            <TagIcon className="w-3 h-3" /> Tag
                          </label>
                          <select id="product-tag" className="w-full bg-zinc-900 border border-white/5 p-3 text-xs outline-none focus:border-[#ccff00]">
                            <option value="NEW">NEW</option>
                            <option value="LIMITED">LIMITED</option>
                            <option value="RESTOCK">RESTOCK</option>
                            <option value="HOT">HOT</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 uppercase">Sector (Category)</label>
                        <select id="product-category" className="w-full bg-zinc-900 border border-white/5 p-3 text-xs outline-none focus:border-[#ccff00]">
                          <option value="Upperwear">Upperwear</option>
                          <option value="T-Shirts">T-Shirts</option>
                          <option value="Bottoms">Bottoms</option>
                          <option value="Accessories">Accessories</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Biological Specs (Description)</label>
                        <textarea 
                          id="product-desc"
                          rows={3}
                          className="w-full bg-zinc-900 border border-white/5 p-3 text-xs outline-none focus:border-[#ccff00] resize-none"
                        />
                      </div>
                    </div>

                    <button 
                      onClick={async () => {
                        const name = (document.getElementById('product-name') as HTMLInputElement).value;
                        const price = Number((document.getElementById('product-price') as HTMLInputElement).value);
                        const category = (document.getElementById('product-category') as HTMLSelectElement).value;
                        const tag = (document.getElementById('product-tag') as HTMLSelectElement).value;
                        const description = (document.getElementById('product-desc') as HTMLTextAreaElement).value;

                        try {
                          const submitBtn = document.activeElement as HTMLButtonElement;
                          if (submitBtn) {
                            submitBtn.disabled = true;
                            submitBtn.textContent = 'TRANSMITTING...';
                          }

                          // Capture any pending URL in the input field that wasn't "added"
                          const pendingInput = document.getElementById('product-image-input') as HTMLInputElement;
                          let finalImages = [...tempImages];
                          if (pendingInput && pendingInput.value && finalImages.length < 5) {
                            finalImages.push(pendingInput.value);
                          }

                          if (!name || !price || finalImages.length === 0) {
                            window.alert('CRITICAL: Required fields missing (Name, Price, or Image).');
                            if (submitBtn) {
                              submitBtn.disabled = false;
                              submitBtn.textContent = editingProductData ? 'DEPLOY UPDATE' : 'COMMENCE DEPLOYMENT';
                            }
                            return;
                          }

                          const productData = {
                            name,
                            price,
                            category,
                            tag,
                            image: finalImages[0], 
                            images: finalImages,
                            description,
                            specs: {
                              material: editingProductData?.specs?.material || "Egyptian Cotton Blend",
                              fit: editingProductData?.specs?.fit || "Oversized",
                              care: editingProductData?.specs?.care || "Specialized maintenance"
                            },
                            updatedAt: serverTimestamp(),
                            createdAt: editingProductData?.createdAt || serverTimestamp()
                          };
                          
                          if (editingProductData) {
                            await updateDoc(doc(db, 'products', editingProductData.id), productData);
                          } else {
                            await addDoc(collection(db, 'products'), productData);
                          }
                          
                          // SUCCESS FEEDBACK
                          console.log("Product saved successfully to Firestore.");
                          
                          setIsEditingProduct(false);
                          setEditingProductData(null);
                          setTempImages([]);
                          if (pendingInput) pendingInput.value = '';
                          
                          // Show a brief success alert to the user
                          window.alert('SUCCESS: Mission accomplished. Product is now live across all devices.');

                        } catch (err) {
                          console.error("Save Error:", err);
                          handleFirestoreError(err, OperationType.WRITE, 'products');
                          window.alert('ERROR: Connection failed. Check your network or permissions.');
                        } finally {
                          const submitBtn = document.getElementById('product-submit-btn') as HTMLButtonElement;
                          if (submitBtn) {
                            submitBtn.disabled = false;
                            submitBtn.textContent = editingProductData ? 'DEPLOY UPDATE' : 'COMMENCE DEPLOYMENT';
                          }
                        }
                      }}
                      id="product-submit-btn"
                      className="w-full bg-[#ccff00] text-black py-4 font-black uppercase tracking-widest text-xs hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(204,255,0,0.2)]"
                    >
                      {editingProductData ? 'DEPLOY UPDATE' : 'COMMENCE DEPLOYMENT'}
                    </button>
                    
                    {editingProductData && (
                      <button 
                        onClick={() => { setEditingProductData(null); setTempImages([]); }}
                        className="w-full border border-white/10 text-white/50 py-3 font-black uppercase tracking-widest text-[10px] hover:text-white transition-all"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                  
                  {/* Seed Button for Demo */}
                  {products.length === 0 && (
                    <button 
                      onClick={async () => {
                        const originalProducts = [
                          {
                            name: "CYBER SCORP HOODIE",
                            price: 1550,
                            image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800",
                            images: ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800"],
                            category: "Upperwear",
                            tag: "RESTOCK",
                            description: "Premium heavyweight hoodie featuring our signature 3D embroidered cyber-scorpion.",
                            specs: { material: "100% Egyptian Cotton Fleece", fit: "Boxy / Cropped", care: "Cold wash only." },
                            createdAt: serverTimestamp()
                          },
                          {
                            name: "STINGER CARGO",
                            price: 1800,
                            image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80&w=800",
                            images: ["https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80&w=800"],
                            category: "Bottoms",
                            tag: "LIMITED",
                            description: "Tactical cargo pants with reinforced stitching.",
                            specs: { material: "Ripstop Nylon", fit: "Relaxed", care: "Air dry." },
                            createdAt: serverTimestamp()
                          }
                        ];
                        for(const p of originalProducts) {
                          await addDoc(collection(db, 'products'), p);
                        }
                      }}
                      className="w-full border-2 border-dashed border-[#ccff00]/20 text-[#ccff00]/50 py-4 font-black uppercase tracking-widest text-[10px] hover:border-[#ccff00] hover:text-[#ccff00] transition-all"
                    >
                      Initialize Archive (Seed Data)
                    </button>
                  )}
                </div>

                {/* Product List */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    {products.map(product => (
                      <div key={product.id} className="bg-zinc-950 border border-white/5 p-4 flex gap-6 group">
                        <div className="w-24 aspect-[3/4] bg-zinc-900 border border-white/5 overflow-hidden">
                          <img src={product.image} className="w-full h-full object-cover" alt={product.name} />
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <h4 className="font-black uppercase tracking-tighter text-xl">{product.name}</h4>
                              <span className="text-[10px] bg-white/5 px-2 py-1 uppercase">{product.tag}</span>
                            </div>
                            <p className="text-[#ccff00] font-mono text-sm mt-1">EGP {product.price}</p>
                            <p className="text-[10px] text-zinc-500 uppercase mt-2 tracking-widest">{product.category}</p>
                          </div>
                          
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                setEditingProductData(product);
                                setIsEditingProduct(true);
                                setTempImages(product.images || [product.image]);
                                setTimeout(() => {
                                  (document.getElementById('product-name') as HTMLInputElement).value = product.name;
                                  (document.getElementById('product-price') as HTMLInputElement).value = String(product.price);
                                  (document.getElementById('product-category') as HTMLSelectElement).value = product.category;
                                  (document.getElementById('product-tag') as HTMLSelectElement).value = product.tag;
                                  (document.getElementById('product-desc') as HTMLTextAreaElement).value = product.description;
                                }, 100);
                              }}
                              className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 p-3 text-[10px] font-black uppercase tracking-widest transition-colors"
                            >
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                            <button 
                              onClick={async () => {
                                if(window.confirm('Eradicate this transmission?')) {
                                  await deleteDoc(doc(db, 'products', product.id));
                                }
                              }}
                              className="p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all border border-red-500/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] bg-black flex items-center justify-center p-4"
          >
            <div className="w-full max-w-xl bg-zinc-950 border border-white/5 p-8 lg:p-12 relative overflow-y-auto max-h-[90vh]">
              {!orderConfirmed ? (
                <>
                  <button 
                    onClick={() => setIsCheckoutOpen(false)}
                    className="absolute top-8 right-8 text-zinc-500 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>

                  <h3 className="text-4xl font-black uppercase tracking-tighter mb-8 flex items-center gap-4">
                    FINAL DEPLOYMENT
                    <div className="w-8 h-[1px] bg-[#ccff00]" />
                  </h3>

                  <form className="space-y-6" onSubmit={async (e) => { 
                    e.preventDefault(); 
                    const form = e.target as HTMLFormElement;
                    const inputs = form.querySelectorAll('input, textarea');
                    const customerInfo = {
                      name: (inputs[0] as HTMLInputElement).value + ' ' + (inputs[1] as HTMLInputElement).value,
                      phone: (inputs[2] as HTMLInputElement).value,
                      address: (inputs[3] as HTMLTextAreaElement).value,
                    };

                    try {
                      await addDoc(collection(db, 'orders'), {
                        items: cart.map(item => {
                          const p = products.find(prod => prod.id === item.id);
                          return {
                            id: item.id,
                            name: p?.name || 'Unknown',
                            quantity: item.quantity,
                            size: item.size,
                            price: p?.price || 0
                          };
                        }),
                        total: cartTotal,
                        status: 'pending',
                        customerInfo,
                        createdAt: serverTimestamp()
                      });
                      setOrderConfirmed(true); 
                      setCart([]); 
                    } catch (err) {
                      handleFirestoreError(err, OperationType.WRITE, 'orders');
                    }
                  }}>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">First Name</label>
                        <input required type="text" className="w-full bg-zinc-900 border-none p-4 text-sm font-mono focus:ring-1 focus:ring-[#ccff00]" placeholder="MAZEN" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Last Name</label>
                        <input required type="text" className="w-full bg-zinc-900 border-none p-4 text-sm font-mono focus:ring-1 focus:ring-[#ccff00]" placeholder="SALEM" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Contact Number</label>
                      <input required type="tel" className="w-full bg-zinc-900 border-none p-4 text-sm font-mono focus:ring-1 focus:ring-[#ccff00]" placeholder="+20 1XX XXX XXXX" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Biological Deployment Address</label>
                      <textarea required rows={3} className="w-full bg-zinc-900 border-none p-4 text-sm font-mono focus:ring-1 focus:ring-[#ccff00]" placeholder="Street, Building, Floor, Cairo, EG" />
                    </div>

                    <div className="p-6 bg-[#ccff00]/5 border border-[#ccff00]/20 space-y-4">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                        <span className="text-zinc-500">Product Load</span>
                        <span>EGP {cartTotal}</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                        <span className="text-zinc-500">Logistics (Cairo)</span>
                        <span className="text-[#ccff00]">FREE</span>
                      </div>
                      <div className="h-[1px] bg-white/10" />
                      <div className="flex justify-between text-lg font-black uppercase tracking-tighter">
                        <span>Total Payload</span>
                        <span>EGP {cartTotal}</span>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-[#ccff00] text-black py-6 font-black uppercase tracking-widest text-sm hover:bg-white transition-all flex items-center justify-center gap-4 group"
                    >
                      CONFIRM DEPLOYMENT
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                    </button>
                    
                    <p className="text-[10px] text-zinc-600 text-center font-bold uppercase tracking-widest">
                      BY CLICKING YOU AGREE TO THE AGRAB BIOLOGICAL SERVICE TERMS.
                    </p>
                  </form>
                </>
              ) : (
                <div className="py-12 text-center flex flex-col items-center gap-8">
                  <div className="w-24 h-24 bg-[#ccff00] rounded-full flex items-center justify-center animate-pulse">
                    <Check className="w-12 h-12 text-black stroke-[4]" />
                  </div>
                  <div>
                    <h3 className="text-5xl font-black uppercase tracking-tighter mb-4">STRIKE CONFIRMED</h3>
                    <p className="text-zinc-500 font-mono text-sm leading-relaxed max-w-sm mx-auto uppercase">
                      Your order has been deployed successfully. A scout will contact you shortly for coordination.
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      setIsCheckoutOpen(false);
                      setOrderConfirmed(false);
                    }}
                    className="border-2 border-[#ccff00] text-[#ccff00] px-12 py-4 font-black uppercase tracking-widest text-xs hover:bg-[#ccff00] hover:text-black transition-all"
                  >
                    RETURN TO BASE
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
