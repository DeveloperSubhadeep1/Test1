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
const RAW_CHANNEL_NAMES = [
    'ClipmateMovies', 'CineMateHD', 'MovieMateZone', 'StreamMateFilms', 'ReelMateMovies', 'FlixMateOfficial', 'CineStreamHD', 'MovieVerseHQ', 'FilmVerseHD', 'CineVaultMovies', 'MovieWorldHub', 'CineScopeHD', 'MovieFlixZone', 'CineBoxHD', 'FlixArenaMovies', 'CineKingHD', 'StreamWorldMovies', 'MovieNovaHQ', 'CinePlanetHD', 'ReelTimeMovies', 'CineVerseOfficial', 'MoviePortHD', 'CineVaultHub', 'FlixKingMovies', 'MovieLoungeHD', 'CineGalaxyHub', 'BollywoodMateHD', 'SouthHindiMovies', 'SouthFlixMovies', 'HindiDubbedVerse', 'SouthDubHD', 'MovieHubSouth', 'BollywoodCinemaHD', 'SouthBlockbusters', 'TamilTeluguMovies', 'SouthMovieWorld', 'BollywoodFlixHQ', 'HindiMoviesZone', 'DesiCineHub', 'SouthHindiDubbed', 'BollywoodVerseHD', 'SouthActionMovies', 'HindiMoviezMate', 'CineSouthOfficial', 'DesiMovieWorld', 'SouthPlusMovies', 'IndianCinemaVerse', 'BollywoodStreamHD', 'SouthCinemaX', 'MovieHubIndia', 'HindiCineMate', 'FlixMateZone', 'CineXverse', 'MovieCrateHD', 'StreamifyMovies', 'CinePlayHub', 'WatchMateHD', 'FlixPointMovies', 'MovieXpressHD', 'CineDropHub', 'MovieFlowHQ', 'CineCoreMovies', 'ReelStreamHD', 'CineBuzzMovies', 'MovieCloudHub', 'CinePrimeHD', 'StreamZoneMovies', 'CineKingVerse', 'MovieSkyHD', 'FlixStreamOfficial', 'CineBoxOfficeHD', 'CineTimeMovies', 'MovieBytesHD', 'StreamMateOfficial', 'MovieRealmHD', 'CinePortMovies', 'CineSpotHD', 'MovieVersePlus', 'CineNovaMovies', 'StreamMateX', 'CineFlowMovies', 'MovieManiaHD', 'BollywoodPrimeHD', 'SouthHitMovies', 'CineKingPro', 'MovieVaultHD', 'CineZoneOfficial', 'FlixMateIndia', 'MoviePortX', 'CineStreamPro', 'MovieMantraHD', 'SouthCineWorld', 'HindiAddaMovies', 'CinePlanetIndia', 'MovieWorldX', 'FlixverseHD', 'MovieDockHub', 'CineBaseMovies', 'SouthTrendzHD', 'MoviePointHQ', 'CineNationHD', 'MovieStopOfficial', 'StreamLineMovies', 'BollywoodPrimeZone', 'CineMasterHD', 'MovieTimeX', 'SouthHQMovies', 'MovieMatePlus', 'CineFlixIndia', 'MovieCrushHD', 'CineFileMovies', 'MovieSagaHD', 'FlixTownMovies', 'MovieGalaxyHD', 'CineRushMovies', 'SouthFlicksHD', 'MovieEpicHub', 'CineFreakMovies', 'MoviePrimeHub', 'CineDriveMovies', 'MovieDuniyaHD', 'CineBaseIndia', 'MovieArenaHD', 'CineStarMovies', 'MovieScreenHD', 'CineVisionMovies', 'MoviePointZone', 'CineWorldPrime', 'MovieManorHD', 'CineCastMovies', 'MovieBuzzHD', 'CineLoversHub', 'MovieReelHD', 'CineSpaceMovies', 'MovieMediaHD', 'CineWavesHub', 'MoviePortalHD', 'CineXMovies', 'MovieEmpireHD', 'CineEdgeMovies', 'MovieMagicHD', 'CineNextHub', 'MovieAddaHQ', 'CineGateMovies', 'MovieFusionHD', 'CinePrimeZone', 'MovieNationHD', 'CineRoomMovies', 'MovieWorldsHD', 'CineLinkMovies', 'MoviePlayHQ', 'CineShowMovies', 'MovieFinderHD', 'CineCastleMovies', 'MovieVibesHD', 'CinePrimeIndia', 'MovieCornerHD', 'CineCrewMovies', 'MovieMateX', 'CineFlickHub', 'MovieStreamHD', 'CineStarHD', 'MovieMatrixHD', 'CineTuneMovies', 'MovieStoreHD', 'CinePortX', 'MovieCatchHD', 'CineViewMovies', 'MovieBaseHD', 'CineStreamZone', 'MovieBayHD', 'CineLightMovies', 'MovieStageHD', 'CineXtraMovies', 'MovieRoomHQ', 'CineCloudHD', 'MovieTimeIndia', 'CineFeedMovies', 'MovieStationHD', 'CinePostMovies', 'MoviePrimeOfficial', 'CineStreetMovies', 'MovieSyncHD', 'CineChannelMovies', 'MovieMateOfficial', 'CineVaultPro', 'MovieDeckHD', 'CineNovaHD', 'MovieBoxHD', 'CineFlicksOfficial', 'MovieKingHD', 'CineCrewHD', 'MovieBazarHD', 'CineStreamIndia', 'MovieLinkHD', 'CineClubMovies', 'MovieMotionHD', 'CineCityMovies', 'MovieFactoryHD', 'CineMovieZone', 'MovieNexusHD', 'CineSceneMovies', 'MovieWaveHD', 'CineWorldPlus', 'MovieVibeOfficial', 'CineWorldIndia', 'MovieBaseZone', 'CineSpotMovies', 'MovieLandHD', 'CineGoldMovies', 'MovieMateIndia', 'CineHubX', 'MovieArenaIndia', 'CineCoreHub', 'MoviePassHD', 'CineFlickMovies', 'MovieCentralHD', 'CineTuneHD', 'MovieSkyOfficial', 'CineClubHD', 'MovieDreamsHD', 'CinePortPro', 'MovieSpotOfficial', 'CinePlayIndia', 'MovieScreenPro', 'CineXpressMovies', 'MoviePulseHD', 'CineSpaceHD', 'MovieCastHD', 'CineWorldHQ', 'MovieMasterHD', 'CineShowHD', 'MoviePortOfficial', 'CineRealmHD', 'MovieZoneOfficial', 'CineWorldMoviesHD', 'MoviePlanetOfficial', 'CineCloudPro', 'MovieLinkZone', 'CineAddaMovies', 'MovieStreamWorld', 'CineMasterIndia', 'MoviePlanetX', 'CineTownMovies', 'MovieVaultPro', 'CineBuzzHD', 'MovieMoodHD', 'CinePrimeWorld', 'MovieDreamHD', 'CineCatchMovies', 'MovieAddaOfficial', 'CineVerseHD', 'MovieHitZone', 'CineCrownHD', 'MovieTimeOfficial', 'CineViewHD', 'MovieStreamIndia', 'CineSpotIndia', 'MovieSpotHD', 'CinePlayMovies', 'MovieWalaHD', 'CineSeriesHD', 'MovieWorldOfficial', 'CineTrendHD', 'MovieZoneIndia', 'CinePulseMovies', 'MovieJoyHD', 'CineWorldAdda', 'MovieDockHD', 'CineSpotPro', 'MovieMagicIndia', 'CineCineHD', 'MovieFlixHD', 'CineBaseOfficial', 'MovieStoreOfficial', 'CineUploadMovies', 'MovieBoxIndia', 'CinePackHD', 'MovieSeriesHD', 'CineFileHD', 'MovieStreamPro', 'CineVaultIndia', 'MovieVerseOfficial', 'CineAddaHD', 'MovieXpressOfficial', 'CineStreamOfficial', 'MovieWavesHD', 'CineBayMovies', 'MovieVerseIndia', 'CineWebHD', 'MovieWalaOfficial', 'CineManiaHD', 'MovieBuzzIndia', 'CineFlixHD', 'MovieNationPro', 'CineSouthMovies', 'MovieZoneXpress', 'CineIndiaHD', 'MovieFilesHD', 'CineViewPro', 'MoviePlanetPro', 'CineSpotHQ', 'MovieTimePlus', 'CineLinkHD', 'MovieSkyPro', 'CineStreamWorld', 'MovieManiaOfficial', 'CineTrendMovies', 'MovieVaultZone', 'CineBoxPro', 'MovieStreamPlus', 'CineWorldPro', 'MovieCineHub', 'CineAddictHD', 'MovieMaxHD', 'CineStarPro', 'MovieHubHQ', 'CinePointHD', 'MovieNationPlus', 'CineHDWorld', 'MovieWatchHD', 'CineStreamMax', 'MoviePlusHD', 'CineClubPro', 'MovieBoxPro', 'CineZonePro', 'MovieWorldPlus', 'CinePlayPro', 'MovieTimeWorld', 'CineFilmHD', 'MovieVaultWorld', 'CineWatchMovies', 'MoviePlusOfficial', 'CineMaxMovies', 'MovieCornerIndia', 'CineMateIndia', 'MovieSpotPlus', 'CineBuzzPro', 'MovieArenaPro', 'CineLineMovies', 'MovieVerseWorld', 'CineEdgeHD', 'MovieDreamWorld', 'CineKingMovies', 'MoviePortPro', 'CineStreamPlus', 'MovieClipsPro', 'CineFlixPro', 'MovieSpotWorld', 'CineSeriesPro', 'MovieMateWorld', 'CineWatchPro', 'MovieWorldHQ', 'CineZoneWorld', 'MovieCineWorld', 'CineSpotWorld', 'MovieMateUniverse', 'CineStreamUniverse', 'MovieWorldUniverse',
    '@ClipmateMovies', '@CineMateHD', '@MovieMateZone', '@StreamMateFilms', '@ReelMateMovies', '@FlixMateOfficial', '@CineStreamHD', '@MovieVerseHQ', '@FilmVerseHD', '@CineVaultMovies', '@MovieWorldHub', '@CineScopeHD', '@MovieFlixZone', '@CineBoxHD', '@FlixArenaMovies', '@CineKingHD', '@StreamWorldMovies', '@MovieNovaHQ', '@CinePlanetHD', '@ReelTimeMovies', '@CineVerseOfficial', '@MoviePortHD', '@CineVaultHub', '@FlixKingMovies', '@MovieLoungeHD', '@CineGalaxyHub', '@BollywoodMateHD', '@SouthHindiMovies', '@SouthFlixMovies', '@HindiDubbedVerse', '@SouthDubHD', '@MovieHubSouth', '@BollywoodCinemaHD', '@SouthBlockbusters', '@TamilTeluguMovies', '@SouthMovieWorld', '@BollywoodFlixHQ', '@HindiMoviesZone', '@DesiCineHub', '@SouthHindiDubbed', '@BollywoodVerseHD', '@SouthActionMovies', '@HindiMoviezMate', '@CineSouthOfficial', '@DesiMovieWorld', '@SouthPlusMovies', '@IndianCinemaVerse', '@BollywoodStreamHD', '@SouthCinemaX', '@MovieHubIndia', '@HindiCineMate', '@FlixMateZone', '@CineXverse', '@MovieCrateHD', '@StreamifyMovies', '@CinePlayHub', '@WatchMateHD', '@FlixPointMovies', '@MovieXpressHD', '@CineDropHub', '@MovieFlowHQ', '@CineCoreMovies', '@ReelStreamHD', '@CineBuzzMovies', '@MovieCloudHub', '@CinePrimeHD', '@StreamZoneMovies', '@CineKingVerse', '@MovieSkyHD', '@FlixStreamOfficial', '@CineBoxOfficeHD', '@CineTimeMovies', '@MovieBytesHD', '@StreamMateOfficial', '@MovieRealmHD', '@CinePortMovies', '@CineSpotHD', '@MovieVersePlus', '@CineNovaMovies', '@StreamMateX', '@CineFlowMovies', '@MovieManiaHD', '@BollywoodPrimeHD', '@SouthHitMovies', '@CineKingPro', '@MovieVaultHD', '@CineZoneOfficial', '@FlixMateIndia', '@MoviePortX', '@CineStreamPro', '@MovieMantraHD', '@SouthCineWorld', '@HindiAddaMovies', '@CinePlanetIndia', '@MovieWorldX', '@FlixverseHD', '@MovieDockHub', '@CineBaseMovies', '@SouthTrendzHD', '@MoviePointHQ', '@CineNationHD', '@MovieStopOfficial', '@StreamLineMovies', '@BollywoodPrimeZone', '@CineMasterHD', '@MovieTimeX', '@SouthHQMovies', '@MovieMatePlus', '@CineFlixIndia', '@MovieCrushHD', '@CineFileMovies', '@MovieSagaHD', '@FlixTownMovies', '@MovieGalaxyHD', '@CineRushMovies', '@SouthFlicksHD', '@MovieEpicHub', '@CineFreakMovies', '@MoviePrimeHub', '@CineDriveMovies', '@MovieDuniyaHD', '@CineBaseIndia', '@MovieArenaHD', '@CineStarMovies', '@MovieScreenHD', '@CineVisionMovies', '@MoviePointZone', '@CineWorldPrime', '@MovieManorHD', '@CineCastMovies', '@MovieBuzzHD', '@CineLoversHub', '@MovieReelHD', '@CineSpaceMovies', '@MovieMediaHD', '@CineWavesHub', '@MoviePortalHD', '@CineXMovies', '@MovieEmpireHD', '@CineEdgeMovies', '@MovieMagicHD', '@CineNextHub', '@MovieAddaHQ', '@CineGateMovies', '@MovieFusionHD', '@CinePrimeZone', '@MovieNationHD', '@CineRoomMovies', '@MovieWorldsHD', '@CineLinkMovies', '@MoviePlayHQ', '@CineShowMovies', '@MovieFinderHD', '@CineCastleMovies', '@MovieVibesHD', '@CinePrimeIndia', '@MovieCornerHD', '@CineCrewMovies', '@MovieMateX', '@CineFlickHub', '@MovieStreamHD', '@CineStarHD', '@MovieMatrixHD', '@CineTuneMovies', '@MovieStoreHD', '@CinePortX', '@MovieCatchHD', '@CineViewMovies', '@MovieBaseHD', '@CineStreamZone', '@MovieBayHD', '@CineLightMovies', '@MovieStageHD', '@CineXtraMovies', '@MovieRoomHQ', '@CineCloudHD', '@MovieTimeIndia', '@CineFeedMovies', '@MovieStationHD', '@CinePostMovies', '@MoviePrimeOfficial', '@CineStreetMovies', '@MovieSyncHD', '@CineChannelMovies', '@MovieMateOfficial', '@CineVaultPro', '@MovieDeckHD', '@CineNovaHD', '@MovieBoxHD', '@CineFlicksOfficial', '@MovieKingHD', '@CineCrewHD', '@MovieBazarHD', '@CineStreamIndia', '@MovieLinkHD', '@CineClubMovies', '@MovieMotionHD', '@CineCityMovies', '@MovieFactoryHD', '@CineMovieZone', '@MovieNexusHD', 'CineSceneMovies', '@MovieWaveHD', '@CineWorldPlus', '@MovieVibeOfficial', '@CineWorldIndia', '@MovieBaseZone', '@CineSpotMovies', '@MovieLandHD', '@CineGoldMovies', '@MovieMateIndia', '@CineHubX', '@MovieArenaIndia', '@CineCoreHub', '@MoviePassHD', '@CineFlickMovies', '@MovieCentralHD', '@CineTuneHD', '@MovieSkyOfficial', '@CineClubHD', '@MovieDreamsHD', '@CinePortPro', '@MovieSpotOfficial', '@CinePlayIndia', '@MovieScreenPro', '@CineXpressMovies', '@MoviePulseHD', '@CineSpaceHD', '@MovieCastHD', '@CineWorldHQ', '@MovieMasterHD', '@CineShowHD', '@MoviePortOfficial', '@CineRealmHD', '@MovieZoneOfficial', '@CineWorldMoviesHD', '@MoviePlanetOfficial', '@CineCloudPro', '@MovieLinkZone', '@CineAddaMovies', '@MovieStreamWorld', '@CineMasterIndia', '@MoviePlanetX', '@CineTownMovies', '@MovieVaultPro', '@CineBuzzHD', '@MovieMoodHD', '@CinePrimeWorld', '@MovieDreamHD', '@CineCatchMovies', '@MovieAddaOfficial', '@CineVerseHD', '@MovieHitZone', '@CineCrownHD', '@MovieTimeOfficial', '@CineViewHD', '@MovieStreamIndia', '@CineSpotIndia', '@MovieSpotHD', '@CinePlayMovies', '@MovieWalaHD', '@CineSeriesHD', '@MovieWorldOfficial', '@CineTrendHD', '@MovieZoneIndia', '@CinePulseMovies', '@MovieJoyHD', '@CineWorldAdda', '@MovieDockHD', '@CineSpotPro', '@MovieMagicIndia', '@CineCineHD', '@MovieFlixHD', '@CineBaseOfficial', '@MovieStoreOfficial', '@CineUploadMovies', '@MovieBoxIndia', '@CinePackHD', '@MovieSeriesHD', '@CineFileHD', '@MovieStreamPro', '@CineVaultIndia', '@MovieVerseOfficial', '@CineAddaHD', '@MovieXpressOfficial', '@CineStreamOfficial', '@MovieWavesHD', '@CineBayMovies', '@MovieVerseIndia', '@CineWebHD', '@MovieWalaOfficial', '@CineManiaHD', '@MovieBuzzIndia', '@CineFlixHD', '@MovieNationPro', '@CineSouthMovies', '@MovieZoneXpress', '@CineIndiaHD', '@MovieFilesHD', '@CineViewPro', '@MoviePlanetPro', '@CineSpotHQ', '@MovieTimePlus', '@CineLinkHD', '@MovieSkyPro', '@CineStreamWorld', '@MovieManiaOfficial', '@CineTrendMovies', '@MovieVaultZone', '@CineBoxPro', '@MovieStreamPlus', '@CineWorldPro', '@MovieCineHub', '@CineAddictHD', '@MovieMaxHD', '@CineStarPro', '@MovieHubHQ', '@CinePointHD', '@MovieNationPlus', '@CineHDWorld', '@MovieWatchHD', '@CineStreamMax', '@MoviePlusHD', '@CineClubPro', '@MovieBoxPro', '@CineZonePro', '@MovieWorldPlus', '@CinePlayPro', '@MovieTimeWorld', '@CineFilmHD', '@MovieVaultWorld', '@CineWatchMovies', '@MoviePlusOfficial', '@CineMaxMovies', '@MovieCornerIndia', '@CineMateIndia', '@MovieSpotPlus', '@CineBuzzPro', '@MovieArenaPro', '@CineLineMovies', '@MovieVerseWorld', '@CineEdgeHD', '@MovieDreamWorld', '@CineKingMovies', '@MoviePortPro', '@CineStreamPlus', '@MovieClipsPro', '@CineFlixPro', '@MovieSpotWorld', '@CineSeriesPro', '@MovieMateWorld', '@CineWatchPro', '@MovieWorldHQ', '@CineZoneWorld', '@MovieCineWorld', '@CineSpotWorld', '@MovieMateUniverse', '@CineStreamUniverse', '@MovieWorldUniverse'
];

// Create a single, powerful regex from the entire blocklist.
const CHANNEL_NAMES_FOR_REGEX = RAW_CHANNEL_NAMES.map(name => 
    name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') // Escape special regex characters
);
const FULL_BLOCKLIST_REGEX = new RegExp(`(${CHANNEL_NAMES_FOR_REGEX.join('|')})`, 'gi');


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

    // --- Step 2: Clean and normalize the string for title extraction.
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    
    // UPDATED: Clean the filename in multiple stages for robustness.
    let cleanedName = nameWithoutExt
        .replace(/\[.*?\]/g, '')              // Stage 1: Remove bracketed content like [TGx].
        .replace(FULL_BLOCKLIST_REGEX, '');   // Stage 2: Remove any known channel/group name from the comprehensive list.
      
    let normalized = cleanedName.replace(/[._()+-]/g, " ").replace(/\s+/g, ' ').trim();


    // --- Step 3: Parse metadata from the normalized string.
    let year: string | null = null;
    let season: number | null = null;
    let episode: number | null = null;
    let moviename = '';

    const matchIndices: number[] = [];

    // Find Year
    const yearMatch = normalized.match(/\b(19\d{2}|20\d{2})\b/);
    if (yearMatch) {
        const potentialYear = parseInt(yearMatch[0], 10);
        if (potentialYear > 1900 && potentialYear < new Date().getFullYear() + 5) {
            year = yearMatch[0];
            matchIndices.push(normalized.indexOf(yearMatch[0]));
        }
    }

    // Find Season/Episode using comprehensive regex patterns
    // Pattern 1: Combined formats like S01E01, Season 01 Episode 01, S01x01
    let seMatch = normalized.match(/(?:Season|S|Series|Part)[\s._-]?(\d{1,2})(?:[\s._-x](?:E|Ep|Episode|EP)?[\s._-]?)(\d{1,3})\b/i);
    // Pattern 2: Fallback for formats like 1x02
    if (!seMatch) {
        seMatch = normalized.match(/\b(\d{1,2})x(\d{1,3})\b/i);
    }
    
    if (seMatch) {
        season = parseInt(seMatch[1], 10);
        episode = parseInt(seMatch[2], 10);
        matchIndices.push(normalized.indexOf(seMatch[0]));
    } else {
        // If no combined match, look for season and episode independently
        const seasonMatch = normalized.match(/(?:Season|S|Series|Part)[\s._-]?(\d{1,2})\b/i);
        if (seasonMatch) {
            season = parseInt(seasonMatch[1], 10);
            matchIndices.push(normalized.indexOf(seasonMatch[0]));
        }

        const episodeMatch = normalized.match(/(?:Episode|Ep|E|EP)[\s._-]?(\d{1,3})\b/i);
        if (episodeMatch) {
            episode = parseInt(episodeMatch[1], 10);
            matchIndices.push(normalized.indexOf(episodeMatch[0]));
        }
    }
    
    // Determine where the title ends. It's the first occurrence of any metadata.
    let titleEndIndex = -1;
    if (matchIndices.length > 0) {
        titleEndIndex = Math.min(...matchIndices);
    }

    if (titleEndIndex !== -1) {
        moviename = normalized.substring(0, titleEndIndex).trim();
    } else {
        // Fallback: If no metadata found, find where quality/language keywords start
        const parts = normalized.split(' ');
        const keywords = ['4k', '2160p', '1080p', '720p', '480p', 'web-dl', 'webdl', 'webrip', 'bluray', 'hdtv', 'hdrip', 'x264', 'hindi', 'english', 'eng', 'dual', 'audio'];
        let firstMetaIndex = -1;
        for (let i = 1; i < parts.length; i++) { // Start from 1 to avoid matching if title itself is a keyword
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
        // Indic
        'hindi': 'Hindi', 'hin': 'Hindi', 'hn': 'Hindi', 'hi': 'Hindi', 'हिन्दी': 'Hindi',
        'english': 'English', 'eng': 'English', 'en': 'English', 'e': 'English',
        'tamil': 'Tamil', 'tam': 'Tamil', 'ta': 'Tamil',
        'telugu': 'Telugu', 'tel': 'Telugu', 'te': 'Telugu',
        'kannada': 'Kannada', 'kan': 'Kannada', 'kn': 'Kannada',
        'malayalam': 'Malayalam', 'mal': 'Malayalam', 'ml': 'Malayalam',
        'marathi': 'Marathi', 'mar': 'Marathi', 'mr': 'Marathi',
        'bengali': 'Bengali', 'ben': 'Bengali', 'bn': 'Bengali', 'be': 'Bengali',
        'gujarati': 'Gujarati', 'guj': 'Gujarati', 'gj': 'Gujarati', 'gu': 'Gujarati',
        'punjabi': 'Punjabi', 'pan': 'Punjabi', 'pa': 'Punjabi', 'pb': 'Punjabi',
        'odia': 'Odia', 'ori': 'Odia', 'or': 'Odia', 'od': 'Odia',
        'assamese': 'Assamese', 'asm': 'Assamese', 'as': 'Assamese',
        'urdu': 'Urdu', 'urd': 'Urdu', 'ur': 'Urdu',
        
        // Misc
        'dual': 'Dual Audio', 'audio': 'Dual Audio',

        // International
        'spanish': 'Spanish', 'spa': 'Spanish', 'sp': 'Spanish', 'es': 'Spanish',
        'french': 'French', 'fre': 'French', 'fr': 'French', 'f': 'French',
        'german': 'German', 'ger': 'German', 'de': 'German', 'ge': 'German',
        'italian': 'Italian', 'ita': 'Italian', 'it': 'Italian',
        'russian': 'Russian', 'rus': 'Russian', 'ru': 'Russian',
        'japanese': 'Japanese', 'jpn': 'Japanese', 'ja': 'Japanese', 'jp': 'Japanese',
        'korean': 'Korean', 'kor': 'Korean', 'ko': 'Korean', 'kr': 'Korean',
        'chinese': 'Chinese', 'chi': 'Chinese', 'zh': 'Chinese', 'cn': 'Chinese',
        'arabic': 'Arabic', 'ara': 'Arabic', 'ar': 'Arabic',
        'turkish': 'Turkish', 'tur': 'Turkish', 'tr': 'Turkish',
        'portuguese': 'Portuguese', 'por': 'Portuguese', 'pt': 'Portuguese', 'br': 'Portuguese',
        'thai': 'Thai', 'tha': 'Thai', 'th': 'Thai',
        'vietnamese': 'Vietnamese', 'vie': 'Vietnamese', 'vi': 'Vietnamese',
        'indonesian': 'Indonesian', 'ind': 'Indonesian', 'id': 'Indonesian',
        'filipino': 'Filipino', 'fil': 'Filipino', 'ph': 'Filipino',
        'dutch': 'Dutch', 'dut': 'Dutch', 'nl': 'Dutch',
        'polish': 'Polish', 'pol': 'Polish', 'pl': 'Polish',
        'ukrainian': 'Ukrainian', 'ukr': 'Ukrainian', 'ua': 'Ukrainian',
        'swedish': 'Swedish', 'swe': 'Swedish', 'se': 'Swedish',
        'norwegian': 'Norwegian', 'nor': 'Norwegian', 'no': 'Norwegian',
        'danish': 'Danish', 'dan': 'Danish', 'dk': 'Danish',
        'finnish': 'Finnish', 'fin': 'Finnish', 'fi': 'Finnish',
        'greek': 'Greek', 'gre': 'Greek', 'el': 'Greek', 'gr': 'Greek',
        'hebrew': 'Hebrew', 'heb': 'Hebrew', 'he': 'Hebrew', 'iw': 'Hebrew',
        'persian': 'Persian', 'per': 'Persian', 'fa': 'Persian',
        'burmese': 'Burmese', 'bur': 'Burmese', 'my': 'Burmese', 'mm': 'Burmese',
        'sinhala': 'Sinhala', 'sinh': 'Sinhala', 'si': 'Sinhala',
        'afrikaans': 'Afrikaans', 'afr': 'Afrikaans', 'af': 'Afrikaans',
        'latin': 'Latin', 'lat': 'Latin', 'la': 'Latin',
        'romanian': 'Romanian', 'rom': 'Romanian', 'ro': 'Romanian',
        'bulgarian': 'Bulgarian', 'bul': 'Bulgarian', 'bg': 'Bulgarian',
        'hungarian': 'Hungarian', 'hun': 'Hungarian', 'hu': 'Hungarian',
        'czech': 'Czech', 'cze': 'Czech', 'cs': 'Czech',
        'slovak': 'Slovak', 'slo': 'Slovak', 'sk': 'Slovak',
        'serbian': 'Serbian', 'srb': 'Serbian', 'sr': 'Serbian',
        'croatian': 'Croatian', 'cro': 'Croatian', 'hr': 'Croatian',
        'malay': 'Malay', 'maly': 'Malay', 'ms': 'Malay',
        'kazakh': 'Kazakh', 'kaz': 'Kazakh', 'kk': 'Kazakh',
        'mongolian': 'Mongolian', 'mon': 'Mongolian', 'mn': 'Mongolian',
        'armenian': 'Armenian', 'arm': 'Armenian', 'hy': 'Armenian',
        'georgian': 'Georgian', 'geo': 'Georgian', 'ka': 'Georgian',
        'tatar': 'Tatar', 'tat': 'Tatar', 'tt': 'Tatar',
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
    if (details.season !== null) {
        const seasonStr = String(details.season).padStart(2, '0');
        if (details.episode !== null) {
            const episodeStr = String(details.episode).padStart(2, '0');
            parts.push(`S${seasonStr}E${episodeStr}`);
        } else {
            parts.push(`Season ${seasonStr}`);
        }
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