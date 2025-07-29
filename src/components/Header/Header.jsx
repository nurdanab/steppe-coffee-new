import React, { useState, useEffect } from 'react';
import styles from './Header.module.scss';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    document.body.style.overflow = isMobileMenuOpen ? 'auto' : 'hidden';
  };

  const navigationItems = [
    { name: 'Главная', href: '/' },
    { name: 'Меню', href: '#' },
    { name: 'События', href: '#' },
  ];

  return (
    <>
      <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
        <div className={styles.headerFullWidthContainer}>
          <div className={styles.headerContent}>
            <div className={styles.logo}>
              <a href="/" className={styles.logoLink}>
                <img
                  src="/images/logo-header.webp"
                  alt="Steppe Coffee Logo"
                  className={styles.logoImage}
                />
              </a>
            </div>

            <div className={styles.headerRightContent}>
              <nav className={styles.navigation}>
                <ul className={styles.navigationList}>
                  {navigationItems.map((item, index) => (
                    <li key={index} className={styles.navigationItem}>
                      <a
                        href={item.href}
                        className={styles.navigationLink}
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className={styles.headerActions}>
                <a href="#" className={styles.profileLink}>
                  <img
                    src="/images/profile-icon.png"
                    alt="Profile"
                    className={styles.profileIcon}
                  />
                </a>
                <button
                  className={`${styles.mobileMenuButton} ${isMobileMenuOpen ? styles.open : ''}`}
                  onClick={toggleMobileMenu}
                  aria-label="Toggle mobile menu"
                >
                  <span className={styles.hamburger}></span>
                  <span className={styles.hamburger}></span>
                  <span className={styles.hamburger}></span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className={`${styles.mobileMenuOverlay} ${isMobileMenuOpen ? styles.open : ''}`}>
          <nav>
            <ul className={styles.mobileNavigationList}>
              {navigationItems.map((item, index) => (
                <li key={index} className={styles.mobileNavigationItem}>
                  <a
                    href={item.href}
                    className={styles.mobileNavigationLink}
                    onClick={toggleMobileMenu}
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </>
  );
};

export default Header;