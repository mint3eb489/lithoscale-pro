import React, { useState, useEffect } from 'react';
import { Stone, AppConfig, Part } from '../types';
import { Plus, X, ArrowUpCircle, Scale, Eye, Layers, ArrowDownToLine, ArrowUpFromLine, Scissors, CircleDot, RotateCcw, ChevronDown, Search } from 'lucide-react';
import { AnimatedNumber } from './AnimatedNumber';

interface CalculatorTabProps {
  stones: Stone[];
  config: AppConfig;
  parts: Part[];
  setParts: React.Dispatch<React.SetStateAction<Part[]>>;
  selectedStoneId: string;
  setSelectedStoneId: (id: string) => void;
  miterInput: string;
  setMiterInput: (val: string) => void;
  underCount: number;
  flushCount: number;
  topCount: number;
  notchCount: number;
  holeCount: number;
  gluingCheck: boolean;
  setGluingCheck: (val: boolean) => void;
  activeServices: { measure: boolean; delivery: boolean };
  toggleService: (srv: 'measure' | 'delivery') => void;
  onSaveStat: () => void;
  onResetCalculator: () => void;
  openLightbox: (img: string) => void;
  personalFactors?: {
    factor?: number;
    moebelFactor?: number;
  };
}

export const CalculatorTab: React.FC<CalculatorTabProps> = ({
  stones,
  config,
  parts,
  setParts,
  selectedStoneId,
  setSelectedStoneId,
  miterInput,
  setMiterInput,
  underCount,
  flushCount,
  topCount,
  notchCount,
  holeCount,
  gluingCheck,
  setGluingCheck,
  activeServices,
  toggleService,
  onSaveStat,
  onResetCalculator,
  openLightbox,
  personalFactors,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'natur' | 'dekton'>('all');
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [editingMachiningPartId, setEditingMachiningPartId] = useState<number | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    const handleFocusChange = () => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.getAttribute('contenteditable') === 'true'
      );
      setIsInputFocused(!!isInput);
    };

    document.addEventListener('focusin', handleFocusChange);
    const handleFocusOut = () => {
      setTimeout(handleFocusChange, 50);
    };
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('focusin', handleFocusChange);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#custom-stone-dropdown-container')) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [dropdownOpen]);

  useEffect(() => {
    if (!dropdownOpen) {
      setSearchQuery('');
    }
  }, [dropdownOpen]);

  const updateGlobalMachiningCount = (key: 'flush' | 'under' | 'top' | 'notch' | 'hole', value: number) => {
    if (parts.length === 0) return;
    setParts((prev) =>
      prev.map((p, idx) => {
        if (idx === 0) {
          return { ...p, [key]: value };
        }
        return { ...p, [key]: 0 };
      })
    );
  };

  const updateMachiningValue = (partId: number, field: string, value: number) => {
    setParts((prev) =>
      prev.map((p) => {
        if (p.id !== partId) return p;
        return { ...p, [field]: value };
      })
    );
  };

  // Sorting stones alphabetically
  const sortedStones = [...stones].sort((a, b) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base' }));
  
  const selectedStone = stones.find((s) => s.id === selectedStoneId) || stones[0] || null;

  // Real-time calculation helper
  const calculateResult = () => {
    if (!selectedStone) return { totalSqm: 0, totalLfm: 0, sumMat: 0, sumEdge: 0, sumCut: 0, sumExtra: 0, ek: 0, vk: 0 };
    
    const isDek = selectedStone.isDekton === true || selectedStone.isDekton === 'true';
    const edgeRate = isDek ? config.dekEdge : config.natEdge;
    const rateFlush = isDek ? config.dekCutFlush : config.natCutFlush;
    const rateUnder = isDek ? config.dekCutUnder : config.natCutUnder;
    const rateTop = isDek ? (config.dekCutTop || 0) : (config.natCutTop || 0);

    let totalSqm = 0;
    let totalLfm = 0;

    parts.forEach((p) => {
      const l = parseFloat(p.l.replace(',', '.')) || 0;
      const w = parseFloat(p.w.replace(',', '.')) || 0;
      totalSqm += (l * w) / 10000;
      if (p.edges.v) totalLfm += l / 100;
      if (p.edges.h) totalLfm += l / 100;
      if (p.edges.l) totalLfm += w / 100;
      if (p.edges.r) totalLfm += w / 105; // slight correction
    });

    const miterMeters = (parseFloat(miterInput.replace(',', '.')) || 0) / 100;
    const gluingCost = gluingCheck ? (config.gluing || 0) : 0;

    const sumMat = totalSqm * selectedStone.price;
    const sumEdge = totalLfm * edgeRate;

    const sumCut =
      flushCount * rateFlush +
      underCount * rateUnder +
      topCount * rateTop +
      notchCount * (config.notch || 0) +
      holeCount * (config.hole || 0);

    const sumExtra =
      miterMeters * (config.miter || 0) +
      gluingCost +
      (activeServices.measure ? config.measure : 0) +
      (activeServices.delivery ? config.delivery : 0);

    const ek = sumMat + sumEdge + sumCut + sumExtra;
    
    // Support per-user custom factor
    const activeFactor = personalFactors?.factor ?? config.factor;
    const vk = ek * activeFactor;

    return { totalSqm, totalLfm, sumMat, sumEdge, sumCut, sumExtra, ek, vk };
  };

  const res = calculateResult();

  const addPart = () => {
    setParts((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: `Platte ${prev.length + 1}`,
        l: '',
        w: '',
        edges: { v: true, h: false, l: false, r: false },
        flush: 0,
        under: 0,
        top: 0,
        notch: 0,
        hole: 0,
        miter: '',
        gluing: false,
      },
    ]);
  };

  const removePart = (id: number) => {
    setParts((prev) => prev.filter((p) => p.id !== id));
  };

  const updatePartField = (id: number, field: keyof Part | 'edges-h' | 'edges-v' | 'edges-l' | 'edges-r', val: any) => {
    setParts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        if (field === 'edges-h') return { ...p, edges: { ...p.edges, h: !p.edges.h } };
        if (field === 'edges-v') return { ...p, edges: { ...p.edges, v: !p.edges.v } };
        if (field === 'edges-l') return { ...p, edges: { ...p.edges, l: !p.edges.l } };
        if (field === 'edges-r') return { ...p, edges: { ...p.edges, r: !p.edges.r } };

        let finalVal = val;
        if (field === 'l' || field === 'w') {
          // Robust validation for dimension inputs:
          // 1. Remove units "cm" and "mm" (case-insensitive)
          let cleaned = String(val).replace(/(cm|mm)/gi, '');
          // 2. Filter to exclusively allow numbers, dots, and commas
          cleaned = cleaned.replace(/[^0-9.,]/g, '');
          finalVal = cleaned;
        }

        return { ...p, [field]: finalVal };
      })
    );
  };

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(val);
  };

  const getPriceSegment = (price: number) => {
    if (stones.length === 0) return { label: 'Classic', level: 2, dotColor: 'bg-blue-500' };
    const prices = stones.map((s) => s.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice;
    if (range === 0) return { label: 'Classic', level: 2, dotColor: 'bg-blue-500' };
    
    const ratio = (price - minPrice) / range;
    if (ratio < 0.25) return { label: 'Basis', level: 1, dotColor: 'bg-emerald-500' };
    if (ratio < 0.5) return { label: 'Classic', level: 2, dotColor: 'bg-blue-500' };
    if (ratio < 0.75) return { label: 'Exclusive', level: 3, dotColor: 'bg-indigo-500' };
    return { label: 'Premium', level: 4, dotColor: 'bg-amber-500' };
  };

  const filteredStones = sortedStones.filter((s) => {
    if (activeFilter === 'dekton' && !s.isDekton) return false;
    if (activeFilter === 'natur' && s.isDekton) return false;
    return true;
  });

  // Synchronize selectedStoneId with filteredStones when activeFilter changes and selectedStoneId is no longer visible
  useEffect(() => {
    if (filteredStones.length > 0) {
      const isVisible = filteredStones.some((s) => s.id === selectedStoneId);
      if (!isVisible) {
        setSelectedStoneId(filteredStones[0].id);
      }
    }
  }, [activeFilter, filteredStones, selectedStoneId, setSelectedStoneId]);

  return (
    <div id="tab-calc" className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch pb-36 lg:pb-0">
      <div className="lg:col-span-3 space-y-5">
        <div className="card p-6 relative overflow-hidden group/card hover:border-blue-500/30 transition-all duration-300">
          
          {/* Der Glow-Hintergrundkreis */}
          <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full pointer-events-none opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 bg-blue-500/15 dark:bg-blue-400/15 blur-3xl z-0" />

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-5 border-b border-slate-200 dark:border-darkBorder pb-3">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Konfiguration</h2>
            {selectedStone && (
              <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-black text-white ${(selectedStone.isDekton === true || selectedStone.isDekton === 'true') ? 'bg-red-500' : 'bg-green-500'}`}>
                {(selectedStone.isDekton === true || selectedStone.isDekton === 'true') ? 'DEKTON' : 'NATURSTEIN'}
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-5 mb-5">
            <div
              className="w-44 h-44 sm:w-36 sm:h-36 md:w-40 md:h-40 lg:w-40 lg:h-40 rounded-xl border border-slate-200 dark:border-darkBorder overflow-hidden shrink-0 bg-slate-50 dark:bg-black flex items-center justify-center relative shadow-inner mx-auto sm:mx-0 group cursor-pointer"
              onClick={() => selectedStone?.image && openLightbox(selectedStone.image)}
              title="Bild vergrößern"
            >
              {selectedStone?.image ? (
                <img
                  src={selectedStone.image.startsWith('http') || selectedStone.image.startsWith('data:') ? selectedStone.image : `images/${selectedStone.image}`}
                  alt={selectedStone.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center leading-tight">Kein<br />Bild</span>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <div className="flex justify-between items-center mb-2 ml-1">
                <div className="flex items-center">
                  {selectedStone && (
                    <span className="text-[10.5px] font-mono font-bold text-blue-500 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-md">
                      {formatMoney(selectedStone.price)}/m²
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setActiveFilter('all')}
                    className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border transition-all uppercase ${
                      activeFilter === 'all'
                        ? 'bg-slate-600 border-slate-700 text-white shadow-sm'
                        : 'bg-transparent border-slate-200 dark:border-darkBorder text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    Alle
                  </button>
                  <button
                    onClick={() => setActiveFilter('natur')}
                    className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border transition-all uppercase ${
                      activeFilter === 'natur'
                        ? 'bg-emerald-600 border-emerald-700 text-white shadow-sm'
                        : 'bg-transparent border-emerald-500 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                    }`}
                  >
                    Natur
                  </button>
                  <button
                    onClick={() => setActiveFilter('dekton')}
                    className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border transition-all uppercase ${
                      activeFilter === 'dekton'
                        ? 'bg-red-600 border-red-700 text-white shadow-sm'
                        : 'bg-transparent border-red-500 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10'
                    }`}
                  >
                    Dekton
                  </button>
                </div>
              </div>
              <div id="custom-stone-dropdown-container" className="relative w-full">
                {/* Trigger Button */}
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full flex items-center justify-between bg-white dark:bg-[#121212] border border-slate-200 dark:border-darkBorder hover:border-slate-300 dark:hover:border-slate-700 rounded-xl py-1 px-3 text-left transition-all duration-200 shadow-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-lg border border-slate-200 dark:border-darkBorder overflow-hidden bg-slate-50 dark:bg-black shrink-0 flex items-center justify-center">
                      {selectedStone?.image ? (
                        <img
                          src={selectedStone.image.startsWith('http') || selectedStone.image.startsWith('data:') ? selectedStone.image : `images/${selectedStone.image}`}
                          alt={selectedStone.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center leading-tight">NO<br />IMG</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs md:text-sm truncate block">{selectedStone?.name || 'Material wählen...'}</span>
                        {selectedStone && (
                          <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase shrink-0 ${
                            (selectedStone.isDekton === true || selectedStone.isDekton === 'true')
                              ? 'bg-rose-500/10 text-rose-500 dark:text-rose-400'
                              : 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400'
                          }`}>
                            {(selectedStone.isDekton === true || selectedStone.isDekton === 'true') ? 'Dekton' : 'Natur'}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                        {selectedStone ? `${formatMoney(selectedStone.price)} / m²` : ''}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-[#121212] border border-slate-200 dark:border-darkBorder rounded-xl shadow-xl z-50 overflow-hidden flex flex-col max-h-80 transition-all">
                    {/* Search Bar */}
                    <div className="p-2 border-b border-slate-100 dark:border-darkBorder bg-slate-50/50 dark:bg-black/20 flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                      <input
                        type="text"
                        placeholder="Material suchen..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent border-none text-xs outline-none focus:ring-0 p-1 text-slate-800 dark:text-white"
                        autoFocus
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Scrollable List */}
                    <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-darkBorder/40">
                      {(() => {
                        const searchedStones = filteredStones.filter((s) =>
                          s.name.toLowerCase().includes(searchQuery.toLowerCase())
                        );

                        if (searchedStones.length === 0) {
                          return (
                            <div className="p-4 text-center text-xs text-slate-400 font-bold">
                              Keine passenden Materialien gefunden.
                            </div>
                          );
                        }

                        return searchedStones.map((s) => {
                          const isSelected = s.id === selectedStoneId;
                          const isDekton = s.isDekton === true || s.isDekton === 'true';
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                setSelectedStoneId(s.id);
                                setDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between py-0.5 px-2.5 text-left transition-all duration-150 cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-50/60 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-medium'
                                  : 'hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-12 h-12 rounded-lg border border-slate-200 dark:border-darkBorder overflow-hidden bg-slate-50 dark:bg-black shrink-0 flex items-center justify-center">
                                  {s.image ? (
                                    <img
                                      src={s.image.startsWith('http') || s.image.startsWith('data:') ? s.image : `images/${s.image}`}
                                      alt={s.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center leading-tight">NO<br />IMG</span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold truncate block">{s.name}</span>
                                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase shrink-0 ${
                                      isDekton
                                        ? 'bg-rose-500/10 text-rose-500'
                                        : 'bg-emerald-500/10 text-emerald-500'
                                    }`}>
                                      {isDekton ? 'Dekton' : 'Natur'}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5 block">
                                    {formatMoney(s.price)} / m²
                                  </span>
                                </div>
                              </div>
                              {isSelected && (
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 ml-2" />
                              )}
                            </button>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* Preis-Segment & Gesamtmaße Panel */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                {selectedStone && (() => {
                  const segment = getPriceSegment(selectedStone.price);
                  return (
                    <div className="p-2 border border-slate-200 dark:border-darkBorder bg-slate-50/50 dark:bg-[#121212]/50 rounded-xl flex flex-col justify-between h-14">
                      <span className="text-[8px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider leading-none">Preisklasse</span>
                      <div className="flex items-center justify-between gap-1.5 mt-1.5">
                        <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-350 leading-none">{segment.label}</span>
                        <div className="flex gap-0.5 shrink-0">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className={`w-2 h-1.5 rounded-full transition-all duration-300 ${
                                level <= segment.level 
                                  ? segment.dotColor 
                                  : 'bg-slate-200 dark:bg-zinc-800'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="p-2 border border-slate-200 dark:border-darkBorder bg-slate-50/50 dark:bg-[#121212]/50 rounded-xl flex flex-col justify-between h-14">
                  <span className="text-[8px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider leading-none">Gesamtmaße</span>
                  <div className="flex items-baseline gap-1 mt-1.5 font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300">
                    <span className="text-blue-500 dark:text-blue-400">{res.totalSqm.toFixed(2).replace('.', ',')} m²</span>
                    <span className="text-slate-300 dark:text-zinc-750 text-[8px]">/</span>
                    <span className="text-blue-500 dark:text-blue-400">{res.totalLfm.toFixed(2).replace('.', ',')} Lfm</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-slate-200 dark:border-darkBorder pt-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-[10px] font-black text-slate-555 uppercase tracking-widest">Stückliste (Platten)</h3>
              </div>
              <button
                type="button"
                onClick={addPart}
                className="bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:scale-105 active:scale-95 transition-all w-8 h-8 rounded-xl flex items-center justify-center font-black pb-0.5"
                title="Neue Platte hinzufügen"
              >
                +
              </button>
            </div>

            <div className="space-y-4">
              {parts.map((p) => {
                const lp = parseFloat(p.l.replace(',', '.')) || 0;
                const wp = parseFloat(p.w.replace(',', '.')) || 0;
                const sqm = (lp * wp) / 10000;
                let lfm = 0;
                if (p.edges.v) lfm += lp / 100;
                if (p.edges.h) lfm += lp / 100;
                if (p.edges.l) lfm += wp / 100;
                if (p.edges.r) lfm += wp / 100;

                const hasAnyValue = lp > 0 || wp > 0;

                return (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-[#262626] bg-slate-50 dark:bg-black flex flex-col gap-2.5 relative transition-all duration-300 shadow-sm focus-within:border-blue-500"
                  >
                    {/* Header: Name and badges */}
                    <div className="flex justify-between items-center gap-2">
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => updatePartField(p.id, 'name', e.target.value)}
                        className="bg-transparent font-black text-sm outline-none text-slate-700 dark:text-slate-200 focus:text-blue-500 placeholder-slate-400/50 w-2/3 transition-colors text-ellipsis overflow-hidden whitespace-nowrap"
                        placeholder="Bezeichnung"
                      />
                      
                      <div className="flex items-center gap-2 shrink-0">
                        {parts.length > 1 && (
                          <button
                            onClick={() => removePart(p.id)}
                            className="text-slate-300 hover:text-red-550 transition-colors w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-500/10 font-bold active:scale-90"
                            title="Platte löschen"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Compact Interactive Boundary Box (nested inside the edge-frame outline) */}
                    <div className="relative w-full min-h-[115px] border border-slate-200 dark:border-darkBorder rounded-xl flex flex-col items-center justify-center bg-white dark:bg-[#0c0c0e] hover:border-blue-400/50 dark:hover:border-blue-550/30 transition-all select-none group/slab overflow-hidden p-4 shadow-inner">
                      
                      {/* --- POLISHED EDGES --- */}
                      
                      {/* TOP EDGE button */}
                      <button
                        onClick={() => updatePartField(p.id, 'edges-h', null)}
                        className={`absolute top-0 left-0 right-0 h-1.5 transition-all active:scale-95 cursor-pointer ${
                          p.edges.h ? 'z-25 bg-blue-500 shadow-[0_1px_6px_rgba(59,130,246,0.4)]' : 'z-20 bg-slate-200 hover:bg-slate-350 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                        }`}
                        title="Oberkante polieren (Hinten / Wand)"
                      />
                      {/* TOP Hitbox overlay */}
                      <div 
                        onClick={() => updatePartField(p.id, 'edges-h', null)} 
                        className="absolute top-0 left-0 right-0 h-4 cursor-pointer bg-transparent z-10" 
                      />

                      {/* BOTTOM EDGE button */}
                      <button
                        onClick={() => updatePartField(p.id, 'edges-v', null)}
                        className={`absolute bottom-0 left-0 right-0 h-1.5 transition-all active:scale-95 cursor-pointer ${
                          p.edges.v ? 'z-25 bg-blue-500 shadow-[0_-1px_6px_rgba(59,130,246,0.4)]' : 'z-20 bg-slate-200 hover:bg-slate-350 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                        }`}
                        title="Unterkante polieren (Vorne / Sichtkante)"
                      />
                      {/* BOTTOM Hitbox overlay */}
                      <div 
                        onClick={() => updatePartField(p.id, 'edges-v', null)} 
                        className="absolute bottom-0 left-0 right-0 h-4 cursor-pointer bg-transparent z-10" 
                      />

                      {/* LEFT EDGE button */}
                      <button
                        onClick={() => updatePartField(p.id, 'edges-l', null)}
                        className={`absolute top-0 bottom-0 left-0 w-1.5 transition-all active:scale-95 cursor-pointer ${
                          p.edges.l ? 'z-25 bg-blue-500 shadow-[1px_0_6px_rgba(59,130,246,0.4)]' : 'z-20 bg-slate-200 hover:bg-slate-350 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                        }`}
                        title="Linke Kante polieren"
                      />
                      {/* LEFT Hitbox overlay */}
                      <div 
                        onClick={() => updatePartField(p.id, 'edges-l', null)} 
                        className="absolute top-0 bottom-0 left-0 w-4 cursor-pointer bg-transparent z-10" 
                      />

                      {/* RIGHT EDGE button */}
                      <button
                        onClick={() => updatePartField(p.id, 'edges-r', null)}
                        className={`absolute top-0 bottom-0 right-0 w-1.5 transition-all active:scale-95 cursor-pointer ${
                          p.edges.r ? 'z-25 bg-blue-500 shadow-[-1px_0_6px_rgba(59,130,246,0.4)]' : 'z-20 bg-slate-200 hover:bg-slate-350 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                        }`}
                        title="Rechte Kante polieren"
                      />
                      {/* RIGHT Hitbox overlay */}
                      <div 
                        onClick={() => updatePartField(p.id, 'edges-r', null)} 
                        className="absolute top-0 bottom-0 right-0 w-4 cursor-pointer bg-transparent z-10" 
                      />

                      {/* TOP ROW HEADER IN THE BOUNDARY BOX AREA */}
                      <div className="absolute top-4 left-4 right-4 z-40 flex flex-col gap-3">
                        {/* ROW 1: LEFT has m² and Lfm display, RIGHT has "Leeren" button */}
                        <div className="flex items-center justify-between">
                          {/* m² and Lfm display */}
                          <div className="flex items-center gap-1.5 shrink-0 select-none">
                            <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 px-2 py-0.5 rounded-md shrink-0">
                              {sqm.toFixed(2).replace('.', ',')} m²
                            </span>
                            <span className="text-[10px] font-mono font-bold text-blue-555 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md shrink-0">
                              {lfm.toFixed(2).replace('.', ',')} Lfm
                            </span>
                          </div>

                          {/* "Leeren" Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updatePartField(p.id, 'l', '');
                              updatePartField(p.id, 'w', '');
                              updateMachiningValue(p.id, 'flush', 0);
                              updateMachiningValue(p.id, 'under', 0);
                              updateMachiningValue(p.id, 'top', 0);
                              updateMachiningValue(p.id, 'notch', 0);
                              updateMachiningValue(p.id, 'hole', 0);
                            }}
                            disabled={!hasAnyValue}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border shadow-2xs select-none ${
                              hasAnyValue
                                ? 'text-red-500 hover:bg-red-500/10 border-red-500/20 bg-white dark:bg-zinc-900/95 dark:text-red-400 hover:scale-[1.03] active:scale-95 cursor-pointer font-black'
                                : 'text-slate-300 dark:text-zinc-800 border-slate-100 dark:border-zinc-850 bg-transparent cursor-not-allowed opacity-35'
                            }`}
                            title="Alle Werte und Bearbeitungen dieser Platte zurücksetzen"
                          >
                            <RotateCcw className="w-2.5 h-2.5 shrink-0" />
                            <span>Leeren</span>
                          </button>
                        </div>

                        {/* ROW 2: CENTERED input fields for length and width */}
                        <div className="flex justify-center w-full">
                          <div className="flex items-center gap-2 bg-slate-50/90 dark:bg-zinc-900/95 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-2xs">
                            {/* Länge Input */}
                            <div className="relative w-18">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={p.l}
                                onChange={(e) => updatePartField(p.id, 'l', e.target.value)}
                                className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-mono font-black text-center w-full py-1 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-800 dark:text-white"
                                placeholder="Länge"
                              />
                              {p.l && (
                                <span className="absolute right-1 text-[8.5px] font-mono text-slate-400 top-1/2 -translate-y-1/2 select-none">cm</span>
                              )}
                            </div>

                            <span className="text-slate-350 dark:text-zinc-700 font-extrabold text-xs select-none">×</span>

                            {/* Tiefe Input */}
                            <div className="relative w-18">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={p.w}
                                onChange={(e) => updatePartField(p.id, 'w', e.target.value)}
                                className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-mono font-black text-center w-full py-1 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-800 dark:text-white"
                                placeholder="Tiefe"
                              />
                              {p.w && (
                                <span className="absolute right-1 text-[8.5px] font-mono text-slate-400 top-1/2 -translate-y-1/2 select-none">cm</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>



                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          </div> {/* end of relative z-10 */}
        </div>
      </div>

      {/* SUMMARY SIDEBAR - DESKTOP */}
      <div className="hidden lg:block lg:col-span-2 text-slate-900">
        <div className="p-6 md:p-8 bg-black text-white rounded-3xl sticky top-10 shadow-2xl border border-darkBorder transition-all duration-300 relative overflow-hidden group/card">
          
          {/* Der Glow-Hintergrundkreis */}
          <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full pointer-events-none opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 bg-blue-500/25 blur-3xl z-0" />

          <div className="relative z-10">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 border-b border-darkBorder pb-4 text-center">
              Zusammenfassung
            </h2>

          <div className="space-y-4 text-xs mb-8">
            <div className="flex justify-between font-mono">
              <span className="text-slate-500 uppercase">Material</span>
              <span className="font-mono-tabular">{formatMoney(res.sumMat)}</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-slate-500 uppercase">Kanten</span>
              <span className="font-mono-tabular">{formatMoney(res.sumEdge)}</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-slate-500 uppercase">Ausschnitte</span>
              <span className="font-mono-tabular">{formatMoney(res.sumCut)}</span>
            </div>
            <div className="flex justify-between text-blue-500 border-t border-darkBorder pt-4 font-mono">
              <span className="font-bold uppercase tracking-widest">SERVICE</span>
              <span className="font-bold font-mono-tabular">{formatMoney(res.sumExtra)}</span>
            </div>
          </div>

          {/* BEARBEITUNGEN (5 BEARBEITUNGEN UNTEREINANDER MIT + UND -) */}
          <div className="space-y-1.5 mb-4 bg-zinc-950/45 p-3 rounded-2xl border border-slate-800">
            <span className="text-slate-500 font-extrabold block text-[8.5px] uppercase tracking-wider mb-2 select-none">Ausschnitt Bearbeitungen</span>
            {[
              { key: 'flush', label: 'Flächenbündig', val: flushCount },
              { key: 'under', label: 'Unterbau', val: underCount },
              { key: 'top', label: 'Auflage', val: topCount },
              { key: 'notch', label: 'Ausklinkung', val: notchCount },
              { key: 'hole', label: 'Bohrung', val: holeCount },
            ].map((mach) => {
              const val = mach.val;
              const isActive = val > 0;
              return (
                <div 
                  key={mach.key} 
                  className={`flex items-center justify-between p-1 px-2 rounded-lg border transition-all text-[9.5px] ${
                    isActive
                      ? 'bg-blue-500/5 border-blue-500/40'
                      : 'bg-zinc-950/40 border-slate-800/80'
                  }`}
                >
                  <span className={`font-bold truncate mr-1.5 uppercase ${isActive ? 'text-blue-400 font-extrabold' : 'text-slate-400'}`}>
                    {mach.label}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateGlobalMachiningCount(mach.key as any, Math.max(0, val - 1));
                      }}
                      disabled={val === 0}
                      className="w-6 h-6 rounded bg-zinc-800 text-slate-300 flex items-center justify-center font-bold text-xs active:scale-90 hover:bg-zinc-700 disabled:opacity-20 disabled:pointer-events-none"
                      title={`${mach.label} verringern`}
                    >
                      -
                    </button>
                    <span className={`w-5 text-center font-mono font-black text-[11px] ${isActive ? 'text-blue-400' : 'text-slate-500'}`}>
                      {val}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateGlobalMachiningCount(mach.key as any, Math.min(20, val + 1));
                      }}
                      disabled={val >= 20}
                      className="w-6 h-6 rounded bg-zinc-800 text-slate-300 flex items-center justify-center font-bold text-xs active:scale-90 hover:bg-zinc-700 disabled:opacity-20 disabled:pointer-events-none"
                      title={`${mach.label} erhöhen`}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* GEHRUNG & KLEBEN (SYMMETRISCH ÜBER AUFMASS UND MONTAGE) */}
          <div className="flex gap-3 mb-3.5 items-stretch">
            {/* Gehrung Input Element */}
            <div className="flex-1 flex flex-col justify-between p-2 rounded-xl border border-slate-800 text-[10px] font-bold uppercase bg-zinc-950/45 text-center">
              <span className="text-slate-500 font-extrabold block text-[8.5px] uppercase tracking-wider mb-1.5 select-none">Gehrung</span>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={miterInput}
                  onChange={(e) => setMiterInput(e.target.value)}
                  className="bg-black border border-slate-700 rounded-lg text-xs font-mono font-black text-center w-full py-0.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-white pr-5"
                  placeholder="0"
                />
                <span className="absolute right-1 text-[8px] font-mono text-slate-500 top-1/2 -translate-y-1/2 select-none">cm</span>
              </div>
            </div>

            {/* Kleben Toggle Button */}
            <button
              onClick={() => setGluingCheck(!gluingCheck)}
              className={`flex-1 flex flex-col items-center justify-center p-2 border rounded-xl text-[10px] font-bold uppercase transition-all active:scale-95 ${
                gluingCheck
                  ? 'border-blue-500 text-blue-500 bg-blue-500/10'
                  : 'border-slate-800 text-slate-400 hover:bg-white/5 bg-zinc-950/45'
              }`}
            >
              <span className="text-[8.5px] uppercase tracking-wider font-extrabold text-slate-505 select-none">Kleben</span>
              <span className={`text-[8px] font-mono font-black mt-1 px-1.5 py-0.2 rounded-md border ${
                gluingCheck ? 'bg-blue-500 text-white border-blue-600' : 'bg-transparent text-slate-500 border-slate-800'
              }`}>
                {gluingCheck ? 'AKTIV' : 'NEIN'}
              </span>
            </button>
          </div>

          <div className="flex gap-3 mb-6">
            <button
              onClick={() => toggleService('measure')}
              className={`flex-1 py-3 px-2 border rounded-xl text-[10px] font-bold uppercase transition-all active:scale-95 ${
                activeServices.measure
                  ? 'border-blue-500 text-blue-500 bg-blue-500/10'
                  : 'border-slate-700 text-slate-400 hover:bg-white/5'
              }`}
            >
              Aufmaß
            </button>
            <button
              onClick={() => toggleService('delivery')}
              className={`flex-1 py-3 px-2 border rounded-xl text-[10px] font-bold uppercase transition-all active:scale-95 ${
                activeServices.delivery
                  ? 'border-blue-500 text-blue-500 bg-blue-500/10'
                  : 'border-slate-700 text-slate-400 hover:bg-white/5'
              }`}
            >
              Montage
            </button>
          </div>

          <div className="text-center mb-6 pt-4 border-t border-white/5">
            <p className="text-[9px] font-black text-slate-600 uppercase mb-1 tracking-widest">Einkaufspreis (EK Netto)</p>
            <p className="text-lg font-bold text-slate-400 font-mono tracking-tighter font-mono-tabular">
              <AnimatedNumber value={res.ek} formatter={formatMoney} />
            </p>
          </div>

          <div className="p-6 bg-white/5 rounded-2xl border border-blue-600/30 text-center shadow-inner relative overflow-hidden mb-4">
            <div className="absolute inset-0 bg-blue-500/5" />
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 relative">Verkaufspreis (VK Brutto)</p>
            <p className="text-4xl font-black text-blue-500 tracking-tighter font-mono-tabular relative">
              <AnimatedNumber value={res.vk} formatter={formatMoney} />
            </p>
            <p className="text-[8px] text-slate-500 mt-2 italic relative">*Kalkuliert mit aktuellem Faktor</p>
          </div>

          <button
            onClick={onSaveStat}
            className="w-full py-3 flex items-center justify-center border border-slate-[#262626] text-slate-505 hover:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 mb-3"
          >
            In Markttrend übernehmen
          </button>

          <button
            onClick={onResetCalculator}
            className="w-full py-3 flex items-center justify-center border border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
          >
            Kalkulation zurücksetzen
          </button>
          </div> {/* end of relative z-10 */}
        </div>
      </div>

      {/* MOBILE BOTTOM SLIDING SHEET */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
          mobileSheetOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileSheetOpen(false)}
      />

      <div
        className="fixed left-0 right-0 bottom-0 z-50 lg:hidden flex flex-col max-h-[85vh] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] rounded-t-3xl bg-black border-t border-darkBorder transition-all duration-300 ease-out"
        style={{
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          transform: isInputFocused
            ? 'translateY(100%)'
            : mobileSheetOpen
              ? 'translateY(0)'
              : 'translateY(calc(100% - 82px - env(safe-area-inset-bottom, 0px)))',
          opacity: isInputFocused ? 0 : 1,
          pointerEvents: isInputFocused ? 'none' : 'auto',
        }}
      >
        <div
          className="bg-white/95 dark:bg-black/95 backdrop-blur-xl p-4 rounded-t-3xl cursor-pointer shrink-0 border-b border-darkBorder active:bg-slate-100 dark:active:bg-slate-900 transition-colors"
          onClick={() => setMobileSheetOpen(!mobileSheetOpen)}
        >
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3" />
          <div className="flex justify-between items-center max-w-4xl mx-auto px-2">
            <div>
              <p className="text-[10px] font-black text-slate-555 uppercase tracking-widest">Zusammenfassung</p>
              <p className="text-[8px] text-slate-400 italic">VK Brutto</p>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-2xl font-black text-blue-500 tracking-tighter font-mono-tabular">
                <AnimatedNumber value={res.vk} formatter={formatMoney} />
              </p>
              <span className={`w-5 h-5 text-slate-400 transform transition-transform ${mobileSheetOpen ? 'rotate-180' : ''}`}>▼</span>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 overflow-y-auto text-white pb-safe">
          <div className="space-y-4 text-xs mb-8">
            <div className="flex justify-between font-mono">
              <span className="text-slate-555 uppercase">Material</span>
              <span className="font-mono-tabular">{formatMoney(res.sumMat)}</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-slate-555 uppercase">Kanten</span>
              <span className="font-mono-tabular">{formatMoney(res.sumEdge)}</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-slate-555 uppercase">Ausschnitte</span>
              <span className="font-mono-tabular">{formatMoney(res.sumCut)}</span>
            </div>
            <div className="flex justify-between text-blue-500 border-t border-darkBorder pt-4 font-mono">
              <span className="font-bold uppercase tracking-widest">SERVICE</span>
              <span className="font-bold font-mono-tabular">{formatMoney(res.sumExtra)}</span>
            </div>
          </div>

          {/* BEARBEITUNGEN (5 BEARBEITUNGEN UNTEREINANDER MIT + UND -) */}
          <div className="space-y-1.5 mb-4 bg-zinc-950/45 p-3 rounded-2xl border border-slate-800">
            <span className="text-slate-500 font-extrabold block text-[8.5px] uppercase tracking-wider mb-2 select-none">Ausschnitt Bearbeitungen</span>
            {[
              { key: 'flush', label: 'Flächenbündig', val: flushCount },
              { key: 'under', label: 'Unterbau', val: underCount },
              { key: 'top', label: 'Auflage', val: topCount },
              { key: 'notch', label: 'Ausklinkung', val: notchCount },
              { key: 'hole', label: 'Bohrung', val: holeCount },
            ].map((mach) => {
              const val = mach.val;
              const isActive = val > 0;
              return (
                <div 
                  key={mach.key} 
                  className={`flex items-center justify-between p-1 px-2 rounded-lg border transition-all text-[9.5px] ${
                    isActive
                      ? 'bg-blue-500/5 border-blue-500/40'
                      : 'bg-zinc-950/40 border-slate-800/80'
                  }`}
                >
                  <span className={`font-bold truncate mr-1.5 uppercase ${isActive ? 'text-blue-400 font-extrabold' : 'text-slate-400'}`}>
                    {mach.label}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateGlobalMachiningCount(mach.key as any, Math.max(0, val - 1));
                      }}
                      disabled={val === 0}
                      className="w-6 h-6 rounded bg-zinc-800 text-slate-300 flex items-center justify-center font-bold text-xs active:scale-90 hover:bg-zinc-700 disabled:opacity-20 disabled:pointer-events-none"
                      title={`${mach.label} verringern`}
                    >
                      -
                    </button>
                    <span className={`w-5 text-center font-mono font-black text-[11px] ${isActive ? 'text-blue-400' : 'text-slate-500'}`}>
                      {val}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateGlobalMachiningCount(mach.key as any, Math.min(20, val + 1));
                      }}
                      disabled={val >= 20}
                      className="w-6 h-6 rounded bg-zinc-800 text-slate-300 flex items-center justify-center font-bold text-xs active:scale-90 hover:bg-zinc-700 disabled:opacity-20 disabled:pointer-events-none"
                      title={`${mach.label} erhöhen`}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* GEHRUNG & KLEBEN (SYMMETRISCH ÜBER AUFMASS UND MONTAGE) */}
          <div className="flex gap-3 mb-3.5 items-stretch">
            {/* Gehrung Input Element */}
            <div className="flex-1 flex flex-col justify-between p-2 rounded-xl border border-slate-800 text-[10px] font-bold uppercase bg-zinc-950/45 text-center">
              <span className="text-slate-555 font-extrabold block text-[8.5px] uppercase tracking-wider mb-1.5 select-none">Gehrung</span>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={miterInput}
                  onChange={(e) => setMiterInput(e.target.value)}
                  className="bg-black border border-slate-700 rounded-lg text-xs font-mono font-black text-center w-full py-0.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-white pr-5"
                  placeholder="0"
                />
                <span className="absolute right-1 text-[8px] font-mono text-slate-500 top-1/2 -translate-y-1/2 select-none">cm</span>
              </div>
            </div>

            {/* Kleben Toggle Button */}
            <button
              onClick={() => setGluingCheck(!gluingCheck)}
              className={`flex-1 flex flex-col items-center justify-center p-2 border rounded-xl text-[10px] font-bold uppercase transition-all active:scale-95 ${
                gluingCheck
                  ? 'border-blue-500 text-blue-500 bg-blue-500/10'
                  : 'border-slate-800 text-slate-400 hover:bg-white/5 bg-zinc-950/45'
              }`}
            >
              <span className="text-[8.5px] uppercase tracking-wider font-extrabold text-slate-505 select-none">Kleben</span>
              <span className={`text-[8px] font-mono font-black mt-1 px-1.5 py-0.2 rounded-md border ${
                gluingCheck ? 'bg-blue-500 text-white border-blue-600' : 'bg-transparent text-slate-500 border-slate-800'
              }`}>
                {gluingCheck ? 'AKTIV' : 'NEIN'}
              </span>
            </button>
          </div>

          <div className="flex gap-3 mb-6">
            <button
              onClick={() => toggleService('measure')}
              className={`flex-1 py-3 px-2 border rounded-xl text-[10px] font-bold uppercase transition-all active:scale-95 ${
                activeServices.measure
                  ? 'border-blue-500 text-blue-500 bg-blue-500/10'
                  : 'border-slate-700 text-slate-400 hover:bg-white/5'
              }`}
            >
              Aufmaß
            </button>
            <button
              onClick={() => toggleService('delivery')}
              className={`flex-1 py-3 px-2 border rounded-xl text-[10px] font-bold uppercase transition-all active:scale-95 ${
                activeServices.delivery
                  ? 'border-blue-500 text-blue-500 bg-blue-500/10'
                  : 'border-slate-700 text-slate-400 hover:bg-white/5'
              }`}
            >
              Montage
            </button>
          </div>

          <div className="text-center mb-6 pt-4 border-t border-white/5">
            <p className="text-[9px] font-black text-slate-600 uppercase mb-1 tracking-widest">Einkaufspreis (EK Netto)</p>
            <p className="text-lg font-bold text-slate-400 font-mono tracking-tighter font-mono-tabular">
              <AnimatedNumber value={res.ek} formatter={formatMoney} />
            </p>
          </div>

          <div className="p-6 bg-white/5 rounded-2xl border border-blue-600/30 text-center shadow-inner relative overflow-hidden mb-6">
            <div className="absolute inset-0 bg-blue-500/5" />
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 relative">Verkaufspreis (VK Brutto)</p>
            <p className="text-4xl font-black text-blue-500 tracking-tighter font-mono-tabular relative font-mono">
              <AnimatedNumber value={res.vk} formatter={formatMoney} />
            </p>
            <p className="text-[8px] text-slate-500 mt-2 italic relative">*Kalkuliert mit aktuellem Faktor</p>
          </div>

          <button
            onClick={onSaveStat}
            className="w-full py-4 flex items-center justify-center border border-slate-700 text-slate-400 hover:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 mb-3"
          >
            In Markttrend übernehmen
          </button>

          <button
            onClick={onResetCalculator}
            className="w-full py-4 flex items-center justify-center border border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 mb-4"
          >
            Kalkulation zurücksetzen
          </button>
        </div>
      </div>
    </div>
  );
};
