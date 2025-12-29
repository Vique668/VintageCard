
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { GenerationState } from './types';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import ResultDisplay from './components/ResultDisplay';
import Footer from './components/Footer';

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
        const y = canvas.height * 0.12;

        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 4;

        ctx.strokeStyle = '#c0392b';
        ctx.lineWidth = fontSize * 0.08;
        ctx.strokeText(text, x, y);

        const gradient = ctx.createLinearGradient(0, y - fontSize, 0, y);
        gradient.addColorStop(0, '#f1c40f');
        gradient.addColorStop(1, '#f39c12');
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
        const base64Parts = url.split(',');
        const mimeType = base64Parts[0].match(/:(.*?);/)?.[1] || 'image/png';
        const base64Data = base64Parts[1];
        return {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        };
      });

      const prompt = `
        Analyze the ${state.uploadedImageUrls.length} source photos and identify ONLY the specific individuals shown. 
        Create a unified vintage Soviet New Year greeting card featuring ONLY these specific people (either alone or as a group if multiple photos).
        
        CRITICAL INSTRUCTIONS:
        1. NO EXTRA PEOPLE: Do not add any additional characters, background people, passersby, or generic faces. The final image must contain ONLY the individuals present in the input photos.
        2. NO TEXT: Do not generate any text, letters, or writing in the image.
        3. EXACT PORTRAIT: Create a harmonious composition focusing on the individuals identified.
        4. PRESERVE LIKENESS: Maintain the exact facial features, expressions, and identities of every person. They must be easily recognizable.
        5. STYLE: 1950s-1970s Soviet postcard illustration. Soft, warm, nostalgic, painterly aesthetic with a slight "paper" texture.
        6. CLOTHING: Replace modern outfits with period-appropriate Soviet winter fashion (ushankas, fur coats, wool scarves).
        7. SETTING: A magical, quiet snowy forest background with a single decorated New Year tree. Ensure the background is empty of any other humans.
        8. COMPOSITION: Leave the top 20% clear (just sky or trees) for a text overlay.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            ...imageParts,
            { text: prompt }
          ]
        },
        config: { imageConfig: { aspectRatio: "9:16" } }
      });

      let rawImageBase64 = '';
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            rawImageBase64 = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (rawImageBase64) {
        await document.fonts.ready;
        const finalCard = await createFinalPostcard(rawImageBase64);
        setState(prev => ({ ...prev, resultUrl: finalCard, isGenerating: false }));
      } else {
        throw new Error("The model did not return an image.");
      }

    } catch (err: any) {
      console.error("Generation failed:", err);
      setState(prev => ({ 
        ...prev, 
        isGenerating: false, 
        error: err.message || "Failed to generate the card." 
      }));
    }
  };

  const reset = () => {
    setState({
      isGenerating: false,
      error: null,
      resultUrl: null,
      uploadedImageUrls: [],
    });
  };

  const isMulti = state.uploadedImageUrls.length > 1;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
        {state.resultUrl ? (
          <div className="max-w-2xl mx-auto space-y-6">
            <ResultDisplay imageUrl={state.resultUrl} />
            <div className="flex justify-center space-x-4">
              <button onClick={reset} className="px-6 py-2 border-2 border-slate-300 rounded-full font-semibold text-slate-600 hover:bg-slate-100 transition-all">Начать заново</button>
              <button onClick={generateCard} className="px-6 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-all shadow-md">Перегенерировать</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
                <h2 className="text-2xl font-semibold mb-2 text-slate-800">
                  {isMulti ? 'Общая ретро-открытка' : 'Ваша ретро-открытка'}
                </h2>
                <p className="text-slate-500 mb-6 text-sm">
                  Загрузите до 3 фото. Мы перенесем вас в сказочную атмосферу советского праздника, сохранив ваше сходство.
                </p>
                
                {state.uploadedImageUrls.length < 3 && !state.isGenerating && (
                  <ImageUploader onUpload={handleImageUpload} />
                )}

                <div className="mt-6 grid grid-cols-3 gap-3">
                  {state.uploadedImageUrls.map((url, idx) => (
                    <div key={idx} className="relative group aspect-[3/4]">
                      <img src={url} className="w-full h-full object-cover rounded-xl border border-slate-200" />
                      {!state.isGenerating && (
                        <button 
                          onClick={() => removeImage(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 min-h-[500px] flex flex-col items-center justify-center text-center">
                {state.isGenerating ? (
                  <div className="space-y-6">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
                    <div>
                      <p className="text-xl font-medium text-slate-800">
                        {isMulti ? 'Объединяем героев...' : 'Рисуем вашу открытку...'}
                      </p>
                      <p className="text-sm text-slate-500 mt-2 italic">
                        {isMulti ? 'Никого лишнего — только вы и ваши близкие' : 'Создаем магию советского праздника'}
                      </p>
                    </div>
                    <div className="flex justify-center space-x-2">
                       <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-75"></div>
                       <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150"></div>
                       <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-300"></div>
                    </div>
                  </div>
                ) : state.uploadedImageUrls.length > 0 ? (
                  <div className="space-y-6">
                    <div className="bg-blue-50 p-6 rounded-2xl mb-4 border border-blue-100">
                      <p className="text-blue-800 font-medium">
                        Выбрано фото: {state.uploadedImageUrls.length} из 3
                      </p>
                      <p className="text-blue-600 text-xs mt-1">
                        {isMulti 
                          ? 'Все люди с этих снимков окажутся на одной открытке.' 
                          : 'Ваше фото будет стилизовано под классическую открытку.'}
                      </p>
                    </div>
                    <button 
                      onClick={generateCard} 
                      className="px-10 py-5 bg-blue-600 text-white rounded-full font-bold text-xl hover:bg-blue-700 transform hover:scale-105 transition-all shadow-xl active:scale-95"
                    >
                      Создать магию ✨
                    </button>
                  </div>
                ) : (
                  <div className="text-slate-400">
                    <svg className="w-20 h-20 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-lg">Загрузите фотографии для начала</p>
                  </div>
                )}
                {state.error && <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">{state.error}</div>}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default App;
