import { useState, useCallback } from 'react';
import { startOfDay, parseISO } from 'date-fns';

export function useOrderDates() {
  const [selectedDate, setSelectedDate] = useState('');

  const handleDateChange = useCallback((date: string) => {
    // Ensure we're working with the start of day to avoid timezone issues
    const parsedDate = startOfDay(parseISO(date));
    setSelectedDate(parsedDate.toISOString().split('T')[0]);
  }, []);

  return {
    selectedDate,
    handleDateChange
  };
}