import React, { useState, useContext } from 'react';
import { Collection } from '../types';
import { CollectionContext } from '../context/CollectionContext';
import { XIcon, SpinnerIcon } from './Icons';
import { useToast } from '../hooks/useToast';

interface EditCollectionModalProps {
  collection: Collection;
  onClose: () => void;
}

const EditCollectionModal: React.FC<EditCollectionModalProps> = ({ collection, onClose }) => {
  const { updateCollection } = useContext(CollectionContext);
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: collection.name,
    description: collection.description || '',
    isPublic: collection.isPublic,
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleChange = () => {
    setFormData(prev => ({ ...prev, isPublic: !prev.isPublic }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
        addToast("Collection name cannot be empty.", "error");
        return;
    }
    setLoading(true);
    await updateCollection(collection._id, formData);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="glass-panel rounded-lg shadow-xl w-full max-w-md border-cyan" style={{boxShadow: '0 0 30px rgba(8, 217, 214, 0.4)'}} onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-5 border-b border-glass-border flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Edit Collection</h3>
            <button onClick={onClose} type="button" className="p-1 rounded-full hover:bg-white/10 transition-colors">
              <XIcon className="h-5 w-5 text-muted" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-light-muted dark:text-muted mb-1">Name</label>
              <input 
                id="name" 
                name="name" 
                type="text" 
                value={formData.name} 
                onChange={handleInputChange} 
                className="w-full bg-primary border border-glass-border rounded-md p-2 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-cyan" 
                required 
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-light-muted dark:text-muted mb-1">Description (optional)</label>
              <textarea 
                id="description" 
                name="description" 
                value={formData.description} 
                onChange={handleInputChange} 
                rows={3}
                className="w-full bg-primary border border-glass-border rounded-md p-2 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-cyan" 
              />
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="is-public-edit" className="text-sm text-muted cursor-pointer">Make this collection public?</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  id="is-public-edit" 
                  checked={formData.isPublic} 
                  onChange={handleToggleChange} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-cyan peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan"></div>
              </label>
            </div>
          </div>
          
          <div className="bg-primary/50 px-6 py-4 flex justify-end gap-2 rounded-b-lg">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-muted/50 text-white hover:bg-muted/70 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-md bg-cyan text-primary font-bold hover:brightness-125 transition-all disabled:bg-muted disabled:cursor-not-allowed w-28">
              {loading ? <SpinnerIcon className="animate-spin h-5 w-5 mx-auto" /> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCollectionModal;