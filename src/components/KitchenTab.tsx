import React, { useRef, useState, useEffect } from 'react';
import { Kitchen, AppConfig, KitchenItem, UserProfile, SavedCalculation, KitchenVersionOption } from '../types';
import { Download, Trash2, Sparkles, UploadCloud, FileText, Maximize2, X, Eye, EyeOff, Bookmark, Cloud, Layers, RefreshCw, CheckCircle2, ArrowUpRight, ArrowDownRight, Equal, FileSpreadsheet, Plus, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { AnimatedNumber } from './AnimatedNumber';
import { resolveBeraterId, resolveBeraterName } from '../utils/beraterUtils';

interface KitchenTabProps {
  kitchen: Kitchen;
  setKitchen: React.Dispatch<React.SetStateAction<Kitchen>>;
  config: AppConfig;
  onOpenOffersModal: () => void;
  onPullSelectedStonePrice: () => void;
  onResetKitchen: () => void;
  onSaveOffer: () => void;
  onGeneratePDF: () => void;
  onGeneratePDFPreview: () => void;
  onImportCaratXLSX: (file: File) => void;
  onImportCaratFiles?: (files: File[], targetSlotIndex?: number) => void;
  onSwapVersionWithBasis?: (optionId: string) => void;
  onRemoveVersionOption?: (optionId: string) => void;
  personalFactors?: {
    factor?: number;
    moebelFactor?: number;
  };
  usersList?: UserProfile[];
  userProfile?: UserProfile | null;
  savedCalculations?: SavedCalculation[];
  onLoadSavedCalculation?: (calc: SavedCalculation) => void;
  onDeleteSavedCalculation?: (id: string, name: string) => void;
  canUsePriceComparison?: boolean;
}

export const KitchenTab: React.FC<KitchenTabProps> = ({
  kitchen,
  setKitchen,
  config,
  onOpenOffersModal,
  onPullSelectedStonePrice,
  onResetKitchen,
  onSaveOffer,
  onGeneratePDF,
  onGeneratePDFPreview,
  onImportCaratXLSX,
  onImportCaratFiles,
  onSwapVersionWithBasis,
  onRemoveVersionOption,
  personalFactors,
  usersList = [],
  userProfile,
  savedCalculations = [],
  onLoadSavedCalculation,
  onDeleteSavedCalculation,
  canUsePriceComparison = true,
}) => {
  const masterFileInputRef = useRef<HTMLInputElement>(null);
  const slot0InputRef = useRef<HTMLInputElement>(null);
  const slot1InputRef = useRef<HTMLInputElement>(null);
  const slot2InputRef = useRef<HTMLInputElement>(null);
  const [showSavedCalcsDropdown, setShowSavedCalcsDropdown] = useState(false);
  const [isDiffBoxOpen, setIsDiffBoxOpen] = useState(false);
  const [activeVersionTab, setActiveVersionTab] = useState<number>(0); // 0 = Hauptauftrag (Basis), 1 = Option 1, 2 = Option 2
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-set logged in user as Berater if not already set
  useEffect(() => {
    if (userProfile?.id && !kitchen.beraterId) {
      setKitchen((prev) => ({ ...prev, beraterId: userProfile.id }));
    }
  }, [userProfile?.id, kitchen.beraterId, setKitchen]);

  // Option slots
  const opt1 = (kitchen.versionOptions || []).find((o) => o.slotIndex === 1);
  const opt2 = (kitchen.versionOptions || []).find((o) => o.slotIndex === 2);

  // Auto fallback to basis tab if active option is deleted
  useEffect(() => {
    if (activeVersionTab === 1 && !opt1) setActiveVersionTab(0);
    if (activeVersionTab === 2 && !opt2) setActiveVersionTab(0);
  }, [opt1, opt2, activeVersionTab]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSavedCalcsDropdown(false);
      }
    }
    if (showSavedCalcsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSavedCalcsDropdown]);

  const renderSafeHTML = (htmlStr: string) => {
    if (!htmlStr) return null;
    return <span dangerouslySetInnerHTML={{ __html: htmlStr }} />;
  };

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(val);
  };

  const parseVal = (str: string) => {
    return parseFloat(String(str).replace(',', '.')) || 0;
  };

  const moebelFactor = personalFactors?.moebelFactor ?? config.moebelFactor ?? 2.0;

  // Active Kitchen object being viewed and edited in the UI
  const currentKitchen: Kitchen = activeVersionTab === 1 && opt1?.kitchenData
    ? { ...opt1.kitchenData, kunde: opt1.kitchenData.kunde || kitchen.kunde, beraterId: opt1.kitchenData.beraterId || kitchen.beraterId }
    : activeVersionTab === 2 && opt2?.kitchenData
    ? { ...opt2.kitchenData, kunde: opt2.kitchenData.kunde || kitchen.kunde, beraterId: opt2.kitchenData.beraterId || kitchen.beraterId }
    : kitchen;

  const ekMoebel = parseVal(currentKitchen.ekMoebel);
  const rabattMoebel = parseVal(currentKitchen.rabattMoebel);
  const vkMoebel = ekMoebel * moebelFactor * (1 - rabattMoebel / 100);

  const vkStein = parseVal(currentKitchen.steinVK);

  let sumMieleBrutto = 0;
  (currentKitchen.miele || []).forEach((m) => (sumMieleBrutto += parseVal(m.val)));
  const rabattMiele = parseVal(currentKitchen.rabattMiele);
  const vkMiele = sumMieleBrutto * (1 - rabattMiele / 100);

  let vkWasser = 0;
  (currentKitchen.wasser || []).forEach((w) => (vkWasser += parseVal(w.val)));

  const totalCalculatedVK = vkMoebel + vkWasser + vkStein + vkMiele;
  const targetEndprice = parseVal(currentKitchen.hauspreis);
  const finalDisplayVK = targetEndprice > 0 ? targetEndprice : totalCalculatedVK;
  const proportionMontage = finalDisplayVK * 0.095;

  // Helper to update an option's KitchenData inside kitchen.versionOptions
  const updateOptionData = (slotIdx: number, updaterFn: (prevK: Kitchen) => Kitchen) => {
    setKitchen((prev) => {
      const updatedOpts = (prev.versionOptions || []).map((opt) => {
        if (opt.slotIndex === slotIdx) {
          const baseK = opt.kitchenData || { ...prev };
          const newK = updaterFn(baseK);

          const ekMoebelNum = parseVal(newK.ekMoebel);
          const rabattMoebelNum = parseVal(newK.rabattMoebel);
          const vkMoebelNum = ekMoebelNum * moebelFactor * (1 - rabattMoebelNum / 100);

          let optSumMiele = 0;
          (newK.miele || []).forEach((m) => (optSumMiele += parseVal(m.val)));
          const rabattMieleNum = parseVal(newK.rabattMiele);
          const vkMieleNum = optSumMiele * (1 - rabattMieleNum / 100);

          let optVkWasser = 0;
          (newK.wasser || []).forEach((w) => (optVkWasser += parseVal(w.val)));

          const vkSteinNum = parseVal(newK.steinVK);
          const totalCalculatedVK = vkMoebelNum + optVkWasser + vkSteinNum + vkMieleNum;
          const targetEndprice = parseVal(newK.hauspreis);
          const finalDisplayVK = targetEndprice > 0 ? targetEndprice : totalCalculatedVK;

          return {
            ...opt,
            ekMoebel: newK.ekMoebel,
            steinVK: newK.steinVK,
            steinEK: newK.steinEK,
            hauspreis: newK.hauspreis,
            mieleVK: vkMieleNum,
            wasserVK: optVkWasser,
            totalCalculatedVK,
            finalDisplayVK,
            kitchenData: newK,
          };
        }
        return opt;
      });
      return { ...prev, versionOptions: updatedOpts };
    });
  };

  const updateField = (field: keyof Kitchen, val: any) => {
    if (field === 'rabattMoebel') {
      let num = parseFloat(String(val).replace(',', '.')) || 0;
      if (num > 5) {
        val = '5';
      }
    }
    if (field === 'rabattMiele') {
      let num = parseFloat(String(val).replace(',', '.')) || 0;
      if (num > 3) {
        val = '3';
      }
    }

    if (activeVersionTab === 0) {
      setKitchen((prev) => ({ ...prev, [field]: val }));
    } else {
      updateOptionData(activeVersionTab, (prevK) => ({ ...prevK, [field]: val }));
    }
  };

  const updateItem = (type: 'geraete' | 'miele' | 'spuele' | 'wasser' | 'mehrpreise', id: number, field: 'name' | 'val', value: string) => {
    if (activeVersionTab === 0) {
      setKitchen((prev) => ({
        ...prev,
        [type]: (prev[type] || []).map((item) => (item.id === id ? { ...item, [field]: value } : item)),
      }));
    } else {
      updateOptionData(activeVersionTab, (prevK) => ({
        ...prevK,
        [type]: (prevK[type] || []).map((item) => (item.id === id ? { ...item, [field]: value } : item)),
      }));
    }
  };

  const removeItem = (type: 'geraete' | 'miele' | 'spuele' | 'wasser' | 'mehrpreise', id: number) => {
    if (activeVersionTab === 0) {
      setKitchen((prev) => ({
        ...prev,
        [type]: (prev[type] || []).filter((item) => item.id !== id),
      }));
    } else {
      updateOptionData(activeVersionTab, (prevK) => ({
        ...prevK,
        [type]: (prevK[type] || []).filter((item) => item.id !== id),
      }));
    }
  };

  const addItem = (type: 'geraete' | 'miele' | 'spuele' | 'wasser' | 'mehrpreise') => {
    const newItem = { id: Date.now() + Math.random(), name: '', val: '' };
    if (activeVersionTab === 0) {
      setKitchen((prev) => ({
        ...prev,
        [type]: [...(prev[type] || []), newItem],
      }));
    } else {
      updateOptionData(activeVersionTab, (prevK) => ({
        ...prevK,
        [type]: [...(prevK[type] || []), newItem],
      }));
    }
  };

  const appendZubehoer = (text: string) => {
    const current = currentKitchen.zubehoer ? String(currentKitchen.zubehoer) : '';
    if (current.includes(text)) return;
    const updated = current ? `${current}\n${text}` : text;
    updateField('zubehoer', updated);
  };

  // Derivation of variables for Mini PDF Live preview
  const allDevices: string[] = [];
  (kitchen.geraete || []).forEach((g) => {
    if (g.name && g.name.trim() !== '') {
      const price = parseFloat(g.val.replace(',', '.')) || 0;
      allDevices.push(price > 0 ? `${g.name} (Internetpreis: ${formatMoney(price)})` : g.name);
    }
  });
  (kitchen.miele || []).forEach((m) => {
    if (m.name && m.name.trim() !== '') {
      allDevices.push(m.name);
    }
  });

  let zubehoerItems: string[] = [];
  (kitchen.spuele || []).forEach((s) => {
    if (s.name && s.name.trim() !== '') {
      const price = parseFloat(s.val.replace(',', '.')) || 0;
      zubehoerItems.push(price > 0 ? `${s.name} (Internetpreis: ${formatMoney(price)})` : s.name);
    }
  });
  (kitchen.wasser || []).forEach((w) => {
    if (w.name && w.name.trim() !== '') {
      zubehoerItems.push(w.name);
    }
  });

  if (kitchen.zubehoer && String(kitchen.zubehoer).trim() !== '') {
    zubehoerItems = [
      ...zubehoerItems,
      ...String(kitchen.zubehoer)
        .split('\n')
        .filter((line) => line.trim() !== ''),
    ];
  }

  let anschlussTextArray: string[] = [];
  if (kitchen.optAnschluss && config.pdfAnschlussText) {
    anschlussTextArray.push(config.pdfAnschlussText);
  }
  if (kitchen.optAnschlussRabatt && config.pdfAnschlussRabattText) {
    anschlussTextArray.push(config.pdfAnschlussRabattText);
  }

  const mpArray: string[] = [];
  (kitchen.mehrpreise || []).forEach((mp) => {
    if (mp.name && mp.name.trim() !== '') {
      const price = parseFloat(mp.val.replace(',', '.')) || 0;
      let priceText = '';
      if (price > 0) priceText = ` (+ ${formatMoney(price)})`;
      else if (price < 0) priceText = ` (- ${formatMoney(Math.abs(price))})`;
      mpArray.push(`${mp.name}${priceText}`);
    }
  });

  const beraterObj = (usersList || []).find((u) => String(u.id) === String(kitchen.beraterId)) ||
                     (config.beraterList || []).find((b) => String(b.id) === String(kitchen.beraterId));

  // Drag and drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleMasterDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) {
      const filesArr = Array.from(e.dataTransfer.files);
      if (onImportCaratFiles) {
        onImportCaratFiles(filesArr);
      } else {
        onImportCaratXLSX(filesArr[0]);
      }
    }
  };

  const handleSlotDrop = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files?.length) {
      const file = e.dataTransfer.files[0];
      if (onImportCaratFiles) {
        onImportCaratFiles([file], slotIndex);
      } else {
        onImportCaratXLSX(file);
      }
    }
  };

  const renderDiffCard = (opt: KitchenVersionOption, label: string) => {
    const optK = opt.kitchenData || {
      ...kitchen,
      ekMoebel: opt.ekMoebel,
      steinVK: opt.steinVK,
      steinEK: opt.steinEK,
      hauspreis: opt.hauspreis,
    };

    // Basis calculations
    const basisEkMoebelNum = parseVal(kitchen.ekMoebel);
    const basisRabattMoebelNum = parseVal(kitchen.rabattMoebel);
    const basisVkMoebelNum = basisEkMoebelNum * moebelFactor * (1 - basisRabattMoebelNum / 100);
    let basisSumMieleBrutto = 0;
    (kitchen.miele || []).forEach((m) => (basisSumMieleBrutto += parseVal(m.val)));
    const basisRabattMieleNum = parseVal(kitchen.rabattMiele);
    const basisVkMieleNum = basisSumMieleBrutto * (1 - basisRabattMieleNum / 100);
    let basisVkWasserNum = 0;
    (kitchen.wasser || []).forEach((w) => (basisVkWasserNum += parseVal(w.val)));

    const basisVkMoebelUndGeraeteNum = basisVkMoebelNum + basisVkMieleNum + basisVkWasserNum;
    const basisVkSteinNum = parseVal(kitchen.steinVK);
    const basisCalculatedVK = basisVkMoebelUndGeraeteNum + basisVkSteinNum;
    const basisHauspreisNum = parseVal(kitchen.hauspreis);
    const basisEndpreisNum = basisHauspreisNum > 0 ? basisHauspreisNum : basisCalculatedVK;

    // Option calculations
    const optEkMoebelNum = parseVal(optK.ekMoebel);
    const optRabattMoebelNum = parseVal(optK.rabattMoebel);
    const optVkMoebelNum = optEkMoebelNum * moebelFactor * (1 - optRabattMoebelNum / 100);
    let optSumMieleBrutto = 0;
    (optK.miele || []).forEach((m) => (optSumMieleBrutto += parseVal(m.val)));
    const optRabattMieleNum = parseVal(optK.rabattMiele);
    const optVkMieleNum = optSumMieleBrutto * (1 - optRabattMieleNum / 100);
    let optVkWasserNum = 0;
    (optK.wasser || []).forEach((w) => (optVkWasserNum += parseVal(w.val)));

    const optVkMoebelUndGeraeteNum = optVkMoebelNum + optVkMieleNum + optVkWasserNum;
    const optVkSteinNum = parseVal(optK.steinVK);
    const optCalculatedVK = optVkMoebelUndGeraeteNum + optVkSteinNum;
    const optHauspreisNum = parseVal(optK.hauspreis);
    const optEndpreisNum = optHauspreisNum > 0 ? optHauspreisNum : optCalculatedVK;

    const diffMoebelVK = optVkMoebelUndGeraeteNum - basisVkMoebelUndGeraeteNum;
    const diffSteinVK = optVkSteinNum - basisVkSteinNum;
    const diffGesamtVK = optEndpreisNum - basisEndpreisNum;

    return (
      <div key={opt.id} className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2.5 text-left shadow-md">
        <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded tracking-wider border ${
                opt.slotIndex === 1 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                  : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
              }`}>
                {label}
              </span>
              <span className="text-[10px] text-slate-200 font-bold truncate max-w-[130px]" title={opt.fileName}>
                {opt.fileName}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[8px] text-slate-400 uppercase font-bold block">Gesamt VK</span>
            <span className="text-xs font-black text-white font-mono">
              {formatMoney(optEndpreisNum)}
            </span>
          </div>
        </div>

        {/* Clean Differenzen ohne EK-Angaben & ohne Preisregeln */}
        <div className="space-y-1.5 text-[10px]">
          {/* Möbel & Geräte */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-black/60 border border-slate-800/80">
            <span className="text-slate-300 font-medium">Möbel & Geräte</span>
            <div className="text-right font-mono font-bold text-xs">
              {diffMoebelVK > 0 ? (
                <span className="text-amber-400 flex items-center justify-end gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +{formatMoney(diffMoebelVK)}
                </span>
              ) : diffMoebelVK < 0 ? (
                <span className="text-emerald-400 flex items-center justify-end gap-0.5">
                  <ArrowDownRight className="w-3.5 h-3.5" /> -{formatMoney(Math.abs(diffMoebelVK))}
                </span>
              ) : (
                <span className="text-slate-400 flex items-center justify-end gap-0.5">
                  <Equal className="w-3.5 h-3.5" /> 0,00 €
                </span>
              )}
            </div>
          </div>

          {/* Naturstein */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-black/60 border border-slate-800/80">
            <span className="text-slate-300 font-medium">Naturstein</span>
            <div className="text-right font-mono font-bold text-xs">
              {diffSteinVK > 0 ? (
                <span className="text-amber-400 flex items-center justify-end gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +{formatMoney(diffSteinVK)}
                </span>
              ) : diffSteinVK < 0 ? (
                <span className="text-emerald-400 flex items-center justify-end gap-0.5">
                  <ArrowDownRight className="w-3.5 h-3.5" /> -{formatMoney(Math.abs(diffSteinVK))}
                </span>
              ) : (
                <span className="text-slate-400 flex items-center justify-end gap-0.5">
                  <Equal className="w-3.5 h-3.5" /> 0,00 €
                </span>
              )}
            </div>
          </div>

          {/* Gesamtdifferenz */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <span className="text-blue-300 font-black">Gesamt-Differenz</span>
            <div className="text-right font-mono font-black text-xs">
              {diffGesamtVK > 0 ? (
                <span className="text-amber-300 flex items-center justify-end gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +{formatMoney(diffGesamtVK)}
                </span>
              ) : diffGesamtVK < 0 ? (
                <span className="text-emerald-300 flex items-center justify-end gap-0.5">
                  <ArrowDownRight className="w-3.5 h-3.5" /> -{formatMoney(Math.abs(diffGesamtVK))}
                </span>
              ) : (
                <span className="text-slate-300 flex items-center justify-end gap-0.5">
                  <Equal className="w-3.5 h-3.5" /> 0,00 €
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
          {onSwapVersionWithBasis && (
            <button
              type="button"
              onClick={() => onSwapVersionWithBasis(opt.id)}
              className="flex-1 py-1.5 bg-blue-600/90 hover:bg-blue-500 text-white rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer shadow"
            >
              <RefreshCw className="w-3 h-3" />
              Als Basis-Angebot festlegen
            </button>
          )}
          {onRemoveVersionOption && (
            <button
              type="button"
              onClick={() => onRemoveVersionOption(opt.id)}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
              title="Variante entfernen"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div id="tab-kitchen" className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start pb-36 lg:pb-0">
      <div className="lg:col-span-3 space-y-3.5">

        <div className="card p-4 relative overflow-hidden group/card hover:border-blue-500/35 hover:shadow-xl transition-all duration-300">
          
          {/* Der Glow-Hintergrundkreis */}
          <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full pointer-events-none opacity-60 sm:opacity-0 sm:group-hover/card:opacity-100 transition-opacity duration-500 bg-blue-500/15 dark:bg-blue-400/15 blur-3xl z-0" />

          <div className="relative z-10">

            <div className="flex justify-between items-center mb-3.5 border-b border-slate-200 dark:border-darkBorder pb-2">
              <h2 className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">
                1. Projekt & Design
              </h2>
              <button
                type="button"
                onClick={onOpenOffersModal}
                className="text-[9px] font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-1.5 rounded-lg hover:bg-blue-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer hover:-translate-y-0.5 hover:shadow-sm"
              >
                <Download className="w-3 h-3" />
                Aus Cloud laden
              </button>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[9px] font-black text-slate-650 dark:text-slate-300 uppercase block mb-1">Kunde / Kommission</label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={currentKitchen.kunde || ''}
                  onChange={(e) => updateField('kunde', e.target.value)}
                  className={`input-field input-field-compact text-xs text-slate-900 dark:text-white ${activeVersionTab !== 0 ? 'pr-7' : ''}`}
                  placeholder="Name oder Kommissionsnummer"
                />
                {activeVersionTab !== 0 && (
                  <button
                    type="button"
                    onClick={() => updateField('kunde', kitchen.kunde || '')}
                    className="absolute right-1.5 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 p-1 rounded transition-colors cursor-pointer"
                    title="Aus Hauptauftrag übernehmen"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-650 dark:text-slate-300 uppercase block mb-1">Berater</label>
              {(() => {
                // 1. Build list from Benutzerverwaltung (usersList) + userProfile
                const rawList: { id: string; name: string }[] = [];

                (usersList || []).forEach((u) => {
                  if (u.id && u.name) {
                    rawList.push({ id: String(u.id), name: u.name });
                  }
                });

                if (userProfile?.id && userProfile?.name) {
                  if (!rawList.some((u) => u.id === String(userProfile.id))) {
                    rawList.push({ id: String(userProfile.id), name: userProfile.name });
                  }
                }

                // 2. Deduplicate strictly by name (case-insensitive)
                const uniqueByNameMap = new Map<string, { id: string; name: string }>();
                rawList.forEach((item) => {
                  const nameKey = item.name.trim().toLowerCase();
                  if (!uniqueByNameMap.has(nameKey)) {
                    uniqueByNameMap.set(nameKey, item);
                  }
                });

                const uniqueList = Array.from(uniqueByNameMap.values());

                // 3. Sort: Enrico Belmonte first, then alphabetically
                uniqueList.sort((a, b) => {
                  const aIsEnrico = a.name.toLowerCase().includes("enrico belmonte");
                  const bIsEnrico = b.name.toLowerCase().includes("enrico belmonte");
                  if (aIsEnrico && !bIsEnrico) return -1;
                  if (!aIsEnrico && bIsEnrico) return 1;
                  return a.name.localeCompare(b.name, 'de', { sensitivity: 'base' });
                });

                // 4. Resolve effective selected ID (handles legacy names like "Belmonte", "Ruoff", "T. Schulz", "b1", "1775813497113", etc.)
                const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'sys-admin';
                const rawBeraterVal = currentKitchen.beraterId || userProfile?.id || '';
                const selectedValue = resolveBeraterId(rawBeraterVal, usersList, userProfile, config.beraterList);

                const existsInList = uniqueList.some((b) => b.id === selectedValue);
                let extraFallbackOption: { id: string; name: string } | null = null;
                if (!existsInList && rawBeraterVal) {
                  const fallbackName = resolveBeraterName(rawBeraterVal, usersList, userProfile, config.beraterList);
                  extraFallbackOption = { id: selectedValue, name: fallbackName };
                }

                return (
                  <select
                    value={selectedValue}
                    disabled={!isAdmin}
                    onChange={(e) => updateField('beraterId', e.target.value)}
                    className={`input-field input-field-compact text-xs text-slate-800 dark:text-white font-medium ${
                      !isAdmin
                        ? 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-90'
                        : 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {uniqueList.map((b) => (
                      <option key={b.id} value={b.id} className="text-slate-900 dark:text-white">
                        {b.name}
                      </option>
                    ))}
                    {extraFallbackOption && (
                      <option key={extraFallbackOption.id} value={extraFallbackOption.id} className="text-slate-900 dark:text-white">
                        {extraFallbackOption.name}
                      </option>
                    )}
                  </select>
                );
              })()}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[9px] font-black text-slate-650 dark:text-slate-300 uppercase block mb-1">Front 1</label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={currentKitchen.front1 || ''}
                  onChange={(e) => updateField('front1', e.target.value)}
                  className={`input-field input-field-compact text-xs text-slate-900 dark:text-white ${activeVersionTab !== 0 ? 'pr-7' : ''}`}
                  placeholder="Bezeichnung (z.B. Resopal Pro)"
                />
                {activeVersionTab !== 0 && (
                  <button
                    type="button"
                    onClick={() => updateField('front1', kitchen.front1 || '')}
                    className="absolute right-1.5 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 p-1 rounded transition-colors cursor-pointer"
                    title="Aus Hauptauftrag übernehmen"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-650 dark:text-slate-300 uppercase block mb-1">Front 2</label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={currentKitchen.front2 || ''}
                  onChange={(e) => updateField('front2', e.target.value)}
                  className={`input-field input-field-compact text-xs text-slate-900 dark:text-white ${activeVersionTab !== 0 ? 'pr-7' : ''}`}
                  placeholder="Optional"
                />
                {activeVersionTab !== 0 && (
                  <button
                    type="button"
                    onClick={() => updateField('front2', kitchen.front2 || '')}
                    className="absolute right-1.5 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 p-1 rounded transition-colors cursor-pointer"
                    title="Aus Hauptauftrag übernehmen"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mb-3">
            <label className="text-[9px] font-black text-slate-650 dark:text-slate-300 uppercase block mb-1">Griffausführung / Griffleiste</label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={currentKitchen.griff || ''}
                onChange={(e) => updateField('griff', e.target.value)}
                className={`input-field input-field-compact text-xs text-slate-900 dark:text-white ${activeVersionTab !== 0 ? 'pr-7' : ''}`}
                placeholder="Ausführung (z.B. grifflos, Edelstahl)"
              />
              {activeVersionTab !== 0 && (
                <button
                  type="button"
                  onClick={() => updateField('griff', kitchen.griff || '')}
                  className="absolute right-1.5 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 p-1 rounded transition-colors cursor-pointer"
                  title="Aus Hauptauftrag übernehmen"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-darkBorder pt-3.5">
            <div className="flex justify-between items-center mb-1.5 flex-wrap gap-2">
              <label className="text-[9px] font-black text-slate-650 dark:text-slate-300 uppercase">Arbeitsplatte (Bezeichnung & Preis)</label>
              <div className="flex gap-1 items-center relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={onPullSelectedStonePrice}
                  className="text-[8px] font-black bg-slate-100 dark:bg-[#1e1e1e] text-slate-650 dark:text-slate-300 px-2 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                  title="Aktuelle Kalkulation aus dem Rechner laden"
                >
                  <Sparkles className="w-2.5 h-2.5 text-blue-500" />
                  Aus Rechner
                </button>
                <button
                  type="button"
                  onClick={() => setShowSavedCalcsDropdown(!showSavedCalcsDropdown)}
                  className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 active:scale-90 transition-all cursor-pointer"
                  title="Gespeicherte Kalkulationen anzeigen"
                >
                  <Cloud className="w-3.5 h-3.5" />
                </button>

                {showSavedCalcsDropdown && (
                  <div className="absolute right-0 top-full mt-1.5 w-64 bg-white dark:bg-[#161616] border border-slate-200 dark:border-darkBorder rounded-xl shadow-xl z-50 py-1.5 overflow-hidden">
                    <div className="px-3 py-1.5 text-[8.5px] font-black uppercase text-slate-400 border-b border-slate-100 dark:border-darkBorder mb-1 flex justify-between items-center">
                      <span>Kalkulation auswählen</span>
                      <button
                        type="button"
                        onClick={() => setShowSavedCalcsDropdown(false)}
                        className="text-slate-400 hover:text-slate-655 dark:hover:text-slate-200 p-0.5 rounded transition-colors cursor-pointer"
                        title="Schließen"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {savedCalculations.length === 0 ? (
                        <div className="px-3 py-3 text-xs text-slate-450 dark:text-slate-500 text-center italic">
                          Keine gespeicherten Kalkulationen vorhanden
                        </div>
                      ) : (
                        savedCalculations.map((calc) => (
                          <div key={calc.id} className="w-full hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center justify-between px-3 py-2 group">
                            <button
                              type="button"
                              onClick={() => {
                                if (onLoadSavedCalculation) {
                                  onLoadSavedCalculation(calc);
                                }
                                setShowSavedCalcsDropdown(false);
                              }}
                              className="flex-1 text-left flex flex-col gap-0.5 min-w-0 mr-2"
                            >
                              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                {calc.name}
                              </div>
                              <div className="flex justify-between items-center text-[9px] text-slate-450 dark:text-slate-500 font-mono w-full">
                                <span className="truncate max-w-[120px]">
                                  {calc.stoneName}
                                </span>
                                <span className="text-blue-500 font-bold shrink-0">
                                  {formatMoney(calc.vk)}
                                </span>
                              </div>
                            </button>
                            {onDeleteSavedCalculation && (
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteSavedCalculation(calc.id, calc.name);
                                }}
                                className="text-red-500 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 p-1 rounded-lg active:scale-95 transition-all shrink-0 opacity-60 hover:opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                                title="Kalkulation löschen"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={currentKitchen.apName || ''}
                onChange={(e) => updateField('apName', e.target.value)}
                className="input-field input-field-compact text-xs flex-1 text-slate-900 dark:text-white font-bold"
                placeholder="z.B. Schichtstoff Eiche"
              />
              <div className="flex flex-col gap-1 w-32 shrink-0 font-bold">
                <div className="relative w-full">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={currentKitchen.steinVK || ''}
                    onChange={(e) => updateField('steinVK', e.target.value)}
                    className="input-field input-field-compact text-xs font-mono text-center px-1 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900 bg-blue-50/20"
                    placeholder="VK Brutto"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-blue-500">€</span>
                </div>
                <div className="relative w-full">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={currentKitchen.steinEK || ''}
                    onChange={(e) => updateField('steinEK', e.target.value)}
                    className="input-field input-field-compact text-[9px] py-1 font-mono text-center px-2 text-slate-650 dark:text-slate-400 border-dashed bg-slate-50 dark:bg-black border-slate-300 dark:border-darkBorder"
                    placeholder="EK Netto"
                    title="EK (Nur für interne Übersicht)"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-500">€</span>
                </div>
              </div>
            </div>
            {currentKitchen.showMoebelEK && (
              <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1.5 font-bold italic">💡 Hinweis: Bei Schichtstoff Preis leer lassen, läuft in Möbel-EK.</p>
            )}
          </div>
        </div>
      </div>

        <div className="card p-4 relative overflow-hidden group/card hover:border-slate-300 dark:hover:border-slate-800 transition-all duration-300">
          <div className="flex justify-between items-center mb-3 border-b border-slate-200 dark:border-darkBorder pb-2">
            <h2 className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">2. Kalkulation</h2>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => updateField('showMoebelEK', !currentKitchen.showMoebelEK)}
                className="text-slate-650 hover:text-blue-500 dark:text-slate-400 dark:hover:text-blue-400 transition-all focus:outline-none flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 p-1 rounded-lg bg-slate-100 dark:bg-[#1a1a1a] border border-slate-330 dark:border-darkBorder shadow-sm"
                title={currentKitchen.showMoebelEK ? 'EK & Erklärungen verbergen' : 'EK & Erklärungen einblenden'}
              >
                {currentKitchen.showMoebelEK ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#1a1a1a] px-2 py-0.5 rounded-lg border border-slate-330 dark:border-darkBorder shadow-sm">
                <span className="text-[8px] font-black text-slate-700 dark:text-slate-300 uppercase">Möbel-Rabatt:</span>
                <div className="relative w-10 shrink-0">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={currentKitchen.rabattMoebel || ''}
                    onChange={(e) => updateField('rabattMoebel', e.target.value)}
                    className="bg-transparent border-b border-transparent focus:border-blue-500 outline-none font-mono text-xs text-center text-red-650 dark:text-red-400 w-full py-0.5 font-bold"
                    placeholder="0"
                  />
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-500">%</span>
                </div>
              </div>
            </div>
          </div>

          {currentKitchen.showMoebelEK && (
            <div className="mb-4">
              <label className="text-[9px] font-black text-slate-655 dark:text-slate-300 uppercase block mb-1">Möbel inkl. Elektro (EK Netto)</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={currentKitchen.ekMoebel || ''}
                  onChange={(e) => updateField('ekMoebel', e.target.value)}
                  className="input-field input-field-compact font-mono text-sm text-slate-900 dark:text-white"
                  placeholder="0,00"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">€</span>
              </div>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1.5 font-bold select-none">
                Wird im Hintergrund × <span className="font-bold text-slate-800 dark:text-slate-200">{moebelFactor}</span> gerechnet (abzgl. Rabatt):{' '}
                <span className="text-blue-500 font-mono-tabular font-bold">{formatMoney(vkMoebel)}</span>
              </p>
            </div>
          )}

          {/* SINK & APPLIANCES SCROLLABLE FORMS WITH DYNAMIC SORT, REPLICATE & SPEED ACTIONS */}
          {[
            { label: 'Allgemeine Elektrogeräte (Im Möbel-Preis enthalten)', type: 'geraete', phName: 'Hersteller & Modell...', phVal: 'Optional' },
            { label: 'Miele Geräte (Bezeichnung & VK Brutto)', type: 'miele', phName: 'Bezeichnung (z.B. Miele Backofen)...', phVal: 'VK Brutto', mieleRabatt: true },
            { label: 'Spüle (Im Möbel-Preis enthalten)', type: 'spuele', phName: 'Bezeichnung (z.B. Blanco Etagon)...', phVal: 'Optional' },
            { label: 'Wasseraufbereitung (Bezeichnung & VK Brutto)', type: 'wasser', phName: 'Bezeichnung (z.B. Quooker PRO3)...', phVal: 'VK Brutto' },
          ].map((block) => (
            <div key={block.label} className="mb-4 border-t border-slate-200 dark:border-darkBorder pt-4">
              <div className="flex justify-between items-center mb-2.5">
                <label className="text-[9px] font-black text-slate-655 dark:text-slate-300 uppercase">{block.label}</label>
                <div className="flex items-center gap-2">
                  {block.mieleRabatt && (
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#1a1a1a] px-2 py-0.5 rounded-lg border border-slate-330 dark:border-darkBorder">
                      <span className="text-[8px] font-black text-slate-700 dark:text-slate-300 uppercase">Miele-Rabatt:</span>
                      <div className="relative w-10 shrink-0">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={currentKitchen.rabattMiele || ''}
                          onChange={(e) => updateField('rabattMiele', e.target.value)}
                          className="bg-transparent border-b border-transparent focus:border-blue-500 outline-none font-mono text-xs text-center text-red-650 dark:text-red-400 w-full py-0.5 font-bold"
                          placeholder="0"
                        />
                        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-500">%</span>
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => addItem(block.type as any)}
                    className="bg-blue-50 dark:bg-darkBorder text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500/20 w-7 h-7 rounded-md flex items-center justify-center font-black pb-0.5 transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-sm"
                    title="Zeile hinzufügen"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                {(currentKitchen[block.type as keyof Kitchen] as KitchenItem[] || []).map((item, index, arr) => (
                  <div key={item.id} className="flex flex-row items-center gap-1.5 p-1 rounded-xl border border-transparent hover:border-slate-100 dark:hover:border-white/5 transition-all duration-200 w-full">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(block.type as any, item.id as any, 'name', e.target.value)}
                      className="input-field input-field-compact text-xs flex-1 min-w-0 text-slate-905 dark:text-white font-medium"
                      placeholder={block.phName}
                    />
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="relative w-24 sm:w-28 shrink-0">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={item.val}
                          onChange={(e) => updateItem(block.type as any, item.id as any, 'val', e.target.value)}
                          className="input-field input-field-compact font-mono text-center text-slate-905 dark:text-white px-2 pr-6"
                          placeholder={block.phVal}
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-500">€</span>
                      </div>
                      
                      {/* Zeile löschen */}
                      <div className="flex items-center shrink-0">
                        {arr.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeItem(block.type as any, item.id as any)}
                            className="w-7 h-7 flex items-center justify-center rounded-md bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white hover:scale-110 active:scale-90 transition-all cursor-pointer shadow-sm"
                            title="Zeile löschen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <div className="w-7 h-7" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {block.type === 'miele' && (
                <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1.5 font-bold text-right mr-2 select-none">
                  Summe Miele (abzgl. Rabatt):{' '}
                  <span className="text-blue-500 font-mono-tabular font-bold">{formatMoney(vkMiele)}</span>
                </p>
              )}
            </div>
          ))}

          <div className="mt-4 border-t border-slate-200 dark:border-darkBorder pt-4">
            <label className="text-[9px] font-black text-slate-655 dark:text-slate-300 uppercase block mb-1.5 font-bold select-none">Optionaler Hauspreis / Zielpreis (Überschreibt den Gesamt-VK)</label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={currentKitchen.hauspreis || ''}
                onChange={(e) => updateField('hauspreis', e.target.value)}
                className="input-field input-field-compact font-mono text-sm text-blue-500 font-bold placeholder:text-blue-500/40"
                placeholder="Glatter Endpreis (z.B. 14500)"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500 font-bold dropdown-trigger">€</span>
            </div>
          </div>
        </div>

        <div className="card p-4 relative overflow-hidden group/card hover:border-slate-300 dark:hover:border-slate-800 transition-all duration-300">
          <div className="flex justify-between items-center mb-3 border-b border-slate-200 dark:border-darkBorder pb-2">
            <h2 className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">3. Optionale Mehr-/Minderpreise</h2>
            <button
              type="button"
              onClick={() => addItem('mehrpreise')}
              className="bg-blue-50 dark:bg-darkBorder text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500/20 w-7 h-7 rounded-md flex items-center justify-center font-black pb-0.5 transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-sm"
              title="Aufpreis hinzufügen"
            >
              +
            </button>
          </div>
          <div className="space-y-1.5">
            {(currentKitchen.mehrpreise || []).map((item, index, arr) => (
              <div key={item.id} className="flex flex-row items-center gap-1.5 p-1 rounded-xl border border-transparent hover:border-slate-100 dark:hover:border-white/5 transition-all duration-200 w-full">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateItem('mehrpreise', item.id, 'name', e.target.value)}
                  className="input-field input-field-compact text-xs flex-1 min-w-0 text-slate-900 dark:text-white"
                  placeholder="Aufpreis Siemens Kochfeld..."
                />
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="relative w-24 sm:w-28 shrink-0">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={item.val}
                      onChange={(e) => updateItem('mehrpreise', item.id, 'val', e.target.value)}
                      className="input-field input-field-compact font-mono text-center text-slate-905 dark:text-white px-2 pr-6"
                      placeholder="Preis"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-500">€</span>
                  </div>
                  
                  {/* Zeile löschen */}
                  <div className="flex items-center shrink-0">
                    {arr.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeItem('mehrpreise', item.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-md bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white hover:scale-110 active:scale-90 transition-all cursor-pointer shadow-sm"
                        title="Zeile löschen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <div className="w-7 h-7" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {currentKitchen.showMoebelEK && (
            <p className="text-[10px] text-slate-600 dark:text-slate-450 mt-2 font-bold italic">💡 Diese Positionen fließen NICHT in den Endpreis ein. Sie werden auf dem PDF separat ausgewiesen.</p>
          )}
        </div>

        <div className="card p-4 relative overflow-hidden group/card hover:border-slate-300 dark:hover:border-slate-800 transition-all duration-300">
          <h2 className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest mb-3.5 border-b border-slate-200 dark:border-darkBorder pb-2">
            4. Angebotseinstellungen (PDF)
          </h2>

          <div className="mb-4">
            <label className="text-[9px] font-black text-slate-650 dark:text-slate-300 uppercase block mb-1.5 font-bold">Ebenso enthalten sind (Zubehör):</label>
            <div className="flex flex-wrap gap-1 mb-2">
              {[
                'Besteckeinsatz',
                'Mülltrennsystem',
                'LED-Beleuchtung',
                'Glaszargen in sämtlichen hohen Auszügen',
                'Anti-Rutschmatten in sämtlichen Schubkästen/Auszügen',
              ].map((txt) => (
                <button
                  key={txt}
                  type="button"
                  onClick={() => appendZubehoer(txt)}
                  className="bg-blue-50/70 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 border border-blue-200 dark:border-blue-500/20 px-2 py-1 rounded-lg text-[8px] font-extrabold hover:bg-blue-100 hover:scale-105 transition-all active:scale-95 cursor-pointer shadow-sm"
                >
                  + {txt.split(' ')[0]}
                </button>
              ))}
            </div>
            <textarea
              value={currentKitchen.zubehoer || ''}
              onChange={(e) => updateField('zubehoer', e.target.value)}
              className="input-field input-field-compact text-xs min-h-[80px] resize-y text-slate-900 dark:text-white"
              placeholder="Besteckeinsätze&#10;Abfallsystem&#10;LED-Beleuchtung"
            />
          </div>

          <div className="space-y-2">
            {[
              { id: 'opt-kuechentext', field: 'optKuechenText', title: 'Einleitungstext', desc: 'Persönliche Begrüßung ganz oben auf dem PDF.' },
              { id: 'opt-ballerina', field: 'optBallerina', title: 'Ballerina Qualitätstext', desc: 'Korpus, Rückwände, Belastbarkeit etc.' },
              { id: 'opt-anschluss', field: 'optAnschluss', title: '240,- EUR Anschluss-Service', desc: 'Hinweis auf separaten Monteur vor Ort.' },
              { id: 'opt-anschluss-rabatt', field: 'optAnschlussRabatt', title: 'Anschluss-Rabatt', desc: '"Damit Sie effektiv keinen Mehrpreis haben..."' },
              { id: 'opt-nachtext', field: 'optNachtext', title: 'Nachtext / Verabschiedung', desc: 'Schlusssatz ganz unten auf dem Dokument.' },
            ].map((opt) => (
              <label key={opt.id} className="flex items-start gap-2.5 cursor-pointer group select-none hover:bg-slate-50 dark:hover:bg-white/5 p-1.5 rounded-xl transition-all duration-200">
                <input
                  type="checkbox"
                  checked={!!currentKitchen[opt.field as keyof Kitchen]}
                  onChange={(e) => updateField(opt.field as keyof Kitchen, e.target.checked)}
                  className="w-4 h-4 rounded border-slate-350 dark:border-darkBorder checked:bg-blue-500 outline-none checked:border-blue-500 transition-all cursor-pointer mt-0.5"
                />
                <div>
                  <p className="text-xs font-black text-slate-800 dark:text-slate-100 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">{opt.title}</p>
                  <p className="text-[9px] text-slate-600 dark:text-slate-400 leading-normal">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* FIXED OFFERS SIDEBAR COMPONENT */}
      <div className="lg:col-span-2 lg:sticky lg:top-10 space-y-4">
        <div className="p-4 md:p-5 bg-black text-white rounded-2xl shadow-2xl border border-slate-900 transition-all duration-300 relative overflow-hidden group/card">
          
          {/* Der Glow-Hintergrundkreis */}
          <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full pointer-events-none opacity-60 sm:opacity-0 sm:group-hover/card:opacity-100 transition-opacity duration-500 bg-blue-500/25 blur-3xl z-0" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4 border-b border-slate-900 pb-3">
              {opt1 || opt2 ? (
                <button
                  type="button"
                  onClick={() => setActiveVersionTab(0)}
                  className={`text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors hover:text-white flex items-center gap-1.5 ${
                    activeVersionTab === 0 ? 'text-blue-400 font-bold' : 'text-slate-400'
                  }`}
                >
                  <span>Angebot</span>
                  {activeVersionTab === 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  )}
                </button>
              ) : (
                <h2 className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8] text-left">
                  Angebot
                </h2>
              )}

              {(opt1 || opt2) && (
                <div className="flex items-center gap-1.5">
                  {opt1 && (
                    <button
                      type="button"
                      onClick={() => setActiveVersionTab(1)}
                      className={`px-2 py-0.5 text-[9px] font-bold rounded-md transition-all cursor-pointer ${
                        activeVersionTab === 1
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-xs font-bold'
                          : 'bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10 border border-transparent'
                      }`}
                    >
                      Alternative 1
                    </button>
                  )}
                  {opt2 && (
                    <button
                      type="button"
                      onClick={() => setActiveVersionTab(2)}
                      className={`px-2 py-0.5 text-[9px] font-bold rounded-md transition-all cursor-pointer ${
                        activeVersionTab === 2
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-xs font-bold'
                          : 'bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10 border border-transparent'
                      }`}
                    >
                      Alternative 2
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 bg-white/5 rounded-xl border border-blue-600/30 text-center shadow-inner relative overflow-hidden mb-4 mt-2">
              <div className="absolute inset-0 bg-blue-500/5" />
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1 relative">Gesamt-VK (Brutto)</p>
              <p className="text-3xl font-black text-blue-400 tracking-tighter font-mono-tabular relative">
                <AnimatedNumber value={finalDisplayVK} formatter={formatMoney} />
              </p>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 text-center mb-4">
              <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-0.5 leading-relaxed">
                Darin enthaltene Lieferung & Montage (9,5%)
              </p>
              <p className="text-sm font-black text-emerald-400 font-mono-tabular">
                <AnimatedNumber value={proportionMontage} formatter={formatMoney} />
              </p>
            </div>

            <button
              type="button"
              onClick={onGeneratePDF}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-600/25 hover:-translate-y-0.5 hover:shadow-blue-500/10 active:scale-95 transition-all flex items-center justify-center gap-2 mb-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              PDF generieren
            </button>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                type="button"
                onClick={onGeneratePDFPreview}
                className="py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/25 hover:-translate-y-0.5 hover:shadow-indigo-500/10 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
              >
                <Eye className="w-4 h-4" />
                Vorschau
              </button>

              <button
                type="button"
                onClick={onSaveOffer}
                className="py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-all hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer text-center"
              >
                In Cloud speichern
              </button>
            </div>

            <button
              type="button"
              onClick={onResetKitchen}
              className="w-full py-2.5 flex items-center justify-center border border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer"
            >
              Kalkulation leeren
            </button>

            {/* EXCEL UPLOAD SLOT HAUPTAUFTRAG */}
            <div className="mt-4 pt-4 border-t border-slate-900 space-y-2.5">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-left flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
                Import
              </p>

              {/* 1 großes Uploadfenster für den Hauptauftrag */}
              <div
                onDragOver={handleDragOver}
                onDrop={(e) => handleSlotDrop(e, 0)}
                onClick={() => slot0InputRef.current?.click()}
                className="border-2 border-dashed border-blue-500/40 hover:border-blue-400 bg-blue-500/5 hover:bg-blue-500/10 rounded-xl p-3 text-center cursor-pointer transition-all group relative"
              >
                <input
                  type="file"
                  ref={slot0InputRef}
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      if (onImportCaratFiles) {
                        onImportCaratFiles([e.target.files[0]], 0);
                      } else {
                        onImportCaratXLSX(e.target.files[0]);
                      }
                    }
                  }}
                  className="hidden"
                  accept=".xlsx,.xls,.csv"
                />
                <UploadCloud className="w-5 h-5 text-blue-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[8px] font-black uppercase rounded tracking-wider border border-blue-500/30 inline-block mb-1">
                  Hauptauftrag
                </span>
                <p className="text-[10px] font-bold text-slate-200 leading-tight">
                  {kitchen.ekMoebel || kitchen.apName ? '✓ Hauptauftrag geladen' : 'Excel-Datei hier reinziehen'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SEPARATE AUFKLAPPBARE BOX FÜR PREISVERGLEICH */}
        {canUsePriceComparison && (
          <div className="p-3.5 bg-black text-white rounded-2xl shadow-2xl border border-slate-900 transition-all text-left space-y-3">
            {/* Collapsible Header */}
            <button
              type="button"
              onClick={() => setIsDiffBoxOpen(!isDiffBoxOpen)}
              className="w-full flex items-center justify-between group cursor-pointer text-left select-none"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-200">
                  Preisvergleich
                </h3>
                <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[8px] font-black uppercase rounded tracking-wider border border-amber-500/30">
                  BETA
                </span>
              </div>

              <div className="p-1 rounded-lg bg-slate-900 text-slate-400 group-hover:text-white transition-colors border border-slate-800">
                {isDiffBoxOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {/* Collapsible Content */}
            {isDiffBoxOpen && (
              <div className="pt-3 border-t border-slate-900 space-y-3.5 animate-in fade-in duration-200">
                {/* 2 Upload-Slots for Alternative 1 & 2 */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Slot 1 / Alternative 1 */}
                  <div
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleSlotDrop(e, 1)}
                    className="p-2.5 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500/50 rounded-xl transition-all relative text-center"
                  >
                    <input
                      type="file"
                      ref={slot1InputRef}
                      onChange={(e) => {
                        if (e.target.files?.length) {
                          if (onImportCaratFiles) {
                            onImportCaratFiles([e.target.files[0]], 1);
                          }
                        }
                      }}
                      className="hidden"
                      accept=".xlsx,.xls,.csv"
                    />
                    <div className="flex items-center justify-center mb-1">
                      <span className="text-[8px] font-black text-emerald-400 uppercase tracking-wider bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30">
                        Alternative 1
                      </span>
                    </div>

                    {opt1 ? (
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold text-slate-200 truncate" title={opt1.fileName}>
                          📄 {opt1.fileName}
                        </p>
                        <p className="text-[8px] font-mono text-emerald-400 font-bold">
                          {formatMoney(opt1.finalDisplayVK || opt1.totalCalculatedVK)}
                        </p>
                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60 mt-1.5 gap-1">
                          <button
                            type="button"
                            onClick={() => setActiveVersionTab(1)}
                            className={`flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded-md transition-all cursor-pointer ${
                              activeVersionTab === 1
                                ? 'bg-emerald-500/25 text-emerald-300 font-black border border-emerald-500/40 shadow-xs'
                                : 'bg-white/5 text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/15'
                            }`}
                            title={activeVersionTab === 1 ? 'Aktive Ansicht' : 'Alternative 1 ansehen'}
                          >
                            <Eye className="w-3 h-3" />
                            {activeVersionTab === 1 && <span>Aktiv</span>}
                          </button>
                          <div className="flex items-center gap-1">
                            {onSwapVersionWithBasis && (
                              <button
                                type="button"
                                onClick={() => onSwapVersionWithBasis(opt1.id)}
                                className="text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-white/5 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition-all cursor-pointer border border-transparent hover:border-blue-500/30"
                                title="Als Basis/Hauptauftrag übernehmen"
                              >
                                Basis
                              </button>
                            )}
                            {onRemoveVersionOption && (
                              <button
                                type="button"
                                onClick={() => onRemoveVersionOption(opt1.id)}
                                className="p-1 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/15 transition-all cursor-pointer"
                                title="Alternative 1 entfernen"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => slot1InputRef.current?.click()}
                        className="py-1 text-center cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        <Plus className="w-4 h-4 text-emerald-400/80 mx-auto" />
                      </div>
                    )}
                  </div>

                  {/* Slot 2 / Alternative 2 */}
                  <div
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleSlotDrop(e, 2)}
                    className="p-2.5 bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/30 hover:border-purple-500/50 rounded-xl transition-all relative text-center"
                  >
                    <input
                      type="file"
                      ref={slot2InputRef}
                      onChange={(e) => {
                        if (e.target.files?.length) {
                          if (onImportCaratFiles) {
                            onImportCaratFiles([e.target.files[0]], 2);
                          }
                        }
                      }}
                      className="hidden"
                      accept=".xlsx,.xls,.csv"
                    />
                    <div className="flex items-center justify-center mb-1">
                      <span className="text-[8px] font-black text-purple-400 uppercase tracking-wider bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/30">
                        Alternative 2
                      </span>
                    </div>

                    {opt2 ? (
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold text-slate-200 truncate" title={opt2.fileName}>
                          📄 {opt2.fileName}
                        </p>
                        <p className="text-[8px] font-mono text-purple-400 font-bold">
                          {formatMoney(opt2.finalDisplayVK || opt2.totalCalculatedVK)}
                        </p>
                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60 mt-1.5 gap-1">
                          <button
                            type="button"
                            onClick={() => setActiveVersionTab(2)}
                            className={`flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded-md transition-all cursor-pointer ${
                              activeVersionTab === 2
                                ? 'bg-purple-500/25 text-purple-300 font-black border border-purple-500/40 shadow-xs'
                                : 'bg-white/5 text-slate-400 hover:text-purple-300 hover:bg-purple-500/15'
                            }`}
                            title={activeVersionTab === 2 ? 'Aktive Ansicht' : 'Alternative 2 ansehen'}
                          >
                            <Eye className="w-3 h-3" />
                            {activeVersionTab === 2 && <span>Aktiv</span>}
                          </button>
                          <div className="flex items-center gap-1">
                            {onSwapVersionWithBasis && (
                              <button
                                type="button"
                                onClick={() => onSwapVersionWithBasis(opt2.id)}
                                className="text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-white/5 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition-all cursor-pointer border border-transparent hover:border-blue-500/30"
                                title="Als Basis/Hauptauftrag übernehmen"
                              >
                                Basis
                              </button>
                            )}
                            {onRemoveVersionOption && (
                              <button
                                type="button"
                                onClick={() => onRemoveVersionOption(opt2.id)}
                                className="p-1 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/15 transition-all cursor-pointer"
                                title="Alternative 2 entfernen"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => slot2InputRef.current?.click()}
                        className="py-1 text-center cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        <Plus className="w-4 h-4 text-purple-400/80 mx-auto" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Clean Differenz-Karten */}
                <div className="pt-2 border-t border-slate-900/80 space-y-2">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    Mehr- & Minderpreise (vs. Hauptauftrag)
                  </p>

                  {(kitchen.versionOptions || []).length > 0 ? (
                    <div className="space-y-3">
                      {(kitchen.versionOptions || []).map((opt) =>
                        renderDiffCard(opt, opt.slotIndex === 1 ? 'Alternative 1' : 'Alternative 2')
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-white/5 border border-dashed border-slate-800 rounded-xl text-center">
                      <p className="text-[9px] font-bold text-slate-400 mb-0.5">Keine Alternativ-Dateien geladen</p>
                      <p className="text-[8px] text-slate-500 leading-tight">
                        Ziehe in "Alternative 1" oder "Alternative 2" eine Excel-Datei rein, um Preisdifferenzen anzuzeigen.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
