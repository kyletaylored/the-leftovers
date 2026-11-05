/**
 * Countries for the join form's Country picker (`CountryCombobox.tsx`).
 *
 * The list is ISO 3166-1 alpha-2 plus Kosovo (XK), with English names. It's a
 * static table on purpose, not `Intl.DisplayNames` at runtime: the island is
 * server-rendered by Node and hydrated by the browser, and two different ICU
 * builds can spell a name differently (hydration mismatch), and the Google
 * Sheet should read the same string whichever browser sent it. Generated once
 * from Node's ICU with a few names shortened ("Hong Kong", not "Hong Kong SAR
 * China"); edit by hand from here.
 *
 * The Google Form's Country question is short text, so any of these names is
 * a valid answer. The site posts the NAME, never the code.
 */

export interface Country {
  code: string;
  name: string;
}

export const COUNTRIES: Country[] = (
  [
    ['AF', "Afghanistan"],
    ['AX', "Åland Islands"],
    ['AL', "Albania"],
    ['DZ', "Algeria"],
    ['AS', "American Samoa"],
    ['AD', "Andorra"],
    ['AO', "Angola"],
    ['AI', "Anguilla"],
    ['AQ', "Antarctica"],
    ['AG', "Antigua and Barbuda"],
    ['AR', "Argentina"],
    ['AM', "Armenia"],
    ['AW', "Aruba"],
    ['AU', "Australia"],
    ['AT', "Austria"],
    ['AZ', "Azerbaijan"],
    ['BS', "Bahamas"],
    ['BH', "Bahrain"],
    ['BD', "Bangladesh"],
    ['BB', "Barbados"],
    ['BY', "Belarus"],
    ['BE', "Belgium"],
    ['BZ', "Belize"],
    ['BJ', "Benin"],
    ['BM', "Bermuda"],
    ['BT', "Bhutan"],
    ['BO', "Bolivia"],
    ['BA', "Bosnia and Herzegovina"],
    ['BW', "Botswana"],
    ['BV', "Bouvet Island"],
    ['BR', "Brazil"],
    ['IO', "British Indian Ocean Territory"],
    ['VG', "British Virgin Islands"],
    ['BN', "Brunei"],
    ['BG', "Bulgaria"],
    ['BF', "Burkina Faso"],
    ['BI', "Burundi"],
    ['KH', "Cambodia"],
    ['CM', "Cameroon"],
    ['CA', "Canada"],
    ['CV', "Cape Verde"],
    ['BQ', "Caribbean Netherlands"],
    ['KY', "Cayman Islands"],
    ['CF', "Central African Republic"],
    ['TD', "Chad"],
    ['CL', "Chile"],
    ['CN', "China"],
    ['CX', "Christmas Island"],
    ['CC', "Cocos (Keeling) Islands"],
    ['CO', "Colombia"],
    ['KM', "Comoros"],
    ['CD', "Congo (DRC)"],
    ['CG', "Congo (Republic)"],
    ['CK', "Cook Islands"],
    ['CR', "Costa Rica"],
    ['CI', "Côte d'Ivoire"],
    ['HR', "Croatia"],
    ['CU', "Cuba"],
    ['CW', "Curaçao"],
    ['CY', "Cyprus"],
    ['CZ', "Czechia"],
    ['DK', "Denmark"],
    ['DJ', "Djibouti"],
    ['DM', "Dominica"],
    ['DO', "Dominican Republic"],
    ['EC', "Ecuador"],
    ['EG', "Egypt"],
    ['SV', "El Salvador"],
    ['GQ', "Equatorial Guinea"],
    ['ER', "Eritrea"],
    ['EE', "Estonia"],
    ['SZ', "Eswatini"],
    ['ET', "Ethiopia"],
    ['FK', "Falkland Islands"],
    ['FO', "Faroe Islands"],
    ['FJ', "Fiji"],
    ['FI', "Finland"],
    ['FR', "France"],
    ['GF', "French Guiana"],
    ['PF', "French Polynesia"],
    ['TF', "French Southern Territories"],
    ['GA', "Gabon"],
    ['GM', "Gambia"],
    ['GE', "Georgia"],
    ['DE', "Germany"],
    ['GH', "Ghana"],
    ['GI', "Gibraltar"],
    ['GR', "Greece"],
    ['GL', "Greenland"],
    ['GD', "Grenada"],
    ['GP', "Guadeloupe"],
    ['GU', "Guam"],
    ['GT', "Guatemala"],
    ['GG', "Guernsey"],
    ['GN', "Guinea"],
    ['GW', "Guinea-Bissau"],
    ['GY', "Guyana"],
    ['HT', "Haiti"],
    ['HM', "Heard and McDonald Islands"],
    ['HN', "Honduras"],
    ['HK', "Hong Kong"],
    ['HU', "Hungary"],
    ['IS', "Iceland"],
    ['IN', "India"],
    ['ID', "Indonesia"],
    ['IR', "Iran"],
    ['IQ', "Iraq"],
    ['IE', "Ireland"],
    ['IM', "Isle of Man"],
    ['IL', "Israel"],
    ['IT', "Italy"],
    ['JM', "Jamaica"],
    ['JP', "Japan"],
    ['JE', "Jersey"],
    ['JO', "Jordan"],
    ['KZ', "Kazakhstan"],
    ['KE', "Kenya"],
    ['KI', "Kiribati"],
    ['XK', "Kosovo"],
    ['KW', "Kuwait"],
    ['KG', "Kyrgyzstan"],
    ['LA', "Laos"],
    ['LV', "Latvia"],
    ['LB', "Lebanon"],
    ['LS', "Lesotho"],
    ['LR', "Liberia"],
    ['LY', "Libya"],
    ['LI', "Liechtenstein"],
    ['LT', "Lithuania"],
    ['LU', "Luxembourg"],
    ['MO', "Macao"],
    ['MG', "Madagascar"],
    ['MW', "Malawi"],
    ['MY', "Malaysia"],
    ['MV', "Maldives"],
    ['ML', "Mali"],
    ['MT', "Malta"],
    ['MH', "Marshall Islands"],
    ['MQ', "Martinique"],
    ['MR', "Mauritania"],
    ['MU', "Mauritius"],
    ['YT', "Mayotte"],
    ['MX', "Mexico"],
    ['FM', "Micronesia"],
    ['MD', "Moldova"],
    ['MC', "Monaco"],
    ['MN', "Mongolia"],
    ['ME', "Montenegro"],
    ['MS', "Montserrat"],
    ['MA', "Morocco"],
    ['MZ', "Mozambique"],
    ['MM', "Myanmar"],
    ['NA', "Namibia"],
    ['NR', "Nauru"],
    ['NP', "Nepal"],
    ['NL', "Netherlands"],
    ['NC', "New Caledonia"],
    ['NZ', "New Zealand"],
    ['NI', "Nicaragua"],
    ['NE', "Niger"],
    ['NG', "Nigeria"],
    ['NU', "Niue"],
    ['NF', "Norfolk Island"],
    ['KP', "North Korea"],
    ['MK', "North Macedonia"],
    ['MP', "Northern Mariana Islands"],
    ['NO', "Norway"],
    ['OM', "Oman"],
    ['PK', "Pakistan"],
    ['PW', "Palau"],
    ['PS', "Palestine"],
    ['PA', "Panama"],
    ['PG', "Papua New Guinea"],
    ['PY', "Paraguay"],
    ['PE', "Peru"],
    ['PH', "Philippines"],
    ['PN', "Pitcairn Islands"],
    ['PL', "Poland"],
    ['PT', "Portugal"],
    ['PR', "Puerto Rico"],
    ['QA', "Qatar"],
    ['RE', "Réunion"],
    ['RO', "Romania"],
    ['RU', "Russia"],
    ['RW', "Rwanda"],
    ['KN', "Saint Kitts and Nevis"],
    ['PM', "Saint Pierre and Miquelon"],
    ['VC', "Saint Vincent and the Grenadines"],
    ['WS', "Samoa"],
    ['SM', "San Marino"],
    ['ST', "São Tomé and Príncipe"],
    ['SA', "Saudi Arabia"],
    ['SN', "Senegal"],
    ['RS', "Serbia"],
    ['SC', "Seychelles"],
    ['SL', "Sierra Leone"],
    ['SG', "Singapore"],
    ['SX', "Sint Maarten"],
    ['SK', "Slovakia"],
    ['SI', "Slovenia"],
    ['SB', "Solomon Islands"],
    ['SO', "Somalia"],
    ['ZA', "South Africa"],
    ['GS', "South Georgia and South Sandwich Islands"],
    ['KR', "South Korea"],
    ['SS', "South Sudan"],
    ['ES', "Spain"],
    ['LK', "Sri Lanka"],
    ['BL', "St. Barthélemy"],
    ['SH', "St. Helena"],
    ['LC', "St. Lucia"],
    ['MF', "St. Martin"],
    ['SD', "Sudan"],
    ['SR', "Suriname"],
    ['SJ', "Svalbard and Jan Mayen"],
    ['SE', "Sweden"],
    ['CH', "Switzerland"],
    ['SY', "Syria"],
    ['TW', "Taiwan"],
    ['TJ', "Tajikistan"],
    ['TZ', "Tanzania"],
    ['TH', "Thailand"],
    ['TL', "Timor-Leste"],
    ['TG', "Togo"],
    ['TK', "Tokelau"],
    ['TO', "Tonga"],
    ['TT', "Trinidad and Tobago"],
    ['TN', "Tunisia"],
    ['TR', "Türkiye"],
    ['TM', "Turkmenistan"],
    ['TC', "Turks and Caicos Islands"],
    ['TV', "Tuvalu"],
    ['UM', "U.S. Outlying Islands"],
    ['VI', "U.S. Virgin Islands"],
    ['UG', "Uganda"],
    ['UA', "Ukraine"],
    ['AE', "United Arab Emirates"],
    ['GB', "United Kingdom"],
    ['US', "United States"],
    ['UY', "Uruguay"],
    ['UZ', "Uzbekistan"],
    ['VU', "Vanuatu"],
    ['VA', "Vatican City"],
    ['VE', "Venezuela"],
    ['VN', "Vietnam"],
    ['WF', "Wallis and Futuna"],
    ['EH', "Western Sahara"],
    ['YE', "Yemen"],
    ['ZM', "Zambia"],
    ['ZW', "Zimbabwe"],
  ] as const
).map(([code, name]) => ({ code, name }));

