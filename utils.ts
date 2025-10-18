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
  
  // Define a set of common technical/junk terms to exclude from language detection.
  const languageExclusionList = new Set([
      'aac', 'dts', 'ac3', 'x264', 'x265', 'hevc', 'web-dl', 'webrip', 'bluray',
      'hdtv', 'brrip', 'hdrip', 'divx', 'xvid', 'repack', 'proper', 'internal',
      'extended', 'uncut', 'remastered', 'multi', 'sub', 'subs', 'dub', 'dubbed',
      'com', 'org', 'net', 'esub', 'esubs', 'atmos'
  ]);
  
  const yearIndex = parts.findIndex(p => /^\d{4}$/.test(p) && parseInt(p, 10) > 1900 && parseInt(p, 10) < new Date().getFullYear() + 2);

  let movieName = '';
  let remainingParts: string[] = [];

  if (yearIndex !== -1) {
    year = parseInt(parts[yearIndex], 10);
    movieName = parts.slice(0, yearIndex).join(" ");
    remainingParts = parts.slice(yearIndex + 1);
  } else {
    // If no year, we have to guess. Try to find the last part that is likely part of the name.
    const keywordIndex = parts.findIndex(p => languageExclusionList.has(p.toLowerCase()) || /(\d{3,4}p|4k|uhd)/i.test(p));
    if (keywordIndex !== -1 && keywordIndex > 0) { // Make sure we don't create an empty name
        movieName = parts.slice(0, keywordIndex).join(' ');
        remainingParts = parts.slice(keywordIndex);
    } else {
        movieName = parts.join(' ');
    }
  }

  // Process remaining parts for quality and languages
  remainingParts.forEach(p => {
      const pLower = p.toLowerCase();
      if (!quality) {
           const qualityMatch = p.match(/(\d{3,4}p|4k|uhd)/i);
           if (qualityMatch) {
               quality = qualityMatch[0];
               return; // This is definitely a quality tag, not a language
           }
      }
      // Updated language detection: 2-4 letters, no digits, and not in the exclusion list.
      if (p.length >= 2 && p.length <= 4 && !/\d/.test(p) && !languageExclusionList.has(pLower)) {
          languages.push(p);
      }
  });

  if (!quality) {
      const qualityMatch = filename.match(/(480p|720p|1080p|2160p|4k)/i);
      if (qualityMatch) {
          quality = qualityMatch[0];
      }
  }
  
  // Use a Set to ensure language tags are unique.
  return { movieName, year, languages: [...new Set(languages)], quality };
}


export function parseFilenameDetails(filename: string): { languages: string[]; size: string | null } {
  // Normalize filename for easier parsing
  const normalized = filename.replace(/[._\[\]()-]/g, ' ').toLowerCase();

  // Using \b to match whole words.
  const languagesRegex = /\b(hindi|english|eng|tamil|telugu|kannada|malayalam|bengali|marathi|punjabi|gujarati|urdu|dual[- .]?audio|multi[- .]?audio)\b/ig;
  const sizeRegex = /\b(\d+(\.\d+)?\s?(gb|mb))\b/ig;

  const languages = [...normalized.matchAll(languagesRegex)].map(m => {
      let lang = m[1].toLowerCase().replace(/[-.]/g, '');
      if (lang === 'eng') return 'English';
      if (lang === 'dualaudio') return 'Dual Audio';
      if (lang === 'multiaudio') return 'Multi Audio';
      return lang.charAt(0).toUpperCase() + lang.slice(1);
  });

  const sizeMatch = normalized.match(sizeRegex);
  
  return {
    languages: [...new Set(languages)], // Remove duplicates
    size: sizeMatch ? sizeMatch[0].toUpperCase().replace(/\s/g, '') : null,
  };
}