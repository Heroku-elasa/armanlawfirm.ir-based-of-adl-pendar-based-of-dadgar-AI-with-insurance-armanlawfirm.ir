
import React, { useState } from 'react';
import { useLanguage, PageKey } from '../types';

// WordPress Color Palette
// #1d2327 - Sidebar/Admin Bar Dark
// #2c3338 - Sidebar Hover
// #2271b1 - WP Blue (Links, Primary Buttons)
// #f0f0f1 - Main Background
// #ffffff - Card Background
// #dcdcde - Borders

interface WordPressDashboardProps {
    setPage: (page: 'home' | PageKey) => void;
}

const WordPressDashboard: React.FC<WordPressDashboardProps> = ({ setPage }) => {
    const { t } = useLanguage();
    const [draftTitle, setDraftTitle] = useState('');
    const [draftContent, setDraftContent] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    const menuItems = [
        { name: 'Dashboard', icon: 'dashicons-dashboard', active: true },
        { name: 'Posts', icon: 'dashicons-admin-post', badge: 2 },
        { name: 'Media', icon: 'dashicons-admin-media' },
        { name: 'Pages', icon: 'dashicons-admin-page' },
        { name: 'Comments', icon: 'dashicons-admin-comments', badge: 1 },
        { name: 'Appearance', icon: 'dashicons-admin-appearance' },
        { name: 'Plugins', icon: 'dashicons-admin-plugins', badge: 3 },
        { name: 'Users', icon: 'dashicons-admin-users' },
        { name: 'Tools', icon: 'dashicons-admin-tools' },
        { name: 'Settings', icon: 'dashicons-admin-settings' },
    ];

    const recentActivity = [
        { time: '12:45 pm', text: 'You published the post "Adl Pendar Legal Guide"' },
        { time: '10:30 am', text: 'Ali Rezaei commented on "Divorce Laws"' },
        { time: 'Yesterday', text: 'System backup completed successfully' },
    ];

    return (
        <div className="flex h-screen bg-[#f0f0f1] font-sans text-[13px] text-[#3c434a] overflow-hidden direction-ltr ltr">
            {/* Sidebar */}
            <div className={`bg-[#1d2327] text-white flex-shrink-0 transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-40' : 'w-9'}`}>
                {/* Admin Bar Spacer */}
                <div className="h-8 bg-[#1d2327]"></div> 
                
                <ul className="flex-grow overflow-y-auto">
                    {menuItems.map((item, index) => (
                        <li key={index} className={`group relative cursor-pointer hover:bg-[#135e96] hover:text-white transition-colors ${item.active ? 'bg-[#2271b1] text-white' : 'text-[#f0f0f1]'}`}>
                            <div className="flex items-center h-[34px] px-3">
                                {/* Mock Icon */}
                                <div className={`dashicons ${item.icon} w-5 h-5 flex items-center justify-center opacity-70 group-hover:opacity-100`}>
                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                                        <rect width="16" height="16" x="2" y="2" rx="2" fillOpacity="0.5"/>
                                    </svg>
                                </div>
                                {isSidebarOpen && (
                                    <span className="ml-2 font-medium flex-grow truncate">{item.name}</span>
                                )}
                                {item.badge && isSidebarOpen && (
                                    <span className="ml-auto bg-[#d63638] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                                        {item.badge}
                                    </span>
                                )}
                            </div>
                            {/* Hover Submenu Indicator */}
                            {!isSidebarOpen && (
                                <div className="absolute left-full top-0 w-48 bg-[#1d2327] text-white p-2 hidden group-hover:block z-50 shadow-lg">
                                    {item.name}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
                <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="h-10 text-[#a7aaad] hover:text-[#2271b1] flex items-center justify-center border-t border-[#3c434a] focus:outline-none"
                >
                    <span className={`transform transition-transform ${isSidebarOpen ? 'rotate-180' : ''}`}>«</span>
                </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-grow flex flex-col h-full overflow-hidden">
                {/* Admin Bar */}
                <div className="h-8 bg-[#1d2327] text-[#f0f0f1] flex items-center justify-between px-3 text-[13px] flex-shrink-0 z-40">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1 cursor-pointer hover:text-[#72aee6] group relative">
                            <span className="font-bold dashicons-wordpress w-5 h-5 flex items-center justify-center bg-white text-[#1d2327] rounded-full p-0.5">W</span>
                            {/* WP Menu Dropdown */}
                            <div className="absolute top-8 left-0 w-48 bg-[#1d2327] hidden group-hover:block shadow-lg border-t border-[#2271b1]">
                                <div className="p-2 hover:bg-[#2271b1]">About WordPress</div>
                                <div className="p-2 hover:bg-[#2271b1]">Get Involved</div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-1 cursor-pointer hover:text-[#72aee6]" onClick={() => setPage('home')}>
                            <span className="dashicons-admin-home">🏠</span>
                            <span className="font-semibold">Adl Pendar</span>
                        </div>
                        <div className="flex items-center space-x-1 cursor-pointer hover:text-[#72aee6]">
                            <span className="dashicons-admin-comments">💬</span>
                            <span>1</span>
                        </div>
                        <div className="flex items-center space-x-1 cursor-pointer hover:text-[#72aee6] group relative">
                            <span className="dashicons-plus">➕</span>
                            <span>New</span>
                             <div className="absolute top-8 left-0 w-40 bg-[#1d2327] hidden group-hover:block shadow-lg">
                                <div className="p-2 hover:bg-[#2271b1]">Post</div>
                                <div className="p-2 hover:bg-[#2271b1]">Media</div>
                                <div className="p-2 hover:bg-[#2271b1]">Page</div>
                                <div className="p-2 hover:bg-[#2271b1]">User</div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="cursor-pointer hover:text-[#72aee6] font-medium flex items-center gap-2" onClick={() => setPage('dashboard')}>
                            Return to App Dashboard
                        </div>
                        <div className="flex items-center space-x-2 cursor-pointer hover:text-[#72aee6]">
                            <span>Howdy, Admin</span>
                            <img src="https://i.sstatic.net/xVUdgkWi.jpg" alt="Avatar" className="w-5 h-5 rounded-sm" />
                        </div>
                    </div>
                </div>

                {/* Content Body */}
                <div className="flex-grow overflow-y-auto p-5">
                    <div className="flex flex-col mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <h1 className="text-2xl text-[#1d2327] font-medium">Dashboard</h1>
                            <div className="flex space-x-2">
                                <button className="border border-[#2271b1] text-[#2271b1] px-3 py-1 rounded hover:bg-[#f6f7f7]">Screen Options ▼</button>
                                <button 
                                    onClick={() => setIsHelpOpen(!isHelpOpen)}
                                    className={`border px-3 py-1 rounded transition-colors ${isHelpOpen ? 'bg-[#2271b1] text-white border-[#2271b1]' : 'border-[#2271b1] text-[#2271b1] hover:bg-[#f6f7f7]'}`}
                                >
                                    Help ▼
                                </button>
                            </div>
                        </div>
                        
                        {/* Help Panel */}
                        {isHelpOpen && (
                            <div className="bg-white border border-[#dcdcde] shadow-sm p-0 mb-5 text-[13px] animate-fade-in">
                                <div className="flex">
                                    <div className="w-1/4 bg-[#f6f7f7] border-r border-[#dcdcde]">
                                        <ul className="py-2">
                                            <li className="px-4 py-2 font-semibold text-[#1d2327] bg-white border-l-4 border-[#2271b1]">Overview</li>
                                            <li className="px-4 py-2 text-[#2271b1] cursor-pointer hover:text-[#135e96]">Navigation</li>
                                            <li className="px-4 py-2 text-[#2271b1] cursor-pointer hover:text-[#135e96]">Layout</li>
                                            <li className="px-4 py-2 text-[#2271b1] cursor-pointer hover:text-[#135e96]">Content</li>
                                        </ul>
                                    </div>
                                    <div className="w-3/4 p-4 space-y-3 text-[#3c434a]">
                                        <h3 className="font-semibold text-lg text-[#1d2327]">Dashboard Overview</h3>
                                        <p>Welcome to your WordPress Dashboard! This is the central hub for managing your site.</p>
                                        <p><strong>Admin Bar:</strong> The toolbar at the top provides quick access to common tasks like adding new posts, viewing your site, and managing your profile.</p>
                                        <p><strong>Sidebar Menu:</strong> On the left, you'll find links to all the administrative areas of your site, such as Posts, Media, Pages, and Settings.</p>
                                        <p><strong>Screen Options:</strong> Use this tab (top right) to customize which widgets are displayed on this screen.</p>
                                        <p>You can drag and drop the widgets below to rearrange your dashboard layout.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Widgets Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        
                        {/* At a Glance */}
                        <div className="bg-white border border-[#dcdcde] shadow-sm p-0 h-fit">
                            <div className="px-4 py-3 border-b border-[#dcdcde] font-semibold text-sm">At a Glance</div>
                            <div className="p-4 space-y-2">
                                <div className="flex items-center space-x-2 text-[#2271b1] cursor-pointer hover:text-[#135e96]">
                                    <span className="dashicons-admin-post">📝</span>
                                    <span>12 Posts</span>
                                </div>
                                <div className="flex items-center space-x-2 text-[#2271b1] cursor-pointer hover:text-[#135e96]">
                                    <span className="dashicons-admin-page">📄</span>
                                    <span>5 Pages</span>
                                </div>
                                <div className="flex items-center space-x-2 text-[#2271b1] cursor-pointer hover:text-[#135e96]">
                                    <span className="dashicons-admin-comments">💬</span>
                                    <span>1 Comment</span>
                                </div>
                                <div className="pt-3 mt-3 border-t border-[#f0f0f1] text-[#646970]">
                                    Running <span className="font-semibold">AdlPendar Theme</span> with <span className="font-semibold">Dadgar AI</span> plugin.
                                </div>
                            </div>
                        </div>

                        {/* Activity */}
                        <div className="bg-white border border-[#dcdcde] shadow-sm p-0 h-fit">
                            <div className="px-4 py-3 border-b border-[#dcdcde] font-semibold text-sm">Activity</div>
                            <div className="p-0">
                                <div className="px-4 py-3 border-b border-[#f0f0f1]">
                                    <p className="text-[#646970] mb-1">Recently Published</p>
                                    <ul className="space-y-3">
                                        {recentActivity.map((act, i) => (
                                            <li key={i} className="text-[#646970]">
                                                <span className="text-[#a7aaad] mr-1">{act.time}</span>
                                                <span className="text-[#1d2327]">{act.text}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Quick Draft */}
                        <div className="bg-white border border-[#dcdcde] shadow-sm p-0 h-fit">
                            <div className="px-4 py-3 border-b border-[#dcdcde] font-semibold text-sm">Quick Draft</div>
                            <div className="p-4 space-y-3">
                                <input 
                                    type="text" 
                                    placeholder="Title" 
                                    value={draftTitle}
                                    onChange={(e) => setDraftTitle(e.target.value)}
                                    className="w-full border border-[#8c8f94] p-1.5 rounded-sm text-sm focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-none"
                                />
                                <textarea 
                                    rows={4} 
                                    placeholder="What's on your mind?" 
                                    value={draftContent}
                                    onChange={(e) => setDraftContent(e.target.value)}
                                    className="w-full border border-[#8c8f94] p-1.5 rounded-sm text-sm focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-none resize-none"
                                />
                                <button 
                                    className="bg-[#2271b1] text-white px-3 py-1.5 rounded-sm text-xs font-semibold hover:bg-[#135e96] transition-colors"
                                    onClick={() => { setDraftTitle(''); setDraftContent(''); alert('Draft Saved Locally!'); }}
                                >
                                    Save Draft
                                </button>
                            </div>
                        </div>

                        {/* WordPress Events and News */}
                        <div className="bg-white border border-[#dcdcde] shadow-sm p-0 h-fit">
                            <div className="px-4 py-3 border-b border-[#dcdcde] font-semibold text-sm">WordPress Events and News</div>
                            <div className="p-4 text-[#646970] space-y-3">
                                <div>
                                    <h4 className="font-semibold text-[#2271b1] mb-1 cursor-pointer hover:underline">WordPress 6.5 "Regina"</h4>
                                    <p>The latest version of WordPress is now available. Update today for new features and security fixes.</p>
                                </div>
                                <hr className="border-[#f0f0f1]" />
                                <div>
                                    <h4 className="font-semibold text-[#2271b1] mb-1 cursor-pointer hover:underline">Community Summit 2025</h4>
                                    <p>Join the community summit to discuss the future of the project.</p>
                                </div>
                            </div>
                        </div>

                    </div>
                    
                    <div className="mt-8 text-center text-[#646970] text-xs">
                        Thank you for creating with <a href="#" className="text-[#2271b1] hover:underline">WordPress</a>. | Version 6.5.2
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WordPressDashboard;
