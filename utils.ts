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

// A list of common channel/release group names to be stripped from filenames.
// This is converted to lowercase for case-insensitive matching.
const CHANNEL_NAMES_BLOCKLIST = [
    'ClipmateMovies', 'CineMateHD', 'MovieMateZone', 'StreamMateFilms', 'ReelMateMovies', 'FlixMateOfficial', 'CineStreamHD', 'MovieVerseHQ', 'FilmVerseHD', 'CineVaultMovies', 'MovieWorldHub', 'CineScopeHD', 'MovieFlixZone', 'CineBoxHD', 'FlixArenaMovies', 'CineKingHD', 'StreamWorldMovies', 'MovieNovaHQ', 'CinePlanetHD', 'ReelTimeMovies', 'CineVerseOfficial', 'MoviePortHD', 'CineVaultHub', 'FlixKingMovies', 'MovieLoungeHD', 'CineGalaxyHub', 'BollywoodMateHD', 'SouthHindiMovies', 'SouthFlixMovies', 'HindiDubbedVerse', 'SouthDubHD', 'MovieHubSouth', 'BollywoodCinemaHD', 'SouthBlockbusters', 'TamilTeluguMovies', 'SouthMovieWorld', 'BollywoodFlixHQ', 'HindiMoviesZone', 'DesiCineHub', 'SouthHindiDubbed', 'BollywoodVerseHD', 'SouthActionMovies', 'HindiMoviezMate', 'CineSouthOfficial', 'DesiMovieWorld', 'SouthPlusMovies', 'IndianCinemaVerse', 'BollywoodStreamHD', 'SouthCinemaX', 'MovieHubIndia', 'HindiCineMate', 'FlixMateZone', 'CineXverse', 'MovieCrateHD', 'StreamifyMovies', 'CinePlayHub', 'WatchMateHD', 'FlixPointMovies', 'MovieXpressHD', 'CineDropHub', 'MovieFlowHQ', 'CineCoreMovies', 'ReelStreamHD', 'CineBuzzMovies', 'MovieCloudHub', 'CinePrimeHD', 'StreamZoneMovies', 'CineKingVerse', 'MovieSkyHD', 'FlixStreamOfficial', 'CineBoxOfficeHD', 'CineTimeMovies', 'MovieBytesHD', 'StreamMateOfficial', 'MovieRealmHD', 'CinePortMovies', 'CineSpotHD', 'MovieVersePlus', 'CineNovaMovies', 'StreamMateX', 'CineFlowMovies', 'MovieManiaHD', 'BollywoodPrimeHD', 'SouthHitMovies', 'CineKingPro', 'MovieVaultHD', 'CineZoneOfficial', 'FlixMateIndia', 'MoviePortX', 'CineStreamPro', 'MovieMantraHD', 'SouthCineWorld', 'HindiAddaMovies', 'CinePlanetIndia', 'MovieWorldX', 'FlixverseHD', 'MovieDockHub', 'CineBaseMovies', 'SouthTrendzHD', 'MoviePointHQ', 'CineNationHD', 'MovieStopOfficial', 'StreamLineMovies', 'BollywoodPrimeZone', 'CineMasterHD', 'MovieTimeX', 'SouthHQMovies', 'MovieMatePlus', 'CineFlixIndia', 'MovieCrushHD', 'CineFileMovies', 'MovieSagaHD', 'FlixTownMovies', 'MovieGalaxyHD', 'CineRushMovies', 'SouthFlicksHD', 'MovieEpicHub', 'CineFreakMovies', 'MoviePrimeHub', 'CineDriveMovies', 'MovieDuniyaHD', 'CineBaseIndia', 'MovieArenaHD', 'CineStarMovies', 'MovieScreenHD', 'CineVisionMovies', 'MoviePointZone', 'CineWorldPrime', 'MovieManorHD', 'CineCastMovies', 'MovieBuzzHD', 'CineLoversHub', 'MovieReelHD', 'CineSpaceMovies', 'MovieMediaHD', 'CineWavesHub', 'MoviePortalHD', 'CineXMovies', 'MovieEmpireHD', 'CineEdgeMovies', 'MovieMagicHD', 'CineNextHub', 'MovieAddaHQ', 'CineGateMovies', 'MovieFusionHD', 'CinePrimeZone', 'MovieNationHD', 'CineRoomMovies', 'MovieWorldsHD', 'CineLinkMovies', 'MoviePlayHQ', 'CineShowMovies', 'MovieFinderHD', 'CineCastleMovies', 'MovieVibesHD', 'CinePrimeIndia', 'MovieCornerHD', 'CineCrewMovies', 'MovieMateX', 'CineFlickHub', 'MovieStreamHD', 'CineStarHD', 'MovieMatrixHD', 'CineTuneMovies', 'MovieStoreHD', 'CinePortX', 'MovieCatchHD', 'CineViewMovies', 'MovieBaseHD', 'CineStreamZone', 'MovieBayHD', 'CineLightMovies', 'MovieStageHD', 'CineXtraMovies', 'MovieRoomHQ', 'CineCloudHD', 'MovieTimeIndia', 'CineFeedMovies', 'MovieStationHD', 'CinePostMovies', 'MoviePrimeOfficial', 'CineStreetMovies', 'MovieSyncHD', 'CineChannelMovies', 'MovieMateOfficial', 'CineVaultPro', 'MovieDeckHD', 'CineNovaHD', 'MovieBoxHD', 'CineFlicksOfficial', 'MovieKingHD', 'CineCrewHD', 'MovieBazarHD', 'CineStreamIndia', 'MovieLinkHD', 'CineClubMovies', 'MovieMotionHD', 'CineCityMovies', 'MovieFactoryHD', 'CineMovieZone', 'MovieNexusHD', 'CineSceneMovies', 'MovieWaveHD', 'CineWorldPlus', 'MovieVibeOfficial', 'CineWorldIndia', 'MovieBaseZone', 'CineSpotMovies', 'MovieLandHD', 'CineGoldMovies', 'MovieMateIndia', 'CineHubX', 'MovieArenaIndia', 'CineCoreHub', 'MoviePassHD', 'CineFlickMovies', 'MovieCentralHD', 'CineTuneHD', 'MovieSkyOfficial', 'CineClubHD', 'MovieDreamsHD', 'CinePortPro', 'MovieSpotOfficial', 'CinePlayIndia', 'MovieScreenPro', 'CineXpressMovies', 'MoviePulseHD', 'CineSpaceHD', 'MovieCastHD', 'CineWorldHQ', 'MovieMasterHD', 'CineShowHD', 'MoviePortOfficial', 'CineRealmHD', 'MovieZoneOfficial', 'CineWorldMoviesHD', 'MoviePlanetOfficial', 'CineCloudPro', 'MovieLinkZone', 'CineAddaMovies', 'MovieStreamWorld', 'CineMasterIndia', 'MoviePlanetX', 'CineTownMovies', 'MovieVaultPro', 'CineBuzzHD', 'MovieMoodHD', 'CinePrimeWorld', 'MovieDreamHD', 'CineCatchMovies', 'MovieAddaOfficial', 'CineVerseHD', 'MovieHitZone', 'CineCrownHD', 'MovieTimeOfficial', 'CineViewHD', 'MovieStreamIndia', 'CineSpotIndia', 'MovieSpotHD', 'CinePlayMovies', 'MovieWalaHD', 'CineSeriesHD', 'MovieWorldOfficial', 'CineTrendHD', 'MovieZoneIndia', 'CinePulseMovies', 'MovieJoyHD', 'CineWorldAdda', 'MovieDockHD', 'CineSpotPro', 'MovieMagicIndia', 'CineCineHD', 'MovieFlixHD', 'CineBaseOfficial', 'MovieStoreOfficial', 'CineUploadMovies', 'MovieBoxIndia', 'CinePackHD', 'MovieSeriesHD', 'CineFileHD', 'MovieStreamPro', 'CineVaultIndia', 'MovieVerseOfficial', 'CineAddaHD', 'MovieXpressOfficial', 'CineStreamOfficial', 'MovieWavesHD', 'CineBayMovies', 'MovieVerseIndia', 'CineWebHD', 'MovieWalaOfficial', 'CineManiaHD', 'MovieBuzzIndia', 'CineFlixHD', 'MovieNationPro', 'CineSouthMovies', 'MovieZoneXpress', 'CineIndiaHD', 'MovieFilesHD', 'CineViewPro', 'MoviePlanetPro', 'CineSpotHQ', 'MovieTimePlus', 'CineLinkHD', 'MovieSkyPro', 'CineStreamWorld', 'MovieManiaOfficial', 'CineTrendMovies', 'MovieVaultZone', 'CineBoxPro', 'MovieStreamPlus', 'CineWorldPro', 'MovieCineHub', 'CineAddictHD', 'MovieMaxHD', 'CineStarPro', 'MovieHubHQ', 'CinePointHD', 'MovieNationPlus', 'CineHDWorld', 'MovieWatchHD', 'CineStreamMax', 'MoviePlusHD', 'CineClubPro', 'MovieBoxPro', 'CineZonePro', 'MovieWorldPlus', 'CinePlayPro', 'MovieTimeWorld', 'CineFilmHD', 'MovieVaultWorld', 'CineWatchMovies', 'MoviePlusOfficial', 'CineMaxMovies', 'MovieCornerIndia', 'CineMateIndia', 'MovieSpotPlus', 'CineBuzzPro', 'MovieArenaPro', 'CineLineMovies', 'MovieVerseWorld', 'CineEdgeHD', 'MovieDreamWorld', 'CineKingMovies', 'MoviePortPro', 'CineStreamPlus', 'MovieClipsPro', 'CineFlixPro', 'MovieSpotWorld', 'CineSeriesPro', 'MovieMateWorld', 'CineWatchPro', 'MovieWorldHQ', 'CineZoneWorld', 'MovieCineWorld', 'CineSpotWorld', 'MovieMateUniverse', 'CineStreamUniverse', 'MovieWorldUniverse'
].map(name => name.startsWith('@') ? name.substring(1).toLowerCase() : name.toLowerCase());

// Regex to match any of the channel names, @-tags, or bracketed content.
const NOISE_REGEX = new RegExp(`\\b(${CHANNEL_NAMES_BLOCKLIST.join('|')})\\b|@[\w.-]+|\\[.*?\\]`, 'gi');

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
    
    // UPDATED: Use a comprehensive blocklist regex to remove all known noise patterns.
    const cleanedName = nameWithoutExt.replace(NOISE_REGEX, '');
      
    let normalized = cleanedName.replace(/[._()+-]/g, " ").replace(/\s+/g, ' ').trim();


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
export function parseMediaFilename(source: string): { languages: string[]; quality: string | null; size: string | null; season: number | null; episode: number | null; } {
    const { languages, quality, size, season, episode } = coreFilenameParser(source);
    return { languages, quality, size, season, episode };
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