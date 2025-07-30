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
    // document.body.style.overflow = isMobileMenuOpen ? 'auto' : 'hidden'; // Закомментировано из-за конфликтов с модальными окнами
  };

  const navigationItems = [
    { name: 'Главная', href: '/' },
    { name: 'Меню', href: '#' }, // Если меню - это секция на главной, а не отдельная страница
    { name: 'События', href: '/events' },
  ];

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
                  {/* Иконка профиля/кнопка Входа/Выхода для десктопа - теперь отдельный пункт */}
                  <li className={styles.navigationItem}>
                    {session ? (
                      // Если пользователь авторизован, ссылка на профиль и email
                      <Link to="/profile" className={styles.profileLink}>
                        <img src="/images/profile-icon.png" alt="Profile" className={styles.profileIcon} />
                        <span className={styles.userEmail}>Привет, {session.user.email}!</span>
                      </Link>
                    ) : (
                      // Если не авторизован, кнопка "Войти"
                      <button onClick={onOpenAuthModal} className={styles.loginButton}>
                        Войти
                      </button>
                    )}
                  </li>
                </ul>
              </nav>

              <div className={styles.headerActions}>
                {/* Отдельная кнопка иконки профиля для мобильных (или просто как иконка) */}
                {session ? (
                   <Link to="/profile" className={styles.profileButton}> {/* Ссылка на профиль */}
                     <img src="/images/profile-icon.png" alt="Profile" className={styles.profileIcon} />
                   </Link>
                 ) : (
                   <button onClick={onOpenAuthModal} className={styles.profileButton}> {/* Кнопка для входа */}
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
                    onClick={toggleMobileMenu} // Закрываем меню при клике на ссылку
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
              {/* Элементы для мобильного меню (Вход/Выход/Профиль) */}
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