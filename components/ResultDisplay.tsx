
import React from 'react';

interface Props {
  imageUrl: string;
}

const ResultDisplay: React.FC<Props> = ({ imageUrl }) => {
  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `soviet_card_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-100 relative group h-full flex flex-col">
      <p className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider">Результат</p>
      <div className="relative overflow-hidden rounded-xl bg-slate-100 flex-grow flex items-center justify-center">
        <img 
          src={imageUrl} 
          alt="Generated Soviet Card" 
          className="w-full h-auto max-h-[700px] object-contain shadow-inner"
        />
        
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>
      </div>
      
      <button 
        onClick={downloadImage}
        className="mt-6 w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span>Скачать открытку</span>
      </button>
    </div>
  );
};

export default ResultDisplay;
