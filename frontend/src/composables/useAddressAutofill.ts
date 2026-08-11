export interface AddressMatch {
  subdistrict: string;
  district: string;
  province: string;
  zipcode: string;
}

// Compact hierarchical format from jquery.Thailand.js:
// { lookup, words, data: [[province, [[amphoe, [[district, [zip, ...]]...]]...]]...] }
// Names may be encoded as an index into `lookup`, with A-Z runs inside expanding
// via `words` (see decodeName below) — this is the same scheme thai-address-database
// ships, reimplemented here to avoid pulling in its bloated dependency tree.
// Served from /public (not imported as a module) because bundling it collides
// with the project's @intlify/unplugin-vue-i18n JSON transform.
interface CompactDb {
  lookup?: string;
  words?: string;
  data: unknown[];
}

function buildIndex(raw: CompactDb): AddressMatch[] {
  const useLookup = Boolean(raw.lookup && raw.words);
  const lookup = raw.lookup ? raw.lookup.split('|') : [];
  const words = raw.words ? raw.words.split('|') : [];

  const decodeName = (value: string | number): string => {
    if (!useLookup) return String(value);
    const resolved = typeof value === 'number' ? (lookup[value] ?? '') : value;
    return resolved.replace(/[A-Za-z]/g, (m) => {
      const code = m.charCodeAt(0);
      const wordIndex = code < 97 ? code - 65 : 26 + code - 97;
      return words[wordIndex] ?? m;
    });
  };

  const expanded: AddressMatch[] = [];
  const provinces = raw.data as [string | number, [string | number, [string | number, number | number[]][]][]][];

  for (const [provinceRaw, amphoes] of provinces) {
    const province = decodeName(provinceRaw);
    for (const [amphoeRaw, districts] of amphoes) {
      const district = decodeName(amphoeRaw);
      for (const [subdistrictRaw, zipRaw] of districts) {
        const subdistrict = decodeName(subdistrictRaw);
        const zipcodes = Array.isArray(zipRaw) ? zipRaw : [zipRaw];
        for (const zip of zipcodes) {
          expanded.push({ subdistrict, district, province, zipcode: String(zip) });
        }
      }
    }
  }

  return expanded;
}

let indexPromise: Promise<AddressMatch[]> | null = null;

function loadIndex(): Promise<AddressMatch[]> {
  if (!indexPromise) {
    indexPromise = fetch('/thai-address-db.json')
      .then((res) => res.json() as Promise<CompactDb>)
      .then(buildIndex)
      .catch((err: unknown) => {
        indexPromise = null;
        throw err;
      });
  }
  return indexPromise;
}

export function useAddressAutofill() {
  const lookupByZipcode = async (zipcode: string): Promise<AddressMatch[]> => {
    const normalized = zipcode.trim();
    if (!/^\d{5}$/.test(normalized)) return [];
    const index = await loadIndex();
    return index.filter((entry) => entry.zipcode === normalized);
  };

  return { lookupByZipcode };
}
