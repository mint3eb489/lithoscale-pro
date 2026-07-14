import React, { useState, useEffect } from 'react';
import { Stone, AppConfig, Berater, UserProfile } from '../types';
import { Trash2, Plus, ArrowUpCircle, RefreshCw, Shield, User, Crown, ShieldAlert, X, Search, Cloud, Info } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface AdminTabProps {
  stones: Stone[];
  config: AppConfig;
  onUpdateConfig: (key: keyof AppConfig, value: any) => void;
  onAddStone: () => void;
  onUpdateStone: (id: string, field: keyof Stone, value: any) => void;
  onDeleteStone: (id: string) => void;
  onAddBerater: () => void;
  onUpdateBerater: (id: number, field: keyof Berater, value: any) => void;
  onRemoveBerater: (id: number) => void;
  onPushToCloud: () => void;
  onFactoryReset: () => void;
  usersList?: UserProfile[];
  onUpdateUserRole?: (uid: string, role: 'sys-admin' | 'admin' | 'berater') => void;
  onUpdateUserName?: (uid: string, name: string) => void;
  onAddPreRegisteredUser?: (name: string, email: string, role: 'sys-admin' | 'admin' | 'berater') => void;
  onDeleteUserProfile?: (uid: string) => void;
  onUpdateUserFactors?: (uid: string, factor: number | null, moebelFactor: number | null) => void;
  currentUserUid?: string;
  currentUserRole?: 'sys-admin' | 'admin' | 'berater';
  isAdminUnlocked?: boolean;
  onBackupMaterialsConfig?: () => void;
  onRestoreMaterialsConfig?: (data: any) => void;
  onBackupOffers?: () => void;
  onRestoreOffers?: (data: any) => void;
  offersCount?: number;
}

const configLabels: Record<string, string> = {
  factor: "VK-Faktor (z.B. 1.5)",
  measure: "Aufmaß (€)",
  delivery: "Montage (€)",
  gluing: "Verkleben (€)",
  natEdge: "Kante Natur (€/Lfm)",
  dekEdge: "Kante Dekton (€/Lfm)",
  natCutUnder: "UB-Ausschnitt Natur (€/Stk)",
  natCutFlush: "FB-Ausschnitt Natur (€/Stk)",
  natCutTop: "Auflage Natur (€/Stk)",
  dekCutUnder: "UB-Ausschnitt Dekton (€/Stk)",
  dekCutFlush: "FB-Ausschnitt Dekton (€/Stk)",
  dekCutTop: "Auflage Dekton (€/Stk)",
  notch: "Ausklinkung (€/Stk)",
  hole: "Bohrung (€/Stk)",
  miter: "Gehrung (€/Lfm)",
  adminPass: "Admin Passwort",
  moebelFactor: "Möbel-Faktor (VK)"
};

interface UserFactorInputProps {
  value?: number | null;
  placeholder: string;
  disabled?: boolean;
  onSave: (val: number | null) => void;
}

