import React from 'react';

// A few simple, stylish SVG avatars for defaults
export const avatarSvgs: { [key: string]: React.ReactNode } = {
  avatar1: (
    <svg width="100%" height="100%" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill="#F2D4C2"/>
      <path d="M60 52C60 45.3726 51.0457 40 40 40C28.9543 40 20 45.3726 20 52" fill="#CB9A82"/>
      <path d="M40 64C45.5228 64 50 59.5228 50 54H30C30 59.5228 34.4772 64 40 64Z" fill="#E2B8A4"/>
      <path d="M52 28C52 24.6863 46.6274 22 40 22C33.3726 22 28 24.6863 28 28V36H52V28Z" fill="#3B2A2F"/>
      <circle cx="32" cy="48" r="4" fill="#2E2E2E"/>
      <circle cx="48" cy="48" r="4" fill="#2E2E2E"/>
      <path d="M38 58C38 57.4477 38.4477 57 39 57H41C41.5523 57 42 57.4477 42 58V59H38V58Z" fill="#8C5A42"/>
    </svg>
  ),
  avatar2: (
    <svg width="100%" height="100%" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill="#FFE9A8"/>
      <path d="M40 70C28.9543 70 20 64.6274 20 58V50H60V58C60 64.6274 51.0457 70 40 70Z" fill="#F5D787"/>
      <path d="M40 60C45.5228 60 50 55.5228 50 50H30C30 55.5228 34.4772 60 40 60Z" fill="#E6C16E"/>
      <path d="M25 40V30C25 21.7157 31.7157 15 40 15C48.2843 15 55 21.7157 55 30V40H25Z" fill="#F4B740"/>
      <rect x="25" y="38" width="30" height="12" fill="#E6C16E"/>
      <circle cx="33" cy="46" r="3" fill="#2E2E2E"/>
      <circle cx="47" cy="46" r="3" fill="#2E2E2E"/>
      <path d="M36 54C36 52.8954 36.8954 52 38 52H42C43.1046 52 44 52.8954 44 54H36Z" fill="#996E28"/>
    </svg>
  ),
  avatar3: (
    <svg width="100%" height="100%" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="40" fill="#A7D4A1"/>
        <path d="M60 50C60 44.4772 51.0457 40 40 40C28.9543 40 20 44.4772 20 50" fill="#8DBF88"/>
        <path d="M28 20C28 17.2386 33.3726 15 40 15C46.6274 15 52 17.2386 52 20V38H28V20Z" fill="#4A4A4A"/>
        <rect x="26" y="44" width="28" height="4" rx="2" fill="#FFFFFF"/>
        <rect x="30" y="44" width="4" height="8" rx="2" fill="#333333"/>
        <rect x="46" y="44" width="4" height="8" rx="2" fill="#333333"/>
        <path d="M35 56H45" stroke="#4A4A4A" stroke-width="3" stroke-linecap="round"/>
    </svg>
  ),
  avatar4: (
    <svg width="100%" height="100%" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="40" fill="#E9AFA3"/>
        <path d="M40 70C28.9543 70 20 64.6274 20 58V48H60V58C60 64.6274 51.0457 70 40 70Z" fill="#D99B8F"/>
        <path d="M40 60C45.5228 60 50 55.5228 50 50H30C30 55.5228 34.4772 60 40 60Z" fill="#C98B7F"/>
        <path d="M50 18C50 14.6863 45.5228 12 40 12C34.4772 12 30 14.6863 30 18V28H22V42H58V28H50V18Z" fill="#D46A58"/>
        <circle cx="34" cy="48" r="4" fill="#FFFFFF"/>
        <circle cx="46" cy="48" r="4" fill="#FFFFFF"/>
        <circle cx="34" cy="48" r="2" fill="#2E2E2E"/>
        <circle cx="46" cy="48" r="2" fill="#2E2E2E"/>
        <path d="M35 56C35 54.8954 35.8954 54 37 54H43C44.1046 54 45 54.8954 45 56H35Z" fill="#8C4237"/>
    </svg>
  ),
  avatar5: (
    <svg width="100%" height="100%" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="40" fill="#9D7E69"/>
        <path d="M60 52C60 45.3726 51.0457 40 40 40C28.9543 40 20 45.3726 20 52" fill="#846855"/>
        <path d="M40 62C45.5228 62 50 57.5228 50 52H30C30 57.5228 34.4772 62 40 62Z" fill="#755B49"/>
        <path d="M48 20C48 17.7909 44.4183 16 40 16C35.5817 16 32 17.7909 32 20V32H48V20Z" fill="#2C221B"/>
        <path d="M28 40H52V32H28V40Z" fill="#2C221B"/>
        <circle cx="34" cy="48" r="3" fill="#2C221B"/>
        <circle cx="46" cy="48" r="3" fill="#2C221B"/>
        <path d="M32 54H48" stroke="#2C221B" stroke-width="3" stroke-linecap="round"/>
    </svg>
  ),
  avatar6: (
     <svg width="100%" height="100%" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="40" fill="#6A4E3B"/>
        <path d="M40 72C28.9543 72 20 66.6274 20 60V50H60V60C60 66.6274 51.0457 72 40 72Z" fill="#583E2D"/>
        <path d="M40 62C45.5228 62 50 57.5228 50 52H30C30 57.5228 34.4772 62 40 62Z" fill="#4B3323"/>
        <circle cx="40" cy="28" r="18" fill="#3B2A2F"/>
        <circle cx="28" cy="25" r="8" fill="#3B2A2F"/>
        <circle cx="52" cy="25" r="8" fill="#3B2A2F"/>
        <circle cx="34" cy="48" r="4" fill="#FFFFFF"/>
        <circle cx="46" cy="48" r="4" fill="#FFFFFF"/>
        <path d="M32 58C32 55.7909 35.5817 54 40 54C44.4183 54 48 55.7909 48 58H32Z" fill="#FFFFFF"/>
    </svg>
  ),
  avatar7: (
    <svg width="100%" height="100%" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="40" fill="#B2A1C7"/>
        <path d="M60 52C60 45.3726 51.0457 40 40 40C28.9543 40 20 45.3726 20 52" fill="#9C8AAE"/>
        <path d="M40 64C45.5228 64 50 59.5228 50 54H30C30 59.5228 34.4772 64 40 64Z" fill="#8C78A0"/>
        <path d="M54 36V26C54 19.3726 47.732 14 40 14C32.268 14 26 19.3726 26 26V36H54Z" fill="#6C509B"/>
        <path d="M26 36L22 42H58L54 36H26Z" fill="#5A3E85"/>
        <circle cx="32" cy="48" r="4" fill="#2E2E2E"/>
        <circle cx="48" cy="48" r="4" fill="#2E2E2E"/>
        <path d="M38 58H42" stroke="#2E2E2E" stroke-width="3" stroke-linecap="round"/>
    </svg>
  ),
  avatar8: (
     <svg width="100%" height="100%" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="40" fill="#C9EAF7"/>
        <path d="M40 70C28.9543 70 20 64.6274 20 58V50H60V58C60 64.6274 51.0457 70 40 70Z" fill="#A9D9E9"/>
        <path d="M40 62C45.5228 62 50 57.5228 50 52H30C30 57.5228 34.4772 62 40 62Z" fill="#8EC8DC"/>
        <path d="M28 38V22C28 17.5817 33.3726 14 40 14C46.6274 14 52 17.5817 52 22V38H28Z" fill="#6A4E3B"/>
        <path d="M28 38H52L50 44H30L28 38Z" fill="#583E2D"/>
        <path d="M20 52H60V56C60 61.5228 51.0457 66 40 66C28.9543 66 20 61.5228 20 56V52Z" fill="#6A4E3B"/>
        <path d="M36 58C36 56.8954 36.8954 56 38 56H42C43.1046 56 44 56.8954 44 58H36Z" fill="#FFFFFF"/>
        <rect x="32" y="44" width="4" height="4" rx="2" fill="#2E2E2E"/>
        <rect x="44" y="44" width="4" height="4" rx="2" fill="#2E2E2E"/>
    </svg>
  ),
  avatar9: (
     <svg width="100%" height="100%" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="40" fill="#FFE3D6"/>
        <path d="M40 72C28.9543 72 20 66.6274 20 60V52H60V60C60 66.6274 51.0457 72 40 72Z" fill="#FFD1BC"/>
        <path d="M40 62C45.5228 62 50 57.5228 50 52H30C30 57.5228 34.4772 62 40 62Z" fill="#FFC3A7"/>
        <path d="M22 42V32C22 22.0589 30.0589 14 40 14C49.9411 14 58 22.0589 58 32V42H22Z" fill="#301D16"/>
        <rect x="22" y="30" width="36" height="4" fill="#1C110D"/>
        <circle cx="33" cy="48" r="4" fill="#FFFFFF"/>
        <circle cx="47" cy="48" r="4" fill="#FFFFFF"/>
        <circle cx="33" cy="48" r="1.5" fill="#5C3B2E"/>
        <circle cx="47" cy="48" r="1.5" fill="#5C3B2E"/>
        <path d="M36 57C36 55.8954 36.8954 55 38 55H42C43.1046 55 44 55.8954 44 57H36Z" fill="#A87762"/>
    </svg>
  ),
  avatar10: (
    <svg width="100%" height="100%" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="40" fill="#C4A883"/>
        <path d="M60 52C60 45.3726 51.0457 40 40 40C28.9543 40 20 45.3726 20 52" fill="#AD926D"/>
        <path d="M40 62C45.5228 62 50 57.5228 50 52H30C30 57.5228 34.4772 62 40 62Z" fill="#A18461"/>
        <path d="M54 30L50 18L40 22L30 18L26 30V36H54V30Z" fill="#F4B740"/>
        <path d="M30 46H50V48H30V46Z" fill="#2E2E2E" fill-opacity="0.4"/>
        <path d="M32 54H48" stroke="#4A3826" stroke-width="4" stroke-linecap="round"/>
    </svg>
  ),
  avatar11: (
    <svg width="100%" height="100%" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="40" fill="#8C6D4B"/>
        <path d="M40 70C28.9543 70 20 64.6274 20 58V50H60V58C60 64.6274 51.0457 70 40 70Z" fill="#755B49"/>
        <path d="M40 62C45.5228 62 50 57.5228 50 52H30C30 57.5228 34.4772 62 40 62Z" fill="#6A4E3B"/>
        <path d="M22 46V36C22 26.0589 30.0589 18 40 18C49.9411 18 58 26.0589 58 36V46H22Z" fill="#D46A58"/>
        <path d="M20 36L18 54H62L60 36H20Z" fill="#D46A58"/>
        <path d="M18 54L22 62H58L62 54H18Z" fill="#C95F4D"/>
        <circle cx="34" cy="48" r="3" fill="#2E2E2E"/>
        <circle cx="46" cy="48" r="3" fill="#2E2E2E"/>
        <path d="M36 56H44" stroke="#2E2E2E" stroke-width="2" stroke-linecap="round"/>
    </svg>
  ),
  avatar12: (
    <svg width="100%" height="100%" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="40" fill="#FAD9A5"/>
        <path d="M60 52C60 45.3726 51.0457 40 40 40C28.9543 40 20 45.3726 20 52" fill="#EFC68B"/>
        <path d="M40 64C45.5228 64 50 59.5228 50 54H30C30 59.5228 34.4772 64 40 64Z" fill="#E6B97A"/>
        <circle cx="40" cy="28" r="14" fill="#3B2A2F"/>
        <circle cx="28" cy="28" r="8" fill="#3B2A2F"/>
        <circle cx="52" cy="28" r="8" fill="#3B2A2F"/>
        <rect x="28" y="44" width="24" height="4" rx="2" fill="#333333" fill-opacity="0.5"/>
        <rect x="32" y="44" width="4" height="8" rx="2" fill="#FFFFFF"/>
        <rect x="44" y="44" width="4" height="8" rx="2" fill="#FFFFFF"/>
        <path d="M36 58C36 56.8954 36.8954 56 38 56H42C43.1046 56 44 56.8954 44 58H36Z" fill="#8C5A42"/>
    </svg>
  ),
  avatar13: (
    <svg width="100%" height="100%" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="40" fill="#BCC3C7"/>
        <path d="M40 70C28.9543 70 20 64.6274 20 58V50H60V58C60 64.6274 51.0457 70 40 70Z" fill="#A8AFB3"/>
        <path d="M40 60C45.5228 60 50 55.5228 50 50H30C30 55.5228 34.4772 60 40 60Z" fill="#989FA3"/>
        <path d="M26 40V30C26 22.268 32.268 16 40 16C47.732 16 54 22.268 54 30V40H26Z" fill="#EAEAEA"/>
        <path d="M26 30L22 42H58L54 30H26Z" fill="#D0D0D0"/>
        <path d="M30 46L32 44" stroke="#2E2E2E" stroke-width="3" stroke-linecap="round"/>
        <path d="M50 46L48 44" stroke="#2E2E2E" stroke-width="3" stroke-linecap="round"/>
        <path d="M32 56C32 53.7909 35.5817 52 40 52C44.4183 52 48 53.7909 48 56H32Z" fill="#5F6B7A"/>
    </svg>
  ),
  avatar14: (
    <svg width="100%" height="100%" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="40" fill="#78C0A8"/>
        <path d="M60 52C60 45.3726 51.0457 40 40 40C28.9543 40 20 45.3726 20 52" fill="#64A992"/>
        <path d="M40 64C45.5228 64 50 59.5228 50 54H30C30 59.5228 34.4772 64 40 64Z" fill="#569781"/>
        <path d="M28 38V24C28 19.5817 33.3726 16 40 16C46.6274 16 52 19.5817 52 24V38H28Z" fill="#3B2A2F"/>
        <path d="M48 44H52V48H48V44Z" fill="#2E2E2E"/>
        <path d="M28 44H32V48H28V44Z" fill="#2E2E2E"/>
        <path d="M42 54C42 55.1046 41.1046 56 40 56C38.8954 56 38 55.1046 38 54H34V58H46V54H42Z" fill="#FFFFFF"/>
    </svg>
  ),
  avatar15: (
    <svg width="100%" height="100%" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="40" fill="#F0A8A2"/>
        <path d="M40 70C28.9543 70 20 64.6274 20 58V50H60V58C60 64.6274 51.0457 70 40 70Z" fill="#E8928B"/>
        <path d="M40 62C45.5228 62 50 57.5228 50 52H30C30 57.5228 34.4772 62 40 62Z" fill="#E07F77"/>
        <path d="M56 30C56 22.268 48.8366 16 40 16C31.1634 16 24 22.268 24 30V44H56V30Z" fill="#4A2E2A"/>
        <circle cx="40" cy="30" r="10" fill="#3D2521"/>
        <circle cx="34" cy="46" r="4" fill="#FFFFFF"/>
        <circle cx="46" cy="46" r="4" fill="#FFFFFF"/>
        <path d="M36 56C36 54.8954 36.8954 54 38 54H42C43.1046 54 44 54.8954 44 56H36Z" fill="#995049"/>
    </svg>
  ),
  avatar16: (
     <svg width="100%" height="100%" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="40" fill="#3E4C5E"/>
        <path d="M60 52C60 45.3726 51.0457 40 40 40C28.9543 40 20 45.3726 20 52" fill="#344050"/>
        <path d="M40 64C45.5228 64 50 59.5228 50 54H30C30 59.5228 34.4772 64 40 64Z" fill="#2A3543"/>
        <path d="M24 38V28C24 20.268 31.1634 14 40 14C48.8366 14 56 20.268 56 28V38H24Z" fill="#D8DEE9"/>
        <rect x="22" y="44" width="36" height="8" rx="4" fill="#2E3440"/>
        <rect x="26" y="44" width="12" height="8" fill="#88C0D0"/>
        <rect x="42" y="44" width="12" height="8" fill="#88C0D0"/>
        <path d="M36 58H44" stroke="#D8DEE9" stroke-width="3" stroke-linecap="round"/>
    </svg>
  ),
};

interface AvatarProps {
  avatar: string; // The default avatar ID
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ avatar, className = 'h-8 w-8' }) => {
  // Fallback to a default SVG avatar if the provided one doesn't exist.
  const svgAvatar = avatarSvgs[avatar] || avatarSvgs['avatar1'];

  return (
    <div className={className}>
      {svgAvatar}
    </div>
  );
};
