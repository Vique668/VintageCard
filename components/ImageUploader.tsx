
import React, { useRef } from 'react';

interface Props {
  onUpload: (file: File) => void;
}

const ImageUploader: React.FC<Props> = ({ onUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => onUpload(file));
    }
    // Reset value to allow re-uploading the same file if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
      />
      <div 
        onClick={handleClick}
        className="w-full border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group"
      >
        <div className="bg-blue-50 p-4 rounded-full mb-3 group-hover:bg-blue-100 transition-colors">
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <p className="font-semibold text-slate-700 text-sm">Добавить фотографию</p>
        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tighter">PNG, JPG до 10MB</p>
      </div>
    </div>
  );
};

export default ImageUploader;
