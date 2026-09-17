/**
 * LithoScale PRO - Data Models & Default Values
 */

export type StoneMaterialType = 'natur' | 'dekton' | 'neolith';

export interface Stone {
  id: string;
  name: string;
  price: number;
  isDekton: boolean;
  isNeolith?: boolean;
  materialType?: StoneMaterialType;
  image: string;
}

export function getStoneMaterial(stone: Stone | null | undefined): StoneMaterialType {
  if (!stone) return 'natur';
  if (stone.materialType === 'neolith' || stone.isNeolith === true || (stone as any).isNeolith === 'true') {
    return 'neolith';
  }
  if (stone.materialType === 'dekton' || stone.isDekton === true || (stone as any).isDekton === 'true') {
    return 'dekton';
  }
  return 'natur';
}

export function getStoneMaterialLabel(stone: Stone | null | undefined): string {
  const mat = getStoneMaterial(stone);
  if (mat === 'neolith') return 'Neolith';
  if (mat === 'dekton') return 'Dekton';
  return 'Naturstein';
}

export interface Berater {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export interface AppConfig {
  factor: number;
  measure: number;
  delivery: number;
  gluing: number;
  natEdge: number;
  dekEdge: number;
  neoEdge?: number;
  natCutUnder: number;
  natCutFlush: number;
  natCutTop: number;
  dekCutUnder: number;
  dekCutFlush: number;
  dekCutTop: number;
  neoCutUnder?: number;
  neoCutFlush?: number;
  neoCutTop?: number;
  notch: number;
  natNotch: number;
  dekNotch: number;
  neoNotch?: number;
  natPflegeset: number;
  dekReinigungsmittel: number;
  neoReinigungsmittel?: number;
  hole: number;
  miter: number;
  moebelFactor: number;
  maxRabattMoebel?: number;
  maxRabattMiele?: number;
  stats: {
    dekton: number[];
    natur: number[];
  };
  beraterList: Berater[];
  pdfLogo: string;
  pdfKuechenText: string;
  pdfBallerinaText: string;
  pdfAnschlussText: string;
  pdfAnschlussRabattText: string;
  pdfNachtext: string;
  pdfFooter: string;
  importMiele: string;
  importSpuele: string;
  importWasser: string;
  importStein: string;
  importGeraete: string;
  importBlancoChoiceArt1: string;
  importBlancoChoiceArt2: string;
  importBlancoChoiceArticles?: string;
  importMoebel: string;
}

export interface Part {
  id: number;
  name: string;
  l: string; // stored as string to support raw inputs in inputs before converting
  w: string;
  edges: {
    v: boolean;
    h: boolean;
    l: boolean;
    r: boolean;
  };
  flush?: number;   // Flächenbündig
  under?: number;   // Unterbau
  top?: number;     // Auflage
  notch?: number;   // Ausklinkungen
  hole?: number;    // Bohrungen
  care?: number;    // Pflegeset/Reinigungsmittel
  miter?: string;   // Gehrung in cm
  gluing?: boolean; // Verkleben aktiv für diese Platte
}

export interface KitchenItem {
  id: number;
  name: string;
  val: string;
}

export interface KitchenVersionOption {
  id: string;
  slotIndex: number; // 0 = Basis, 1 = Option A, 2 = Option B
  fileName: string;
  apName: string;
  ekMoebel: string;
  steinVK: string;
  steinEK: string;
  hauspreis: string;
  mieleVK: number;
  wasserVK: number;
  totalCalculatedVK: number;
  finalDisplayVK: number;
  timestamp: number;
  kitchenData: Kitchen;
}

export interface Kitchen {
  offerId: string | null;
  kunde: string;
  beraterId: string;
  front1: string;
  front2: string;
  griff: string;
  apName: string;
  hauspreis: string;
  ekMoebel: string;
  rabattMoebel: string;
  rabattMiele: string;
  geraete: KitchenItem[];
  miele: KitchenItem[];
  spuele: KitchenItem[];
  wasser: KitchenItem[];
  mehrpreise: KitchenItem[];
  steinVK: string;
  steinEK: string;
  zubehoer: string;
  showMoebelEK: boolean;
  optKuechenText: boolean;
  optBallerina: boolean;
  optAnschluss: boolean;
  optAnschlussRabatt: boolean;
  optNachtext: boolean;
  versionOptions?: KitchenVersionOption[];
}

export interface Offer {
  id: string;
  kunde: string;
  beraterId: string;
  timestamp: number;
  totalVK: number;
  kitchen: Kitchen;
  parts: Part[];
  stoneId: string;
  editor: string;
  folder?: string;           // Name of the folder
  parentOfferId?: string;    // ID of the root/family offer
  version?: number;          // Version index (1, 2, 3...)
  versionComment?: string;   // Optional version description / changes
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'sys-admin' | 'admin' | 'berater';
  createdAt: number;
  phone?: string;
  stats?: {
    dekton?: number[];
    natur?: number[];
  };
  customFactors?: {
    factor?: number; // VK-Faktor für Steine
    moebelFactor?: number; // Möbelfaktor
  };
  canUsePriceComparison?: boolean;
}

export interface SavedCalculation {
  id: string;
  name: string;
  stoneId: string;
  stoneName: string;
  isDekton: boolean;
  isNeolith?: boolean;
  materialType?: StoneMaterialType;
  parts: Part[];
  miterInput: string;
  gluingCheck: boolean;
  activeServices: { measure: boolean; delivery: boolean };
  ek: number;
  vk: number;
  timestamp: number;
  userId?: string;
}

export const DEFAULTS: { stones: Omit<Stone, "id">[]; config: AppConfig } = {
  stones: [
    { name: "Marinace Black 2cm", price: 325, isDekton: false, image: "" },
    { name: "Morpheus", price: 652, isDekton: true, image: "" },
    { name: "Steel Grey 226", price: 226, isDekton: false, image: "" },
    { name: "Laurent", price: 456, isDekton: true, image: "" },
    { name: "Kairos", price: 384, isDekton: true, image: "" },
    { name: "Domoos", price: 576, isDekton: true, image: "" },
    { name: "Café Imperial", price: 275, isDekton: false, image: "" },
    { name: "Breccia Imperiale", price: 395, isDekton: false, image: "" },
    { name: "Albarium", price: 576, isDekton: true, image: "" },
    { name: "Sandik", price: 576, isDekton: true, image: "" },
    { name: "Adia", price: 576, isDekton: true, image: "" },
    { name: "Opera", price: 641, isDekton: true, image: "" },
    { name: "Reverie", price: 641, isDekton: true, image: "" },
    { name: "Via Lattea", price: 275, isDekton: false, image: "" },
    { name: "Lunar 22", price: 379, isDekton: true, image: "" },
    { name: "Tropical Storm", price: 395, isDekton: false, image: "" },
    { name: "Entzo", price: 641, isDekton: true, image: "" },
    { name: "Sirius PROMO", price: 380, isDekton: true, image: "" },
    { name: "Eter PROMO", price: 360, isDekton: true, image: "" },
    { name: "Danae", price: 384, isDekton: true, image: "" },
    { name: "Aeris", price: 384, isDekton: true, image: "" },
    { name: "REM PROMO", price: 465, isDekton: true, image: "" },
    { name: "Mont Blanc 542 poliert", price: 542, isDekton: false, image: "" },
    { name: "Sasea PG1", price: 495, isDekton: true, image: "" },
    { name: "Nacre PG1", price: 495, isDekton: true, image: "" },
    { name: "Taj Mahal poliert Südamerika", price: 495, isDekton: false, image: "" },
    { name: "Arga Stonika PG4", price: 750, isDekton: true, image: "" },
    { name: "Nero Assoluto", price: 245, isDekton: false, image: "" },
    { name: "Neolith Calacatta Silk", price: 580, isDekton: false, isNeolith: true, materialType: "neolith", image: "" },
    { name: "Neolith Abu Dhabi White Silk", price: 520, isDekton: false, isNeolith: true, materialType: "neolith", image: "" },
    { name: "Neolith Nero Marquina", price: 610, isDekton: false, isNeolith: true, materialType: "neolith", image: "" },
    { name: "Neolith Pietra di Luna", price: 440, isDekton: false, isNeolith: true, materialType: "neolith", image: "" }
  ],
  config: {
    factor: 1.5,
    measure: 100,
    delivery: 700,
    gluing: 250,
    natEdge: 15,
    dekEdge: 20,
    neoEdge: 20,
    natCutUnder: 137,
    natCutFlush: 137,
    natCutTop: 85,
    dekCutUnder: 177,
    dekCutFlush: 177,
    dekCutTop: 85,
    neoCutUnder: 177,
    neoCutFlush: 177,
    neoCutTop: 85,
    notch: 45,
    natNotch: 45,
    dekNotch: 45,
    neoNotch: 45,
    natPflegeset: 45,
    dekReinigungsmittel: 45,
    neoReinigungsmittel: 45,
    hole: 25,
    miter: 45,
    moebelFactor: 2.0,
    maxRabattMoebel: 5,
    maxRabattMiele: 3,
    stats: { dekton: [], natur: [] },
    beraterList: [
      { id: 1, name: "Max Müller", email: "max@musterfirma.de", phone: "01234 56789" },
      { id: 2, name: "Lisa Schmidt", email: "lisa@musterfirma.de", phone: "09876 54321" }
    ],
    pdfLogo: "",
    pdfKuechenText: "Vielen Dank für Ihren Besuch und das angenehme Planungsgespräch. Wir freuen uns sehr, Ihnen das folgende Angebot für Ihre neue Einbauküche unterbreiten zu dürfen.",
    pdfBallerinaText: "Qualität des Herstellers: Ballerina ist aktuell auf Platz 1 der deutschen Küchenhersteller und überzeugt mit einem robusten Korpus, 8mm starken geschraubten Rückwänden und 19mm starken Fachböden. Ebenso die kostenfreie Möglichkeit der farblichen Gestaltung des Innenkorpus sowie Glaszargen und Anti-Rutschmatten sind bei unseren Kunden sehr beliebt. Alle Schubkästen, Auszüge und Türen sind gedämpft. Die Belastbarkeit beträgt je nach Breite zwischen 50 kg und 80 kg. Ein entsprechendes Qualitäts-Zertifikat ist dieser E-Mail beigefügt.",
    pdfAnschlussText: "Die Anschlüsse für Wasser und Elektro werden separat in Höhe von 240,- EUR mit unserem zertifizierten Monteur vor Ort abgerechnet.",
    pdfAnschlussRabattText: "Damit Sie effektiv keinen Mehrpreis haben, ziehe ich Ihnen diese Summe immer vom Endpreis ab.",
    pdfNachtext: "Wir hoffen, unser Angebot sagt Ihnen zu und stehen für Rückfragen jederzeit gerne zur Verfügung.",
    pdfFooter: "Musterfirma GmbH | Musterstraße 1 | 12345 Musterstadt\nTelefon: 01234 56789 | E-Mail: info@musterfirma.de | Web: www.musterfirma.de",
    importMiele: "miele, miele class",
    importSpuele: "blanco, systemceram",
    importWasser: "quooker",
    importStein: "schellenbaum",
    importGeraete: "bosch, neff, siemens, berbel, naber",
    importBlancoChoiceArt1: "527656",
    importBlancoChoiceArt2: "527660",
    importBlancoChoiceArticles: "527656, 527660",
    importMoebel: "edition 700, concept130"
  }
};

/**
 * Extracts and normalizes all configured Blanco Choice article numbers from AppConfig.
 */
export function getBlancoChoiceArticleList(cfg?: Partial<AppConfig>): string[] {
  if (!cfg) return ['527656', '527660'];
  const rawList: string[] = [];
  if (cfg.importBlancoChoiceArt1) rawList.push(...cfg.importBlancoChoiceArt1.split(/[,;\s\n]+/));
  if (cfg.importBlancoChoiceArt2) rawList.push(...cfg.importBlancoChoiceArt2.split(/[,;\s\n]+/));
  if (cfg.importBlancoChoiceArticles) rawList.push(...cfg.importBlancoChoiceArticles.split(/[,;\s\n]+/));

  const cleaned = rawList
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);

