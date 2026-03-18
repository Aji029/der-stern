export const vatRates = [
  { value: 'A', label: 'A (7%)', rate: 7 },
  { value: 'B', label: 'B (19%)', rate: 19 },
];

export const countries = [
  'Germany',
  'France',
  'Italy',
  'Spain',
  'Netherlands',
  'Belgium',
  'Austria',
  'Switzerland',
];

export const productGroups = [
  { id: 'Backwaren', name: 'Backwaren' },
  { id: 'Getränke', name: 'Getränke' },
  { id: 'Konserven', name: 'Konserven' },
  { id: 'Süßwaren', name: 'Süßwaren' },
  { id: 'Tiefkühlkost', name: 'Tiefkühlkost' },
  { id: 'Obst & Gemüse', name: 'Obst & Gemüse' },
  { id: 'Molkerei & Feinkost', name: 'Molkerei & Feinkost' },
];

export const INITIAL_PRODUCT_DATA = {
  artikelNr: '',
  bestellnummer: '',
  name: '',
  vkPrice: 0,
  ekPrice: 0,
  mwst: 'A',
  packungArt: 'Gebinde',
  herkunftsland: 'Germany',
  produktgruppe: 'Backwaren',
  supplierId: '',
  istBestand: 0,
  image: null as File | null,
  imagePreview: '',
};