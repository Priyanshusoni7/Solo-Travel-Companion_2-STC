import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { errorMessage } from '../api/client';
import GuestNavbar from '../components/GuestNavbar';
import { PASSWORD_HINT, PASSWORD_RULE } from '../utils/format';
import { COUNTRIES, GENDERS, LANGUAGES, MAX_IMAGE_BYTES } from '../utils/profileOptions';

const STEPS = [
  { id: 1, icon: 'fas fa-user-circle', label: 'Basic Info' },
  { id: 2, icon: 'fas fa-map-marker-alt', label: 'Location' },
  { id: 3, icon: 'fas fa-passport', label: 'Profile' },
];

const EMPTY = {
  name: '', email: '', password: '', phoneNumber: '',
  country: '', state: '', city: '', language: '',
  gender: '', about: '',
};

/** Which step each required field lives on (fields on hidden steps can't use native validation). */
function firstInvalidStep(form, terms) {
  if (!form.name.trim() || !form.email.trim() || !PASSWORD_RULE.test(form.password) || !form.phoneNumber.trim()) return 1;
  if (!form.country || !form.language) return 2;
  if (!form.about.trim() || !terms) return 3;
  return null;
}

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY);
  const [terms, setTerms] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const countryName = COUNTRIES.find(([code]) => code === form.country)?.[1];

  const goTo = (target) => {
    setError('');
    // Moving forward requires the current step to be complete, like the browser's "required" check
    if (target > step) {
      const invalid = firstInvalidStep(form, true);
      if (invalid && invalid < target) {
        setStep(invalid);
        setError(invalid === 1 && form.password && !PASSWORD_RULE.test(form.password)
          ? `Password: ${PASSWORD_HINT}`
          : 'Please fill in all required fields.');
        return;
      }
    }
    setStep(target);
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setProfilePic(null);
      setPreview(null);
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('File size must be less than 5MB');
      e.target.value = '';
      return;
    }
    setProfilePic(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const invalid = firstInvalidStep(form, terms);
    if (invalid) {
      setStep(invalid);
      setError(
        invalid === 3 && !terms
          ? 'Please accept the Terms of Service.'
          : invalid === 1 && form.password && !PASSWORD_RULE.test(form.password)
            ? `Password: ${PASSWORD_HINT}`
            : 'Please fill in all required fields.',
      );
      return;
    }

    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    if (profilePic) data.append('profilePic', profilePic);

    setSubmitting(true);
    setError('');
    try {
      await authApi.register(data);
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setError(errorMessage(err, 'Registration failed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'form-input w-full px-4 py-3 rounded-xl';

  return (
    <div className="bg-black text-white min-h-screen flex flex-col">
      <GuestNavbar currentPage="register" />

      <main className="hero-bg-home min-h-screen flex items-center justify-center px-4 py-32">
        <div className="glass-form p-8 w-full max-w-2xl fade-up">
          <h2 className="text-3xl font-bold gradient-text mb-2 text-center">Join the Adventure</h2>
          <p className="text-gray-400 text-center mb-8">Create your account and connect with solo travelers worldwide</p>

          <div className="mb-8">
            <div className="flex justify-between tabs-underline">
              {STEPS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goTo(s.id)}
                  className={`py-2 px-2 sm:px-4 text-sm sm:text-base ${step === s.id ? 'tab-active' : ''}`}
                >
                  <i className={`${s.icon} mr-2`}></i>
                  {s.label}
                </button>
              ))}
            </div>
            <div className="h-1 w-full bg-gray-800 mt-2">
              <div className="h-1 bg-violet-600 progress-animation" style={{ width: `${33 * step}%` }}></div>
            </div>
          </div>

          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-600/20 border border-red-500/30 text-red-300 text-sm" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {step === 1 && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-gray-300 mb-2"><i className="fas fa-user mr-2"></i>Full Name</label>
                    <input id="name" type="text" value={form.name} onChange={update('name')} className={inputClass} placeholder="Enter your full name" required />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-gray-300 mb-2"><i className="fas fa-envelope mr-2"></i>Email Address</label>
                    <input id="email" type="email" autoComplete="email" value={form.email} onChange={update('email')} className={inputClass} placeholder="your.email@example.com" required />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-gray-300 mb-2"><i className="fas fa-lock mr-2"></i>Password</label>
                    <input id="password" type="password" autoComplete="new-password" value={form.password} onChange={update('password')} className={inputClass} placeholder="Create a strong password" required minLength={8} />
                    <p className={`text-xs mt-1 ${form.password && !PASSWORD_RULE.test(form.password) ? 'text-amber-300' : 'text-gray-400'}`}>{PASSWORD_HINT}</p>
                  </div>
                  <div>
                    <label htmlFor="phoneNumber" className="block text-gray-300 mb-2"><i className="fas fa-phone mr-2"></i>Phone Number</label>
                    <input id="phoneNumber" type="tel" value={form.phoneNumber} onChange={update('phoneNumber')} className={inputClass} placeholder="Your phone number" required />
                  </div>
                </div>
                <div className="mt-8 flex justify-end">
                  <button type="button" onClick={() => goTo(2)} className="bg-violet-600 hover:bg-violet-700 px-6 py-3 rounded-xl font-medium transition-all duration-300 hover-glow">
                    Next <i className="fas fa-arrow-right ml-2"></i>
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="country" className="block text-gray-300 mb-2"><i className="fas fa-globe mr-2"></i>Country</label>
                    <select
                      id="country"
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value, state: '' })}
                      className={inputClass}
                      required
                    >
                      <option value="">Select Your Country</option>
                      {COUNTRIES.map(([code, name]) => (
                        <option key={code} value={code}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="state" className="block text-gray-300 mb-2"><i className="fas fa-map mr-2"></i>State/Province</label>
                    <input
                      id="state"
                      type="text"
                      value={form.state}
                      onChange={update('state')}
                      className={inputClass}
                      placeholder={countryName ? `Select a ${countryName} state/province` : 'Your state or province'}
                    />
                  </div>
                  <div>
                    <label htmlFor="city" className="block text-gray-300 mb-2"><i className="fas fa-city mr-2"></i>City</label>
                    <input id="city" type="text" value={form.city} onChange={update('city')} className={inputClass} placeholder="Your city" />
                  </div>
                  <div>
                    <label htmlFor="language" className="block text-gray-300 mb-2"><i className="fas fa-language mr-2"></i>Primary Language</label>
                    <select id="language" value={form.language} onChange={update('language')} className={inputClass} required>
                      <option value="">Select Your Language</option>
                      {LANGUAGES.map((lang) => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-8 flex justify-between">
                  <button type="button" onClick={() => goTo(1)} className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-xl font-medium transition-all duration-300">
                    <i className="fas fa-arrow-left mr-2"></i> Back
                  </button>
                  <button type="button" onClick={() => goTo(3)} className="bg-violet-600 hover:bg-violet-700 px-6 py-3 rounded-xl font-medium transition-all duration-300 hover-glow">
                    Next <i className="fas fa-arrow-right ml-2"></i>
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="profilePic" className="block text-gray-300 mb-2"><i className="fas fa-camera mr-2"></i>Profile Picture</label>
                    <div className="flex items-center space-x-4">
                      <div className="relative w-24 h-24 rounded-full bg-violet-600/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {preview ? (
                          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <i className="fas fa-user text-3xl text-violet-300"></i>
                        )}
                      </div>
                      <div className="flex-1">
                        <input type="file" id="profilePic" accept="image/*" className="hidden" onChange={handleImage} />
                        <label
                          htmlFor="profilePic"
                          className="cursor-pointer bg-violet-600/20 hover:bg-violet-600/30 px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition-all duration-300"
                        >
                          <i className="fas fa-upload"></i>
                          Choose Photo
                        </label>
                        <p className="text-xs text-gray-400 mt-2">Maximum size: 5MB. Supported formats: JPG, PNG</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="gender" className="block text-gray-300 mb-2"><i className="fas fa-venus-mars mr-2"></i>Gender</label>
                    <select id="gender" value={form.gender} onChange={update('gender')} className={inputClass}>
                      {GENDERS.map(([value, label]) => (
                        <option key={label} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="about" className="block text-gray-300 mb-2"><i className="fas fa-comment-alt mr-2"></i>About You</label>
                    <textarea
                      id="about"
                      value={form.about}
                      onChange={update('about')}
                      className={`${inputClass} h-32`}
                      placeholder="Tell us about yourself and your travel interests..."
                      required
                    ></textarea>
                    <p className="text-xs text-gray-400 mt-2">
                      Share your travel experiences, interests, and what kind of travel companions you&apos;re looking to connect with.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={terms}
                      onChange={(e) => setTerms(e.target.checked)}
                      className="w-4 h-4 bg-transparent border border-violet-400 rounded"
                    />
                    <label htmlFor="terms" className="text-gray-300 text-sm">
                      I agree to the Terms of Service and Privacy Policy
                    </label>
                  </div>
                </div>

                <div className="mt-8 flex justify-between">
                  <button type="button" onClick={() => goTo(2)} className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-xl font-medium transition-all duration-300">
                    <i className="fas fa-arrow-left mr-2"></i> Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-violet-600 hover:bg-violet-700 px-6 py-3 rounded-xl font-medium transition-all duration-300 hover-glow disabled:opacity-60"
                  >
                    <i className="fas fa-user-plus mr-2"></i> {submitting ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="flex flex-col md:flex-row justify-between items-center mt-10 pt-6 border-t border-gray-800">
            <p className="text-gray-400 text-center md:text-left mb-4 md:mb-0">
              Already have an account?{' '}
              <Link to="/login" className="text-violet-400 hover:text-violet-300">Login here</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
