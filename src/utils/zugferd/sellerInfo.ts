/**
 * Seller (Verkäufer) constants used in ZUGFeRD / Factur-X invoice XML.
 * Update IBAN and BIC before distributing invoices to customers.
 */
export const SELLER = {
  name: 'DER STERN',
  contact: 'Sabrina Kretschmar',
  street: 'Stubnitzstraße 28',
  city: '13189 Berlin',
  country: 'DE',
  /** Steuernummer — mapped to schemeID="FC" in ZUGFeRD XML */
  taxId: '35/398/01172',
  /** IBAN without spaces */
  iban: 'DE20100900005785987014',
  /** BIC of the bank */
  bic: 'BEVODEBB',
};
