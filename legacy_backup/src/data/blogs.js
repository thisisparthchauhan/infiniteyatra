export const blogs = [
    {
        id: '5-days-in-kashmir-itinerary',
        title: "5 Days in Kashmir: The Perfect Itinerary",
        excerpt: "Experience paradise on earth with this day-by-day guide to Srinagar, Gulmarg, and Pahalgam. The ultimate plan for first-timers.",
        content: `
            <div class="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8 rounded-r-lg">
                <h4 class="text-blue-900 font-bold text-xl mb-3">Trip Highlights</h4>
                <ul class="list-disc list-inside text-blue-800 space-y-2">
                    <li>Sunset Shikara ride on Dal Lake</li>
                    <li>Gondola ride to Apharwat Peak in Gulmarg</li>
                    <li>Riverside picnic in Pahalgam</li>
                    <li>Stay in a traditional Houseboat</li>
                </ul>
            </div>

            <p class="lead text-xl text-slate-600 mb-8">Kashmir, often called "Paradise on Earth," offers breathtaking landscapes, serene lakes, and snow-capped mountains. Here is a perfectly crafted 5-day itinerary to experience the best of this valley.</p>

            <h3 id="day-1">Day 1: Arrival in Srinagar & Shikara Ride</h3>
            <p>Arrive at Sheikh Ul-Alam International Airport. Upon landing, the crisp mountain air welcomes you. <strong>Tip:</strong> Pre-book your cab to avoid airport hassles.</p>
            <p>Check into your houseboat on <strong>Dal Lake</strong>. These wooden marvels are unique to Kashmir. Spend the evening enjoying a peaceful <em>Shikara ride</em> during sunset. Witness the floating market where locals sell flowers and vegetables from their boats—a photographer's dream.</p>

            <h3 id="day-2">Day 2: Srinagar Sightseeing (The Mughal Era)</h3>
            <p>Start your day with a visit to the famous Mughal Gardens.</p>
            <ul class="my-6 space-y-2">
                <li><strong>Nishat Bagh:</strong> The Garden of Bliss, commanding a magnificent view of the lake.</li>
                <li><strong>Shalimar Bagh:</strong> Built by Emperor Jahangir for his wife Nur Jahan.</li>
            </ul>
            <p>Explore the <strong>Shankaracharya Temple</strong> for a panoramic view of the entire city. In the evening, stroll through the local markets (Lal Chowk) to shop for authentic Pashmina shawls and saffron.</p>

            <h3 id="day-3">Day 3: Day Trip to Gulmarg</h3>
            <p>Drive to Gulmarg (approx. 2 hours). The route itself is scenic, lined with poplars and rice fields.</p>
            <p>Take the famous <strong>Gulmarg Gondola</strong> ride. 
            <br/>Phase 1 takes you to Kongdori (8,530 ft).
            <br/>Phase 2 takes you to Apharwat Peak (12,293 ft) for stunning snow views.</p>
            <p><em>Note: Book Gondola tickets online in advance as they sell out fast!</em></p>

            <h3 id="day-4">Day 4: Pahalgam – The Valley of Shepherds</h3>
            <p>Head to Pahalgam, a 3-hour drive. On the way, stop at the saffron fields of Pampore.</p>
            <p>Visit <strong>Betaab Valley</strong>, named after the Bollywood movie. Explore Aru Valley for its meadows. Enjoy a pony ride to Baisaran (Mini Switzerland). The Lidder River offers a perfect spot for a riverside picnic—dip your feet in the icy water and relax.</p>

            <h3 id="day-5">Day 5: Departure</h3>
            <p>Enjoy a traditional Kashmiri breakfast (Kahwa and Girda) before heading to the airport. You leave with a bag full of memories and a promise to return.</p>
        `,
        author: "Infinite Yatra Team",
        authorRole: "Editorial Team",
        date: "Nov 28, 2024",
        lastUpdated: "Jan 05, 2025",
        readTime: "6 min read",
        image: "https://images.unsplash.com/photo-1566837945700-30057527ade0?q=80&w=2070&auto=format&fit=crop",
        category: "Itineraries",
        relatedPackageId: "kashmir-paradise-5d", // Linking to a package
        tableOfContents: [
            { id: "day-1", title: "Day 1: Arrival & Shikara Ride" },
            { id: "day-2", title: "Day 2: Srinagar Sightseeing" },
            { id: "day-3", title: "Day 3: Gulmarg Day Trip" },
            { id: "day-4", title: "Day 4: Pahalgam Valley" },
            { id: "day-5", title: "Day 5: Departure" }
        ]
    },
    {
        id: 'hidden-gems-uttarakhand',
        title: "Hidden Gems of Uttarakhand You Must Visit",
        excerpt: "Move over Nainital and Mussoorie. Discover the untouched beauty of Munsiyari, Chopta, and Kanatal for a peaceful getaway.",
        content: `
            <div class="bg-green-50 border-l-4 border-green-500 p-6 mb-8 rounded-r-lg">
                <h4 class="text-green-900 font-bold text-xl mb-3">Quick List</h4>
                <ul class="list-disc list-inside text-green-800 space-y-2">
                    <li>Munsiyari - For Panchachuli views</li>
                    <li>Chopta - For Tungnath Trek</li>
                    <li>Kanatal - For Adventure</li>
                    <li>Khirsu - For Absolute Silence</li>
                </ul>
            </div>

            <p class="text-xl text-slate-600 mb-8">Uttarakhand is more than just its popular hill stations. If you crave silence and untouched nature, head to these hidden gems.</p>

            <h3 id="munsiyari">1. Munsiyari</h3>
            <p>Located in the Pithoragarh district, Munsiyari offers the closest view of the Panchachuli peaks. It's a trekker's base camp and a bird watcher's paradise. The sunrise here turns the snow peaks into gold.</p>

            <h3 id="chopta">2. Chopta</h3>
            <p>Known as the "Mini Switzerland of India," Chopta is the base for the Tungnath trek (the highest Shiva temple). The meadows here are breathtaking, and it remains relatively uncrowded compared to commercial hubs.</p>

            <h3 id="kanatal">3. Kanatal</h3>
            <p>Just a few hours from Mussoorie, Kanatal is perfect for camping and adventure sports like rappelling and valley crossing. The Surkanda Devi temple nearby offers 360-degree views of the Garhwal Himalayas.</p>

            <h3 id="khirsu">4. Khirsu</h3>
            <p>A quiet village in Pauri Garhwal, Khirsu offers spectacular views of the Himalayas including Nanda Devi and Trishul. It's surrounded by thick oak and deodar forests, making it ideal for nature walks.</p>
        `,
        author: "Parth Chauhan",
        authorRole: "Founder",
        date: "Nov 27, 2024",
        lastUpdated: "Dec 15, 2024",
        readTime: "5 min read",
        image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2070&auto=format&fit=crop", // Consistent HImalayan view
        category: "Offbeat Travel",
        relatedPackageId: "chardham-yatra-2025",
        tableOfContents: [
            { id: "munsiyari", title: "1. Munsiyari" },
            { id: "chopta", title: "2. Chopta" },
            { id: "kanatal", title: "3. Kanatal" },
            { id: "khirsu", title: "4. Khirsu" }
        ]
    },
    {
        id: 'high-altitude-sickness-guide',
        title: "High Altitude Sickness: Prevention and Cure",
        excerpt: "Planning a high-altitude trek? Learn how to prevent AMS (Acute Mountain Sickness) and stay safe on your adventure.",
        content: `
            <div class="bg-red-50 border-l-4 border-red-500 p-6 mb-8 rounded-r-lg">
                <h4 class="text-red-900 font-bold text-xl mb-3">Key Takeaways</h4>
                <ul class="list-disc list-inside text-red-800 space-y-2">
                    <li>Acclimatization is crucial</li>
                    <li>Hydration helps prevent AMS</li>
                    <li>Recognize symptoms early</li>
                    <li>Descend if symptoms worsen</li>
                </ul>
            </div>

            <p class="text-xl text-slate-600 mb-8">Acute Mountain Sickness (AMS) can affect anyone, regardless of fitness level, when traveling above 8,000 feet. Understanding it is key to a safe trek.</p>

            <h3 id="what-is-ams">What is AMS?</h3>
            <p>It occurs when your body doesn't get enough oxygen. Symptoms include headache, nausea, dizziness, and fatigue.</p>

            <h3 id="prevention">Prevention Tips</h3>
            <ul class="list-disc list-inside space-y-2 mb-6">
                <li><strong>Acclimatize:</strong> "Climb high, sleep low." Give your body time to adjust.</li>
                <li><strong>Hydrate:</strong> Drink 3-4 liters of water daily. Avoid alcohol and smoking.</li>
                <li><strong>Eat Right:</strong> Consume high-carbohydrate meals.</li>
                <li><strong>Medication:</strong> Diamox (Acetazolamide) can help speed up acclimatization (consult a doctor first).</li>
            </ul>

            <h3 id="action-plan">What to do if you get AMS?</h3>
            <p><strong>Descend immediately.</strong> Do not push further. Rest, hydrate, and if symptoms persist, seek medical help. Your life is more important than the summit.</p>
        `,
        author: "Infinite Yatra Team",
        authorRole: "Safety Experts",
        date: "Nov 26, 2024",
        readTime: "4 min read",
        image: "https://images.unsplash.com/photo-1516939884455-1445c8652f83?q=80&w=2000&auto=format&fit=crop",
        category: "Safety",
        tableOfContents: [
            { id: "what-is-ams", title: "What is AMS?" },
            { id: "prevention", title: "Prevention Tips" },
            { id: "action-plan", title: "Action Plan" }
        ]
    },
    {
        id: 'why-choose-infinite-yatra',
        title: "Why Infinite Yatra is Your Best Travel Partner",
        excerpt: "We don't just plan trips; we craft experiences. Learn about our philosophy, our commitment to safety, and why travelers love us.",
        content: `
            <p class="text-xl text-slate-600 mb-8">At Infinite Yatra, we believe that travel is not just about visiting a place; it's about the transformation that happens within you. Here's why thousands of travelers trust us with their Himalayan adventures.</p>
            <h3 id="safety">1. Safety First</h3>
            <p>Your safety is our non-negotiable priority. Our trek leaders are certified in mountaineering and first aid. We carry oxygen cylinders and extensive medical kits on every high-altitude trek.</p>
            <h3 id="expertise">2. Local Expertise</h3>
            <p>We are locals. We know every trail, every hidden viewpoint, and every story of these mountains. When you travel with us, you get an authentic experience that goes beyond the guidebooks.</p>
            <h3 id="sustainability">3. Sustainable Tourism</h3>
            <p>We are committed to preserving the fragile Himalayan ecosystem. We follow strict "Leave No Trace" policies and organize regular cleanup drives.</p>
            <h3 id="care">4. Personalized Care</h3>
            <p>We keep our batch sizes small to ensure every traveler gets personal attention. Whether you are a solo traveler, a couple, or a large group, we tailor the experience to your needs.</p>
        `,
        author: "Parth Chauhan",
        authorRole: "Founder",
        date: "Nov 15, 2024",
        readTime: "3 min read",
        image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop",
        category: "About Us",
        tableOfContents: [
            { id: "safety", title: "Safety First" },
            { id: "expertise", title: "Local Expertise" },
            { id: "sustainability", title: "Sustainable Tourism" },
            { id: "care", title: "Personalized Care" }
        ]
    },
    {
        id: 'ultimate-packing-guide-kedarkantha',
        title: "The Ultimate Packing Guide for Kedarkantha Trek",
        excerpt: "Don't let the cold catch you off guard! Here's a comprehensive list of everything you need to pack for a comfortable and safe winter trek.",
        content: `
            <div class="bg-amber-50 border-l-4 border-amber-500 p-6 mb-8 rounded-r-lg">
                <h4 class="text-amber-900 font-bold text-xl mb-3">Packing Checklist</h4>
                <ul class="list-disc list-inside text-amber-800 space-y-2">
                    <li>3 Layers (Base, Fleece, Jacket)</li>
                    <li>Waterproof Trekking Shoes</li>
                    <li>Sunglasses & Sunscreen</li>
                    <li>Personal First Aid</li>
                </ul>
            </div>
            
            <p class="text-xl text-slate-600 mb-8">Preparing for a winter trek like Kedarkantha requires careful planning, especially when it comes to packing. The temperatures can drop significantly, and having the right gear can make or break your experience.</p>
            
            <h3 id="clothing">1. Clothing Layers</h3>
            <p>Layering is key in the mountains. You need to be able to add or remove layers easily.</p>
            <ul class="list-disc list-inside space-y-2 mb-6">
                <li><strong>Base Layer:</strong> Thermal top and bottom (synthetic or merino wool). Avoid cotton!</li>
                <li><strong>Mid Layer:</strong> Fleece jacket or woolen sweater.</li>
                <li><strong>Outer Layer:</strong> Windproof and waterproof down jacket.</li>
                <li><strong>Bottoms:</strong> Trekking pants (water-resistant preferred).</li>
            </ul>

            <h3 id="footwear">2. Footwear</h3>
            <p>Your feet are your most important asset on a trek.</p>
            <ul class="list-disc list-inside space-y-2 mb-6">
                <li><strong>Trekking Shoes:</strong> High-ankle, waterproof shoes with good grip.</li>
                <li><strong>Socks:</strong> 3-4 pairs of woolen socks and 2 pairs of cotton socks.</li>
            </ul>

            <h3 id="accessories">3. Accessories</h3>
            <ul class="list-disc list-inside space-y-2 mb-6">
                <li>Woolen cap and sun cap</li>
                <li>Waterproof gloves and fleece gloves</li>
                <li>Sunglasses (essential for snow reflection)</li>
                <li>Headlamp with extra batteries</li>
            </ul>

            <h3 id="meds">4. Toiletries & Meds</h3>
            <p>Sunscreen, lip balm, personal hygiene kit, and a basic first aid kit including Diamox (consult your doctor).</p>
        `,
        author: "Parth Chauhan",
        authorRole: "Trek Leader",
        date: "Nov 25, 2024",
        readTime: "7 min read",
        image: "https://images.unsplash.com/photo-1516939884455-1445c8652f83?q=80&w=2000&auto=format&fit=crop",
        category: "Trekking Tips",
        relatedPackageId: "kedarkantha-trek",
        tableOfContents: [
            { id: "clothing", title: "Clothing Layers" },
            { id: "footwear", title: "Footwear" },
            { id: "accessories", title: "Accessories" },
            { id: "meds", title: "Toiletries & Meds" }
        ]
    },
    {
        id: 'best-time-to-visit-kedarnath',
        title: "Best Time to Visit Kedarnath: A Seasonal Guide",
        excerpt: "Planning your spiritual journey? Discover the ideal months to visit Kedarnath Temple for the best weather and darshan experience.",
        content: `
            <div class="bg-indigo-50 border-l-4 border-indigo-500 p-6 mb-8 rounded-r-lg">
                <h4 class="text-indigo-900 font-bold text-xl mb-3">Season Summary</h4>
                <ul class="list-disc list-inside text-indigo-800 space-y-2">
                    <li><strong>Best:</strong> May-June & Sept-Oct</li>
                    <li><strong>Risky:</strong> July-August (Monsoon)</li>
                    <li><strong>Closed:</strong> Nov-April (Winter)</li>
                </ul>
            </div>

            <p class="text-xl text-slate-600 mb-8">Kedarnath Temple, nestled in the Garhwal Himalayas, is open to devotees only for a few months each year. Choosing the right time to visit is crucial for a safe and spiritually fulfilling journey.</p>

            <h3 id="summer">Summer (May to June)</h3>
            <p><strong>Best for:</strong> Comfortable weather and clear views.</p>
            <p>This is the peak season. The temple opens in late April or early May. The weather is pleasant, with temperatures ranging from 15°C to 30°C. However, expect large crowds.</p>

            <h3 id="monsoon">Monsoon (July to August)</h3>
            <p><strong>Best for:</strong> Lush greenery (but risky).</p>
            <p>The region receives heavy rainfall, leading to landslides and road blockages. Helicopter services are often suspended. It's generally advised to avoid this season unless you are an experienced trekker prepared for delays.</p>

            <h3 id="autumn">Autumn (September to October)</h3>
            <p><strong>Best for:</strong> Serenity and photography.</p>
            <p>Post-monsoon, the skies clear up, offering crisp views of the peaks. The crowd thins out compared to summer. It gets colder, especially in late October, so pack warm woolens.</p>

            <h3 id="winter">Winter (November to April)</h3>
            <p>The temple closes on Bhai Dooj (usually in November) and the deity is moved to Ukhimath. The region remains covered in heavy snow and is inaccessible.</p>
        `,
        author: "Infinite Yatra Team",
        authorRole: "Pilgrimage Experts",
        date: "Nov 20, 2024",
        readTime: "4 min read",
        image: "https://images.unsplash.com/photo-1598324789736-4861f89564a0?q=80&w=2000&auto=format&fit=crop",
        category: "Spiritual",
        relatedPackageId: "chardham-yatra-2025",
        tableOfContents: [
            { id: "summer", title: "Summer (May-June)" },
            { id: "monsoon", title: "Monsoon (July-Aug)" },
            { id: "autumn", title: "Autumn (Sept-Oct)" },
            { id: "winter", title: "Winter (Nov-April)" }
        ]
    }
];

export const getBlogById = (id) => {
    return blogs.find(blog => blog.id === id);
};
