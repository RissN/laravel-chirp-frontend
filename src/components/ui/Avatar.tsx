
import { Link } from 'react-router-dom';

interface AvatarProps {
  src?: string | null;
  name: string;
  username?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  linkToProfile?: boolean;
}

export default function Avatar({ 
  src, 
  name, 
  username,
  size = 'md', 
  className = '',
  linkToProfile = true
}: AvatarProps) {
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-32 h-32 border-4 border-[var(--bg-color)]'
  };

  const currentSize = sizeClasses[size];
  const url = src || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;

  const ImageTag = <img src={url} alt={name} className={`rounded-full object-cover bg-[var(--border-color)] ${currentSize} ${className}`} />;

  if (linkToProfile && username) {
    return (
      <Link to={`/${username}`} className="hover:opacity-90 transition inline-block">
        {ImageTag}
      </Link>
    );
  }

  return ImageTag;
}
