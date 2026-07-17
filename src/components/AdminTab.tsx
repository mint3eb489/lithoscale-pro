import React, { useState, useEffect } from 'react';
import { Stone, AppConfig, Berater, UserProfile } from '../types';
import { Trash2, Plus, ArrowUpCircle, RefreshCw, Shield, User, Crown, ShieldAlert, X, Search, Cloud, Info, FileSpreadsheet, Cpu, Droplets, Layers, Sparkles, HelpCircle, ArrowRight, ArrowDown } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface AdminTabProps {
  stones: Stone[];
  config: AppConfig;
  onUpdateConfig: (key: keyof AppConfig, value: any) => void;
  onAddStone: () => void;
  onUpdateStone: (id: string, field: keyof Stone, value: any) => void;
  onDeleteStone: (id: string) => void;
  onPushToCloud: () => void;
  onFactoryReset: () => void;
  usersList?: UserProfile[];
  onUpdateUserRole?: (uid: string, role: 'sys-admin' | 'admin' | 'berater') => void;
  onUpdateUserName?: (uid: string, name: string) => void;
  onUpdateUserEmail?: (uid: string, email: string) => void;
  onUpdateUserPhone?: (uid: string, phone: string) => void;
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
  natNotch: "Ausklinkung Natur (€/Stk)",
  dekNotch: "Ausklinkung Dekton (€/Stk)",
  natPflegeset: "Pflegeset Natur (€/Stk)",
  dekReinigungsmittel: "Reinigungsmittel Dekton (€/Stk)",
  hole: "Bohrung (€/Stk)",
  miter: "Gehrung (€/Lfm)",
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

interface ConfigInputProps {
  configKey: keyof AppConfig;
  value: any;
  label: string;
  suffix?: string;
  icon?: React.ReactNode;
  onUpdate: (key: keyof AppConfig, value: any) => void;
}

const ConfigInput: React.FC<ConfigInputProps> = ({
  configKey,
  value,
  label,
  suffix,
  icon,
  onUpdate,
}) => {
  const [localVal, setLocalVal] = useState<string>('');

  useEffect(() => {
    setLocalVal(String(value !== undefined ? value : '').replace('.', ','));
  }, [value, configKey]);

  const handleBlur = () => {
    const parsed = parseFloat(localVal.replace(',', '.')) || 0;
    onUpdate(configKey, parsed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <div className="space-y-1 relative group/input">
      <div className="flex items-center justify-between">
        <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
          {label}
        </label>
      </div>
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-2.5 text-slate-400 dark:text-slate-500">
            {icon}
          </div>
        )}
        <input
          type="text"
          value={localVal}
          onChange={(e) => {
            const raw = e.target.value;
            const cleaned = raw.replace(/[^0-9.,-]/g, '');
            setLocalVal(cleaned);
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`input-field input-field-compact text-xs font-mono w-full ${
            icon ? '!pl-8' : '!pl-3'
          } ${suffix ? '!pr-14' : '!pr-3'} bg-slate-50/50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 rounded-lg focus:border-blue-500 focus:bg-white dark:focus:bg-black transition-all text-slate-800 dark:text-slate-100`}
        />
        {suffix && (
          <span className="absolute right-2.5 text-[8px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-slate-200/50 dark:border-zinc-700/50 select-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
};

export const AdminTab: React.FC<AdminTabProps> = ({
  stones,
  config,
  onUpdateConfig,
  onAddStone,
  onUpdateStone,
  onDeleteStone,
  onPushToCloud,
  onFactoryReset,
  usersList = [],
  onUpdateUserRole,
  onUpdateUserName,
  onUpdateUserEmail,
  onUpdateUserPhone,
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

  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'sys-admin' | 'admin' | 'berater'>('berater');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  const [stoneSearch, setStoneSearch] = useState('');
  const [stoneFilter, setStoneFilter] = useState<'all' | 'dekton' | 'natur'>('all');
  const [isMaterialCatalogOpen, setIsMaterialCatalogOpen] = useState(false);

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
                <div className="absolute right-0 sm:left-1/2 sm:-translate-x-1/2 top-full mt-2 w-64 sm:w-80 p-4 bg-slate-950 dark:bg-zinc-900 text-white rounded-xl shadow-2xl hidden group-hover:block pointer-events-none group-hover:pointer-events-auto z-50 border border-slate-800 dark:border-zinc-800 text-left font-normal normal-case tracking-normal">
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
                  <div className="absolute bottom-full right-2 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 border-4 border-transparent border-b-slate-950 dark:border-b-zinc-900"></div>
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
        <div id="admin-litho" className="space-y-6">
          <div className="card p-6 !overflow-visible">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80 pb-3 mb-4 shrink-0">
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Preis-Parameter</h3>
              <span className="text-[8px] font-bold bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
                System-Preise
              </span>
            </div>
            
            <div className="space-y-6">
              
              {/* Section 1: Basis-Faktoren & Service */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-zinc-800/40 pb-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  <span>Basis & Service-Gebühren</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <ConfigInput
                    configKey="factor"
                    value={config.factor}
                    label="VK-Faktor Litho"
                    suffix="Faktor"
                    icon={<Sparkles className="w-3.5 h-3.5" />}
                    onUpdate={onUpdateConfig}
                  />
                  <ConfigInput
                    configKey="moebelFactor"
                    value={config.moebelFactor}
                    label="Möbel-Faktor (VK)"
                    suffix="Faktor"
                    icon={<Layers className="w-3.5 h-3.5" />}
                    onUpdate={onUpdateConfig}
                  />
                  <ConfigInput
                    configKey="measure"
                    value={config.measure}
                    label="Aufmaß Pauschale"
                    suffix="EUR"
                    icon={<Search className="w-3.5 h-3.5" />}
                    onUpdate={onUpdateConfig}
                  />
                  <ConfigInput
                    configKey="delivery"
                    value={config.delivery}
                    label="Montage Pauschale"
                    suffix="EUR"
                    icon={<FileSpreadsheet className="w-3.5 h-3.5" />}
                    onUpdate={onUpdateConfig}
                  />
                </div>
              </div>

              {/* Section 2: Naturstein vs. Dekton Bearbeitung */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-zinc-800/40 pb-1">
                  <Layers className="w-3.5 h-3.5 text-amber-500" />
                  <span>Material-Bearbeitung (Vergleich)</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Naturstein Column */}
                  <div className="p-4 rounded-xl bg-amber-500/[0.02] dark:bg-amber-500/[0.01] border border-amber-500/10 space-y-4">
                    <div className="flex items-center justify-between border-b border-amber-500/15 pb-2">
                      <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                        Naturstein (Granit etc.)
                      </span>
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <ConfigInput
                        configKey="natEdge"
                        value={config.natEdge}
                        label="Kantenbearbeitung"
                        suffix="€/Lfm"
                        onUpdate={onUpdateConfig}
                      />
                      <ConfigInput
                        configKey="natCutUnder"
                        value={config.natCutUnder}
                        label="UB-Ausschnitt (Unterbau)"
                        suffix="€/Stk"
                        onUpdate={onUpdateConfig}
                      />
                      <ConfigInput
                        configKey="natCutFlush"
                        value={config.natCutFlush}
                        label="FB-Ausschnitt (Flächenbündig)"
                        suffix="€/Stk"
                        onUpdate={onUpdateConfig}
                      />
                      <ConfigInput
                        configKey="natCutTop"
                        value={config.natCutTop}
                        label="Auflage Ausschnitt"
                        suffix="€/Stk"
                        onUpdate={onUpdateConfig}
                      />
                      <ConfigInput
                        configKey="natNotch"
                        value={config.natNotch}
                        label="Ausklinkung"
                        suffix="€/Stk"
                        onUpdate={onUpdateConfig}
                      />
                      <ConfigInput
                        configKey="natPflegeset"
                        value={config.natPflegeset}
                        label="Pflegeset"
                        suffix="€/Stk"
                        onUpdate={onUpdateConfig}
                      />
                    </div>
                  </div>

                  {/* Dekton Column */}
                  <div className="p-4 rounded-xl bg-indigo-500/[0.02] dark:bg-indigo-500/[0.01] border border-indigo-500/10 space-y-4">
                    <div className="flex items-center justify-between border-b border-indigo-500/15 pb-2">
                      <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                        Dekton / Keramik
                      </span>
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <ConfigInput
                        configKey="dekEdge"
                        value={config.dekEdge}
                        label="Kantenbearbeitung"
                        suffix="€/Lfm"
                        onUpdate={onUpdateConfig}
                      />
                      <ConfigInput
                        configKey="dekCutUnder"
                        value={config.dekCutUnder}
                        label="UB-Ausschnitt (Unterbau)"
                        suffix="€/Stk"
                        onUpdate={onUpdateConfig}
                      />
                      <ConfigInput
                        configKey="dekCutFlush"
                        value={config.dekCutFlush}
                        label="FB-Ausschnitt (Flächenbündig)"
                        suffix="€/Stk"
                        onUpdate={onUpdateConfig}
                      />
                      <ConfigInput
                        configKey="dekCutTop"
                        value={config.dekCutTop}
                        label="Auflage Ausschnitt"
                        suffix="€/Stk"
                        onUpdate={onUpdateConfig}
                      />
                      <ConfigInput
                        configKey="dekNotch"
                        value={config.dekNotch}
                        label="Ausklinkung"
                        suffix="€/Stk"
                        onUpdate={onUpdateConfig}
                      />
                      <ConfigInput
                        configKey="dekReinigungsmittel"
                        value={config.dekReinigungsmittel}
                        label="Reinigungsmittel"
                        suffix="€/Stk"
                        onUpdate={onUpdateConfig}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Allgemeine Bearbeitungen */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-zinc-800/40 pb-1">
                  <Cpu className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Zusatz-Arbeiten & Details</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <ConfigInput
                    configKey="hole"
                    value={config.hole}
                    label="Armatur-Bohrung"
                    suffix="€/Stk"
                    onUpdate={onUpdateConfig}
                  />
                  <ConfigInput
                    configKey="miter"
                    value={config.miter}
                    label="Gehrungsschliff"
                    suffix="€/Lfm"
                    onUpdate={onUpdateConfig}
                  />
                  <ConfigInput
                    configKey="gluing"
                    value={config.gluing}
                    label="Spezial-Verklebung"
                    suffix="EUR"
                    onUpdate={onUpdateConfig}
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Section: Material-Katalog Trigger */}
          <div className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-[0.1em] mb-1 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-500 animate-pulse" />
                Material-Katalog verwalten
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Öffne die Material-Datenbank in einem separaten Fenster, um Steinplatten, Einkaufspreise und Bilder einzusehen, zu filtern oder zu bearbeiten.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsMaterialCatalogOpen(true)}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-550 text-white font-bold rounded-xl text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/15 shrink-0 cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              Katalog öffnen
            </button>
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
        </div>
      )}

      {activeAdminTab === 'admin-import' && (
        <div id="admin-import" className="space-y-6">
          {/* Header Card */}
          <div className="card no-glow p-6 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-darkBorder rounded-2xl">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 rounded-xl">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black uppercase text-slate-805 dark:text-white tracking-wider">
                  Smarte CARAT-Import Regeln (Excel / CSV)
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
                  Wenn Sie eine aus CARAT exportierte Küchen-Artikelliste hochladen, analysiert die App jede Zeile vollautomatisch. Tragen Sie hier Herstellernamen oder Kataloge (kommagetrennt) ein, um die Zeilen semantisch zuzuordnen. Groß- und Kleinschreibung wird ignoriert.
                </p>
              </div>
            </div>
          </div>

          {/* Flowchart Component */}
          <div className="card p-6 border-slate-200 dark:border-darkBorder bg-white dark:bg-[#121212]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-zinc-800">
              <div>
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-[0.15em] flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin-slow" />
                  Kalkulations-Pipeline (Logik-Flowchart)
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Reihenfolge-sensitive Auswertung jeder Zeile der Excel-Tabelle (If-Else-Kaskade)
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-[9px] font-bold">
                <span className="bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-800">
                  ★ Hover & Highlight-Verbindung Aktiv
                </span>
              </div>
            </div>

            {/* Pipeline Grid / Flow representation */}
            <div className="grid grid-cols-1 xl:grid-cols-7 gap-3 relative">
              
              {/* Step 1: Input */}
              <div 
                onMouseEnter={() => setHoveredGroup('input')}
                onMouseLeave={() => setHoveredGroup(null)}
                className={`p-3 rounded-xl border text-center transition-all duration-200 cursor-help ${
                  hoveredGroup === 'input' 
                    ? 'border-blue-400 bg-blue-50/40 dark:bg-blue-950/10 scale-102 shadow-sm' 
                    : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-[#0c0c0c]'
                }`}
              >
                <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">Eingang</div>
                <div className="flex justify-center mb-1 text-slate-600 dark:text-slate-400"><FileSpreadsheet className="w-4 h-4" /></div>
                <div className="font-bold text-[11px] text-slate-800 dark:text-slate-100">Excel-Zeile</div>
                <p className="text-[9px] text-slate-500 mt-1 leading-snug">Spalten: Katalog, Artikel, EK, VK</p>
              </div>

              {/* Step 2: Miele */}
              <div 
                onMouseEnter={() => setHoveredGroup('miele')}
                onMouseLeave={() => setHoveredGroup(null)}
                className={`p-3 rounded-xl border text-center transition-all duration-200 cursor-help relative ${
                  hoveredGroup === 'miele' 
                    ? 'border-blue-400 bg-blue-50/40 dark:bg-blue-950/10 scale-102 shadow-sm' 
                    : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-[#0c0c0c]'
                }`}
              >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-500 text-white font-bold text-[7px] px-1.5 py-0.5 rounded-full uppercase">Prio 1</div>
                <div className="text-[9px] font-black uppercase text-blue-500 tracking-wider mb-1">Miele?</div>
                <div className="flex justify-center mb-1 text-blue-500"><Cpu className="w-4 h-4" /></div>
                <div className="font-bold text-[11px] text-slate-800 dark:text-slate-100">Miele-Katalog</div>
                <p className="text-[9px] text-slate-500 mt-1 leading-snug">Zieht original VK-Preis in Miele-Rabatt</p>
              </div>

              {/* Step 3: Spüle */}
              <div 
                onMouseEnter={() => setHoveredGroup('spuele')}
                onMouseLeave={() => setHoveredGroup(null)}
                className={`p-3 rounded-xl border text-center transition-all duration-200 cursor-help relative ${
                  hoveredGroup === 'spuele'
                    ? 'border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/10 scale-102 shadow-sm' 
                    : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-[#0c0c0c]'
                }`}
              >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-white font-bold text-[7px] px-1.5 py-0.5 rounded-full uppercase">Prio 2</div>
                <div className="text-[9px] font-black uppercase text-emerald-500 tracking-wider mb-1">Spüle?</div>
                <div className="flex justify-center mb-1 text-emerald-500"><Sparkles className="w-4 h-4" /></div>
                <div className="font-bold text-[11px] text-slate-800 dark:text-slate-100">Spülen-Katalog</div>
                <p className="text-[9px] text-slate-500 mt-1 leading-snug">Wenn Blanco Art-Nr. → 3.000€ VK. Sonst 0€ VK, EK zu Möbel</p>
              </div>

              {/* Step 4: Wasseraufbereitung */}
              <div 
                onMouseEnter={() => setHoveredGroup('wasser')}
                onMouseLeave={() => setHoveredGroup(null)}
                className={`p-3 rounded-xl border text-center transition-all duration-200 cursor-help relative ${
                  hoveredGroup === 'wasser' 
                    ? 'border-purple-400 bg-purple-50/40 dark:bg-purple-950/10 scale-102 shadow-sm' 
                    : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-[#0c0c0c]'
                }`}
              >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-purple-500 text-white font-bold text-[7px] px-1.5 py-0.5 rounded-full uppercase">Prio 3</div>
                <div className="text-[9px] font-black uppercase text-purple-500 tracking-wider mb-1">Wasser?</div>
                <div className="flex justify-center mb-1 text-purple-500"><Droplets className="w-4 h-4" /></div>
                <div className="font-bold text-[11px] text-slate-800 dark:text-slate-100">Quooker/Blanco</div>
                <p className="text-[9px] text-slate-500 mt-1 leading-snug">Setzt VK fest auf 3.000,- € (z.B. Quooker)</p>
              </div>

              {/* Step 5: Stein */}
              <div 
                onMouseEnter={() => setHoveredGroup('stein')}
                onMouseLeave={() => setHoveredGroup(null)}
                className={`p-3 rounded-xl border text-center transition-all duration-200 cursor-help relative ${
                  hoveredGroup === 'stein' 
                    ? 'border-teal-400 bg-teal-50/40 dark:bg-teal-950/10 scale-102 shadow-sm' 
                    : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-[#0c0c0c]'
                }`}
              >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-teal-500 text-white font-bold text-[7px] px-1.5 py-0.5 rounded-full uppercase">Prio 4</div>
                <div className="text-[9px] font-black uppercase text-teal-500 tracking-wider mb-1">Stein?</div>
                <div className="flex justify-center mb-1 text-teal-500"><Layers className="w-4 h-4" /></div>
                <div className="font-bold text-[11px] text-slate-800 dark:text-slate-100">Arbeitsplatte</div>
                <p className="text-[9px] text-slate-500 mt-1 leading-snug">Zieht originalen Stein-EK & Stein-VK</p>
              </div>

              {/* Step 6: Möbel */}
              <div 
                onMouseEnter={() => setHoveredGroup('moebel')}
                onMouseLeave={() => setHoveredGroup(null)}
                className={`p-3 rounded-xl border text-center transition-all duration-200 cursor-help relative ${
                  hoveredGroup === 'moebel' 
                    ? 'border-amber-400 bg-amber-50/40 dark:bg-amber-950/10 scale-102 shadow-sm' 
                    : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-[#0c0c0c]'
                }`}
              >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-white font-bold text-[7px] px-1.5 py-0.5 rounded-full uppercase">Prio 5</div>
                <div className="text-[9px] font-black uppercase text-amber-500 tracking-wider mb-1">Möbel?</div>
                <div className="flex justify-center mb-1 text-amber-500"><Layers className="w-4 h-4" /></div>
                <div className="font-bold text-[11px] text-slate-800 dark:text-slate-100">Küchenmöbel</div>
                <p className="text-[9px] text-slate-500 mt-1 leading-snug">Addiert EK direkt auf Möbel-Gesamtpreis</p>
              </div>

              {/* Step 7: Fallback */}
              <div 
                onMouseEnter={() => setHoveredGroup('geraete')}
                onMouseLeave={() => setHoveredGroup(null)}
                className={`p-3 rounded-xl border text-center transition-all duration-200 cursor-help relative ${
                  hoveredGroup === 'geraete' 
                    ? 'border-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/10 scale-102 shadow-sm' 
                    : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-[#0c0c0c]'
                }`}
              >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-indigo-500 text-white font-bold text-[7px] px-1.5 py-0.5 rounded-full uppercase">Fallback</div>
                <div className="text-[9px] font-black uppercase text-indigo-500 tracking-wider mb-1">Möbel-EK</div>
                <div className="flex justify-center mb-1 text-indigo-500"><Cpu className="w-4 h-4" /></div>
                <div className="font-bold text-[11px] text-slate-800 dark:text-slate-100">Sonstige Zeilen</div>
                <p className="text-[9px] text-slate-500 mt-1 leading-snug">EK zu Möbel. Wenn Katalog in 'Allg. Geräte' → 0€ Geräteliste</p>
              </div>

            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Box 1: Möbel & Katalog-Basis (Amber Theme) */}
            <div 
              onMouseEnter={() => setHoveredGroup('moebel')}
              onMouseLeave={() => setHoveredGroup(null)}
              className={`card-tooltip-friendly p-6 space-y-4 border-t-4 border-t-amber-500 transition-all duration-300 ${
                hoveredGroup === 'moebel' ? 'shadow-lg border-slate-300 dark:border-zinc-700 bg-amber-500/[0.01]' : ''
              }`}
            >
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800/80 pb-3">
                <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-amber-700 dark:text-amber-400">Möbel & Katalog-Basis</h4>
                  <p className="text-[10px] text-slate-500 font-medium">Möbel-Kalkulation und Fallback-Handling</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-black text-slate-500 uppercase block">Küchenmöbel (Kataloge)</label>
                  <div 
                    className="relative"
                    onMouseEnter={() => setActiveTooltip('importMoebel')}
                    onMouseLeave={() => setActiveTooltip(null)}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTooltip(activeTooltip === 'importMoebel' ? null : 'importMoebel');
                      }}
                      className="p-1 rounded-md transition-colors text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-zinc-850"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                    <AnimatePresence>
                      {activeTooltip === 'importMoebel' && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          className="absolute right-0 top-full mt-1 w-72 md:w-80 p-3 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-xl rounded-xl text-[10px] text-slate-600 dark:text-slate-400 space-y-1 leading-relaxed z-50 pointer-events-none"
                        >
                          <p className="font-bold text-amber-600 dark:text-amber-400">Möbel-Kataloge (Einfluss auf Möbel-Gesamt-EK):</p>
                          <p>Hier kommagetrennt Katalog-Bezeichnungen eintragen. Zeilen dieser Kataloge werden als Möbel gewertet: Der Einkaufspreis (EK) wird summiert, der Verkaufspreis (VK) wird im Angebot automatisch über den Möbel-Faktor berechnet.</p>
                          <p className="text-blue-500 font-semibold">Tipp: Zeilen, die auf KEINE andere Regel zutreffen, werden automatisch ebenfalls hierunter addiert (Möbel-Fallback).</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <input
                  type="text"
                  value={config.importMoebel || ''}
                  onChange={(e) => onUpdateConfig('importMoebel', e.target.value)}
                  className="input-field input-field-compact text-xs font-mono"
                  placeholder="z.B. concept130, edition 700"
                />
              </div>
              
              <p className="text-[10px] text-slate-400 leading-normal">
                Standardmäßig werden alle nicht zugeordneten Excel-Zeilen als Möbel-EK aufaddiert, um Lücken in der Kalkulation zu vermeiden.
              </p>
            </div>

            {/* Box 2: Premium-Geräte & Zubehör (Blue Theme) */}
            <div 
              onMouseEnter={() => setHoveredGroup('miele')}
              onMouseLeave={() => setHoveredGroup(null)}
              className={`card-tooltip-friendly p-6 space-y-4 border-t-4 border-t-blue-500 transition-all duration-300 ${
                hoveredGroup === 'miele' || hoveredGroup === 'geraete' ? 'shadow-lg border-slate-300 dark:border-zinc-700 bg-blue-500/[0.01]' : ''
              }`}
            >
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800/80 pb-3">
                <div className="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-blue-700 dark:text-blue-400">Premium-Geräte & Zubehör</h4>
                  <p className="text-[10px] text-slate-500 font-medium">Handling von Markenherstellern und Elektrogeräten</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Miele */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-black text-slate-500 uppercase block">Miele-Geräte (Zieht originalen VK-Preis)</label>
                    <div 
                      className="relative"
                      onMouseEnter={() => setActiveTooltip('importMiele')}
                      onMouseLeave={() => setActiveTooltip(null)}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTooltip(activeTooltip === 'importMiele' ? null : 'importMiele');
                        }}
                        className="p-1 rounded-md transition-colors text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-zinc-850"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>
                      <AnimatePresence>
                        {activeTooltip === 'importMiele' && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            className="absolute right-0 top-full mt-1 w-72 md:w-80 p-3 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-xl rounded-xl text-[10px] text-slate-600 dark:text-slate-400 space-y-1 leading-relaxed z-50 pointer-events-none"
                          >
                            <p className="font-bold text-blue-600 dark:text-blue-400">Miele-Regelung (VK-Preise werden gezogen):</p>
                            <p>Trage Herstellernamen für Miele-Geräte ein. Da Miele-Geräte meist wertstabil kalkuliert und separat rabattiert werden, zieht das System hier den **originalen Verkaufspreis (VK)** direkt aus der Tabelle und trägt diese in das Angebot unter den Miele-Geräten ein.</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={config.importMiele || ''}
                    onChange={(e) => onUpdateConfig('importMiele', e.target.value)}
                    className="input-field input-field-compact text-xs font-mono"
                    placeholder="z.B. miele, miele class"
                  />
                </div>

                {/* Allg. Geräte */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-black text-slate-500 uppercase block">Allgemeine Elektrogeräte (Listet Geräte ohne Preis auf)</label>
                    <div 
                      className="relative"
                      onMouseEnter={() => setActiveTooltip('importGeraete')}
                      onMouseLeave={() => setActiveTooltip(null)}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTooltip(activeTooltip === 'importGeraete' ? null : 'importGeraete');
                        }}
                        className="p-1 rounded-md transition-colors text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-zinc-850"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>
                      <AnimatePresence>
                        {activeTooltip === 'importGeraete' && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            className="absolute right-0 top-full mt-1 w-72 md:w-80 p-3 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-xl rounded-xl text-[10px] text-slate-600 dark:text-slate-400 space-y-1 leading-relaxed z-50 pointer-events-none"
                          >
                            <p className="font-bold text-blue-600 dark:text-blue-400">Allgemeine Elektrogeräte (0,- EUR VK-Liste):</p>
                            <p>Sucht nach Marken wie bosch, neff oder siemens. Diese Artikel werden mit **0,- EUR VK** als Posten in die Geräteliste der Küche eingetragen (zur Dokumentation für den Kunden). Ihr Einkaufspreis (EK) wird jedoch auf den Möbel-EK aufgeschlagen, um im Möbel-Mischpreis erfasst zu werden.</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={config.importGeraete || ''}
                    onChange={(e) => onUpdateConfig('importGeraete', e.target.value)}
                    className="input-field input-field-compact text-xs font-mono"
                    placeholder="z.B. bosch, neff, siemens, berbel"
                  />
                </div>
              </div>
            </div>

            {/* Box 3: Premium-Wassersysteme & Ausnahmen (Purple Theme) */}
            <div 
              onMouseEnter={() => setHoveredGroup('wasser')}
              onMouseLeave={() => setHoveredGroup(null)}
              className={`card-tooltip-friendly p-6 space-y-4 border-t-4 border-t-purple-500 transition-all duration-300 md:col-span-2 xl:col-span-1 ${
                hoveredGroup === 'wasser' ? 'shadow-lg border-slate-300 dark:border-zinc-700 bg-purple-500/[0.01]' : ''
              }`}
            >
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800/80 pb-3">
                <div className="p-1.5 bg-purple-500/10 text-purple-500 rounded-lg">
                  <Droplets className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-purple-700 dark:text-purple-400">Wassersysteme & Blanco Choice</h4>
                  <p className="text-[10px] text-slate-500 font-medium">Ausnahmeregeln für Premium-Anschlüsse mit Festpreisen</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Wasseraufbereitung */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-black text-slate-500 uppercase block">Wasseraufbereitung (Pauschal 3.000,- € VK)</label>
                    <div 
                      className="relative"
                      onMouseEnter={() => setActiveTooltip('importWasser')}
                      onMouseLeave={() => setActiveTooltip(null)}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTooltip(activeTooltip === 'importWasser' ? null : 'importWasser');
                        }}
                        className="p-1 rounded-md transition-colors text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-zinc-850"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>
                      <AnimatePresence>
                        {activeTooltip === 'importWasser' && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            className="absolute right-0 top-full mt-1 w-72 md:w-80 p-3 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-xl rounded-xl text-[10px] text-slate-600 dark:text-slate-400 space-y-1 leading-relaxed z-50 pointer-events-none"
                          >
                            <p className="font-bold text-purple-600 dark:text-purple-400">Wasseraufbereitungen (z.B. Quooker):</p>
                            <p>Wird eine Zeile mit diesem Begriff (z.B. *quooker*) erkannt, listet das System den Artikel als Wassersystem auf und setzt den Verkaufspreis **automatisch fest auf 3.000,- EUR** (Brutto-Standard-Kundenpreis).</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={config.importWasser || ''}
                    onChange={(e) => onUpdateConfig('importWasser', e.target.value)}
                    className="input-field input-field-compact text-xs font-mono"
                    placeholder="z.B. quooker"
                  />
                </div>

                {/* Blanco Choice 1 & 2 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-black text-slate-500 uppercase block">Blanco Choice Art.-Nr. 1</label>
                      <div 
                        className="relative"
                        onMouseEnter={() => setActiveTooltip('importBlancoChoiceArt1')}
                        onMouseLeave={() => setActiveTooltip(null)}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTooltip(activeTooltip === 'importBlancoChoiceArt1' ? null : 'importBlancoChoiceArt1');
                          }}
                          className="p-1 rounded-md transition-colors text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-zinc-850"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                        <AnimatePresence>
                          {activeTooltip === 'importBlancoChoiceArt1' && (
                            <motion.div
                              initial={{ opacity: 0, y: 8, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 8, scale: 0.95 }}
                              className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1 w-64 p-3 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-xl rounded-xl text-[10px] text-slate-600 dark:text-slate-400 space-y-1 leading-relaxed z-50 pointer-events-none"
                            >
                              <p className="font-bold text-purple-600 dark:text-purple-400">Blanco Choice Artikelnummer Ausnahme:</p>
                              <p>Da Blanco-Artikel sonst standardmäßig als Spüle (0,- € VK) einsortiert werden, fängt diese Regel spezifische Blanco Choice Artikelnummern ab, um diese stattdessen als **Wassersystem (mit 3.000,- € VK)** zu buchen.</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={config.importBlancoChoiceArt1 || ''}
                      onChange={(e) => onUpdateConfig('importBlancoChoiceArt1', e.target.value)}
                      className="input-field input-field-compact text-xs font-mono"
                      placeholder="z.B. 527656"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-black text-slate-500 uppercase block">Blanco Choice Art.-Nr. 2</label>
                      <div 
                        className="relative"
                        onMouseEnter={() => setActiveTooltip('importBlancoChoiceArt2')}
                        onMouseLeave={() => setActiveTooltip(null)}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTooltip(activeTooltip === 'importBlancoChoiceArt2' ? null : 'importBlancoChoiceArt2');
                          }}
                          className="p-1 rounded-md transition-colors text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-zinc-850"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                        <AnimatePresence>
                          {activeTooltip === 'importBlancoChoiceArt2' && (
                            <motion.div
                              initial={{ opacity: 0, y: 8, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 8, scale: 0.95 }}
                              className="absolute right-0 top-full mt-1 w-64 p-3 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-xl rounded-xl text-[10px] text-slate-600 dark:text-slate-400 space-y-1 leading-relaxed z-50 pointer-events-none"
                            >
                              <p className="font-bold text-purple-600 dark:text-purple-400">Blanco Choice Artikelnummer Ausnahme 2:</p>
                              <p>Zweite alternative Artikelnummer für Blanco Choice Wassersysteme, die mit **3.000,- EUR Festpreis** ins Angebot einfließen sollen.</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={config.importBlancoChoiceArt2 || ''}
                      onChange={(e) => onUpdateConfig('importBlancoChoiceArt2', e.target.value)}
                      className="input-field input-field-compact text-xs font-mono"
                      placeholder="z.B. 527660"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Box 4: Sanitär & Naturstein (Emerald Theme) */}
            <div 
              onMouseEnter={() => setHoveredGroup('stein')}
              onMouseLeave={() => setHoveredGroup(null)}
              className={`card-tooltip-friendly p-6 space-y-4 border-t-4 border-t-emerald-500 transition-all duration-300 md:col-span-2 xl:col-span-1 ${
                hoveredGroup === 'stein' || hoveredGroup === 'spuele' ? 'shadow-lg border-slate-300 dark:border-zinc-700 bg-emerald-500/[0.01]' : ''
              }`}
            >
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800/80 pb-3">
                <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-400">Sanitär & Naturstein</h4>
                  <p className="text-[10px] text-slate-500 font-medium">Regeln für Arbeitsplatten und Küchenspülen</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Spülen */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-black text-slate-500 uppercase block">Spülen & Becken (Zieht keinen Preis)</label>
                    <div 
                      className="relative"
                      onMouseEnter={() => setActiveTooltip('importSpuele')}
                      onMouseLeave={() => setActiveTooltip(null)}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTooltip(activeTooltip === 'importSpuele' ? null : 'importSpuele');
                        }}
                        className="p-1 rounded-md transition-colors text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-zinc-850"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>
                      <AnimatePresence>
                        {activeTooltip === 'importSpuele' && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            className="absolute right-0 top-full mt-1 w-72 md:w-80 p-3 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-xl rounded-xl text-[10px] text-slate-600 dark:text-slate-400 space-y-1 leading-relaxed z-50 pointer-events-none"
                          >
                            <p className="font-bold text-emerald-600 dark:text-emerald-400">Spülen & Becken (0,- EUR VK im Hauptpreis enthalten):</p>
                            <p>Trage hier Herstellernamen wie blanco, naber oder systemceram ein. Das System listet diese Spülen im Angebot auf (mit **0,- EUR VK**), während ihr Einkaufspreis (EK) zur Möbel-Mischpreis-Summe addiert wird.</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={config.importSpuele || ''}
                    onChange={(e) => onUpdateConfig('importSpuele', e.target.value)}
                    className="input-field input-field-compact text-xs font-mono"
                    placeholder="z.B. blanco, systemceram"
                  />
                </div>

                {/* Stein / Arbeitsplatte */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-black text-slate-500 uppercase block">Arbeitsplatte / Naturstein (Zieht EK & VK Preis)</label>
                    <div 
                      className="relative"
                      onMouseEnter={() => setActiveTooltip('importStein')}
                      onMouseLeave={() => setActiveTooltip(null)}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTooltip(activeTooltip === 'importStein' ? null : 'importStein');
                        }}
                        className="p-1 rounded-md transition-colors text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-zinc-850"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>
                      <AnimatePresence>
                        {activeTooltip === 'importStein' && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            className="absolute right-0 top-full mt-1 w-72 md:w-80 p-3 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-xl rounded-xl text-[10px] text-slate-600 dark:text-slate-400 space-y-1 leading-relaxed z-50 pointer-events-none"
                          >
                            <p className="font-bold text-emerald-600 dark:text-emerald-400">Arbeitsplatten & Steinmetz-Katalog:</p>
                            <p>Trage den Namen des Stein-Lieferanten ein (z.B. *schellenbaum*). Erkennt die App eine Zeile mit diesem Namen, füllt sie vollautomatisch die Arbeitsplatten-Felder (Materialname, Einkaufspreis und Verkaufspreis) der Hauptkalkulation aus.</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={config.importStein || ''}
                    onChange={(e) => onUpdateConfig('importStein', e.target.value)}
                    className="input-field input-field-compact text-xs font-mono"
                    placeholder="z.B. schellenbaum"
                  />
                </div>
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
                [...(usersList || [])]
                  .sort((a, b) => {
                    const aIsEnrico = a.name?.toLowerCase().includes("enrico belmonte");
                    const bIsEnrico = b.name?.toLowerCase().includes("enrico belmonte");
                    if (aIsEnrico && !bIsEnrico) return -1;
                    if (!aIsEnrico && bIsEnrico) return 1;
                    return 0;
                  })
                  .map((u) => {
                    const isSelf = u.id === currentUserUid;
                  const isRowSysAdmin = u.role === 'sys-admin';
                  const cannotEdit = !isSysAdmin && isRowSysAdmin;

                  return (
                    <div
                      key={u.id}
                      className="p-4 bg-slate-50 dark:bg-[#0c0c0c] rounded-2xl border border-slate-200 dark:border-darkBorder flex flex-col gap-4 transition-all hover:border-slate-300 dark:hover:border-zinc-800"
                    >
                      {/* Top Row: User Details + Role Dropdown + Delete */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/50 dark:border-zinc-800/40">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                            {u.name || 'Unbenannter Benutzer'}
                          </span>
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

                      {/* Middle Row: Editable Details Form */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-wider block">Benutzername</label>
                          <input
                            type="text"
                            value={u.name || ''}
                            disabled={cannotEdit}
                            onChange={(e) => onUpdateUserName && onUpdateUserName(u.id, e.target.value)}
                            className="input-field input-field-compact text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-850 dark:text-slate-100 disabled:opacity-75"
                            placeholder="z.B. Max Müller"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-wider block">E-Mail-Adresse</label>
                          <input
                            type="email"
                            value={u.email || ''}
                            disabled={cannotEdit}
                            onChange={(e) => onUpdateUserEmail && onUpdateUserEmail(u.id, e.target.value)}
                            className="input-field input-field-compact text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-850 dark:text-slate-100 disabled:opacity-75 font-mono"
                            placeholder="z.B. max@firma.de"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-wider block">Telefonnummer (für PDF)</label>
                          <input
                            type="text"
                            value={u.phone || ''}
                            disabled={cannotEdit}
                            onChange={(e) => onUpdateUserPhone && onUpdateUserPhone(u.id, e.target.value)}
                            className="input-field input-field-compact text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-850 dark:text-slate-100 disabled:opacity-75 font-mono"
                            placeholder="z.B. 0170 12345678"
                          />
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

      {/* Sliding Modal for Material Catalog */}
      <AnimatePresence>
        {isMaterialCatalogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMaterialCatalogOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            />
            
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden z-10"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 dark:border-zinc-800 pb-4 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-800 dark:text-white tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-500" />
                    Material-Katalog ({stones.length} Einträge)
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Datenbank für Naturstein- und Dekton-Platten zur Kalkulation
                  </p>
                </div>
                <button
                  onClick={() => setIsMaterialCatalogOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-500 dark:text-slate-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Controls */}
              <div className="p-4 border-b border-slate-100 dark:border-zinc-850 bg-slate-50/50 dark:bg-zinc-900 grid grid-cols-1 md:grid-cols-3 gap-3 items-center shrink-0">
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Material suchen..."
                    value={stoneSearch}
                    onChange={(e) => setStoneSearch(e.target.value)}
                    style={{
                      paddingLeft: '2.25rem',
                      paddingRight: '0.75rem',
                    }}
                    className="h-9 w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all shadow-xs"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>

                {/* Filter */}
                <div className="flex bg-slate-100 dark:bg-zinc-950 p-1 rounded-xl border border-slate-200 dark:border-zinc-800 h-9 items-center">
                  <button
                    onClick={() => setStoneFilter('all')}
                    className={`flex-1 text-center py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all h-7 flex items-center justify-center ${
                      stoneFilter === 'all'
                        ? 'bg-white dark:bg-zinc-850 text-slate-900 dark:text-white shadow-xs font-black'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    Alle ({stones.length})
                  </button>
                  <button
                    onClick={() => setStoneFilter('natur')}
                    className={`flex-1 text-center py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all h-7 flex items-center justify-center ${
                      stoneFilter === 'natur'
                        ? 'bg-white dark:bg-zinc-850 text-slate-900 dark:text-white shadow-xs font-black'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    Natur ({stones.filter(s => !(s.isDekton === true || s.isDekton === 'true')).length})
                  </button>
                  <button
                    onClick={() => setStoneFilter('dekton')}
                    className={`flex-1 text-center py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all h-7 flex items-center justify-center ${
                      stoneFilter === 'dekton'
                        ? 'bg-white dark:bg-zinc-850 text-slate-900 dark:text-white shadow-xs font-black'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    Dekton ({stones.filter(s => (s.isDekton === true || s.isDekton === 'true')).length})
                  </button>
                </div>

                {/* Add Stone Button */}
                <button
                  onClick={onAddStone}
                  className="bg-blue-600 hover:bg-blue-550 text-white h-9 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Material hinzufügen
                </button>
              </div>

              {/* Stones List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/20 dark:bg-zinc-950/20">
                {filteredStones.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    Keine Materialien gefunden.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredStones.map((s) => {
                      const hasImage = s.image && s.image.trim() !== '';
                      const imageUrl = hasImage
                        ? (s.image.startsWith('http') || s.image.startsWith('data:') ? s.image : `images/${s.image}`)
                        : '';
                      return (
                        <div
                          key={s.id}
                          className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800/80 flex items-center gap-3 transition-all hover:border-slate-300 dark:hover:border-slate-700 min-w-0 overflow-hidden shadow-xs"
                        >
                          {/* Thumbnail */}
                          <div className="w-12 h-12 rounded-lg border border-slate-100 dark:border-zinc-800 overflow-hidden bg-slate-50 dark:bg-zinc-950 shrink-0 flex items-center justify-center relative group/admin-thumb">
                            {hasImage ? (
                              <img
                                src={imageUrl}
                                alt={s.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
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
                                className="flex-1 min-w-0 bg-transparent font-bold outline-none text-xs px-1 py-0.5 border-b border-transparent focus:border-blue-500 text-slate-900 dark:text-white"
                                placeholder="Stein Name"
                              />
                              <input
                                value={s.image || ''}
                                onChange={(e) => onUpdateStone(s.id, 'image', e.target.value)}
                                className="w-20 sm:w-28 min-w-0 bg-transparent outline-none text-[9px] font-mono text-blue-500 px-1 py-0.5 border-b border-transparent focus:border-blue-500 text-right"
                                placeholder="Bild URL"
                              />
                            </div>
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase">EK €</span>
                                <input
                                  type="number"
                                  value={s.price}
                                  onChange={(e) => onUpdateStone(s.id, 'price', parseFloat(e.target.value) || 0)}
                                  className="bg-slate-50 dark:bg-zinc-950 w-16 text-center font-mono border border-slate-200 dark:border-zinc-800 rounded-lg p-1 text-[11px] focus:border-blue-500 outline-none text-slate-900 dark:text-white"
                                />
                              </div>
                              
                              <button
                                onClick={() => onUpdateStone(s.id, 'isDekton', !s.isDekton)}
                                className={`text-[8px] font-black px-2 py-1 rounded-lg uppercase transition-all w-16 shrink-0 active:scale-95 text-white ${
                                  (s.isDekton === true || s.isDekton === 'true') ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'
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
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 flex items-center justify-end shrink-0">
                <button
                  onClick={() => setIsMaterialCatalogOpen(false)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-800 dark:hover:bg-zinc-750 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer"
                >
                  Schließen
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
