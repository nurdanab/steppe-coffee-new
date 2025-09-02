// src/components/FooterSection/FooterSection.jsx
import React from 'react';
import styles from './FooterSection.module.scss';
import ScissorsIcon from '../../assets/icons/logo-icon.svg'; 
import LazyImage from '../LazyImage/LazyImage.jsx';
import AnimatedWave from '../AnimatedWave/AnimatedWave';

const FooterSection = () => {
    const whatsappPhoneNumber = "+77082591231"; 
    const whatsappMessage = "Здравствуйте! Хочу узнать подробнее о подписке"; 
    
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsappPhoneNumber}&text=${encodeURIComponent(whatsappMessage)}`;
    
    const appStoreUrl = "https://apps.apple.com/us/app/steppe-coffee-membership-app/id1234567890?mt=8";
    const emptyPageUrl = "/empty-document"; 
    
    const handleSubscribeClick = () => {
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
            <div className={styles.waveTopContainer}>
                <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" className={styles.shapeFill}></path>
                    <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" className={styles.shapeFill}></path>
                    <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" className={styles.shapeFill}></path>
                </svg>
            </div>
            
            <AnimatedWave />

            <div className={styles.communityBlock}>
                <div className="container"> 
                    <div className={styles.communityContent}>
                        <h2 className={styles.communityTitle}>Присоединяйтесь к 1000+ любителям кофе!</h2>
                        <p className={styles.communityText}>
                        Заходи чаще и получай больше!
Получайте доступ к эксклюзивным предложениям, бонусам и событиям, доступным только в приложении.<br/><br/>
Стать участником легко - просто активируйте подписку за 3000 тенге в месяц в нашем приложении. Наша подписка — это не просто приглашение в нашу семью, а сервис.
                        </p>
                        <button className={styles.subscribeButton} onClick={handleSubscribeClick}>
                            Подробнее о подписке
                        </button>
                    </div>
                    <div className={styles.communityImage}>
                        <LazyImage src="/images/phone-app.png" alt="Мобильное приложение Steppe Coffee" />
                    </div>
                </div> 
            </div>
            
            <div className={styles.bottomContentWrapper}>
                <div className="container">
                    <div className={styles.appPromoBlock}>
                        <h3 className={styles.appPromoTitle}>Steppe Coffee: Membership app</h3>
                        <p className={styles.appPromoDescription}>
                            Оформляйте заказы, копите бонусы и участвуйте в мероприятиях.
                        </p>
                        <button className={styles.downloadAppButton} onClick={handleDownloadAppClick}>
                            <span>Скачать приложение</span>
                        </button>
                    </div>
                    <div className={styles.footerColumnsWrapper}>
                        <div className={styles.footerColumn}>
                            <h3 className={styles.columnTitle}>Контакты</h3>
                            <p className={styles.contactInfo}>
                            Город Алматы<br/>
                            Улица Курмангазы, 63
                            </p>
                            {/* <p className={styles.contactInfo}>
                                <a href="mailto:contact@steppecoffee.kz" className={styles.contactLink}>contact@steppecoffee.kz</a>
                            </p> */}
                            <div className={styles.socialIcons}>
                                <a href="https://www.instagram.com/steppecoffeekz/" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Instagram">
                                    <LazyImage src="/images/instagram-icon.webp" alt="Instagram" className={styles.icon} />
                                </a>
                                <a href="tel:+77082591231" className={styles.socialLink} aria-label="Call">                             
                                    <LazyImage src="/images/phone-icon.webp" alt="Телефон" className={styles.icon} />
                                </a>
                                <a href="https://www.threads.com/@steppecoffeekz" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Threads">
                                    <LazyImage src="/images/threads-icon.webp" alt="Threads" className={styles.icon} />
                                </a>
                                <a href="https://www.tiktok.com/@steppecoffeekz" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="TikTok">
                                    <LazyImage src="/images/tiktok-icon.webp" alt="TikTok" className={styles.icon} />
                                </a>
                            </div>
                        </div>
                        <div className={styles.footerColumn}>
                            <h3 className={styles.columnTitle}>О нас</h3>
                            <ul className={styles.documentLinks}>
                                <li><a href="/documentsPdf/privacy-policy.pdf" target="_blank" rel="noopener noreferrer" className={styles.documentLink}>Политика конфиденциальности</a></li>
                                <li><a href="/documentsPdf/legal-information.pdf" target="_blank" rel="noopener noreferrer" className={styles.documentLink}>Правовая информация</a></li>
                                <li><a href="/documentsPdf/information-about-the-service.pdf" target="_blank" rel="noopener noreferrer" className={styles.documentLink}>Сервисная информация</a></li>
                                <li><a href="/documentsPdf/information-about-payment-security.pdf" target="_blank" rel="noopener noreferrer" className={styles.documentLink}>О безопасности платежей</a></li>
                                <li><a href="/documentsPdf/public-offer-agreement.pdf" target="_blank" rel="noopener noreferrer" className={styles.documentLink}>Договор публичной оферты</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className={styles.copyright}>
                <p>&copy; {new Date().getFullYear()} Steppe Coffee. Все права защищены.</p>
            </div>
        </footer>
    );
};

export default FooterSection;