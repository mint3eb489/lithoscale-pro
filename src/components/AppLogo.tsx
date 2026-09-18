import React, { useState, useEffect } from 'react';
import { resolveAppLogoUrl } from '../utils/imageUtils';

interface AppLogoProps {
  logo?: string;
  className?: string;
  alt?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  logo,
  className = "w-full h-full object-cover",
  alt = "LithoScale Pro Logo"
}) => {
  const primaryUrl = resolveAppLogoUrl(logo);
  const [currentSrc, setCurrentSrc] = useState<string>(primaryUrl);
  const [attemptIndex, setAttemptIndex] = useState<number>(0);

  useEffect(() => {
    const initial = resolveAppLogoUrl(logo);
    setCurrentSrc(initial);
    setAttemptIndex(0);
  }, [logo]);

  const handleError = () => {
    // Candidates to cycle through dynamically
    const cleanPrimary = primaryUrl.replace(/^\/+/, '');
    const fallbacks = [
      cleanPrimary,
      '/' + cleanPrimary,
      'images/' + cleanPrimary.replace(/^images\//, ''),
      '/images/' + cleanPrimary.replace(/^images\//, ''),
      'apple-touch-icon.png',
      '/apple-touch-icon.png',
      'favicon-96x96.png',
      '/favicon-96x96.png',
      'favicon.svg',
      '/favicon.svg'
    ];

    // Filter unique candidates
    const uniqueCandidates = Array.from(new Set(fallbacks));
    const nextIdx = attemptIndex + 1;

    if (nextIdx < uniqueCandidates.length) {
      setAttemptIndex(nextIdx);
      setCurrentSrc(uniqueCandidates[nextIdx]);
    }
  };

  return (
    <img
      src={currentSrc}
      onError={handleError}
      className={className}
      alt={alt}
      referrerPolicy="no-referrer"
    />
  );
};
