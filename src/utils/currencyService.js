export const CURRENCIES = {
    INR: { code: 'INR', symbol: '₹', rate: 1, name: 'Indian Rupee' },
    USD: { code: 'USD', symbol: '$', rate: 0.012, name: 'US Dollar' },
    EUR: { code: 'EUR', symbol: '€', rate: 0.011, name: 'Euro' },
    GBP: { code: 'GBP', symbol: '£', rate: 0.0095, name: 'British Pound' },
    AED: { code: 'AED', symbol: 'Dh', rate: 0.044, name: 'UAE Dirham' }
};

/**
 * Converts an amount from base currency (INR) to target currency.
 */
export const convertPrice = (amountInINR, targetCurrencyCode) => {
    const currency = CURRENCIES[targetCurrencyCode];
    if (!currency) return amountInINR;
    return amountInINR * currency.rate;
};

/**
 * Formats a price with symbol.
 */
export const formatPrice = (amountInINR, targetCurrencyCode) => {
    const currency = CURRENCIES[targetCurrencyCode] || CURRENCIES.INR;
    const converted = amountInINR * currency.rate;

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.code,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(converted);
};
