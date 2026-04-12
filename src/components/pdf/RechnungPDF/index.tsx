import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import sternLogo from '../../../assets/stern-logo.jpg';
import type { Order } from '../../../types/order';
import { SELLER } from '../../../utils/zugferd/sellerInfo';

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

const fmt = (n: number) =>
  n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtEur = (n: number) => `${fmt(n)} €`;

const fmtDate = (d: Date) =>
  d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

const fmtIban = (s: string) => s.replace(/(.{4})/g, '$1 ').trim();

function calcVat(order: Order) {
  const items = order.items;
  const nettoA = items
    .filter(i => i.product.mwst === 'A')
    .reduce((s, i) => s + i.quantity * i.vkPrice, 0);
  const nettoB = items
    .filter(i => i.product.mwst === 'B')
    .reduce((s, i) => s + i.quantity * i.vkPrice, 0);
  const vatA = nettoA * 0.07;
  const vatB = nettoB * 0.19;
  const totalNetto = nettoA + nettoB;
  const totalVat = vatA + vatB;
  return { nettoA, vatA, nettoB, vatB, totalNetto, totalVat, brutto: totalNetto + totalVat };
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const S = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#111827',
    paddingTop: 32,
    paddingBottom: 56,
    paddingHorizontal: 42,
  },

  // ── Letterhead ──────────────────────────────────────────────────────────
  letterhead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderTopWidth: 4,
    borderTopColor: '#D4D478',
    paddingTop: 10,
    paddingBottom: 10,
    marginBottom: 4,
  },
  lhLeft: { flexDirection: 'column' },
  logo: {
    width: 90,
    height: 50,
    objectFit: 'contain' as const,
    alignSelf: 'center' as const,
  },
  companyName: {
    fontSize: 17,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    letterSpacing: 1,
  },
  companySubline: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 2,
  },

  // ── Divider ─────────────────────────────────────────────────────────────
  divider: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#d1d5db',
    marginBottom: 16,
  },

  // ── Address section ─────────────────────────────────────────────────────
  addrSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  addrLeft: { width: '56%' },
  addrSenderLine: {
    fontSize: 7,
    color: '#9ca3af',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 3,
    marginBottom: 6,
  },
  addrCustomerName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 2,
  },
  addrLine: {
    fontSize: 8.5,
    color: '#374151',
    marginBottom: 1.5,
  },
  addrKundennr: {
    fontSize: 7.5,
    color: '#9ca3af',
    marginTop: 5,
  },
  addrRight: {
    width: '38%',
    alignItems: 'flex-end',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 3,
  },
  metaLabel: {
    fontSize: 8,
    color: '#6b7280',
    width: 80,
    textAlign: 'right',
    paddingRight: 6,
  },
  metaValue: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    width: 72,
    textAlign: 'right',
  },

  // ── Subject line ────────────────────────────────────────────────────────
  subjectWrap: {
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: '#111827',
    paddingVertical: 6,
    marginBottom: 16,
  },
  subjectText: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },

  // ── Items table ─────────────────────────────────────────────────────────
  tableHead: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#d1d5db',
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.3,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  tableRowAlt: { backgroundColor: '#fafafa' },
  th: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  td: { fontSize: 8.5, color: '#111827' },

  // Column widths (Einh. removed, width redistributed to Bez + Menge)
  cPos:    { width: '5%' },
  cArt:    { width: '12%' },
  cBez:    { width: '41%' },
  cMenge:  { width: '10%', textAlign: 'right' as const },
  cEP:     { width: '14%', textAlign: 'right' as const },
  cGP:     { width: '13%', textAlign: 'right' as const },
  cMwst:   { width: '5%',  textAlign: 'center' as const },

  // ── VAT summary ─────────────────────────────────────────────────────────
  summaryOuter: {
    marginTop: 14,
    alignItems: 'flex-end',
  },
  sumRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 2,
  },
  sumLabel: {
    fontSize: 8.5,
    color: '#6b7280',
    width: 140,
    textAlign: 'right',
    paddingRight: 8,
  },
  sumValue: {
    fontSize: 8.5,
    color: '#111827',
    width: 72,
    textAlign: 'right',
  },
  sumDivider: {
    borderTopWidth: 1,
    borderTopColor: '#111827',
    width: 212,
    marginVertical: 4,
  },
  sumTotalLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    width: 140,
    textAlign: 'right',
    paddingRight: 8,
  },
  sumTotalValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    width: 72,
    textAlign: 'right',
  },

  // ── Payment section ─────────────────────────────────────────────────────
  payWrap: {
    marginTop: 24,
    borderTopWidth: 0.5,
    borderTopColor: '#d1d5db',
    paddingTop: 10,
  },
  payTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  payNote: {
    fontSize: 8,
    color: '#374151',
    marginBottom: 8,
  },
  payGrid: {
    flexDirection: 'row',
    gap: 28,
  },
  payCol: { flexDirection: 'column' },
  payKeyLabel: {
    fontSize: 7,
    color: '#9ca3af',
    marginBottom: 1,
  },
  payKeyValue: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  payRef: {
    fontSize: 7.5,
    color: '#6b7280',
    marginTop: 7,
  },

  // ── Thank-you line ───────────────────────────────────────────────────────
  thankYou: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 7.5,
    color: '#9ca3af',
  },
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  order: Order;
  invoiceNumber?: string;
}

