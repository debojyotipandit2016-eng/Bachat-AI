import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, Bell, Trash2, ExternalLink, TrendingDown, Clock, Tag, Loader2, IndianRupee } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { searchProducts, ProductResult } from './services/geminiService';

interface TrackedProduct {
  id: number;
  product_name: string;
  target_price: number;
  current_price: number;
  product_url: string;
  platform: string;
  image_url: string;
  created_at: string;
}

export default function App() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ProductResult[]>([]);
  const [tracked, setTracked] = useState<TrackedProduct[]>([]);
  const [activeTab, setActiveTab] = useState<'search' | 'tracked'>('search');
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<string | null>(null);

  useEffect(() => {
    fetchTracked();
    detectLocation();
  }, []);

  const detectLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            // Reverse geocoding to get city name (simplified for demo)
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
            const data = await res.json();
            const city = data.address.city || data.address.town || data.address.village || data.address.state;
            setUserLocation(city);
          } catch (err) {
            console.error('Location detection failed', err);
          }
        },
        (error) => {
          console.warn('Geolocation error:', error.message);
        }
      );
    }
  };

  const fetchTracked = async () => {
    try {
      const res = await fetch('/api/tracked');
      const data = await res.json();
      setTracked(data);
    } catch (err) {
      console.error('Failed to fetch tracked products', err);
    }
  };

  const formatUrl = (url: string) => {
    if (!url) return '#';
    if (url.startsWith('http')) return url;
    return `https://${url}`;
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResults([]);
    setActiveTab('search');

    try {
      const data = await searchProducts(query, userLocation || undefined);
      setResults(data);
    } catch (err) {
      setError('Failed to search products. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const trackProduct = async (product: ProductResult) => {
    const targetPrice = window.prompt(`Set Price Alert for ${product.name}\n\nWe will notify you on your phone when the price drops below your target.\n\nCurrent Price: ₹${product.price}\n\nEnter Target Price:`, (product.price * 0.9).toString());
    if (!targetPrice) return;

    try {
      const res = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_name: product.name,
          target_price: parseFloat(targetPrice),
          current_price: product.price,
          product_url: product.url,
          platform: product.platform,
          image_url: product.imageUrl || `https://picsum.photos/seed/${product.name}/300/300`
        })
      });
      if (res.ok) {
        fetchTracked();
        alert('🔔 Alert Set Successfully!\n\nBachat AI is now monitoring this product. You will receive a notification as soon as the price hits ₹' + targetPrice);
      }
    } catch (err) {
      console.error('Failed to track product', err);
    }
  };

  const removeTracked = async (id: number) => {
    if (!confirm('Stop tracking this product?')) return;
    try {
      await fetch(`/api/track/${id}`, { method: 'DELETE' });
      fetchTracked();
    } catch (err) {
      console.error('Failed to remove tracked product', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <ShoppingBag size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-indigo-900">Bachat AI</h1>
              <p className="text-[10px] text-indigo-600/60 font-bold uppercase tracking-[0.2em]">Smart Shopping Assistant</p>
            </div>
          </div>

          <nav className="flex items-center gap-1 bg-black/5 p-1.5 rounded-2xl">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'search' ? 'bg-white shadow-sm text-indigo-600' : 'text-black/50 hover:text-black'}`}
            >
              Search
            </button>
            <button
              onClick={() => setActiveTab('tracked')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'tracked' ? 'bg-white shadow-sm text-indigo-600' : 'text-black/50 hover:text-black'}`}
            >
              My Alerts
              {tracked.length > 0 && (
                <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full">
                  {tracked.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {activeTab === 'search' ? (
          <div className="space-y-12">
            {/* Search Section */}
            <section className="max-w-3xl mx-auto text-center space-y-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <h2 className="text-5xl font-black tracking-tight md:text-7xl text-indigo-950">
                  Save <span className="text-indigo-600">Bachat</span> on every order.
                </h2>
                <p className="text-black/50 text-xl font-medium max-w-xl mx-auto">
                  Compare Flipkart, Amazon, Zomato, and Swiggy in real-time with AI.
                </p>
              </motion.div>
              
              <form onSubmit={handleSearch} className="relative group max-w-2xl mx-auto">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[2rem] blur opacity-20 group-focus-within:opacity-40 transition duration-1000 group-focus-within:duration-200"></div>
                <div className="relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for 'iPhone 15', 'Biryani', or 'Milk'..."
                    className="w-full bg-white border-2 border-black/5 rounded-[1.5rem] px-8 py-5 pl-16 text-xl shadow-xl focus:outline-none focus:border-indigo-500 transition-all placeholder:text-black/20"
                  />
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-indigo-500 transition-colors" size={28} />
                  <button
                    type="submit"
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-indigo-500/30"
                  >
                    {loading ? <Loader2 className="animate-spin" size={24} /> : 'Find Deals'}
                  </button>
                </div>
                {userLocation && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-xs font-bold text-indigo-600/60 uppercase tracking-widest">
                    <Clock size={14} /> Searching in {userLocation}
                  </div>
                )}
              </form>

              <div className="flex flex-wrap justify-center gap-4 text-[10px] font-black text-black/30 uppercase tracking-[0.2em]">
                <span className="bg-white px-3 py-1 rounded-full border border-black/5">Flipkart</span>
                <span className="bg-white px-3 py-1 rounded-full border border-black/5">Amazon</span>
                <span className="bg-white px-3 py-1 rounded-full border border-black/5">Zomato</span>
                <span className="bg-white px-3 py-1 rounded-full border border-black/5">Swiggy</span>
                <span className="bg-white px-3 py-1 rounded-full border border-black/5">Blinkit</span>
              </div>
            </section>

            {/* Results Grid */}
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-32 space-y-6"
                >
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin" />
                    <ShoppingBag className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600 animate-pulse" size={32} />
                  </div>
                  <div className="text-center">
                    <p className="text-indigo-950 font-black text-lg">Bachat AI is working...</p>
                    <p className="text-black/40 text-sm font-medium">Scanning Indian marketplaces for the best prices</p>
                  </div>
                </motion.div>
              ) : results.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                  {results.sort((a, b) => a.price - b.price).map((product, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className={`bg-white rounded-[1.5rem] border-2 ${product.isAvailable ? 'border-black/5' : 'border-red-100 opacity-75'} overflow-hidden hover:shadow-2xl transition-all group relative flex flex-col`}
                    >
                      <div className="aspect-[4/3] relative overflow-hidden bg-gray-50">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ${!product.isAvailable && 'grayscale'}`}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src.includes('placeholder.com')) return;
                            target.src = `https://via.placeholder.com/800x600/EEF2FF/4F46E5?text=${encodeURIComponent(product.name)}`;
                          }}
                        />
                        
                        {!product.isAvailable && (
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                            <div className="bg-white text-red-600 px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-xl">
                              Currently Unavailable
                            </div>
                          </div>
                        )}

                        {idx === 0 && product.isAvailable && (
                          <button className="absolute top-4 left-4 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-xl">
                            Best Value
                          </button>
                        )}
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-black/5 shadow-sm">
                          {product.platform}
                        </div>
                      </div>
                      
                      <div className="p-5 space-y-4 flex-grow flex flex-col">
                        <div className="flex-grow space-y-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                              product.category === 'food' ? 'bg-orange-100 text-orange-600' : 
                              product.category === 'grocery' ? 'bg-green-100 text-green-600' : 
                              'bg-blue-100 text-blue-600'
                            }`}>
                              {product.category}
                            </span>
                          </div>
                          <h3 className="font-black text-base line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                            {product.name}
                          </h3>
                          {product.recommendationReason && (
                            <div className="flex items-start gap-2 bg-indigo-50 p-2 rounded-lg border border-indigo-100">
                              <Tag size={12} className="text-indigo-600 mt-0.5 flex-shrink-0" />
                              <p className="text-[10px] font-bold text-indigo-700 leading-tight">
                                {product.recommendationReason}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-end justify-between">
                          <div className="space-y-0.5">
                            <div className={`flex items-center gap-0.5 text-xl font-black ${product.isAvailable ? 'text-indigo-600' : 'text-black/40'}`}>
                              <IndianRupee size={16} />
                              {product.price.toLocaleString('en-IN')}
                            </div>
                            {product.originalPrice && (
                              <div className="text-[10px] text-black/30 font-bold line-through">
                                ₹{product.originalPrice.toLocaleString('en-IN')}
                              </div>
                            )}
                          </div>
                          {product.discount && product.isAvailable && (
                            <div className="bg-indigo-50 text-indigo-600 text-[9px] font-black px-2 py-1 rounded-full border border-indigo-100">
                              {product.discount}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[9px] font-black text-black/40 border-t border-black/5 pt-4 uppercase tracking-widest">
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-indigo-400" />
                            {product.deliveryTime}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <a
                            href={formatUrl(product.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${product.isAvailable ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20' : 'bg-black/5 text-black/20 cursor-not-allowed pointer-events-none'}`}
                          >
                            {product.category === 'food' ? 'Order' : 'Buy'} <ExternalLink size={14} />
                          </a>
                          <button
                            onClick={() => trackProduct(product)}
                            className="flex items-center justify-center gap-2 bg-white border-2 border-indigo-600/10 text-indigo-600 py-3 rounded-xl text-xs font-black hover:bg-indigo-50 transition-all"
                          >
                            Alert <Bell size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : error ? (
                <div className="text-center py-20 bg-red-50 rounded-[2.5rem] border-2 border-red-100">
                  <p className="text-red-600 font-black text-lg">{error}</p>
                </div>
              ) : (
                <div className="text-center py-32 opacity-10">
                  <ShoppingBag size={120} className="mx-auto mb-6" />
                  <p className="text-3xl font-black">Search to start saving</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-4xl font-black tracking-tight text-indigo-950">Active Alerts</h2>
                <p className="text-black/40 font-medium mt-1">Monitoring {tracked.length} products for price drops</p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 max-w-md">
                <div className="flex gap-3">
                  <Bell className="text-indigo-600 flex-shrink-0" size={20} />
                  <p className="text-xs font-bold text-indigo-700 leading-relaxed">
                    <span className="block mb-1 uppercase tracking-wider opacity-60">How Alerts Work</span>
                    Bachat AI checks prices every hour. When the price drops below your target, we'll send a push notification to your phone and an email alert.
                  </p>
                </div>
              </div>
            </div>

            {tracked.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {tracked.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-[2rem] border-2 border-black/5 p-6 flex flex-col md:flex-row items-center gap-8 hover:shadow-xl transition-all"
                  >
                    <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0 border border-black/5">
                      <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    
                    <div className="flex-grow space-y-2 text-center md:text-left">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">
                        {item.platform}
                      </div>
                      <h3 className="font-black text-2xl leading-tight text-indigo-950">{item.product_name}</h3>
                      <div className="text-xs text-black/30 font-bold">
                        Tracking since {new Date(item.created_at).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-12 px-10 border-x-2 border-black/5">
                      <div className="text-center">
                        <div className="text-[10px] font-black uppercase tracking-widest text-black/30 mb-2">Current</div>
                        <div className="text-2xl font-black text-indigo-950">₹{item.current_price.toLocaleString('en-IN')}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-2">Target</div>
                        <div className="text-2xl font-black text-indigo-600">₹{item.target_price.toLocaleString('en-IN')}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <a
                        href={formatUrl(item.product_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                        title="View Product"
                      >
                        <ExternalLink size={24} />
                      </a>
                      <button
                        onClick={() => removeTracked(item.id)}
                        className="p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-all"
                        title="Remove Alert"
                      >
                        <Trash2 size={24} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-40 bg-white rounded-[3rem] border-4 border-dashed border-black/5">
                <Bell size={80} className="mx-auto mb-6 text-black/10" />
                <h3 className="text-3xl font-black text-indigo-950">No active alerts</h3>
                <p className="text-black/40 mt-3 font-medium text-lg">Search for products and click the bell icon to start saving.</p>
                <button
                  onClick={() => setActiveTab('search')}
                  className="mt-10 bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/30"
                >
                  Start Searching
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-black/5 py-20 px-6 mt-32">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
              <ShoppingBag size={24} />
            </div>
            <h4 className="text-2xl font-black tracking-tight text-indigo-950">Bachat AI</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 max-w-5xl">
            <div className="space-y-4">
              <h5 className="font-black text-xs uppercase tracking-[0.2em] text-indigo-600">Smart Tracking</h5>
              <p className="text-black/50 text-sm font-medium leading-relaxed">
                Our AI monitors prices across Flipkart and Amazon 24/7, notifying you the second a price drop happens.
              </p>
            </div>
            <div className="space-y-4">
              <h5 className="font-black text-xs uppercase tracking-[0.2em] text-indigo-600">Food & Grocery</h5>
              <p className="text-black/50 text-sm font-medium leading-relaxed">
                Compare Zomato, Swiggy, and Blinkit in one place. Never pay more for your cravings again.
              </p>
            </div>
            <div className="space-y-4">
              <h5 className="font-black text-xs uppercase tracking-[0.2em] text-indigo-600">Bachat Guarantee</h5>
              <p className="text-black/50 text-sm font-medium leading-relaxed">
                We find the absolute lowest price across India's top platforms, including hidden bank offers and coupons.
              </p>
            </div>
          </div>

          <div className="pt-12 border-t border-black/5 w-full text-black/20 text-[10px] font-black uppercase tracking-[0.3em]">
            Bachat AI © 2026 • India's Smartest Shopping Agent
          </div>
        </div>
      </footer>
    </div>
  );
}
