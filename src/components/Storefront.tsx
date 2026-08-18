import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  Heart,
  Loader2,
  Menu,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  X,
  XCircle,
} from 'lucide-react';
import { supabase, type Product, type Order } from '@/lib/supabase';

const ACCENT_CLASSES: Record<string, string> = {
  aqua: '',
  black: 'brightness-[0.82] saturate-[0.85]',
  cream: 'sepia-[.18] brightness-[1.06]',
};

const DEFAULT_IMAGE = '/images/WhatsApp_Image_2026-08-15_at_11.41.30_AM-removebg-preview.png';

function formatPrice(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

type BagItem = { product: Product; quantity: number };

export default function Storefront() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [activeCategory, setActiveCategory] = useState('All pieces');
  const [bag, setBag] = useState<BagItem[]>([]);
  const [bagOpen, setBagOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', notes: '' });
  const [heroIndex, setHeroIndex] = useState(0);

  const heroProducts = products;
  const heroProduct = heroProducts[heroIndex];

  useEffect(() => {
    if (heroProducts.length <= 1) return;
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroProducts.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroProducts.length]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });
      if (!active) return;
      if (error) {
        setLoadError(error.message);
      } else {
        setProducts((data as Product[]) ?? []);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const bagCount = bag.reduce((sum, item) => sum + item.quantity, 0);
  const bagTotal = bag.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const addToBag = (product: Product) => {
    setBag((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setBagOpen(true);
  };

  const updateQty = (productId: string, delta: number) => {
    setBag((prev) =>
      prev
        .map((item) =>
          item.product.id === productId ? { ...item, quantity: item.quantity + delta } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const removeFromBag = (productId: string) => {
    setBag((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const filteredProducts = products.filter((product) => {
    if (activeCategory === 'All pieces') return true;
    if (activeCategory === 'Automatic') return product.detail?.toLowerCase().includes('automatic');
    if (activeCategory === 'Classics') return product.detail?.toLowerCase().includes('quartz');
    return true;
  });

  const placeOrder = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      setOrderResult({ ok: false, message: 'Please provide your name and email.' });
      return;
    }
    if (bag.length === 0) {
      setOrderResult({ ok: false, message: 'Your bag is empty.' });
      return;
    }
    setSubmitting(true);
    setOrderResult(null);
    const rows = bag.map((item) => ({
      customer_name: form.name.trim(),
      customer_email: form.email.trim(),
      customer_phone: form.phone.trim() || null,
      shipping_address: form.address.trim() || null,
      product_id: item.product.id,
      product_name: item.product.name,
      quantity: item.quantity,
      total: item.product.price * item.quantity,
      status: 'pending',
      notes: form.notes.trim() || null,
    }));
    const { error } = await supabase.from('orders').insert(rows as Omit<Order, 'id' | 'created_at'>[]);
    setSubmitting(false);
    if (error) {
      setOrderResult({ ok: false, message: error.message });
      return;
    }
    setOrderResult({ ok: true, message: 'Order placed! We will be in touch shortly.' });
    setBag([]);
    setForm({ name: '', email: '', phone: '', address: '', notes: '' });
    setTimeout(() => {
      setCheckoutOpen(false);
      setOrderResult(null);
    }, 2500);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#0b0c0d] text-[#f3f0e9]">
      <div className="grain" />
      <header className="relative z-20 border-b border-white/[0.09]">
        <nav className="mx-auto flex max-w-[1320px] items-center justify-between px-6 py-5 lg:px-10">
          <button className="flex items-center gap-3" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#c6a86a] text-[#c6a86a]"><Sparkles size={16} strokeWidth={1.5} /></span>
            <span className="serif text-xl tracking-[0.16em]">PRESTIGE <span className="text-[#c6a86a]">WEAR</span></span>
          </button>
          <div className="hidden items-center gap-10 text-[11px] font-medium uppercase tracking-[0.23em] text-white/65 md:flex">
            <a className="nav-link text-white" href="#home">Home</a>
            <a className="nav-link" href="#collection">The collection</a>
            <a className="nav-link" href="#story">Our story</a>
          </div>
          <div className="flex items-center gap-4">
            <button aria-label="Search" className="hidden text-white/70 transition hover:text-[#c6a86a] sm:block"><Search size={19} strokeWidth={1.5} /></button>
            <button aria-label="Shopping bag" className="relative text-white/70 transition hover:text-[#c6a86a]" onClick={() => setBagOpen(true)}>
              <ShoppingBag size={19} strokeWidth={1.5} />
              {bagCount > 0 && <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c6a86a] px-1 text-[9px] font-bold text-[#0b0c0d]">{bagCount}</span>}
            </button>
            <button aria-label="Open menu" className="text-white/70 md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </nav>
        {menuOpen && <div className="border-t border-white/[0.09] px-6 py-5 md:hidden"><div className="flex flex-col gap-5 text-xs uppercase tracking-[0.2em] text-white/70"><a href="#home" onClick={() => setMenuOpen(false)}>Home</a><a href="#collection" onClick={() => setMenuOpen(false)}>The collection</a><a href="#story" onClick={() => setMenuOpen(false)}>Our story</a></div></div>}
      </header>

      <section id="home" className="relative mx-auto grid min-h-[680px] max-w-[1320px] items-center px-6 py-16 lg:grid-cols-[0.82fr_1.18fr] lg:px-10 lg:py-20">
        <div className="relative z-10 max-w-xl animate-rise">
          <p className="mb-7 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.35em] text-[#c6a86a]"><span className="h-px w-9 bg-[#c6a86a]" /> Est. 1987 · New York</p>
          <h1 className="serif max-w-[600px] text-6xl leading-[0.94] tracking-[-0.04em] sm:text-8xl lg:text-[7.4rem]">Time, <em className="font-light text-[#c6a86a]">refined.</em></h1>
          <p className="mt-8 max-w-sm text-sm leading-7 text-white/55">An uncompromising study in form, precision, and presence. Designed for the moments that matter.</p>
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <a href="#collection" className="group inline-flex items-center gap-4 bg-[#c6a86a] px-6 py-4 text-[10px] font-bold uppercase tracking-[0.22em] text-[#0b0c0d] transition hover:bg-[#e1c98f]">Explore collection <ArrowRight size={15} className="transition group-hover:translate-x-1" /></a>
            <a href="#story" className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/60 transition hover:text-white">Discover our story</a>
          </div>
          <div className="mt-16 flex items-center gap-8 border-t border-white/10 pt-5">
            <div><p className="serif text-2xl">36<span className="text-[#c6a86a]">+</span></p><p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-white/40">Years of craft</p></div>
            <div className="h-8 w-px bg-white/15" /><div><p className="serif text-2xl">24<span className="text-[#c6a86a]">h</span></p><p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-white/40">Precision tested</p></div>
          </div>
        </div>

        <div className="hero-orb relative mt-10 flex min-h-[370px] items-center justify-center lg:mt-0 lg:min-h-[580px]">
          <div className={`hero-glow absolute h-[55%] w-[55%] rounded-full blur-[75px] transition-colors duration-[1200ms] ${heroProduct?.accent === 'black' ? 'bg-[#525b5d]/30' : heroProduct?.accent === 'cream' ? 'bg-[#9d7e4d]/30' : 'bg-[#196b7b]/30'}`} />
          <div className="absolute h-[300px] w-[300px] border border-white/10 bg-white/[0.04] backdrop-blur-xl sm:h-[400px] sm:w-[400px] lg:h-[480px] lg:w-[480px]" style={{ clipPath: 'inset(0 round 6px)' }} />
          <div className="orb-ring absolute h-[310px] w-[310px] rounded-full border border-[#c6a86a]/25 sm:h-[440px] sm:w-[440px] lg:h-[570px] lg:w-[570px]" />
          <div className="orb-ring absolute h-[235px] w-[235px] rounded-full border border-white/10 sm:h-[360px] sm:w-[360px] lg:h-[465px] lg:w-[465px]" />
          <span className="absolute right-[12%] top-[14%] h-1.5 w-1.5 rounded-full bg-[#c6a86a] shadow-[0_0_16px_#c6a86a]" />
          <span className="absolute bottom-[18%] left-[12%] h-1 w-1 rounded-full bg-white/70" />
          <div className="watch-shadow absolute bottom-[15%] h-8 w-[50%] rounded-full bg-black/80 blur-2xl" />
          {loading || !heroProduct ? (
            <img src={DEFAULT_IMAGE} alt="Prestige Wear signature timepiece" className="watch-image relative z-10 w-full max-w-[340px] object-contain drop-shadow-[0_20px_15px_rgba(0,0,0,0.55)]" />
          ) : (
            <img key={heroProduct.id} src={heroProduct.image_url || DEFAULT_IMAGE} alt={`${heroProduct.name} watch`} className={`hero-fade watch-image relative z-10 w-full max-w-[340px] object-contain drop-shadow-[0_20px_15px_rgba(0,0,0,0.55)] ${ACCENT_CLASSES[heroProduct.accent] ?? ''}`} />
          )}
          <div className="absolute bottom-4 right-[5%] z-20 max-w-[160px] border-l border-[#c6a86a] pl-4 text-[10px] leading-5 tracking-[0.1em] text-white/55">
            <span className="block text-[#c6a86a]">{heroProducts.length > 0 ? `${String(heroIndex + 1).padStart(2, '0')} / ${String(heroProducts.length).padStart(2, '0')}` : 'Signature'}</span>
            {heroProduct ? <>{heroProduct.name}<br />{heroProduct.detail || 'Signature dial'}</> : <>Ocean Blue<br />Signature dial</>}
          </div>
          {heroProducts.length > 1 && (
            <div className="absolute bottom-[-28px] left-1/2 z-20 flex -translate-x-1/2 gap-2">
              {heroProducts.map((product, index) => (
                <button key={product.id} aria-label={`Show ${product.name}`} onClick={() => setHeroIndex(index)} className={`h-1.5 rounded-full transition-all duration-300 ${index === heroIndex ? 'w-8 bg-[#c6a86a]' : 'w-1.5 bg-white/20 hover:bg-white/40'}`} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="border-y border-white/[0.08] bg-[#101213]">
        <div className="mx-auto grid max-w-[1320px] grid-cols-1 divide-y divide-white/[0.08] px-6 sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:px-10">
          {[{ icon: Star, title: 'Masterful detail', text: 'Hand-finished in Switzerland' }, { icon: Truck, title: 'A considered arrival', text: 'Complimentary worldwide delivery' }, { icon: Sparkles, title: 'Made to last', text: 'Five-year international warranty' }].map(({ icon: Icon, title, text }) => <div key={title} className="flex items-center gap-4 py-6 sm:px-7 lg:py-7 first:sm:pl-0"><Icon size={19} strokeWidth={1.2} className="text-[#c6a86a]" /><div><p className="text-[10px] font-bold uppercase tracking-[0.17em]">{title}</p><p className="mt-1 text-xs text-white/40">{text}</p></div></div>)}
        </div>
      </section>

      <section id="collection" className="mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-32">
        <div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-end"><div><p className="mb-4 text-[10px] uppercase tracking-[0.3em] text-[#c6a86a]">The edit · 2026</p><h2 className="serif text-5xl tracking-[-0.03em] sm:text-6xl">The <em className="font-light text-white/60">collection.</em></h2></div><div className="flex gap-6 text-[10px] uppercase tracking-[0.18em] text-white/40">{['All pieces', 'Automatic', 'Classics'].map((category) => <button key={category} className={`pb-2 transition ${activeCategory === category ? 'border-b border-[#c6a86a] text-[#c6a86a]' : 'hover:text-white'}`} onClick={() => setActiveCategory(category)}>{category}</button>)}</div></div>

        {loading ? (
          <div className="mt-20 flex items-center justify-center gap-3 text-sm text-white/40"><Loader2 size={18} className="animate-spin" /> Loading the collection…</div>
        ) : loadError ? (
          <div className="mt-20 flex flex-col items-center gap-3 text-center text-sm text-red-400/80"><XCircle size={22} /><p>Couldn't load products.</p><p className="text-xs text-white/30">{loadError}</p></div>
        ) : filteredProducts.length === 0 ? (
          <div className="mt-20 text-center text-sm text-white/40">No pieces in this category yet.</div>
        ) : (
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {filteredProducts.map((product) => (
              <article key={product.id} className="product-card group relative overflow-hidden bg-[#151718] p-5">
                <div className={`product-backdrop ${product.accent}`} />
                <button aria-label={`Add ${product.name} to wishlist`} onClick={() => setLiked((prev) => ({ ...prev, [product.id]: !prev[product.id] }))} className={`absolute right-5 top-5 z-10 rounded-full border border-white/10 p-2.5 transition hover:border-[#c6a86a] ${liked[product.id] ? 'text-[#c6a86a]' : 'text-white/50'}`}><Heart size={15} fill={liked[product.id] ? 'currentColor' : 'none'} /></button>
                <div className="relative flex h-[280px] items-center justify-center overflow-hidden rounded-sm">
                  <img src={product.image_url || DEFAULT_IMAGE} alt={`${product.name} watch`} loading="lazy" className={`product-image w-[88%] object-contain transition-transform duration-500 group-hover:scale-[1.04] ${ACCENT_CLASSES[product.accent] ?? ''}`} />
                </div>
                <div className="relative mt-2 flex items-end justify-between border-t border-white/10 pt-5">
                  <div><h3 className="serif text-2xl">{product.name}</h3><p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/40">{product.detail}</p></div>
                  <p className="text-sm text-[#c6a86a]">{formatPrice(product.price)}</p>
                </div>
                <button onClick={() => addToBag(product)} className="relative mt-5 flex w-full items-center justify-center gap-2 border border-white/15 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 transition hover:border-[#c6a86a] hover:bg-[#c6a86a] hover:text-[#0b0c0d]">Add to bag <ShoppingBag size={13} /></button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section id="story" className="border-y border-white/[0.08] bg-[#151718] px-6 py-24 lg:px-10 lg:py-32"><div className="mx-auto grid max-w-[1320px] items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]"><div className="relative mx-auto flex aspect-square w-full max-w-[420px] items-center justify-center border border-[#c6a86a]/25"><div className="absolute inset-5 border border-white/10" /><img src={DEFAULT_IMAGE} alt="Crafted Prestige Wear timepiece" className="w-[92%] object-contain drop-shadow-[0_15px_10px_rgba(0,0,0,0.5)]" /><span className="absolute -bottom-3 left-8 bg-[#151718] px-4 text-[9px] uppercase tracking-[0.24em] text-[#c6a86a]">The art of keeping time</span></div><div className="max-w-xl lg:pl-12"><p className="mb-5 text-[10px] uppercase tracking-[0.3em] text-[#c6a86a]">A quiet confidence</p><h2 className="serif text-5xl leading-[1] tracking-[-0.03em] sm:text-6xl">Not made to<br /><em className="font-light text-white/55">follow time.</em></h2><p className="mt-8 text-sm leading-7 text-white/50">Prestige Wear began with a simple belief: the things we carry should carry meaning. Every silhouette is reduced to its essential form, then finished by hand with the patience that true craft demands.</p><a href="#collection" className="mt-9 inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#c6a86a] transition hover:text-white">Read our story <ArrowRight size={14} /></a></div></div></section>

      <footer className="mx-auto flex max-w-[1320px] flex-col gap-5 px-6 py-8 text-[10px] uppercase tracking-[0.18em] text-white/35 sm:flex-row sm:items-center sm:justify-between lg:px-10"><span className="serif text-sm tracking-[0.18em] text-white/70">PRESTIGE <span className="text-[#c6a86a]">WEAR</span></span><span>© 2026 Prestige Wear · Crafted for your time</span><div className="flex items-center gap-5"><a href="#/admin" className="text-white/25 transition hover:text-[#c6a86a]">Admin</a><span className="text-[#c6a86a]">New York · Geneva · Tokyo</span></div></footer>

      {bagOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setBagOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-[#101213] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <h3 className="serif text-2xl">Your bag</h3>
              <button aria-label="Close bag" onClick={() => setBagOpen(false)} className="text-white/60 transition hover:text-white"><X size={20} /></button>
            </div>
            {bag.length === 0 ? (
              <p className="mt-10 text-center text-sm text-white/40">Your bag is empty.</p>
            ) : (
              <>
                <div className="divide-y divide-white/10">
                  {bag.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-4 py-5">
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-[#1a1c1d] p-1"><img src={item.product.image_url || DEFAULT_IMAGE} alt={item.product.name} className="h-full w-full object-contain" /></div>
                      <div className="flex-1">
                        <p className="serif text-lg">{item.product.name}</p>
                        <p className="text-[10px] uppercase tracking-[0.15em] text-white/40">{item.product.detail}</p>
                        <div className="mt-2 flex items-center gap-3">
                          <button aria-label="Decrease quantity" onClick={() => updateQty(item.product.id, -1)} className="flex h-6 w-6 items-center justify-center border border-white/15 text-white/60 transition hover:border-[#c6a86a] hover:text-[#c6a86a]"><Minus size={12} /></button>
                          <span className="w-6 text-center text-sm">{item.quantity}</span>
                          <button aria-label="Increase quantity" onClick={() => updateQty(item.product.id, 1)} className="flex h-6 w-6 items-center justify-center border border-white/15 text-white/60 transition hover:border-[#c6a86a] hover:text-[#c6a86a]"><Plus size={12} /></button>
                          <button aria-label="Remove item" onClick={() => removeFromBag(item.product.id)} className="ml-auto text-white/30 transition hover:text-red-400"><X size={15} /></button>
                        </div>
                      </div>
                      <p className="text-sm text-[#c6a86a]">{formatPrice(item.product.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">Total</span>
                  <span className="serif text-2xl text-[#c6a86a]">{formatPrice(bagTotal)}</span>
                </div>
                <button onClick={() => { setBagOpen(false); setCheckoutOpen(true); }} className="mt-6 flex w-full items-center justify-center gap-2 bg-[#c6a86a] py-4 text-[10px] font-bold uppercase tracking-[0.22em] text-[#0b0c0d] transition hover:bg-[#e1c98f]">Proceed to checkout <ArrowRight size={14} /></button>
              </>
            )}
          </div>
        </div>
      )}

      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setCheckoutOpen(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg overflow-y-auto border border-white/10 bg-[#101213] p-7" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <h3 className="serif text-2xl">Checkout</h3>
              <button aria-label="Close checkout" onClick={() => setCheckoutOpen(false)} className="text-white/60 transition hover:text-white"><X size={20} /></button>
            </div>
            {orderResult?.ok ? (
              <div className="mt-8 flex flex-col items-center gap-4 py-8 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#c6a86a] text-[#0b0c0d]"><Check size={26} /></span>
                <p className="text-sm text-white/70">{orderResult.message}</p>
              </div>
            ) : (
              <>
                <div className="mt-6 space-y-4">
                  <Field label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Jane Doe" />
                  <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="jane@example.com" />
                  <Field label="Phone (optional)" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+1 555 0100" />
                  <Field label="Shipping address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} placeholder="123 Fifth Ave, New York, NY" textarea />
                  <Field label="Notes (optional)" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} placeholder="Gift wrap, engraving, etc." textarea />
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">Order total</span>
                  <span className="serif text-2xl text-[#c6a86a]">{formatPrice(bagTotal)}</span>
                </div>
                {orderResult && !orderResult.ok && <p className="mt-4 text-xs text-red-400">{orderResult.message}</p>}
                <button onClick={placeOrder} disabled={submitting} className="mt-6 flex w-full items-center justify-center gap-2 bg-[#c6a86a] py-4 text-[10px] font-bold uppercase tracking-[0.22em] text-[#0b0c0d] transition hover:bg-[#e1c98f] disabled:opacity-50">
                  {submitting ? <><Loader2 size={14} className="animate-spin" /> Placing order…</> : <>Place order <Check size={14} /></>}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', textarea = false }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  textarea?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">{label}</span>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={2} className="w-full resize-none border border-white/15 bg-[#0b0c0d] px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-[#c6a86a] focus:outline-none" />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full border border-white/15 bg-[#0b0c0d] px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-[#c6a86a] focus:outline-none" />
      )}
    </label>
  );
}
