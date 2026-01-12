import kedarnathImg from '../assets/kedarnath.png';
import tungnathImg from '../assets/tungnath.png';
import kashmirImg from '../assets/kashmir_v2.jpg';
import soulOfHimalayasImg from '../assets/soul_of_himalayas.png';

export const packages = [

    {
        id: 'kedarkantha',
        title: "Kedarkantha Trek",
        location: "Uttarakhand, India",
        image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2070&auto=format&fit=crop",
        price: 6000,
        priceDisplay: "₹6,000",
        type: "custom",
        rating: 5.0,
        duration: "6 Days / 5 Nights",
        difficulty: "Moderate",
        bestTime: "December to April",
        maxAltitude: "12,500 ft",
        maxGroupSize: 12,
        description: "Kedarkantha is one of the most popular winter treks in India, offering stunning views of the Himalayan peaks. This trek takes you through beautiful pine forests, frozen lakes, and snow-covered meadows, culminating in a breathtaking summit climb.",
        highlights: [
            "Summit climb to 12,500 ft",
            "Panoramic views of Himalayan peaks",
            "Walk through pristine pine forests",
            "Experience camping in snow",
            "Visit ancient temples"
        ],
        itinerary: [
            {
                day: 1,
                title: "Dehradun to Sankri",
                description: "Drive from Dehradun to Sankri village (220 km, 8-10 hours). Enjoy scenic views of the Himalayas and Tons river. Overnight stay in Sankri.",
                activities: ["Scenic drive", "Village exploration", "Acclimatization"]
            },
            {
                day: 2,
                title: "Sankri to Juda Ka Talab",
                description: "Trek from Sankri to Juda Ka Talab (4 km, 4-5 hours). Walk through dense pine forests and reach the beautiful frozen lake. Camp overnight.",
                activities: ["Forest trek", "Lake visit", "Camping"]
            },
            {
                day: 3,
                title: "Juda Ka Talab to Kedarkantha Base",
                description: "Trek to Kedarkantha base camp (4 km, 3-4 hours). Gradual ascent through oak forests with stunning mountain views. Overnight camping.",
                activities: ["Mountain trek", "Photography", "Base camp setup"]
            },
            {
                day: 4,
                title: "Summit Day - Kedarkantha Peak",
                description: "Early morning summit push to Kedarkantha peak (6 km, 6-7 hours round trip). Witness spectacular sunrise and 360-degree views. Descend to Hargaon camp.",
                activities: ["Summit climb", "Sunrise viewing", "Descent to Hargaon"]
            },
            {
                day: 5,
                title: "Hargaon to Sankri",
                description: "Trek back to Sankri village (6 km, 4-5 hours). Descend through forests and meadows. Celebrate the successful trek. Overnight in Sankri.",
                activities: ["Descent trek", "Village stay", "Celebration"]
            },
            {
                day: 6,
                title: "Sankri to Dehradun",
                description: "Drive back to Dehradun (220 km, 8-10 hours). Trip concludes with beautiful memories of the Himalayas.",
                activities: ["Return journey", "Trip conclusion"]
            }
        ],
        inclusions: [
            "Accommodation in tents and guesthouse",
            "All meals during the trek (breakfast, lunch, dinner)",
            "Experienced trek leader and support staff",
            "First aid medical kits and oxygen cylinder",
            "Trekking equipment (tents, sleeping bags, etc.)",
            "Forest permits and camping charges",
            "Transportation from Dehradun to Dehradun"
        ],
        exclusions: [
            "Personal expenses and tips",
            "Insurance of any kind",
            "Cost of any additional activities",
            "Anything not mentioned in inclusions",
            "Personal trekking gear (shoes, backpack, etc.)"
        ],
        images: [
            "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2070&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop"
        ],
        gallery: [
            { id: 1, url: '/images/gallery/kedarkantha-1.png', alt: 'Stunning sunrise view from Kedarkantha summit with golden snow-covered peaks' },
            { id: 2, url: '/images/gallery/kedarkantha-2.png', alt: 'Trekkers hiking on snowy trail with Himalayan mountains in background' },
            { id: 3, url: '/images/gallery/kedarkantha-3.png', alt: 'Camping under starry night sky at Kedarkantha base camp' },
            { id: 4, url: '/images/gallery/kedarkantha-4.png', alt: 'Panoramic 360-degree view from Kedarkantha peak with prayer flags' },
            { id: 5, url: '/images/gallery/kedarkantha-5.png', alt: 'Beautiful pine forest trail with snow and wooden bridge' },
            { id: 6, url: '/images/gallery/kedarkantha-6.png', alt: 'Traditional Uttarakhand village with Himalayan peaks in background' }
        ],

        faqs: [
            {
                id: 1,
                question: 'What is the best time to do the Kedarkantha trek?',
                answer: 'The best time for Kedarkantha trek is from December to April, during the winter months. This is when you can experience snow-covered trails and stunning winter landscapes. December to February offers heavy snowfall, while March-April has moderate snow with clearer skies.'
            },
            {
                id: 2,
                question: 'Is Kedarkantha trek suitable for beginners?',
                answer: 'Yes, Kedarkantha is considered one of the best treks for beginners. The trail is well-marked, the altitude gain is gradual, and the trek duration is manageable. However, basic fitness and some prior walking/hiking experience is recommended.'
            },
            {
                id: 3,
                question: 'What should I pack for the Kedarkantha trek?',
                answer: 'Essential items include: warm layers (thermal wear, fleece jacket, down jacket), waterproof trekking shoes, gloves, woolen socks, sunglasses, sunscreen, water bottle, headlamp, and personal medications. We provide tents, sleeping bags, and technical equipment.'
            },
            {
                id: 4,
                question: 'How difficult is the Kedarkantha trek?',
                answer: 'Kedarkantha is rated as moderate difficulty. The trek involves 4-6 hours of walking daily with a maximum altitude of 12,500 ft. The trails are well-defined, but you\'ll encounter snow and steep sections near the summit. Good physical fitness is recommended.'
            },
            {
                id: 5,
                question: 'Are there any age restrictions for this trek?',
                answer: 'We recommend this trek for people aged 10-65 years. Children should be accompanied by adults, and elderly trekkers should have a medical fitness certificate. Anyone with heart conditions, respiratory issues, or other serious health concerns should consult a doctor before booking.'
            },
            {
                id: 6,
                question: 'What is the accommodation like during the trek?',
                answer: 'Accommodation includes a mix of guesthouses in Sankri village and camping in alpine tents during the trek. All camping equipment including sleeping bags, mattresses, and dining tents are provided. Toilets are available at all campsites.'
            },
            {
                id: 7,
                question: 'Is mobile network available during the trek?',
                answer: 'Mobile network (BSNL and Jio) is available in Sankri village. However, connectivity becomes limited or unavailable once you start trekking. We recommend informing family members beforehand and carrying a power bank.'
            },
            {
                id: 8,
                question: 'What about food during the trek?',
                answer: 'We provide nutritious vegetarian meals including breakfast, lunch, and dinner. The menu includes parathas, rice, dal, vegetables, soup, tea, and snacks. We ensure hygienic food preparation and cater to dietary requirements if informed in advance.'
            }
        ]
    },

    {
        id: 'tungnath',
        title: "Tungnath Trek",
        location: "Uttarakhand, India",
        image: tungnathImg,
        price: 6000,
        priceDisplay: "₹6,000",
        type: "fixed",
        availableDates: ["2026-01-17"],
        rating: 5.0,
        duration: "4 Days / 3 Nights",
        difficulty: "Easy to Moderate",
        bestTime: "April to November",
        maxAltitude: "13,000 ft",
        maxGroupSize: 12,
        description: "Trek to Tungnath, the highest Shiva temple in the world, and continue to Chandrashila peak for panoramic Himalayan views. This short but rewarding trek offers spiritual significance combined with stunning natural beauty and is perfect for beginners.",
        highlights: [
            "Visit world's highest Shiva temple",
            "360-degree Himalayan views from Chandrashila",
            "Walk through rhododendron forests",
            "Witness spectacular sunrise",
            "Perfect for beginner trekkers"
        ],
        itinerary: [
            {
                day: 1,
                title: "Haridwar to Chopta",
                description: "Drive from Haridwar to Chopta (215 km, 8-9 hours). Pass through Devprayag, Rudraprayag, and scenic mountain roads. Overnight camping in Chopta.",
                activities: ["Scenic drive", "Village exploration", "Camping"]
            },
            {
                day: 2,
                title: "Chopta to Tungnath to Chandrashila",
                description: "Trek to Tungnath Temple (3.5 km, 3-4 hours). Visit the temple, then continue to Chandrashila summit (1.5 km, 1-2 hours). Descend back to Chopta. Overnight camping.",
                activities: ["Temple visit", "Summit climb", "Photography"]
            },
            {
                day: 3,
                title: "Chopta to Deoria Tal to Sari Village",
                description: "Drive to Sari village. Trek to Deoria Tal lake (2.5 km, 1-2 hours). Enjoy the reflection of Chaukhamba peaks in the lake. Return to Sari. Overnight stay.",
                activities: ["Lake visit", "Nature photography", "Relaxation"]
            },
            {
                day: 4,
                title: "Sari to Haridwar",
                description: "Drive back to Haridwar (220 km, 8-9 hours). Trip concludes with memories of the beautiful Himalayan trek.",
                activities: ["Return journey", "Trip conclusion"]
            }
        ],
        inclusions: [
            "Accommodation in camps and guesthouses",
            "All meals during the trek",
            "Experienced trek guide",
            "Trekking equipment (tents, sleeping bags)",
            "First aid kit and basic medical support",
            "Forest permits and camping charges",
            "Transportation from Haridwar to Haridwar"
        ],
        exclusions: [
            "Personal trekking gear",
            "Personal expenses and tips",
            "Insurance",
            "Any additional activities",
            "Meals during travel days"
        ],
        images: [
            tungnathImg,
            "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?q=80&w=2070&auto=format&fit=crop"
        ]
    },
    {
        id: 'chardham-2026',
        title: "Chardham Yatra 2026",
        location: "Uttarakhand, India",
        image: kedarnathImg,
        price: 35000,
        priceDisplay: "₹35,000",
        type: "custom",
        validDateRange: {
            start: "2026-05-01",
            end: "2026-10-30"
        },
        discount: "Early Bird Discount",
        rating: 5.0,
        duration: "10 Days / 9 Nights",
        difficulty: "Moderate",
        bestTime: "May to October",
        maxAltitude: "11,755 ft",
        maxGroupSize: 12,
        description: "Embark on the holy Chardham Yatra in 2026. Visit Gangotri, Yamunotri, Kedarnath, and Badrinath. Book now to avail early bird discounts!",
        highlights: [
            "Visit Gangotri & Yamunotri",
            "Darshan at Kedarnath & Badrinath",
            "Scenic Himalayan drive",
            "Spiritual Ganga Aarti",
            "Comfortable accommodation"
        ],
        itinerary: [
            {
                day: 1,
                title: "Haridwar to Barkot",
                description: "Drive to Barkot via Mussoorie. Visit Kempty Falls.",
                activities: ["Scenic drive", "Waterfall visit"]
            },
            {
                day: 2,
                title: "Barkot to Yamunotri",
                description: "Trek to Yamunotri temple and return to Barkot.",
                activities: ["Trek", "Temple darshan"]
            },
            {
                day: 3,
                title: "Barkot to Uttarkashi",
                description: "Drive to Uttarkashi. Visit Kashi Vishwanath Temple.",
                activities: ["Temple visit", "River view"]
            },
            {
                day: 4,
                title: "Uttarkashi to Gangotri",
                description: "Drive to Gangotri, darshan, and return to Uttarkashi.",
                activities: ["Temple darshan", "Ganga puja"]
            },
            {
                day: 5,
                title: "Uttarkashi to Guptkashi",
                description: "Long drive to Guptkashi via Tehri Dam.",
                activities: ["Scenic drive", "Dam view"]
            },
            {
                day: 6,
                title: "Guptkashi to Kedarnath",
                description: "Trek to Kedarnath. Evening Aarti.",
                activities: ["Trek", "Aarti"]
            },
            {
                day: 7,
                title: "Kedarnath to Guptkashi",
                description: "Morning darshan and trek down.",
                activities: ["Darshan", "Trek down"]
            },
            {
                day: 8,
                title: "Guptkashi to Badrinath",
                description: "Drive to Badrinath via Chopta.",
                activities: ["Scenic drive", "Temple darshan"]
            },
            {
                day: 9,
                title: "Badrinath to Rudraprayag",
                description: "Morning darshan and drive to Rudraprayag.",
                activities: ["Darshan", "Confluence view"]
            },
            {
                day: 10,
                title: "Rudraprayag to Haridwar",
                description: "Drive back to Haridwar. Trip concludes.",
                activities: ["Return journey"]
            }
        ],
        inclusions: [
            "Accommodation",
            "Meals (Breakfast & Dinner)",
            "Transportation",
            "Guide"
        ],
        exclusions: [
            "Lunch",
            "Personal expenses",
            "Helicopter tickets"
        ],
        images: [
            kedarnathImg,
            "https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=2076&auto=format&fit=crop"
        ]
    },
    {
        id: 'soul-of-himalayas',
        title: "The Soul of Himalayas",
        location: "Himalayas, India",
        image: soulOfHimalayasImg,
        price: 18000,
        priceDisplay: "₹18,000",
        type: "custom",
        validDateRange: {
            start: "2026-05-01",
            end: "2026-10-30"
        },
        pdf: "/itineraries/IY_The_Soul_Of_Himalayas.pdf",
        rating: 5.0,
        duration: "7 Days / 6 Nights",
        difficulty: "Moderate",
        bestTime: "Year Round",
        maxAltitude: "12,500 ft",
        maxGroupSize: 12,
        description: `✨ The Soul of Himalayas – Infinite Yatra Signature Expedition

Kedarnath • Tungnath • Badrinath • 5 Prayag • Rishikesh • River Rafting

Step into a journey where every mountain breathes stories, every river carries ancient wisdom, and every moment reconnects you with your own soul.
This is not just a tour — this is a pilgrimage into the heart of the Himalayas.

🌄 Kedarnath — Where Faith Touches the Sky
Walk the sacred path to the divine Jyotirlinga, surrounded by towering peaks and the energy of centuries-old devotion.

🕉 Tungnath — The Highest Shiva Temple in the World
A trek that purifies the mind. A view that transforms the heart.
Here, the Himalayas whisper your purpose.

🌺 Badrinath — The Gateway to Moksha
Seek blessings at the holy shrine of Badri Vishal as the Alaknanda flows beside you like a guide from another lifetime.

🌊 Panch Prayag — The Confluence of Destiny
Witness the meeting of five sacred rivers:
Devprayag, Rudraprayag, Karnaprayag, Nandprayag, Vishnuprayag.
Each confluence is a spiritual milestone, a reminder that all paths eventually unite.

🌱 Rishikesh — Yoga Capital of the World
Experience the calm of Ganga Aarti, the purity of the ghats, and the vibrance of a town where seekers from every corner come to find peace.

⚡ River Rafting — Feel the Power of Ganga
Ride the waves of adventure as the Ganga flows wild and free — a thrilling reminder that life is meant to be lived boldly.

💫 Why We Call This Journey “The Soul of Himalayas”
Because this route isn’t just scenic — it is sacred.
It carries the essence of Shiva, the peace of the sages, the raw beauty of untouched mountains, and the energy that transforms a person from within.

When you return, you don’t just bring back photos — you bring back a new version of yourself.`,
        highlights: [
            "Kedarnath - Divine Jyotirlinga",
            "Tungnath - Highest Shiva Temple",
            "Badrinath - Gateway to Moksha",
            "Panch Prayag - 5 Sacred Confluences",
            "Rishikesh - Yoga Capital",
            "River Rafting in Ganga"
        ],
        itinerary: [
            {
                day: 1,
                title: "Arrival",
                description: "Arrival description.",
                activities: ["Arrival"]
            }
        ],
        inclusions: [
            "Accommodation",
            "Meals",
            "Transport"
        ],
        exclusions: [
            "Personal Expenses"
        ],
        images: [
            soulOfHimalayasImg
        ]
    }
];

export const getPackageById = (id) => {
    return packages.find(pkg => pkg.id === id);
};
