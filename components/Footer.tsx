
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="py-8 text-center text-slate-400 text-xs mt-12 border-t border-slate-100">
      <p>© 2024 Soviet Vintage Card Studio</p>
      <p className="mt-2">Создано с использованием Gemini 2.5 Flash Image</p>
      <div className="mt-4 flex justify-center space-x-4">
        <span className="text-slate-300">#SovietPostcard</span>
        <span className="text-slate-300">#Nostalgia</span>
        <span className="text-slate-300">#NewYearMagic</span>
      </div>
      <div className="mt-6 pt-4 border-t border-slate-50 opacity-60">
        <p className="font-medium text-slate-500">@proenglishkulagina</p>
      </div>
    </footer>
  );
};

export default Footer;
