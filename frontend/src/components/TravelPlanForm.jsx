import { useState } from 'react';
import { itineraryEntries, todayInputDate, tripLengthDays } from '../utils/format';
import { MAX_IMAGE_BYTES } from '../utils/profileOptions';

export const INTERESTS = [
  ['Adventure', 'Adventure'],
  ['Culture', 'Culture'],
  ['Food', 'Food & Cuisine'],
  ['Nature', 'Nature & Wildlife'],
  ['Photography', 'Photography'],
  ['History', 'History'],
  ['Relaxation', 'Relaxation'],
  ['Shopping', 'Shopping'],
];

/** Turns the stored itinerary map into an ordered list of day texts (day numbers are re-derived). */
function toDayList(dayItineraries) {
  const entries = itineraryEntries(dayItineraries);
  return entries.length ? entries.map(([, text]) => text) : [''];
}

/**
 * Shared create/edit form (was postTravelPlan.html and editTravelPlan.html).
 *
 * Like the old create page, choosing dates auto-adds itinerary days to match the trip length
 * (it never auto-removes) and days can be added/removed.
 *
 * onSubmit(plan, { coverFile, removeCover }) - the cover photo is uploaded separately by the page
 * after the plan is saved (POST /api/travel/{id}/cover).
 */
export default function TravelPlanForm({ initial, isEdit = false, submitting, onSubmit, onCancel, submitLabel }) {
  const [form, setForm] = useState({
    destination: initial?.destination || '',
    startDate: initial?.startDate || '',
    endDate: initial?.endDate || '',
    interest: initial?.interest || '',
    planStatus: initial?.planStatus || 'OPEN',
    maxCompanions: initial?.maxCompanions ?? '',
  });
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [coverError, setCoverError] = useState('');
  const existingCover = removeCover ? null : initial?.coverImageUrl;

  const chooseCover = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      setCoverError('Image must be smaller than 5MB');
      e.target.value = '';
      return;
    }
    setCoverError('');
    setCoverFile(file);
    setRemoveCover(false);
    const reader = new FileReader();
    reader.onload = (ev) => setCoverPreview(ev.target.result);
    reader.readAsDataURL(file);
  };
  const [days, setDays] = useState(() => toDayList(initial?.dayItineraries));

  const interestOptions = form.interest && !INTERESTS.some(([v]) => v === form.interest)
    ? [[form.interest, form.interest], ...INTERESTS]
    : INTERESTS;

  const setDate = (field) => (e) => {
    const next = { ...form, [field]: e.target.value };
    setForm(next);
    const length = tripLengthDays(next.startDate, next.endDate);
    if (length && length > days.length && length <= 60) {
      setDays((current) => [...current, ...Array(length - current.length).fill('')]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dayItineraries = {};
    days.forEach((text, i) => {
      if (text.trim()) dayItineraries[i + 1] = text;
    });
    const maxCompanions = form.maxCompanions === '' ? null : Number(form.maxCompanions);
    onSubmit({ ...form, maxCompanions, destination: form.destination.trim(), dayItineraries }, { coverFile, removeCover });
  };

  const minStart = isEdit ? undefined : todayInputDate();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="destination" className="block text-gray-300 mb-2">Destination</label>
        <input
          id="destination"
          type="text"
          value={form.destination}
          onChange={(e) => setForm({ ...form, destination: e.target.value })}
          className="form-input w-full px-4 py-3 rounded-xl"
          placeholder="Where are you planning to go?"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="startDate" className="block text-gray-300 mb-2">Start Date</label>
          <input id="startDate" type="date" min={minStart} value={form.startDate} onChange={setDate('startDate')} className="form-input w-full px-4 py-3 rounded-xl" required />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-gray-300 mb-2">End Date</label>
          <input id="endDate" type="date" min={form.startDate || minStart} value={form.endDate} onChange={setDate('endDate')} className="form-input w-full px-4 py-3 rounded-xl" required />
        </div>
      </div>

      <div>
        <label className="block text-gray-300 mb-2">Itinerary (Day-by-Day)</label>
        <div className="space-y-3">
          {days.map((text, i) => (
            <div key={i} className="flex items-start gap-3 slide-in">
              <div className="bg-violet-900/50 rounded-lg px-3 py-2 text-sm font-medium w-20 text-center flex-shrink-0 mt-1">Day {i + 1}</div>
              <textarea
                aria-label={`Day ${i + 1} itinerary`}
                value={text}
                onChange={(e) => setDays(days.map((d, j) => (j === i ? e.target.value : d)))}
                className="form-input w-full px-4 py-3 rounded-xl"
                placeholder="What do you plan to do on this day?"
                required={!isEdit && i === 0}
              ></textarea>
              <button
                type="button"
                aria-label={`Remove day ${i + 1}`}
                onClick={() => setDays(days.filter((_, j) => j !== i))}
                className={`text-gray-400 hover:text-red-400 mt-3 transition ${i === 0 ? 'invisible' : ''}`}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setDays([...days, ''])}
            className="text-violet-400 hover:text-violet-300 flex items-center text-sm font-medium transition hover:scale-105"
          >
            <i className="fas fa-plus-circle mr-2"></i> Add Another Day
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="interest" className="block text-gray-300 mb-2">Interests</label>
          <select
            id="interest"
            value={form.interest}
            onChange={(e) => setForm({ ...form, interest: e.target.value })}
            className="form-input w-full px-4 py-3 rounded-xl"
            required
          >
            <option value="">Select your primary interest</option>
            {interestOptions.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="planStatus" className="block text-gray-300 mb-2">Plan Status</label>
          <select
            id="planStatus"
            value={form.planStatus}
            onChange={(e) => setForm({ ...form, planStatus: e.target.value })}
            className="form-input w-full px-4 py-3 rounded-xl"
            required
          >
            <option value="OPEN">Open for Companions</option>
            <option value="CLOSED">Not Accepting Companions</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="maxCompanions" className="block text-gray-300 mb-2">Maximum Companions (optional)</label>
          <input
            id="maxCompanions"
            type="number"
            min="1"
            max="100"
            value={form.maxCompanions}
            onChange={(e) => setForm({ ...form, maxCompanions: e.target.value })}
            className="form-input w-full px-4 py-3 rounded-xl"
            placeholder="No limit"
          />
          <p className="text-xs text-gray-400 mt-1">When this many companions are accepted, no new join requests are possible.</p>
        </div>
        <div>
          <span className="block text-gray-300 mb-2">Cover Photo (optional)</span>
          <div className="flex items-center gap-3">
            <div className="w-24 h-16 rounded-lg overflow-hidden bg-violet-900/30 flex items-center justify-center flex-shrink-0">
              {coverPreview || existingCover ? (
                <img src={coverPreview || existingCover} alt="Cover preview" className="w-full h-full object-cover" />
              ) : (
                <i className="fas fa-image text-violet-300"></i>
              )}
            </div>
            <div className="space-y-1">
              <input type="file" id="coverPhoto" accept="image/*" className="hidden" onChange={chooseCover} />
              <label htmlFor="coverPhoto" className="cursor-pointer inline-flex items-center gap-2 bg-violet-600/20 hover:bg-violet-600/30 px-3 py-1.5 rounded-lg text-sm">
                <i className="fas fa-upload"></i> {coverPreview || existingCover ? 'Change' : 'Choose'}
              </label>
              {(coverPreview || existingCover) && (
                <button
                  type="button"
                  onClick={() => {
                    setCoverFile(null);
                    setCoverPreview(null);
                    setRemoveCover(!!initial?.coverImageUrl);
                  }}
                  className="block text-xs text-red-300 hover:text-red-200"
                >
                  Remove
                </button>
              )}
              {coverError && <p className="text-xs text-red-300">{coverError}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="bg-transparent border border-violet-600 hover:bg-violet-600/20 px-6 py-3 rounded-xl transition duration-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="bg-violet-600 hover:bg-violet-700 px-8 py-3 rounded-xl font-medium transition duration-300 disabled:opacity-60"
        >
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
