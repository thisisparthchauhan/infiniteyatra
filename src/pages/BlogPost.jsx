import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBlogById } from '../data/blogs';
import { Calendar, User, ArrowLeft, Clock } from 'lucide-react';

const BlogPost = () => {
    const { id } = useParams();
    const blog = getBlogById(id);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    if (!blog) {
        return (
            <div className="pt-32 pb-20 text-center min-h-screen">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Article Not Found</h2>
                <Link to="/blog" className="text-blue-600 hover:underline">Back to Travel Guides</Link>
            </div>
        );
    }

    return (
        <article className="pt-24 pb-20 bg-white min-h-screen">
            {/* Hero Image */}
            <div className="w-full h-[400px] md:h-[500px] relative mb-12">
                <img
                    src={blog.image}
                    alt={blog.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                <div className="absolute bottom-0 left-0 w-full p-6 md:p-12">
                    <div className="container mx-auto max-w-4xl">
                        <span className="inline-block bg-blue-600 text-white px-5 py-2 rounded-full text-base font-bold mb-5">
                            {blog.category}
                        </span>
                        <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
                            {blog.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-8 text-white/90 text-lg md:text-xl">
                            <span className="flex items-center gap-2.5">
                                <User size={22} />
                                <span className="font-semibold">{blog.author}</span>
                            </span>
                            <span className="flex items-center gap-2.5">
                                <Calendar size={22} />
                                <span className="font-semibold">{blog.date}</span>
                            </span>
                            <span className="flex items-center gap-2.5">
                                <Clock size={22} />
                                <span className="font-semibold">5 min read</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-6 max-w-4xl">
                <Link to="/blog" className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 mb-12 transition-colors text-lg font-semibold">
                    <ArrowLeft size={22} />
                    Back to Guides
                </Link>

                <div
                    className="prose prose-2xl prose-slate max-w-none 
                        prose-headings:font-bold prose-headings:text-slate-900 prose-headings:mb-6 prose-headings:mt-10
                        prose-h2:text-4xl prose-h3:text-3xl prose-h4:text-2xl
                        prose-p:text-slate-700 prose-p:leading-relaxed prose-p:text-xl prose-p:mb-8
                        prose-a:text-blue-600 prose-a:font-semibold prose-a:no-underline hover:prose-a:underline
                        prose-img:rounded-2xl prose-img:shadow-lg prose-img:my-10
                        prose-strong:text-slate-900 prose-strong:font-bold
                        prose-li:text-slate-700 prose-li:text-xl prose-li:leading-relaxed prose-li:mb-3
                        prose-ul:my-8 prose-ol:my-8
                        prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-8 prose-blockquote:italic prose-blockquote:text-slate-600 prose-blockquote:text-xl"
                    dangerouslySetInnerHTML={{ __html: blog.content }}
                />

                {/* Author Bio */}
                <div className="mt-20 p-10 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-8">
                    <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-4xl flex-shrink-0">
                        {blog.author.charAt(0)}
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-2xl mb-3">Written by {blog.author}</h4>
                        <p className="text-slate-600 text-lg leading-relaxed">Passionate traveler and storyteller sharing experiences from the Himalayas.</p>
                    </div>
                </div>
            </div>
        </article>
    );
};

export default BlogPost;
