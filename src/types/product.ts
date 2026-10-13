export interface Product {
  artikelNr: string;
  bestellnummer?: string;
  name: string;
  vkPrice: number;
  ekPrice: number;
  mwst: 'A' | 'B';
  packungArt: string;
  herkunftsland: string;
  produktgruppe: string;
  supplierId?: string;
  image?: string | null;
  istBestand?: number;
  /** Position on the walk through the market (Today's Pick). Lower = picked first. */
  pickPosition?: number | null;
}