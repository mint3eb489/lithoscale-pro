import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, onSnapshot, setDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db, internalAppId, handleFirestoreError, OperationType } from './firebase';
import { Stone, AppConfig, Part, Kitchen, Offer, DEFAULTS, UserProfile } from './types';
import { DEFAULT_STONES } from './data/defaultStones';
import { Navigation } from './components/Navigation';
import { CalculatorTab } from './components/CalculatorTab';
import { GalleryTab } from './components/GalleryTab';
import { KitchenTab } from './components/KitchenTab';
import { AdminTab } from './components/AdminTab';
import { generateKitchenPDF } from './utils/pdfGenerator';
import { Cloud, Check, ShieldAlert, KeyRound, Search, X, Folder, FolderOpen, Plus, Trash2, Pencil, ChevronDown, ChevronUp, History, Download, Eye } from 'lucide-react';

const generateId = () => 'st_' + Math.random().toString(36).substr(2, 9);

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('calc');
  const [dark, setDark] = useState<boolean>(() => {
    return localStorage.getItem('ls_theme') === 'dark';
  });

  // Global Sync States
  const [stones, setStones] = useState<Stone[]>(() => {
    try {
      const cached = localStorage.getItem('ls_stones');
      if (cached) return JSON.parse(cached);
    } catch {}
    return DEFAULT_STONES.map((s) => ({ ...s, id: generateId() }));
  });

  const [config, setConfig] = useState<AppConfig>(() => {
    try {
      const cached = localStorage.getItem('ls_config');
      if (cached) return JSON.parse(cached);
    } catch {}
    return DEFAULTS.config;
  });

  // Local calculations states
  const [parts, setParts] = useState<Part[]>(() => {
    try {
      const cached = localStorage.getItem('ls_parts');
      if (cached) return JSON.parse(cached);
    } catch {}
    return [{ id: Date.now(), name: 'Platte 1', l: '', w: '', edges: { v: true, h: false, l: false, r: false } }];
  });

  const [selectedStoneId, setSelectedStoneId] = useState<string>('');
  const [miterInput, setMiterInput] = useState<string>('');

  const flushCount = parts.reduce((sum, p) => sum + (p.flush || 0), 0);
  const underCount = parts.reduce((sum, p) => sum + (p.under || 0), 0);
  const topCount = parts.reduce((sum, p) => sum + (p.top || 0), 0);
  const notchCount = parts.reduce((sum, p) => sum + (p.notch || 0), 0);
  const holeCount = parts.reduce((sum, p) => sum + (p.hole || 0), 0);

  const [gluingCheck, setGluingCheck] = useState<boolean>(false);
  const [activeServices, setActiveServices] = useState<{ measure: boolean; delivery: boolean }>({
    measure: true,
    delivery: true,
  });

  // Kitchen States
  const [kitchen, setKitchen] = useState<Kitchen>(() => {
    try {
      const cached = localStorage.getItem('ls_kitchen');
      if (cached) return JSON.parse(cached);
    } catch {}
    return {
      offerId: null,
      kunde: '',
      beraterId: '',
      front1: '',
      front2: '',
      griff: '',
      apName: '',
      hauspreis: '',
      ekMoebel: '',
      rabattMoebel: '',
      rabattMiele: '',
      geraete: [{ id: Date.now(), name: '', val: '' }],
      miele: [{ id: Date.now() + 1, name: '', val: '' }],
      spuele: [{ id: Date.now() + 3, name: '', val: '' }],
      wasser: [{ id: Date.now() + 2, name: '', val: '' }],
      mehrpreise: [{ id: Date.now() + 4, name: '', val: '' }],
      steinVK: '',
      steinEK: '',
      zubehoer: '',
      showMoebelEK: true,
      optKuechenText: true,
      optBallerina: true,
      optAnschluss: true,
      optAnschlussRabatt: false,
      optNachtext: true,
    };
  });

  // Synchronizers & Controls
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);

  const personalFactors = {
    factor: userProfile?.customFactors?.factor ?? config.factor,
    moebelFactor: userProfile?.customFactors?.moebelFactor ?? config.moebelFactor ?? 2.0
  };
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  
  const [cloudStatus, setCloudStatus] = useState<string>('Verbinde...');
  const [cloudStatusColor, setCloudStatusColor] = useState<string>('bg-amber-500 animate-pulse');
  const [debugError, setDebugError] = useState<string>('');

  // PDF Preview States
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);

  // Custom Confirm Dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const requestConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(null);
      }
    });
  };

  // Custom Prompt Dialog state
  const [promptDialog, setPromptDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    defaultValue: string;
    placeholder: string;
    onConfirm: (val: string) => void;
  } | null>(null);

  const [promptInputValue, setPromptInputValue] = useState<string>('');

  const requestPrompt = (
    title: string,
    message: string,
    defaultValue: string,
    placeholder: string,
    onConfirm: (val: string) => void
  ) => {
    setPromptInputValue(defaultValue);
    setPromptDialog({
      isOpen: true,
      title,
      message,
      defaultValue,
      placeholder,
      onConfirm: (val) => {
        onConfirm(val);
        setPromptDialog(null);
      }
    });
  };

  // Modals & Overlay triggers

  const [compareList, setCompareList] = useState<string[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState<boolean>(false);
  const [offersModalOpen, setOffersModalOpen] = useState<boolean>(false);
  const [offersList, setOffersList] = useState<Offer[]>([]);
  const [offerSearch, setOfferSearch] = useState<string>('');
  const [offerBeraterFilter, setOfferBeraterFilter] = useState<string>('all');
  const [offerSort, setOfferSort] = useState<string>('newest');

  // Save Modal and Versioning States
  const [saveOfferModalOpen, setSaveOfferModalOpen] = useState<boolean>(false);
  const [saveFolder, setSaveFolder] = useState<string>('');
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [saveVersionChoice, setSaveVersionChoice] = useState<'overwrite' | 'new_version'>('new_version');
  const [saveVersionComment, setSaveVersionComment] = useState<string>('');
  const [activeFolderFilter, setActiveFolderFilter] = useState<string>('all');
  const [customFolders, setCustomFolders] = useState<string[]>([]);
  const [expandedFamilies, setExpandedFamilies] = useState<Record<string, boolean>>({});

  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [lightboxImg, setLightboxImg] = useState<string>('');

  const [toastText, setToastText] = useState<string>('');
  const [toastVisible, setToastVisible] = useState<boolean>(false);

  const showToast = (text: string) => {
    setToastText(text);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 4500);
  };

  // Sync cache with local storage
  useEffect(() => {
    localStorage.setItem('ls_parts', JSON.stringify(parts));
  }, [parts]);

  useEffect(() => {
    localStorage.setItem('ls_kitchen', JSON.stringify(kitchen));
  }, [kitchen]);

  // Handle Dark mode toggle
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('ls_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('ls_theme', 'light');
    }
  }, [dark]);

  // Auth synchronization subscriptions
  useEffect(() => {
    let unsubSettings: (() => void) | undefined;
    let unsubOffers: (() => void) | undefined;
    let unsubProfile: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (user) {
        setCloudStatus('Cloud Aktiv');
        setCloudStatusColor('bg-green-500');
        unsubSettings = subscribeToCloudSettings();
        unsubOffers = subscribeToOffers();
        unsubProfile = subscribeToUserProfile(user);
      } else {
        setCloudStatus('Anmeldung erforderlich');
        setCloudStatusColor('bg-amber-500');
        setUserProfile(null);
        setUsersList([]);
        if (unsubSettings) unsubSettings();
        if (unsubOffers) unsubOffers();
        if (unsubProfile) unsubProfile();
      }
    });

    return () => {
      unsubAuth();
      if (unsubSettings) unsubSettings();
      if (unsubOffers) unsubOffers();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  // Subscribe to all users if current user is an admin or sys-admin
  useEffect(() => {
    if (currentUser && (userProfile?.role === 'admin' || userProfile?.role === 'sys-admin')) {
      const collRef = collection(db, 'artifacts', internalAppId, 'public', 'data', 'users');
      const unsub = onSnapshot(collRef, (snap) => {
        const list: UserProfile[] = [];
        snap.forEach((d) => {
          list.push(d.data() as UserProfile);
        });
        setUsersList(list);
      }, (err) => {
        console.error('Error fetching users collection:', err);
      });
      return unsub;
    }
  }, [currentUser, userProfile]);

  const subscribeToCloudSettings = () => {
    const docRef = doc(db, 'artifacts', internalAppId, 'public', 'data', 'settings', 'active');
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          let cloudStones = data.stones || [];
          if (cloudStones.length > 0) {
            setStones(cloudStones);
          }
          if (data.config) {
            setConfig((prev) => ({ ...prev, ...data.config }));
          }
          if (data.customFolders) {
            setCustomFolders(data.customFolders);
          } else {
            setCustomFolders([]);
          }
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, 'settings/active');
      }
    );
  };

  const getRoleByEmail = (email: string): 'sys-admin' | 'admin' | 'berater' => {
    const e = email.toLowerCase().trim();
    if (e === 'belmonte.enrico@gmail.com' || e === 'belmonte@fs-kuechen.de') {
      return 'sys-admin';
    }
    if (e === 'admin@fs-kuechen.de') {
      return 'admin';
    }
    return 'berater';
  };

  const subscribeToUserProfile = (user: any) => {
    const profileRef = doc(db, 'artifacts', internalAppId, 'public', 'data', 'users', user.uid);
    return onSnapshot(profileRef, async (snap) => {
      const emailRole = getRoleByEmail(user.email || '');
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        if (emailRole === 'sys-admin' && data.role !== 'sys-admin') {
          const updated = { ...data, role: 'sys-admin' as const };
          await setDoc(profileRef, updated, { merge: true });
          setUserProfile(updated);
        } else if (emailRole === 'admin' && data.role === 'berater') {
          const updated = { ...data, role: 'admin' as const };
          await setDoc(profileRef, updated, { merge: true });
          setUserProfile(updated);
        } else {
          setUserProfile(data);
        }
      } else {
        try {
          const usersColl = collection(db, 'artifacts', internalAppId, 'public', 'data', 'users');
          const q = query(usersColl, where('email', '==', user.email));
          const qSnap = await getDocs(q);
          if (!qSnap.empty) {
            const tempDoc = qSnap.docs[0];
            const tempData = tempDoc.data() as UserProfile;
            const updatedProfile: UserProfile = {
              ...tempData,
              id: user.uid,
              role: emailRole !== 'berater' ? emailRole : tempData.role
            };
            await setDoc(profileRef, updatedProfile);
            if (tempDoc.id !== user.uid) {
              await deleteDoc(tempDoc.ref);
            }
            setUserProfile(updatedProfile);
          } else {
            const initialProfile: UserProfile = {
              id: user.uid,
              email: user.email || '',
              name: user.displayName || user.email?.split('@')[0] || 'Unbekannt',
              role: emailRole,
              createdAt: Date.now(),
              stats: {
                dekton: [],
                natur: []
              }
            };
            await setDoc(profileRef, initialProfile);
            setUserProfile(initialProfile);
          }
        } catch (err) {
          console.error('Error pre-registering:', err);
          const initialProfile: UserProfile = {
            id: user.uid,
            email: user.email || '',
            name: user.displayName || user.email?.split('@')[0] || 'Unbekannt',
            role: emailRole,
            createdAt: Date.now(),
            stats: {
              dekton: [],
              natur: []
            }
          };
          await setDoc(profileRef, initialProfile).catch(() => {});
          setUserProfile(initialProfile);
        }
      }
    });
  };

  const subscribeToOffers = () => {
    const collRef = collection(db, 'artifacts', internalAppId, 'public', 'data', 'offers');
    return onSnapshot(
      collRef,
      (snap) => {
        const list: Offer[] = [];
        snap.forEach((doc) => {
          list.push(doc.data() as Offer);
        });
        setOffersList(list);
      },
      (err) => {
        console.error('Offers snapshot error:', err);
      }
    );
  };

  // User Management Actions
  const handleUpdateUserRole = async (uid: string, role: 'sys-admin' | 'admin' | 'berater') => {
    try {
      const docRef = doc(db, 'artifacts', internalAppId, 'public', 'data', 'users', uid);
      await setDoc(docRef, { role }, { merge: true });
      showToast('Benutzerrolle aktualisiert.');
    } catch (err) {
      console.error(err);
      showToast('Fehler beim Aktualisieren der Benutzerrolle.');
    }
  };

  const handleUpdateUserFactors = async (uid: string, factor: number | null, moebelFactor: number | null) => {
    try {
      const docRef = doc(db, 'artifacts', internalAppId, 'public', 'data', 'users', uid);
      const customFactors: { factor?: number; moebelFactor?: number } = {};
      if (factor !== null && !isNaN(factor)) customFactors.factor = factor;
      if (moebelFactor !== null && !isNaN(moebelFactor)) customFactors.moebelFactor = moebelFactor;
      await setDoc(docRef, { customFactors }, { merge: true });
      showToast('Benutzer-Faktoren aktualisiert.');
    } catch (err) {
      console.error(err);
      showToast('Fehler beim Aktualisieren der Faktoren.');
    }
  };

  const handleUpdateUserName = async (uid: string, name: string) => {
    try {
      const docRef = doc(db, 'artifacts', internalAppId, 'public', 'data', 'users', uid);
      await setDoc(docRef, { name }, { merge: true });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateUserEmail = async (uid: string, email: string) => {
    try {
      const docRef = doc(db, 'artifacts', internalAppId, 'public', 'data', 'users', uid);
      await setDoc(docRef, { email: email.toLowerCase().trim() }, { merge: true });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateUserPhone = async (uid: string, phone: string) => {
    try {
      const docRef = doc(db, 'artifacts', internalAppId, 'public', 'data', 'users', uid);
      await setDoc(docRef, { phone }, { merge: true });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPreRegisteredUser = async (name: string, email: string, role: 'sys-admin' | 'admin' | 'berater') => {
    try {
      const tempId = 'temp_' + Date.now();
      const docRef = doc(db, 'artifacts', internalAppId, 'public', 'data', 'users', tempId);
      await setDoc(docRef, {
        id: tempId,
        name,
        email: email.toLowerCase(),
        role,
        createdAt: Date.now(),
        stats: { dekton: [], natur: [] }
      });
      showToast('Benutzer erfolgreich angelegt.');
    } catch (err) {
      console.error(err);
      showToast('Fehler beim Anlegen des Benutzers.');
    }
  };

  const handleDeleteUserProfile = async (uid: string) => {
    requestConfirm('Benutzer löschen?', 'Möchtest du dieses Benutzerprofil wirklich löschen? Der Benutzer verliert seine administrativen Rechte bzw. den exklusiven Profilzugriff.', async () => {
      try {
        const docRef = doc(db, 'artifacts', internalAppId, 'public', 'data', 'users', uid);
        await deleteDoc(docRef);
        showToast('Benutzerprofil gelöscht.');
      } catch (err) {
        console.error(err);
        showToast('Fehler beim Löschen des Benutzers.');
      }
    });
  };

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      setLoginError('E-Mail und Passwort eingeben.');
      return;
    }
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (e: any) {
      setLoginError('E-Mail oder Passwort falsch.');
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      showToast('Abgemeldet.');
    } catch {}
  };

  const pushToCloud = async () => {
    if (!currentUser) return;
    setCloudStatus('Sende...');
    setCloudStatusColor('bg-blue-500 animate-pulse');
    try {
      const docRef = doc(db, 'artifacts', internalAppId, 'public', 'data', 'settings', 'active');
      await setDoc(docRef, {
        stones: stones,
        config: config,
        updated: Date.now(),
        editor: currentUser.uid,
        customFolders: customFolders,
      });
      showToast('Einstellungen in die Cloud hochgeladen.');
      setCloudStatus('Cloud Aktiv');
      setCloudStatusColor('bg-green-500');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/active');
    }
  };

  const factoryResetCloud = async () => {
    requestConfirm('Katalog zurücksetzen?', 'Möchtest du den Katalog und alle Konfigurationen wirklich auf Standardeinstellungen zurücksetzen?', async () => {
      const cleanStones = DEFAULT_STONES.map((s) => ({ ...s, id: generateId() }));
      setStones(cleanStones);
      setConfig(DEFAULTS.config);
      showToast('Katalog zurückgesetzt. Klick UPLOAD CLOUD zum Sichern.');
    });
  };

  const downloadMaterialsConfigBackup = () => {
    const backupData = {
      version: '1.0',
      type: 'materials_and_config',
      timestamp: Date.now(),
      stones: stones,
      config: config,
      customFolders: customFolders,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lithoscale_katalog_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Katalog-Backup heruntergeladen.');
  };

  const importMaterialsConfigBackup = (jsonData: any) => {
    try {
      if (!jsonData || typeof jsonData !== 'object') {
        throw new Error('Ungültiges Format.');
      }
      const importedStones = jsonData.stones;
      const importedConfig = jsonData.config;
      
      if (!Array.isArray(importedStones)) {
        throw new Error('Das Backup enthält keine gültigen Materialien.');
      }
      
      setStones(importedStones);
      if (importedConfig) {
        setConfig((prev) => ({ ...prev, ...importedConfig }));
      }
      if (Array.isArray(jsonData.customFolders)) {
        setCustomFolders(jsonData.customFolders);
      }
      
      showToast('Katalog geladen! Bitte klicke "UPLOAD CLOUD", um die Änderungen in der Cloud zu sichern.');
    } catch (err: any) {
      alert(`Fehler beim Importieren: ${err.message || err}`);
    }
  };

  const downloadOffersBackup = () => {
    if (offersList.length === 0) {
      showToast('Keine Angebote im Archiv vorhanden.');
      return;
    }
    const backupData = {
      version: '1.0',
      type: 'offers_archive',
      timestamp: Date.now(),
      offers: offersList,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lithoscale_angebote_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Angebots-Archiv Backup heruntergeladen.');
  };

  const importOffersBackup = async (jsonData: any) => {
    try {
      if (!jsonData || typeof jsonData !== 'object') {
        throw new Error('Ungültiges Format.');
      }
      const importedOffers = jsonData.offers;
      if (!Array.isArray(importedOffers)) {
        throw new Error('Das Backup enthält keine gültigen Angebote.');
      }
      
      requestConfirm(
        'Angebote importieren?',
        `Möchtest du wirklich ${importedOffers.length} Angebote in das Cloud-Archiv einspielen? Bestehende Angebote mit gleicher ID werden überschrieben.`,
        async () => {
          showToast('Importiere Angebote...');
          let count = 0;
          for (const offer of importedOffers) {
            if (!offer.id || !offer.kunde) continue;
            const docRef = doc(db, 'artifacts', internalAppId, 'public', 'data', 'offers', offer.id);
            await setDoc(docRef, offer);
            count++;
          }
          
          const newFolders = Array.from(new Set(importedOffers.map((o: any) => o.folder).filter(Boolean))) as string[];
          if (newFolders.length > 0) {
            const mergedFolders = Array.from(new Set([...customFolders, ...newFolders]));
            setCustomFolders(mergedFolders);
            const settingsRef = doc(db, 'artifacts', internalAppId, 'public', 'data', 'settings', 'active');
            await setDoc(settingsRef, { customFolders: mergedFolders }, { merge: true });
          }
          
          showToast(`${count} Angebote erfolgreich in das Cloud-Archiv importiert.`);
        }
      );
    } catch (err: any) {
      alert(`Fehler beim Importieren der Angebote: ${err.message || err}`);
    }
  };

  const handleOpenSaveModal = () => {
    if (!kitchen.kunde || kitchen.kunde.trim() === '') {
      showToast('Kundenname oder Kommission fehlt!');
      return;
    }
    const existingOffer = kitchen.offerId ? visibleOffers.find(x => x.id === kitchen.offerId) : null;
    if (existingOffer) {
      setSaveFolder(existingOffer.folder || '');
      setSaveVersionChoice('new_version');
      setSaveVersionComment('');
    } else {
      setSaveFolder('');
      setSaveVersionChoice('new_version');
      setSaveVersionComment('');
    }
    setSaveOfferModalOpen(true);
  };

  const saveOfferToCloud = async (options: {
    folder: string;
    versionChoice: 'overwrite' | 'new_version';
    comment: string;
  }) => {
    if (!currentUser) {
      showToast('Keine Verbindung zur Cloud.');
      return;
    }
    setCloudStatus('Speichere Angebot...');
    setCloudStatusColor('bg-blue-500 animate-pulse');

    let targetOfferId = kitchen.offerId;
    let parentOfferId = '';
    let nextVersion = 1;

    const existingOffer = targetOfferId ? visibleOffers.find((x) => x.id === targetOfferId) : null;

    if (existingOffer) {
      parentOfferId = existingOffer.parentOfferId || existingOffer.id;
      if (options.versionChoice === 'new_version') {
        targetOfferId = 'off_' + Date.now();
        const familyOffers = visibleOffers.filter((x) => (x.parentOfferId || x.id) === parentOfferId);
        const highestVersion = familyOffers.reduce((max, x) => Math.max(max, x.version || 1), 1);
        nextVersion = highestVersion + 1;
      } else {
        nextVersion = existingOffer.version || 1;
      }
    } else {
      targetOfferId = 'off_' + Date.now();
      parentOfferId = targetOfferId;
      nextVersion = 1;
    }

    const offerData: Offer = {
      id: targetOfferId,
      kunde: kitchen.kunde.trim(),
      beraterId: kitchen.beraterId,
      timestamp: Date.now(),
      totalVK: parseFloat(kitchen.hauspreis) || 0,
      kitchen: { ...kitchen, offerId: targetOfferId },
      parts: parts,
      stoneId: selectedStoneId,
      editor: currentUser.uid,
      folder: options.folder.trim(),
      parentOfferId: parentOfferId,
      version: nextVersion,
      versionComment: options.comment.trim(),
    };

    try {
      const finalFolderStr = options.folder.trim();
      if (saveFolder === '__NEW__' && finalFolderStr) {
        const newList = Array.from(new Set([...customFolders, finalFolderStr]));
        setCustomFolders(newList);
        await saveCustomFoldersToCloud(newList);
      }

      const docRef = doc(db, 'artifacts', internalAppId, 'public', 'data', 'offers', targetOfferId);
      await setDoc(docRef, offerData);
      setKitchen((prev) => ({ ...prev, offerId: targetOfferId }));
      showToast(options.versionChoice === 'new_version' 
        ? `Version V${nextVersion} für "${kitchen.kunde}" wurde gespeichert.` 
        : `Angebot für "${kitchen.kunde}" wurde aktualisiert.`
      );
      setCloudStatus('Cloud Aktiv');
      setCloudStatusColor('bg-green-500');
      setSaveOfferModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `offers/${targetOfferId}`);
    }
  };

  const deleteOfferFromCloud = async (id: string, name: string) => {
    requestConfirm('Angebot löschen?', `Möchtest du das Angebot für "${name}" wirklich unwiderruflich löschen?`, async () => {
      try {
        const docRef = doc(db, 'artifacts', internalAppId, 'public', 'data', 'offers', id);
        await deleteDoc(docRef);
        if (kitchen.offerId === id) {
          setKitchen((prev) => ({ ...prev, offerId: null }));
        }
        showToast('Angebot gelöscht.');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `offers/${id}`);
      }
    });
  };

  const saveCustomFoldersToCloud = async (updatedFolders: string[]) => {
    if (!currentUser) return;
    try {
      const docRef = doc(db, 'artifacts', internalAppId, 'public', 'data', 'settings', 'active');
      await setDoc(docRef, {
        customFolders: updatedFolders,
        updated: Date.now(),
        editor: currentUser.uid
      }, { merge: true });
    } catch (err) {
      console.error('Error saving custom folders:', err);
      showToast('Fehler beim Speichern der Ordner in der Cloud.');
      handleFirestoreError(err, OperationType.WRITE, 'settings/active');
    }
  };

  const createFolder = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (customFolders.includes(trimmed)) {
      showToast('Ordner existiert bereits.');
      return;
    }
    const newList = [...customFolders, trimmed];
    setCustomFolders(newList);
    await saveCustomFoldersToCloud(newList);
    showToast(`Ordner "${trimmed}" erstellt.`);
  };

  const moveOfferFamilyToFolder = async (familyId: string, targetFolder: string) => {
    let folderName = targetFolder;
    
    const proceedWithMove = async (fName: string) => {
      setCloudStatus('Verschiebe Angebot...');
      setCloudStatusColor('bg-blue-500 animate-pulse');
      try {
        const affected = offersList.filter(o => (o.parentOfferId || o.id) === familyId);
        for (const o of affected) {
          const docRef = doc(db, 'artifacts', internalAppId, 'public', 'data', 'offers', o.id);
          await setDoc(docRef, { folder: fName }, { merge: true });
        }
        showToast(`Angebote erfolgreich in den Ordner "${fName || 'Hauptverzeichnis'}" verschoben.`);
        setCloudStatus('Cloud Aktiv');
        setCloudStatusColor('bg-green-500');
      } catch (err) {
        console.error(err);
        showToast('Fehler beim Verschieben des Angebots.');
        setCloudStatus('Cloud Aktiv');
        setCloudStatusColor('bg-green-500');
      }
    };

    if (targetFolder === '__NEW__') {
      requestPrompt(
        'Projektordner erstellen',
        'Neuen Projektordner für dieses Angebot erstellen:',
        '',
        'z.B. Projekt Schmidt',
        async (name) => {
          const trimmed = name.trim();
          if (!trimmed) return;
          const newList = Array.from(new Set([...customFolders, trimmed]));
          setCustomFolders(newList);
          await saveCustomFoldersToCloud(newList);
          await proceedWithMove(trimmed);
        }
      );
    } else {
      await proceedWithMove(folderName);
    }
  };

  const renameFolder = async (oldName: string) => {
    requestPrompt(
      'Ordner umbenennen',
      `Gib eine neue Bezeichnung für den Ordner "${oldName}" ein:`,
      oldName,
      'Ordnername',
      async (newName) => {
        if (!newName || newName.trim() === '' || oldName === newName) return;
        const trimmed = newName.trim();
        
        const affected = visibleOffers.filter(o => o.folder === oldName);

        const performRename = async () => {
          setCloudStatus('Benenne Ordner um...');
          setCloudStatusColor('bg-blue-500 animate-pulse');
          try {
            for (const o of affected) {
              const docRef = doc(db, 'artifacts', internalAppId, 'public', 'data', 'offers', o.id);
              await setDoc(docRef, { folder: trimmed }, { merge: true });
            }
            const newList = customFolders.map(f => f === oldName ? trimmed : f);
            if (!newList.includes(trimmed)) {
              newList.push(trimmed);
            }
            setCustomFolders(newList);
            await saveCustomFoldersToCloud(newList);

            showToast(`Ordner umbenannt in "${trimmed}".`);
            setCloudStatus('Cloud Aktiv');
            setCloudStatusColor('bg-green-500');
            if (activeFolderFilter === oldName) {
              setActiveFolderFilter(trimmed);
            }
          } catch (err) {
            showToast('Fehler beim Umbenennen.');
            setCloudStatus('Cloud Aktiv');
            setCloudStatusColor('bg-green-500');
          }
        };

        if (affected.length === 0) {
          const newList = customFolders.map(f => f === oldName ? trimmed : f);
          setCustomFolders(newList);
          await saveCustomFoldersToCloud(newList);
          showToast(`Ordner umbenannt in "${trimmed}".`);
          if (activeFolderFilter === oldName) {
            setActiveFolderFilter(trimmed);
          }
          return;
        }

        requestConfirm('Ordner umbenennen?', `Möchtest du den Ordner "${oldName}" wirklich in "${trimmed}" umbenennen? (${affected.length} Angebote betroffen)`, performRename);
      }
    );
  };

  const deleteFolderFromCloud = async (folderName: string) => {
    const affected = visibleOffers.filter(o => o.folder === folderName);

    const performDelete = async () => {
      setCloudStatus('Löse Ordner aufe...');
      setCloudStatusColor('bg-blue-500 animate-pulse');
      try {
        for (const o of affected) {
          const docRef = doc(db, 'artifacts', internalAppId, 'public', 'data', 'offers', o.id);
          await setDoc(docRef, { folder: '' }, { merge: true });
        }
        const newList = customFolders.filter(f => f !== folderName);
        setCustomFolders(newList);
        await saveCustomFoldersToCloud(newList);

        showToast(`Ordner "${folderName}" aufgelöst.`);
        setCloudStatus('Cloud Aktiv');
        setCloudStatusColor('bg-green-500');
        if (activeFolderFilter === folderName) {
          setActiveFolderFilter('all');
        }
      } catch (err) {
        showToast('Fehler beim Auflösen des Ordners.');
        setCloudStatus('Cloud Aktiv');
        setCloudStatusColor('bg-green-500');
      }
    };

    if (affected.length === 0) {
      const newList = customFolders.filter(f => f !== folderName);
      setCustomFolders(newList);
      await saveCustomFoldersToCloud(newList);
      showToast(`Ordner "${folderName}" gelöscht.`);
      if (activeFolderFilter === folderName) {
        setActiveFolderFilter('all');
      }
      return;
    }

    requestConfirm(
      'Ordner auflösen?',
      `Möchtest du den Ordner "${folderName}" wirklich auflösen? Alle darin enthaltenen Angebote werden in das Hauptverzeichnis (ohne Ordner) verschoben. Die Angebote selbst werden NICHT gelöscht.`,
      performDelete
    );
  };

  const loadOffer = (id: string) => {
    const o = visibleOffers.find((x) => x.id === id);
    if (!o) return;
    requestConfirm('Angebot laden?', `Möchtest du das Angebot für "${o.kunde}" laden? Aktuelle Daten auf dieser Seite werden überschrieben.`, () => {
      setKitchen(o.kitchen);
      setParts(o.parts || []);
      if (o.stoneId) setSelectedStoneId(o.stoneId);
      setOffersModalOpen(false);
      setActiveTab('kitchen');
      showToast('Angebot geladen.');
    });
  };

  const pullSelectedStonePrice = () => {
    const s = stones.find((x) => x.id === selectedStoneId) || stones[0];
    if (!s) {
      showToast('Keine Steine vorhanden.');
      return;
    }

    // Direct calculation
    const isDek = s.isDekton === true || s.isDekton === 'true';
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
      if (p.edges.r) totalLfm += w / 100;
    });

    const miterMeters = (parseFloat(miterInput.replace(',', '.')) || 0) / 100;
    const gluingCost = gluingCheck ? (config.gluing || 0) : 0;

    const sumMat = totalSqm * s.price;
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
    const vk = ek * personalFactors.factor;

    setKitchen((prev) => ({
      ...prev,
      apName: `${s.isDekton ? 'Dekton' : 'Naturstein'} ${s.name}`,
      steinVK: vk.toFixed(2).replace('.', ','),
      steinEK: ek.toFixed(2).replace('.', ','),
    }));

    showToast('Materialien aus dem Kalkulator geladen!');
  };

  const triggerPDFGeneration = () => {
    // Collect parameters
    const s = stones.find((x) => x.id === selectedStoneId) || stones[0] || null;
    const parsePrice = (str: string) => parseFloat(String(str).replace(',', '.')) || 0;

    const ekMoebel = parsePrice(kitchen.ekMoebel);
    const rabattMoebel = parsePrice(kitchen.rabattMoebel);
    const moebelFactor = personalFactors.moebelFactor;
    const vkMoebel = ekMoebel * moebelFactor * (1 - rabattMoebel / 100);

    const vkStein = parsePrice(kitchen.steinVK);

    let sumMieleBrutto = 0;
    (kitchen.miele || []).forEach((m) => {
      sumMieleBrutto += parsePrice(m.val);
    });
    const rabattMiele = parsePrice(kitchen.rabattMiele);
    const vkMiele = sumMieleBrutto * (1 - rabattMiele / 100);

    let vkWasser = 0;
    (kitchen.wasser || []).forEach((w) => {
      vkWasser += parsePrice(w.val);
    });

    const totalCalculatedVK = vkMoebel + vkWasser + vkStein + vkMiele;
    const targetEndprice = parsePrice(kitchen.hauspreis);
    const finalDisplayVK = targetEndprice > 0 ? targetEndprice : totalCalculatedVK;
    const proportionMontage = finalDisplayVK * 0.095;

    generateKitchenPDF(
      {
        kitchen,
        config,
        parts,
        totalVK: finalDisplayVK,
        montage: proportionMontage,
        vkStein,
        vkMiele,
        vkMoebel,
        usersList,
      },
      showToast
    );
  };

  const triggerPDFPreview = async () => {
    setIsPreviewLoading(true);
    try {
      const s = stones.find((x) => x.id === selectedStoneId) || stones[0] || null;
      const parsePrice = (str: string) => parseFloat(String(str).replace(',', '.')) || 0;

      const ekMoebel = parsePrice(kitchen.ekMoebel);
      const rabattMoebel = parsePrice(kitchen.rabattMoebel);
      const moebelFactor = personalFactors.moebelFactor;
      const vkMoebel = ekMoebel * moebelFactor * (1 - rabattMoebel / 100);

      const vkStein = parsePrice(kitchen.steinVK);

      let sumMieleBrutto = 0;
      (kitchen.miele || []).forEach((m) => {
        sumMieleBrutto += parsePrice(m.val);
      });
      const rabattMiele = parsePrice(kitchen.rabattMiele);
      const vkMiele = sumMieleBrutto * (1 - rabattMiele / 100);

      let vkWasser = 0;
      (kitchen.wasser || []).forEach((w) => {
        vkWasser += parsePrice(w.val);
      });

      const totalCalculatedVK = vkMoebel + vkWasser + vkStein + vkMiele;
      const targetEndprice = parsePrice(kitchen.hauspreis);
      const finalDisplayVK = targetEndprice > 0 ? targetEndprice : totalCalculatedVK;
      const proportionMontage = finalDisplayVK * 0.095;

      const blobUrl = await generateKitchenPDF(
        {
          kitchen,
          config,
          parts,
          totalVK: finalDisplayVK,
          montage: proportionMontage,
          vkStein,
          vkMiele,
          vkMoebel,
          usersList,
        },
        showToast,
        'blob'
      );
      if (blobUrl) {
        setPdfPreviewUrl(blobUrl);
      }
    } catch (err) {
      console.error(err);
      showToast("Vorschau-Fehler: " + (err as Error).message);
    } finally {
      setIsPreviewLoading(false);
    }
  };



  const handleSaveStat = () => {
    const s = stones.find((x) => x.id === selectedStoneId) || stones[0];
    if (!s) return;

    // recalculate
    const isDek = s.isDekton === true || s.isDekton === 'true';
    const edgeRate = isDek ? config.dekEdge : config.natEdge;
    const rateFlush = isDek ? config.dekCutFlush : config.natCutFlush;
    const rateUnder = isDek ? config.dekCutUnder : config.natCutUnder;
    const rateTop = isDek ? (config.dekCutTop || 0) : (config.natCutTop || 0);

    let totalSqm = 0;
    parts.forEach((p) => {
      const l = parseFloat(p.l.replace(',', '.')) || 0;
      const w = parseFloat(p.w.replace(',', '.')) || 0;
      totalSqm += (l * w) / 10000;
    });

    const miterMeters = (parseFloat(miterInput.replace(',', '.')) || 0) / 100;
    const gluingCost = gluingCheck ? (config.gluing || 0) : 0;

    const sumMat = totalSqm * s.price;
    const sumEdge = 0; // standard edges list calculated out

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
    const vk = ek * config.factor;

    const category = s.isDekton ? 'dekton' : 'natur';
    if (currentUser && userProfile) {
      const personalStats = {
        dekton: [...(userProfile.stats?.dekton || [])],
        natur: [...(userProfile.stats?.natur || [])]
      };
      personalStats[category].push(vk);
      if (personalStats[category].length > 10) {
        personalStats[category].shift();
      }
      const userDocRef = doc(db, 'artifacts', internalAppId, 'public', 'data', 'users', currentUser.uid);
      setDoc(userDocRef, { stats: personalStats }, { merge: true })
        .then(() => {
          showToast('In Markttrend-Statistik deines Profils übernommen.');
        })
        .catch((err) => {
          console.error('Error saving personal stats:', err);
        });
    } else {
      const activeStats = { ...config.stats };
      if (!activeStats[category]) activeStats[category] = [];
      activeStats[category].push(vk);

      if (activeStats[category].length > 10) {
        activeStats[category].shift();
      }

      setConfig((prev) => ({ ...prev, stats: activeStats }));
      showToast('In globale Markttrend-Statistik übernommen.');
    }
  };

  // Carat Importer Logic from spreadsheet rows parser
  const processCaratRows = (rows: any[][]) => {
    let sumMoebelEK = 0;
    let newMiele: any[] = [];
    let newSpuele: any[] = [];
    let newWasser: any[] = [];
    let newGeraete: any[] = [];

    let apName = kitchen.apName;
    let apPriceVK = kitchen.steinVK;
    let apPriceEK = kitchen.steinEK;

    let foundBlancoChoice = false;

    const parseNum = (val: any) => {
      if (!val) return 0;
      if (typeof val === 'number') return val;
      return parseFloat(String(val).replace(/\./g, '').replace(',', '.')) || 0;
    };

    const checkMatch = (val: string, configStr: string) => {
      if (!configStr) return false;
      const rules = configStr
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s !== '');
      return rules.some((rule) => val.includes(rule));
    };

    let colCat = -1,
      colArt = -1,
      colEk = -1,
      colVk = -1;
    let startRow = -1;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!Array.isArray(row)) continue;

      let foundHeaders = 0;
      for (let j = 0; j < row.length; j++) {
        const cell = String(row[j] || '')
          .toLowerCase()
          .trim();
        if (cell.includes('katalog') || cell.includes('hersteller')) {
          colCat = j;
          foundHeaders++;
        }
        if (cell === 'artikel' || cell.includes('bezeichnung') || cell.includes('art.-nr')) {
          colArt = j;
          foundHeaders++;
        }
        if (cell === 'ek' || cell.includes('einkauf')) {
          colEk = j;
          foundHeaders++;
        }
        if (cell === 'vk' || cell === 'preis' || cell.includes('verkauf')) {
          colVk = j;
          foundHeaders++;
        }
      }

      if (foundHeaders >= 2) {
        startRow = i + 1;
        break;
      }
    }

    if (startRow === -1) {
      showToast("Katalog o. Spalten 'Bezeichnung', 'EK' nicht gefunden.");
      return;
    }

    let countItems = 0;

    for (let i = startRow; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !Array.isArray(row)) continue;

      const cat = colCat > -1 ? String(row[colCat] || '').toLowerCase() : '';
      const art = colArt > -1 ? String(row[colArt] || '') : '';
      const ek = colEk > -1 ? parseNum(row[colEk]) : 0;
      const vk = colVk > -1 ? parseNum(row[colVk]) : 0;

      if (!cat && !art && ek === 0 && vk === 0) continue;
      if (cat.includes('lager') && !art.toLowerCase().includes('anschlüsse')) continue;

      countItems++;
      const artStr = art.toString();

      if (checkMatch(cat, config.importMiele)) {
        newMiele.push({ id: Date.now() + Math.random(), name: art, val: vk ? vk.toString() : '' });
      } else if (checkMatch(cat, config.importSpuele)) {
        if (
          (config.importBlancoChoiceArt1 && artStr.includes(config.importBlancoChoiceArt1)) ||
          (config.importBlancoChoiceArt2 && artStr.includes(config.importBlancoChoiceArt2))
        ) {
          foundBlancoChoice = true;
        } else {
          sumMoebelEK += ek;
          newSpuele.push({ id: Date.now() + Math.random(), name: art, val: '' });
        }
      } else if (checkMatch(cat, config.importWasser)) {
        newWasser.push({ id: Date.now() + Math.random(), name: art, val: '3000' });
      } else if (checkMatch(cat, config.importStein)) {
        apName = art;
        apPriceVK = vk ? vk.toString() : '';
        apPriceEK = ek ? ek.toString() : '';
      } else if (checkMatch(cat, config.importMoebel)) {
        sumMoebelEK += ek;
      } else {
        sumMoebelEK += ek;
        if (checkMatch(cat, config.importGeraete)) {
          newGeraete.push({ id: Date.now() + Math.random(), name: art, val: '' });
        }
      }
    }

    if (countItems === 0) {
      showToast('Gültige Spalten, aber leere Artikel.');
      return;
    }

    if (foundBlancoChoice) {
      newWasser.push({ id: Date.now() + Math.random(), name: 'Blanco Choice All', val: '3000' });
    }

    setKitchen((prev) => ({
      ...prev,
      ekMoebel: sumMoebelEK > 0 ? sumMoebelEK.toFixed(2).replace('.', ',') : prev.ekMoebel,
      miele: newMiele.length > 0 ? newMiele : prev.miele,
      spuele: newSpuele.length > 0 ? newSpuele : prev.spuele,
      wasser: newWasser.length > 0 ? newWasser : prev.wasser,
      geraete: newGeraete.length > 0 ? newGeraete : prev.geraete,
      apName: apName,
      steinVK: apPriceVK || prev.steinVK,
      steinEK: apPriceEK || prev.steinEK,
    }));

    showToast(`${countItems} Artikel aus CARAT-Plan eingelesen!`);
  };

  const handleImportCaratXLSX = (file: File) => {
    const XLSX = (window as any).XLSX;
    if (!XLSX) {
      showToast('Excel Modul lädt noch, bitte 1 Sekunde warten.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], { header: 1 });
        processCaratRows(rows as any[][]);
      } catch (err) {
        showToast('Fehler beim Excel-Import.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Dual Comparisons View
  const handleToggleCompare = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const activeId = selectedStoneId || stones[0]?.id || '';
    if (!activeId) {
      showToast('Wähle zuerst ein Material im Kalkulator.');
      return;
    }
    if (activeId === id) {
      showToast('Dieses Material ist bereits aktiv.');
      return;
    }
    setCompareList([activeId, id]);
    setCompareModalOpen(true);
  };

  useEffect(() => {
    if (compareList.length === 2) {
      setCompareModalOpen(true);
    }
  }, [compareList]);

  // Handle Tab Switch restrictions
  const handleTabSwitch = (t: string) => {
    if (t === 'admin') {
      if (userProfile?.role === 'admin' || userProfile?.role === 'sys-admin') {
        setActiveTab(t);
      }
    } else {
      setActiveTab(t);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-black flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-relaxed mt-2 animate-pulse">
            Team-Kanal lädt...
          </p>
        </div>
      </div>
    );
  }

  // Filter visible offers depending on user role
  const visibleOffers = offersList.filter((o) => {
    if (!currentUser) return false;
    if (!userProfile) return false;
    if (userProfile.role === 'admin' || userProfile.role === 'sys-admin') return true;
    return o.editor === currentUser.uid;
  });

  // 1. Extract folders and merge with customFolders
  const dbFolders = Array.from(new Set([
    ...customFolders,
    ...visibleOffers.map(o => o.folder).filter(Boolean)
  ])) as string[];

  // 2. Filter raw offers
  const filteredOffers = visibleOffers.filter((o) => {
    // Folder filter
    if (activeFolderFilter !== 'all') {
      const ofFolder = o.folder || '';
      if (ofFolder !== activeFolderFilter) return false;
    }
    // Adviser filter
    if (offerBeraterFilter !== 'all' && String(o.beraterId) !== String(offerBeraterFilter)) return false;
    // Search filter
    if (offerSearch && !o.kunde.toLowerCase().includes(offerSearch.toLowerCase())) return false;
    return true;
  });

  // 3. Group into families
  const familiesMap: Record<string, Offer[]> = {};
  filteredOffers.forEach((o) => {
    const famId = o.parentOfferId || o.id;
    if (!familiesMap[famId]) familiesMap[famId] = [];
    familiesMap[famId].push(o);
  });

  interface FamilyItem {
    familyId: string;
    kunde: string;
    latestOffer: Offer;
    versions: Offer[];
  }

  const familiesList: FamilyItem[] = Object.entries(familiesMap).map(([famId, list]) => {
    const sorted = [...list].sort((a, b) => {
      const vA = a.version || 1;
      const vB = b.version || 1;
      if (vA !== vB) return vB - vA;
      return (b.timestamp || 0) - (a.timestamp || 0);
    });
    return {
      familyId: famId,
      kunde: sorted[0].kunde,
      latestOffer: sorted[0],
      versions: sorted,
    };
  });

  // 4. Sort families
  const sortedFamilies = familiesList.sort((a, b) => {
    if (offerSort === 'berater') {
      const nameA = (usersList || []).find((u) => String(u.id) === String(a.latestOffer.beraterId))?.name ||
                    config.beraterList?.find((ber) => String(ber.id) === String(a.latestOffer.beraterId))?.name || '';
      const nameB = (usersList || []).find((u) => String(u.id) === String(b.latestOffer.beraterId))?.name ||
                    config.beraterList?.find((ber) => String(ber.id) === String(b.latestOffer.beraterId))?.name || '';
      return nameA.localeCompare(nameB);
    }
    return (b.latestOffer.timestamp || 0) - (a.latestOffer.timestamp || 0);
  });

  const existingFolders = Array.from(new Set(visibleOffers.map(o => o.folder).filter(Boolean))) as string[];

  return (
    <div className="p-3 md:p-8 bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 min-h-screen font-sans">
      
      {/* CLOUD CONNECTIVITY STATUS INDICATOR */}
      <div id="cloud-status" className="fixed top-4 right-4 text-[9px] font-bold uppercase tracking-widest z-50 flex flex-col items-end gap-1">
        <div className="flex items-center gap-2 bg-white/90 dark:bg-black/80 p-2 px-3 rounded-full shadow-lg border dark:border-darkBorder">
          <span className="text-slate-500">{cloudStatus}</span>
          <div className={`w-2 h-2 rounded-full ${cloudStatusColor}`} />
        </div>
      </div>

      <div id="app" className="max-w-4xl mx-auto relative pt-4 lg:pt-0">
        
        {/* Navigation / Header */}
        <Navigation
          activeTab={activeTab}
          setActiveTab={handleTabSwitch}
          dark={dark}
          toggleDark={() => setDark((prev) => !prev)}
          onLogout={handleLogout}
          isAdmin={userProfile?.role === 'admin' || userProfile?.role === 'sys-admin'}
        />

        {/* Dynamic Panels container */}
        <main className="mt-4 duration-200">
          {activeTab === 'calc' && (
            <CalculatorTab
              stones={stones}
              config={config}
              parts={parts}
              setParts={setParts}
              selectedStoneId={selectedStoneId || stones[0]?.id || ''}
              setSelectedStoneId={setSelectedStoneId}
              miterInput={miterInput}
              setMiterInput={setMiterInput}
              underCount={underCount}
              flushCount={flushCount}
              topCount={topCount}
              notchCount={notchCount}
              holeCount={holeCount}
              gluingCheck={gluingCheck}
              setGluingCheck={setGluingCheck}
              activeServices={activeServices}
              toggleService={(srv) =>
                setActiveServices((prev) => ({ ...prev, [srv]: !prev[srv] }))
              }
              onSaveStat={handleSaveStat}
              onResetCalculator={() => {
                setMiterInput('');
                setGluingCheck(false);
                setActiveServices({ measure: true, delivery: true });
                setParts([{ id: Date.now(), name: 'Platte 1', l: '', w: '', edges: { v: true, h: false, l: false, r: false } }]);
              }}
              openLightbox={(img) => {
                setLightboxImg(img);
                setLightboxOpen(true);
              }}
              personalFactors={personalFactors}
            />
          )}

          {activeTab === 'gallery' && (
            <GalleryTab
              stones={stones}
              config={config}
              compareList={compareList}
              toggleCompare={handleToggleCompare}
              selectedStoneId={selectedStoneId || stones[0]?.id || ''}
              selectFromGallery={(id) => {
                setSelectedStoneId(id);
                setActiveTab('calc');
              }}
              openLightbox={(img) => {
                setLightboxImg(img);
                setLightboxOpen(true);
              }}
              personalStats={userProfile?.stats}
            />
          )}

          {activeTab === 'kitchen' && (
            <KitchenTab
              kitchen={kitchen}
              setKitchen={setKitchen}
              config={config}
              onOpenOffersModal={() => setOffersModalOpen(true)}
              onPullSelectedStonePrice={pullSelectedStonePrice}
              onResetKitchen={() => {
                requestConfirm('Kalkulation leeren?', 'Möchtest du die Küchenkalkulation wirklich komplett zurücksetzen?', () => {
                  setKitchen({
                    offerId: null,
                    kunde: '',
                    beraterId: '',
                    front1: '',
                    front2: '',
                    griff: '',
                    apName: '',
                    hauspreis: '',
                    ekMoebel: '',
                    rabattMoebel: '',
                    rabattMiele: '',
                    geraete: [{ id: Date.now(), name: '', val: '' }],
                    miele: [{ id: Date.now() + 1, name: '', val: '' }],
                    spuele: [{ id: Date.now() + 3, name: '', val: '' }],
                    wasser: [{ id: Date.now() + 2, name: '', val: '' }],
                    mehrpreise: [{ id: Date.now() + 4, name: '', val: '' }],
                    steinVK: '',
                    steinEK: '',
                    zubehoer: '',
                    showMoebelEK: true,
                    optKuechenText: true,
                    optBallerina: true,
                    optAnschluss: true,
                    optAnschlussRabatt: false,
                    optNachtext: true,
                  });
                });
              }}
              onSaveOffer={handleOpenSaveModal}
              onGeneratePDF={triggerPDFGeneration}
              onGeneratePDFPreview={triggerPDFPreview}
              onImportCaratXLSX={handleImportCaratXLSX}
              personalFactors={personalFactors}
              usersList={usersList}
            />
          )}

          {(activeTab === 'admin' && (userProfile?.role === 'admin' || userProfile?.role === 'sys-admin')) && (
            <AdminTab
              stones={stones}
              config={config}
              onUpdateConfig={(key, val) => setConfig((prev) => ({ ...prev, [key]: val }))}
              onAddStone={() => {
                setStones((prev) => [
                  ...prev,
                  { id: generateId(), name: 'Neuer Stein...', price: 0, isDekton: false, image: '' },
                ]);
              }}
              onUpdateStone={(id, field, val) => {
                setStones((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: val } : s)));
              }}
              onDeleteStone={(id) => {
                setStones((prev) => prev.filter((s) => s.id !== id));
              }}
              onPushToCloud={pushToCloud}
              onFactoryReset={factoryResetCloud}
              usersList={usersList}
              onUpdateUserRole={handleUpdateUserRole}
              onUpdateUserFactors={handleUpdateUserFactors}
              onUpdateUserName={handleUpdateUserName}
              onUpdateUserEmail={handleUpdateUserEmail}
              onUpdateUserPhone={handleUpdateUserPhone}
              onAddPreRegisteredUser={handleAddPreRegisteredUser}
              onDeleteUserProfile={handleDeleteUserProfile}
              currentUserUid={currentUser?.uid}
              currentUserRole={userProfile?.role}
              onBackupMaterialsConfig={downloadMaterialsConfigBackup}
              onRestoreMaterialsConfig={importMaterialsConfigBackup}
              onBackupOffers={downloadOffersBackup}
              onRestoreOffers={importOffersBackup}
              offersCount={offersList.length}
            />
          )}
        </main>

        {/* MODALS */}

        {/* 1. OFFERS DATABASE ARCHIVE LIST DIALOGUE */}
        {offersModalOpen && (
          <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#121212] w-full max-w-6xl h-[85vh] max-h-[90vh] md:max-h-[800px] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
              <div className="p-4 md:p-6 border-b border-slate-200 dark:border-darkBorder flex justify-between items-center bg-slate-50 dark:bg-[#181818]">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">Cloud Archiv</h2>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Sicherheit in der Cloud: Strukturierte Ordner & durchgängige Versionierung</p>
                </div>
                <button
                  onClick={() => setOffersModalOpen(false)}
                  className="w-10 h-10 bg-slate-200 dark:bg-darkBorder rounded-full flex items-center justify-center text-slate-500 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* LEFT COLUMN: Folders Sidebar */}
                <div className="w-64 border-r border-slate-200 dark:border-darkBorder bg-slate-100/40 dark:bg-black/40 flex flex-col h-full shrink-0 hidden md:flex">
                  <div className="p-4 border-b border-slate-200 dark:border-darkBorder bg-slate-100/50 dark:bg-black/20 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">📁 Projekt-Ordner</span>
                    <button 
                      onClick={() => {
                        requestPrompt(
                          'Projektordner erstellen',
                          'Gib einen Namen für den neuen Projektordner ein:',
                          '',
                          'z.B. Projekt Schmidt',
                          async (name) => {
                            const trimmed = name.trim();
                            if (trimmed) {
                              await createFolder(trimmed);
                            }
                          }
                        );
                      }}
                      className="w-6 h-6 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 font-bold flex items-center justify-center text-xs"
                      title="Neuen Ordner erstellen"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
                    {/* 1. All Offers */}
                    <button
                      onClick={() => setActiveFolderFilter('all')}
                      className={`w-full text-left px-3 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition-colors ${
                        activeFolderFilter === 'all'
                          ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/20'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 shrink-0" />
                        <span>Alle Angebote</span>
                      </div>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${activeFolderFilter === 'all' ? 'bg-white/20' : 'bg-slate-200 dark:bg-zinc-800'}`}>
                        {visibleOffers.length}
                      </span>
                    </button>

                    {/* 2. Uncategorized */}
                    <button
                      onClick={() => setActiveFolderFilter('')}
                      className={`w-full text-left px-3 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition-colors ${
                        activeFolderFilter === ''
                          ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/20'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4 shrink-0 text-amber-500/70" />
                        <span>Ohne Ordner</span>
                      </div>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${activeFolderFilter === '' ? 'bg-white/20' : 'bg-slate-200 dark:bg-zinc-800'}`}>
                        {visibleOffers.filter(o => !o.folder).length}
                      </span>
                    </button>

                    {/* Divider */}
                    <div className="border-t border-slate-200 dark:border-darkBorder my-2" />

                    {/* 3. Custom Folders */}
                    {dbFolders.map((folderName) => {
                      const count = visibleOffers.filter(o => o.folder === folderName).length;
                      return (
                        <div
                          key={folderName}
                          className={`group flex items-center justify-between rounded-xl transition-all ${
                            activeFolderFilter === folderName
                              ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/20'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-950'
                          }`}
                        >
                          <button
                            onClick={() => setActiveFolderFilter(folderName)}
                            className="flex-1 text-left px-3 py-2.5 font-bold text-xs flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap"
                          >
                            <Folder className="w-4 h-4 shrink-0 text-blue-400 group-hover:scale-110 transition-transform" />
                            <span className="truncate">{folderName}</span>
                          </button>
                          
                          <div className="flex items-center gap-1.5 pr-2.5 shrink-0">
                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${activeFolderFilter === folderName ? 'bg-white/20' : 'bg-slate-200 dark:bg-zinc-800'}`}>
                              {count}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); renameFolder(folderName); }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-opacity"
                              title="Ordner umbenennen"
                            >
                              <Pencil className="w-3 h-3 text-slate-400 hover:text-blue-500" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteFolderFromCloud(folderName); }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-opacity"
                              title="Ordner auflösen"
                            >
                              <Trash2 className="w-3 h-3 text-red-500/80 hover:text-red-500" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* RIGHT COLUMN: Search + Filters + Grouped Offers List */}
                <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-[#0c0c0e]">
                  {/* Filter search line */}
                  <div className="p-4 md:px-6 bg-slate-100 dark:bg-black border-b border-slate-200 dark:border-darkBorder flex flex-col md:flex-row gap-3 items-center">
                    {/* Folder Mobile Dropdown selector (only displays under md) */}
                    <div className="w-full md:hidden flex gap-2">
                      <select
                        value={activeFolderFilter}
                        onChange={(e) => setActiveFolderFilter(e.target.value)}
                        className="w-full bg-white dark:bg-darkCard border border-slate-200 dark:border-darkBorder rounded-xl px-4 py-2.5 text-xs font-black outline-none tracking-widest uppercase cursor-pointer text-slate-800 dark:text-white"
                      >
                        <option value="all">📁 Alle Ordner ({visibleOffers.length})</option>
                        <option value="">📂 Ohne Ordner ({visibleOffers.filter(o => !o.folder).length})</option>
                        {dbFolders.map(folderName => (
                          <option key={folderName} value={folderName}>📁 {folderName} ({visibleOffers.filter(o => o.folder === folderName).length})</option>
                        ))}
                      </select>
                    </div>

                    <div className="relative flex-1 w-full">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={offerSearch}
                        onChange={(e) => setOfferSearch(e.target.value)}
                        placeholder="Suchen nach Kunde oder Kommission..."
                        className="w-full bg-white dark:bg-darkCard border border-slate-200 dark:border-darkBorder rounded-xl pl-9 pr-4 py-2 text-sm outline-none focus:border-blue-500 text-slate-900 dark:text-white"
                      />
                    </div>
                    
                    <div className="flex gap-2 w-full md:w-auto shrink-0">
                      <select
                        value={offerBeraterFilter}
                        onChange={(e) => setOfferBeraterFilter(e.target.value)}
                        className="bg-white dark:bg-darkCard border border-slate-200 dark:border-darkBorder rounded-xl px-3 py-2 text-sm outline-none text-slate-8 w-36 cursor-pointer text-slate-800 dark:text-white"
                      >
                        <option value="all">Alle Berater</option>
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
                              <option key={u.id} value={u.id}>
                                {u.name}
                              </option>
                            ))
                        ) : (
                          (config.beraterList || []).map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))
                        )}
                      </select>
                      <select
                        value={offerSort}
                        onChange={(e) => setOfferSort(e.target.value)}
                        className="bg-white dark:bg-darkCard border border-slate-200 dark:border-darkBorder rounded-xl px-3 py-2 text-sm outline-none text-slate-8 w-44 cursor-pointer text-slate-800 dark:text-white"
                      >
                        <option value="newest">Neueste zuerst</option>
                        <option value="berater">Nach Berater A-Z</option>
                      </select>
                    </div>
                  </div>

                  {/* Scrollable list items */}
                  <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                    {sortedFamilies.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <Folder className="w-12 h-12 stroke-1 text-slate-350 dark:text-slate-700 mb-3" />
                        <p className="text-sm font-bold">Keine Angebote in dieser Auswahl gefunden.</p>
                        <p className="text-xs text-slate-500 mt-1">Ändere den Filter oder erstelle eine neue Küchenkalkulation.</p>
                      </div>
                    ) : (
                      sortedFamilies.map((fam) => {
                        const lat = fam.latestOffer;
                        const foundBerater = (usersList || []).find((u) => String(u.id) === String(lat.beraterId)) ||
                                             (config.beraterList || []).find((b) => String(b.id) === String(lat.beraterId));
                        const isExpanded = !!expandedFamilies[fam.familyId];
                        const olderVersions = fam.versions.slice(1);

                        return (
                          <div
                            key={fam.familyId}
                            className="bg-white dark:bg-darkCard border border-slate-200 dark:border-darkBorder rounded-2xl overflow-hidden transition-all duration-300 shadow-sm hover:border-blue-500/60"
                          >
                            {/* PRIMARY CARD ROW (LATEST VERSION) */}
                            <div className="p-4 md:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/50 dark:bg-[#121214]/50">
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <h3 className="font-extrabold text-slate-800 dark:text-white text-base tracking-tight leading-none mr-2">
                                    {fam.kunde}
                                  </h3>
                                  
                                  {/* Active Version badge */}
                                  <span className="text-[9px] font-black uppercase text-blue-555 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                                    V{(lat.version || 1)} (Neueste)
                                  </span>

                                  {/* Interactive Folder Selector */}
                                  <div className="flex items-center gap-1.5 bg-amber-500/5 border border-amber-500/15 px-2 py-0.5 rounded-full">
                                    <Folder className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                    <select
                                      value={lat.folder || ''}
                                      onChange={async (e) => {
                                        await moveOfferFamilyToFolder(fam.familyId, e.target.value);
                                      }}
                                      className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 bg-transparent border-none p-0 outline-none cursor-pointer focus:ring-0 max-w-[120px] md:max-w-[150px] truncate"
                                      title="Ordner zuweisen"
                                    >
                                      <option value="" className="text-slate-800 dark:text-black font-semibold bg-white dark:bg-zinc-900">(Kein Ordner)</option>
                                      {dbFolders.map(folderName => (
                                        <option key={folderName} value={folderName} className="text-slate-800 dark:text-black font-semibold bg-white dark:bg-zinc-900">{folderName}</option>
                                      ))}
                                      <option value="__NEW__" className="text-blue-500 dark:text-blue-400 font-bold bg-white dark:bg-zinc-900">+ Neuer Ordner...</option>
                                    </select>
                                  </div>

                                  {/* Comment preview if exists */}
                                  {lat.versionComment && (
                                    <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-zinc-800 px-2 py-0.5 rounded-full max-w-xs truncate" title={lat.versionComment}>
                                      "{lat.versionComment}"
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-3 text-[10px] uppercase font-bold text-slate-400 tracking-widest leading-none mt-1">
                                  <span>{new Date(lat.timestamp).toLocaleDateString()}</span>
                                  <span>•</span>
                                  <span className="text-blue-500">{foundBerater?.name || 'Ohne Berater'}</span>
                                  <span>•</span>
                                  <span className="text-emerald-500 font-black">
                                    {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(lat.totalVK)}
                                  </span>
                                </div>
                              </div>

                              {/* Primary Card Actions */}
                              <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                                <button
                                  onClick={() => loadOffer(lat.id)}
                                  className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                                >
                                  Laden
                                </button>
                                <button
                                  onClick={() => deleteOfferFromCloud(lat.id, `${lat.kunde} V${lat.version}`)}
                                  className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-900 active:scale-90 transition-all cursor-pointer"
                                  title="Diese Version löschen"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                
                                {/* EXPAND OLDER VERSIONS BUTTON */}
                                {olderVersions.length > 0 && (
                                  <button
                                    onClick={() => setExpandedFamilies(prev => ({ ...prev, [fam.familyId]: !prev[fam.familyId] }))}
                                    className="flex items-center gap-1 px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-xl text-[10px] font-extrabold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-zinc-850 uppercase tracking-widest cursor-pointer transition-all"
                                  >
                                    <History className="w-3.5 h-3.5" />
                                    <span>Verlauf ({olderVersions.length})</span>
                                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* COLLAPSIBLE VERSION HISTORY COMPLEMENT */}
                            {isExpanded && olderVersions.length > 0 && (
                              <div className="border-t border-slate-150 dark:border-zinc-900 bg-slate-50/50 dark:bg-black/25 px-4 py-3 divide-y divide-slate-100 dark:divide-zinc-900/40">
                                {olderVersions.map((ver) => {
                                  const verBerater = (usersList || []).find((u) => String(u.id) === String(ver.beraterId)) ||
                                                     (config.beraterList || []).find((b) => String(b.id) === String(ver.beraterId));
                                  return (
                                    <div
                                      key={ver.id}
                                      className="py-2.5 flex items-center justify-between text-xs gap-4 hover:bg-slate-200/20 dark:hover:bg-white/5 px-2 rounded-xl transition-colors"
                                    >
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                          <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                            V{ver.version || 1}
                                          </span>
                                          {ver.versionComment && (
                                            <span className="font-medium text-slate-600 dark:text-slate-400 italic text-[11px] truncate max-w-md">
                                              "{ver.versionComment}"
                                            </span>
                                          )}
                                        </div>
                                        
                                        <div className="flex items-center gap-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">
                                          <span>{new Date(ver.timestamp).toLocaleDateString()} {new Date(ver.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                          <span>•</span>
                                          <span>{verBerater?.name || 'Ohne Berater'}</span>
                                          <span>•</span>
                                          <span className="text-emerald-500 font-black">
                                            {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(ver.totalVK)}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Older version actions */}
                                      <div className="flex items-center gap-1 shrink-0">
                                        <button
                                          onClick={() => loadOffer(ver.id)}
                                          className="text-[9px] font-black uppercase tracking-widest text-blue-500 hover:text-white hover:bg-blue-600 bg-blue-500/10 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all text-center cursor-pointer"
                                        >
                                          Laden
                                        </button>
                                        <button
                                          onClick={() => deleteOfferFromCloud(ver.id, `${ver.kunde} V${ver.version}`)}
                                          className="text-slate-400 hover:text-red-500 p-1.5 rounded hover:bg-slate-200 dark:hover:bg-zinc-800 active:scale-90 transition-all cursor-pointer"
                                          title="Diese Version löschen"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SAVE OFFER OPTIONS DIALOGUE */}
        {saveOfferModalOpen && (
          <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#121212] w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-darkBorder overflow-hidden flex flex-col">
              {/* Dialog Header */}
              <div className="p-5 border-b border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-[#181818] flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Angebot sichern</h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">Cloud-Speicherung & Versionierung</p>
                </div>
                <button
                  onClick={() => setSaveOfferModalOpen(false)}
                  className="w-8 h-8 bg-slate-200 dark:bg-darkBorder rounded-full flex items-center justify-center text-slate-500 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Content Form */}
              <div className="p-6 space-y-4">
                {/* Customer name info */}
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Kundenname / Kommission</label>
                  <div className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-darkBorder/60 rounded-xl px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 font-black">
                    {kitchen.kunde}
                  </div>
                </div>

                {/* Folder Selection assignment */}
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Ordner-Verzeichnis</label>
                  <div className="space-y-2">
                    <select
                      value={saveFolder}
                      onChange={(e) => setSaveFolder(e.target.value)}
                      className="w-full bg-white dark:bg-darkCard border border-slate-200 dark:border-darkBorder rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 text-slate-800 dark:text-white cursor-pointer"
                    >
                      <option value="">(Kein Ordner / Hauptverzeichnis)</option>
                      {existingFolders.map((folderName) => (
                        <option key={folderName} value={folderName}>{folderName}</option>
                      ))}
                      <option value="__NEW__">+ Neuen Ordner erstellen...</option>
                    </select>

                    {saveFolder === '__NEW__' && (
                      <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Name des neuen Ordners..."
                        className="w-full bg-white dark:bg-darkCard border-2 border-blue-500 rounded-xl px-4 py-2 text-sm outline-none text-slate-900 dark:text-white"
                        autoFocus
                      />
                    )}
                  </div>
                </div>

                {/* Intelligent Version choices if loaded offer exists */}
                {kitchen.offerId && offersList.some(x => x.id === kitchen.offerId) && (
                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 space-y-3">
                    <div className="text-[10px] font-black uppercase text-blue-500 dark:text-blue-400 tracking-widest font-bold">Versionierung</div>
                    <div className="flex flex-col gap-2.5">
                      <label className="flex items-center gap-3 cursor-pointer text-xs font-bold uppercase tracking-wide select-none text-slate-700 dark:text-slate-350">
                        <input
                          type="radio"
                          name="versionChoice"
                          checked={saveVersionChoice === 'new_version'}
                          onChange={() => setSaveVersionChoice('new_version')}
                          className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <span>Neue Version (V{(offersList.filter(o => (o.parentOfferId || o.id) === (offersList.find(x => x.id === kitchen.offerId)?.parentOfferId || kitchen.offerId)).reduce((max, o) => Math.max(max, o.version || 1), 1) + 1)}) speichern</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer text-xs font-bold uppercase tracking-wide select-none text-slate-700 dark:text-slate-350">
                        <input
                          type="radio"
                          name="versionChoice"
                          checked={saveVersionChoice === 'overwrite'}
                          onChange={() => setSaveVersionChoice('overwrite')}
                          className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <span>Bestehende Version (V{offersList.find(x => x.id === kitchen.offerId)?.version || 1}) überschreiben</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Comment option */}
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Änderungsnotiz / Notiz (optional)</label>
                  <textarea
                    value={saveVersionComment}
                    onChange={(e) => setSaveVersionComment(e.target.value)}
                    placeholder="z.B. Variante mit glänzender Kante, geänderte Geräte..."
                    rows={2}
                    className="w-full bg-white dark:bg-darkCard border border-slate-200 dark:border-darkBorder rounded-xl px-4 py-2 text-xs outline-none focus:border-blue-500 text-slate-900 dark:text-white resize-none"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="p-5 border-t border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-[#181818] flex justify-end gap-3">
                <button
                  onClick={() => setSaveOfferModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-darkBorder text-slate-700 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => {
                    const finalFolder = saveFolder === '__NEW__' ? newFolderName : saveFolder;
                    saveOfferToCloud({
                      folder: finalFolder,
                      versionChoice: saveVersionChoice,
                      comment: saveVersionComment
                    });
                  }}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-blue-555 transition-colors cursor-pointer"
                >
                  Sichern
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. DOCK SIDE COMPARISON POPUP SCREEN */}
        {compareModalOpen && (
          <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 lg:p-10">
            <div className="bg-white dark:bg-[#121212] w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-full">
              <div className="p-4 md:p-6 border-b border-slate-200 dark:border-darkBorder flex justify-between items-center bg-slate-50 dark:bg-[#181818]">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">Direkt-Vergleich</h2>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Kalkuliert mit deiner aktuellen Stückliste</p>
                </div>
                <button
                  onClick={() => {
                    setCompareModalOpen(false);
                    setCompareList([]);
                  }}
                  className="w-10 h-10 bg-slate-200 dark:bg-darkBorder rounded-full flex items-center justify-center text-slate-500 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col md:flex-row gap-6 md:gap-10">
                {[compareList[0], compareList[1]].map((id, index) => {
                  const s = stones.find((x) => x.id === id);
                  if (!s) return null;

                  // recalc
                  const isDek = s.isDekton === true || s.isDekton === 'true';
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
                    if (p.edges.r) totalLfm += w / 100;
                  });

                  const miterMeters = (parseFloat(miterInput.replace(',', '.')) || 0) / 100;
                  const gluingCost = gluingCheck ? (config.gluing || 0) : 0;

                  const sumMat = totalSqm * s.price;
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
                  const vk = ek * config.factor;

                  return (
                    <div key={id} className="flex-1 bg-slate-50 dark:bg-zinc-900/40 border border-slate-150 dark:border-zinc-800/80 rounded-2xl p-4 md:p-6 flex flex-col justify-between">
                      <div>
                        {/* Compact Row Header */}
                        <div className="flex items-center gap-4 text-left border-b border-slate-200 dark:border-zinc-800/80 pb-4">
                          <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-black border border-slate-200 dark:border-darkBorder shadow-sm shrink-0 relative">
                            {s.image ? (
                              <img src={s.image.startsWith('http') || s.image.startsWith('data:') ? s.image : `images/${s.image}`} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <span className="text-[9px] text-slate-400 font-extrabold uppercase">Kein Bild</span>
                            )}
                            <span className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full border border-white/20 ${s.isDekton ? 'bg-red-500' : 'bg-emerald-500'}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest text-white mb-1 ${s.isDekton ? 'bg-red-500' : 'bg-emerald-500'}`}>
                              {s.isDekton ? 'Dekton' : 'Naturstein'}
                            </span>
                            <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white truncate leading-tight" title={s.name}>
                              {s.name}
                            </h3>
                            <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                              Basis: {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(s.price)} / m²
                            </p>
                          </div>
                        </div>

                        {/* Detailed Calculation Breakdown */}
                        <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                          <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-100 dark:border-zinc-800/50">
                            <span>Material ({totalSqm.toFixed(2)} m²)</span>
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(sumMat * config.factor)}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-100 dark:border-zinc-800/50">
                            <span>Kanten ({totalLfm.toFixed(2)} lfm)</span>
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(sumEdge * config.factor)}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-100 dark:border-zinc-800/50">
                            <span>Ausschnitte & Bohrungen</span>
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(sumCut * config.factor)}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-100 dark:border-zinc-800/50">
                            <span>Zusatz & Service</span>
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(sumExtra * config.factor)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Main Price Box & Choice Button */}
                      <div>
                        <div className="w-full bg-blue-500/10 dark:bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 mt-6 mb-4 relative overflow-hidden text-center shrink-0">
                          <div className="absolute inset-0 bg-blue-500/5" />
                          <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-0.5 relative">Verkaufspreis Brutto (Gesamt)</p>
                          <p className="text-2xl md:text-3xl font-black text-blue-500 font-mono relative">
                            {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(vk)}
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedStoneId(id);
                            setCompareModalOpen(false);
                            setCompareList([]);
                            setActiveTab('calc');
                          }}
                          className="w-full py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-98 transition-all shadow-md text-[10px] cursor-pointer shrink-0"
                        >
                          Diesen Stein wählen
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 3. LIGHTBOX ASSETS ZOOM ENLARGER */}
        {lightboxOpen && (
          <div
            className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setLightboxOpen(false)}
          >
            <img
              src={lightboxImg.startsWith('http') || lightboxImg.startsWith('data:') ? lightboxImg : `images/${lightboxImg}`}
              className="max-w-full max-h-full rounded-2xl shadow-2xl transition-transform duration-300 object-contain"
              alt=""
            />
            <button className="absolute top-6 right-6 text-white bg-white/10 p-4 rounded-full hover:bg-white/20 backdrop-blur-sm shadow-lg leading-none text-xl">
              ✕
            </button>
          </div>
        )}

        {/* 5. CUSTOM CONFIRM DIALOG */}
        {confirmDialog?.isOpen && (
          <div className="fixed inset-0 z-[600] bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
            <div className="card p-6 md:p-8 max-w-sm w-full shadow-2xl bg-white dark:bg-[#121212] border border-slate-200 dark:border-darkBorder rounded-3xl">
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-red-500/10 dark:bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚠️</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {confirmDialog.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  {confirmDialog.message}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="py-3 rounded-xl font-bold text-xs uppercase tracking-widest bg-slate-100 hover:bg-slate-200 dark:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer text-center"
                >
                  Abbrechen
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className="py-3 rounded-xl font-bold text-xs uppercase tracking-widest bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20 transition-all active:scale-95 cursor-pointer text-center"
                >
                  Bestätigen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 6. CUSTOM PROMPT DIALOG */}
        {promptDialog?.isOpen && (
          <div className="fixed inset-0 z-[600] bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
            <div className="card p-6 md:p-8 max-w-sm w-full shadow-2xl bg-white dark:bg-[#121212] border border-slate-200 dark:border-darkBorder rounded-3xl">
              <div className="text-center mb-5">
                <div className="w-14 h-14 bg-blue-500/10 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Folder className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {promptDialog.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  {promptDialog.message}
                </p>
              </div>

              <div className="mb-6">
                <input
                  type="text"
                  value={promptInputValue}
                  onChange={(e) => setPromptInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      promptDialog.onConfirm(promptInputValue);
                    }
                  }}
                  placeholder={promptDialog.placeholder}
                  className="w-full bg-slate-50 dark:bg-darkCard border border-slate-200 dark:border-darkBorder rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 text-slate-900 dark:text-white"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPromptDialog(null)}
                  className="py-3 rounded-xl font-bold text-xs uppercase tracking-widest bg-slate-100 hover:bg-slate-200 dark:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer text-center"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => promptDialog.onConfirm(promptInputValue)}
                  className="py-3 rounded-xl font-bold text-xs uppercase tracking-widest bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all active:scale-95 cursor-pointer text-center"
                >
                  Speichern
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PDF PREVIEW MODAL */}
        {pdfPreviewUrl && (
          <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#121212] w-full max-w-5xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-darkBorder">
              <div className="p-4 md:p-6 border-b border-slate-200 dark:border-darkBorder flex justify-between items-center bg-slate-50 dark:bg-[#181818]">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                    Dokumenten-Vorschau
                  </h2>
                  <p className="text-[10px] text-slate-505 uppercase tracking-widest font-bold mt-1">
                    Echtzeit-Prüfung: 1:1 identisch zum finalen Druck
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={triggerPDFGeneration}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold uppercase tracking-wide cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    PDF Herunterladen
                  </button>
                  <button
                    onClick={() => {
                      URL.revokeObjectURL(pdfPreviewUrl);
                      setPdfPreviewUrl(null);
                    }}
                    className="w-10 h-10 bg-slate-200 dark:bg-darkBorder rounded-full flex items-center justify-center text-slate-500 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="flex-1 bg-slate-100 dark:bg-[#08080a] relative flex items-center justify-center">
                <iframe
                  src={`${pdfPreviewUrl}#toolbar=0&navpanes=0`}
                  className="w-full h-full border-0"
                  title="PDF Vorschau"
                />
              </div>
            </div>
          </div>
        )}

        {/* LOADING STATE SPINNER */}
        {isPreviewLoading && (
          <div className="fixed inset-0 z-[600] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#121212] p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4 border border-slate-200 dark:border-darkBorder animate-fadeIn">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">PDF wird gerendert...</p>
            </div>
          </div>
        )}

        {/* Floating alerts toasts */}
        {toastVisible && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[500] animate-bounce-short">
            <div className="bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl font-bold text-sm border border-white/10 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <span>{toastText}</span>
            </div>
          </div>
        )}

      </div>

      {/* TEAM SIGN-IN SCREEN IN CASE OF SIGNED-OUT */}
      {!currentUser && (
        <div id="login-overlay" className="fixed inset-0 z-[1000] bg-slate-50 dark:bg-[#000000] flex items-center justify-center p-4">
          <div className="card p-8 max-w-sm w-full shadow-2xl bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#262626] rounded-3xl">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-black dark:bg-white rounded-2xl overflow-hidden flex items-center justify-center shadow-lg border border-white/10 mx-auto mb-4">
                <img src="/apple-touch-icon.png" className="w-full h-full object-cover" alt="LithoScale Pro Logo" referrerPolicy="no-referrer" />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                LithoScale <span className="text-blue-500">PRO</span>
              </h2>
              <p className="text-xs text-slate-500 mt-2 uppercase tracking-widest font-bold">Team-Login</p>
            </div>

            <div className="space-y-4">
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="E-Mail Adresse"
                className="input-field w-full text-center text-slate-900 dark:text-white"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Passwort"
                className="input-field w-full text-center text-slate-900 dark:text-white"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
              <button
                onClick={handleLogin}
                className="w-full py-3.5 mt-4 rounded-xl font-black text-sm uppercase tracking-widest bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 cursor-pointer transition-all"
              >
                Anmelden
              </button>
            </div>

            {loginError && <p className="text-[10px] text-red-500 font-bold mt-4 text-center">{loginError}</p>}

            <div className="mt-6 text-center text-[10px] font-bold text-slate-400 flex justify-center gap-3 select-none">
              <a href="https://www.fs-kuechen.de/impressum" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors uppercase tracking-widest">
                Impressum
              </a>
              <span className="text-slate-300 dark:text-darkBorder">|</span>
              <a href="https://www.fs-kuechen.de/datenschutz" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors uppercase tracking-widest">
                Datenschutz
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
