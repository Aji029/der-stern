import { isValid, format, parseISO } from 'date-fns';

export function formatDateForInput(date: Date | string): string {
  try {
    const parsedDate = date instanceof Date ? date : parseISO(date);
    if (!isValid(parsedDate)) {
      return format(new Date(), 'yyyy-MM-dd');
    }
    return format(parsedDate, 'yyyy-MM-dd');
  } catch (error) {
    console.warn('Invalid date value:', date);
    return format(new Date(), 'yyyy-MM-dd');
  }
}

export function formatDateForDisplay(date: Date | string): string {
  try {
    const parsedDate = date instanceof Date ? date : parseISO(date);
    if (!isValid(parsedDate)) {
      return format(new Date(), 'PP');
    }
    return format(parsedDate, 'PP');
  } catch (error) {
    console.warn('Invalid date value:', date);
    return format(new Date(), 'PP');
  }
}

export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  try {
    const d1 = date1 instanceof Date ? date1 : parseISO(date1);
    const d2 = date2 instanceof Date ? date2 : parseISO(date2);
    if (!isValid(d1) || !isValid(d2)) return false;
    
    return format(d1, 'yyyy-MM-dd') === format(d2, 'yyyy-MM-dd');
  } catch (error) {
    console.warn('Invalid date comparison:', { date1, date2 });
    return false;
  }
}