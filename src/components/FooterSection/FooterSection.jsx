import React from 'react';
import styles from './FooterSection.module.scss';
import ScissorsIcon from '../../assets/icons/logo-icon.svg'; // Убедитесь, что путь к вашей иконке правильный

const FooterSection = () => {
    // Номер телефона в международном формате (без знака +)
    // Например, для Казахстана: 77004792109
    const whatsappPhoneNumber = "+77004792109"; 
    
    // Текст, который будет автоматически заполнен
    const whatsappMessage = "Здравствуйте! Хочу узнать подробнее о подписке"; 
    
    // URL для WhatsApp
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsappPhoneNumber}&text=${encodeURIComponent(whatsappMessage)}`;
    
    const appStoreUrl = "https://apps.apple.com/us/app/steppe-coffee-membership-app/id1234567890?mt=8";
    const emptyPageUrl = "/empty-document"; 
    
    const handleSubscribeClick = () => {
        // Открываем ссылку WhatsApp в новой вкладке
        window.open(whatsappUrl, '_blank');
    };

    const handleDownloadAppClick = () => {
        window.open(appStoreUrl, '_blank');
    };

    const handleDocumentClick = (documentType) => {
        alert(`Переход на страницу с документом: ${documentType} (пока заглушка)`);
    };

    return (
        <footer className={styles.footerSection}>
            {/* Слой 0: Нижний фон с волной (footer-decor-2.jpg) */}
            <div className={styles.footerDecorBackground} />

            {/* Слой 1: Основной контент верхней части - "Присоединяйтесь к сообществу" и телефон */}
            <div className="headerFullWidthContainer"> 
                <div className={styles.communityBlock}>
                    <div className={styles.communityContent}>
                        <h2 className={styles.communityTitle}>Присоединяйтесь к 1000+ членам сообщества</h2>
                        <p className={styles.communityText}>
                            Получайте доступ к эксклюзивным предложениям, бонусам и событиям,
                            доступным только в приложении.
                        </p>
                        <button className={styles.subscribeButton} onClick={handleSubscribeClick}>
                            Подробнее о подписке
                        </button>
                    </div>
                    <div className={styles.communityImage}>
                        <img src="/images/phone-app.png" alt="Мобильное приложение Steppe Coffee" />
                    </div>
                </div> 
            </div>

            {/* Слой 1: Реклама приложения в нижней левой части */}
            <div className="headerFullWidthContainer"> 
                <div className={styles.appPromoBlock}>
                    <h3 className={styles.appPromoTitle}>Steppe Coffee: Membership app</h3>
                    <p className={styles.appPromoDescription}>
                        Оформляйте заказы, копите бонусы и участвуйте в мероприятиях.
                    </p>
                    <button className={styles.downloadAppButton} onClick={handleDownloadAppClick}>
                        <span>Скачать приложение</span>
                        {/* <img src={ScissorsIcon} alt="Иконка ножниц" className={styles.scissorsIcon} /> */}
                    </button>
                    {/* Логотип-ножницы отдельно, если он должен быть как декоративный элемент */}
                    <img src={ScissorsIcon} alt="Декоративные ножницы" className={styles.appPromoLogo} />
                </div>            
            </div>


            {/* Слой 2: footer-decor-1.png в правой нижней части */}
            <div className={styles.footerDecorMid}></div>

            {/* Слой 3: Основной контент футера - "Контакты" и "О нас" */}
            <div className="headerFullWidthContainer"> 
                <div className={styles.mainFooterContent}>
                    <div className={styles.footerColumn}>
                        <h3 className={styles.columnTitle}>Контакты</h3>
                        <p className={styles.contactInfo}>
                            Улица Курмангазы, 63 1 этаж,<br/>
                            Алмалинский район, Алматы
                        </p>
                        <p className={styles.contactInfo}>
                            <a href="mailto:contact@steppecoffee.kz" className={styles.contactLink}>contact@steppecoffee.kz</a>
                        </p>
                        <div className={styles.socialIcons}>
                            <a href="https://www.instagram.com/steppecoffeekz/" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Instagram">
                                <img src="/images/instagram-icon.webp" alt="Instagram" className={styles.icon} />
                            </a>
                            <a href="tel:+77004792109" className={styles.socialLink} aria-label="Call">                             
                                <img src="/images/phone-icon.webp" alt="Телефон" className={styles.icon} />
                            </a>
                            <a href="https://www.threads.com/@steppecoffeekz" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Threads">
                                <img src="/images/threads-icon.webp" alt="Threads" className={styles.icon} />
                            </a>
                            <a href="https://www.tiktok.com/@steppecoffeekz" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="TikTok">
                                <img src="/images/tiktok-icon.webp" alt="TikTok" className={styles.icon} />
                            </a>
                        </div>
                    </div>

                    <div className={styles.footerColumn}>
                        <h3 className={styles.columnTitle}>О нас</h3>
                        <ul className={styles.documentLinks}>
                            <li><a href="/documentsPdf/privacy-policy.pdf" target="_blank" rel="noopener noreferrer" className={styles.documentLink}>Политика конфиденциальности</a></li>
                            <li><a href="/documentsPdf/legal-information.pdf" target="_blank" rel="noopener noreferrer" className={styles.documentLink}>Правовая информация</a></li>
                            <li><a href="/documentsPdf/information-about-payments.pdf" target="_blank" rel="noopener noreferrer" className={styles.documentLink}>Сервисная информация</a></li>
                            <li><a href="/documentsPdf/information-about-payments.pdf" target="_blank" rel="noopener noreferrer" className={styles.documentLink}>О безопасности платежей</a></li>
                            <li><a href="/documentsPdf/public-offer.pdf" target="_blank" rel="noopener noreferrer" className={styles.documentLink}>Договор публичной оферты</a></li>
                        </ul>
                    </div>
                </div>            
            </div>


            {/* Копирайт (отдельный блок, на макете он самый нижний) */}
            <div className={styles.copyright}>
                <p>&copy; {new Date().getFullYear()} Steppe Coffee. Все права защищены.</p>
            </div>
        </footer>
    );
};

export default FooterSection;