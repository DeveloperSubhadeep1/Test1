import React from 'react';

// A few simple, stylish SVG avatars
const avatarSvgs: { [key: string]: React.ReactNode } = {
  avatar1: (
    <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <mask id="mask__beam" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36"><rect width="36" height="36" rx="72" fill="#FFFFFF"></rect></mask>
      <g mask="url(#mask__beam)">
        <rect width="36" height="36" fill="#0c8f8f"></rect>
        <rect x="0" y="0" width="36" height="36" transform="translate(4 4) rotate(268 18 18) scale(1.1)" fill="#ffad08" rx="36"></rect>
        <g transform="translate(-4 -3) rotate(8 18 18)">
          <path d="M15 20c2 1 4 1 6 0" stroke="#000000" fill="none" strokeLinecap="round"></path>
          <rect x="14" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#000000"></rect>
          <rect x="20" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#000000"></rect>
        </g>
      </g>
    </svg>
  ),
  avatar2: (
    <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <mask id="mask__bauhaus" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36"><rect width="36" height="36" rx="72" fill="#FFFFFF"></rect></mask>
        <g mask="url(#mask__bauhaus)">
            <rect width="36" height="36" fill="#f0db59"></rect>
            <rect x="0" y="0" width="36" height="36" transform="translate(5 5) rotate(106 18 18) scale(1.1)" fill="#1c7c54" rx="36"></rect>
            <circle cx="18" cy="18" r="16" transform="translate(8 8)" fill="#000000"></circle>
            <line x1="0" y1="18" x2="36" y2="18" strokeWidth="2" stroke="#000000" transform="translate(1 0) rotate(22 18 18)"></line>
        </g>
    </svg>
  ),
  avatar3: (
    <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <mask id="mask__pixel" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36"><rect width="36" height="36" rx="72" fill="#FFFFFF"></rect></mask>
      <g mask="url(#mask__pixel)">
        <rect width="36" height="36" fill="#58a6ff"></rect>
        <path fillRule="evenodd" clipRule="evenodd" d="M18 18h3v3h-3v-3zm-6 0h3v3h-3v-3zm12 0h3v3h-3v-3zM6 18h3v3H6v-3zm3-6h3v3H9v-3zm12 0h3v3h-3v-3zm-6-6h3v3h-3V6zm-6 0h3v3H9V6zm12 0h3v3h-3V6z" fill="#FFFFFF"></path>
      </g>
    </svg>
  ),
  avatar4: (
     <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <mask id="mask__ring" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36"><rect width="36" height="36" rx="72" fill="#FFFFFF"></rect></mask>
        <g mask="url(#mask__ring)">
            <rect width="36" height="36" fill="#238636"></rect>
            <path d="M36 18c0 9.94-8.06 18-18 18S0 27.94 0 18 8.06 0 18 0s18 8.06 18 18z" fill="#161b22"></path>
            <path d="M36 18c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" fill="#FFFFFF"></path>
        </g>
    </svg>
  ),
};

export const AVATAR_OPTIONS = Object.keys(avatarSvgs);

interface AvatarProps {
  avatarId: string;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ avatarId, className = 'h-8 w-8' }) => {
  return (
    <div className={className}>
      {avatarSvgs[avatarId] || avatarSvgs['avatar1']}
    </div>
  );
};
