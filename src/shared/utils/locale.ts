/**
 * App-wide locale settings for Philippines
 */

export const APP_LOCALE = {
  country: 'Philippines',
  countryCode: 'PH',
  timezone: 'Asia/Manila',
  currency: 'PHP',
  currencySymbol: '₱',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h' as '12h' | '24h',
  language: 'en',
  phoneCode: '+63',
};

export const PHILIPPINES_TIMEZONES = [
  { value: 'Asia/Manila', label: 'Manila (PHT)' },
];

export const PHILIPPINES_CITIES = [
  'Manila',
  'Quezon City',
  'Caloocan',
  'Davao City',
  'Cebu City',
  'Zamboanga City',
  'Antipolo',
  'Pasig',
  'Cagayan de Oro',
  'Valenzuela',
  'Las Piñas',
  'Makati',
  'Bacolod',
  'General Santos',
  'Parañaque',
  'Muntinlupa',
  'San Jose del Monte',
  'Las Piñas',
  'Marikina',
  'Mandaue',
];

export function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: Date | string, format: string = APP_LOCALE.dateFormat): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  
  switch (format) {
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    default:
      return `${month}/${day}/${year}`;
  }
}

export function formatTime(date: Date | string, format: '12h' | '24h' = APP_LOCALE.timeFormat): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (format === '24h') {
    return d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: false });
  } else {
    return d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true });
  }
}
