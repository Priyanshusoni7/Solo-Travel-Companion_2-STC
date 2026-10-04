import { DEFAULT_AVATAR } from '../utils/format';

/** Profile picture with the same /images/userimg.png fallback the templates used. */
export default function Avatar({ src, alt = 'Profile Image', className = 'w-10 h-10 rounded-full object-cover' }) {
  return (
    <img
      src={src || DEFAULT_AVATAR}
      alt={alt}
      className={className}
      onError={(e) => {
        if (!e.currentTarget.src.endsWith(DEFAULT_AVATAR)) e.currentTarget.src = DEFAULT_AVATAR;
      }}
    />
  );
}
