/**
 * Resolves stone image paths gracefully and robustly.
 * Handles:
 * - Direct URLs ('https://...', 'data:...')
 * - Subfolders with or without leading slash ('/Neolith/azure.jpg', 'Neolith/azure.jpg')
 * - Full relative paths with or without 'images/' ('images/Neolith/azure.jpg', '/images/Neolith/azure.jpg')
 * - Root images ('azure.jpg', '/azure.jpg')
 */
export function resolveStoneImageUrl(img?: string | null): string {
  if (!img) return '';
  const trimmed = img.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  // Strip leading slashes
  let clean = trimmed.replace(/^\/+/, '');

  // If already prefixed with 'images/', remove it first to normalize
  if (clean.toLowerCase().startsWith('images/')) {
    clean = clean.slice(7);
  }

  // Ensure any extra leading slashes are removed
  clean = clean.replace(/^\/+/, '');

  return `images/${clean}`;
}
