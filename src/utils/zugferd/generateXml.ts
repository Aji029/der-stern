/**
 * ZUGFeRD 2.3 BASIC XML generator.
 *
 * Produces a CrossIndustryInvoice XML string conforming to:
 *   urn:cen.eu:en16931:2017#compliant#urn:zugferd.de:2p0:basic
 *
 * This file is embedded inside the PDF as "factur-x.xml" by embedXml.ts.
 */
import { format } from 'date-fns';
import { SELLER } from './sellerInfo';
import type { Order, OrderItem } from '../../types/order';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(n: number): string {
  return n.toFixed(2);
}

function fmtDate(d: Date | string): string {
  return format(new Date(d), 'yyyyMMdd');
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ---------------------------------------------------------------------------
// VAT calculation (mirrors Summary.tsx logic)
// ---------------------------------------------------------------------------

interface VatBucket {
  categoryCode: string; // 'AA' = 7 %, 'S' = 19 %
  rate: number;         // 7 or 19
  netto: number;
  vat: number;
}

function calcVat(items: OrderItem[]): { a: VatBucket; b: VatBucket; totalNetto: number; totalVat: number; totalBrutto: number } {
  const nettoA = items.filter(i => i.product.mwst === 'A').reduce((s, i) => s + i.quantity * i.vkPrice, 0);
  const nettoB = items.filter(i => i.product.mwst === 'B').reduce((s, i) => s + i.quantity * i.vkPrice, 0);

  const vatA = nettoA * 0.07;
  const vatB = nettoB * 0.19;

  return {
    a: { categoryCode: 'AA', rate: 7, netto: nettoA, vat: vatA },
    b: { categoryCode: 'S', rate: 19, netto: nettoB, vat: vatB },
    totalNetto: nettoA + nettoB,
    totalVat: vatA + vatB,
    totalBrutto: nettoA + nettoB + vatA + vatB,
  };
}

// ---------------------------------------------------------------------------
// Line item XML
// ---------------------------------------------------------------------------

function lineItemXml(item: OrderItem, index: number): string {
  const lineTotal = item.quantity * item.vkPrice;
  const vatRate   = item.product.mwst === 'A' ? 7 : 19;
  const catCode   = item.product.mwst === 'A' ? 'AA' : 'S';

  return `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${index + 1}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:SellerAssignedID>${escapeXml(item.product.artikelNr || '')}</ram:SellerAssignedID>
        <ram:Name>${escapeXml(item.product.name)}</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${fmt(item.vkPrice)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="C62">${fmt(item.quantity)}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>${catCode}</ram:CategoryCode>
          <ram:RateApplicablePercent>${vatRate}.00</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${fmt(lineTotal)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`;
}

// ---------------------------------------------------------------------------
// VAT summary block XML
// ---------------------------------------------------------------------------

function vatBlockXml(bucket: VatBucket): string {
  if (bucket.netto === 0) return '';
  return `
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${fmt(bucket.vat)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>${fmt(bucket.netto)}</ram:BasisAmount>
        <ram:CategoryCode>${bucket.categoryCode}</ram:CategoryCode>
        <ram:RateApplicablePercent>${bucket.rate}.00</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>`;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function generateZugferdXml(order: Order, invoiceNumber?: string): string {
  const invoiceNr   = invoiceNumber || order.id;
  const invoiceDate = fmtDate(order.orderDate);
  const deliveryDate = fmtDate(order.deliveryDate || order.orderDate);
  const { a, b, totalNetto, totalVat, totalBrutto } = calcVat(order.items);

  const buyerName    = escapeXml(order.customer.companyName);
  const buyerAddress = escapeXml(order.customer.address || '');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:xs="http://www.w3.org/2001/XMLSchema"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">

  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017#compliant#urn:zugferd.de:2p0:basic</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>

  <rsm:ExchangedDocument>
    <ram:ID>${escapeXml(invoiceNr)}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${invoiceDate}</udt:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>

  <rsm:SupplyChainTradeTransaction>
${order.items.map((item, i) => lineItemXml(item, i)).join('')}

    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${escapeXml(SELLER.name)}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:LineOne>${escapeXml(SELLER.street)}</ram:LineOne>
          <ram:CityName>${escapeXml(SELLER.city)}</ram:CityName>
          <ram:CountryID>${SELLER.country}</ram:CountryID>
        </ram:PostalTradeAddress>
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="FC">${escapeXml(SELLER.taxId)}</ram:ID>
        </ram:SpecifiedTaxRegistration>
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${buyerName}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:LineOne>${buyerAddress}</ram:LineOne>
          <ram:CountryID>DE</ram:CountryID>
        </ram:PostalTradeAddress>
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>

    <ram:ApplicableHeaderTradeDelivery>
      <ram:ActualDeliverySupplyChainEvent>
        <ram:OccurrenceDateTime>
          <udt:DateTimeString format="102">${deliveryDate}</udt:DateTimeString>
        </ram:OccurrenceDateTime>
      </ram:ActualDeliverySupplyChainEvent>
    </ram:ApplicableHeaderTradeDelivery>

    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      <ram:SpecifiedTradeSettlementPaymentMeans>
        <ram:TypeCode>58</ram:TypeCode>
        <ram:PayeePartyCreditorFinancialAccount>
          <ram:IBANID>${SELLER.iban}</ram:IBANID>
        </ram:PayeePartyCreditorFinancialAccount>
        <ram:PayeeSpecifiedCreditorFinancialInstitution>
          <ram:BICID>${SELLER.bic}</ram:BICID>
        </ram:PayeeSpecifiedCreditorFinancialInstitution>
      </ram:SpecifiedTradeSettlementPaymentMeans>
${vatBlockXml(a)}${vatBlockXml(b)}
      <ram:SpecifiedTradePaymentTerms>
        <ram:Description>Zahlbar sofort ohne Abzug. Verwendungszweck: ${escapeXml(invoiceNr)}</ram:Description>
      </ram:SpecifiedTradePaymentTerms>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${fmt(totalNetto)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${fmt(totalNetto)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">${fmt(totalVat)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${fmt(totalBrutto)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${fmt(totalBrutto)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
}
