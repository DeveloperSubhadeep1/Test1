import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { Avatar, avatarSvgs } from './Avatars';
import { XIcon, SpinnerIcon } from './Icons';

interface ProfileEditModalProps {
  onClose: () => void;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ onClose }) => {
  const { currentUser, updateProfileDetails } = useContext(AuthContext);
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    customName: currentUser?.customName || '',
    dob: currentUser?.dob ? currentUser.dob.split('T')[0] : '', // Format for date input
    gender: currentUser?.gender || '',
  });
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser?.avatar || 'avatar1');
  const [loading, setLoading] = useState(false);

  if (!currentUser) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const dataToUpdate: {
        customName: string;
        gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say' | '';
        avatar: string;
        dob: string | null;
    } = {
        customName: formData.customName,
        gender: formData.gender as any,
        avatar: selectedAvatar,
        dob: null, // Default to null
    };

    // Robustly handle the date to prevent crashes from invalid date strings,
    // which was preventing the entire profile update (including avatar) from succeeding.
    if (formData.dob && /^\d{4}-\d{2}-\d{2}$/.test(formData.dob)) {
        const date = new Date(formData.dob);
        if (!isNaN(date.getTime())) {
            dataToUpdate.dob = date.toISOString();
        }
    }

    const success = await updateProfileDetails(dataToUpdate);
    setLoading(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="glass-panel rounded-lg shadow-xl w-full max-w-lg border-cyan" style={{boxShadow: '0 0 30px rgba(8, 217, 214, 0.4)'}} onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-5 border-b border-glass-border flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Edit Your Profile</h3>
            <button onClick={onClose} type="button" className="group p-1 rounded-full hover:bg-white/10 transition-colors">
              <XIcon className="h-5 w-5 text-muted transition-transform duration-300 group-hover:scale-110" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-light-muted dark:text-muted mb-2">Choose your avatar</label>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-48 overflow-y-auto p-2 bg-primary/50 rounded-lg">
                {Object.keys(avatarSvgs).map(avatarId => (
                  <button
                    key={avatarId}
                    type="button"
                    onClick={() => setSelectedAvatar(avatarId)}
                    className={`p-1 rounded-full transition-all duration-200 ${selectedAvatar === avatarId ? 'ring-2 ring-offset-2 ring-offset-secondary ring-cyan scale-110' : 'hover:scale-110 hover:ring-2 hover:ring-cyan/50'}`}
                    aria-label={`Select avatar ${avatarId}`}
                  >
                    <Avatar avatar={avatarId} className="h-10 w-10" />
                  </button>
                ))}
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