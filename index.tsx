
import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

const Header = () => (
    <header className="relative z-10 py-12 text-center">
        <div className="container mx-auto px-4">
            <div className="inline-block relative">
                <span className="absolute -left-14 top-2 text-5xl animate-bounce">❄️</span>
                <h1 className="text-6xl md:text-8xl font-vintage text-red-800 drop-shadow-2xl mb-2">
                    С Новым годом!
                </h1>
                <span className="absolute -right-14 top-2 text-5xl animate-bounce delay-150">🌲</span>
            </div>
            <p className="text-slate-600 text-[11px] font-bold tracking-[0.6em] uppercase mt-6 opacity-70">
                Мастерская советской открытки
            </p>
        </div>
    </header>
);

const App = () => {
    const [images, setImages] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Fix: Explicitly cast to File[] to resolve 'unknown' type inference which causes TS error in reader.readAsDataURL(file)
        const files = Array.from(e.target.files || []) as File[];
        const remainingSlots = 3 - images.length;
        files.slice(0, remainingSlots).forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) {
                    setImages(prev => [...prev, ev.target!.result as string]);
                    setError(null);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const generate = async () => {
        if (images.length === 0) return;
        
        const apiKey = process.env.API_KEY;

        if (!apiKey || apiKey === "" || apiKey === "undefined") {
            setError("API-ключ не дошел до приложения. Проверьте настройки GitHub Secrets и файл workflow.");
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            // Fix: Initialize GoogleGenAI right before the call to ensure the latest API key is used
            const ai = new GoogleGenAI({ apiKey });
            
            const imageParts = images.map(url => ({
                inlineData: {
                    data: url.split(',')[1],
                    mimeType: url.split(',')[0].split(':')[1].split(';')[0]
                }
            }));

            const prompt = `Authentic Soviet New Year greeting card from the 1960s-1970s. 
            Main characters: EXACTLY the people from the uploaded photos, stylized as hand-painted gouache illustrations. 
            Strict facial likeness is mandatory. 
            Style: Warm nostalgic color palette, soft gouache textures, "Soviet Modernism" art style. 
            Setting: A cozy snowy park or festive interior with a classic decorated fir tree (Soviet ornaments, tinsel). 
            Clothing: Period-accurate winter fashion (coats with fur collars, ushankas, colorful knitted scarves). 
            Details: Soft bokeh, falling snowflakes, magical festive light. 
            Strictly NO text or letters in the generated image. Artistic paper texture.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [...imageParts, { text: prompt }] },
                config: { 
                    imageConfig: { 
                        aspectRatio: "3:4"
                    } 
                }
            });

            let base64 = "";
            const parts = response.candidates?.[0]?.content?.parts || [];
            // Fix: Iterate through all parts to find the inlineData image part
            for (const p of parts) {
                if (p.inlineData) {
                    base64 = `data:image/png;base64,${p.inlineData.data}`;
                    break;
                }
            }

            if (base64) {
                const finalCard = await applyPostcardEffects(base64);
                setResult(finalCard);
            } else {
                throw new Error("ИИ не вернул изображение. Возможно, сработали фильтры безопасности.");
            }
        } catch (err: any) {
            console.error("Full error object:", err);
            setError(`Ошибка: ${err.message || "Неизвестная ошибка"}. Проверьте консоль браузера.`);
        } finally {
            setIsGenerating(false);
        }
    };

    const applyPostcardEffects = (base64: string): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d')!;
                ctx.drawImage(img, 0, 0);

                const fontSize = Math.floor(canvas.width * 0.1);
                ctx.font = `bold ${fontSize}px 'Marck Script'`;
                ctx.textAlign = 'center';
                const text = "С Новым годом!";
                const x = canvas.width / 2;
                const y = canvas.height * 0.12;

                ctx.shadowColor = 'rgba(0,0,0,0.4)';
                ctx.shadowBlur = 10;
                ctx.shadowOffsetX = 3;
                ctx.shadowOffsetY = 3;

                ctx.strokeStyle = '#600000';
                ctx.lineWidth = fontSize * 0.05;
                ctx.strokeText(text, x, y);

                const grad = ctx.createLinearGradient(0, y - fontSize, 0, y);
                grad.addColorStop(0, '#fff4cc');
                grad.addColorStop(0.5, '#ffcc00');
                grad.addColorStop(1, '#cc9900');
                ctx.fillStyle = grad;
                ctx.shadowColor = 'transparent';
                ctx.fillText(text, x, y);

                ctx.globalCompositeOperation = 'overlay';
                ctx.globalAlpha = 0.15;
                for (let i = 0; i < 6000; i++) {
                    const rx = Math.random() * canvas.width;
                    const ry = Math.random() * canvas.height;
                    ctx.fillStyle = i % 10 === 0 ? '#fff' : '#000';
                    ctx.fillRect(rx, ry, 1, 1);
                }

                resolve(canvas.toDataURL('image/png'));
            };
            img.src = base64;
        });
    };

    const reset = () => {
        setResult(null);
        setImages([]);
        setError(null);
    };

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden">
            <Header />
            
            <main className="container mx-auto px-4 pb-20 max-w-5xl flex-grow z-10">
                {result ? (
                    <div className="max-w-xl mx-auto">
                        <div className="bg-[#fefaf0] p-4 rounded-lg shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] border-[12px] border-white relative">
                            <div className="absolute inset-0 bg-black/5 pointer-events-none mix-blend-overlay" />
                            <img src={result} className="w-full h-auto rounded-sm developing-photo" alt="Результат" />
                            <div className="mt-10 flex flex-col sm:flex-row gap-4 px-2 pb-2">
                                <button onClick={() => {
                                    const a = document.createElement('a');
                                    a.href = result;
                                    a.download = `vintage_card_${Date.now()}.png`;
                                    a.click();
                                }} className="flex-1 py-5 bg-[#9d0208] text-white rounded-xl font-bold text-xl hover:bg-[#6a040f] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
                                    💾 Сохранить
                                </button>
                                <button onClick={reset} className="flex-1 py-5 bg-stone-200 text-stone-600 rounded-xl font-bold text-xl hover:bg-stone-300 active:scale-95 transition-all">
                                    🔄 Ещё раз
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-2 gap-12 items-start">
                        <div className="glass-card p-12 rounded-[3.5rem] shadow-2xl border-white/60">
                            <h2 className="text-3xl font-black text-slate-800 mb-8 uppercase tracking-tight">Создать открытку ✨</h2>
                            <p className="text-slate-600 leading-relaxed mb-12 text-lg">
                                Загрузите до 3 фотографий ваших близких. Искусственный интеллект нарисует их на классической почтовой карточке СССР.
                            </p>

                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="relative group w-full border-4 border-dashed border-red-200 rounded-[3rem] p-20 text-center cursor-pointer hover:border-red-500 hover:bg-red-50/40 transition-all duration-500 shadow-inner"
                            >
                                <div className="text-8xl mb-8 group-hover:scale-110 transition-transform duration-500">📸</div>
                                <p className="font-bold text-slate-700 text-xl">Нажмите, чтобы выбрать фото</p>
                                <input type="file" ref={fileInputRef} onChange={onFileChange} multiple accept="image/*" className="hidden" />
                            </div>

                            {images.length > 0 && (
                                <div className="mt-12 flex flex-wrap gap-6 justify-center">
                                    {images.map((img, i) => (
                                        <div key={i} className="relative w-28 h-28 group">
                                            <img src={img} className="w-full h-full object-cover rounded-2xl ring-4 ring-white shadow-2xl group-hover:brightness-75 transition-all" />
                                            <button onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full w-9 h-9 flex items-center justify-center shadow-lg hover:bg-red-700 transition-all text-xl font-bold">×</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="h-full">
                            <div className="glass-card p-12 rounded-[3.5rem] shadow-2xl min-h-[500px] flex flex-col items-center justify-center text-center border-white/60">
                                {isGenerating ? (
                                    <div className="space-y-12 w-full animate-pulse">
                                        <div className="relative w-48 h-48 mx-auto">
                                            <div className="absolute inset-0 border-[16px] border-slate-100/50 rounded-full"></div>
                                            <div className="absolute inset-0 border-[16px] border-t-red-800 rounded-full animate-spin"></div>
                                            <div className="absolute inset-0 flex items-center justify-center text-6xl">🎨</div>
                                        </div>
                                        <div className="space-y-6">
                                            <p className="text-4xl font-black text-slate-800 tracking-tighter">Смешиваем краски...</p>
                                            <p className="text-base text-slate-400 italic max-w-xs mx-auto leading-relaxed">
                                                Рисуем каждую деталь в стиле советского модернизма. Это может занять около 15 секунд.
                                            </p>
                                        </div>
                                    </div>
                                ) : images.length > 0 ? (
                                    <div className="w-full space-y-10">
                                        <button onClick={generate} className="group w-full py-12 bg-[#9d0208] text-white rounded-[3rem] font-black text-5xl hover:bg-[#6a040f] hover:scale-[1.04] transition-all shadow-[0_20px_50px_rgba(157,2,8,0.3)] active:scale-95 flex items-center justify-center gap-8">
                                            <span>СОЗДАТЬ</span>
                                            <span className="group-hover:rotate-12 transition-transform duration-300">🎄</span>
                                        </button>
                                        <p className="text-[12px] text-slate-400 uppercase tracking-[0.5em] font-black opacity-50">Engine: Gemini 2.5 Flash</p>
                                    </div>
                                ) : (
                                    <div className="opacity-10 flex flex-col items-center select-none py-10">
                                        <div className="text-[14rem] mb-6">🎅</div>
                                        <p className="text-3xl font-black text-slate-900 uppercase tracking-widest">Зимняя сказка</p>
                                    </div>
                                )}
                                
                                {error && (
                                    <div className="mt-12 p-8 bg-red-50 text-red-900 rounded-[2rem] text-sm font-bold border-2 border-red-100 w-full">
                                        <div className="text-lg mb-2">⚠️ Ошибка</div>
                                        {error}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <footer className="py-16 text-center text-slate-500 text-xs bg-white/40 border-t border-slate-100 z-10 backdrop-blur-md">
                <div className="container mx-auto px-4">
                    <p className="font-black mb-3 uppercase tracking-[0.2em] text-slate-800">Мастерская винтажных подарков • 2024</p>
                </div>
            </footer>

            {[...Array(30)].map((_, i) => (
                <div key={i} className="snowflake" style={{
                    left: `${Math.random() * 100}%`,
                    animationDuration: `${Math.random() * 8 + 6}s`,
                    animationDelay: `${Math.random() * 5}s`,
                    fontSize: `${Math.random() * 16 + 8}px`,
                    opacity: Math.random() * 0.7 + 0.3
                }}>❄</div>
            ))}
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
