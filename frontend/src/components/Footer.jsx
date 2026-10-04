import { Link } from 'react-router-dom';

function SocialLinks({ size = 'w-10 h-10' }) {
  return (
    <div className="flex space-x-3">
      {['fab fa-facebook-f', 'fab fa-twitter', 'fab fa-instagram'].map((icon) => (
        <a
          key={icon}
          href="#"
          onClick={(e) => e.preventDefault()}
          aria-label={icon.split('-')[1]}
          className={`${size} rounded-full bg-gray-800/50 flex items-center justify-center text-gray-400 hover:text-violet-400 hover:bg-gray-800 transition duration-300`}
        >
          <i className={icon}></i>
        </a>
      ))}
    </div>
  );
}

/**
 * The templates used a few footer styles:
 *  - "simple": one copyright line (forms, friends, auth)
 *  - "brand":  logo + social links (profile, community)
 *  - "explore": dashboard footer
 */
export default function Footer({ variant = 'simple', compact = false }) {
  if (variant === 'brand') {
    return (
      <footer className={`bg-black/80 backdrop-blur-sm text-white text-center ${compact ? 'py-4' : 'py-8'} mt-auto border-t border-violet-900/20`}>
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <Link to="/" className={`${compact ? 'text-xl' : 'text-2xl'} font-bold text-gradient`}>
                STC
              </Link>
              <p className="text-sm text-gray-400 mt-1">Connect. Explore. Experience.</p>
            </div>
            <SocialLinks size={compact ? 'w-8 h-8' : 'w-10 h-10'} />
          </div>
          <div className={`${compact ? 'mt-2' : 'mt-6 pt-6 border-t border-gray-800'}`}>
            <p className={compact ? 'text-xs' : ''}>&copy; 2025 Solo Travel Companion. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    );
  }

  if (variant === 'explore') {
    return (
      <footer className="bg-black/80 backdrop-blur-md mt-20 py-8 border-t border-violet-950/30 relative z-10">
        <div className="container mx-auto px-4 text-center text-xs text-gray-400">
          <p className="font-bold text-sm text-white mb-1">Solo Travel Companion</p>
          <p className="text-violet-300/70 mb-4">Connect. Explore. Experience the world together.</p>
          <p>&copy; 2026 Solo Travel Companion. All Rights Reserved.</p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-black/80 backdrop-blur-md text-gray-400 text-center py-6 mt-auto">
      <p>&copy; 2025 Solo Travel Companion. All Rights Reserved.</p>
    </footer>
  );
}
