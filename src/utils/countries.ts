export interface Country {
  code: string;
  name: string;
  flag: string;
}

export const countries: Country[] = [
  { code: "us", name: "United States", flag: "🇺🇸" },
  { code: "uk", name: "United Kingdom", flag: "🇬🇧" },
  { code: "de", name: "Germany", flag: "🇩🇪" },
  { code: "jp", name: "Japan", flag: "🇯🇵" },
  { code: "ca", name: "Canada", flag: "🇨🇦" },
  { code: "au", name: "Australia", flag: "🇦🇺" },
  { code: "nl", name: "Netherlands", flag: "🇳🇱" },
  { code: "fr", name: "France", flag: "🇫🇷" },
  { code: "it", name: "Italy", flag: "🇮🇹" },
  { code: "es", name: "Spain", flag: "🇪🇸" },
  { code: "ch", name: "Switzerland", flag: "🇨🇭" },
  { code: "sg", name: "Singapore", flag: "🇸🇬" },
  { code: "no", name: "Norway", flag: "🇳🇴" },
  { code: "se", name: "Sweden", flag: "🇸🇪" },
  { code: "dk", name: "Denmark", flag: "🇩🇰" },
  { code: "pl", name: "Poland", flag: "🇵🇱" },
  { code: "be", name: "Belgium", flag: "🇧🇪" },
  { code: "at", name: "Austria", flag: "🇦🇹" },
  { code: "cz", name: "Czech Republic", flag: "🇨🇿" },
  { code: "fi", name: "Finland", flag: "🇫🇮" },
  { code: "ie", name: "Ireland", flag: "🇮🇪" },
  { code: "pt", name: "Portugal", flag: "🇵🇹" },
  { code: "gr", name: "Greece", flag: "🇬🇷" },
  { code: "hu", name: "Hungary", flag: "🇭🇺" },
];

export function getCountryByCode(code: string): Country | undefined {
  return countries.find((c) => c.code === code.toLowerCase());
}

export function getCountryFlag(code: string): string {
  const country = getCountryByCode(code);
  return country?.flag || "🌍";
}

export function getCountryName(code: string): string {
  const country = getCountryByCode(code);
  return country?.name || code.toUpperCase();
}

export function formatCountryDisplay(code: string): string {
  const country = getCountryByCode(code);
  if (country) {
    return `${country.flag} ${country.name}`;
  }
  return `🌍 ${code.toUpperCase()}`;
}

export function sortCountriesByFavorites(
  countryList: string[],
  favorites: string[]
): string[] {
  const favoriteSet = new Set(favorites.map((f) => f.toLowerCase()));
  
  return [...countryList].sort((a, b) => {
    const aIsFavorite = favoriteSet.has(a.toLowerCase());
    const bIsFavorite = favoriteSet.has(b.toLowerCase());
    
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
    
    // If both are favorites or both are not, sort alphabetically
    return a.localeCompare(b);
  });
}