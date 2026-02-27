'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

interface CurrencyContextType {
    currency: 'INR' | 'USD' | 'EUR' | 'GBP';
    setCurrency: (c: 'INR' | 'USD' | 'EUR' | 'GBP') => void;
    formatPrice: (amountInINR: number) => string;
}

const rates: Record<string, number> = {
    INR: 1,
    USD: 0.012,
    EUR: 0.011,
    GBP: 0.0095,
};

const symbols: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
};

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const [currency, setCurrency] = useState<'INR' | 'USD' | 'EUR' | 'GBP'>('INR');

    const formatPrice = (amountInINR: number) => {
        const converted = amountInINR * (rates[currency] ?? 1);
        return `${symbols[currency]}${converted.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency(): CurrencyContextType {
    const ctx = useContext(CurrencyContext);
    if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
    return ctx;
}