const UserFactorInput: React.FC<UserFactorInputProps> = ({
  value,
  placeholder,
  disabled,
  onSave,
}) => {
  const [localVal, setLocalVal] = useState<string>('');

  // Synchronize local value with incoming value from parent, but only if the input is not currently active
  useEffect(() => {
    if (value !== undefined && value !== null) {
      setLocalVal(String(value).replace('.', ','));
    } else {
      setLocalVal('');
    }
  }, [value]);

  const handleBlur = () => {
    const valStr = localVal.replace(',', '.').trim();
    const parsed = valStr === '' ? null : parseFloat(valStr);
    onSave(parsed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      disabled={disabled}
      placeholder={placeholder}
      value={localVal}
      onChange={(e) => {
        // Allow digits, commas, and dots
        const cleaned = e.target.value.replace(/[^0-9.,]/g, '');
        setLocalVal(cleaned);
      }}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="w-16 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded px-1.5 py-0.5 text-[10px] font-mono text-slate-800 dark:text-slate-100 focus:border-blue-555 outline-none"
    />
  );
};

export const AdminTab: React.FC<AdminTabProps> = ({
  stones,
  config,
  onUpdateConfig,
  onAddStone,
  onUpdateStone,
  onDeleteStone,
  onAddBerater,
  onUpdateBerater,
  onRemoveBerater,
  onPushToCloud,
  onFactoryReset,
  usersList = [],
  onUpdateUserRole,
  onUpdateUserName,
  onAddPreRegisteredUser,
  onDeleteUserProfile,
  onUpdateUserFactors,
  currentUserUid,
  currentUserRole,
  isAdminUnlocked,
  onBackupMaterialsConfig,
  onRestoreMaterialsConfig,
  onBackupOffers,
  onRestoreOffers,
  offersCount,
}) => {
  const isSysAdmin = currentUserRole === 'sys-admin' || isAdminUnlocked;

  const [activeAdminTab, setActiveAdminTab] = useState<'admin-litho' | 'admin-kitchen' | 'admin-import' | 'admin-users'>(
    isSysAdmin ? 'admin-litho' : 'admin-users'
  );
  
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'sys-admin' | 'admin' | 'berater'>('berater');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  const [stoneSearch, setStoneSearch] = useState('');
  const [stoneFilter, setStoneFilter] = useState<'all' | 'dekton' | 'natur'>('all');

  const filteredStones = stones.filter((s) => {
    if (stoneSearch.trim() !== '') {
      if (!s.name.toLowerCase().includes(stoneSearch.toLowerCase())) {
        return false;
      }
    }
    const isDek = s.isDekton === true || s.isDekton === 'true';
    if (stoneFilter === 'dekton' && !isDek) return false;
    if (stoneFilter === 'natur' && isDek) return false;
    return true;
  });

  const handleAddUserSubmit = () => {
    if (!newUserName.trim() || !newUserEmail.trim()) {
      alert('Bitte fülle alle Felder aus.');
      return;
    }
    if (onAddPreRegisteredUser) {
      onAddPreRegisteredUser(newUserName.trim(), newUserEmail.trim(), newUserRole);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserRole('berater');
      setIsAddUserOpen(false);
    }
  };

  const keysToDisplay = Object.keys(config).filter(
    (k) => k !== 'stats' && !k.startsWith('pdf') && k !== 'beraterList' && !k.startsWith('import')
  ) as Array<keyof AppConfig>;

  return (
    <div id="tab-admin" className="space-y-6 pb-20">
      <div className="card no-glow !overflow-visible p-6 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-darkBorder rounded-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-darkBorder pb-4 gap-4">
          <div>
            <h2 className="text-lg font-black text-blue-600 flex items-center gap-2">
              <Cloud className="w-5 h-5 text-blue-500" />
              <span>Cloud-Management & Backup-Zentrale</span>
              <div className="relative group inline-block">
                <Info className="w-4 h-4 text-slate-400 hover:text-blue-500 cursor-pointer transition-colors" />
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 md:w-80 p-4 bg-slate-950 dark:bg-zinc-900 text-white rounded-xl shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50 border border-slate-800 dark:border-zinc-800 text-left font-normal normal-case tracking-normal">
                  <div className="font-bold text-blue-400 text-xs mb-2 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-400" />
                    Wie funktioniert das Backup?
                  </div>
                  <div className="space-y-2 text-[11px] text-slate-300 leading-relaxed">
                    <div>
                      <strong className="text-white">1. Backup erstellen:</strong><br />
                      Klicken Sie auf den gewünschten Sichern-Knopf. Eine <code className="bg-slate-900 px-1 py-0.5 rounded text-blue-300">.json</code>-Datei wird auf Ihren Computer heruntergeladen.
                    </div>
                    <div>
                      <strong className="text-white">2. Einspielen (Wiederherstellen):</strong><br />
                      Klicken Sie auf "Einspielen" und wählen Sie die zuvor gesicherte Datei aus. Die Daten werden sofort in die App geladen.
                    </div>
                    <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-slate-200 mt-1">
                      <strong className="text-blue-300">Wichtig bei Material-Backup:</strong><br />
                      Nach dem Laden eines Material-Backups müssen Sie oben rechts auf <span className="text-blue-400 font-bold">UPLOAD CLOUD</span> klicken, um die Änderungen live in der Cloud für alle Berater zu aktivieren!
                    </div>
                  </div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-950 dark:border-b-zinc-900"></div>
                </div>
              </div>
            </h2>
            <p className="text-xs text-slate-500">Kataloge, Preiskonfigurationen und Angebotsarchive zentral sichern und wiederherstellen.</p>
          </div>
          <button
            onClick={onPushToCloud}
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold text-xs shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 self-start md:self-auto"
          >
            <ArrowUpCircle className="w-4 h-4" />
            UPLOAD CLOUD
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Section 1: Material-Katalog & Parameter */}
          <div className="p-4 bg-white dark:bg-black rounded-xl border border-slate-200 dark:border-darkBorder flex flex-col justify-between space-y-3">
            <div>
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Material-Katalog & Parameter</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Sichert alle Materialien ({stones.length} Einträge), Einkaufspreise, Bilder sowie alle globalen Aufmaß-, Montage- und Bearbeitungsparameter.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onBackupMaterialsConfig}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-white py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1"
              >
                Katalog Sichern
              </button>
              
              <label className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-white py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer text-center">
                <span>Einspielen</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        try {
                          const json = JSON.parse(event.target?.result as string);
                          if (onRestoreMaterialsConfig) {
                            onRestoreMaterialsConfig(json);
                          }
                        } catch (err) {
                          alert('Ungültige JSON-Datei.');
                        }
                      };
                      reader.readAsText(file);
                      e.target.value = ''; // Reset file input
                    }
                  }}
                />
              </label>
            </div>
          </div>

          {/* Section 2: Cloud-Angebotsarchiv */}
          <div className="p-4 bg-white dark:bg-black rounded-xl border border-slate-200 dark:border-darkBorder flex flex-col justify-between space-y-3">
            <div>
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Cloud-Angebotsarchiv</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Sichert das komplette Cloud-Archiv ({offersCount || 0} Angebote) inklusive Versionierungen, Ordnerstrukturen, Artikellisten und Kundendaten.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onBackupOffers}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-white py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1"
              >
                Archiv Sichern
              </button>
              
              <label className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-white py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer text-center">
                <span>Einspielen</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        try {
                          const json = JSON.parse(event.target?.result as string);
                          if (onRestoreOffers) {
                            onRestoreOffers(json);
                          }
                        } catch (err) {
                          alert('Ungültige JSON-Datei.');
                        }
                      };
                      reader.readAsText(file);
                      e.target.value = ''; // Reset file input
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex bg-white dark:bg-[#121212] p-1 rounded-2xl border border-slate-200 dark:border-darkBorder shadow-sm w-full md:w-auto overflow-x-auto">
        {isSysAdmin && (
          <>
            <button
              onClick={() => setActiveAdminTab('admin-litho')}
              className={`tab-btn px-4 py-2.5 font-bold text-[10px] uppercase tracking-wider rounded-xl flex-1 text-center whitespace-nowrap transition-all ${
                activeAdminTab === 'admin-litho'
                  ? 'bg-[#1a1a1a] text-white dark:bg-white dark:text-black shadow-md'
                  : 'text-slate-505 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Parameter
            </button>
            <button
              onClick={() => setActiveAdminTab('admin-kitchen')}
              className={`tab-btn px-4 py-2.5 font-bold text-[10px] uppercase tracking-wider rounded-xl flex-1 text-center whitespace-nowrap transition-all ${
                activeAdminTab === 'admin-kitchen'
                  ? 'bg-[#1a1a1a] text-white dark:bg-white dark:text-black shadow-md'
                  : 'text-slate-505 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <span className="hidden md:inline">Küchen-Texte</span>
              <span className="inline md:hidden">Küchen-TXT</span>
            </button>
            <button
              onClick={() => setActiveAdminTab('admin-import')}
              className={`tab-btn px-4 py-2.5 font-bold text-[10px] uppercase tracking-wider rounded-xl flex-1 text-center whitespace-nowrap transition-all ${
                activeAdminTab === 'admin-import'
                  ? 'bg-[#1a1a1a] text-white dark:bg-white dark:text-black shadow-md'
                  : 'text-slate-505 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <span className="hidden md:inline">CARAT Import</span>
              <span className="inline md:hidden">Import</span>
            </button>
          </>
        )}
        <button
          onClick={() => setActiveAdminTab('admin-users')}
          className={`tab-btn px-4 py-2.5 font-bold text-[10px] uppercase tracking-wider rounded-xl flex-1 text-center whitespace-nowrap transition-all ${
            activeAdminTab === 'admin-users'
              ? 'bg-[#1a1a1a] text-white dark:bg-white dark:text-black shadow-md'
              : 'text-slate-505 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <span className="hidden md:inline">Benutzerverwaltung</span>
          <span className="inline md:hidden">Verwaltung</span>
        </button>
      </div>

      {activeAdminTab === 'admin-litho' && (
        <div id="admin-litho" className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <div className="card p-6 h-[650px] flex flex-col">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Preis-Parameter</h3>
            <div className="space-y-4 flex-1 overflow-y-auto pr-2">
              {keysToDisplay.map((k) => (
                <div key={k}>
                  <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">
                    {configLabels[k] || String(k)}
                  </label>
                  <input
                    type="text"
                    value={config[k] as string}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (k === 'adminPass') {
                        onUpdateConfig(k, raw);
                      } else {
                        onUpdateConfig(k, parseFloat(raw.replace(',', '.')) || 0);
                      }
                    }}
                    className="input-field input-field-compact text-xs font-mono"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6 h-[650px] flex flex-col">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Material-Katalog</h3>
            
            <div className="space-y-3 mb-4 shrink-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Material suchen..."
                  value={stoneSearch}
                  onChange={(e) => setStoneSearch(e.target.value)}
                  className="input-field input-field-compact text-xs pl-8 w-full bg-slate-50 dark:bg-black"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
              
              <div className="flex bg-slate-100 dark:bg-black p-1 rounded-xl border border-slate-200 dark:border-darkBorder">
                <button
                  onClick={() => setStoneFilter('all')}
                  className={`flex-1 text-center py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${
                    stoneFilter === 'all'
                      ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm font-black'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  Alle ({stones.length})
                </button>
                <button
                  onClick={() => setStoneFilter('natur')}
                  className={`flex-1 text-center py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${
                    stoneFilter === 'natur'
                      ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm font-black'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  Natur ({stones.filter(s => !(s.isDekton === true || s.isDekton === 'true')).length})
                </button>
                <button
                  onClick={() => setStoneFilter('dekton')}
                  className={`flex-1 text-center py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${
                    stoneFilter === 'dekton'
                      ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm font-black'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  Dekton ({stones.filter(s => (s.isDekton === true || s.isDekton === 'true')).length})
                </button>
              </div>

              <button
                onClick={onAddStone}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Material hinzufügen
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto flex-1 pr-2">
              {filteredStones.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Keine Materialien gefunden.
                </div>
              ) : (
                filteredStones.map((s) => {
                  const hasImage = s.image && s.image.trim() !== '';
                  const imageUrl = hasImage
                    ? (s.image.startsWith('http') || s.image.startsWith('data:') ? s.image : `images/${s.image}`)
                    : '';
                  return (
                    <div
                      key={s.id}
                      className="p-3 bg-slate-50 dark:bg-black rounded-xl border border-slate-200 dark:border-darkBorder flex items-center gap-3 transition-all hover:border-slate-300 dark:hover:border-slate-700 min-w-0 overflow-hidden"
                    >
                      {/* Mini-Thumbnail Preview */}
                      <div className="w-10 h-10 rounded-lg border border-slate-200 dark:border-darkBorder overflow-hidden bg-white dark:bg-zinc-900 shrink-0 flex items-center justify-center relative group/admin-thumb">
                        {hasImage ? (
                          <img
                            src={imageUrl}
                            alt={s.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback on image load error
                              e.currentTarget.style.display = 'none';
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                const placeholder = parent.querySelector('.thumb-fallback');
                                if (placeholder) placeholder.classList.remove('hidden');
                              }
                            }}
                          />
                        ) : null}
                        <div className={`thumb-fallback text-[7px] font-black uppercase text-slate-400 text-center leading-tight ${hasImage ? 'hidden' : ''}`}>
                          KEIN<br />BILD
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col gap-2">
                        <div className="flex gap-2 min-w-0 items-center justify-between">
                          <input
                            value={s.name}
                            onChange={(e) => onUpdateStone(s.id, 'name', e.target.value)}
                            className="flex-1 min-w-0 bg-transparent font-bold outline-none text-xs md:text-sm px-1 py-0.5 border-b border-transparent focus:border-blue-500 text-slate-900 dark:text-white"
                            placeholder="Stein Name"
                          />
                          <input
                            value={s.image || ''}
                            onChange={(e) => onUpdateStone(s.id, 'image', e.target.value)}
                            className="w-20 md:w-28 min-w-0 bg-transparent outline-none text-[10px] font-mono text-blue-500 px-1 py-0.5 border-b border-transparent focus:border-blue-500 text-right"
                            placeholder="bild.jpg"
                          />
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase">EK €</span>
                            <input
                              type="number"
                              value={s.price}
                              onChange={(e) => onUpdateStone(s.id, 'price', parseFloat(e.target.value) || 0)}
                              className="bg-white dark:bg-darkCard w-16 md:w-20 text-center font-mono border border-slate-200 dark:border-[#262626] rounded-lg p-1 text-[11px] focus:border-blue-500 outline-none text-slate-900 dark:text-white"
                            />
                          </div>
                          
                          <button
                            onClick={() => onUpdateStone(s.id, 'isDekton', !s.isDekton)}
                            className={`text-[8px] font-black px-2 py-1.5 rounded-lg uppercase transition-all w-20 md:w-24 shrink-0 active:scale-95 text-white ${
                              (s.isDekton === true || s.isDekton === 'true') ? 'bg-red-500' : 'bg-emerald-500'
                            }`}
                          >
                            {(s.isDekton === true || s.isDekton === 'true') ? 'Dekton' : 'Natur'}
                          </button>
                          
                          <button
                            onClick={() => onDeleteStone(s.id)}
                            className="text-red-500 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors ml-auto shrink-0 flex items-center justify-center"
                            title="Löschen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {activeAdminTab === 'admin-kitchen' && (
        <div id="admin-kitchen" className="grid grid-cols-1 gap-6 items-stretch">
          <div className="card p-6 space-y-6">
            <div>
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Standard-Texte für das Angebot (PDF)</h3>
              <p className="text-[9px] text-blue-500 mb-4 font-bold">Tipp: HTML-Tags wie &lt;b&gt;fett&lt;/b&gt;, &lt;i&gt;kursiv&lt;/i&gt; werden unterstützt.</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">PDF Logo (URL / Base64 / Dateiname)</label>
                <input
                  type="text"
                  value={config.pdfLogo || ''}
                  onChange={(e) => onUpdateConfig('pdfLogo', e.target.value)}
                  className="input-field input-field-compact text-xs font-mono"
                  placeholder="logo.png oder https://..."
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Küchen-Einleitungstext</label>
                <textarea
                  value={config.pdfKuechenText || ''}
                  onChange={(e) => onUpdateConfig('pdfKuechenText', e.target.value)}
                  className="input-field input-field-compact text-xs min-h-[80px] resize-y"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Ballerina Qualitätstext</label>
                <textarea
                  value={config.pdfBallerinaText || ''}
                  onChange={(e) => onUpdateConfig('pdfBallerinaText', e.target.value)}
                  className="input-field input-field-compact text-xs min-h-[100px] resize-y"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Anschluss-Service Text (240,- EUR)</label>
                <textarea
                  value={config.pdfAnschlussText || ''}
                  onChange={(e) => onUpdateConfig('pdfAnschlussText', e.target.value)}
                  className="input-field input-field-compact text-xs min-h-[60px] resize-y"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Anschluss-Rabatt Text</label>
                <textarea
                  value={config.pdfAnschlussRabattText || ''}
                  onChange={(e) => onUpdateConfig('pdfAnschlussRabattText', e.target.value)}
                  className="input-field input-field-compact text-xs min-h-[60px] resize-y"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Nachtext / Verabschiedung</label>
                <textarea
                  value={config.pdfNachtext || ''}
                  onChange={(e) => onUpdateConfig('pdfNachtext', e.target.value)}
                  className="input-field input-field-compact text-xs min-h-[60px] resize-y"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Fußzeile (Firmenangaben)</label>
                <textarea
                  value={config.pdfFooter || ''}
                  onChange={(e) => onUpdateConfig('pdfFooter', e.target.value)}
                  className="input-field input-field-compact text-xs min-h-[60px] resize-y"
                />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Berater-Team</h3>
            <div className="space-y-3">
              {(config.beraterList || []).map((b) => (
                <div
                  key={b.id}
                  className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-slate-50 dark:bg-black rounded-xl border dark:border-darkBorder group transition-all hover:border-slate-300 dark:hover:border-slate-700"
                >
                  <input
                    value={b.name}
                    onChange={(e) => onUpdateBerater(b.id, 'name', e.target.value)}
                    className="input-field input-field-compact text-xs flex-1"
                    placeholder="Name"
                  />
                  <input
                    value={b.email}
                    onChange={(e) => onUpdateBerater(b.id, 'email', e.target.value)}
                    className="input-field input-field-compact text-xs flex-1"
                    placeholder="E-Mail"
                  />
                  <input
                    value={b.phone}
                    onChange={(e) => onUpdateBerater(b.id, 'phone', e.target.value)}
                    className="input-field input-field-compact text-xs flex-1"
                    placeholder="Telefon"
                  />
                  <button
                    onClick={() => onRemoveBerater(b.id)}
                    className="text-red-500 hover:text-red-650 p-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            
            <button
              onClick={onAddBerater}
              className="mt-4 bg-slate-100 dark:bg-darkBorder text-slate-600 dark:text-slate-300 hover:text-blue-500 dark:hover:text-blue-400 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Berater hinzufügen
            </button>
          </div>
        </div>
      )}

      {activeAdminTab === 'admin-import' && (
        <div id="admin-import" className="grid grid-cols-1 gap-6 items-stretch">
          <div className="card p-6 space-y-5">
            <div>
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2">Regeln für den CARAT-Import (Excel/CSV)</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Trage hier kommagetrennt die Katalog- oder Herstellernamen ein, nach denen in der Spalte gesucht werden soll (z. B. <b>bosch, neff</b>).
                Groß-/Kleinschreibung wird dabei automatisch ignoriert. Alle Zeilen, die auf <b>keine</b> der untenstehenden Regeln zutreffen, fließen automatisch addiert in den Möbel-EK.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Küchenmöbel (Kataloge)</label>
                <input
                  type="text"
                  value={config.importMoebel || ''}
                  onChange={(e) => onUpdateConfig('importMoebel', e.target.value)}
                  className="input-field input-field-compact text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Miele-Geräte (Zieht VK-Preis)</label>
                <input
                  type="text"
                  value={config.importMiele || ''}
                  onChange={(e) => onUpdateConfig('importMiele', e.target.value)}
                  className="input-field input-field-compact text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Spülen (Zieht keinen Preis)</label>
                <input
                  type="text"
                  value={config.importSpuele || ''}
                  onChange={(e) => onUpdateConfig('importSpuele', e.target.value)}
                  className="input-field input-field-compact text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Blanco Choice Art.-Nr. 1 (Ausnahme 3000€)</label>
                <input
                  type="text"
                  value={config.importBlancoChoiceArt1 || ''}
                  onChange={(e) => onUpdateConfig('importBlancoChoiceArt1', e.target.value)}
                  className="input-field input-field-compact text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Blanco Choice Art.-Nr. 2 (Ausnahme 3000€)</label>
                <input
                  type="text"
                  value={config.importBlancoChoiceArt2 || ''}
                  onChange={(e) => onUpdateConfig('importBlancoChoiceArt2', e.target.value)}
                  className="input-field input-field-compact text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Wasseraufbereitung (Setzt VK auf 3000,- €)</label>
                <input
                  type="text"
                  value={config.importWasser || ''}
                  onChange={(e) => onUpdateConfig('importWasser', e.target.value)}
                  className="input-field input-field-compact text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Allgemeine Elektrogeräte (Listet Geräte ohne Preis auf)</label>
                <input
                  type="text"
                  value={config.importGeraete || ''}
                  onChange={(e) => onUpdateConfig('importGeraete', e.target.value)}
                  className="input-field input-field-compact text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Arbeitsplatte / Naturstein (Zieht EK & VK Preis)</label>
                <input
                  type="text"
                  value={config.importStein || ''}
                  onChange={(e) => onUpdateConfig('importStein', e.target.value)}
                  className="input-field input-field-compact text-xs font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeAdminTab === 'admin-users' && (
        <div id="admin-users" className="space-y-6">
          
          {/* List of Registered Users - Takes Full Width */}
          <div className="card p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-zinc-800 pb-4">
              <div>
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.15em] mb-1">Benutzer & Rechteverwaltung</h3>
                <p className="text-[10px] text-slate-555">Verwalte die Rollen, Namen und individuellen Faktoren der registrierten Benutzer.</p>
              </div>
              <button
                onClick={() => setIsAddUserOpen(true)}
                className="bg-blue-600 hover:bg-blue-550 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 active:scale-95 transition-all flex items-center justify-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Benutzer hinzufügen
              </button>
            </div>

            <div className="space-y-4">
              {(usersList || []).length === 0 ? (
                <div className="text-center py-8 text-slate-405 text-xs">
                  Keine Benutzer registriert.
                </div>
              ) : (
                (usersList || []).map((u) => {
                  const isSelf = u.id === currentUserUid;
                  const isRowSysAdmin = u.role === 'sys-admin';
                  const cannotEdit = !isSysAdmin && isRowSysAdmin;

                  return (
                    <div
                      key={u.id}
                      className="p-4 bg-slate-50 dark:bg-[#0c0c0c] rounded-2xl border border-slate-200 dark:border-darkBorder flex flex-col gap-4 transition-all hover:border-slate-300 dark:hover:border-zinc-800"
                    >
                      {/* Top Row: User Details + Role Dropdown + Delete */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              type="text"
                              value={u.name}
                              disabled={cannotEdit}
                              onChange={(e) => onUpdateUserName && onUpdateUserName(u.id, e.target.value)}
                              className="bg-transparent font-bold text-xs border-b border-transparent focus:border-blue-555 outline-none text-slate-905 dark:text-white disabled:opacity-80"
                            />
                            {isSelf && (
                              <span className="text-[8px] bg-blue-100 dark:bg-blue-900/40 text-blue-555 dark:text-blue-405 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                Ich
                              </span>
                            )}
                            
                            {/* Role Badge */}
                            {u.role === 'sys-admin' ? (
                              <span className="flex items-center gap-1 text-[8px] bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/40 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                <Crown className="w-2.5 h-2.5" />
                                Sys-Admin
                              </span>
                            ) : u.role === 'admin' ? (
                              <span className="flex items-center gap-1 text-[8px] bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/40 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                <ShieldAlert className="w-2.5 h-2.5" />
                                Admin
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[8px] bg-slate-100 dark:bg-zinc-850 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-zinc-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                <User className="w-2.5 h-2.5" />
                                Berater
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-555 font-mono">
                            {u.email}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] text-slate-400 font-bold uppercase">Rolle ändern:</span>
                            <select
                              value={u.role}
                              disabled={isSelf || cannotEdit}
                              onChange={(e) => onUpdateUserRole && onUpdateUserRole(u.id, e.target.value as 'sys-admin' | 'admin' | 'berater')}
                              className="bg-white dark:bg-darkCard border border-slate-200 dark:border-darkBorder rounded-lg p-1 text-[10px] font-bold text-slate-555 dark:text-slate-100 outline-none focus:border-blue-555 disabled:opacity-55 cursor-pointer"
                            >
                              <option value="berater">Berater</option>
                              <option value="admin">Admin</option>
                              {isSysAdmin && <option value="sys-admin">Sys-Admin</option>}
                            </select>
                          </div>

                          <button
                            onClick={() => !isSelf && onDeleteUserProfile && onDeleteUserProfile(u.id)}
                            disabled={isSelf || cannotEdit}
                            className="text-red-555 hover:text-red-505 p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-555/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                            title="Benutzer löschen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Bottom Section: Individual Factors Settings */}
                      <div className="pt-3 border-t border-slate-200 dark:border-zinc-800/60 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
                        <div className="text-[9px] text-slate-400 font-black uppercase tracking-wider">
                          Individuelle Preis-Faktoren (Je Benutzer)
                        </div>
                        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">Stein VK-Faktor:</span>
                            <UserFactorInput
                              value={u.customFactors?.factor}
                              placeholder={String(config.factor)}
                              disabled={cannotEdit}
                              onSave={(parsed) => {
                                onUpdateUserFactors && onUpdateUserFactors(u.id, parsed, u.customFactors?.moebelFactor ?? null);
                              }}
                            />
                            <span className="text-[9px] text-slate-400">
                              (Standard: {config.factor})
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">Möbel-Faktor:</span>
                            <UserFactorInput
                              value={u.customFactors?.moebelFactor}
                              placeholder={String(config.moebelFactor || 2.0)}
                              disabled={cannotEdit}
                              onSave={(parsed) => {
                                onUpdateUserFactors && onUpdateUserFactors(u.id, u.customFactors?.factor ?? null, parsed);
                              }}
                            />
                            <span className="text-[9px] text-slate-400">
                              (Standard: {config.moebelFactor || 2.0})
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Sliding Modal for Adding Users */}
          <AnimatePresence>
            {isAddUserOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsAddUserOpen(false)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-xs"
                />
                
                {/* Modal Content */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="bg-white dark:bg-darkCard border border-slate-200 dark:border-darkBorder rounded-3xl w-full max-w-md p-6 relative shadow-2xl z-10 space-y-4"
                >
                  <button
                    onClick={() => setIsAddUserOpen(false)}
                    className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-850 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div>
                    <h3 className="text-sm font-black uppercase text-slate-800 dark:text-white tracking-wider mb-1">Neuen Benutzer anlegen</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Registriere ein neues Teammitglied vorab mit Name, E-Mail und Berechtigung.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase block mb-1">Name</label>
                      <input
                        type="text"
                        placeholder="z.B. Thomas Schmidt"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        className="input-field text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-850"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase block mb-1">E-Mail-Adresse</label>
                      <input
                        type="email"
                        placeholder="z.B. t.schmidt@firma.de"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        className="input-field text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-850"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase block mb-1">Rolle</label>
                      <select
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value as 'sys-admin' | 'admin' | 'berater')}
                        className="input-field text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-850 cursor-pointer"
                      >
                        <option value="berater">Berater (Nur eigene Angebote)</option>
                        <option value="admin">Admin (Alle Angebote & Benutzerverwaltung)</option>
                        {isSysAdmin && <option value="sys-admin">Sys-Admin (Vollzugriff + alle Einstellungen)</option>}
                      </select>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleAddUserSubmit}
                        className="w-full bg-blue-600 hover:bg-blue-550 text-white py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        Benutzer anlegen
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </div>
      )}
    </div>
  );
};
