import { Link } from 'react-router-dom';

/** Navbar for visitors (was fragments/navbar.html :: navbar-guest(currentPage)). */
export default function GuestNavbar({ currentPage }) {
  return (
    <nav className="fixed top-0 left-0 w-full bg-black/70 backdrop-blur-lg shadow-lg py-4 z-50">
      <div className="container mx-auto flex justify-between items-center px-6">
        <Link to="/" className="text-4xl font-black gradient-text-animated tracking-tight">
          STC
        </Link>
        <div className="flex gap-6 items-center">
          {currentPage !== 'home' && (
            <Link to="/" className="text-gray-300 hover:text-violet-400 transition-colors duration-300">
              Home
            </Link>
          )}
          {currentPage !== 'login' && (
            <Link to="/login" className="text-gray-300 hover:text-violet-400 transition-colors duration-300">
              Login
            </Link>
          )}
          {currentPage !== 'register' && (
            <Link
              to="/register"
              className="bg-violet-600 hover:bg-violet-700 px-6 py-2.5 rounded-xl font-medium transition-all duration-300 hover-glow"
            >
              Join Now
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
