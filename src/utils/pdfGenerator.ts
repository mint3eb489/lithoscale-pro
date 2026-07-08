import { Kitchen, AppConfig, Part } from '../types';

interface PDFParams {
  kitchen: Kitchen;
  config: AppConfig;
  parts: Part[];
  totalVK: number;
  montage: number;
  vkStein: number;
  vkMiele: number;
  vkMoebel: number;
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
        allDevices.push(price > 0 ? `${g.name} (Internetpreis: ${formatMoney(price)})` : g.name);
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
        zubehoerItems.push(price > 0 ? `${s.name} (Internetpreis: ${formatMoney(price)})` : s.name);
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

    let anschlussTextArray: string[] = [];
    if (k.optAnschluss && config.pdfAnschlussText) {
      anschlussTextArray.push(config.pdfAnschlussText);
    }
    if (k.optAnschlussRabatt && config.pdfAnschlussRabattText) {
      anschlussTextArray.push(config.pdfAnschlussRabattText);
    }

    const anschlussPdfBlock = anschlussTextArray.length > 0 ? {
      text: parseHTML(anschlussTextArray.join(' ')),
      margin: [0, 2, 0, 0] as [number, number, number, number],
      fontSize: 10,
      color: '#475569'
    } : { text: '' };

    const headerColumns: any[] = [
      { text: 'ANGEBOT', style: 'mainHeader', width: '*' }
    ];

    if (logoDataUrl && isSupportedImage(logoDataUrl)) {
      headerColumns.push({
        image: logoDataUrl,
        width: 120,
        alignment: 'right'
      });
    }

    const beraterObj = (config.beraterList || []).find((b) => String(b.id) === String(k.beraterId));
    let beraterBlock: any = { text: '', margin: [0, 0, 0, 0] };
    if (beraterObj && beraterObj.name) {
      let details: string[] = [`Berater: ${beraterObj.name}`];
      if (beraterObj.phone) details.push(beraterObj.phone);
      if (beraterObj.email) details.push(beraterObj.email);

      beraterBlock = { text: details.join(' / '), margin: [0, 0, 0, 15] as [number, number, number, number], fontSize: 10, color: '#64748b' };
    }

    const docDefinition: any = {
      info: { title: 'Küchenangebot', author: 'Küchenberater' },
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
      content: [
        { columns: headerColumns, margin: [0, 0, 0, 15] },
        k.kunde && k.kunde.trim() !== ''
          ? { text: `Projekt / Kommission: ${k.kunde}`, margin: [0, 0, 0, 15], fontSize: 12, bold: true, color: '#2563eb' }
          : { text: 'Ihre neue Traumküche', margin: [0, 0, 0, 15], color: '#64748b' },
        beraterBlock,
        k.optKuechenText && config.pdfKuechenText ? {
          text: parseHTML(config.pdfKuechenText),
          margin: [0, 0, 0, 20],
          fontSize: 11,
          color: '#334155'
        } : { text: '', margin: [0, 0, 0, 0] },
        
        { text: '1. Möbel & Design', style: 'sectionHeader' },
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

        k.optBallerina && config.pdfBallerinaText ? {
          text: parseHTML(config.pdfBallerinaText),
          margin: [0, 5, 0, 15],
          fontSize: 10,
          color: '#475569',
          alignment: 'justify'
        } : { text: '', margin: [0, 0, 0, 10] },

        { text: '2. Elektrogeräte', style: 'sectionHeader' },
        allDevices.length > 0
          ? { ul: allDevices, margin: [0, 0, 0, 15], color: '#334155' }
          : { text: 'Keine Geräte erfasst.', margin: [0, 0, 0, 15], italics: true, color: '#94a3b8' },

        { text: '3. Ebenso enthalten sind', style: 'sectionHeader' },
        zubehoerItems.length > 0
          ? { ul: zubehoerItems, margin: [0, 0, 0, 25], color: '#334155' }
          : { text: 'Kein weiteres Zubehör vermerkt.', margin: [0, 0, 0, 25], italics: true, color: '#94a3b8' },

        { text: '4. Endpreis', style: 'sectionHeader', margin: [0, 8, 0, 4] },
        { text: [
          'Wir bieten Ihnen die Küche zu einem Gesamt-Sonderpreis von ',
          { text: `${formatMoney(params.totalVK)} inkl. Lieferung und Montage`, bold: true, fontSize: 13, color: '#000000' },
          ' an.'
        ], margin: [0, 0, 0, 4] },

        { text: `(Darin enthalten: ${params.vkStein > 0 ? 'Stein-Arbeitsplatte ' + formatMoney(params.vkStein) : 'Arbeitsplatte im Möbelpreis'} | Anteil für Lieferung & Montage ${formatMoney(params.montage)})`, italics: true, color: '#64748b', fontSize: 10, margin: [0, 0, 0, 1] },
        { text: '* Alle Preise verstehen sich inkl. 19 % MwSt.', fontSize: 10, color: '#64748b', margin: [0, 0, 0, 4] },

        anschlussPdfBlock
      ],
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

    if (mpArray.length > 0) {
      docDefinition.content.push(
        { text: 'OPTIONALE MEHR-/MINDERPREISE & ANMERKUNGEN', style: 'sectionHeader', margin: [0, 25, 0, 8] },
        { text: 'Folgende Positionen sind im oben genannten Gesamtpreis noch NICHT enthalten:', fontSize: 10, color: '#64748b', margin: [0, 0, 0, 8] },
        { ul: mpArray, color: '#334155' }
      );
    }

    if (k.optNachtext && config.pdfNachtext) {
      docDefinition.content.push(
        { text: parseHTML(config.pdfNachtext), margin: [0, 30, 0, 0], fontSize: 11, color: '#334155' }
      );
    }

    const pdf = (window as any).pdfMake.createPdf(docDefinition);
    let fileName = 'Kuechenangebot.pdf';
    if (k.kunde && k.kunde.trim() !== '') {
      const safeName = k.kunde.trim().replace(/[^a-zA-Z0-9\u00C0-\u017F]/g, '');
      fileName = safeName + '_Kuechenangebot.pdf';
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
