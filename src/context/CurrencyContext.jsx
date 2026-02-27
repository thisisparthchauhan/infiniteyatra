import React, { createContext, useContext, useState, useEffect } from 'react';
import { CURRENCIES, formatPrice as serviceFormatPrice } from '../utils/currencyService';

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
    console.log('CurrencyProvider initializing');
    const [currency, setCurrency] = useState('INR'); // Default

    // Persist selection
    useEffect(() => {
        const saved = localStorage.getItem('iy_currency');
        if (saved && CURRENCIES[saved]) {
            setCurrency(saved);
        }
    }, []);

    const changeCurrency = (code) => {
        if (CURRENCIES[code]) {
            setCurrency(code);
            localStorage.setItem('iy_currency', code);
        }
    };

    const formatPrice = (amountInINR) => {
        return serviceFormatPrice(amountInINR, currency);
    };

    const value = {
        currency,
        currencyData: CURRENCIES[currency],
        allCurrencies: CURRENCIES,
        setCurrency: changeCurrency,
        formatPrice
    };

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};
