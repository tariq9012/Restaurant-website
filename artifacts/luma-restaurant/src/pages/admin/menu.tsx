import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { AdminShell } from '@/components/admin-layout';
import { apiRequest, formValues, formatPrice } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

type Category = { id: number; name: string; description?: string | null; isActive: boolean };
type MenuItem = { id: number; categoryId: number; category: string; name: string; description: string; price: number; isVegetarian: boolean; isSpicy: boolean; isFeatured: boolean; isAvailable: boolean };

function CategoryForm({ onSaved }: { onSaved: () => void }) {
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setError('');
    setSending(true);
    const values = formValues(event);
    try {
      await apiRequest('/categories', { method: 'POST', body: JSON.stringify({ name: values.name, description: values.description || undefined }) });
      form.reset();
      onSaved();
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'Could not create category');
    } finally {
      setSending(false);
    }
  };
  return <form onSubmit={submit} className="flex flex-wrap items-end gap-4 border-t hairline pt-5">
    <label className="block flex-1 min-w-[160px]"><span className="eyebrow block mb-2">New category name</span><input required name="name" data-testid="input-new-category-name" className="w-full bg-transparent border-b border-[#e8d9bb]/25 py-2 text-[#f1e4c6] text-sm" /></label>
    <label className="block flex-1 min-w-[220px]"><span className="eyebrow block mb-2">Description (optional)</span><input name="description" data-testid="input-new-category-description" className="w-full bg-transparent border-b border-[#e8d9bb]/25 py-2 text-[#f1e4c6] text-sm" /></label>
    <button type="submit" disabled={sending} data-testid="button-add-category" className="button-primary disabled:opacity-50"><Plus size={14} /> Add</button>
    {error && <p className="text-sm text-[#df7c5b] w-full">{error}</p>}
  </form>;
}