export function RechnungPDF({ order, invoiceNumber }: Props) {
  const invNr = invoiceNumber ?? order.id;
  const vat = calcVat(order);
  const delivDate = order.deliveryDate ?? order.orderDate;

  return (
    <Document
      title={`Rechnung Nr. ${invNr}`}
      author={SELLER.name}
      subject="Rechnung"
    >
      <Page size="A4" style={S.page}>

        {/* ── Letterhead ── */}
        <View style={S.letterhead}>
          <View style={S.lhLeft}>
            <Text style={S.companyName}>{SELLER.name}</Text>
            <Text style={S.companySubline}>{SELLER.contact}</Text>
            <Text style={S.companySubline}>
              {SELLER.street} · {SELLER.city}
            </Text>
            <Text style={S.companySubline}>Steuernummer: {SELLER.taxId}</Text>
          </View>
          <Image src={sternLogo} style={S.logo} />
        </View>

        <View style={S.divider} />

        {/* ── Address + Invoice meta ── */}
        <View style={S.addrSection}>
          {/* Customer address */}
          <View style={S.addrLeft}>
            <Text style={S.addrSenderLine}>
              {SELLER.name} · {SELLER.street} · {SELLER.city}
            </Text>
            <Text style={S.addrCustomerName}>{order.customer.companyName}</Text>
            {!!order.customer.contactPerson && (
              <Text style={S.addrLine}>{order.customer.contactPerson}</Text>
            )}
            {!!order.customer.address && (
              <Text style={S.addrLine}>{order.customer.address}</Text>
            )}
            {!!order.customer.idNumber && (
              <Text style={S.addrKundennr}>
                Kundennr.: {order.customer.idNumber}
              </Text>
            )}
          </View>

          {/* Invoice meta */}
          <View style={S.addrRight}>
            <View style={S.metaRow}>
              <Text style={S.metaLabel}>Rechnungsdatum:</Text>
              <Text style={S.metaValue}>{fmtDate(order.orderDate)}</Text>
            </View>
            <View style={S.metaRow}>
              <Text style={S.metaLabel}>Rechnungs-Nr.:</Text>
              <Text style={S.metaValue}>{invNr}</Text>
            </View>
            <View style={S.metaRow}>
              <Text style={S.metaLabel}>Lieferdatum:</Text>
              <Text style={S.metaValue}>{fmtDate(delivDate)}</Text>
            </View>
          </View>
        </View>

        {/* ── Subject / Title ── */}
        <View style={S.subjectWrap}>
          <Text style={S.subjectText}>RECHNUNG NR. {invNr}</Text>
        </View>

        {/* ── Items table ── */}
        <View style={S.tableHead}>
          <Text style={[S.th, S.cPos]}>Pos.</Text>
          <Text style={[S.th, S.cArt]}>Artikel</Text>
          <Text style={[S.th, S.cBez]}>Bezeichnung</Text>
          <Text style={[S.th, S.cMenge]}>Menge</Text>
          <Text style={[S.th, S.cEP]}>EP</Text>
          <Text style={[S.th, S.cGP]}>GP</Text>
          <Text style={[S.th, S.cMwst]}>%</Text>
        </View>

        {order.items.map((item, idx) => (
          <View
            key={item.id ?? idx}
            style={[S.tableRow, idx % 2 === 1 ? S.tableRowAlt : {}]}
          >
            <Text style={[S.td, S.cPos]}>{idx + 1}</Text>
            <Text style={[S.td, S.cArt]}>{item.product.artikelNr}</Text>
            <Text style={[S.td, S.cBez]}>{item.product.name}</Text>
            <Text style={[S.td, S.cMenge]}>{fmt(item.quantity)}</Text>
            <Text style={[S.td, S.cEP]}>{fmtEur(item.vkPrice)}</Text>
            <Text style={[S.td, S.cGP]}>{fmtEur(item.quantity * item.vkPrice)}</Text>
            <Text style={[S.td, S.cMwst]}>{item.product.mwst}</Text>
          </View>
        ))}

        {/* ── VAT Summary ── */}
        <View style={S.summaryOuter}>
          {vat.nettoA > 0 && (
            <View style={S.sumRow}>
              <Text style={S.sumLabel}>Nettobetrag 7% (A):</Text>
              <Text style={S.sumValue}>{fmtEur(vat.nettoA)}</Text>
            </View>
          )}
          {vat.nettoB > 0 && (
            <View style={S.sumRow}>
              <Text style={S.sumLabel}>Nettobetrag 19% (B):</Text>
              <Text style={S.sumValue}>{fmtEur(vat.nettoB)}</Text>
            </View>
          )}
          <View style={S.sumRow}>
            <Text style={S.sumLabel}>Gesamtnettobetrag:</Text>
            <Text style={S.sumValue}>{fmtEur(vat.totalNetto)}</Text>
          </View>
          {vat.nettoA > 0 && (
            <View style={S.sumRow}>
              <Text style={S.sumLabel}>MwSt. 7% (A):</Text>
              <Text style={S.sumValue}>{fmtEur(vat.vatA)}</Text>
            </View>
          )}
          {vat.nettoB > 0 && (
            <View style={S.sumRow}>
              <Text style={S.sumLabel}>MwSt. 19% (B):</Text>
              <Text style={S.sumValue}>{fmtEur(vat.vatB)}</Text>
            </View>
          )}
          <View style={S.sumDivider} />
          <View style={S.sumRow}>
            <Text style={S.sumTotalLabel}>Rechnungsbetrag:</Text>
            <Text style={S.sumTotalValue}>{fmtEur(vat.brutto)}</Text>
          </View>
        </View>

        {/* ── Payment information ── */}
        <View style={S.payWrap}>
          <Text style={S.payTitle}>Zahlungsinformationen</Text>
          <Text style={S.payNote}>
            Bitte überweisen Sie den Rechnungsbetrag Zahlbar sofort ohne Abzug, Die Ware bleibt bis zur vollständigen Bezahlung unser Eigentum.
          </Text>
          <View style={S.payGrid}>
            <View style={S.payCol}>
              <Text style={S.payKeyLabel}>Empfänger</Text>
              <Text style={S.payKeyValue}>{SELLER.name}</Text>
              <Text style={[S.payKeyValue, { fontSize: 8, fontFamily: 'Helvetica' }]}>
                {SELLER.contact}
              </Text>
            </View>
            <View style={S.payCol}>
              <Text style={S.payKeyLabel}>IBAN</Text>
              <Text style={S.payKeyValue}>{fmtIban(SELLER.iban)}</Text>
            </View>
            <View style={S.payCol}>
              <Text style={S.payKeyLabel}>BIC</Text>
              <Text style={S.payKeyValue}>{SELLER.bic}</Text>
            </View>
          </View>
          <Text style={S.payRef}>
            Verwendungszweck: Rechnung Nr. {invNr}
          </Text>
        </View>

        <Text style={S.thankYou}>Vielen Dank für Ihr Vertrauen!</Text>

      </Page>
    </Document>
  );
}
