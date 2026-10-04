import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { travelApi } from '../../api';
import { errorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import Loading from '../../components/Loading';
import TravelPlanForm from '../../components/TravelPlanForm';

export default function EditTravelPlan() {
  const { id } = useParams();
  const navigate = useNavigate();
  const notify = useToast();
  const [plan, setPlan] = useState(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    travelApi
      .get(id)
      .then((data) => {
        // Same rule as before: only the owner may edit
        if (!data.isOwner) setUnauthorized(true);
        else setPlan(data.plan);
      })
      .catch(() => setUnauthorized(true));
  }, [id]);

  if (unauthorized) return <Navigate to="/user/travel/myplans" replace />;
  if (!plan) return <Loading fullScreen />;

  const handleSubmit = async (updated, { coverFile, removeCover }) => {
    setSubmitting(true);
    setError('');
    try {
      await travelApi.update(id, updated);
      try {
        if (coverFile) {
          const data = new FormData();
          data.append('image', coverFile);
          await travelApi.uploadCover(id, data);
        } else if (removeCover) {
          await travelApi.removeCover(id);
        }
      } catch (err) {
        notify(`Plan saved, but the cover photo failed: ${errorMessage(err)}`, 'error');
        navigate('/user/travel/myplans');
        return;
      }
      notify('Travel plan updated!');
      navigate('/user/travel/myplans');
    } catch (err) {
      setError(errorMessage(err, 'Could not save the travel plan'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen flex flex-col pt-8">
      <main className="hero-bg-plan flex-grow py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold gradient-text mb-8 fade-up">Edit Your Adventure</h1>
          <div className="glass-detail p-8 fade-up">
            {error && (
              <div className="mb-6 px-4 py-3 rounded-xl bg-red-600/20 border border-red-500/30 text-red-300 text-sm" role="alert">{error}</div>
            )}
            <TravelPlanForm
              initial={plan}
              isEdit
              submitting={submitting}
              onSubmit={handleSubmit}
              onCancel={() => navigate('/user/travel/myplans')}
              submitLabel="Save Changes"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
