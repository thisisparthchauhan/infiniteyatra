export const hotels = [
    {
        id: 'mock-1',
        name: 'Zostel Homes Shimla',
        city: 'Shimla, Himachal Pradesh',
        location: 'Shimla',
        address: 'House No 15, IAS Colony, Panthaghati Sargeen, Shimla, Himachal Pradesh - 171013',
        price: 3499,
        costPrice: 2500,
        tokenPrice: 500,
        rating: 4.8,
        category: 'Homestay',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        images: [
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
            'https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1925&q=80',
            'https://images.unsplash.com/photo-1590490360182-c8729931f548?ixlib=rb-4.0.3&auto=format&fit=crop&w=2073&q=80'
        ],
        description: "Less than a 30 mins drive from Shimla city centre, Zostel Homes Shimla is settled in a posh locale overlooking the Shimla valley.",
        isVisible: true,
        hotelType: ['Homestay', 'Mountain View', 'Nature'],
        highlights: ['Mountain View', 'Private Balcony', 'Home-cooked Meals', 'WiFi'],
        inclusions: ['Breakfast', 'WiFi', 'Parking'],
        exclusions: ['Lunch/Dinner (Extra)', 'Heater (₹300/night)', 'Bonfire'],
        goodToKnow: ['Check-in 1 PM', 'Check-out 11 AM', 'Quiet Hours 10 PM - 6 AM'],
        whoIsThisFor: ['Couples', 'Remote Workers', 'Families'],
        thingsToCarry: ['Warm Clothes', 'Valid ID', 'Personal Medicines'],
        faqs: [
            { question: 'Is parking available?', answer: 'Yes, free private parking is available on site.' }
        ],
        rooms: [
            { id: 'r1', name: 'Deluxe Room (with Balcony)', occupancy: 2, price: 3499, costPrice: 2500, count: 3, description: 'Artsy and airy room with mountain view.' },
            { id: 'r2', name: 'Superior Deluxe Room', occupancy: 2, price: 3999, costPrice: 3000, count: 2, description: 'Green and serene room with private garden.' },
            { id: 'r3', name: 'Family Suite', occupancy: 4, price: 5999, costPrice: 4500, count: 1, description: 'Quad room designed for families.' }
        ],
        policies: {
            cancellation: 'Free cancellation until 7 days before check-in. 50% refund until 3 days before check-in.',
            refund: 'Processed within 5-7 business days.',
            child: 'Children above 5 years are chargeable.',
            pet: 'No pets allowed.'
        }
    }
];
