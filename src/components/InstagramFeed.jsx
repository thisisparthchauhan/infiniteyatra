import React from 'react';
import { Instagram, Heart, MessageCircle, ExternalLink } from 'lucide-react';

const InstagramFeed = () => {
    // Placeholder images from Unsplash (travel themed)
    const posts = [
        {
            id: 1,
            image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2070&auto=format&fit=crop",
            likes: "1.2k",
            comments: "45"
        },
        {
            id: 2,
            image: "https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=2076&auto=format&fit=crop",
            likes: "856",
            comments: "23"
        },
        {
            id: 3,
            image: "https://images.unsplash.com/photo-1605640840605-14ac1855827b?q=80&w=2062&auto=format&fit=crop",
            likes: "2.1k",
            comments: "112"
        },
        {
            id: 4,
            image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop",
            likes: "943",
            comments: "38"
        }
    ];

    return (
        <section className="py-20 bg-white overflow-hidden">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">

                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                        Follow Our Adventures
                    </h2>
                    <p className="text-slate-600 max-w-2xl mx-auto">
                        Join our community of travelers and get inspired by the breathtaking beauty of the Himalayas.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {posts.map((post) => (
                        <a
                            key={post.id}
                            href="https://www.instagram.com/infinite.yatra/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative aspect-square overflow-hidden rounded-xl cursor-pointer"
                        >
                            <img
                                src={post.image}
                                alt="Instagram post"
                                loading="lazy"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-6 text-white">
                                <div className="flex items-center gap-2">
                                    <Heart className="fill-white" size={20} />
                                    <span className="font-bold">{post.likes}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MessageCircle className="fill-white" size={20} />
                                    <span className="font-bold">{post.comments}</span>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>

                <div className="text-center mt-12">
                    <a
                        href="https://www.instagram.com/infinite.yatra/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg hover:shadow-pink-500/30 transition-all duration-300 transform hover:-translate-y-1"
                    >
                        <Instagram size={20} />
                        Follow on Instagram
                    </a>
                </div>
            </div>
        </section>
    );
};

export default InstagramFeed;
