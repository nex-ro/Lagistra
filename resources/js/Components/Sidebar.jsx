    import { useState, useEffect } from 'react';
    import { ChevronLeft, ChevronRight, Map, Layers, Database, Settings, BarChart3, FileText, User, LogOut, Loader2 } from 'lucide-react';
    import { Link, usePage, router } from '@inertiajs/react';

    export default function Sidebar({ isOpen, onToggle }) {
        const { url } = usePage();
        const [hoveredItem, setHoveredItem] = useState(null);
        const [isNavigating, setIsNavigating] = useState(false);
        const [targetUrl, setTargetUrl] = useState(null);

        const menuItems = [
            { name: 'Dashboard', icon: Map, href: '/dashboard', color: 'emerald' },
            { name: 'Kebun', icon: Layers, href: '/kebun', color: 'emerald' },
            { name: 'Legalitas & HGU', icon: FileText, href: '/legalitas', color: 'emerald' },
            { name: 'Produksi', icon: BarChart3, href: '/produksi', color: 'emerald' },
            { name: 'Sustainability', icon: Database, href: '/sustainability', color: 'emerald' },
            { name: 'Data & Citra', icon: Database, href: '/citra', color: 'emerald' },
        ];

        const bottomItems = [
            { name: 'Settings', icon: Settings, href: '/settings', color: 'slate' },
            { name: 'Profile', icon: User, href: '/profile', color: 'slate' },
        ];

        // Check if current URL matches the menu item
        const isActive = (href) => {
            // Exact match for dashboard
            if (href === '/dashboard') {
                return url === '/dashboard' || url === '/';
            }
            // For other routes, check if URL starts with the href
            return url.startsWith(href);
        };

        // Listen to Inertia navigation events
        useEffect(() => {
            const handleStart = (event) => {
                setIsNavigating(true);
                setTargetUrl(event.detail.visit.url.pathname);
            };

            const handleFinish = () => {
                setIsNavigating(false);
                setTargetUrl(null);
            };

            // Listen to Inertia events
            document.addEventListener('inertia:start', handleStart);
            document.addEventListener('inertia:finish', handleFinish);
            document.addEventListener('inertia:error', handleFinish);

            return () => {
                document.removeEventListener('inertia:start', handleStart);
                document.removeEventListener('inertia:finish', handleFinish);
                document.removeEventListener('inertia:error', handleFinish);
            };
        }, []);

        // Check if this item is being navigated to
        const isNavigatingTo = (href) => {
            return isNavigating && targetUrl === href;
        };

        // Get active color class safely
        const getActiveColorClass = (color) => {
            const colorMap = {
                'emerald': 'bg-emerald-600 shadow-emerald-600/30',
                'teal': 'bg-teal-600 shadow-teal-600/30',
                'blue': 'bg-blue-600 shadow-blue-600/30',
                'amber': 'bg-amber-600 shadow-amber-600/30',
                'green': 'bg-green-600 shadow-green-600/30',
                'purple': 'bg-purple-600 shadow-purple-600/30',
                'slate': 'bg-slate-700 shadow-slate-700/30'
            };
            return colorMap[color] || 'bg-slate-700';
        };

        return (
            <>
                {/* Loading Overlay */}
                {isNavigating && (
                        <div className={`fixed inset-0 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-emerald-900/95 backdrop-blur-md z-[9999] flex items-center justify-center transition-opacity duration-300 ${
                            isNavigating ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        }`}>
                        <div className="flex flex-col items-center gap-8 animate-pulse-slow">
                            {/* Logo with Spin */}
                            <div className="relative">
                                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
                                <div className="relative bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl p-8 shadow-2xl animate-spin-slow">
                                    <Loader2 className="w-16 h-16 text-white" />
                                </div>
                            </div>

                            {/* Loading Text */}
                            <div className="flex flex-col items-center gap-3">
                                <h3 className="text-2xl font-bold text-white tracking-wide">
                                    Loading
                                </h3>
                                <div className="flex gap-2">
                                    <span className="w-3 h-3 bg-emerald-400 rounded-full animate-bounce-1"></span>
                                    <span className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce-2"></span>
                                    <span className="w-3 h-3 bg-emerald-600 rounded-full animate-bounce-3"></span>
                                </div>
                            </div>

                            {/* Loading Bar */}
                            <div className="w-64 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 rounded-full animate-loading-bar"></div>
                            </div>

                            {/* Subtitle */}
                            <p className="text-slate-300 text-sm tracking-wider">
                                Please wait...
                            </p>
                        </div>
                    </div>
                )}

                {/* Sidebar */}
                <div 
                    className={`fixed left-0 top-0 h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white transition-all duration-300 ease-in-out z-50 shadow-2xl ${
                        isOpen ? 'w-64' : 'w-20'
                    }`}
                >
                    {/* Header */}
                    <div className="h-16 flex items-center justify-center px-4 border-b border-slate-700/50">
                        {isOpen ? (
                            <div className="flex items-center justify-center animate-fadeIn">
                                <img 
                                    src="/asset/legistra.png" 
                                    alt="LeGISTRA" 
                                    className="h-8 w-auto"
                                />
                            </div>
                        ) : (
                            <img 
                                src="/asset/logo.png" 
                                alt="Logo" 
                                className="h-8 w-8"
                            />
                        )}
                    </div>
                    
                    {/* Toggle Button */}
                    <button
                        onClick={onToggle}
                        className="absolute -right-3 top-20 bg-slate-800 hover:bg-slate-700 rounded-full p-1.5 shadow-lg border-2 border-slate-600 transition-colors duration-200 z-10"
                    >
                        {isOpen ? (
                            <ChevronLeft className="w-4 h-4" />
                        ) : (
                            <ChevronRight className="w-4 h-4" />
                        )}
                    </button>

                    {/* Navigation */}
                    <nav className="flex flex-col h-[calc(100vh-8rem)] justify-between py-6">
                        {/* Main Menu */}
                        <div className="space-y-1 px-3">
                            {menuItems.map((item, index) => {
                                const Icon = item.icon;
                                const active = isActive(item.href);
                                const navigating = isNavigatingTo(item.href);
                                
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onMouseEnter={() => setHoveredItem(item.name)}
                                        onMouseLeave={() => setHoveredItem(null)}
                                        className={`
                                            flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 group relative
                                            ${active 
                                                ? getActiveColorClass(item.color) + ' shadow-lg'
                                                : 'hover:bg-slate-700/50'
                                            }
                                            ${navigating ? 'opacity-70' : ''}
                                        `}
                                        style={{
                                            animationDelay: `${index * 50}ms`
                                        }}
                                    >
                                        {/* Active Indicator */}
                                        {active && (
                                            <div className="absolute left-0 w-1 h-8 bg-white rounded-r-full animate-slideIn"></div>
                                        )}
                                        
                                        {/* Icon with loading state */}
                                        {navigating ? (
                                            <Loader2 className="w-5 h-5 flex-shrink-0 text-white animate-spin" />
                                        ) : (
                                            <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'} transition-colors`} />
                                        )}
                                        
                                        {isOpen && (
                                            <span className={`font-medium text-sm ${active ? 'text-white' : 'text-slate-300'} group-hover:text-white transition-colors animate-fadeIn`}>
                                                {item.name}
                                            </span>
                                        )}

                                        {/* Tooltip for collapsed state */}
                                        {!isOpen && hoveredItem === item.name && (
                                            <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg shadow-xl whitespace-nowrap z-50 animate-fadeIn">
                                                {item.name}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-slate-800"></div>
                                            </div>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Bottom Menu */}
                        <div className="space-y-1 px-3 border-t border-slate-700/50 pt-4">
                            {bottomItems.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.href);
                                const navigating = isNavigatingTo(item.href);
                                
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onMouseEnter={() => setHoveredItem(item.name)}
                                        onMouseLeave={() => setHoveredItem(null)}
                                        className={`
                                            flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 group relative
                                            ${active ? getActiveColorClass(item.color) + ' shadow-lg' : 'hover:bg-slate-700/50'}
                                            ${navigating ? 'opacity-70' : ''}
                                        `}
                                    >
                                        {/* Active Indicator */}
                                        {active && (
                                            <div className="absolute left-0 w-1 h-8 bg-white rounded-r-full animate-slideIn"></div>
                                        )}

                                        {navigating ? (
                                            <Loader2 className="w-5 h-5 flex-shrink-0 text-white animate-spin" />
                                        ) : (
                                            <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : 'text-slate-400'} group-hover:text-white transition-colors`} />
                                        )}
                                        
                                        {isOpen && (
                                            <span className={`font-medium text-sm ${active ? 'text-white' : 'text-slate-300'} group-hover:text-white transition-colors animate-fadeIn`}>
                                                {item.name}
                                            </span>
                                        )}

                                        {!isOpen && hoveredItem === item.name && (
                                            <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg shadow-xl whitespace-nowrap z-50 animate-fadeIn">
                                                {item.name}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-slate-800"></div>
                                            </div>
                                        )}
                                    </Link>
                                );
                            })}
                            
                            {/* Logout Button */}
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                onMouseEnter={() => setHoveredItem('Logout')}
                                onMouseLeave={() => setHoveredItem(null)}
                                className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-red-600/20 transition-all duration-200 group relative w-full"
                            >
                                <LogOut className="w-5 h-5 flex-shrink-0 text-red-400 group-hover:text-red-300 transition-colors" />
                                
                                {isOpen && (
                                    <span className="font-medium text-sm text-red-300 group-hover:text-red-200 transition-colors animate-fadeIn">
                                        Logout
                                    </span>
                                )}

                                {!isOpen && hoveredItem === 'Logout' && (
                                    <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg shadow-xl whitespace-nowrap z-50 animate-fadeIn">
                                        Logout
                                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-slate-800"></div>
                                    </div>
                                )}
                            </Link>
                        </div>
                    </nav>
                </div>

                <style>{`
                    @keyframes fadeIn {
                        from {
                            opacity: 0;
                        }
                        to {
                            opacity: 1;
                        }
                    }

                    @keyframes slideIn {
                        from {
                            transform: translateX(-100%);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }

                    @keyframes spin-slow {
                        from {
                            transform: rotate(0deg);
                        }
                        to {
                            transform: rotate(360deg);
                        }
                    }

                    @keyframes pulse-slow {
                        0%, 100% {
                            opacity: 1;
                            transform: scale(1);
                        }
                        50% {
                            opacity: 0.8;
                            transform: scale(1.05);
                        }
                    }

                    @keyframes loading-bar {
                        0% {
                            transform: translateX(-100%);
                        }
                        50% {
                            transform: translateX(0%);
                        }
                        100% {
                            transform: translateX(100%);
                        }
                    }

                    @keyframes bounce-1 {
                        0%, 80%, 100% {
                            transform: scale(0);
                            opacity: 0.5;
                        }
                        40% {
                            transform: scale(1);
                            opacity: 1;
                        }
                    }

                    @keyframes bounce-2 {
                        0%, 80%, 100% {
                            transform: scale(0);
                            opacity: 0.5;
                        }
                        40% {
                            transform: scale(1);
                            opacity: 1;
                        }
                    }

                    @keyframes bounce-3 {
                        0%, 80%, 100% {
                            transform: scale(0);
                            opacity: 0.5;
                        }
                        40% {
                            transform: scale(1);
                            opacity: 1;
                        }
                    }

                    .animate-fadeIn {
                        animation: fadeIn 0.2s ease-out;
                    }

                    .animate-slideIn {
                        animation: slideIn 0.3s ease-out;
                    }

                    .animate-spin-slow {
                        animation: spin-slow 3s linear infinite;
                    }

                    .animate-pulse-slow {
                        animation: pulse-slow 2s ease-in-out infinite;
                    }

                    .animate-loading-bar {
                        animation: loading-bar 1.5s ease-in-out infinite;
                    }

                    .animate-bounce-1 {
                        animation: bounce-1 1.4s infinite ease-in-out;
                        animation-delay: 0s;
                    }

                    .animate-bounce-2 {
                        animation: bounce-2 1.4s infinite ease-in-out;
                        animation-delay: 0.2s;
                    }

                    .animate-bounce-3 {
                        animation: bounce-3 1.4s infinite ease-in-out;
                        animation-delay: 0.4s;
                    }
                `}</style>
            </>
        );
    }