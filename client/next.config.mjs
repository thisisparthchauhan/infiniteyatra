/** @type {import('next').NextConfig} */
const nextConfig = {
    // output:'export' removed — enables SSR/SSG for Google indexing
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'firebasestorage.googleapis.com',
            },
            {
                protocol: 'https',
                hostname: 'storage.googleapis.com',
            },
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com', // Google profile photos
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
        ],
    },
    async redirects() {
        return [
            // Legacy React Router URL compat
            {
                source: '/package/:id',
                destination: '/tours/:id',
                permanent: true,
            },
            {
                source: '/story/:id',
                destination: '/stories/:id',
                permanent: true,
            },
        ];
    },
};

export default nextConfig;
