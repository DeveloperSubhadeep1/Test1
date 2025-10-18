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

export function parseFilename(filename: string): { movieName: string; year: number | null; languages: string[]; quality: string | null; } {
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
  // Replace common separators with spaces and split, filtering out empty strings
  const parts = nameWithoutExt.replace(/[._\[\]()]/g, " ").split(" ").filter(p => p);

  let year: number | null = null;
  let quality: string | null = null;
  const languages: string[] = [];
  
  const yearIndex = parts.findIndex(p => /^\d{4}$/.test(p) && parseInt(p, 10) > 1900 && parseInt(p, 10) < new Date().getFullYear() + 2);

  let nameParts: string[] = [];

  if (yearIndex !== -1) {
    year = parseInt(parts[yearIndex], 10);
    nameParts = parts.slice(0, yearIndex);
    const remainingParts = parts.slice(yearIndex + 1);
    
    remainingParts.forEach(p => {
        if (!quality) {
             const qualityMatch = p.match(/(\d{3,4}p|4k|uhd)/i);
             if (qualityMatch) {
                 quality = qualityMatch[0];
                 return;
             }
        }
        // Very basic language code detection
        if (p.length > 1 && p.length < 4 && !/\d/.test(p) && !/^(com|org|net)$/i.test(p)) {
            languages.push(p);
        }
    });

  } else {
    nameParts = parts;
  }
  
  // Filter out all keywords from the name parts to get a clean name
  const keywords = /(480p|720p|1080p|2160p|4k|uhd|aac|dts|ac3|hdrip|x264|x265|hevc|amzn|web-dl|webrip|bluray|hdtv|divx|xvid|repack|proper|internal|extended|uncut|remastered|multi)/i;
  
  const finalNameParts = [];
  for (const part of nameParts) {
      if (keywords.test(part)) {
          if (!quality) {
              const qualityMatch = part.match(/(\d{3,4}p|4k|uhd)/i);
              if (qualityMatch) quality = qualityMatch[0];
          }
      } else {
          finalNameParts.push(part);
      }
  }

  let movieName = finalNameParts.join(" ").trim();
  
  if (!quality) {
      const qualityMatch = filename.match(/(480p|720p|1080p|2160p|4k)/i);
      if (qualityMatch) {
          quality = qualityMatch[0];
      }
  }
  
   movieName = movieName.replace(/\s+/g, ' '); // collapse multiple spaces

  return { movieName, year, languages, quality };
}