/**
 * Shown first, before the full A–Z list, while the search box is empty:
 * where the team's players actually come from. US and Canada, then Europe,
 * because that's where the team travels for events.
 */
export const SUGGESTED_CODES = [
  'US', 'CA',
  'GB', 'IE', 'FR', 'DE', 'NL', 'BE', 'LU', 'ES', 'PT', 'IT', 'CH', 'AT',
  'DK', 'SE', 'NO', 'FI', 'PL', 'CZ',
];

/** Other names people type for a country, so the search still finds it. */
const ALIASES: Record<string, string[]> = {
  US: ['USA', 'US', 'America', 'United States of America'],
  GB: ['UK', 'Great Britain', 'Britain', 'England', 'Scotland', 'Wales', 'Northern Ireland'],
  NL: ['Holland', 'The Netherlands'],
  CZ: ['Czech Republic'],
  TR: ['Turkey'],
  KR: ['Korea'],
  AE: ['UAE'],
  CI: ['Ivory Coast'],
  CV: ['Cabo Verde'],
  SZ: ['Swaziland'],
  MK: ['Macedonia'],
  MM: ['Burma'],
  VA: ['Holy See'],
  DE: ['Deutschland'],
  ES: ['España'],
  CH: ['Schweiz', 'Suisse'],
};

