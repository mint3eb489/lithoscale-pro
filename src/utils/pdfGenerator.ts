import { Kitchen, AppConfig, Part, UserProfile, DEFAULTS } from '../types';
import { findBeraterUser } from './beraterUtils';

interface PDFParams {
  kitchen: Kitchen;
  config: AppConfig;
  parts: Part[];
  totalVK: number;
  montage: number;
  vkStein: number;
  vkMiele: number;
  vkMoebel: number;
  usersList?: UserProfile[];
}

export async function generateKitchenPDF(
  params: PDFParams,
  showAlert: (msg: string) => void,
  mode: 'download' | 'blob' = 'download'
): Promise<string | void> {
  const { pdfMake } = window as any;
  if (!(window as any).pdfMake) {
    showAlert("PDF-Modul lädt noch, bitte kurz warten.");
    return;
  }

  showAlert(mode === 'blob' ? "Vorbereiten der PDF-Vorschau..." : "Erstelle PDF...");

  try {
    const k = params.kitchen;
    const config = params.config;
    
    // Setup virtual font system for pdfMake
    if ((window as any).pdfMakeFonts?.pdfMake?.vfs) {
      (window as any).pdfMake.vfs = (window as any).pdfMakeFonts.pdfMake.vfs;
    }

    const parseHTML = (htmlString: string) => {
      if (!htmlString) return [];
      const formattedStr = htmlString.replace(/\n/g, '<br>');
      try {
        const parsed = (window as any).htmlToPdfmake(formattedStr, { window: window });
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        return [{ text: htmlString }];
      }
    };

    const formatMoney = (val: number) => {
      return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(val);
    };

    let logoDataUrl: string | null = null;
    if (config.pdfLogo && config.pdfLogo.trim() !== '') {
      try {
        let logoStr = config.pdfLogo.trim();
        if (logoStr.startsWith('data:image')) {
          logoDataUrl = logoStr;
        } else {
          let fetchUrl = logoStr.startsWith('http') ? logoStr : 'images/' + logoStr;
          const response = await fetch(fetchUrl);
          if (response.ok) {
            const blob = await response.blob();
            if (blob.type.startsWith('image/')) {
              logoDataUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });
            } else {
              console.warn('Vermeide Laden von Nicht-Bild-Daten:', blob.type);
            }
          } else {
            console.warn('Logo-Fetch fehlgeschlagen mit Status:', response.status);
          }
        }
      } catch (err) {
        console.warn('Logo konnte nicht geladen werden', err);
      }
    }

    // pdfMake supports png, jpeg/jpg, webp. SVG is not supported.
    const isSupportedImage = (dataUrl: string | null): boolean => {
      if (!dataUrl) return false;
      const lower = dataUrl.toLowerCase();
      return (
        lower.startsWith('data:image/png') ||
        lower.startsWith('data:image/jpeg') ||
        lower.startsWith('data:image/jpg') ||
        lower.startsWith('data:image/webp')
      );
    };

    const allDevices: string[] = [];
    (k.geraete || []).forEach((g) => {
      if (g.name && g.name.trim() !== '') {
        const price = parseFloat(g.val.replace(',', '.')) || 0;
        allDevices.push(price > 0 ? `${g.name} (${formatMoney(price)})` : g.name);
      }
    });
    (k.miele || []).forEach((m) => {
      if (m.name && m.name.trim() !== '') {
        allDevices.push(m.name);
      }
    });

    let zubehoerItems: string[] = [];
    (k.spuele || []).forEach((s) => {
      if (s.name && s.name.trim() !== '') {
        const price = parseFloat(s.val.replace(',', '.')) || 0;
        zubehoerItems.push(price > 0 ? `${s.name} (${formatMoney(price)})` : s.name);
      }
    });
    (k.wasser || []).forEach((w) => {
      if (w.name && w.name.trim() !== '') {
        zubehoerItems.push(w.name);
      }
    });

    if (k.zubehoer && String(k.zubehoer).trim() !== '') {
      zubehoerItems = [
        ...zubehoerItems,
        ...String(k.zubehoer)
          .split('\n')
          .filter((line) => line.trim() !== ''),
      ];
    }

    const isKostenvoranschlag = k.docType === 'kostenvoranschlag';

    const pdfKuechenText = isKostenvoranschlag
      ? (config.pdfKuechenTextKV !== undefined ? config.pdfKuechenTextKV : (DEFAULTS.config.pdfKuechenTextKV || config.pdfKuechenText))
      : config.pdfKuechenText;

    const pdfBallerinaText = isKostenvoranschlag
      ? (config.pdfBallerinaTextKV !== undefined ? config.pdfBallerinaTextKV : (DEFAULTS.config.pdfBallerinaTextKV || config.pdfBallerinaText))
      : config.pdfBallerinaText;

    const pdfAnschlussText = isKostenvoranschlag
      ? (config.pdfAnschlussTextKV !== undefined ? config.pdfAnschlussTextKV : (DEFAULTS.config.pdfAnschlussTextKV || config.pdfAnschlussText))
      : config.pdfAnschlussText;

    const pdfAnschlussRabattText = isKostenvoranschlag
      ? (config.pdfAnschlussRabattTextKV !== undefined ? config.pdfAnschlussRabattTextKV : (DEFAULTS.config.pdfAnschlussRabattTextKV || config.pdfAnschlussRabattText))
      : config.pdfAnschlussRabattText;

    const pdfNachtext = isKostenvoranschlag
      ? (config.pdfNachtextKV !== undefined ? config.pdfNachtextKV : (DEFAULTS.config.pdfNachtextKV || config.pdfNachtext))
      : config.pdfNachtext;

    let anschlussTextArray: string[] = [];
    if (k.optAnschluss && pdfAnschlussText) {
      anschlussTextArray.push(pdfAnschlussText);
    }
    if (k.optAnschlussRabatt && pdfAnschlussRabattText) {
      anschlussTextArray.push(pdfAnschlussRabattText);
    }

    const anschlussPdfBlock = anschlussTextArray.length > 0 ? {
      text: parseHTML(anschlussTextArray.join(' ')),
      margin: [0, 2, 0, 0] as [number, number, number, number],
      fontSize: 10,
      color: '#475569'
    } : { text: '' };

    const headerColumns: any[] = [
      { text: isKostenvoranschlag ? 'KOSTENVORANSCHLAG' : 'ANGEBOT', style: 'mainHeader', width: '*' }
    ];

    if (logoDataUrl && isSupportedImage(logoDataUrl)) {
      headerColumns.push({
        image: logoDataUrl,
        width: 120,
        alignment: 'right'
      });
    }

    const beraterObj = findBeraterUser(k.beraterId, params.usersList || []);

    const currentDateStr = new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date());

    const strasseVal = (k.kundeStrasse || '').trim();
    const plzOrtVal = (k.kundePlzOrt || '').trim();

    let adresseLines: string[] = [];
    if (strasseVal || plzOrtVal) {
      if (strasseVal) adresseLines.push(strasseVal);
      if (plzOrtVal) adresseLines.push(plzOrtVal);
    } else if (k.kundeAdresse) {
      adresseLines = k.kundeAdresse
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    }

    // 1. Linke Spalte: Kundenname (und darunter Adresse, falls vorhanden)
    const leftStack: any[] = [];
    const customerDisplayName = k.kunde && k.kunde.trim() !== ''
      ? k.kunde.trim()
      : (isKostenvoranschlag ? 'Kostenvoranschlag' : 'Ihre neue Traumküche');

    leftStack.push({
      text: customerDisplayName,
      fontSize: 12,
      bold: true,
      color: '#1e293b',
      margin: [0, 0, 0, 2]
    });

    adresseLines.forEach((line) => {
      leftStack.push({
        text: line,
        fontSize: 10,
        color: '#475569',
        margin: [0, 1, 0, 0]
      });
    });

    // 2. Rechte Spalte: Berater-Informationen immer rechts auf exakt gleicher Zeilenhöhe
    const rightStack: any[] = [];
    if (beraterObj && beraterObj.name) {
      rightStack.push({
        text: `Ihr Berater: ${beraterObj.name}`,
        fontSize: 12,
        bold: true,
        color: '#1e293b',
        alignment: 'right',
        margin: [0, 0, 0, 2]
      });

      if (beraterObj.phone) {
        rightStack.push({
          text: `Tel: ${beraterObj.phone}`,
          fontSize: 10,
          color: '#475569',
          alignment: 'right',
          margin: [0, 1, 0, 0]
        });
      }

      if (beraterObj.email) {
        rightStack.push({
          text: `E-Mail: ${beraterObj.email}`,
          fontSize: 10,
          color: '#475569',
          alignment: 'right',
          margin: [0, 1, 0, 0]
        });
      }
    }

    const customerAndMetaSection = {
      columns: [
        { stack: leftStack, width: '*' },
        { stack: rightStack, width: 'auto' }
      ],
      margin: [0, 0, 0, 18]
    };

    const contentList: any[] = [
      { columns: headerColumns, margin: [0, 0, 0, 8] },
      {
        columns: [
          { text: '', width: '*' },
          { text: `Datum: ${currentDateStr}`, fontSize: 10, color: '#64748b', alignment: 'right', width: 'auto' }
        ],
        margin: [0, 0, 0, 10]
      },
      customerAndMetaSection,
      k.optKuechenText && pdfKuechenText ? {
        text: parseHTML(pdfKuechenText),
        margin: [0, 0, 0, 20],
        fontSize: 11,
        color: '#334155'
      } : { text: '', margin: [0, 0, 0, 0] }
    ];

    if (isKostenvoranschlag) {
      const kostenTableBody: any[] = [
        [
          { text: 'Pos.', bold: true, fillColor: '#f1f5f9', fontSize: 10 },
          { text: 'Bezeichnung / Leistung', bold: true, fillColor: '#f1f5f9', fontSize: 10 },
          { text: 'Betrag (Brutto)', bold: true, alignment: 'right', fillColor: '#f1f5f9', fontSize: 10 }
        ]
      ];

      const validKostenItems = (k.kostenItems || []).filter(item => (item.name && item.name.trim() !== '') || (item.val && item.val.trim() !== ''));
      if (validKostenItems.length === 0) {
        kostenTableBody.push([
          { text: '1', fontSize: 10, color: '#64748b' },
          { text: 'Pauschalbetrag / Leistung', fontSize: 10, color: '#334155' },
          { text: formatMoney(params.totalVK), fontSize: 10, alignment: 'right', bold: true, color: '#0f172a' }
        ]);
      } else {
        validKostenItems.forEach((item, idx) => {
          const itemVal = parseFloat(String(item.val).replace(',', '.')) || 0;
          kostenTableBody.push([
            { text: `${idx + 1}`, fontSize: 10, color: '#64748b' },
            { text: item.name || `Position ${idx + 1}`, fontSize: 10, color: '#334155' },
            { text: formatMoney(itemVal), fontSize: 10, alignment: 'right', bold: true, color: '#0f172a' }
          ]);
        });
      }

      contentList.push(
        { text: 'Positionen & Leistungen', style: 'sectionHeader', margin: [0, 10, 0, 10] },
        {
          table: {
            headerRows: 1,
            widths: [35, '*', 110],
            body: kostenTableBody
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 20]
        },
        { text: 'Gesamtsumme', style: 'sectionHeader', margin: [0, 8, 0, 6] },
        { text: [
          'Gesamtbetrag des Kostenvoranschlags: ',
          { text: `${formatMoney(params.totalVK)}`, bold: true, fontSize: 13, color: '#000000' }
        ], margin: [0, 0, 0, 4] },
        { text: '* Alle Preise verstehen sich inkl. 19 % MwSt.', fontSize: 10, color: '#64748b', margin: [0, 0, 0, 4] }
      );

      if (k.optBallerina && pdfBallerinaText) {
        contentList.push({
          text: parseHTML(pdfBallerinaText),
          margin: [0, 8, 0, 8],
          fontSize: 10,
          color: '#475569',
          alignment: 'justify'
        });
      }

      if (anschlussTextArray.length > 0) {
        contentList.push(anschlussPdfBlock);
      }
    } else {
      contentList.push(
        { text: 'Möbel & Design', style: 'sectionHeader' },
        {
          columns: [
            { text: 'Front 1:', width: 100, bold: true },
            { text: k.front1 || 'Nicht definiert' }
          ], margin: [0, 0, 0, 4]
        },
        k.front2 && k.front2.trim() !== '' ? {
          columns: [
            { text: 'Front 2:', width: 100, bold: true },
            { text: k.front2 }
          ], margin: [0, 0, 0, 4]
        } : { text: '', margin: [0, 0, 0, 0] },
        k.griff && k.griff.trim() !== '' ? {
          columns: [
            { text: 'Griffausführung:', width: 100, bold: true },
            { text: k.griff }
          ], margin: [0, 0, 0, 4]
        } : { text: '', margin: [0, 0, 0, 0] },
        {
          columns: [
            { text: 'Arbeitsplatte:', width: 100, bold: true },
            { text: k.apName || 'Nicht definiert' }
          ], margin: [0, 0, 0, 10]
        },

        k.optBallerina && pdfBallerinaText ? {
          text: parseHTML(pdfBallerinaText),
          margin: [0, 5, 0, 15],
          fontSize: 10,
          color: '#475569',
          alignment: 'justify'
        } : { text: '', margin: [0, 0, 0, 10] },

        { text: 'Elektrogeräte', style: 'sectionHeader' },
        allDevices.length > 0
          ? { ul: allDevices, margin: [0, 0, 0, 15], color: '#334155' }
          : { text: 'Keine Geräte erfasst.', margin: [0, 0, 0, 15], italics: true, color: '#94a3b8' },

        { text: 'Ebenso enthalten sind', style: 'sectionHeader' },
        zubehoerItems.length > 0
          ? { ul: zubehoerItems, margin: [0, 0, 0, 25], color: '#334155' }
          : { text: 'Kein weiteres Zubehör vermerkt.', margin: [0, 0, 0, 25], italics: true, color: '#94a3b8' },

        { text: 'Endpreis', style: 'sectionHeader', margin: [0, 8, 0, 4] },
        { text: [
          'Wir bieten Ihnen die Küche zu einem Gesamt-Sonderpreis von ',
          { text: `${formatMoney(params.totalVK)} inkl. Lieferung und Montage`, bold: true, fontSize: 13, color: '#000000' },
          ' an.'
        ], margin: [0, 0, 0, 4] },

        { text: `(Darin enthalten: ${params.vkStein > 0 ? 'Stein-Arbeitsplatte ' + formatMoney(params.vkStein) : 'Arbeitsplatte im Möbelpreis'} | Anteil für Lieferung & Montage ${formatMoney(params.montage)})`, italics: true, color: '#64748b', fontSize: 10, margin: [0, 0, 0, 1] },
        { text: '* Alle Preise verstehen sich inkl. 19 % MwSt.', fontSize: 10, color: '#64748b', margin: [0, 0, 0, 4] },

        anschlussPdfBlock
      );
    }

    const docDefinition: any = {
      info: { title: isKostenvoranschlag ? 'Kostenvoranschlag' : 'Küchenangebot', author: 'Küchenberater' },
      pageMargins: [40, 40, 40, 80],
      footer: function() {
        return {
          text: config.pdfFooter || '',
          alignment: 'center',
          fontSize: 8,
          color: '#94a3b8',
          margin: [40, 20, 40, 0]
        };
      },
      content: contentList,
      styles: {
        mainHeader: { fontSize: 24, bold: true, color: '#2563eb' },
        sectionHeader: { fontSize: 14, bold: true, margin: [0, 15, 0, 8], color: '#2563eb' }
      },
      defaultStyle: {
        fontSize: 11,
        lineHeight: 1.4,
        color: '#0f172a'
      }
    };

    const mpArray: string[] = [];
    (k.mehrpreise || []).forEach((mp) => {
      if (mp.name && mp.name.trim() !== '') {
        const price = parseFloat(mp.val.replace(',', '.')) || 0;
        let priceText = '';
        if (price > 0) priceText = ` (+ ${formatMoney(price)})`;
        else if (price < 0) priceText = ` (- ${formatMoney(Math.abs(price))})`;
        mpArray.push(`${mp.name}${priceText}`);
      }
    });

    if (!isKostenvoranschlag && mpArray.length > 0) {
      docDefinition.content.push(
        { text: 'OPTIONALE MEHR-/MINDERPREISE & ANMERKUNGEN', style: 'sectionHeader', margin: [0, 25, 0, 8] },
        { text: 'Folgende Positionen sind im oben genannten Gesamtpreis noch NICHT enthalten:', fontSize: 10, color: '#64748b', margin: [0, 0, 0, 8] },
        { ul: mpArray, color: '#334155' }
      );
    }

    if (k.optNachtext && pdfNachtext) {
      docDefinition.content.push(
        { text: parseHTML(pdfNachtext), margin: [0, 30, 0, 0], fontSize: 11, color: '#334155' }
      );
    }

    const pdf = (window as any).pdfMake.createPdf(docDefinition);
    let fileName = isKostenvoranschlag ? 'Kostenvoranschlag.pdf' : 'Kuechenangebot.pdf';
    if (k.kunde && k.kunde.trim() !== '') {
      const safeName = k.kunde.trim().replace(/[^a-zA-Z0-9\u00C0-\u017F]/g, '');
      fileName = safeName + (isKostenvoranschlag ? '_Kostenvoranschlag.pdf' : '_Kuechenangebot.pdf');
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    return new Promise<string | void>((resolve, reject) => {
      pdf.getBase64((data: string) => {
        try {
          if (mode === 'blob') {
            const binStr = atob(data);
            const len = binStr.length;
            const arr = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              arr[i] = binStr.charCodeAt(i);
            }
            const blob = new Blob([arr], { type: 'application/pdf' });
            const blobUrl = URL.createObjectURL(blob);
            showAlert("PDF-Vorschau geladen!");
            resolve(blobUrl);
          } else {
            const base64Url = 'data:application/pdf;base64,' + data;
            if (isIOS) {
              window.location.href = base64Url;
            } else {
              const a = document.createElement('a');
              a.href = base64Url;
              a.download = fileName;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }
            showAlert("PDF erfolgreich erstellt!");
            resolve();
          }
        } catch (err) {
          reject(err);
        }
      });
    });

  } catch (e: any) {
    console.error("PDF-Fehler:", e);
    showAlert("Fehler: " + (e.message || "Unbekannter PDF-Fehler"));
    throw e;
  }
}
