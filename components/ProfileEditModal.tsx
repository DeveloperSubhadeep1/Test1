import React, { useState, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { Avatar } from './Avatars';
import { XIcon, EditIcon, SpinnerIcon } from './Icons';
import { UserProfile } from '../types';

interface ProfileEditModalProps {
  onClose: () => void;
}

const MAX_AVATAR_SIZE_MB = 10;
const MAX_AVATAR_SIZE_BYTES = MAX_AVATAR_SIZE_MB * 1024 * 1024;

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ onClose }) => {
  const { currentUser, updateProfileDetails } = useContext(AuthContext);
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    customName: currentUser?.customName || '',
    dob: currentUser?.dob ? currentUser.dob.split('T')[0] : '', // Format for date input
    gender: currentUser?.gender || '',
  });
  const [newAvatarPreview, setNewAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!currentUser) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Invalid file type. Please select an image file.', 'error');
      return;
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      addToast(`File is too large. Please select an image smaller than ${MAX_AVATAR_SIZE_MB}MB.`, 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const handleResetAvatar = () => {
    setNewAvatarPreview('reset'); // Use 'reset' as a signal to remove custom avatar
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload: Partial<UserProfile> = {
      ...formData,
      dob: formData.dob ? new Date(formData.dob).toISOString() : undefined
    };
    
    if (newAvatarPreview) {
        payload.customAvatar = newAvatarPreview === 'reset' ? null : newAvatarPreview;
    }

    const success = await updateProfileDetails(payload);
    setLoading(false);
    if (success) {
      onClose();
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };
  
  const currentAvatarDisplay = newAvatarPreview === 'reset' 
      ? null 
      : newAvatarPreview || currentUser.customAvatar;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="glass-panel rounded-lg shadow-xl w-full max-w-lg border-cyan" style={{boxShadow: '0 0 30px rgba(8, 217, 214, 0.4)'}} onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-5 border-b border-glass-border flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Edit Your Profile</h3>
            <button onClick={onClose} type="button" className="p-1 rounded-full hover:bg-white/10 transition-colors">
              <XIcon className="h-5 w-5 text-muted" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <Avatar 
                  avatar={currentUser.avatar}
                  customAvatar={currentAvatarDisplay}
                  className="h-24 w-24 rounded-full" 
                />
                <button
                  type="button"
                  onClick={triggerFileSelect}
                  className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Change avatar"
                >
                  <EditIcon className="h-6 w-6 text-white" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                aria-hidden="true"
              />
              <div className="flex gap-2">
                <button type="button" onClick={triggerFileSelect} className="text-xs text-cyan hover:underline">Change</button>
                {(newAvatarPreview || currentUser.customAvatar) && <button type="button" onClick={handleResetAvatar} className="text-xs text-danger hover:underline">Reset to Default</button>}
              </div>
            </div>

            <div>
              <label htmlFor="customName" className="block text-sm font-medium text-light-muted dark:text-muted mb-1">Display Name</label>
              <input id="customName" name="customName" type="text" value={formData.customName} onChange={handleInputChange} className="w-full bg-primary border border-glass-border rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                <label htmlFor="dob" className="block text-sm font-medium text-light-muted dark:text-muted mb-1">Date of Birth</label>
                <input id="dob" name="dob" type="date" value={formData.dob} onChange={handleInputChange} className="w-full bg-primary border border-glass-border rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan" />
              </div>
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-light-muted dark:text-muted mb-1">Gender</label>
                <select id="gender" name="gender" value={formData.gender} onChange={handleInputChange} className="w-full bg-primary border border-glass-border rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan">
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
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

export default ProfileEditModal;