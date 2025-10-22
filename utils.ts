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
const RAW_CHANNEL_NAMES = [...new Set([
    // Specific Channel Names (with and without @)
    '@BollywoodCinemaHD', '@BollywoodCineMate', '@BollywoodFlixHQ', '@BollywoodMateHD', '@BollywoodPrimeHD', '@BollywoodPrimeZone', '@BollywoodStreamHD', '@BollywoodVerseHD', '@CineAddaHD', '@CineAddaMovies', '@CineAddictHD', '@CineArena', '@CineArenaIndia', '@CineBaseIndia', '@CineBaseMovies', '@CineBaseOfficial', '@CineBayMovies', '@CineBoxHD', '@CineBoxOfficeHD', '@CineBoxPro', '@CineBuzzHD', '@CineBuzzMovies', '@CineBuzzPro', '@CineCastMovies', '@CineCastleMovies', '@CineCatchMovies', '@CineChannelMovies', '@CineCineHD', '@CineCloudHD', '@CineCloudPro', '@CineClubHD', '@CineClubMovies', '@CineClubPro', '@CineCoreHub', '@CineCoreMovies', '@CineCrateHD', '@CineCrewHD', '@CineCrewMovies', '@CineCrownHD', '@CineDeckHD', '@CineDropHub', '@CineEdgeHD', '@CineEdgeMovies', '@CineFileHD', '@CineFileMovies', '@CineFilmHD', '@CineFlickHub', '@CineFlickMovies', '@CineFlicksOfficial', '@CineFlixHD', '@CineFlixIndia', '@CineFlixPro', '@CineFlowMovies', '@CineFreakMovies', '@CineGateMovies', '@CineGalaxyHub', '@CineGoldMovies', '@CineHDWorld', '@CineHubX', '@CineIndiaHD', '@CineKingHD', '@CineKingMovies', '@CineKingPro', '@CineKingVerse', '@CineLightMovies', '@CineLineMovies', '@CineLinkHD', '@CineLinkMovies', '@CineLoversHub', '@CineManiaHD', '@CineMasterHD', '@CineMasterIndia', '@CineMateHD', '@CineMateIndia', '@CineMatrixHD', '@CineMaxMovies', '@CineMediaHD', '@CineMovieZone', '@CineNextHub', '@CineNovaHD', '@CineNovaMovies', '@CinePackHD', '@CinePlanetHD', '@CinePlanetIndia', '@CinePlayHub', '@CinePlayIndia', '@CinePlayMovies', '@CinePlayPro', '@CinePointHD', '@CinePortHD', '@CinePortMovies', '@CinePortPro', '@CinePortX', '@CinePostMovies', '@CinePrimeHD', '@CinePrimeIndia', '@CinePrimeOfficial', '@CinePrimeWorld', '@CinePrimeZone', '@CinePulseMovies', '@CineRealmHD', '@CineReelHD', '@CineRoomMovies', '@CineRushMovies', '@CineScopeHD', '@CineScreenHD', '@CineScreenPro', '@CineSeriesHD', '@CineSeriesPro', '@CineShowHD', '@CineShowMovies', '@CineSouthMovies', '@CineSouthOfficial', '@CineSpaceHD', '@CineSpaceMovies', '@CineSpotHD', '@CineSpotHQ', '@CineSpotIndia', '@CineSpotMovies', '@CineSpotPro', '@CineSpotWorld', '@CineStarHD', '@CineStarMovies', '@CineStarPro', '@CineStreamHD', '@CineStreamIndia', '@CineStreamMax', '@CineStreamOfficial', '@CineStreamPro', '@CineStreamPlus', '@CineStreamUniverse', '@CineStreamWorld', '@CineStreamZone', '@CineStreetMovies', '@CineSyncHD', '@CineTimeMovies', '@CineTownMovies', '@CineTrendHD', '@CineTrendMovies', '@CineTuneHD', '@CineTuneMovies', '@CineUploadMovies', '@CineVaultHub', '@CineVaultIndia', '@CineVaultMovies', '@CineVaultPro', '@CineVerseHD', '@CineVerseOfficial', '@CineViewHD', '@CineViewMovies', '@CineViewPro', '@CineVisionMovies', '@CineWatchMovies', '@CineWatchPro', '@CineWavesHub', '@CineWebHD', '@CineWorldAdda', '@CineWorldHQ', '@CineWorldIndia', '@CineWorldMoviesHD', '@CineWorldPlus', '@CineWorldPrime', '@CineWorldPro', '@CineXMovies', '@CineXpressMovies', '@CineXtraMovies', '@CineXverse', '@CineZoneOfficial', '@CineZonePro', '@CineZoneWorld', '@ClipmateMovies', '@DesiCineHub', '@DesiMovieWorld', '@FilmVerseHD', '@FlixArenaMovies', '@FlixKingMovies', '@FlixMateIndia', '@FlixMateOfficial', '@FlixMateZone', '@FlixStreamOfficial', '@FlixTownMovies', '@FlixverseHD', '@HellKing69', '@HindiAddaMovies', '@HindiCineMate', '@HindiDubbedVerse', '@HindiMoviezMate', '@HindiMoviesZone', '@IndianCinemaVerse', '@MovieAddaHQ', '@MovieAddaOfficial', '@MovieArenaHD', '@MovieArenaIndia', '@MovieArenaPro', '@MovieBaseHD', '@MovieBaseZone', '@MovieBayHD', '@MovieBazarHD', '@MovieBoxHD', '@MovieBoxIndia', '@MovieBoxPro', '@MovieBuzzHD', '@MovieBuzzIndia', '@MovieBytesHD', '@MovieCastHD', '@MovieCatchHD', '@MovieCineHub', '@MovieCineWorld', '@MovieCloudHub', '@MovieCornerHD', '@MovieCornerIndia', '@MovieCrateHD', '@MovieCrewHD', '@MovieCrushHD', '@MovieDeckHD', '@MovieDockHD', '@MovieDockHub', '@MovieDreamHD', '@MovieDreamsHD', '@MovieDreamWorld', '@MovieDuniyaHD', '@MovieEmpireHD', '@MovieEpicHub', '@MovieFactoryHD', '@MovieFinderHD', '@MovieFilesHD', '@MovieFlixHD', '@MovieFlixZone', '@MovieFlowHQ', '@MovieFusionHD', '@MovieGalaxyHD', '@MovieHitZone', '@MovieHubIndia', '@MovieHubHQ', '@MovieHubSouth', '@MovieJoyHD', '@MovieKingHD', '@MovieLandHD', '@MovieLinkHD', '@MovieLinkZone', '@MovieLoungeHD', '@MovieMagicHD', '@MovieMagicIndia', '@MovieManiaHD', '@MovieManiaOfficial', '@MovieManorHD', '@MovieMantraHD', '@MovieMasterHD', '@MovieMatrixHD', '@MovieMediaHD', '@MovieMoodHD', '@MovieMotionHD', '@MovieNationHD', '@MovieNationPlus', '@MovieNationPro', '@MovieNexusHD', '@MovieNovaHQ', '@MoviePassHD', '@MoviePlanetOfficial', '@MoviePlanetPro', '@MoviePlanetX', '@MoviePlayHQ', '@MoviePlusHD', '@MoviePlusOfficial', '@MoviePointHQ', '@MoviePointZone', '@MoviePortHD', '@MoviePortOfficial', '@MoviePortPro', '@MoviePortX', '@MoviePrimeHub', '@MoviePrimeOfficial', '@MoviePulseHD', '@MovieRealmHD', '@MovieReelHD', '@MovieRoomHQ', '@MovieSagaHD', '@MovieSkyHD', '@MovieSkyOfficial', '@MovieSkyPro', '@MovieSpotHD', '@MovieSpotOfficial', '@MovieSpotPlus', '@MovieSpotWorld', '@MovieStageHD', '@MovieStationHD', '@MovieStoreHD', '@MovieStoreOfficial', '@MovieStreamHD', '@MovieStreamIndia', '@MovieStreamPlus', 'MovieStreamPro', '@MovieStreamPro', '@MovieStreamWorld', '@MovieSyncHD', '@MovieTimeIndia', '@MovieTimeOfficial', '@MovieTimePlus', '@MovieTimeWorld', '@MovieTimeX', '@MovieVaultHD', '@MovieVaultPro', '@MovieVaultZone', '@MovieVaultWorld', '@MovieVerseHD', '@MovieVerseHQ', '@MovieVerseIndia', '@MovieVerseOfficial', '@MovieVersePlus', '@MovieVerseWorld', '@MovieVibesHD', '@MovieVibeOfficial', '@MovieWalaHD', '@MovieWalaOfficial', '@MovieWatchHD', '@MovieWaveHD', '@MovieWavesHD', '@MovieWorldHub', '@MovieWorldOfficial', '@MovieWorldPlus', '@MovieWorldUniverse', '@MovieWorldX', '@MovieWorldsHD', '@MovieXpressHD', '@MovieXpressOfficial', '@MovieZoneIndia', '@MovieZoneOfficial', '@MovieZoneXpress', '@ReelMateMovies', '@ReelStreamHD', '@ReelTimeMovies', '@SouthActionMovies', '@SouthBlockbusters', '@SouthCinemaX', '@SouthCineWorld', '@SouthDubHD', '@SouthFlicksHD', '@SouthFlixMovies', '@SouthHitMovies', '@SouthHQMovies', '@SouthHindiDubbed', '@SouthHindiMovies', '@SouthMovieWorld', '@SouthPlusMovies', '@SouthTrendzHD', '@StreamifyMovies', '@StreamLineMovies', '@StreamMateFilms', '@StreamMateOfficial', '@StreamMateX', '@StreamWorldMovies', '@StreamZoneMovies', '@TamilTeluguMovies', '@WatchMateHD', 'BollywoodCinemaHD', 'BollywoodCineMate', 'BollywoodFlixHQ', 'BollywoodMateHD', 'BollywoodPrimeHD', 'BollywoodPrimeZone', 'BollywoodStreamHD', 'BollywoodVerseHD', 'CineAddaHD', 'CineAddaMovies', 'CineAddictHD', 'CineArena', 'CineArenaIndia', 'CineBaseIndia', 'CineBaseMovies', 'CineBaseOfficial', 'CineBayMovies', 'CineBoxHD', 'CineBoxOfficeHD', 'CineBoxPro', 'CineBuzzHD', 'CineBuzzMovies', 'CineBuzzPro', 'CineCastMovies', 'CineCastleMovies', 'CineCatchMovies', 'CineChannelMovies', 'CineCineHD', 'CineCloudHD', 'CineCloudPro', 'CineClubHD', 'CineClubMovies', 'CineClubPro', 'CineCoreHub', 'CineCoreMovies', 'CineCrateHD', 'CineCrewHD', 'CineCrewMovies', 'CineCrownHD', 'CineDeckHD', 'CineDropHub', 'CineEdgeHD', 'CineEdgeMovies', 'CineFileHD', 'CineFileMovies', 'CineFilmHD', 'CineFlickHub', 'CineFlickMovies', 'CineFlicksOfficial', 'CineFlixHD', 'CineFlixIndia', 'CineFlixPro', 'CineFlowMovies', 'CineFreakMovies', 'CineGateMovies', 'CineGalaxyHub', 'CineGoldMovies', 'CineHDWorld', 'CineHubX', 'CineIndiaHD', 'CineKingHD', 'CineKingMovies', 'CineKingPro', 'CineKingVerse', 'CineLightMovies', 'CineLineMovies', 'CineLinkHD', 'CineLinkMovies', 'CineLoversHub', 'CineManiaHD', 'CineMasterHD', 'CineMasterIndia', 'CineMateHD', 'CineMateIndia', 'CineMatrixHD', 'CineMaxMovies', 'CineMediaHD', 'CineMovieZone', 'CineNextHub', 'CineNovaHD', 'CineNovaMovies', 'CinePackHD', 'CinePlanetHD', 'CinePlanetIndia', 'CinePlayHub', 'CinePlayIndia', 'CinePlayMovies', 'CinePlayPro', 'CinePointHD', 'CinePortHD', 'CinePortMovies', 'CinePortPro', 'CinePortX', 'CinePostMovies', 'CinePrimeHD', 'CinePrimeIndia', 'CinePrimeOfficial', 'CinePrimeWorld', 'CinePrimeZone', 'CinePulseMovies', 'CineRealmHD', 'CineReelHD', 'CineRoomMovies', 'CineRushMovies', 'CineScopeHD', 'CineScreenHD', 'CineScreenPro', 'CineSeriesHD', 'CineSeriesPro', 'CineShowHD', 'CineShowMovies', 'CineSouthMovies', 'CineSouthOfficial', 'CineSpaceHD', 'CineSpaceMovies', 'CineSpotHD', 'CineSpotHQ', 'CineSpotIndia', 'CineSpotMovies', 'CineSpotPro', 'CineSpotWorld', 'CineStarHD', 'CineStarMovies', 'CineStarPro', 'CineStreamHD', 'CineStreamIndia', 'CineStreamMax', 'CineStreamOfficial', 'CineStreamPro', 'CineStreamPlus', 'CineStreamUniverse', 'CineStreamWorld', 'CineStreamZone', 'CineStreetMovies', 'CineSyncHD', 'CineTimeMovies', 'CineTownMovies', 'CineTrendHD', 'CineTrendMovies', 'CineTuneHD', 'CineTuneMovies', 'CineUploadMovies', 'CineVaultHub', 'CineVaultIndia', 'CineVaultMovies', 'CineVaultPro', 'CineVerseHD', 'CineVerseOfficial', 'CineViewHD', 'CineViewMovies', 'CineViewPro', 'CineVisionMovies', 'CineWatchMovies', 'CineWatchPro', 'CineWavesHub', 'CineWebHD', 'CineWorldAdda', 'CineWorldHQ', 'CineWorldIndia', 'CineWorldMoviesHD', 'CineWorldPlus', 'CineWorldPrime', 'CineWorldPro', 'CineXMovies', 'CineXpressMovies', 'CineXtraMovies', 'CineXverse', 'CineZoneOfficial', 'CineZonePro', 'CineZoneWorld', 'ClipmateMovies', 'DesiCineHub', 'DesiMovieWorld', 'FilmVerseHD', 'FlixArenaMovies', 'FlixKingMovies', 'FlixMateIndia', 'FlixMateOfficial', 'FlixMateZone', 'FlixStreamOfficial', 'FlixTownMovies', 'FlixverseHD', 'HellKing69', 'HindiAddaMovies', 'HindiCineMate', 'HindiDubbedVerse', 'HindiMoviezMate', 'HindiMoviesZone', 'IndianCinemaVerse', 'MovieAddaHQ', 'MovieAddaOfficial', 'MovieArenaHD', 'MovieArenaIndia', 'MovieArenaPro', 'MovieBaseHD', 'MovieBaseZone', 'MovieBayHD', 'MovieBazarHD', 'MovieBoxHD', 'MovieBoxIndia', 'MovieBoxPro', 'MovieBuzzHD', 'MovieBuzzIndia', 'MovieBytesHD', 'MovieCastHD', 'MovieCatchHD', 'MovieCineHub', 'MovieCineWorld', 'MovieCloudHub', 'MovieCornerHD', 'MovieCornerIndia', 'MovieCrateHD', 'MovieCrewHD', 'MovieCrushHD', 'MovieDeckHD', 'MovieDockHD', 'MovieDockHub', 'MovieDreamHD', 'MovieDreamsHD', 'MovieDreamWorld', 'MovieDuniyaHD', 'MovieEmpireHD', 'MovieEpicHub', 'MovieFactoryHD', 'MovieFinderHD', 'MovieFilesHD', 'MovieFlixHD', 'MovieFlixZone', 'MovieFlowHQ', 'MovieFusionHD', 'MovieGalaxyHD', 'MovieHitZone', 'MovieHubIndia', 'MovieHubHQ', 'MovieHubSouth', 'MovieJoyHD', 'MovieKingHD', 'MovieLandHD', 'MovieLinkHD', 'MovieLinkZone', 'MovieLoungeHD', 'MovieMagicHD', 'MovieMagicIndia', 'MovieManiaHD', 'MovieManiaOfficial', 'MovieManorHD', 'MovieMantraHD', 'MovieMasterHD', 'MovieMatrixHD', 'MovieMediaHD', 'MovieMoodHD', 'MovieMotionHD', 'MovieNationHD', 'MovieNationPlus', 'MovieNationPro', 'MovieNexusHD', 'MovieNovaHQ', 'MoviePassHD', 'MoviePlanetOfficial', 'MoviePlanetPro', 'MoviePlanetX', 'MoviePlayHQ', 'MoviePlusHD', 'MoviePlusOfficial', 'MoviePointHQ', 'MoviePointZone', 'MoviePortHD', 'MoviePortOfficial', 'MoviePortPro', 'MoviePortX', 'MoviePrimeHub', 'MoviePrimeOfficial', 'MoviePulseHD', 'MovieRealmHD', 'MovieReelHD', 'MovieRoomHQ', 'MovieSagaHD', 'MovieSkyHD', 'MovieSkyOfficial', 'MovieSkyPro', 'MovieSpotHD', 'MovieSpotOfficial', 'MovieSpotPlus', 'MovieSpotWorld', 'MovieStageHD', 'MovieStationHD', 'MovieStoreHD', 'MovieStoreOfficial', 'MovieStreamHD', 'MovieStreamIndia', 'MovieStreamPlus', 'MovieStreamPro', 'MovieStreamWorld', 'MovieSyncHD', 'MovieTimeIndia', 'MovieTimeOfficial', 'MovieTimePlus', 'MovieTimeWorld', 'MovieTimeX', 'MovieVaultHD', 'MovieVaultPro', 'MovieVaultZone', 'MovieVaultWorld', 'MovieVerseHD', 'MovieVerseHQ', 'MovieVerseIndia', 'MovieVerseOfficial', 'MovieVersePlus', 'MovieVerseWorld', 'MovieVibesHD', 'MovieVibeOfficial', 'MovieWalaHD', 'MovieWalaOfficial', 'MovieWatchHD', 'MovieWaveHD', 'MovieWavesHD', 'MovieWorldHub', 'MovieWorldOfficial', 'MovieWorldPlus', 'MovieWorldUniverse', 'MovieWorldX', 'MovieWorldsHD', 'MovieXpressHD', 'MovieXpressOfficial', 'MovieZoneIndia', 'MovieZoneOfficial', 'MovieZoneXpress', 'ReelMateMovies', 'ReelStreamHD', 'ReelTimeMovies', 'SouthActionMovies', 'SouthBlockbusters', 'SouthCinemaX', 'SouthCineWorld', 'SouthDubHD', 'SouthFlicksHD', 'SouthFlixMovies', 'SouthHitMovies', 'SouthHQMovies', 'SouthHindiDubbed', 'SouthHindiMovies', 'SouthMovieWorld', 'SouthPlusMovies', 'SouthTrendzHD', 'StreamifyMovies', 'StreamLineMovies', 'StreamMateFilms', 'StreamMateOfficial', 'StreamMateX', 'StreamWorldMovies', 'StreamZoneMovies', 'TamilTeluguMovies', 'WatchMateHD',

    // Generic Streaming/Movie related compound names
    'bolly4u', 'bollyclub', 'bollyflix', 'bollyflixhd', 'cineadda', 'cineclub', 'cineclubx', 'cinecrew', 'cinefire', 'cineflix', 'cineflixhd', 'cinegalaxy', 'cinegalaxyhd', 'cinehub', 'cineland', 'cinelandhd', 'cinelandhub', 'cinemania', 'cinemaniacs', 'cinemaxhd', 'cinemaxworld', 'cinepack', 'cinepath', 'cineplanet', 'cinepost', 'cinepro', 'cinestream', 'cinestreamhub', 'cinestreamx', 'cineuniverse', 'cineverse', 'cineversehd', 'cinevibe', 'cinewar', 'cinexpress', 'cinezone', 'cinezonehd', 'cinezonex', 'coolmoviez', 'desiflix', 'desimovies', 'extramovies', 'filmymeet', 'filmyhit', 'filmywap', 'filmyworld', 'filmyzilla', 'flixadda', 'flixbase', 'flixboss', 'flixclub', 'flixcorner', 'flixhive', 'flixhub', 'flixking', 'flixlovers', 'flixplanet', 'flixstudio', 'flixuniverse', 'flixverse', 'flixversehd', 'flixvilla', 'flixworld', 'flixxpress', 'flixxworld', 'flixzone', 'hdadda', 'hdhub', 'hdhub4u', 'hellkingbot', 'hubcrew', 'katmovie', 'katmovies', 'kingofmovies', 'mlwbd', 'movieadda', 'movieboss', 'movieclub', 'moviecorner', 'moviecrew', 'movieempire', 'moviegalaxy', 'moviegod', 'movieking', 'moviekinghd', 'movieland', 'movielandhub', 'movielovers', 'moviemaniac', 'moviemaster', 'movieplanet', 'movierulz', 'moviesadda', 'moviesflix', 'movieshub', 'movieshubhd', 'moviesmod', 'moviesverse', 'movieuniverse', 'moviewarrior', 'movieworld', 'movieworld4u', 'movieworldhd', 'movieworldx', 'moviezone', 'moviezonehd', '9xmovies', 'primeflix', 'primeflixhd', 'primehub', 'primeking', 'primeworld', 'skymovies', 'streamadda', 'streamarena', 'streambase', 'streambox', 'streamcenter', 'streamclub', 'streamcorner', 'streamcrew', 'streamdunia', 'streamfile', 'streamflix', 'streamflixhd', 'streamflixx', 'streamhub', 'streamhubhd', 'streamking', 'streamland', 'streamline', 'streammate', 'streamon', 'streampath', 'streamplanet', 'streamplus', 'streamspace', 'streamersteam', 'streamersclub', 'streamershub', 'streamersverse', 'streamersworld', 'streamtime', 'streamvilla', 'streamworld', 'streamxpress', 'streamzone', 'vegamovies', 'vegamovieshd', 'world4u', 'world4ufree', 'worldcrew'
]).values()].sort();

