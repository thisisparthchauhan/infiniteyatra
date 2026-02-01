import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { blogs } from '../data/blogs';
import BlogCard from '../components/BlogCard';
import SEO from '../components/SEO';

const BlogPage = () => {
    const [selectedCategory, setSelectedCategory] = useState('All');

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Extract unique categories and sort "About Us" to the end
    const categories = ['All', ...[...new Set(blogs.map(blog => blog.category))].sort((a, b) => {
        if (a === 'About Us') return 1;
        if (b === 'About Us') return -1;
        return 0;
    })];

    // Filter blogs
    const filteredBlogs = selectedCategory === 'All'
        ? blogs
        : blogs.filter(blog => blog.category === selectedCategory);

    return (
        <div className="pt-24 pb-20 bg-slate-50 min-h-screen">
            <SEO
                title="Blog"
                description="Read our latest travel guides, tips, and stories. Get inspired for your next adventure with Infinite Yatra."
                url="/blog"
            />
            <div className="container mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                        Travel Guides & Stories
                    </h1>
                    <p className="text-lg text-slate-600">
                        Expert tips, detailed itineraries, and inspiring stories from the Himalayas.
                        Everything you need to plan your next adventure.
                    </p>
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap justify-center gap-3 mb-12">
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${selectedCategory === category
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                <motion.div
                    layout
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    <AnimatePresence mode='popLayout'>
                        {filteredBlogs.map(blog => (
                            <motion.div
                                layout
                                key={blog.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3 }}
                            >
                                <BlogCard blog={blog} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>

                {filteredBlogs.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-slate-500 text-lg">No stories found in this category yet.</p>
                        <button
                            onClick={() => setSelectedCategory('All')}
                            className="mt-4 text-blue-600 font-medium hover:underline"
                        >
                            View all stories
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlogPage;
