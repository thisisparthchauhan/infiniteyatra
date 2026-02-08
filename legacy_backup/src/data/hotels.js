export const hotels = [
    {
        id: 'grand-iy-resort',
        name: 'The Grand IY Resort',
        city: 'Goa',
        location: 'Goa',
        address: 'Calangute Beach Road, North Goa',
        price: 12000,
        costPrice: 8500,
        tokenPrice: 2000,
        rating: 4.8,
        category: '5 Star',
        image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=2649&auto=format&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=2649&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=2670&auto=format&fit=crop'
        ],
        description: 'Luxury resort with private beach access and world-class amenities.',
        isVisible: true,
        hotelType: ['Luxury', 'Resort', 'Honeymoon'],
        highlights: ['Private Beach Access', 'Infinity Pool', 'Sunset View'],
        inclusions: ['Breakfast', 'Welcome Drink', 'WiFi', 'Pool Access'],
        exclusions: ['Lunch', 'Dinner', 'Spa Services', 'Airport Transfer'],
        goodToKnow: ['Check-in: 2 PM', 'Check-out: 11 AM', 'No smoking in rooms'],
        whoIsThisFor: ['Couples', 'Families', 'Luxury Travelers'],
        thingsToCarry: ['Swimwear', 'Sunscreen', 'Sunglasses'],
        faqs: [
            { question: 'Is early check-in available?', answer: 'Subject to availability and may incur extra charges.' }
        ],
        rooms: [
            { id: 1, name: 'Deluxe Sea View', occupancy: 2, price: 12000, costPrice: 8500, count: 5, description: 'King bed with balcony facing the sea.' },
            { id: 2, name: 'Premium Suite', occupancy: 2, price: 18000, costPrice: 12000, count: 2, description: 'Large suite with jacuzzi.' }
        ],
        policies: {
            cancellation: 'Free cancellation up to 48 hours before check-in.',
            refund: 'Processed within 5-7 business days.',
            child: 'Children under 5 stay free.',
            pet: 'Small pets allowed on request.'
        }
    },
    {
        id: 'himalayan-sanctuary',
        name: 'Himalayan Sanctuary',
        city: 'Manali',
        location: 'Manali',
        address: 'Old Manali Road, Near Club House',
        price: 8500,
        costPrice: 5000,
        tokenPrice: 1000,
        rating: 4.9,
        category: 'Boutique',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2670&auto=format&fit=crop',
        images: [],
        description: 'Peaceful retreat in the mountains providing panoramic views of the Himalayas.',
        isVisible: true,
        hotelType: ['Trek Stay', 'Spiritual', 'Nature'],
        highlights: ['Mountain View', 'Apple Orchard', 'Bonfire Pit'],
        inclusions: ['Breakfast', 'Dinner', 'Guide for short trek'],
        exclusions: ['Lunch', 'Heater (Extra Charge)'],
        goodToKnow: ['Steep climb to reach property', 'Carry warm clothes'],
        whoIsThisFor: ['Trekkers', 'Nature Lovers', 'Solo Travelers'],
        thingsToCarry: ['Warm Jacket', 'Trek Shoes'],
        faqs: [],
        rooms: [
            { id: 1, name: 'Mountain View Room', occupancy: 2, price: 8500, costPrice: 5000, count: 8, description: ' Cozy room with wooden interiors.' }
        ],
        policies: {
            cancellation: 'Non-refundable booking.',
            refund: 'No refunds.',
            child: 'Above 10 years charged as adult.',
            pet: 'Not allowed.'
        }
    },
    {
        id: 'desert-oasis-camp',
        name: 'Desert Oasis Camp',
        city: 'Jaisalmer',
        location: 'Jaisalmer',
        address: 'Sam Sand Dunes, Jaisalmer',
        price: 5500,
        costPrice: 3000,
        tokenPrice: 500,
        rating: 4.7,
        category: '3 Star',
        image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=2670&auto=format&fit=crop',
        images: [],
        description: 'Luxury swiss tents in the middle of the Thar desert.',
        isVisible: true,
        hotelType: ['Budget', 'Experience', 'Family'],
        highlights: ['Sand Dunes', 'Cultural Program', 'Camel Safari'],
        inclusions: ['Camel Safari', 'Dinner (Veg)', 'Breakfast', 'Evening Tea'],
        exclusions: ['Jeep Safari', 'Alcohol'],
        goodToKnow: ['Remote location', 'Network might be weak'],
        whoIsThisFor: ['Families', 'Groups', 'Couples'],
        thingsToCarry: ['Sunscreen', 'Power bank'],
        faqs: [],
        rooms: [
            { id: 1, name: 'Swiss Tent', occupancy: 3, price: 5500, costPrice: 3000, count: 20, description: 'Attached bathroom with running water.' }
        ],
        policies: {
            cancellation: 'Free cancellation 7 days prior.',
            refund: 'Full refund.',
            child: 'Free under 6.',
            pet: 'Allowed.'
        }
    }
];
