import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBlogById } from '../data/blogs';
import { getPackageById } from '../data/packages';
import { Calendar, User, ArrowLeft, Clock, MapPin, ArrowRight, List, ShieldCheck } from 'lucide-react';
import SEO from '../components/SEO';

const BlogPost = () => {
    const { id } = useParams();
    const blog = getBlogById(id);
    const relatedPackage = blog?.relatedPackageId ? getPackageById(blog.relatedPackageId) : null;

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

    const scrollToSection = (e, sectionId) => {
        e.preventDefault();
        const element = document.getElementById(sectionId);
        if (element) {
            const offset = 100; // Header height
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    return (
        <article className="pt-24 pb-20 bg-white min-h-screen">
            <SEO
                title={blog.title}
                description={blog.excerpt}
                image={blog.image}
                url={`/blog/${id}`}
            >
                <meta property="article:published_time" content={blog.date} />
                {blog.lastUpdated && <meta property="article:modified_time" content={blog.lastUpdated} />}
                <meta property="article:author" content={blog.author} />
            </SEO>

            {/* Hero Image */}
            <div className="w-full h-[400px] md:h-[500px] relative mb-12">
                <img
                    src={blog.image}
                    alt={blog.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 w-full p-6 md:p-12">
                    <div className="container mx-auto max-w-4xl">
                        <span className="inline-block bg-blue-600 text-white px-5 py-2 rounded-full text-base font-bold mb-5 shadow-lg shadow-blue-600/30">
                            {blog.category}
                        </span>
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
                            {blog.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-6 text-white/90 text-lg">
                            <span className="flex items-center gap-2.5">
                                <User size={20} className="text-blue-400" />
                                <span className="font-semibold">{blog.author}</span>
                                {blog.authorRole && (
                                    <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full border border-white/30 backdrop-blur-sm">
                                        {blog.authorRole}
                                    </span>
                                )}
                            </span>
                            <span className="flex items-center gap-2.5">
                                <Calendar size={20} className="text-blue-400" />
                                <span className="font-semibold">{blog.date}</span>
                            </span>
                            <span className="flex items-center gap-2.5">
                                <Clock size={20} className="text-blue-400" />
                                <span className="font-semibold">{blog.readTime || '5 min read'}</span>
                            </span>
                            {blog.lastUpdated && (
                                <span className="text-sm text-slate-300 italic">
                                    (Updated: {blog.lastUpdated})
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Container */}
            <div className="container mx-auto px-6 max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-12">

                {/* Navigation & TOC - Left Sidebar on Desktop */}
                <div className="lg:col-span-3 lg:block hidden sticky top-32 h-fit">
                    <Link to="/blog" className="flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-8 transition-colors font-semibold">
                        <ArrowLeft size={20} />
                        Back to Guides
                    </Link>

                    {blog.tableOfContents && (
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <List size={18} />
                                Table of Contents
                            </h4>
                            <nav className="space-y-3">
                                {blog.tableOfContents.map((item) => (
                                    <a
                                        key={item.id}
                                        href={`#${item.id}`}
                                        onClick={(e) => scrollToSection(e, item.id)}
                                        className="block text-slate-600 hover:text-blue-600 hover:pl-2 transition-all text-sm font-medium"
                                    >
                                        {item.title}
                                    </a>
                                ))}
                            </nav>
                        </div>
                    )}
                </div>

                {/* Main Content - Center */}
                <div className="lg:col-span-9">
                    {/* Mobile Back Button */}
                    <Link to="/blog" className="lg:hidden flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-8 transition-colors font-semibold">
                        <ArrowLeft size={20} />
                        Back to Guides
                    </Link>

                    {/* Mobile TOC */}
                    {blog.tableOfContents && (
                        <div className="lg:hidden bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8">
                            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <List size={18} />
                                Table of Contents
                            </h4>
                            <nav className="space-y-3">
                                {blog.tableOfContents.map((item) => (
                                    <a
                                        key={item.id}
                                        href={`#${item.id}`}
                                        onClick={(e) => scrollToSection(e, item.id)}
                                        className="block text-slate-600 hover:text-blue-600 text-sm font-medium"
                                    >
                                        {item.title}
                                    </a>
                                ))}
                            </nav>
                        </div>
                    )}

                    <div
                        className="prose prose-xl prose-slate max-w-none 
                            prose-headings:font-bold prose-headings:text-slate-900 prose-headings:mb-4 prose-headings:mt-10
                            prose-h2:text-4xl prose-h3:text-3xl prose-h4:text-2xl
                            prose-p:text-slate-700 prose-p:leading-8 prose-p:text-lg prose-p:mb-6
                            prose-a:text-blue-600 prose-a:font-semibold prose-a:no-underline hover:prose-a:underline
                            prose-img:rounded-2xl prose-img:shadow-lg prose-img:my-10
                            prose-strong:text-slate-900 prose-strong:font-bold
                            prose-li:text-slate-700 prose-li:text-lg prose-li:leading-relaxed prose-li:mb-2
                            prose-ul:my-6 prose-ol:my-6
                            prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-slate-600 prose-blockquote:text-xl prose-blockquote:bg-slate-50 prose-blockquote:py-2 prose-blockquote:pr-4 prose-blockquote:rounded-r-lg"
                        dangerouslySetInnerHTML={{ __html: blog.content }}
                    />

                    {/* Author Bio Box */}
                    <div className="mt-16 p-8 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-3xl flex-shrink-0 shadow-lg shadow-blue-500/20">
                                {blog.author.charAt(0)}
                            </div>
                            <div className="text-center sm:text-left">
                                <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                                    <h4 className="font-bold text-slate-900 text-xl">{blog.author}</h4>
                                    {blog.authorRole && (
                                        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                                            <ShieldCheck size={12} />
                                            {blog.authorRole}
                                        </span>
                                    )}
                                </div>
                                <p className="text-slate-600 leading-relaxed">
                                    Sharing authentic stories and expert travel tips from the heart of the Himalayas. Helping you explore the infinite.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Internal Linking / CTA Section */}
                    {relatedPackage && (
                        <div className="mt-12 bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden group hover:shadow-2xl hover:shadow-blue-900/20 transition-all duration-500">
                            {/* Background decoration */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl group-hover:bg-white/10 transition-colors"></div>

                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="flex-1 text-center md:text-left">
                                    <span className="inline-block text-blue-400 font-bold uppercase tracking-widest text-sm mb-3">
                                        Experience It Yourself
                                    </span>
                                    <h3 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                                        Inspired by this story? <br />
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                                            Book the {relatedPackage.title}
                                        </span>
                                    </h3>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-4 text-slate-300 text-sm mb-6">
                                        <span className="flex items-center gap-1"><Clock size={16} /> {relatedPackage.duration}</span>
                                        <span className="flex items-center gap-1"><MapPin size={16} /> {relatedPackage.location}</span>
                                        <span className="flex items-center gap-1"><User size={16} /> {relatedPackage.groupSize}</span>
                                    </div>
                                    <Link
                                        to={`/package/${relatedPackage.id}`}
                                        className="inline-flex items-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-full font-bold hover:bg-blue-50 transition-colors shadow-lg shadow-white/10"
                                    >
                                        View Itinerary <ArrowRight size={20} />
                                    </Link>
                                </div>
                                <div className="w-full md:w-1/3 aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                    <img
                                        src={relatedPackage.image}
                                        alt={relatedPackage.title}
                                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </article>
    );
};


export default BlogPost;
