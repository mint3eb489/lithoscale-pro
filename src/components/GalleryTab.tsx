import React from 'react';
import { Stone, AppConfig } from '../types';
import { Sparkles, Maximize2, Scale } from 'lucide-react';

interface GalleryTabProps {
  stones: Stone[];
  config: AppConfig;
  compareList: string[];
  toggleCompare: (id: string, e: React.MouseEvent) => void;
  selectFromGallery: (id: string) => void;
  openLightbox: (img: string) => void;
  personalStats?: {
    dekton?: number[];
    natur?: number[];
  };
  selectedStoneId?: string;
}

export const GalleryTab: React.FC<GalleryTabProps> = ({
  stones,
  config,
  compareList,
  toggleCompare,
  selectFromGallery,
  openLightbox,
  personalStats,
  selectedStoneId,
}) => {
  const sortedStones = [...stones].sort((a, b) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base' }));

  const formatTrend = (arr: number[]) => {
    if (!arr || arr.length === 0) return '--- €';
    const sum = arr.reduce((a, b) => a + b, 0);
    const avg = sum / arr.length;
    const rounded = Math.round(avg / 10) * 10;
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(rounded);
  };

  const renderCard = (s: Stone) => {
    const isComparing = compareList.includes(s.id);
    const isActive = s.id === selectedStoneId;
    const hasImage = s.image && s.image.trim() !== '';

    return (
      <div
        key={s.id}
        className={`card gallery-card overflow-hidden group cursor-pointer transition-all duration-300 relative ${
          isActive ? 'border-emerald-500 ring-2 ring-emerald-500/25 shadow-md' : isComparing ? 'border-blue-500 ring-2 ring-blue-500/50 shadow-lg scale-[0.98]' : 'hover:shadow-lg'
        }`}
        onClick={() => selectFromGallery(s.id)}
      >
        <div className="aspect-square bg-slate-100 dark:bg-black relative overflow-hidden flex items-center justify-center border-b border-slate-200 dark:border-darkBorder">
          {hasImage ? (
            <img
              src={s.image.startsWith('http') || s.image.startsWith('data:') ? s.image : `images/${s.image}`}
              className={`w-full h-full object-cover transition-transform duration-700 ${isActive ? 'scale-105' : 'group-hover:scale-110'}`}
              loading="lazy"
              alt={s.name}
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kein Bild</span>
          )}
          
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleCompare(s.id, e);
            }}
            className={`absolute top-2 left-2 p-2 rounded-full transition-all backdrop-blur-sm shadow-lg z-20 ${
              isComparing
                ? 'bg-blue-500 text-white scale-105'
                : 'bg-black/50 text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-black/70 hover:scale-105'
            }`}
            title="Material vergleichen (1-Klick-Vergleich)"
          >
            <Scale className="w-3.5 h-3.5" />
          </button>

          {hasImage && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openLightbox(s.image);
              }}
              className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity backdrop-blur-sm hover:bg-black/70 shadow-lg"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}

          {isActive && (
            <div className="absolute bottom-2 left-2 bg-emerald-500 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1 select-none z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              Aktiv
            </div>
          )}
        </div>
        
        <div className="p-3 md:p-4 bg-white dark:bg-[#121212] relative z-10 flex flex-col justify-between">
          <div>
            <p className="font-bold text-xs md:text-sm truncate text-slate-800 dark:text-slate-200" title={s.name}>
              {s.name}
            </p>
            <p className="text-[10px] md:text-xs font-mono font-bold text-slate-500 mt-1">
              {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(s.price)} / m²
            </p>
          </div>
        </div>
      </div>
    );
  };

  const dektonStones = sortedStones.filter(s => s.isDekton);
  const naturStones = sortedStones.filter(s => !s.isDekton);

  const activeStats = personalStats || config.stats || { dekton: [], natur: [] };

  return (
    <div id="tab-gallery" className="pb-20 space-y-10 relative">
      <div className="grid grid-cols-2 gap-4 md:gap-6 mt-2">
        <div className="bg-white dark:bg-[#121212] p-4 rounded-2xl border border-slate-200 dark:border-[#262626] flex flex-col justify-center text-center">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ø Markttrend Dekton</p>
          <p id="trend-dekton" className="text-lg md:text-xl font-black text-slate-700 dark:text-slate-200 font-mono">
            {formatTrend(activeStats.dekton || [])}
          </p>
        </div>
        <div className="bg-white dark:bg-[#121212] p-4 rounded-2xl border border-slate-200 dark:border-[#262626] flex flex-col justify-center text-center">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ø Markttrend Naturstein</p>
          <p id="trend-natur" className="text-lg md:text-xl font-black text-slate-700 dark:text-slate-200 font-mono">
            {formatTrend(activeStats.natur || [])}
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-black mb-6 flex items-center gap-3 tracking-tight text-slate-900 dark:text-white">
          <span className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-lg shadow-red-500/40"></span> Dekton
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {dektonStones.length > 0 ? (
            dektonStones.map(renderCard)
          ) : (
            <p className="text-sm text-slate-500 col-span-full">Keine Dekton Steine vorhanden.</p>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-black mb-6 flex items-center gap-3 tracking-tight mt-12 border-t border-slate-200 dark:border-darkBorder pt-10 text-slate-900 dark:text-white">
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40"></span> Naturstein
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {naturStones.length > 0 ? (
            naturStones.map(renderCard)
          ) : (
            <p className="text-sm text-slate-500 col-span-full">Keine Natursteine vorhanden.</p>
          )}
        </div>
      </div>
    </div>
  );
};