function ItemForm({ categories, item, onDone }: { categories: Category[]; item?: MenuItem; onDone: () => void }) {
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSending(true);
    const values = formValues(event);
    const payload = {
      categoryId: Number(values.categoryId),
      name: values.name,
      description: values.description,
      price: Number(values.price),
      image: values.image || undefined,
      isVegetarian: values.isVegetarian === 'on',
      isSpicy: values.isSpicy === 'on',
      isFeatured: values.isFeatured === 'on',
      isAvailable: values.isAvailable === 'on',
    };
    try {
      if (item) await apiRequest(`/menu/${item.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      else await apiRequest('/menu', { method: 'POST', body: JSON.stringify(payload) });
      onDone();
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'Could not save this dish');
    } finally {
      setSending(false);
    }
  };
  return <form onSubmit={submit} className="bg-[#30203a] border hairline p-5 md:p-6 space-y-5">
    <div className="grid sm:grid-cols-2 gap-5">
      <label className="block"><span className="eyebrow block mb-2">Name</span><input required name="name" defaultValue={item?.name} data-testid="input-item-name" className="w-full bg-transparent border-b border-[#e8d9bb]/25 py-2 text-[#f1e4c6] text-sm" /></label>
      <label className="block"><span className="eyebrow block mb-2">Category</span><select required name="categoryId" defaultValue={item?.categoryId} data-testid="select-item-category" className="w-full bg-transparent border-b border-[#e8d9bb]/25 py-2 text-[#f1e4c6] text-sm">
        <option value="" className="bg-[#241729]" disabled>Choose a category</option>
        {categories.map((category) => <option key={category.id} value={category.id} className="bg-[#241729]">{category.name}</option>)}
      </select></label>
      <label className="block"><span className="eyebrow block mb-2">Price (Rs)</span><input required name="price" type="number" min="0" step="0.01" defaultValue={item?.price} data-testid="input-item-price" className="w-full bg-transparent border-b border-[#e8d9bb]/25 py-2 text-[#f1e4c6] text-sm" /></label>
      <label className="block"><span className="eyebrow block mb-2">Image URL (optional)</span><input name="image" placeholder="/images/dish.jpg" data-testid="input-item-image" className="w-full bg-transparent border-b border-[#e8d9bb]/25 py-2 text-[#f1e4c6] text-sm" /></label>
    </div>
    <label className="block"><span className="eyebrow block mb-2">Description</span><textarea required name="description" rows={2} defaultValue={item?.description} data-testid="input-item-description" className="w-full resize-none bg-transparent border-b border-[#e8d9bb]/25 py-2 text-[#f1e4c6] text-sm" /></label>
    <div className="flex flex-wrap gap-6 text-sm text-[#e8d9bb]/80">
      <label className="flex items-center gap-2"><input type="checkbox" name="isVegetarian" defaultChecked={item?.isVegetarian} data-testid="checkbox-item-vegetarian" /> Vegetarian</label>
      <label className="flex items-center gap-2"><input type="checkbox" name="isSpicy" defaultChecked={item?.isSpicy} data-testid="checkbox-item-spicy" /> Spicy</label>
      <label className="flex items-center gap-2"><input type="checkbox" name="isFeatured" defaultChecked={item?.isFeatured} data-testid="checkbox-item-featured" /> Featured</label>
      <label className="flex items-center gap-2"><input type="checkbox" name="isAvailable" defaultChecked={item ? item.isAvailable : true} data-testid="checkbox-item-available" /> Available</label>
    </div>
    {error && <p className="text-sm text-[#df7c5b]">{error}</p>}
    <div className="flex items-center gap-4">
      <button type="submit" disabled={sending} data-testid="button-save-item" className="button-primary disabled:opacity-50">{sending ? 'Saving…' : item ? 'Save changes' : 'Add dish'}</button>
      <button type="button" onClick={onDone} data-testid="button-cancel-item" className="text-[#c9b99f]/70 text-xs uppercase tracking-[.1em]">Cancel</button>
    </div>
  </form>;
}

export default function AdminMenu() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [editing, setEditing] = useState<MenuItem | 'new' | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = () => {
    setStatus('loading');
    Promise.all([
      apiRequest<Category[]>('/categories'),
      apiRequest<MenuItem[]>('/menu?available=true'),
      apiRequest<MenuItem[]>('/menu?available=false'),
    ]).then(([categoryData, available, unavailable]) => {
      setCategories(categoryData);
      const merged = [...available, ...unavailable].sort((a, b) => a.name.localeCompare(b.name));
      setItems(merged);
      setStatus('ready');
    }).catch(() => setStatus('error'));
  };

  useEffect(() => { if (user?.role === 'admin') load(); }, [user]);

  const removeItem = async (id: number) => {
    if (!window.confirm('Delete this dish?')) return;
    setBusyId(id);
    try {
      await apiRequest(`/menu/${id}`, { method: 'DELETE' });
      setItems((current) => current.filter((item) => item.id !== id));
    } finally {
      setBusyId(null);
    }
  };

  const removeCategory = async (id: number) => {
    if (!window.confirm('Delete this category? It must have no dishes in it.')) return;
    try {
      await apiRequest(`/categories/${id}`, { method: 'DELETE' });
      load();
    } catch (reason: unknown) {
      window.alert(reason instanceof Error ? reason.message : 'Could not delete category');
    }
  };

  return <AdminShell title="Menu">
    {status === 'loading' && <p className="text-sm text-[#c9b99f]/60 font-mono-custom text-[10px] uppercase tracking-[.12em]">Loading…</p>}
    {status === 'error' && <p className="text-sm text-[#df7c5b]">Could not load the menu.</p>}
    {status === 'ready' && <div className="space-y-14">
      <section>
        <div className="flex items-center justify-between"><h2 className="eyebrow">Categories</h2></div>
        <div className="mt-5 divide-y hairline">
          {categories.map((category) => (
            <div key={category.id} data-testid={`row-category-${category.id}`} className="flex items-center justify-between py-3">
              <div><p className="text-[#f1e4c6] text-sm">{category.name}</p>{category.description && <p className="text-xs text-[#c9b99f]/50">{category.description}</p>}</div>
              <button onClick={() => removeCategory(category.id)} data-testid={`button-delete-category-${category.id}`} aria-label="Delete category" className="text-[#c9b99f]/60 hover:text-[#df7c5b]"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
        <CategoryForm onSaved={load} />
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="eyebrow">Dishes</h2>
          {editing === null && <button onClick={() => setEditing('new')} data-testid="button-new-item" className="button-ghost text-[10px]"><Plus size={13} /> Add a dish</button>}
        </div>

        {editing === 'new' && <div className="mt-5"><ItemForm categories={categories} onDone={() => { setEditing(null); load(); }} /></div>}
        {editing && editing !== 'new' && <div className="mt-5"><ItemForm categories={categories} item={editing} onDone={() => { setEditing(null); load(); }} /></div>}

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left eyebrow border-b hairline"><th className="pb-3 pr-4 font-normal">Dish</th><th className="pb-3 pr-4 font-normal">Category</th><th className="pb-3 pr-4 font-normal">Price</th><th className="pb-3 pr-4 font-normal">Status</th><th className="pb-3 font-normal"></th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} data-testid={`row-item-${item.id}`} className="border-b hairline">
                  <td className="py-3 pr-4 text-[#f1e4c6]">{item.name}{item.isFeatured && <span className="ml-2 text-[10px] text-[#df7c5b] uppercase tracking-[.08em]">Featured</span>}</td>
                  <td className="py-3 pr-4 text-[#c9b99f]/70">{item.category}</td>
                  <td className="py-3 pr-4 text-[#e9bf83] font-mono-custom">{formatPrice(item.price)}</td>
                  <td className="py-3 pr-4 text-xs uppercase tracking-[.08em] text-[#c9b99f]/70">{item.isAvailable ? 'Available' : 'Hidden'}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setEditing(item)} data-testid={`button-edit-item-${item.id}`} className="text-[10px] uppercase tracking-[.08em] text-[#e9bf83]">Edit</button>
                      <button onClick={() => removeItem(item.id)} disabled={busyId === item.id} data-testid={`button-delete-item-${item.id}`} aria-label="Delete dish" className="text-[#c9b99f]/60 hover:text-[#df7c5b] disabled:opacity-40"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>}
  </AdminShell>;
}
