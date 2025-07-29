import React, { useState, useEffect } from 'react';
import styles from './Header.module.scss';

// Добавляем пропсы session, onOpenAuthModal, onLogout
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
    // document.body.style.overflow = isMobileMenuOpen ? 'auto' : 'hidden'; // Эта строка может конфликтовать со стилями модальных окон
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
                  {/* Добавляем элемент списка для кнопки входа/выхода для десктопа */}
                  <li className={styles.navigationItem}>
                    {session ? (
                      // Если пользователь авторизован, показываем его email и кнопку "Выйти"
                      <div className={styles.profileStatus}>
                        <span className={styles.loggedInUser}>
                          Привет, {session.user.email}!
                        </span>
                        <button onClick={onLogout} className={styles.logoutButton}>
                          Выйти
                        </button>
                      </div>
                    ) : (
                      // Если пользователь не авторизован, показываем кнопку "Войти"
                      <button onClick={onOpenAuthModal} className={styles.loginButton}>
                        Войти
                      </button>
                    )}
                  </li>
                </ul>
              </nav>

              <div className={styles.headerActions}>
                {/* Иконка профиля, которая теперь будет частью логики входа/выхода */}
                {session ? (
                  <button onClick={onLogout} className={styles.profileButton}> {/* Кнопка для выхода */}
                    <img
                      src="/images/profile-icon.png"
                      alt="Profile"
                      className={styles.profileIcon}
                    />
                  </button>
                ) : (
                  <button onClick={onOpenAuthModal} className={styles.profileButton}> {/* Кнопка для входа */}
                    <img
                      src="/images/profile-icon.png"
                      alt="Profile"
                      className={styles.profileIcon}
                    />
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
                  <a
                    href={item.href}
                    className={styles.mobileNavigationLink}
                    onClick={toggleMobileMenu} // Закрываем меню при клике на ссылку
                  >
                    {item.name}
                  </a>
                </li>
              ))}
              {/* Добавляем кнопку входа/выхода в мобильное меню */}
              <li className={styles.mobileNavigationItem}>
                {session ? (
                  <div className={styles.mobileProfileStatus}>
                    <span className={styles.mobileLoggedInUser}>
                      Привет, {session.user.email}!
                    </span>
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