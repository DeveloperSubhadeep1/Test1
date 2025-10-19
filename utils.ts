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

/**
 * A robust, shared function to parse metadata from a filename string.
 * It uses the year as a primary delimiter to separate title from metadata.
 */
function coreFilenameParser(filename: string): { moviename: string; year: string | null; languages: string[]; quality: string | null; size: string | null } {
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    const normalized = nameWithoutExt.replace(/[._\[\]()]/g, " ").replace(/\s+/g, ' ').trim();
    const parts = normalized.split(' ');

    let year: string | null = null;
    let yearIndex = -1;

    // Find the year from the end; it's the most reliable delimiter.
    for (let i = parts.length - 1; i > 0; i--) {
        if (/^\d{4}$/.test(parts[i])) {
            const potentialYear = parseInt(parts[i], 10);
            if (potentialYear > 1900 && potentialYear < new Date().getFullYear() + 2) {
                year = parts[i];
                yearIndex = i;
                break;
            }
        }
    }

    // Title is everything before the year.
    const titleParts = yearIndex !== -1 ? parts.slice(0, yearIndex) : [...parts];
    
    // If no year was found, we need to guess where the title ends by looking for the first metadata keyword.
    if (yearIndex === -1) {
        const keywords = ['4k', '2160p', '1080p', '720p', '480p', 'web-dl', 'webdl', 'webrip', 'bluray', 'hdtv', 'hdrip', 'x264', 'hindi', 'english', 'eng', 'dual', 'audio'];
        let firstMetaIndex = -1;
        // Start from index 1 to avoid matching if title itself is a keyword (e.g., the movie 'Dual')
        for (let i = 1; i < titleParts.length; i++) {
            if (keywords.includes(titleParts[i].toLowerCase())) {
                firstMetaIndex = i;
                break;
            }
        }
        if (firstMetaIndex !== -1) {
            titleParts.splice(firstMetaIndex);
        }
    }

    const moviename = titleParts.join(' ').trim();
    
    // Now parse metadata from the entire normalized string for simplicity and accuracy.
    const lowerNormalized = normalized.toLowerCase();
    
    let quality: string | null = null;
    const qualityMatch = lowerNormalized.match(/\b(4k|2160p|1080p|720p|480p)\b/i);
    if (qualityMatch) {
      quality = qualityMatch[0].toUpperCase().replace('P', 'p');
    }

    let size: string | null = null;
    const sizeMatch = lowerNormalized.match(/(\d+(\.\d+)?\s?(gb|mb))/i);
    if (sizeMatch) {
      size = sizeMatch[0].replace(/\s/g, '').toUpperCase();
    }
    
    const languages: string[] = [];
    const languageMap: { [key: string]: string } = {
        'hindi': 'Hindi',
        'हिन्दी': 'Hindi',
        'english': 'English', 'eng': 'English', 'esubs': 'English', 'esub': 'English',
        'tamil': 'Tamil',
        'telugu': 'Telugu',
        'kannada': 'Kannada',
        'malayalam': 'Malayalam',
        'dual': 'Dual Audio', 'audio': 'Dual Audio',
    };
    const ignoreLangRegex = /aac|hdrip|x264|amzn|web-dl|webrip/i;
    
    parts.forEach(p => {
        // Use original casing for native scripts, but lowercase for map lookup
        const pKey = p.toLowerCase();
        if (languageMap[pKey] && !languages.includes(languageMap[pKey])) {
            languages.push(languageMap[pKey]);
        } else if (!/p$|^\d+$|\bg[b]?\b|\bm[b]?\b/i.test(pKey) && !ignoreLangRegex.test(pKey) && p.length > 2 && isNaN(Number(p))) {
             // Heuristic: If it's not quality, a number, size, or an ignored keyword, it might be a language.
             // This is less reliable but can catch languages not in the map.
             // languages.push(p.charAt(0).toUpperCase() + p.slice(1));
        }
    });

    return { moviename, year, languages, quality, size };
}


/**
 * Parses a filename to extract the movie name and other metadata for the Admin Panel automation.
 */
export function parseFilenameForAutomate(filename: string): { movieName: string; year: number | null; languages: string[]; quality: string | null; size: string | null; } {
    const { moviename, year, languages, quality, size } = coreFilenameParser(filename);
    return { movieName: moviename, year: year ? parseInt(year, 10) : null, languages, quality, size };
}

/**
 * Parses a source string (filename + label) to extract displayable metadata for download buttons.
 * It does not need to determine the title or year.
 */
export function parseMediaFilename(source: string): { languages: string[]; quality: string | null; size: string | null; } {
    const { languages, quality, size } = coreFilenameParser(source);
    return { languages, quality, size };
}