  const unique: string[] = [];
  cleaned.forEach((item) => {
    if (!unique.includes(item)) {
      unique.push(item);
    }
  });

  return unique.length > 0 ? unique : ['527656', '527660'];
}

export function getMaterialRates(s: Stone | undefined, config: AppConfig) {
  const mat = getStoneMaterial(s);
  if (mat === 'neolith') {
    return {
      material: 'neolith' as const,
      materialLabel: 'Neolith',
      edgeRate: config.neoEdge ?? config.dekEdge ?? 20,
      rateFlush: config.neoCutFlush ?? config.dekCutFlush ?? 177,
      rateUnder: config.neoCutUnder ?? config.dekCutUnder ?? 177,
      rateTop: config.neoCutTop ?? config.dekCutTop ?? 85,
      rateNotch: config.neoNotch ?? config.dekNotch ?? config.notch ?? 45,
      rateCare: config.neoReinigungsmittel ?? config.dekReinigungsmittel ?? 45,
      isCareCleaner: true,
    };
  }
  if (mat === 'dekton') {
    return {
      material: 'dekton' as const,
      materialLabel: 'Dekton',
      edgeRate: config.dekEdge ?? 20,
      rateFlush: config.dekCutFlush ?? 177,
      rateUnder: config.dekCutUnder ?? 177,
      rateTop: config.dekCutTop ?? 85,
      rateNotch: config.dekNotch ?? config.notch ?? 45,
      rateCare: config.dekReinigungsmittel ?? 45,
      isCareCleaner: true,
    };
  }
  return {
    material: 'natur' as const,
    materialLabel: 'Naturstein',
    edgeRate: config.natEdge ?? 15,
    rateFlush: config.natCutFlush ?? 137,
    rateUnder: config.natCutUnder ?? 137,
    rateTop: config.natCutTop ?? 85,
    rateNotch: config.natNotch ?? config.notch ?? 45,
    rateCare: config.natPflegeset ?? 45,
    isCareCleaner: false,
  };
}

