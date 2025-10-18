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

// This function is for the Details Page to generate a clean download button label from metadata.
export function parseMediaFilename(source: string): { languages: string[]; quality: string | null; size: string | null; } {
    const normalized = source.replace(/[._\[\]()]/g, " ").replace(/\s+/g, ' ').toLowerCase();

    let quality: string | null = null;
    let size: string | null = null;
    
    const qualityMatch = normalized.match(/\b(4k|2160p|1080p|720p|480p)\b/i);
    if (qualityMatch) quality = qualityMatch[0].toUpperCase().replace('P', 'p');

    const sizeMatch = normalized.match(/\b(\d+(\.\d+)?\s?(gb|mb))\b/i);
    if (sizeMatch) size = sizeMatch[0].toUpperCase().replace(/\s/g, '');
    
    const languageMap: { [key: string]: string } = {
        'hindi': 'Hindi', 'english': 'English', 'eng': 'English', 'tamil': 'Tamil',
        'telugu': 'Telugu', 'kannada': 'Kannada', 'malayalam': 'Malayalam',
        'bengali': 'Bengali', 'marathi': 'Marathi', 'punjabi': 'Punjabi',
        'gujarati': 'Gujarati', 'urdu': 'Urdu', 'dualaudio': 'Dual Audio',
        'multiaudio': 'Multi Audio'
    };
    
    const langRegex = /\b(hindi|english|eng|tamil|telugu|kannada|malayalam|bengali|marathi|punjabi|gujarati|urdu|dual-?audio|multi-?audio)\b/ig;
    const langMatches = normalized.match(langRegex) || [];
    const languages = langMatches.map(match => languageMap[match.toLowerCase().replace('-', '')]).filter(Boolean);

    return {
        languages: [...new Set(languages)],
        quality,
        size
    };
}


// This function is for the Admin Panel to extract movie name, year, and metadata for automation.
export function parseFilenameForAutomate(filename: string): { movieName: string; year: number | null; languages: string[]; quality: string | null; } {
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    const normalized = nameWithoutExt.replace(/[._\[\]()]/g, " ").replace(/\s+/g, ' ').trim();
    const parts = normalized.split(" ");
    
    // High-confidence keywords that usually appear after the movie title
    const keywords = new Set([
        '4k', '2160p', '1080p', '720p', '480p', 'web-dl', 'webdl', 'webrip', 'bluray',
        'hdtv', 'brrip', 'hdrip', 'x264', 'x265', 'hevc', 'hindi', 'english', 'eng', 'dual', 'audio'
    ]);

    let year: number | null = null;
    let titleEndIndex = -1;

    // Find year first, as it's a reliable delimiter
    for (let i = parts.length - 1; i >= 0; i--) {
        const part = parts[i];
        if (/^\d{4}$/.test(part) && parseInt(part, 10) > 1900 && parseInt(part, 10) < new Date().getFullYear() + 2) {
            year = parseInt(part, 10);
            titleEndIndex = i;
            break;
        }
    }

    // If no year, find the first technical keyword
    if (titleEndIndex === -1) {
        for (let i = 1; i < parts.length; i++) { // Start from 1 to avoid matching if the first word is a keyword
            if (keywords.has(parts[i].toLowerCase())) {
                titleEndIndex = i;
                break;
            }
        }
    }
    
    const movieName = (titleEndIndex !== -1 ? parts.slice(0, titleEndIndex) : parts).join(' ');
    
    const parsedDetails = parseMediaFilename(normalized);

    return {
        movieName: movieName,
        year,
        languages: parsedDetails.languages,
        quality: parsedDetails.quality
    };
}