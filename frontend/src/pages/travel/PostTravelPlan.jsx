import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { travelApi } from '../../api';
import { errorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import Footer from '../../components/Footer';
import TravelPlanForm from '../../components/TravelPlanForm';

export default function PostTravelPlan() {
  const navigate = useNavigate();
  const notify = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (plan, { coverFile }) => {
    setSubmitting(true);
    setError('');
    try {
      const created = await travelApi.create(plan);
      if (coverFile) {
        const data = new FormData();
        data.append('image', coverFile);
        try {
          await travelApi.uploadCover(created.travelId, data);
        } catch (err) {
          notify(`Plan created, but the cover photo failed: ${errorMessage(err)}`, 'error');
          navigate('/user/travel/myplans');
          return;
        }
      }
      notify('Travel plan created!');
      navigate('/user/travel/myplans');
    } catch (err) {
      setError(errorMessage(err, 'Could not create the travel plan'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-black to-violet-900 text-white min-h-screen flex flex-col">
      <main className="container mx-auto px-6 mt-24 mb-12 flex-grow">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-violet-400 mb-2">Create Travel Plan</h1>
            <p className="text-gray-400">Share your travel plans and find companions for your journey</p>
          </div>

          <div className="glass-form p-8 fade-up">
            {error && (
              <div className="mb-6 px-4 py-3 rounded-xl bg-red-600/20 border border-red-500/30 text-red-300 text-sm" role="alert">{error}</div>
            )}
            <TravelPlanForm
              submitting={submitting}
              onSubmit={handleSubmit}
              onCancel={() => navigate('/user/dashboard')}
              submitLabel="Create Plan"
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
