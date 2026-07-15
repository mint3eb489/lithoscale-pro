import React, { useRef, useState } from 'react';
import { Kitchen, AppConfig, KitchenItem, UserProfile } from '../types';
import { Download, Trash2, Sparkles, UploadCloud, FileText, Maximize2, X, Eye, EyeOff } from 'lucide-react';
import { AnimatedNumber } from './AnimatedNumber';

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
  personalFactors?: {
    factor?: number;
    moebelFactor?: number;
  };
  usersList?: UserProfile[];
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
  personalFactors,
  usersList = [],
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const ekMoebel = parseVal(kitchen.ekMoebel);
  const rabattMoebel = parseVal(kitchen.rabattMoebel);
  const moebelFactor = personalFactors?.moebelFactor ?? config.moebelFactor ?? 2.0;
  const vkMoebel = ekMoebel * moebelFactor * (1 - rabattMoebel / 100);

  const vkStein = parseVal(kitchen.steinVK);

  let sumMieleBrutto = 0;
  (kitchen.miele || []).forEach((m) => (sumMieleBrutto += parseVal(m.val)));
  const rabattMiele = parseVal(kitchen.rabattMiele);
  const vkMiele = sumMieleBrutto * (1 - rabattMiele / 100);

  let vkWasser = 0;
  (kitchen.wasser || []).forEach((w) => (vkWasser += parseVal(w.val)));

  const totalCalculatedVK = vkMoebel + vkWasser + vkStein + vkMiele;
  const targetEndprice = parseVal(kitchen.hauspreis);
  const finalDisplayVK = targetEndprice > 0 ? targetEndprice : totalCalculatedVK;
  const proportionMontage = finalDisplayVK * 0.095;

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

  const updateField = (field: keyof Kitchen, val: any) => {
    // validations
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

    setKitchen((prev) => ({ ...prev, [field]: val }));
  };

  const updateItem = (type: 'geraete' | 'miele' | 'spuele' | 'wasser' | 'mehrpreise', id: number, field: 'name' | 'val', value: string) => {
    setKitchen((prev) => ({
      ...prev,
      [type]: (prev[type] || []).map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    }));
  };

  const removeItem = (type: 'geraete' | 'miele' | 'spuele' | 'wasser' | 'mehrpreise', id: number) => {
    setKitchen((prev) => ({
      ...prev,
      [type]: (prev[type] || []).filter((item) => item.id !== id),
    }));
  };

  const addItem = (type: 'geraete' | 'miele' | 'spuele' | 'wasser' | 'mehrpreise') => {
    setKitchen((prev) => ({
      ...prev,
      [type]: [...(prev[type] || []), { id: Date.now() + Math.random(), name: '', val: '' }],
    }));
  };

  const moveItem = (type: 'geraete' | 'miele' | 'spuele' | 'wasser' | 'mehrpreise', index: number, direction: 'up' | 'down') => {
    const list = [...(kitchen[type] || [])];
    if (direction === 'up' && index > 0) {
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
    } else if (direction === 'down' && index < list.length - 1) {
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
    }
    setKitchen((prev) => ({ ...prev, [type]: list }));
  };

  const duplicateItem = (type: 'geraete' | 'miele' | 'spuele' | 'wasser' | 'mehrpreise', item: KitchenItem) => {
    setKitchen((prev) => {
      const list = [...(prev[type] || [])];
      const index = list.findIndex(i => i.id === item.id);
      const newItem = {
        id: Date.now() + Math.random(),
        name: item.name ? `${item.name} (Kopie)` : '',
        val: item.val
      };
      if (index !== -1) {
        list.splice(index + 1, 0, newItem);
      } else {
        list.push(newItem);
      }
      return { ...prev, [type]: list };
    });
  };

  const clearItemFields = (type: 'geraete' | 'miele' | 'spuele' | 'wasser' | 'mehrpreise', id: number) => {
    setKitchen((prev) => ({
      ...prev,
      [type]: (prev[type] || []).map((item) => (item.id === id ? { ...item, name: '', val: '' } : item)),
    }));
  };

  const appendZubehoer = (text: string) => {
    let current = (kitchen.zubehoer || '').trim();
    let newText = current.length > 0 ? current + '\n' + text : text;
    updateField('zubehoer', newText);
  };

  // Drag and drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) {
      onImportCaratXLSX(e.dataTransfer.files[0]);
    }
  };

  return (
    <div id="tab-kitchen" className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-stretch pb-36 lg:pb-0">
      <div className="lg:col-span-3 space-y-3.5">
        <div className="card p-4 relative overflow-hidden group/card hover:border-blue-500/35 hover:shadow-xl transition-all duration-300">
          
          {/* Der Glow-Hintergrundkreis */}
          <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full pointer-events-none opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 bg-blue-500/15 dark:bg-blue-400/15 blur-3xl z-0" />

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-3.5 border-b border-slate-200 dark:border-darkBorder pb-2">
              <h2 className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">1. Projekt & Design</h2>
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
              <input
                type="text"
                value={kitchen.kunde || ''}
                onChange={(e) => updateField('kunde', e.target.value)}
                className="input-field input-field-compact text-xs text-slate-900 dark:text-white"
                placeholder="Name oder Kommissionsnummer"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-650 dark:text-slate-300 uppercase block mb-1">Berater</label>
              <select
                value={kitchen.beraterId || ''}
                onChange={(e) => updateField('beraterId', e.target.value)}
                className="input-field input-field-compact text-xs text-slate-800 dark:text-white cursor-pointer hover:border-slate-300 dark:hover:border-slate-700"
              >
                <option value="" className="text-slate-650 dark:text-slate-400 font-bold">-- Bitte wählen --</option>
                {(usersList && usersList.length > 0) ? (
                  [...usersList]
                    .sort((a, b) => {
                      const aIsEnrico = a.name?.toLowerCase().includes("enrico belmonte");
                      const bIsEnrico = b.name?.toLowerCase().includes("enrico belmonte");
                      if (aIsEnrico && !bIsEnrico) return -1;
                      if (!aIsEnrico && bIsEnrico) return 1;
                      return 0;
                    })
                    .map((u) => (
                      <option key={u.id} value={u.id} className="text-slate-900 dark:text-white">
                        {u.name}
                      </option>
                    ))
                ) : (
                  (config.beraterList || []).map((b) => (
                    <option key={b.id} value={b.id} className="text-slate-900 dark:text-white">
                      {b.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[9px] font-black text-slate-650 dark:text-slate-300 uppercase block mb-1">Front 1</label>
              <input
                type="text"
                value={kitchen.front1 || ''}
                onChange={(e) => updateField('front1', e.target.value)}
                className="input-field input-field-compact text-xs text-slate-900 dark:text-white"
                placeholder="Bezeichnung (z.B. Resopal Pro)"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-650 dark:text-slate-300 uppercase block mb-1">Front 2</label>
              <input
                type="text"
                value={kitchen.front2 || ''}
                onChange={(e) => updateField('front2', e.target.value)}
                className="input-field input-field-compact text-xs text-slate-900 dark:text-white"
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="text-[9px] font-black text-slate-650 dark:text-slate-300 uppercase block mb-1">Griffausführung / Griffleiste</label>
            <input
              type="text"
              value={kitchen.griff || ''}
              onChange={(e) => updateField('griff', e.target.value)}
              className="input-field input-field-compact text-xs text-slate-900 dark:text-white"
              placeholder="Ausführung (z.B. grifflos, Edelstahl)"
            />
          </div>

          <div className="border-t border-slate-200 dark:border-darkBorder pt-3.5">
            <div className="flex justify-between items-end mb-1.5">
              <label className="text-[9px] font-black text-slate-650 dark:text-slate-300 uppercase">Arbeitsplatte (Bezeichnung & Preis)</label>
              <button
                type="button"
                onClick={onPullSelectedStonePrice}
                className="text-[8px] font-black bg-slate-100 dark:bg-[#1e1e1e] text-slate-650 dark:text-slate-300 px-2 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-2.5 h-2.5 text-blue-500" />
                Aus Rechner übernehmen
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={kitchen.apName || ''}
                onChange={(e) => updateField('apName', e.target.value)}
                className="input-field input-field-compact text-xs flex-1 text-slate-900 dark:text-white font-bold"
                placeholder="z.B. Schichtstoff Eiche"
              />
              <div className="flex flex-col gap-1 w-32 shrink-0 font-bold">
                <div className="relative w-full">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={kitchen.steinVK || ''}
                    onChange={(e) => updateField('steinVK', e.target.value)}
                    className="input-field input-field-compact text-xs font-mono text-center px-1 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900 bg-blue-50/20"
                    placeholder="VK Brutto"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-blue-500">€</span>
                </div>
                {kitchen.showMoebelEK && (
                  <div className="relative w-full">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={kitchen.steinEK || ''}
                      onChange={(e) => updateField('steinEK', e.target.value)}
                      className="input-field input-field-compact text-[9px] py-1 font-mono text-center px-2 text-slate-650 dark:text-slate-400 border-dashed bg-slate-50 dark:bg-black border-slate-300 dark:border-darkBorder"
                      placeholder="EK Netto"
                      title="EK (Nur für interne Übersicht)"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-500">€</span>
                  </div>
                )}
              </div>
            </div>
            {kitchen.showMoebelEK && (
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
                onClick={() => updateField('showMoebelEK', !kitchen.showMoebelEK)}
                className="text-slate-650 hover:text-blue-500 dark:text-slate-400 dark:hover:text-blue-400 transition-all focus:outline-none flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 p-1 rounded-lg bg-slate-100 dark:bg-[#1a1a1a] border border-slate-330 dark:border-darkBorder shadow-sm"
                title={kitchen.showMoebelEK ? 'EK & Erklärungen verbergen' : 'EK & Erklärungen einblenden'}
              >
                {kitchen.showMoebelEK ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#1a1a1a] px-2 py-0.5 rounded-lg border border-slate-330 dark:border-darkBorder shadow-sm">
                <span className="text-[8px] font-black text-slate-700 dark:text-slate-300 uppercase">Möbel-Rabatt:</span>
                <div className="relative w-10 shrink-0">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={kitchen.rabattMoebel || ''}
                    onChange={(e) => updateField('rabattMoebel', e.target.value)}
                    className="bg-transparent border-b border-transparent focus:border-blue-500 outline-none font-mono text-xs text-center text-red-650 dark:text-red-400 w-full py-0.5 font-bold"
                    placeholder="0"
                  />
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-500">%</span>
                </div>
              </div>
            </div>
          </div>

          {kitchen.showMoebelEK && (
            <div className="mb-4">
              <label className="text-[9px] font-black text-slate-655 dark:text-slate-300 uppercase block mb-1">Möbel inkl. Elektro (EK Netto)</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={kitchen.ekMoebel || ''}
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
                          value={kitchen.rabattMiele || ''}
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
                {(kitchen[block.type as keyof Kitchen] as KitchenItem[] || []).map((item, index, arr) => (
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
                value={kitchen.hauspreis || ''}
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
            {(kitchen.mehrpreise || []).map((item, index, arr) => (
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
          {kitchen.showMoebelEK && (
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
              value={kitchen.zubehoer || ''}
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
                  checked={!!kitchen[opt.field as keyof Kitchen]}
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
      <div className="lg:col-span-2 space-y-4">
        <div className="p-4 md:p-5 bg-black text-white rounded-2xl shadow-2xl border border-slate-900 sticky top-10 transition-all duration-300 relative overflow-hidden group/card">
          
          {/* Der Glow-Hintergrundkreis */}
          <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full pointer-events-none opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 bg-blue-500/25 blur-3xl z-0" />

          <div className="relative z-10">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8] mb-4 border-b border-slate-900 pb-3 text-center">
              Angebot
            </h2>

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
              className="w-full py-3 flex items-center justify-center border border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer"
            >
              Kalkulation leeren
            </button>

            {/* DYNAMIC DROPZONE FILE IMPORTER */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/5 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5 transition-all duration-300 group"
            >
              <UploadCloud className="w-6 h-6 text-slate-500 group-hover:text-blue-500 transition-colors mb-1.5" />
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-500 transition-colors">
                CARAT-Import (Excel/CSV)
              </p>
              <p className="text-[8px] text-slate-500 mt-0.5">Hier reinziehen oder klicken</p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files?.length) {
                    onImportCaratXLSX(e.target.files[0]);
                  }
                }}
                className="hidden"
                accept=".xlsx,.xls,.csv"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
