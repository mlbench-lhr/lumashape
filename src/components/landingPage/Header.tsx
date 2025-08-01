'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import Button from '../ui/Button';

interface NavigationItem {
  name: string;
  href: string;
  sectionId?: string; // Add optional sectionId for scroll spy
}

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('/');
  const pathname = usePathname();

  const navigation: NavigationItem[] = [
    { name: 'Home', href: '/', sectionId: 'home' },
    { name: 'Benefits', href: '/benefits', sectionId: 'benefits' },
    { name: 'How It Works', href: '/how-it-works', sectionId: 'working' },
    { name: 'Pricing', href: '/pricing', sectionId: 'pricing' },
    { name: 'FAQs', href: '/faq', sectionId: 'faq' },
    { name: 'Contact Us', href: '/contact-us', sectionId: 'contact' }
  ];

  // Scroll spy functionality
  useEffect(() => {
    const handleScroll = () => {
      // Only run scroll spy on the home page
      if (pathname !== '/') return;

      const sections = navigation.map(item => item.sectionId).filter(Boolean);
      const scrollPosition = window.scrollY + 100; // Offset for header height

      // Find the current section in view
      let currentSection = '';
      
      for (const sectionId of sections) {
        const element = document.getElementById(sectionId!);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            currentSection = sectionId!;
            break;
          }
        }
      }

      // Update active tab based on current section
      if (currentSection) {
        const matchingNav = navigation.find(item => item.sectionId === currentSection);
        if (matchingNav) {
          setActiveTab(matchingNav.href);
        }
      }
    };

    // Only add scroll listener on home page
    if (pathname === '/') {
      window.addEventListener('scroll', handleScroll);
      handleScroll(); // Check initial scroll position
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    // Set active tab based on pathname for non-home pages
    if (pathname !== '/') {
      setActiveTab(pathname);
    }
  }, [pathname]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleTabClick = (href: string, sectionId?: string) => {
    // If we're on home page and clicking a section link
    if (pathname === '/' && sectionId) {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
        setActiveTab(href);
        closeMobileMenu();
        return;
      }
    }
    
    // For regular navigation
    setActiveTab(href);
    closeMobileMenu();
  };

  return (
    <>
      <header className="bg-white shadow-sm relative z-50 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-18 md:h-20">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <Link href="/" className="flex items-center space-x-2">
                <Image 
                  src="/images/logo/lumashape.svg" 
                  alt="Logo" 
                  width={180} 
                  height={40}
                  className="sm:w-[200px] sm:h-[45px] md:w-[238px] md:h-[54px]"
                />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden xl:flex space-x-6 flex-shrink-0">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={(e) => {
                    e.preventDefault();
                    handleTabClick(item.href, item.sectionId);
                  }}
                  className={`text-gray-600 hover:text-primary px-3 py-2 text-md font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    activeTab === item.href ? 'text-primary font-semibold' : ''
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </nav>

            {/* Desktop Action Buttons */}
            <div className="hidden xl:flex items-center space-x-4 flex-shrink-0">
              <Button
                variant="primary"
                size="sm"
                width="auto"
                className="xl:text-base xl:px-6"
              >
                Login/Signup
              </Button>
            </div>

            {/* Mobile/Tablet menu button */}
            <div className="xl:hidden flex items-center">
              <button
                type="button"
                onClick={toggleMobileMenu}
                className="text-gray-600 hover:text-gray-900 p-2 rounded-md transition-colors"
                aria-label="Toggle menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile/Tablet Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 xl:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile/Tablet Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out xl:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        } w-72 sm:w-80 md:w-96 lg:w-80`}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Sidebar Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Image 
                src="/images/logo/lumashape.svg" 
                alt="Logo" 
                width={180} 
                height={40}
                className="sm:w-[200px] sm:h-[45px]"
              />
            </div>
            <button
              onClick={closeMobileMenu}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
              aria-label="Close menu"
            >
              <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex-1 px-4 sm:px-6 py-4 sm:py-6 space-y-1 sm:space-y-2">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => handleTabClick(item.href, item.sectionId)}
                className={`block w-full text-left px-3 sm:px-4 py-3 sm:py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg text-base sm:text-lg font-medium transition-colors ${
                  activeTab === item.href ? 'text-primary font-semibold bg-blue-50' : ''
                }`}
              >
                {item.name}
              </button>
            ))}
          </nav>

          {/* Mobile Action Buttons */}
          <div className="p-4 sm:p-6 border-t border-gray-200 space-y-3">
            <button
              onClick={closeMobileMenu}
              className="block w-full text-center bg-primary hover:bg-blue-700 text-white px-4 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-medium transition-colors"
            >
              Login/Signup
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;