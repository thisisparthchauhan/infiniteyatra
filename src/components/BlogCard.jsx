import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, ArrowRight } from 'lucide-react';

const BlogCard = ({ blog }) => {
    return (
        <Link to={`/blog/${blog.id}`} className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:-translate-y-2">
            <div className="relative aspect-video overflow-hidden">
                <img
                    src={blog.image}
                    alt={blog.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-blue-600 uppercase tracking-wider shadow-sm">
                    {blog.category}
                </div>
            </div>

            <div className="p-8 flex flex-col flex-grow">
                <div className="flex items-center gap-4 text-slate-600 text-base mb-5">
                    <span className="flex items-center gap-2 font-semibold">
                        <Calendar size={18} />
                        {blog.date}
                    </span>
                    <span className="flex items-center gap-2 font-semibold">
                        <User size={18} />
                        {blog.author}
                    </span>
                </div>

                <h3 className="text-3xl font-bold text-slate-900 mb-5 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                    {blog.title}
                </h3>

                <p className="text-slate-700 text-lg leading-relaxed mb-6 line-clamp-3 flex-grow font-normal">
                    {blog.excerpt}
                </p>

                <div className="flex items-center text-blue-600 font-bold text-lg mt-auto group/btn">
                    Read Article
                    <ArrowRight size={20} className="ml-2 transition-transform group-hover/btn:translate-x-1" />
                </div>
            </div>
        </Link>
    );
};

export default BlogCard;
