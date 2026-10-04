import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import GuestNavbar from '../components/GuestNavbar';

const FEATURES = [
  { title: '🌏 Connect Globally', text: 'Find travel companions from around the world who share your passion for adventure.' },
  { title: '🤝 Plan Together', text: 'Create and join travel plans, coordinate with companions, and make memories together.' },
  { title: '💬 Stay Connected', text: 'Chat with fellow travelers, share tips, and build lasting friendships along the way.' },
];

export default function Home() {
  const { user } = useAuth();
  const cta = user
    ? { to: '/user/dashboard', hero: 'Explore Now', bottom: 'Explore Now' }
    : { to: '/register', hero: 'Start Your Journey', bottom: 'Join Free Today' };

  return (
    <div className="bg-black text-white min-h-screen flex flex-col">
      {user ? <Navbar /> : <GuestNavbar currentPage="home" />}

      <header className="hero-bg-home min-h-screen flex items-center justify-center px-4 py-32">
        <div className="text-center max-w-4xl mx-auto fade-up">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight gradient-text-animated mb-8">
            Travel Together,
            <br />
            Adventure Forever
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Join a community of passionate travelers. Share experiences, meet companions, and create unforgettable
            memories around the world.
          </p>
          <div className="flex gap-6 justify-center">
            <Link
              to={cta.to}
              className="bg-violet-600 hover:bg-violet-700 px-8 py-4 rounded-xl font-medium text-lg transition-all duration-300 hover-glow"
            >
              {cta.hero}
            </Link>
          </div>
        </div>
      </header>

      <section className="container mx-auto py-24 px-6">
        <div className="grid md:grid-cols-3 gap-8">
          {FEATURES.map((feature, i) => (
            <div key={feature.title} className="glass-effect p-8 fade-up" style={{ animationDelay: `${(i + 1) * 100}ms` }}>
              <h3 className="text-2xl font-bold gradient-text mb-4">{feature.title}</h3>
              <p className="text-gray-400">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-r from-violet-900 to-indigo-900 py-20 px-4">
        <div className="container mx-auto text-center fade-up">
          <h2 className="text-4xl font-bold mb-6">Ready to Begin Your Adventure?</h2>
          <p className="text-xl text-gray-300 mb-8">Join thousands of travelers already connecting worldwide.</p>
          <Link
            to={cta.to}
            className="bg-white text-violet-900 px-8 py-4 rounded-xl font-bold text-lg inline-block hover:bg-gray-100 transition-all duration-300 hover-glow"
          >
            {cta.bottom}
          </Link>
        </div>
      </section>
    </div>
  );
}
