/**
 * Normalized API user + preferences (matches frontend AuthUser).
 * @param {object} profile - row from public.profiles
 * @param {string} [fallbackEmail]
 */
export function buildUserFromProfile(profile, fallbackEmail = "") {
  const raw =
    profile.preferences && typeof profile.preferences === "object" && !Array.isArray(profile.preferences)
      ? profile.preferences
      : {};
  return {
    id: profile.id,
    role: profile.role,
    email: profile.email ?? fallbackEmail ?? "",
    name: profile.name ?? "",
    preferences: {
      emailDigest: !!raw.emailDigest,
      compactSidebarHints: !!raw.compactSidebarHints
    }
  };
}
