import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../hooks/useToast';
import {
  XIcon,
  SearchIcon,
  PlusCircleIcon,
  TrashIcon,
  SpinnerIcon,
  FilmIcon,
} from './Icons';
import {
  StoredMovie,
  TMDBSearchResult,
  ContentType,
} from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { searchTMDB, searchContentByType, apiParseUrl } from '../services/api';
import { TMDB_IMAGE_BASE_URL_SMALL } from '../constants';

// Interfaces specific to this modal
interface LinkFormData {
    label: string;
    url: string;
}

interface ContentFormData {
    tmdb_id: number;
    type: ContentType;
    title: string;
    download_links: LinkFormData[];
}

export interface ContentModalProps {
    movie: StoredMovie | null;
    onClose: () => void;
    onSave: (movie: StoredMovie, isNew: boolean) => void;
}

const ContentModal: React.FC<ContentModalProps> = ({ movie, onClose, onSave }) => {
    const { addToast } = useToast();
    const [isNew] = useState(!movie);
    
    const [formData, setFormData] = useState<ContentFormData>(
        movie 
        ? { tmdb_id: movie.tmdb_id, type: movie.type, title: movie.title, download_links: movie.download_links } 
        : { tmdb_id: 0, type: 'movie', title: '', download_links: [{ label: '', url: '' }] }
    );

    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 300);
    const [searchResults, setSearchResults] = useState<TMDBSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [automatingIndex, setAutomatingIndex] = useState<number | null>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchSearchResults = async () => {
            if (debouncedSearch.trim().length > 1) {
                setIsSearching(true);
                try {
                    const res = await searchTMDB(debouncedSearch);
                    setSearchResults(res.results);
                } catch (error) {
                    addToast('Failed to search TMDB.', 'error');
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        };
        fetchSearchResults();
    }, [debouncedSearch, addToast]);
    
     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setSearchResults([]);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectContent = (result: TMDBSearchResult) => {
        setFormData(prev => ({
            ...prev,
            tmdb_id: result.id,
            title: result.media_type === 'movie' ? result.title : result.name,
            type: result.media_type,
        }));
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleClearContent = () => {
        setFormData(prev => ({
            ...prev,
            tmdb_id: 0,
            title: '',
            type: 'movie', // Reset to a default
        }));
    };

    const handleLinkChange = (index: number, field: keyof LinkFormData, value: string) => {
        const newLinks = [...formData.download_links];
        newLinks[index] = { ...newLinks[index], [field]: value };
        setFormData(prev => ({ ...prev, download_links: newLinks }));
    };

    const handleAutomateLink = async (index: number) => {
        const linkUrl = formData.download_links[index].url;
        if (!linkUrl.trim()) {
            addToast('Please paste a URL first.', 'error');
            return;
        }
        setAutomatingIndex(index);
        try {
            const parsedData = await apiParseUrl(linkUrl);
            
            const labelParts = [];
            if (parsedData.movieName) {
                // The parser now capitalizes, but we can ensure it here too.
                const capitalizedTitle = parsedData.movieName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                labelParts.push(capitalizedTitle);
            }

            if (parsedData.season !== null) {
                const seasonStr = String(parsedData.season).padStart(2, '0');
                if (parsedData.episode !== null) {
                    const episodeStr = String(parsedData.episode).padStart(2, '0');
                    labelParts.push(`S${seasonStr}E${episodeStr}`);
                } else {
                    labelParts.push(`Season ${seasonStr}`);
                }
            }
            
            if(parsedData.quality) labelParts.push(parsedData.quality);
            if(parsedData.languages && parsedData.languages.length > 0) labelParts.push(parsedData.languages.join('+'));
            if(parsedData.size) labelParts.push(`[${parsedData.size}]`);
            
            const newLabel = labelParts.join(' ').trim() || 'Download';
    
            const newLinks = [...formData.download_links];
            newLinks[index].label = newLabel;
            
            let contentFound = false;
    
            if (isNew && !formData.tmdb_id && parsedData.movieName) {
                addToast(`Searching TMDB for "${parsedData.movieName}"...`, 'info');
                const searchType = parsedData.season !== null ? 'tv' : 'movie';
                const searchResults = await searchContentByType(parsedData.movieName, searchType, parsedData.year || undefined);
                
                if (searchResults.results && searchResults.results.length > 0) {
                    const topResult = searchResults.results[0];
                    
                    setFormData(prev => ({
                        ...prev,
                        download_links: newLinks,
                        tmdb_id: topResult.id,
                        title: 'title' in topResult ? topResult.title : topResult.name,
                        type: searchType,
                    }));
                    contentFound = true;
                    addToast('Content found and filled automatically!', 'success');
                } else if(parsedData.movieName) {
                    setFormData(prev => ({ ...prev, title: parsedData.movieName, type: searchType }));
                }
            }
    
            if (!contentFound) {
                setFormData(prev => ({ ...prev, download_links: newLinks }));
                addToast(
                    isNew && parsedData.movieName 
                    ? `Label automated, but no TMDB match found for "${parsedData.movieName}". Please search manually.`
                    : 'Label automated successfully!',
                    'info'
                );
            }
    
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'Automation failed.', 'error');
        } finally {
            setAutomatingIndex(null);
        }
    };

    const addLink = () => {
        setFormData(prev => ({ ...prev, download_links: [...prev.download_links, { label: '', url: '' }] }));
    };

    const removeLink = (index: number) => {
        setFormData(prev => ({ ...prev, download_links: prev.download_links.filter((_, i) => i !== index) }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isNew && (!formData.tmdb_id || !formData.title)) {
            addToast('Please select a movie or TV show.', 'error');
            return;
        }

        const movieToSave: StoredMovie = {
            _id: movie?._id || '',
            tmdb_id: formData.tmdb_id,
            type: formData.type,
            title: formData.title,
            download_count: movie?.download_count || 0,
            download_links: formData.download_links
                .filter(link => link.url.trim())
                .map(link => ({
                    label: link.label.trim() || link.url.trim(),
                    url: link.url.trim(),
                }))
        };
        onSave(movieToSave, isNew);
        onClose();
    };

    const inputClass = "w-full bg-secondary border border-glass-border rounded-md p-2 text-sm text-white focus:ring-2 focus:ring-cyan focus:outline-none";
    
    return (
        <div className="glass-panel rounded-xl shadow-xl w-full max-w-3xl border-cyan mt-32 mb-8 md:mt-[55px] md:mb-84" style={{boxShadow: '0 0 30px rgba(8, 217, 214, 0.4)'}} onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSubmit}>
                <div className="p-5 border-b border-glass-border flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">{isNew ? 'Add New Content' : `Editing "${formData.title}"`}</h3>
                    <button onClick={onClose} type="button" className="p-1 rounded-full hover:bg-white/10"><XIcon className="h-5 w-5 text-muted" /></button>
                </div>
                
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    {isNew && (
                        <div className="relative" ref={searchContainerRef}>
                            <label className="block text-sm font-medium text-muted mb-1">Search TMDB</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search for a movie or TV show..."
                                    className={inputClass + " pl-9"}
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    disabled={!!formData.tmdb_id}
                                />
                                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <SearchIcon className="h-5 w-5 text-muted" />
                                </div>
                            </div>
                            {(isSearching || searchResults.length > 0) && (
                                <div className="absolute z-10 w-full mt-1 bg-primary border border-glass-border rounded-md shadow-lg max-h-64 overflow-y-auto">
                                    {isSearching && <div className="p-3 text-muted text-sm">Searching...</div>}
                                    {searchResults.map(result => {
                                        const title = result.media_type === 'movie' ? result.title : result.name;
                                        const releaseDate = result.media_type === 'movie' ? result.release_date : result.first_air_date;
                                        const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';

                                        return (
                                            <div key={result.id} onClick={() => handleSelectContent(result)} className="flex items-center gap-3 p-2 hover:bg-cyan/10 cursor-pointer rounded-md">
                                                {result.poster_path ? (
                                                    <img src={`${TMDB_IMAGE_BASE_URL_SMALL}${result.poster_path}`} alt={title} className="w-10 h-14 rounded object-cover" />
                                                ) : (
                                                    <div className="w-10 h-14 bg-secondary rounded flex items-center justify-center"><FilmIcon className="w-5 h-5 text-muted" /></div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-white truncate">{title}</p>
                                                    <p className="text-sm text-muted">{year}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                        <div className="sm:col-span-3">
                            <label className="block text-sm font-medium text-muted mb-1">TMDB ID</label>
                            <input type="text" value={formData.tmdb_id || ''} className={inputClass} disabled />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-muted mb-1">Type</label>
                            <input type="text" value={formData.type} className={inputClass} disabled />
                        </div>
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-muted mb-1">Title</label>
                         <div className="flex items-center gap-2">
                            <input type="text" value={formData.title} className={inputClass} disabled />
                            {isNew && formData.tmdb_id > 0 && (
                                <button
                                    type="button"
                                    onClick={handleClearContent}
                                    className="flex-shrink-0 text-sm text-cyan font-semibold hover:brightness-125"
                                >
                                    Change
                                </button>
                            )}
                         </div>
                    </div>
                    
                    <div className="pt-4 border-t border-glass-border">
                        <h4 className="text-base font-semibold text-white mb-2">Download Links</h4>
                        <div className="space-y-3">
                            {formData.download_links.map((link, index) => (
                                <div key={index} className="flex flex-wrap items-center gap-2 rounded-md bg-primary/40 p-2 md:p-0 md:bg-transparent md:flex-nowrap">
                                    <input
                                        type="text"
                                        placeholder="Label (e.g., 1080p WEB-DL)"
                                        value={link.label}
                                        onChange={e => handleLinkChange(index, 'label', e.target.value)}
                                        className={inputClass + " w-full md:w-auto md:flex-1"}
                                    />
                                    <input
                                        type="url"
                                        placeholder="URL"
                                        value={link.url}
                                        onChange={e => handleLinkChange(index, 'url', e.target.value)}
                                        className={inputClass + " w-full md:w-auto md:flex-[2]"}
                                        required
                                    />
                                    <div className="flex items-center gap-2 ml-auto md:ml-0">
                                        <button 
                                            type="button" 
                                            onClick={() => handleAutomateLink(index)} 
                                            className="text-sm font-semibold text-cyan hover:brightness-125 disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={automatingIndex === index}
                                            title="Auto-generate label from URL"
                                        >
                                            {automatingIndex === index ? <SpinnerIcon className="animate-spin h-5 w-5" /> : 'Automate'}
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => removeLink(index)}
                                            className="p-2 text-muted hover:text-danger hover:bg-danger/20 rounded-full"
                                            title="Delete link"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={addLink} className="mt-3 flex items-center gap-2 text-sm text-cyan font-semibold hover:brightness-125">
                            <PlusCircleIcon className="h-5 w-5" />
                            <span>Add Link</span>
                        </button>
                    </div>
                </div>
                
                <div className="bg-primary/50 px-6 py-4 flex justify-end gap-2 rounded-b-lg">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-muted/50 text-white hover:bg-muted/70">Cancel</button>
                    <button type="submit" className="px-4 py-2 rounded-md bg-cyan text-primary font-bold hover:brightness-125">Save</button>
                </div>
            </form>
        </div>
    );
};

export default ContentModal;