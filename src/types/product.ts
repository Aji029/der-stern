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
}