/** German formatting. Every figure the user reads is in their own notation. */

export const euro = (value: number | null | undefined, decimals = 2): string =>
  value === null || value === undefined
    ? '—'
    : value.toLocaleString('de-DE', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });

/** Prices carry three decimals; trailing zeros are dropped so 2,890 reads 2,89. */
export const price = (value: number | null | undefined): string =>
  value === null || value === undefined
    ? '—'
    : value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 3 });

export const percent = (value: number | null | undefined): string =>
  value === null || value === undefined
    ? '—'
    : `${value > 0 ? '+' : ''}${value.toLocaleString('de-DE', { maximumFractionDigits: 1 })} %`;

export const date = (value: string | null | undefined): string =>
  value ? new Date(value).toLocaleDateString('de-DE') : '—';

export const dateTime = (value: string | null | undefined): string =>
  value ? new Date(value).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' }) : '—';

/** Counts, not money: 13 stays "13", 2,035 kg keeps its three decimals. */
export const quantity = (value: number | null | undefined): string =>
  value === null || value === undefined
    ? '—'
    : value.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 3 });
