// src/components/Header/Header.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './Header.module.scss';

const Header = ({ session, onOpenAuthModal, onLogout }) => {
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
  };

  const navigationItems = [
    { name: 'Главная', href: '/' },
    { name: 'Меню', href: '/menu' },
    { name: 'События', href: '/events' },
  ];

  const handleProfileClick = (e) => {
    if (!session) {
      e.preventDefault(); // Prevent default link behavior
      onOpenAuthModal();
    }
  };

  return (
    <>
      <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
        <div className={styles.headerFullWidthContainer}>
          <div className={styles.headerContent}>
            <div className={styles.logo}>
              <Link to="/" className={styles.logoLink}>
                <img
                  src="/images/logo-header.webp"
                  alt="Steppe Coffee Logo"
                  className={styles.logoImage}
                />
              </Link>
            </div>

            <div className={styles.headerRightContent}>
              <nav className={styles.navigation}>
                <ul className={styles.navigationList}>
                  {navigationItems.map((item, index) => (
                    <li key={index} className={styles.navigationItem}>
                      <Link to={item.href} className={styles.navigationLink}>
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className={styles.headerActions}>
                {/* Условный рендеринг для иконки профиля */}
                {session ? (
                  <Link to="/profile" className={styles.profileButton}>
                    <img src="/images/profile-icon.png" alt="Profile" className={styles.profileIcon} />
                  </Link>
                ) : (
                  <button onClick={onOpenAuthModal} className={styles.profileButton}>
                    <img src="/images/profile-icon.png" alt="Profile" className={styles.profileIcon} />
                  </button>
                )}

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
                  <Link
                    to={item.href}
                    className={styles.mobileNavigationLink}
                    onClick={toggleMobileMenu}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}

              <li className={styles.mobileNavigationItem}>
                {session ? (
                  <div className={styles.mobileProfileStatus}>
                    <Link to="/profile" className={styles.mobileLoggedInUserLink} onClick={toggleMobileMenu}>
                      Привет, {session.user.email}!
                    </Link>
                    <button onClick={() => { onLogout(); toggleMobileMenu(); }} className={styles.mobileLogoutButton}>
                      Выйти
                    </button>
                  </div>
                ) : (
                  <button onClick={() => { onOpenAuthModal(); toggleMobileMenu(); }} className={styles.mobileLoginButton}>
                    Войти
                  </button>
                )}
              </li>
            </ul>
          </nav>
        </div>
      )}
    </>
  );
};

export default Header;