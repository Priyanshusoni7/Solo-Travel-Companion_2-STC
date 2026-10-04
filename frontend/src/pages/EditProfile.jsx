import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { userApi } from '../api';
import { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Avatar from '../components/Avatar';
import Footer from '../components/Footer';
import { COUNTRIES, GENDERS, LANGUAGES, MAX_IMAGE_BYTES } from '../utils/profileOptions';

/** Edit own profile. E-mail (login name) is shown read-only; password changes are not part of this page. */
export default function EditProfile() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const notify = useToast();
  const [form, setForm] = useState({
    name: user.name || '',
    phoneNumber: user.phoneNumber || '',
    gender: user.gender || '',
    language: user.language || '',
    country: user.country || '',
    state: user.state || '',
    city: user.city || '',
    about: user.about || '',
  });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const choosePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      setError('File size must be less than 5MB');
      e.target.value = '';
      return;
    }
    setError('');
    setPhoto(file);
    setRemovePhoto(false);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    if (photo) data.append('profilePic', photo);
    data.append('removeProfilePic', String(removePhoto));

    setSaving(true);
    setError('');
    try {
      await userApi.updateProfile(data);
      await refresh();
      notify('Profile updated');
      navigate('/user/profile');
    } catch (err) {
      setError(errorMessage(err, 'Could not save your profile'));
    } finally {
      setSaving(false);
    }
  };

  const input = 'form-input w-full px-4 py-3 rounded-xl';
  const currentPhoto = removePhoto ? null : preview || user.profilePic;
  const countryName = COUNTRIES.find(([code]) => code === form.country)?.[1];
  const countryOptions = form.country && !COUNTRIES.some(([code]) => code === form.country)
    ? [[form.country, form.country], ...COUNTRIES]
    : COUNTRIES;
  const languageOptions = form.language && !LANGUAGES.includes(form.language) ? [form.language, ...LANGUAGES] : LANGUAGES;

  return (
    <div className="hero-bg-app text-white min-h-screen flex flex-col">
      <main className="container mx-auto px-4 mt-24 mb-12 flex-grow">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gradient mb-6 fade-up">Edit Profile</h1>

          <form onSubmit={submit} className="glass-morphism rounded-2xl p-6 md:p-8 space-y-6 fade-up">
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-600/20 border border-red-500/30 text-red-300 text-sm" role="alert">{error}</div>
            )}

            <div className="flex items-center gap-5">
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0">
                <Avatar src={currentPhoto} className="w-full h-full object-cover" />
              </div>
              <div className="space-y-2">
                <input type="file" id="photo" accept="image/*" className="hidden" onChange={choosePhoto} />
                <label htmlFor="photo" className="cursor-pointer inline-flex items-center gap-2 bg-violet-600/30 hover:bg-violet-600/50 px-4 py-2 rounded-xl text-sm">
                  <i className="fas fa-upload"></i> Change photo
                </label>
                {(user.profilePic || photo) && !removePhoto && (
                  <button
                    type="button"
                    onClick={() => {
                      setRemovePhoto(true);
                      setPhoto(null);
                      setPreview(null);
                    }}
                    className="block text-xs text-red-300 hover:text-red-200"
                  >
                    Remove photo
                  </button>
                )}
                <p className="text-xs text-gray-400">JPG or PNG, max 5MB</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="name" className="block text-gray-300 mb-2 text-sm">Full Name</label>
                <input id="name" value={form.name} onChange={update('name')} className={input} required />
              </div>
              <div>
                <label htmlFor="email" className="block text-gray-300 mb-2 text-sm">Email (cannot be changed)</label>
                <input id="email" value={user.email} disabled className={`${input} opacity-60 cursor-not-allowed`} />
              </div>
              <div>
                <label htmlFor="phoneNumber" className="block text-gray-300 mb-2 text-sm">Phone Number</label>
                <input id="phoneNumber" type="tel" value={form.phoneNumber} onChange={update('phoneNumber')} className={input} />
              </div>
              <div>
                <label htmlFor="gender" className="block text-gray-300 mb-2 text-sm">Gender</label>
                <select id="gender" value={form.gender} onChange={update('gender')} className={input}>
                  {GENDERS.map(([value, label]) => (
                    <option key={label} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="country" className="block text-gray-300 mb-2 text-sm">Country</label>
                <select id="country" value={form.country} onChange={update('country')} className={input}>
                  <option value="">Select Your Country</option>
                  {countryOptions.map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="state" className="block text-gray-300 mb-2 text-sm">State/Province</label>
                <input
                  id="state"
                  value={form.state}
                  onChange={update('state')}
                  className={input}
                  placeholder={countryName ? `Select a ${countryName} state/province` : 'Your state or province'}
                />
              </div>
              <div>
                <label htmlFor="city" className="block text-gray-300 mb-2 text-sm">City</label>
                <input id="city" value={form.city} onChange={update('city')} className={input} />
              </div>
              <div>
                <label htmlFor="language" className="block text-gray-300 mb-2 text-sm">Primary Language</label>
                <select id="language" value={form.language} onChange={update('language')} className={input}>
                  <option value="">Select Your Language</option>
                  {languageOptions.map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="about" className="block text-gray-300 mb-2 text-sm">About You</label>
              <textarea id="about" value={form.about} onChange={update('about')} maxLength={1000} className={`${input} h-32`}></textarea>
            </div>

            <div className="flex justify-end gap-3">
              <Link to="/user/profile" className="px-6 py-3 rounded-xl border border-violet-600 hover:bg-violet-600/20 transition">
                Cancel
              </Link>
              <button type="submit" disabled={saving} className="bg-violet-600 hover:bg-violet-700 px-6 py-3 rounded-xl font-medium disabled:opacity-60">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer variant="brand" />
    </div>
  );
}