const byCode = new Map(COUNTRIES.map((c) => [c.code, c]));

export function countryByCode(code: string | undefined): Country | undefined {
  return code ? byCode.get(code.toUpperCase()) : undefined;
}

/** Lower-case, accents stripped: "Curaçao" and "curacao" match. */
export function normalise(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** The country this exact text names (by name, code or alias), if any. */
export function findCountry(text: string): Country | undefined {
  const q = normalise(text);
  if (!q) return undefined;
  return COUNTRIES.find(
    (c) =>
      normalise(c.name) === q ||
      c.code.toLowerCase() === q ||
      (ALIASES[c.code] ?? []).some((a) => normalise(a) === q)
  );
}

/**
 * Countries matching a search, best first: names that start with the query,
 * then a word in the name or an alias that starts with it, then anything that
 * contains it. Within each tier, the suggested countries come first.
 */
export function searchCountries(text: string): Country[] {
  const q = normalise(text);
  if (!q) return COUNTRIES;
  const scored: Array<[number, Country]> = [];
  for (const c of COUNTRIES) {
    const name = normalise(c.name);
    const terms = [name, ...(ALIASES[c.code] ?? []).map(normalise)];
    let score = -1;
    if (name.startsWith(q)) score = 0;
    else if (c.code.toLowerCase() === q || terms.some((t) => t.startsWith(q))) score = 1;
    else if (terms.some((t) => t.split(' ').some((w) => w.startsWith(q)))) score = 2;
    else if (terms.some((t) => t.includes(q))) score = 3;
    if (score >= 0) scored.push([score, c]);
  }
  // Ties go to the suggested countries ("ne" -> Netherlands before Nepal),
  // then stay A–Z (the sort is stable).
  const boost = (c: Country) => (SUGGESTED_CODES.includes(c.code) ? 0 : 1);
  return scored.sort((a, b) => a[0] - b[0] || boost(a[1]) - boost(b[1])).map(([, c]) => c);
}

/**
 * Best guess at the visitor's country from the browser's language settings
 * ("en-US" -> US, "fr-CA" -> CA). The first tag that names a region wins;
 * failing that, the first bare language ("de") is expanded with Intl.Locale's
 * likely-subtags data ("de" -> "de-Latn-DE"). Returns undefined rather than
 * guessing when nothing usable is there.
 *
 * It's a language preference, not a location, so it only pre-fills the
 * field: the visitor can always change it.
 */
export function guessCountry(languages: readonly string[]): Country | undefined {
  const locales: Intl.Locale[] = [];
  for (const tag of languages) {
    try {
      locales.push(new Intl.Locale(tag));
    } catch {
      // Malformed tag: skip it.
    }
  }
  for (const locale of locales) {
    const match = countryByCode(locale.region);
    if (match) return match;
  }
  for (const locale of locales) {
    const match = countryByCode(locale.maximize().region);
    if (match) return match;
  }
  return undefined;
}
