export type NetworkClass = "DITO" | "GLOBE" | "GOMO" | "SMART" | "SUN" | "TM" | "TNT";

function digitsOnly(input: string) {
  return input.replace(/\D+/g, "");
}

/**
 * Normalizes PH mobile numbers into a leading-0 format when possible.
 * Examples:
 * - +63917xxxxxxx -> 0917xxxxxxx
 * - 63917xxxxxxx  -> 0917xxxxxxx
 * - 917xxxxxxx    -> 0917xxxxxxx
 */
export function normalizePhMobile(numberRaw: string): string {
  const d = digitsOnly(numberRaw);
  if (!d) return "";

  if (d.startsWith("63") && d.length >= 12) return "0" + d.slice(2);
  if (d.startsWith("9") && d.length === 10) return "0" + d;
  if (d.startsWith("0") && d.length >= 11) return d;
  return d;
}

// Longest-prefix match (prefer 5-digit prefixes like 09175 over 4-digit 0917).
const PREFIX_TO_NETWORK: Record<string, NetworkClass> = {
  // Globe / TM / GOMO / misc (from provided list)
  "09175": "GLOBE",
  "09176": "GLOBE",
  "09178": "GLOBE",
  "09253": "GLOBE",
  "09255": "GLOBE",
  "09256": "GLOBE",
  "09257": "GLOBE",
  "09258": "GLOBE",

  "0817": "TM",
  "0905": "TM",
  "0906": "TM",
  "0915": "TM",
  "0916": "TM",
  "0917": "TM",
  "0926": "TM",
  "0927": "TM",
  "0935": "TM",
  "0936": "TM",
  "0945": "TM",
  "0955": "TM",
  "0956": "TM",
  "0965": "TM",
  "0966": "TM",
  "0967": "TM",
  "0975": "TM",
  "0977": "TM",
  "0995": "TM",
  "0996": "GLOBE", // Cherry Prepaid exists but requested classes don't include it
  "0997": "TM",

  "0976": "GOMO",

  // Smart / TNT
  "0811": "TNT",
  "0813": "TNT",
  "0907": "TNT",
  "0908": "TNT",
  "0909": "TNT",
  "0910": "TNT",
  "0912": "TNT",
  "0913": "TNT",
  "0914": "TNT",
  "0918": "TNT",
  "0919": "TNT",
  "0920": "TNT",
  "0921": "TNT",
  "0928": "TNT",
  "0929": "TNT",
  "0930": "TNT",
  "0938": "TNT",
  "0939": "TNT",
  "0940": "TNT",
  "0946": "TNT",
  "0947": "TNT",
  "0948": "TNT",
  "0949": "TNT",
  "0950": "TNT",
  "0951": "TNT",
  "0961": "TNT",
  "0963": "TNT",
  "0968": "TNT",
  "0969": "TNT",
  "0970": "TNT",
  "0981": "TNT",
  "0989": "TNT",
  "0998": "TNT",
  "0999": "TNT",

  // DITO (note: 0992 conflicts in some lists; you provided it under DITO)
  "0895": "DITO",
  "0896": "DITO",
  "0897": "DITO",
  "0898": "DITO",
  "0991": "DITO",
  "0992": "DITO",
  "0993": "DITO",
  "0994": "DITO",

  // SUN
  "0922": "SUN",
  "0923": "SUN",
  "0924": "SUN",
  "0925": "SUN",
  "0931": "SUN",
  "0932": "SUN",
  "0933": "SUN",
  "0934": "SUN",
  "0941": "SUN",
  "0942": "SUN",
  "0943": "SUN",
  "0944": "SUN",

  // ABS-CBN Mobile -> map into SMART bucket? (requested classes don't include it)
  "0937": "SMART",
};

const PREFIXES_DESC = Object.keys(PREFIX_TO_NETWORK).sort((a, b) => b.length - a.length);

export function inferNetworkClass(numberRaw: string): NetworkClass | null {
  const n = normalizePhMobile(numberRaw);
  if (!n) return null;

  for (const p of PREFIXES_DESC) {
    if (n.startsWith(p)) return PREFIX_TO_NETWORK[p] ?? null;
  }
  return null;
}

