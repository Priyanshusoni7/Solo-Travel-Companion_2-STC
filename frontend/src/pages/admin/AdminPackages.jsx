import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../api';
import { errorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import Loading from '../../components/Loading';
import { formatDate, todayInputDate } from '../../utils/format';

const PLAN_TYPES = ['Adventure', 'Luxury', 'Budget', 'Cultural', 'Beach', 'Mountains'];

const EMPTY = {
  title: '',
  destination: '',
  description: '',
  startDate: '',
  endDate: '',
  price: '',
  planType: 'Adventure',
  maxParticipants: '',
  featured: true,
};

/**
 * Featured packages (StaticPlan). These used to be created only through an unauthenticated
 * Postman call to /static-plans/create; creating them is now an admin feature.
 */
export default function AdminPackages() {
  const notify = useToast();
  const [plans, setPlans] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(() => {
    adminApi.staticPlans().then(setPlans).catch((err) => notify(errorMessage(err, 'Could not load packages'), 'error'));
  }, [notify]);

  useEffect(load, [load]);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const create = async (e) => {
    e.preventDefault();
    if (image && image.size > 5 * 1024 * 1024) {
      notify('Image must be smaller than 5MB', 'error');
      return;
    }
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    if (image) data.append('image', image);
    setSaving(true);
    try {
      await adminApi.createStaticPlan(data);
      notify('Package created');
      setForm(EMPTY);
      setImage(null);
      setShowForm(false);
      load();
    } catch (err) {
      notify(errorMessage(err, 'Could not create package'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleFeatured = async (plan) => {
    try {
      const updated = await adminApi.setFeatured(plan.staticPlanId, !plan.featured);
      setPlans((list) => list.map((p) => (p.staticPlanId === updated.staticPlanId ? updated : p)));
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  const remove = async (plan) => {
    if (!window.confirm(`Delete the package "${plan.title}"? This cannot be undone.`)) return;
    try {
      await adminApi.deleteStaticPlan(plan.staticPlanId);
      notify('Package deleted');
      setPlans((list) => list.filter((p) => p.staticPlanId !== plan.staticPlanId));
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  const input = 'form-input w-full px-3 py-2.5 rounded-xl text-sm';

  return (
    <div className="space-y-6 fade-up">
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <i className="fas fa-gem text-violet-400"></i> Featured Packages
            </h2>
            <p className="text-xs text-gray-400 mt-1">Packages marked as featured appear in the slider on the Explore page.</p>
          </div>
          <button type="button" onClick={() => setShowForm((s) => !s)} className="action-btn px-4 py-2 rounded-xl text-xs whitespace-nowrap">
            <i className={`fas ${showForm ? 'fa-times' : 'fa-plus'} mr-1.5`}></i> {showForm ? 'Close' : 'New package'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={create} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-6">
            <div>
              <label htmlFor="pkg-title" className="block text-gray-300 mb-1 text-xs">Title</label>
              <input id="pkg-title" required value={form.title} onChange={update('title')} className={input} />
            </div>
            <div>
              <label htmlFor="pkg-destination" className="block text-gray-300 mb-1 text-xs">Destination</label>
              <input id="pkg-destination" required value={form.destination} onChange={update('destination')} className={input} />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="pkg-description" className="block text-gray-300 mb-1 text-xs">Description</label>
              <textarea id="pkg-description" required rows={3} value={form.description} onChange={update('description')} className={input}></textarea>
            </div>
            <div>
              <label htmlFor="pkg-start" className="block text-gray-300 mb-1 text-xs">Start date</label>
              <input id="pkg-start" type="date" required min={todayInputDate()} value={form.startDate} onChange={update('startDate')} className={input} />
            </div>
            <div>
              <label htmlFor="pkg-end" className="block text-gray-300 mb-1 text-xs">End date</label>
              <input id="pkg-end" type="date" required min={form.startDate || todayInputDate()} value={form.endDate} onChange={update('endDate')} className={input} />
            </div>
            <div>
              <label htmlFor="pkg-price" className="block text-gray-300 mb-1 text-xs">Price (₹)</label>
              <input id="pkg-price" type="number" min="0" step="0.01" required value={form.price} onChange={update('price')} className={input} />
            </div>
            <div>
              <label htmlFor="pkg-max" className="block text-gray-300 mb-1 text-xs">Max participants</label>
              <input id="pkg-max" type="number" min="1" required value={form.maxParticipants} onChange={update('maxParticipants')} className={input} />
            </div>
            <div>
              <label htmlFor="pkg-type" className="block text-gray-300 mb-1 text-xs">Plan type</label>
              <select id="pkg-type" value={form.planType} onChange={update('planType')} className={input}>
                {PLAN_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="pkg-image" className="block text-gray-300 mb-1 text-xs">Image (optional, max 5MB)</label>
              <input id="pkg-image" type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0] || null)} className="text-xs text-gray-300 w-full" />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" checked={form.featured} onChange={update('featured')} /> Show as featured
            </label>
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" disabled={saving} className="bg-violet-600 hover:bg-violet-700 px-6 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60">
                {saving ? 'Saving...' : 'Create package'}
              </button>
            </div>
          </form>
        )}
      </div>

      {!plans && <Loading />}
      {plans?.length === 0 && <div className="glass-panel p-10 text-center text-gray-400 text-sm">No packages yet.</div>}

      {plans?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.staticPlanId} className="glass-panel overflow-hidden flex flex-col">
              <div className="h-36 bg-purple-900/20 relative">
                {plan.imageUrl ? (
                  <img src={plan.imageUrl} alt={plan.destination} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <i className="fas fa-campground text-3xl text-violet-300"></i>
                  </div>
                )}
                <span className="absolute top-3 right-3 bg-violet-600/90 text-white px-2.5 py-1 rounded-full text-[10px] font-bold">{plan.planType}</span>
              </div>
              <div className="p-5 flex-grow flex flex-col">
                <h3 className="font-bold truncate">{plan.title}</h3>
                <p className="text-xs text-violet-300 mt-1">
                  <i className="fas fa-map-marker-alt mr-1"></i>
                  {plan.destination}
                </p>
                <p className="text-xs text-gray-400 mt-2 line-clamp-2 flex-grow">{plan.description}</p>
                <div className="text-xs text-gray-300 mt-3 flex justify-between">
                  <span>₹{Number(plan.price || 0).toLocaleString('en-IN')}</span>
                  <span>
                    {formatDate(plan.startDate, 'MMM dd')} - {formatDate(plan.endDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                  <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                    <input type="checkbox" checked={!!plan.featured} onChange={() => toggleFeatured(plan)} /> Featured
                  </label>
                  <button type="button" onClick={() => remove(plan)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-red-600 hover:bg-red-700 text-white">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