// Create a single, powerful regex from the entire blocklist.
const CHANNEL_NAMES_FOR_REGEX = RAW_CHANNEL_NAMES.map(name => 
    name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') // Escape special regex characters
);
const FULL_BLOCKLIST_REGEX = new RegExp(`(${CHANNEL_NAMES_FOR_REGEX.join('|')})`, 'gi');

// A list of generic "bad words" to strip from titles after initial parsing.
const GENERIC_BAD_WORDS_LIST = [...new Set([
    'ads', 'admin', 'area', 'arena', 'at', 'audio', 'autobot', 'autofilter', 'bazaar', 'bdrip', 'bluray', 'bolly4u', 'bot', 'bott', 'by', 'center', 'channel', 'chanel', 'chnl', 'cine', 'cinebot', 'cinehub', 'cinemaz', 'club', 'com', 'comment', 'community', 'compressed', 'compressedby', 'coolmoviez', 'core', 'corner', 'daily', 'dl', 'dot', 'download', 'dvdrip', 'dm', 'empire', 'enc', 'encode', 'encoded', 'exclusive', 'factory', 'fast', 'fastdl', 'fb', 'facebook', 'filebot', 'filmhubbot', 'flix', 'flixbot', 'follow', 'followus', 'free', 'fresh', 'from', 'galaxy', 'group', 'grp', 'hdprint', 'hdrip', 'hevc', 'hell_king', 'hellking', 'house', 'http', 'https', 'hub', 'in', 'insta', 'instagram', 'join', 'king', 'latest', 'lite', 'link', 'market', 'max', 'mediahub', 'mini', 'mirror', 'mix', 'mod', 'moviebot', 'movierip', 'msg', 'nation', 'net', 'network', 'new', 'official', 'on', 'org', 'orgnl', 'pack', 'planet', 'plus', 'pm', 'post', 'posted', 'premium', 'pro', 'reel', 'release', 'repack', 'reshare', 'reupload', 'rip', 'share', 'shared', 'short', 'shorts', 'site', 'space', 'spot', 'store', 'studio', 'subs', 'subscribe', 't.me', 'team', 'tele', 'telegram', 'telegrm', 'telegran', 'tg', 'tgbot', 'tgbots', 'tgchannel', 'tggroup', 'tglgrm', 'tlg', 'tlgm', 'tlgmovies', 'tlgram', 'tlgrm', 'tlgrmbot', 'top', 'tgram', 'trending', 'twitter', 'ultra', 'update', 'updates', 'upload', 'uploadbot', 'uploaded', 'uploadedby', 'uploadedon', 'uploadedto', 'uploader', 'url', 'vault', 'verse', 'vip', 'web', 'web-dl', 'webdl', 'webhd', 'world', 'www', 'x264', 'x265', 'xpress', 'xyz', 'yt', 'youtube', 'zone'
]).values()].sort();
// FIX: Corrected variable name from GENERIC_BAD_WORDS to GENERIC_BAD_WORDS_LIST
const BAD_WORDS_REGEX = new RegExp(`\\b(${GENERIC_BAD_WORDS_LIST.join('|')})\\b`, 'gi');


