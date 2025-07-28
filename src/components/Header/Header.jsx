import React, { useState, useEffect } from 'react';
import styles from './Header.module.scss';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigationItems = [
    { name: 'Главная', href: '/' },
    { name: 'Меню', href: '#' },
    { name: 'События', href: '#' },
  ];

  return (
    <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
      <div className="container">
        <div className={styles.headerContent}>
          {/* Logo */}
          <div className={styles.logo}>
            <a href="/" className={styles.logoLink}>
              <img 
                src="/images/logo-header.webp" 
                alt="Steppe Coffee Logo" 
                className={styles.logoImage}  
              />
            </a>
          </div>

          {/* Navigation */}
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
              <li className={styles.navigationItem}>
                <a href="#" className={styles.profileLink}>
                  <img 
                    src="/images/profile-icon.png" 
                    alt="Profile"
                    className={styles.profileIcon}
                  />
                </a>
              </li>
            </ul>
          </nav>

          {/* Mobile Menu Button */}
          <button className={styles.mobileMenuButton}>
            <span className={styles.hamburger}></span>
            <span className={styles.hamburger}></span>
            <span className={styles.hamburger}></span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;