import React, { useState, useContext } from 'react';
import { CollectionContext } from '../context/CollectionContext';
import { ContentItem, CollectionItem } from '../types';
import { useToast } from '../hooks/useToast';
import { XIcon, PlusCircleIcon, SpinnerIcon, CheckCircleIcon } from './Icons';

interface AddToCollectionModalProps {
  item: ContentItem;
  onClose: () => void;
}

const AddToCollectionModal: React.FC<AddToCollectionModalProps> = ({ item, onClose }) => {
  const { collections, addItemToCollection, createCollection, loading: collectionsLoading } = useContext(CollectionContext);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDesc, setNewCollectionDesc] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { addToast } = useToast();

  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) {
      addToast('Please enter a name for your new collection.', 'error');
      return;
    }
    setIsCreating(true);
    const newCollection = await createCollection({ 
        name: newCollectionName, 
        description: newCollectionDesc, 
        isPublic 
    });
    if (newCollection) {
        // Automatically add the current item to the newly created collection
        const collectionItem: CollectionItem = { ...item };
        delete (collectionItem as any).overview;
        await addItemToCollection(newCollection._id, collectionItem);
        onClose();
    }
    setIsCreating(false);
  };
  
  const handleAddToExisting = async (collectionId: string) => {
    const collectionItem: CollectionItem = { ...item };
    delete (collectionItem as any).overview;
    await addItemToCollection(collectionId, collectionItem);
  };
  
  const itemTitle = 'title' in item ? item.title : item.name;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center p-4 animate-fade-in overflow-y-auto" onClick={onClose}>
      <div className="glass-panel rounded-xl shadow-xl w-full max-w-md border-cyan mt-32 mb-8 md:mt-[55px] md:mb-84" style={{boxShadow: '0 0 30px rgba(8, 217, 214, 0.4)'}} onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-glass-border flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">Add "{itemTitle}" to a collection</h3>
          <button onClick={onClose} className="group p-1 rounded-full hover:bg-white/10 transition-colors">
            <XIcon className="h-5 w-5 text-muted transition-transform duration-300 group-hover:scale-110" />
          </button>
        </div>
        
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {collectionsLoading ? (
            <SpinnerIcon className="animate-spin h-6 w-6 text-cyan mx-auto" />
          ) : (
            <ul className="space-y-2">
              {collections.map(collection => {
                const alreadyIn = collection.items.some(i => i.id === item.id);
                return (
                  <li key={collection._id}>
                    <button
                      onClick={() => !alreadyIn && handleAddToExisting(collection._id)}
                      disabled={alreadyIn}
                      className="w-full flex items-center justify-between p-3 rounded-md text-left transition-colors bg-primary/50 hover:bg-cyan/10 disabled:bg-cyan/20 disabled:cursor-not-allowed"
                    >
                      <span className="font-semibold text-white truncate">{collection.name}</span>
                      {alreadyIn && <CheckCircleIcon className="h-5 w-5 text-highlight" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          
          <div className="mt-4 pt-4 border-t border-glass-border">
            {showCreateForm ? (
              <form onSubmit={handleCreateAndAdd} className="space-y-4 animate-fade-in">
                <h4 className="font-bold text-white">Create New Collection</h4>
                <div>
                  <input
                    type="text"
                    placeholder="Collection Name"
                    value={newCollectionName}
                    onChange={e => setNewCollectionName(e.target.value)}
                    className="w-full bg-primary border border-glass-border rounded-md p-2 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-cyan"
                    required
                  />
                </div>
                <div>
                  <textarea
                    placeholder="Description (optional)"
                    value={newCollectionDesc}
                    onChange={e => setNewCollectionDesc(e.target.value)}
                    rows={2}
                    className="w-full bg-primary border border-glass-border rounded-md p-2 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-cyan"
                  />
                </div>
                 <div className="flex items-center justify-between">
                  <label htmlFor="is-public" className="text-sm text-muted cursor-pointer">Make this collection public?</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" id="is-public" checked={isPublic} onChange={() => setIsPublic(!isPublic)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-cyan peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan"></div>
                  </label>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowCreateForm(false)} className="w-full px-4 py-2 rounded-md bg-muted/50 text-white hover:bg-muted/70 transition-colors">Cancel</button>
                  <button type="submit" disabled={isCreating} className="w-full flex items-center justify-center px-4 py-2 rounded-md bg-cyan text-primary font-bold hover:brightness-125 transition-all disabled:bg-muted">
                    {isCreating ? <SpinnerIcon className="animate-spin h-5 w-5" /> : 'Create & Add'}
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowCreateForm(true)}
                className="group w-full flex items-center justify-center gap-2 p-3 rounded-md text-cyan font-semibold hover:bg-cyan/10 transition-colors"
              >
                <PlusCircleIcon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                <span>Create a new collection</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddToCollectionModal;