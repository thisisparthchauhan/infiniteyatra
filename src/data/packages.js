import kedarnathImg from '../assets/kedarnath.png';
import tungnathImg from '../assets/tungnath.png';
import kashmirImg from '../assets/kashmir_v2.jpg';

export const packages = [
    {
        id: 101,
        title: "Spiti Valley Winter Expedition",
        price: 18500,
        priceDisplay: "₹18,500",
        duration: "7 Days",
        location: "Himachal Pradesh",
        category: "Adventure",
        image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2070&auto=format&fit=crop",
        rating: 4.9,
        description: "Experience the raw beauty of Spiti in winter. Drive through snow-clad mountains, visit ancient monasteries, and witness the frozen Spiti river.",
        highlights: ["Key Monastery", "Kibber Wildlife Sanctuary", "Pin Valley", "Langza Buddha Statue"],
        itinerary: [
            { day: 1, title: "Arrival in Shimla", desc: "Reach Shimla and transfer to hotel. Evening at leisure." },
            { day: 2, title: "Shimla to Kalpa", desc: "Drive through Kinnaur valley with views of Kinner Kailash." },
            { day: 3, title: "Kalpa to Kaza", desc: "Enter Spiti Valley via Nako and Tabo." },
            { day: 4, title: "Kaza Sightseeing", desc: "Visit Key Monastery, Kibber, and Langza." },
            { day: 5, title: "Kaza to Rakchham", desc: "Drive back towards Kinnaur, stay in the beautiful Sangla valley." },
            { day: 6, title: "Rakchham to Shimla", desc: "Return journey to Shimla." },
            { day: 7, title: "Departure", desc: "Depart from Shimla with memories." }
        ]
    },
    {
        id: 102,
        title: "Meghalaya",
        price: 22000,
        priceDisplay: "₹22,000",
        duration: "6 Days",
        location: "Meghalaya",
        category: "Nature",
        image: "https://images.unsplash.com/photo-1594818898109-44704fb548f6?q=80&w=2070&auto=format&fit=crop",
        rating: 4.8,
        description: "Explore the wettest place on earth, walk on living root bridges, and witness the crystal clear waters of Dawki.",
        highlights: ["Double Decker Root Bridge", "Dawki River", "Mawlynnong Village", "Nohkalikai Falls"],
        itinerary: [
            { day: 1, title: "Guwahati to Shillong", desc: "Arrival and transfer to the Scotland of the East." },
            { day: 2, title: "Shillong to Cherrapunjee", desc: "Visit waterfalls and caves." },
            { day: 3, title: "Double Decker Trek", desc: "Trek to the famous living root bridges." },
            { day: 4, title: "Dawki & Mawlynnong", desc: "Visit the cleanest village and crystal clear river." },
            { day: 5, title: "Shillong Sightseeing", desc: "Explore local markets and cafes." },
            { day: 6, title: "Departure", desc: "Transfer to Guwahati airport." }
        ],
        gallery: [
            { id: 1, url: 'https://images.unsplash.com/photo-1622308644420-a94bb8a24c96?q=80&w=2070&auto=format&fit=crop', alt: 'Double Decker Living Root Bridge in Meghalaya' },
            { id: 2, url: 'https://images.unsplash.com/photo-1594818898109-44704fb548f6?q=80&w=2070&auto=format&fit=crop', alt: 'Crystal clear waters of Umngot River in Dawki' },
            { id: 3, url: 'https://images.unsplash.com/photo-1589041127168-9b1915731463?q=80&w=1974&auto=format&fit=crop', alt: 'Nohkalikai Falls plunging down the cliff' },
            { id: 4, url: 'https://images.unsplash.com/photo-1629217346827-0c0179371076?q=80&w=2070&auto=format&fit=crop', alt: 'Mawlynnong Village - The cleanest village in Asia' },
            { id: 5, url: 'https://images.unsplash.com/photo-1624890209428-ee609a3492e8?q=80&w=2070&auto=format&fit=crop', alt: 'Scenic view of Laitlum Canyons' },
            { id: 6, url: 'https://images.unsplash.com/photo-1517427677506-ade074eb1432?q=80&w=2069&auto=format&fit=crop', alt: 'Limestone caves of Mawsmai' }
        ]
    },
    {
        id: 103,
        title: "Kerala Backwaters & Munnar",
        price: 24500,
        priceDisplay: "₹24,500",
        duration: "6 Days",
        location: "Kerala",
        category: "Relaxation",
        image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=2070&auto=format&fit=crop",
        rating: 4.9,
        description: "Relax in the serene backwaters of Alleppey and explore the tea gardens of Munnar in God's Own Country.",
        highlights: ["Alleppey Houseboat", "Munnar Tea Gardens", "Kochi Fort", "Athirapally Falls"],
        itinerary: [
            { day: 1, title: "Arrival in Kochi", desc: "Transfer to Munnar. Enroute visit Cheeyappara Waterfalls." },
            { day: 2, title: "Munnar Sightseeing", desc: "Visit Mattupetty Dam, Echo Point, and Tea Museum." },
            { day: 3, title: "Munnar to Thekkady", desc: "Drive to Periyar Wildlife Sanctuary." },
            { day: 4, title: "Thekkady to Alleppey", desc: "Check into a houseboat and cruise the backwaters." },
            { day: 5, title: "Alleppey to Kochi", desc: "Visit Fort Kochi and Chinese Fishing Nets." },
            { day: 6, title: "Departure", desc: "Transfer to Kochi airport." }
        ]
    },
    {
        id: 'kedarkantha',
        title: "Kedarkantha Trek",
        location: "Uttarakhand, India",
        image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2070&auto=format&fit=crop",
        price: 6000,
        priceDisplay: "₹6,000",
        rating: 5.0,
        duration: "6 Days / 5 Nights",
        difficulty: "Moderate",
        bestTime: "December to April",
        maxAltitude: "12,500 ft",
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
        reviews: [
            {
                id: 1,
                name: 'Priya Sharma',
                rating: 5,
                date: '2024-02-15',
                comment: 'Absolutely incredible experience! The trek was well-organized, and our guide was knowledgeable and supportive. The summit views were breathtaking. Highly recommend for anyone looking for a winter trek adventure!',
                verified: true
            },
            {
                id: 2,
                name: 'Rahul Verma',
                rating: 5,
                date: '2024-01-28',
                comment: 'Best trek of my life! The snow-covered trails, camping under stars, and the final summit push were unforgettable. The team ensured our safety and comfort throughout. Worth every penny!',
                verified: true
            },
            {
                id: 3,
                name: 'Anjali Patel',
                rating: 4,
                date: '2024-03-10',
                comment: 'Great trek with stunning views. The itinerary was perfect, and the food was surprisingly good for a trek. Only minor issue was the weather, but that\'s nature! Would definitely trek with them again.',
                verified: true
            },
            {
                id: 4,
                name: 'Vikram Singh',
                rating: 5,
                date: '2023-12-20',
                comment: 'Perfect winter wonderland experience! The guides were professional, equipment was top-notch, and the entire journey was magical. The sunrise from the summit is something I\'ll never forget.',
                verified: true
            },
            {
                id: 5,
                name: 'Neha Gupta',
                rating: 5,
                date: '2024-02-05',
                comment: 'As a first-time trekker, I was nervous, but the team made me feel comfortable and confident. The pace was perfect, and they took great care of everyone. Kedarkantha is now my favorite place on Earth!',
                verified: true
            }
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
        id: 'kedarnath',
        title: "Kedarnath Yatra",
        location: "Uttarakhand, India",
        image: kedarnathImg,
        price: 17500,
        priceDisplay: "₹17,500",
        rating: 5.0,
        duration: "5 Days / 4 Nights",
        difficulty: "Moderate",
        bestTime: "May to October",
        maxAltitude: "11,755 ft",
        description: "Embark on a spiritual journey to Kedarnath, one of the twelve Jyotirlingas of Lord Shiva. This sacred pilgrimage takes you through the majestic Himalayas to the ancient Kedarnath Temple, offering both spiritual fulfillment and breathtaking natural beauty.",
        highlights: [
            "Visit the sacred Kedarnath Temple",
            "Helicopter ride option available",
            "Scenic trek through Himalayas",
            "Visit to Gaurikund hot springs",
            "Spiritual and cultural experience"
        ],
        itinerary: [
            {
                day: 1,
                title: "Haridwar to Guptkashi",
                description: "Drive from Haridwar to Guptkashi (215 km, 8-9 hours). Visit Devprayag and enjoy scenic mountain views. Overnight stay in Guptkashi.",
                activities: ["Scenic drive", "Devprayag visit", "Hotel check-in"]
            },
            {
                day: 2,
                title: "Guptkashi to Kedarnath",
                description: "Drive to Gaurikund, then trek or take helicopter to Kedarnath (18 km trek or 10 min flight). Visit Kedarnath Temple. Overnight stay in Kedarnath.",
                activities: ["Temple darshan", "Evening aarti", "Overnight stay"]
            },
            {
                day: 3,
                title: "Kedarnath to Guptkashi",
                description: "Early morning darshan at Kedarnath Temple. Trek back to Gaurikund and drive to Guptkashi. Overnight stay in Guptkashi.",
                activities: ["Morning darshan", "Return trek", "Rest in Guptkashi"]
            },
            {
                day: 4,
                title: "Guptkashi to Rishikesh",
                description: "Drive from Guptkashi to Rishikesh (165 km, 7-8 hours). Visit local temples and explore Rishikesh. Overnight stay in Rishikesh.",
                activities: ["Temple visits", "Ganga aarti", "Market exploration"]
            },
            {
                day: 5,
                title: "Rishikesh to Haridwar",
                description: "Morning visit to Laxman Jhula and Ram Jhula. Drive to Haridwar (25 km, 1 hour). Trip concludes.",
                activities: ["Sightseeing", "Return journey", "Trip conclusion"]
            }
        ],
        inclusions: [
            "Accommodation in hotels and guesthouses",
            "Daily breakfast and dinner",
            "Transportation in comfortable vehicles",
            "Experienced guide and support staff",
            "All permits and entry fees",
            "First aid and medical support"
        ],
        exclusions: [
            "Helicopter charges (optional)",
            "Lunch and snacks",
            "Personal expenses",
            "Travel insurance",
            "Pony/Doli charges for trek",
            "Any additional activities"
        ],
        images: [
            kedarnathImg,
            "https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=2076&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1609137144813-7d9921338f24?q=80&w=2070&auto=format&fit=crop"
        ]
    },
    {
        id: 'kashmir',
        title: "Kashmir Paradise",
        location: "Jammu & Kashmir, India",
        image: kashmirImg,
        price: 20000,
        priceDisplay: "₹20,000",
        rating: 5.0,
        duration: "7 Days / 6 Nights",
        difficulty: "Easy",
        bestTime: "March to October",
        maxAltitude: "8,960 ft",
        description: "Experience the breathtaking beauty of Kashmir, often called 'Paradise on Earth'. This comprehensive tour takes you through the stunning valleys of Srinagar, Gulmarg, Pahalgam, and Sonmarg, offering a perfect blend of natural beauty, adventure, and cultural experiences.",
        highlights: [
            "Shikara ride on Dal Lake",
            "Gondola ride in Gulmarg",
            "Visit to Betaab Valley",
            "Explore Mughal Gardens",
            "Experience houseboat stay"
        ],
        itinerary: [
            {
                day: 1,
                title: "Arrival in Srinagar",
                description: "Arrive at Srinagar airport. Transfer to houseboat on Dal Lake. Evening Shikara ride and explore floating gardens. Overnight in houseboat.",
                activities: ["Airport pickup", "Shikara ride", "Houseboat stay"]
            },
            {
                day: 2,
                title: "Srinagar Local Sightseeing",
                description: "Visit Mughal Gardens (Nishat, Shalimar, Chashme Shahi), Shankaracharya Temple. Explore local markets. Overnight in hotel.",
                activities: ["Garden visits", "Temple visit", "Shopping"]
            },
            {
                day: 3,
                title: "Srinagar to Gulmarg",
                description: "Drive to Gulmarg (50 km, 2 hours). Enjoy Gondola cable car ride to Apharwat Peak. Optional skiing and snow activities. Return to Srinagar.",
                activities: ["Gondola ride", "Snow activities", "Photography"]
            },
            {
                day: 4,
                title: "Srinagar to Pahalgam",
                description: "Drive to Pahalgam (95 km, 3 hours) via Saffron fields and Awantipora ruins. Visit Betaab Valley and Aru Valley. Overnight in Pahalgam.",
                activities: ["Valley exploration", "Nature walks", "River activities"]
            },
            {
                day: 5,
                title: "Pahalgam Exploration",
                description: "Full day to explore Pahalgam. Visit Chandanwari, Baisaran meadows. Optional pony rides and nature walks. Overnight in Pahalgam.",
                activities: ["Meadow visits", "Pony rides", "Leisure time"]
            },
            {
                day: 6,
                title: "Pahalgam to Srinagar via Sonmarg",
                description: "Drive to Sonmarg (150 km, 5 hours). Visit Thajiwas Glacier. Return to Srinagar. Overnight in Srinagar.",
                activities: ["Glacier visit", "Scenic drive", "Photography"]
            },
            {
                day: 7,
                title: "Departure from Srinagar",
                description: "Morning at leisure for last-minute shopping. Transfer to airport for departure with beautiful memories of Kashmir.",
                activities: ["Shopping", "Airport drop", "Trip conclusion"]
            }
        ],
        inclusions: [
            "Accommodation in houseboats and hotels",
            "Daily breakfast and dinner",
            "All transfers and sightseeing by private vehicle",
            "Shikara ride on Dal Lake",
            "Professional tour guide",
            "All permits and taxes"
        ],
        exclusions: [
            "Gondola cable car tickets",
            "Lunch and snacks",
            "Personal expenses and tips",
            "Travel insurance",
            "Pony rides and adventure activities",
            "Any meals not mentioned in inclusions"
        ],
        images: [
            kashmirImg,
            "https://images.unsplash.com/photo-1605640840605-14ac1855827b?q=80&w=2062&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?q=80&w=2054&auto=format&fit=crop"
        ]
    },
    {
        id: 'tungnath',
        title: "Tungnath Trek",
        location: "Uttarakhand, India",
        image: tungnathImg,
        price: 6000,
        priceDisplay: "₹6,000",
        rating: 5.0,
        duration: "4 Days / 3 Nights",
        difficulty: "Easy to Moderate",
        bestTime: "April to November",
        maxAltitude: "13,000 ft",
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
    }
];

export const getPackageById = (id) => {
    return packages.find(pkg => pkg.id === id);
};
