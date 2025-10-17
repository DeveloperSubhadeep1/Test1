export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD') // split an accented letter in the base letter and the acent
    .replace(/[\u0300-\u036f]/g, '') // remove all previously split accents
    .replace(/\s+/g, '-') // replace spaces with -
    .replace(/[^\w-]+/g, '') // remove all non-word chars
    .replace(/--+/g, '-') // replace multiple - with single -
    .replace(/^-+/, '') // trim - from start of text
    .replace(/-+$/, ''); // trim - from end of text
};

export const generateSlug = (title: string, year?: string | number): string => {
    const slug = slugify(title);
    if(year) {
        return `${slug}-${year}`;
    }
    return slug;
}

export const parseQualityFromLink = (label: string): string => {
  if (!label) return 'SD';
  // Matches 4k, 2160p, 1080p, 720p, 480p (case-insensitive)
  const qualityMatch = label.match(/(4k|2160p|1080p|720p|480p)/i);
  if (qualityMatch && qualityMatch[0]) {
    return qualityMatch[0].toLowerCase();
  }
  // Fallback for generic HD labels
  if (label.toLowerCase().includes('hd')) return 'HD';
  
  return 'SD'; // Default fallback
};