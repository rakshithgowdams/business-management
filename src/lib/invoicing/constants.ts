export const GST_RATES = [0, 0.25, 3, 5, 12, 18, 28];

export const UNIT_TYPES = [
  'Nos', 'Hrs', 'Days', 'Pcs', 'Kg', 'Ltr', 'Mtr', 'Sqft', 'Box', 'Set', 'Pair', 'Units',
];

export const CURRENCY_OPTIONS = [
  { code: 'INR', symbol: 'Rs.', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: 'EUR', name: 'Euro' },
  { code: 'GBP', symbol: 'GBP', name: 'British Pound' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
  { code: 'SGD', symbol: 'SGD', name: 'Singapore Dollar' },
  { code: 'AUD', symbol: 'AUD', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'CAD', name: 'Canadian Dollar' },
];

export const PAYMENT_TERMS = [
  'Due on Receipt',
  'Net 7',
  'Net 15',
  'Net 30',
  'Net 45',
  'Net 60',
  'Net 90',
  'Custom',
];

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

export const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'overdue', 'cancelled'] as const;
export const QUOTATION_STATUSES = ['draft', 'sent', 'accepted', 'rejected', 'expired'] as const;

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertChunk(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convertChunk(n % 100) : '');
}

export function numberToWords(num: number): string {
  if (num === 0) return 'Zero';
  const isNeg = num < 0;
  num = Math.abs(Math.floor(num));

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const remainder = num;

  let result = '';
  if (crore) result += convertChunk(crore) + ' Crore ';
  if (lakh) result += convertChunk(lakh) + ' Lakh ';
  if (thousand) result += convertChunk(thousand) + ' Thousand ';
  if (remainder) result += convertChunk(remainder);

  return (isNeg ? 'Minus ' : '') + result.trim() + ' Only';
}

export function calcTotals(
  items: { amount: number; gst_rate: number }[],
  discount: number,
  discountType: string
) {
  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const discountAmount = discountType === 'percentage' ? (subtotal * discount) / 100 : discount;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = items.reduce((s, i) => {
    const itemShare = subtotal > 0 ? (i.amount / subtotal) * taxableAmount : 0;
    return s + (itemShare * i.gst_rate) / 100;
  }, 0);
  return {
    subtotal,
    discountAmount,
    taxAmount,
    total: taxableAmount + taxAmount,
  };
}
