import React, { useState } from 'react';
import { Stone, AppConfig, getStoneMaterial } from '../types';
import { resolveStoneImageUrl } from '../utils/imageUtils';
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
    neolith?: number[];
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
  const [activeFilter, setActiveFilter] = useState<'all' | 'dekton' | 'neolith' | 'natur'>('all');

  const sortedStones = [...stones].sort((a, b) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base' }));

  const formatTrend = (arr?: number[]) => {
    if (!arr || arr.length === 0) return '--- €';
    const sum = arr.reduce((a, b) => a + b, 0);
    const avg = sum / arr.length;
    const rounded = Math.round(avg / 10) * 10;
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(rounded);
  };

  const handleToggleFilter = (filter: 'dekton' | 'neolith' | 'natur') => {
    setActiveFilter((prev) => (prev === filter ? 'all' : filter));
  };

  const renderCard = (s: Stone, idx?: number) => {
    const isComparing = compareList.includes(s.id);
    const isActive = s.id === selectedStoneId;
    const hasImage = s.image && s.image.trim() !== '';

    return (
      <div
        key={`gallery-stone-${s.id || 'st'}-${idx ?? 0}`}
        className={`card gallery-card overflow-hidden group cursor-pointer transition-all duration-300 relative ${
          isActive ? 'border-emerald-500 ring-2 ring-emerald-500/25 shadow-md' : isComparing ? 'border-blue-500 ring-2 ring-blue-500/50 shadow-lg scale-[0.98]' : 'hover:shadow-lg'
        }`}
        onClick={() => selectFromGallery(s.id)}
      >
        <div className="aspect-square bg-slate-100 dark:bg-black relative overflow-hidden flex items-center justify-center border-b border-slate-200 dark:border-darkBorder">
          {hasImage ? (
            <img
              src={resolveStoneImageUrl(s.image)}
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
            <p className="font-bold text-xs md:text-sm truncate text-slate-800 dark:text-slate-200 mb-1" title={s.name}>
              {s.name}
            </p>
            <p className="text-[10px] md:text-xs font-mono font-bold text-slate-500">
              {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(s.price)} / m²
            </p>
          </div>
        </div>
      </div>
    );
  };

  const dektonStones = sortedStones.filter((s) => getStoneMaterial(s) === 'dekton');
  const neolithStones = sortedStones.filter((s) => getStoneMaterial(s) === 'neolith');
  const naturStones = sortedStones.filter((s) => getStoneMaterial(s) === 'natur');

  const activeStats = personalStats || config.stats || { dekton: [], natur: [], neolith: [] };

  const showDekton = activeFilter === 'all' || activeFilter === 'dekton';
  const showNeolith = activeFilter === 'all' || activeFilter === 'neolith';
  const showNatur = activeFilter === 'all' || activeFilter === 'natur';

  return (
    <div id="tab-gallery" className="pb-20 space-y-6 sm:space-y-10 relative">
      {/* Markttrends / Filter-Leiste: 3 Spalten (Naturstein, Dekton, Neolith) mobil & desktop optimiert */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-4 md:gap-6 mt-1">
        {/* Trend Card 1: Naturstein */}
        <button
          type="button"
          onClick={() => handleToggleFilter('natur')}
          className={`px-2 py-2.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer select-none active:scale-[0.98] ${
            activeFilter === 'natur'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/40 shadow-md'
              : activeFilter !== 'all'
              ? 'bg-white/60 dark:bg-[#121212]/60 border-slate-200/60 dark:border-[#262626]/60 opacity-60 hover:opacity-100 hover:border-slate-300 dark:hover:border-zinc-700'
              : 'bg-white dark:bg-[#121212] border-slate-200 dark:border-[#262626] hover:border-emerald-400/50 dark:hover:border-emerald-500/40 hover:shadow-xs'
          }`}
          title={activeFilter === 'natur' ? 'Filter aufheben (alle anzeigen)' : 'Nach Naturstein filtern'}
        >
          <div className="flex items-center gap-1 justify-center mb-1">
            <span className="px-1.5 sm:px-2 py-0.5 rounded text-[7.5px] sm:text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-white shadow-xs whitespace-nowrap">
              Naturstein
            </span>
            {activeFilter === 'natur' && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 hidden xs:inline-block" />
            )}
          </div>
          <p id="trend-natur" className="text-[11px] xs:text-xs sm:text-xl font-black text-slate-800 dark:text-slate-100 font-mono tracking-tight truncate w-full">
            {formatTrend(activeStats.natur || [])}
          </p>
        </button>

        {/* Trend Card 2: Dekton */}
        <button
          type="button"
          onClick={() => handleToggleFilter('dekton')}
          className={`px-2 py-2.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer select-none active:scale-[0.98] ${
            activeFilter === 'dekton'
              ? 'bg-red-50 dark:bg-red-950/30 border-red-500 ring-2 ring-red-500/40 shadow-md'
              : activeFilter !== 'all'
              ? 'bg-white/60 dark:bg-[#121212]/60 border-slate-200/60 dark:border-[#262626]/60 opacity-60 hover:opacity-100 hover:border-slate-300 dark:hover:border-zinc-700'
              : 'bg-white dark:bg-[#121212] border-slate-200 dark:border-[#262626] hover:border-red-400/50 dark:hover:border-red-500/40 hover:shadow-xs'
          }`}
          title={activeFilter === 'dekton' ? 'Filter aufheben (alle anzeigen)' : 'Nach Dekton filtern'}
        >
          <div className="flex items-center gap-1 justify-center mb-1">
            <span className="px-1.5 sm:px-2 py-0.5 rounded text-[7.5px] sm:text-[9px] font-black uppercase tracking-wider bg-red-500 text-white shadow-xs whitespace-nowrap">
              Dekton
            </span>
            {activeFilter === 'dekton' && (
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 hidden xs:inline-block" />
            )}
          </div>
          <p id="trend-dekton" className="text-[11px] xs:text-xs sm:text-xl font-black text-slate-800 dark:text-slate-100 font-mono tracking-tight truncate w-full">
            {formatTrend(activeStats.dekton || [])}
          </p>
        </button>

        {/* Trend Card 3: Neolith */}
        <button
          type="button"
          onClick={() => handleToggleFilter('neolith')}
          className={`px-2 py-2.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer select-none active:scale-[0.98] ${
            activeFilter === 'neolith'
              ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-500 ring-2 ring-orange-500/40 shadow-md'
              : activeFilter !== 'all'
              ? 'bg-white/60 dark:bg-[#121212]/60 border-slate-200/60 dark:border-[#262626]/60 opacity-60 hover:opacity-100 hover:border-slate-300 dark:hover:border-zinc-700'
              : 'bg-white dark:bg-[#121212] border-slate-200 dark:border-[#262626] hover:border-orange-400/50 dark:hover:border-orange-500/40 hover:shadow-xs'
          }`}
          title={activeFilter === 'neolith' ? 'Filter aufheben (alle anzeigen)' : 'Nach Neolith filtern'}
        >
          <div className="flex items-center gap-1 justify-center mb-1">
            <span className="px-1.5 sm:px-2 py-0.5 rounded text-[7.5px] sm:text-[9px] font-black uppercase tracking-wider bg-orange-500 text-white shadow-xs whitespace-nowrap">
              Neolith
            </span>
            {activeFilter === 'neolith' && (
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 hidden xs:inline-block" />
            )}
          </div>
          <p id="trend-neolith" className="text-[11px] xs:text-xs sm:text-xl font-black text-slate-800 dark:text-slate-100 font-mono tracking-tight truncate w-full">
            {formatTrend(activeStats.neolith || [])}
          </p>
        </button>
      </div>

      {/* Sektion 1: Naturstein */}
      {showNatur && (
        <div>
          <div className="mb-4 sm:mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-lg text-xs md:text-sm font-black uppercase tracking-widest bg-emerald-500 text-white shadow-xs">
                Naturstein
              </span>
              <span className="text-xs text-slate-400 font-mono">({naturStones.length})</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {naturStones.length > 0 ? (
              naturStones.map((s, idx) => renderCard(s, idx))
            ) : (
              <p className="text-sm text-slate-500 col-span-full italic py-4">Keine Natursteine vorhanden.</p>
            )}
          </div>
        </div>
      )}

      {/* Sektion 2: Dekton */}
      {showDekton && (
        <div className={activeFilter === 'all' && showNatur ? 'mt-10 sm:mt-12 border-t border-slate-200 dark:border-darkBorder pt-8 sm:pt-10' : ''}>
          <div className="mb-4 sm:mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-lg text-xs md:text-sm font-black uppercase tracking-widest bg-red-500 text-white shadow-xs">
                Dekton
              </span>
              <span className="text-xs text-slate-400 font-mono">({dektonStones.length})</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {dektonStones.length > 0 ? (
              dektonStones.map((s, idx) => renderCard(s, idx))
            ) : (
              <p className="text-sm text-slate-500 col-span-full italic py-4">Keine Dekton Steine vorhanden.</p>
            )}
          </div>
        </div>
      )}

      {/* Sektion 3: Neolith */}
      {showNeolith && (
        <div className={activeFilter === 'all' && (showNatur || showDekton) ? 'mt-10 sm:mt-12 border-t border-slate-200 dark:border-darkBorder pt-8 sm:pt-10' : ''}>
          <div className="mb-4 sm:mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-lg text-xs md:text-sm font-black uppercase tracking-widest bg-orange-500 text-white shadow-xs">
                Neolith
              </span>
              <span className="text-xs text-slate-400 font-mono">({neolithStones.length})</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {neolithStones.length > 0 ? (
              neolithStones.map((s, idx) => renderCard(s, idx))
            ) : (
              <p className="text-sm text-slate-500 col-span-full italic py-4">Keine Neolith Steine vorhanden.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

