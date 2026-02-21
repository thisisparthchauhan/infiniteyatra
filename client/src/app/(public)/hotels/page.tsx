// Hotels listing page — SSR (inventory changes frequently)
import type { Metadata } from 'next';
import { getAllHotels } from '@/lib/firebase/server';
import HotelsListClient from '@/components/hotels/HotelsListClient';

export const revalidate = 1800; // 30 min

export const metadata: Metadata = {
    title: 'Hotel Bookings India — Best Hotel Deals | Infinite Yatra',
    description: 'Book hotels in India at the best prices. Curated hotel inventory across top Indian destinations through Infinite Yatra.',
};

export default async function HotelsPage() {
    const hotels = await getAllHotels();
    return <HotelsListClient initialHotels={hotels} />;
}
