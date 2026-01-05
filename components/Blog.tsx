
import React, { useState } from 'react';
import { useLanguage, BlogPost } from '../types';
import { marked } from 'marked';

const Blog: React.FC = () => {
    const { t } = useLanguage();
    const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
    const posts: BlogPost[] = t('blog.posts');

    const handlePostClick = (post: BlogPost) => {
        setSelectedPost(post);
        window.scrollTo(0, 0);
    };

    const handleBack = () => {
        setSelectedPost(null);
        window.scrollTo(0, 0);
    };

    if (selectedPost) {
        // Detail View
        return (
            <div className="animate-fade-in py-12 sm:py-16 bg-gray-50 dark:bg-[#111827] min-h-screen transition-colors">
                <div className="container mx-auto px-4 max-w-4xl">
                    <button 
                        onClick={handleBack}
                        className="mb-8 flex items-center text-brand-gold hover:underline transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rtl:ml-2 ltr:mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        {t('blog.back')}
                    </button>
                    
                    <article className="bg-white dark:bg-[#1F1F1F] rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-800">
                        <div className="w-full h-64 md:h-96 relative">
                            <img src={selectedPost.image} alt={selectedPost.title} className="w-full h-full object-cover" />
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/70 to-transparent"></div>
                            <div className="absolute bottom-0 left-0 w-full p-6 md:p-10">
                                <span className="bg-brand-gold text-brand-blue text-xs font-bold px-3 py-1 rounded-full mb-3 inline-block">
                                    {selectedPost.category}
                                </span>
                                <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">
                                    {selectedPost.title}
                                </h1>
                            </div>
                        </div>
                        
                        <div className="p-6 md:p-10">
                            <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mb-8 border-b border-gray-200 dark:border-gray-700 pb-4">
                                <div className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    <span>{selectedPost.author}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    <span>{selectedPost.date}</span>
                                </div>
                            </div>
                            
                            <div 
                                className="prose prose-lg dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: marked.parse(selectedPost.content) as string }}
                            />
                        </div>
                    </article>
                </div>
            </div>
        );
    }

    // List View
    return (
        <div className="animate-fade-in py-12 sm:py-16 bg-gray-50 dark:bg-[#111827] min-h-screen transition-colors">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">{t('blog.title')}</h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">{t('blog.subtitle')}</p>
                    <div className="w-24 h-1.5 bg-brand-gold mx-auto rounded-full mt-6"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.map((post) => (
                        <div 
                            key={post.id} 
                            className="bg-white dark:bg-[#1F1F1F] rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800 hover:border-brand-gold/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 flex flex-col h-full cursor-pointer group"
                            onClick={() => handlePostClick(post)}
                        >
                            <div className="relative h-56 overflow-hidden">
                                <img 
                                    src={post.image} 
                                    alt={post.title} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                />
                                <div className="absolute top-4 right-4">
                                    <span className="bg-brand-blue/80 backdrop-blur-sm text-brand-gold text-xs font-bold px-3 py-1 rounded-full">
                                        {post.category}
                                    </span>
                                </div>
                            </div>
                            <div className="p-6 flex flex-col flex-grow">
                                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-3">
                                    <span>{post.date}</span>
                                    <span>{post.author}</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-brand-gold transition-colors line-clamp-2">
                                    {post.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4 line-clamp-3 flex-grow">
                                    {post.excerpt}
                                </p>
                                <button className="text-brand-gold font-bold text-sm flex items-center mt-auto group-hover:translate-x-2 rtl:group-hover:-translate-x-2 transition-transform">
                                    {t('blog.readMore')}
                                    <svg className="w-4 h-4 ml-2 rtl:mr-2 rtl:ml-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Blog;
