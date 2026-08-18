import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Box,
  Check,
  ClipboardList,
  Edit2,
  ImagePlus,
  Loader2,
  Lock,
  Package,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { supabase, ORDER_STATUSES, type Order, type OrderStatus, type Product } from '@/lib/supabase';

type Tab = 'products' | 'orders';

const DEFAULT_IMAGE = '/images/WhatsApp_Image_2026-08-15_at_11.41.30_AM-removebg-preview.png';
const ACCENTS: Array<Product['accent']> = ['aqua', 'black', 'cream'];

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  processing: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  shipped: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  delivered: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  cancelled: 'bg-red-500/15 text-red-300 border-red-500/30',
};

function formatPrice(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const ADMIN_PASSWORD = 'prestige2026';

const emptyForm = { name: '', detail: '', price: '', image_url: DEFAULT_IMAGE, accent: 'aqua' as Product['accent'], is_active: true };

export default function AdminPanel() {
  const [unlocked, setUnlocked] = useState(false);
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState(false);
  const [tab, setTab] = useState<Tab>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Please drop an image file');
      return;
    }
    setUploading(true);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
    const { error: upErr } = await supabase.storage.from('product-images').upload(path, file, { cacheControl: '3600', upsert: false });
    if (upErr) {
      showToast(upErr.message);
      setUploading(false);
      return;
    }
    const { data: pub } = supabase.storage.from('product-images').getPublicUrl(path);
    setForm((prev) => ({ ...prev, image_url: pub.publicUrl }));
    setUploading(false);
    showToast('Image uploaded');
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  };

  const loadProducts = async () => {
    const { data, error: err } = await supabase.from('products').select('*').order('created_at', { ascending: true });
    if (err) { setError(err.message); return; }
    setProducts((data as Product[]) ?? []);
  };

  const loadOrders = async () => {
    const { data, error: err } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (err) { setError(err.message); return; }
    setOrders((data as Order[]) ?? []);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadProducts(), loadOrders()]);
      setLoading(false);
    })();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      detail: product.detail ?? '',
      price: String(product.price),
      image_url: product.image_url || DEFAULT_IMAGE,
      accent: product.accent,
      is_active: product.is_active,
    });
    setModalOpen(true);
  };

  const saveProduct = async () => {
    if (!form.name.trim()) { showToast('Product name is required'); return; }
    const priceNum = parseFloat(form.price);
    if (Number.isNaN(priceNum) || priceNum < 0) { showToast('Enter a valid price'); return; }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      detail: form.detail.trim() || null,
      price: priceNum,
      image_url: form.image_url.trim() || DEFAULT_IMAGE,
      accent: form.accent,
      is_active: form.is_active,
    };
    if (editingId) {
      const { error: err } = await supabase.from('products').update(payload).eq('id', editingId);
      if (err) { showToast(err.message); setSaving(false); return; }
      showToast('Product updated');
    } else {
      const { error: err } = await supabase.from('products').insert(payload);
      if (err) { showToast(err.message); setSaving(false); return; }
      showToast('Product added');
    }
    setSaving(false);
    setModalOpen(false);
    await loadProducts();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    const { error: err } = await supabase.from('products').delete().eq('id', id);
    if (err) { showToast(err.message); return; }
    showToast('Product deleted');
    await loadProducts();
  };

  const toggleActive = async (product: Product) => {
    const { error: err } = await supabase.from('products').update({ is_active: !product.is_active }).eq('id', product.id);
    if (err) { showToast(err.message); return; }
    await loadProducts();
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const { error: err } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (err) { showToast(err.message); return; }
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    showToast('Order status updated');
  };

  const deleteOrder = async (id: string) => {
    if (!confirm('Delete this order? This cannot be undone.')) return;
    const { error: err } = await supabase.from('orders').delete().eq('id', id);
    if (err) { showToast(err.message); return; }
    showToast('Order deleted');
    await loadOrders();
  };

  const totalRevenue = orders.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + Number(o.total), 0);
  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const activeProductCount = products.filter((p) => p.is_active).length;

  const submitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwInput === ADMIN_PASSWORD) {
      setUnlocked(true);
      setPwError(false);
    } else {
      setPwError(true);
      setPwInput('');
    }
  };

  if (!unlocked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0b0c0d] px-6 text-[#f3f0e9]">
        <div className="grain" />
        <div className="relative w-full max-w-sm border border-white/10 bg-[#101213] p-8">
          <div className="mb-7 flex flex-col items-center gap-4 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#c6a86a] text-[#c6a86a]"><Lock size={20} strokeWidth={1.5} /></span>
            <div>
              <p className="serif text-2xl tracking-[0.1em]">PRESTIGE <span className="text-[#c6a86a]">WEAR</span></p>
              <p className="mt-1 text-[9px] uppercase tracking-[0.25em] text-white/40">Admin Access</p>
            </div>
          </div>
          <form onSubmit={submitPassword} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">Password</span>
              <input type="password" value={pwInput} onChange={(e) => { setPwInput(e.target.value); setPwError(false); }} placeholder="Enter password" autoFocus className="w-full border border-white/15 bg-[#0b0c0d] px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-[#c6a86a] focus:outline-none" />
            </label>
            {pwError && <p className="text-xs text-red-400">Incorrect password. Try again.</p>}
            <button type="submit" className="flex w-full items-center justify-center gap-2 bg-[#c6a86a] py-3.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#0b0c0d] transition hover:bg-[#e1c98f]">Unlock <Lock size={13} /></button>
          </form>
          <a href="#home" className="mt-6 block text-center text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 transition hover:text-[#c6a86a]">← Back to store</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0c0d] text-[#f3f0e9]">
      <header className="border-b border-white/[0.09] bg-[#101213]">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between px-6 py-5 lg:px-10">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#c6a86a] text-[#c6a86a]"><Sparkles size={16} strokeWidth={1.5} /></span>
            <div>
              <p className="serif text-lg tracking-[0.12em]">PRESTIGE <span className="text-[#c6a86a]">WEAR</span></p>
              <p className="text-[9px] uppercase tracking-[0.25em] text-white/40">Admin Panel</p>
            </div>
          </div>
          <a href="#home" className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 transition hover:text-[#c6a86a]">← Back to store</a>
        </div>
      </header>

      <div className="mx-auto max-w-[1320px] px-6 py-8 lg:px-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard icon={Package} label="Active products" value={String(activeProductCount)} />
          <StatCard icon={ClipboardList} label="Pending orders" value={String(pendingCount)} />
          <StatCard icon={Box} label="Revenue (excl. cancelled)" value={formatPrice(totalRevenue)} />
        </div>

        <div className="mt-8 flex gap-2 border-b border-white/10">
          {(['products', 'orders'] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`flex items-center gap-2 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.18em] transition ${tab === t ? 'border-b-2 border-[#c6a86a] text-[#c6a86a]' : 'text-white/40 hover:text-white'}`}>
              {t === 'products' ? <Package size={14} /> : <ClipboardList size={14} />} {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-16 flex items-center justify-center gap-3 text-sm text-white/40"><Loader2 size={18} className="animate-spin" /> Loading…</div>
        ) : error ? (
          <div className="mt-16 flex flex-col items-center gap-3 text-center text-red-400"><AlertCircle size={22} /><p className="text-sm">{error}</p></div>
        ) : tab === 'products' ? (
          <ProductsTab products={products} onCreate={openCreate} onEdit={openEdit} onDelete={deleteProduct} onToggle={toggleActive} />
        ) : (
          <OrdersTab orders={orders} onStatusChange={updateOrderStatus} onDelete={deleteOrder} />
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg border border-white/10 bg-[#101213] p-7" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <h3 className="serif text-2xl">{editingId ? 'Edit product' : 'Add product'}</h3>
              <button aria-label="Close" onClick={() => setModalOpen(false)} className="text-white/60 transition hover:text-white"><X size={20} /></button>
            </div>
            <div className="mt-6 space-y-4">
              <AdminField label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Aurelia" />
              <AdminField label="Detail" value={form.detail} onChange={(v) => setForm({ ...form, detail: v })} placeholder="Automatic · 41mm" />
              <AdminField label="Price (USD)" type="number" value={form.price} onChange={(v) => setForm({ ...form, price: v })} placeholder="1280" />
              <div>
                <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">Product image</span>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const file = e.dataTransfer.files[0];
                    if (file) uploadImage(file);
                  }}
                  className={`relative flex h-44 cursor-pointer flex-col items-center justify-center gap-3 border-2 border-dashed transition ${dragOver ? 'border-[#c6a86a] bg-[#c6a86a]/5' : 'border-white/15 hover:border-white/30'}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <><Loader2 size={24} className="animate-spin text-[#c6a86a]" /><span className="text-xs text-white/50">Uploading…</span></>
                  ) : form.image_url && form.image_url !== DEFAULT_IMAGE ? (
                    <>
                      <img src={form.image_url} alt="Product preview" className="absolute inset-0 h-full w-full object-contain p-2" />
                      <div className="absolute bottom-2 right-2 flex gap-2">
                        <button type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="flex items-center gap-1.5 border border-white/20 bg-black/60 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white/70 transition hover:text-[#c6a86a]"><Upload size={11} /> Replace</button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setForm((prev) => ({ ...prev, image_url: DEFAULT_IMAGE })); }} className="flex items-center gap-1.5 border border-white/20 bg-black/60 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white/70 transition hover:text-red-400"><X size={11} /> Remove</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <ImagePlus size={28} strokeWidth={1.2} className="text-white/40" />
                      <span className="text-xs text-white/40">Drag & drop an image here</span>
                      <span className="text-[10px] uppercase tracking-[0.15em] text-white/25">or click to browse</span>
                    </>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadImage(file); e.target.value = ''; }} />
                </div>
                <p className="mt-1.5 text-[10px] text-white/25">PNG with transparent background works best</p>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">Accent</span>
                <div className="flex gap-2">
                  {ACCENTS.map((a) => (
                    <button key={a} onClick={() => setForm({ ...form, accent: a })} className={`flex-1 border py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] transition ${form.accent === a ? 'border-[#c6a86a] bg-[#c6a86a]/10 text-[#c6a86a]' : 'border-white/15 text-white/40 hover:text-white'}`}>{a}</button>
                  ))}
                </div>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4 accent-[#c6a86a]" />
                <span className="text-xs text-white/60">Visible on storefront</span>
              </label>
            </div>
            <div className="mt-7 flex gap-3">
              <button onClick={() => setModalOpen(false)} className="flex-1 border border-white/15 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 transition hover:text-white">Cancel</button>
              <button onClick={saveProduct} disabled={saving} className="flex flex-1 items-center justify-center gap-2 bg-[#c6a86a] py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#0b0c0d] transition hover:bg-[#e1c98f] disabled:opacity-50">
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <>{editingId ? 'Save changes' : 'Add product'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 border border-[#c6a86a]/30 bg-[#151718] px-5 py-3 text-xs text-[#c6a86a] shadow-lg">
          {toast}
        </div>
      )}
    </main>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Package; label: string; value: string }) {
  return (
    <div className="border border-white/[0.08] bg-[#101213] p-5">
      <div className="flex items-center gap-3 text-[#c6a86a]"><Icon size={18} strokeWidth={1.5} /><span className="text-[9px] uppercase tracking-[0.2em] text-white/40">{label}</span></div>
      <p className="serif mt-3 text-3xl">{value}</p>
    </div>
  );
}

function ProductsTab({ products, onCreate, onEdit, onDelete, onToggle }: {
  products: Product[];
  onCreate: () => void;
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
  onToggle: (p: Product) => void;
}) {
  return (
    <div className="mt-6">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-xs text-white/40">{products.length} product{products.length !== 1 ? 's' : ''} total</p>
        <button onClick={onCreate} className="flex items-center gap-2 bg-[#c6a86a] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#0b0c0d] transition hover:bg-[#e1c98f]"><Plus size={14} /> Add product</button>
      </div>
      {products.length === 0 ? (
        <p className="py-16 text-center text-sm text-white/40">No products yet. Add your first one.</p>
      ) : (
        <div className="overflow-x-auto border border-white/[0.08]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-[9px] uppercase tracking-[0.18em] text-white/40">
              <tr>
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">Detail</th>
                <th className="px-5 py-4">Price</th>
                <th className="px-5 py-4">Accent</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {products.map((product) => (
                <tr key={product.id} className="transition hover:bg-white/[0.02]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-[#1a1c1d] p-0.5"><img src={product.image_url || DEFAULT_IMAGE} alt={product.name} className="h-full w-full object-contain" /></div>
                      <span className="serif text-base">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-white/50">{product.detail || '—'}</td>
                  <td className="px-5 py-4 text-[#c6a86a]">{formatPrice(product.price)}</td>
                  <td className="px-5 py-4"><span className="text-[10px] uppercase tracking-[0.12em] text-white/40">{product.accent}</span></td>
                  <td className="px-5 py-4">
                    <button onClick={() => onToggle(product)} className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] ${product.is_active ? 'text-emerald-400' : 'text-white/30'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${product.is_active ? 'bg-emerald-400' : 'bg-white/30'}`} /> {product.is_active ? 'Visible' : 'Hidden'}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button aria-label="Edit" onClick={() => onEdit(product)} className="flex h-8 w-8 items-center justify-center border border-white/15 text-white/60 transition hover:border-[#c6a86a] hover:text-[#c6a86a]"><Edit2 size={14} /></button>
                      <button aria-label="Delete" onClick={() => onDelete(product.id)} className="flex h-8 w-8 items-center justify-center border border-white/15 text-white/60 transition hover:border-red-500 hover:text-red-400"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function OrdersTab({ orders, onStatusChange, onDelete }: {
  orders: Order[];
  onStatusChange: (id: string, status: OrderStatus) => void;
  onDelete: (id: string) => void;
}) {
  if (orders.length === 0) {
    return <p className="py-16 text-center text-sm text-white/40">No orders yet. Orders will appear here when customers check out.</p>;
  }
  return (
    <div className="mt-6 space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="border border-white/[0.08] bg-[#101213] p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h4 className="serif text-lg">{order.product_name}</h4>
                <span className={`border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.15em] ${STATUS_COLORS[order.status]}`}>{order.status}</span>
              </div>
              <p className="mt-2 text-xs text-white/50">{order.quantity} × {formatPrice(Number(order.total) / order.quantity)} = <span className="text-[#c6a86a]">{formatPrice(Number(order.total))}</span></p>
              <div className="mt-3 grid grid-cols-1 gap-1 text-xs text-white/40 sm:grid-cols-2">
                <p><span className="text-white/25">Customer:</span> {order.customer_name}</p>
                <p><span className="text-white/25">Email:</span> {order.customer_email}</p>
                {order.customer_phone && <p><span className="text-white/25">Phone:</span> {order.customer_phone}</p>}
                <p><span className="text-white/25">Date:</span> {formatDate(order.created_at)}</p>
                {order.shipping_address && <p className="sm:col-span-2"><span className="text-white/25">Ship to:</span> {order.shipping_address}</p>}
                {order.notes && <p className="sm:col-span-2"><span className="text-white/25">Notes:</span> {order.notes}</p>}
              </div>
            </div>
            <div className="flex flex-col items-end gap-3">
              <select value={order.status} onChange={(e) => onStatusChange(order.id, e.target.value as OrderStatus)} className="border border-white/15 bg-[#0b0c0d] px-3 py-2 text-xs text-white focus:border-[#c6a86a] focus:outline-none">
                {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button aria-label="Delete order" onClick={() => onDelete(order.id)} className="flex h-8 w-8 items-center justify-center border border-white/15 text-white/60 transition hover:border-red-500 hover:text-red-400"><Trash2 size={14} /></button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminField({ label, value, onChange, placeholder, type = 'text' }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full border border-white/15 bg-[#0b0c0d] px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-[#c6a86a] focus:outline-none" />
    </label>
  );
}
