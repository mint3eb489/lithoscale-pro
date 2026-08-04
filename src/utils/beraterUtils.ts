import { UserProfile, Berater } from '../types';

/**
 * Utility functions for mapping legacy or static berater names / IDs
 * ("Belmonte", "Ruoff", "T. Schulz", "b1", "b2", "b3", "1775813497113", etc.)
 * to registered users in Benutzerverwaltung.
 */

export function findBeraterUser(
  rawBerater: string | number | null | undefined,
  usersList: UserProfile[] = [],
  currentUserProfile?: UserProfile | null,
  beraterList?: Berater[]
): UserProfile | null {
  const allUsers: UserProfile[] = [...usersList];
  if (currentUserProfile && !allUsers.some((u) => String(u.id) === String(currentUserProfile.id))) {
    allUsers.push(currentUserProfile);
  }

  if (allUsers.length === 0) return null;

  if (rawBerater === null || rawBerater === undefined || String(rawBerater).trim() === '') {
    return null;
  }

  const rawStr = String(rawBerater).trim();
  const rawLower = rawStr.toLowerCase();

  // 1. Direct match by ID in usersList
  const matchById = allUsers.find((u) => String(u.id) === rawStr);
  if (matchById) return matchById;

  // 2. Direct match by exact name in usersList
  const matchByName = allUsers.find((u) => u.name?.trim().toLowerCase() === rawLower);
  if (matchByName) return matchByName;

  // 3. Lookup in static beraterList from config (if available)
  if (beraterList && beraterList.length > 0) {
    const configBerater = beraterList.find(
      (b) => String(b.id) === rawStr || b.name?.trim().toLowerCase() === rawLower
    );
    if (configBerater && configBerater.name) {
      const configNameLower = configBerater.name.trim().toLowerCase();
      // Try to find matching user in usersList by name
      const userFromConfigName = allUsers.find(
        (u) =>
          u.name?.trim().toLowerCase() === configNameLower ||
          (u.name && configNameLower.includes(u.name.trim().toLowerCase())) ||
          (u.name && u.name.trim().toLowerCase().includes(configNameLower))
      );
      if (userFromConfigName) return userFromConfigName;

      // Extract parts from configName (e.g. "Ruoff" from "Doris Ruoff")
      const parts = configNameLower.split(/\s+/);
      for (const part of parts) {
        if (part.length > 2) {
          const uMatch = allUsers.find((u) => u.name?.toLowerCase().includes(part));
          if (uMatch) return uMatch;
        }
      }
    }
  }

  // 4. Known legacy name / key / timestamp ID mappings
  if (
    rawLower.includes('belmonte') ||
    rawLower.includes('enrico') ||
    rawLower === 'b1' ||
    rawLower === '1775813497112'
  ) {
    const found = allUsers.find((u) => u.name?.toLowerCase().includes('belmonte') || u.name?.toLowerCase().includes('enrico'));
    if (found) return found;
  }

  if (
    rawLower.includes('ruoff') ||
    rawLower.includes('doris') ||
    rawLower === 'b2' ||
    rawLower === '1775813497113'
  ) {
    const found = allUsers.find((u) => u.name?.toLowerCase().includes('ruoff') || u.name?.toLowerCase().includes('doris'));
    if (found) return found;
  }

  if (
    rawLower.includes('schulz') ||
    rawLower.includes('tara') ||
    rawLower === 'b3' ||
    rawLower === '1775813497114'
  ) {
    const found = allUsers.find((u) => u.name?.toLowerCase().includes('schulz') || u.name?.toLowerCase().includes('tara'));
    if (found) return found;
  }

  // 5. Partial substring match in allUsers
  const partialMatch = allUsers.find(
    (u) => u.name && (u.name.toLowerCase().includes(rawLower) || rawLower.includes(u.name.toLowerCase()))
  );
  if (partialMatch) return partialMatch;

  return null;
}

export function resolveBeraterId(
  rawBerater: string | number | null | undefined,
  usersList: UserProfile[] = [],
  currentUserProfile?: UserProfile | null,
  beraterList?: Berater[]
): string {
  if (rawBerater === null || rawBerater === undefined || String(rawBerater).trim() === '') {
    return currentUserProfile?.id ? String(currentUserProfile.id) : (usersList[0]?.id ? String(usersList[0].id) : '');
  }

  const user = findBeraterUser(rawBerater, usersList, currentUserProfile, beraterList);
  if (user?.id) return String(user.id);

  return String(rawBerater).trim();
}

export function resolveBeraterName(
  rawBerater: string | number | null | undefined,
  usersList: UserProfile[] = [],
  currentUserProfile?: UserProfile | null,
  beraterList?: Berater[]
): string {
  if (rawBerater === null || rawBerater === undefined || String(rawBerater).trim() === '') {
    return currentUserProfile?.name || 'Unbekannt';
  }

  const user = findBeraterUser(rawBerater, usersList, currentUserProfile, beraterList);
  if (user?.name) return user.name;

  // If user profile not found, check beraterList for static name
  const rawStr = String(rawBerater).trim();
  if (beraterList && beraterList.length > 0) {
    const configBerater = beraterList.find((b) => String(b.id) === rawStr);
    if (configBerater?.name) return configBerater.name;
  }

  const lower = rawStr.toLowerCase();
  if (lower.includes('belmonte') || lower === 'b1' || lower === '1775813497112') return 'Enrico Belmonte';
  if (lower.includes('ruoff') || lower === 'b2' || lower === '1775813497113') return 'Doris Ruoff';
  if (lower.includes('schulz') || lower === 'b3' || lower === '1775813497114') return 'Tara Schulz';

  return rawStr;
}