/**
 * A robust, shared function to parse metadata from a filename string.
 * It uses the year as a primary delimiter to separate title from metadata.
 */
function coreFilenameParser(filename: string): { moviename: string; year: string | null; languages: string[]; quality: string | null; size: string | null; season: number | null, episode: number | null } {
    // --- Step 0: Force to lowercase to ensure all subsequent regex is case-insensitive
    const lowerFilename = filename.toLowerCase();

    // --- Step 1: Extract size BEFORE normalization, as normalization can break the format (e.g., "1.23 GB").
    let size: string | null = null;
    const sizeMatch = lowerFilename.match(/(\d+(\.\d+)?\s?(gb|mb))/i);
    if (sizeMatch) {
      size = sizeMatch[0].replace(/\s/g, '').toUpperCase();
    }

    // --- Step 2: Clean and normalize the string for title extraction.
    const nameWithoutExt = lowerFilename.replace(/\.[^/.]+$/, "");
    
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

    // --- Final cleaning of the extracted title
    moviename = moviename
        .replace(BAD_WORDS_REGEX, '')      // remove common spammy words
        .replace(/[^a-z0-9\s]/g, ' ')   // remove all non-alphanumeric chars, replacing with a space
        .replace(/\s+/g, ' ')           // collapse multiple spaces into one
        .trim();

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