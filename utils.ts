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
function coreFilenameParser(filename: string): { moviename: string; year: string | null; languages: string[]; quality: string | null; size: string | null; season: number | null, episode: number | null } {
    // --- Step 1: Extract size BEFORE normalization, as normalization can break the format (e.g., "1.23 GB").
    let size: string | null = null;
    const sizeMatch = filename.match(/(\d+(\.\d+)?\s?(gb|mb))/i);
    if (sizeMatch) {
      size = sizeMatch[0].replace(/\s/g, '').toUpperCase();
    }

    // --- Step 2: Normalize the string for further parsing.
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    const normalized = nameWithoutExt.replace(/[._\[\]()]/g, " ").replace(/\s+/g, ' ').trim();
    
    // --- Step 3: Parse metadata from the normalized string.
    let year: string | null = null;
    let season: number | null = null;
    let episode: number | null = null;
    let moviename = '';

    // Find Season/Episode (e.g., S02E09)
    const seMatch = normalized.match(/\b[sS](\d{1,2})[eE](\d{1,2})\b/);
    let seIndex = -1;
    if (seMatch) {
        season = parseInt(seMatch[1], 10);
        episode = parseInt(seMatch[2], 10);
        seIndex = normalized.indexOf(seMatch[0]);
    }

    // Find Year (e.g., 2023)
    const yearMatch = normalized.match(/\b(19\d{2}|20\d{2})\b/);
    let yearIndex = -1;
    if (yearMatch) {
        const potentialYear = parseInt(yearMatch[0], 10);
        if (potentialYear > 1900 && potentialYear < new Date().getFullYear() + 5) {
            year = yearMatch[0];
            yearIndex = normalized.indexOf(yearMatch[0]);
        }
    }
    
    // Determine where the title ends. It's usually before the season/episode or year.
    let titleEndIndex = -1;
    if (seIndex !== -1 && yearIndex !== -1) {
        titleEndIndex = Math.min(seIndex, yearIndex);
    } else if (seIndex !== -1) {
        titleEndIndex = seIndex;
    } else if (yearIndex !== -1) {
        titleEndIndex = yearIndex;
    }

    if (titleEndIndex !== -1) {
        moviename = normalized.substring(0, titleEndIndex).trim();
    } else {
        // Fallback: If no year or SxxExx, find where metadata keywords start
        const parts = normalized.split(' ');
        const keywords = ['4k', '2160p', '1080p', '720p', '480p', 'web-dl', 'webdl', 'webrip', 'bluray', 'hdtv', 'hdrip', 'x264', 'hindi', 'english', 'eng', 'dual', 'audio'];
        let firstMetaIndex = -1;
        for (let i = 1; i < parts.length; i++) {
            if (keywords.includes(parts[i].toLowerCase())) {
                firstMetaIndex = i;
                break;
            }
        }
        if (firstMetaIndex !== -1) {
            moviename = parts.slice(0, firstMetaIndex).join(' ');
        } else {
            moviename = normalized; // Assume the whole thing is the title
        }
    }

    // --- Step 4: Parse quality and languages from the whole normalized string
    const lowerNormalized = normalized.toLowerCase();
    
    let quality: string | null = null;
    const qualityMatch = lowerNormalized.match(/\b(4k|2160p|1080p|720p|480p)\b/i);
    if (qualityMatch) {
      quality = qualityMatch[0].toUpperCase().replace('P', 'p');
    }
    
    const languages: string[] = [];
    const languageMap: { [key: string]: string } = {
        'hindi': 'Hindi',
        'हिन्दी': 'Hindi',
        'english': 'English', 'eng': 'English',
        'tamil': 'Tamil',
        'telugu': 'Telugu',
        'kannada': 'Kannada',
        'malayalam': 'Malayalam',
        'dual': 'Dual Audio', 'audio': 'Dual Audio',
    };
    
    const parts = normalized.split(' ');
    const lowerParts = parts.map(p => p.toLowerCase());

    for (let i = 0; i < lowerParts.length; i++) {
        const pKey = lowerParts[i];

        // Handle 'eng' to differentiate audio from subtitles
        if (pKey === 'eng' && (i + 1 < lowerParts.length) && (lowerParts[i + 1] === 'sub' || lowerParts[i + 1] === 'subs')) {
            i++; // Skip 'eng' and also skip 'sub(s)' on the next iteration
            continue;
        }
        
        // Handle 'esub(s)' which are clearly subtitles
        if (pKey === 'esub' || pKey === 'esubs') {
            continue;
        }

        const lang = languageMap[pKey];
        if (lang && !languages.includes(lang)) {
            languages.push(lang);
        }
    }

    return { moviename, year, languages, quality, size, season, episode };
}


/**
 * Parses a filename to extract the movie name and other metadata for the Admin Panel automation.
 */
export function parseFilenameForAutomate(filename: string): { movieName: string; year: number | null; languages: string[]; quality: string | null; size: string | null; season: number | null; episode: number | null; } {
    const { moviename, year, languages, quality, size, season, episode } = coreFilenameParser(filename);
    return { movieName: moviename, year: year ? parseInt(year, 10) : null, languages, quality, size, season, episode };
}

/**
 * Parses a source string (filename + label) to extract displayable metadata for download buttons.
 * It does not need to determine the title or year.
 */
export function parseMediaFilename(source: string): { languages: string[]; quality: string | null; size: string | null; } {
    const { languages, quality, size } = coreFilenameParser(source);
    return { languages, quality, size };
}

/**
 * Generates a clean, readable label for a download link from parsed media details.
 */
export function generateLinkLabel(details: { quality?: string | null; languages?: string[]; size?: string | null; season?: number | null; episode?: number | null }): string {
    const parts: string[] = [];
    if (details.season && details.episode) {
        const seasonStr = String(details.season).padStart(2, '0');
        const episodeStr = String(details.episode).padStart(2, '0');
        parts.push(`S${seasonStr}E${episodeStr}`);
    }
    if (details.quality) {
        parts.push(details.quality);
    }
    if (details.languages && details.languages.length > 0) {
        parts.push(details.languages.join(' + '));
    }
    if (details.size) {
        parts.push(`[${details.size}]`);
    }
    return parts.join(' ') || 'Download'; // Fallback to "Download" if no details are parsed
}