
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 py-6">
      <div className="container mx-auto px-4 flex flex-col items-center">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-3xl">❄️</span>
          <h1 className="text-3xl font-vintage text-blue-800">С Новым годом!</h1>
          <span className="text-3xl">🌲</span>
        </div>
        <p className="text-slate-500 text-sm font-medium tracking-widest uppercase">Vintage Card Studio</p>
      </div>
    </header>
  );
};

export default Header;
