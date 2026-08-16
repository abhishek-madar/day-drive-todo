import React, { useState, useRef } from 'react';
import { X, UploadCloud, Image as ImageIcon } from 'lucide-react';

interface AvatarUploadModalProps {
  onClose: () => void;
  onSubmit: (base64Image: string | null) => Promise<void>;
  currentAvatarUrl: string | null;
}

export const AvatarUploadModal: React.FC<AvatarUploadModalProps> = ({ onClose, onSubmit, currentAvatarUrl }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { 
      setError('Image must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!selectedImage && !currentAvatarUrl) return; 
    
    setIsSubmitting(true);
    try {
      await onSubmit(selectedImage);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update photo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(null); 
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove photo');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-[16px] font-semibold text-gray-900">Profile Photo</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-[13px] font-medium rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <div className="flex flex-col items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden mb-4 relative group">
              {(selectedImage || currentAvatarUrl) ? (
                <img src={selectedImage || currentAvatarUrl || ''} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={32} className="text-gray-400" />
              )}
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
              >
                <UploadCloud size={24} />
              </button>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />

            <div className="flex items-center gap-3">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 border border-gray-200 rounded-lg text-[13px] font-medium text-gray-700 hover:text-black hover:bg-gray-50 transition-colors"
              >
                {currentAvatarUrl || selectedImage ? 'Replace Photo' : 'Upload Photo'}
              </button>
              {(currentAvatarUrl || selectedImage) && (
                <button 
                  onClick={selectedImage ? () => setSelectedImage(null) : handleRemove}
                  className="px-4 py-2 text-red-600 rounded-lg text-[13px] font-medium hover:bg-red-50 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className="pt-4 flex gap-3 border-t border-gray-100">
            <button 
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl font-medium text-[14px] text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={!selectedImage || isSubmitting}
              className="flex-1 py-2.5 rounded-xl font-medium text-[14px] text-white bg-black hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
