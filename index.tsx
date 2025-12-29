
import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- Types ---
interface GenerationState {
  isGenerating: boolean;
  error: string | null;
  resultUrl: string | null;
  uploadedImageUrls: string[];
}

// --- Components ---

const Header: React.FC = () => (
  <header className="bg-white border-b border-slate-200 py-6 shadow-sm">
    <div className="container mx-auto px-4 flex flex-col items-center">
      <div className="flex items-center space-x-3 mb-1">
        <span className="text-3xl animate-pulse">❄️</span>
        <h1 className="text-4xl font-vintage text-red-700 drop-shadow-sm">С Новым годом!</h1>
        <span className="text-3xl animate-pulse">🌲</span>
      </div>
      <p className="text-slate-400 text-[10px] font-bold tracking-[0.3em] uppercase">Vintage Card Studio</p>
    </div>
  </header>
);

const Footer: React.FC = () => (
  <footer className="py-10 text-center text-slate-400 text-xs mt-auto border-t border-slate-100 bg-white">
    <p className="font-medium">© 2024 Soviet Vintage Card Studio</p>
    <div className="mt-4 flex justify-center space-x-6">
      <span className="opacity-50">#РетроЗима</span>
      <span className="opacity-50">#СССР_Стиль</span>
      <span className="opacity-50">#МагияНовогоГода</span>
    </div>
    <div className="mt-6 pt-4 border-t border-slate-50">
      <p className="text-slate-300">Создано с помощью Gemini 2.5 Flash</p>
    </div>
  </footer>
);

const ImageUploader: React.FC<{ onUpload: (file: File) => void }> = ({ onUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => onUpload(file));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col items-center w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
      />
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="w-full border-2 border-dashed border-slate-200 rounded-3xl p-10 flex flex-col items-center cursor-pointer hover:border-red-400 hover:bg-red-50 transition-all group bg-slate-50/50"
      >
        <div className="bg-white p-4 rounded-full mb-4 shadow-sm group-hover:scale-110 transition-transform">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <p className="font-bold text-slate-700">Загрузите фото героев</p>
        <p className="text-xs text-slate-400 mt-2 text-center max-w-[200px]">Мы бережно перенесем ваши лица в атмосферу 60-х</p>
      </div>
    </div>
  );
};

