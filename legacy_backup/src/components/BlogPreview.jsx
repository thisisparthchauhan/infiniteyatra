import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { blogs } from '../data/blogs';
import BlogCard from './BlogCard';

const BlogPreview = () => {
    // Get the first 3 blogs
    const recentBlogs = blogs.slice(0, 3);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: "easeOut"
            }
        }
    };

    return (
        <section id="blog-preview" className="py-24 bg-slate-50">
            <div className="container mx-auto px-6">
                <div className="flex items-end justify-between mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-4xl font-bold text-slate-900 mb-4">Latest Stories</h2>
                        <p className="text-slate-500 text-lg max-w-xl">
                            Travel tips, itineraries, and inspiration for your next journey.
                        </p>
                    </motion.div>
                    <Link to="/blog" className="hidden md:flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700 transition-colors">
                        View all guides <ArrowRight size={20} />
                    </Link>
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    {recentBlogs.map(blog => (
                        <motion.div key={blog.id} variants={itemVariants}>
                            <BlogCard blog={blog} />
                        </motion.div>
                    ))}
                </motion.div>

                <div className="mt-12 md:hidden text-center">
                    <Link to="/blog" className="inline-flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700 transition-colors">
                        View all guides <ArrowRight size={20} />
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default BlogPreview;
