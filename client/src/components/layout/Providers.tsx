'use client';
import { AuthProvider } from '@/context/AuthContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { Toaster } from 'react-hot-toast';
import { EnquiryPopup } from '@/components/common/EnquiryPopup';

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <WishlistProvider>
                <CurrencyProvider>
                    {children}
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            style: {
                                background: '#1a1a1a',
                                color: '#fff',
                                border: '1px solid rgba(255,255,255,0.1)',
                            },
                        }}
                    />
                    <EnquiryPopup />
                </CurrencyProvider>
            </WishlistProvider>
        </AuthProvider>
    );
}