const ResultDisplay: React.FC<{ imageUrl: string }> = ({ imageUrl }) => {
  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `soviet_postcard_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 flex flex-col items-center animate-in fade-in zoom-in duration-500">
      <div className="relative overflow-hidden rounded-2xl bg-slate-200 w-full mb-6 border-8 border-white shadow-inner">
        <img 
          src={imageUrl} 
          alt="Generated Soviet Card" 
          className="w-full h-auto object-contain"
        />
      </div>
      
      <button 
        onClick={downloadImage}
        className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg hover:shadow-red-200 flex items-center justify-center space-x-3 active:scale-[0.98]"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span>Сохранить на память</span>
      </button>
    </div>
  );
};

// --- Main App ---

const App: React.FC = () => {
  const [state, setState] = useState<GenerationState>({
    isGenerating: false,
    error: null,
    resultUrl: null,
    uploadedImageUrls: [],
  });

  const handleImageUpload = (file: File) => {
    if (state.uploadedImageUrls.length >= 3) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setState(prev => ({
        ...prev,
        uploadedImageUrls: [...prev.uploadedImageUrls, e.target?.result as string],
        resultUrl: null,
        error: null
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (index: number) => {
    setState(prev => ({
      ...prev,
      uploadedImageUrls: prev.uploadedImageUrls.filter((_, i) => i !== index),
      resultUrl: null
    }));
  };

  const createFinalPostcard = (base64Image: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(base64Image);

        ctx.drawImage(img, 0, 0);

        const fontSize = Math.floor(canvas.width * 0.12);
        ctx.font = `${fontSize}px 'Marck Script', cursive`;
        ctx.textAlign = 'center';
        
        const text = "С Новым годом!";
        const x = canvas.width / 2;
        const y = canvas.height * 0.14;

        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;

        ctx.strokeStyle = '#8b0000';
        ctx.lineWidth = fontSize * 0.05;
        ctx.strokeText(text, x, y);

        const gradient = ctx.createLinearGradient(0, y - fontSize, 0, y);
        gradient.addColorStop(0, '#fff3a1');
        gradient.addColorStop(0.5, '#ffd700');
        gradient.addColorStop(1, '#e2b100');
        ctx.fillStyle = gradient;
        ctx.shadowColor = 'transparent';
        ctx.fillText(text, x, y);

        resolve(canvas.toDataURL('image/png'));
      };
      img.src = base64Image;
    });
  };

  const generateCard = async () => {
    if (state.uploadedImageUrls.length === 0) return;
    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      const imageParts = state.uploadedImageUrls.map(url => {
        const base64Data = url.split(',')[1];
        const mimeType = url.split(',')[0].split(':')[1].split(';')[0];
        return { inlineData: { data: base64Data, mimeType } };
      });

      const prompt = `
        Look at these portraits carefully. Create a professional vintage Soviet 1960s-style New Year postcard illustration.
        
        KEY CHARACTERS: Use ONLY the people from the provided photos. They should be dressed in 1960s winter festive clothing (wool coats, scarves, classic hats). Preserve their facial features exactly.
        
        BACKGROUND: A magical snow-covered evergreen forest under a soft twilight sky. A beautifully decorated festive tree in the background with vintage ornaments and a bright star. Warm glowing lights.
        
        ART STYLE: Painterly, nostalgic, rich textures like old paper or gouache. High detail but with a soft-focus vintage lens feel. No sharp digital edges.
        
        COMPOSITION: Characters are in the foreground, joyful and celebrating. Keep the very top part of the image clear for a title. No text in the image itself.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [...imageParts, { text: prompt }] },
        config: { imageConfig: { aspectRatio: "9:16" } }
      });

      let rawBase64 = '';
      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          rawBase64 = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (rawBase64) {
        const finalUrl = await createFinalPostcard(rawBase64);
        setState(prev => ({ ...prev, resultUrl: finalUrl, isGenerating: false }));
      } else {
        throw new Error("Не удалось получить изображение от модели.");
      }
    } catch (err: any) {
      setState(prev => ({ ...prev, isGenerating: false, error: err.message || "Ошибка генерации." }));
    }
  };

  const reset = () => setState({ isGenerating: false, error: null, resultUrl: null, uploadedImageUrls: [] });

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfaf6] text-slate-800">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12 max-w-4xl">
        {state.resultUrl ? (
          <div className="max-w-xl mx-auto space-y-8">
            <ResultDisplay imageUrl={state.resultUrl} />
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button onClick={reset} className="px-8 py-3 border-2 border-slate-300 rounded-2xl font-bold text-slate-500 hover:bg-white transition-all active:scale-95">Новая открытка</button>
              <button onClick={generateCard} className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95">Попробовать еще раз</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div className="space-y-8">
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
                <h2 className="text-2xl font-bold mb-3 text-red-800">Создать шедевр</h2>
                <p className="text-slate-500 mb-8 leading-relaxed">
                  Загрузите до 3 фотографий. Мы объединим ваших близких в одну теплую ретро-историю.
                </p>
                
                {state.uploadedImageUrls.length < 3 && !state.isGenerating && (
                  <ImageUploader onUpload={handleImageUpload} />
                )}

                <div className="mt-8 grid grid-cols-3 gap-4">
                  {state.uploadedImageUrls.map((url, idx) => (
                    <div key={idx} className="relative group aspect-square">
                      <img src={url} className="w-full h-full object-cover rounded-2xl ring-4 ring-white shadow-md" />
                      {!state.isGenerating && (
                        <button 
                          onClick={() => removeImage(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg hover:bg-red-600"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="h-full">
              <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-100 min-h-[450px] flex flex-col items-center justify-center text-center">
                {state.isGenerating ? (
                  <div className="space-y-8 animate-in fade-in duration-700">
                    <div className="relative">
                      <div className="h-24 w-24 rounded-full border-4 border-slate-100 border-t-red-600 animate-spin mx-auto"></div>
                      <div className="absolute inset-0 flex items-center justify-center text-2xl">🪄</div>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-800">Магия ретро в процессе...</p>
                      <p className="text-sm text-slate-400 mt-3 italic max-w-xs mx-auto">
                        Прорисовываем детали костюмов и атмосферу советского праздника
                      </p>
                    </div>
                  </div>
                ) : state.uploadedImageUrls.length > 0 ? (
                  <div className="space-y-8 w-full">
                    <div className="bg-green-50 p-6 rounded-2xl border border-green-100 inline-block">
                      <p className="text-green-800 font-bold flex items-center justify-center">
                        <span className="mr-2">📸</span> {state.uploadedImageUrls.length} фото готово
                      </p>
                    </div>
                    <button 
                      onClick={generateCard} 
                      className="w-full py-6 bg-red-600 text-white rounded-3xl font-black text-2xl hover:bg-red-700 transform hover:scale-[1.02] transition-all shadow-2xl active:scale-95 flex items-center justify-center space-x-3"
                    >
                      <span>СОЗДАТЬ МАГИЮ</span>
                      <span>✨</span>
                    </button>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">Бесплатная генерация</p>
                  </div>
                ) : (
                  <div className="text-slate-300 flex flex-col items-center">
                    <div className="text-6xl mb-6 opacity-20">🖼️</div>
                    <p className="text-lg font-medium">Ваша открытка появится здесь</p>
                  </div>
                )}
                {state.error && <div className="mt-8 p-4 bg-red-50 text-red-700 rounded-2xl text-xs font-medium border border-red-100 w-full">{state.error}</div>}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
