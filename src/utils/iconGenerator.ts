/**
 * Dynamically generates high-resolution PNG app icons and favicons
 * from the high-quality SVG source client-side.
 * This guarantees that iOS Safari (which requires PNG for apple-touch-icon)
 * and other mobile browsers render the beautiful custom icon perfectly.
 */
export function initializeAppIcons() {
  if (typeof window === 'undefined') return;

  const svgUrl = '/favicon.svg';
  const img = new Image();
  
  // Load the SVG file
  img.src = svgUrl;
  img.crossOrigin = 'anonymous';
  
  img.onload = () => {
    const iconTargets = [
      { size: 180, rel: 'apple-touch-icon', selector: 'link[rel="apple-touch-icon"]' },
      { size: 192, rel: 'icon', sizesAttr: '192x192', selector: 'link[rel="icon"][sizes="192x192"]' },
      { size: 32, rel: 'icon', sizesAttr: '32x32', selector: 'link[rel="icon"][sizes="32x32"]' },
      { size: 16, rel: 'icon', sizesAttr: '16x16', selector: 'link[rel="icon"][sizes="16x16"]' }
    ];

    iconTargets.forEach(({ size, rel, sizesAttr, selector }) => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Clear and draw SVG to canvas
          ctx.clearRect(0, 0, size, size);
          ctx.drawImage(img, 0, 0, size, size);
          
          // Get the base64 PNG data URL
          const dataUrl = canvas.toDataURL('image/png');
          
          // Find existing link element or create a new one
          let link = document.querySelector(selector) as HTMLLinkElement | null;
          
          if (!link) {
            link = document.createElement('link');
            link.rel = rel;
            if (sizesAttr) {
              link.setAttribute('sizes', sizesAttr);
            } else if (size === 180) {
              link.setAttribute('sizes', '180x180');
            }
            document.head.appendChild(link);
          }
          
          link.href = dataUrl;
          link.type = 'image/png';
        }
      } catch (e) {
        console.warn('Could not generate PNG icon for size ' + size + 'px:', e);
      }
    });
  };

  img.onerror = (err) => {
    console.warn('Failed to load favicon.svg for dynamic PNG conversion:', err);
  };
}
