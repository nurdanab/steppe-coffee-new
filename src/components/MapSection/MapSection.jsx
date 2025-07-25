// src/components/MapSection/MapSection.jsx

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'; // Импортируем компоненты Leaflet
import 'leaflet/dist/leaflet.css'; // Импортируем CSS Leaflet (он будет из node_modules)
import L from 'leaflet'; // Импортируем базовый объект Leaflet для кастомных иконок

import styles from './MapSection.module.scss';

// Исправляем путь к стандартным иконкам Leaflet, так как они не всегда правильно подгружаются в React
// Это распространенная проблема с Leaflet в Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});


const MapSection = () => {
    // Координаты для Steppe Coffee (Leaflet использует [широта, долгота]!)
    const steppeCoffeePosition = [43.244499, 76.94142]; // lat, lon (широта, долгота)
    const initialZoom = 16; // Начальный зум

    const twoGisRouteUrl = "http://2gis.kz/almaty/center/76.94142,43.244499/zoom/16/routeTab/rsType/bus/to/76.94142,43.244499%E2%94%82Steppe%20Coffee,%20%D0%BA%D0%BE%D1%84%D0%B5%D0%B9%D0%BD%D1%8F?utm_medium=widget-source&utm_campaign=firmsonmap&utm_source=route";

    const handleRouteClick = () => {
        window.open(twoGisRouteUrl, '_blank');
    };

    return (
        <section className={styles.mapSection}>
            {/* Декоративные элементы */}
            <img src="/images/map-decor1.png" alt="Декоративный элемент" className={styles.mapDecor1} />
            <img src="/images/map-decor2.png" alt="Декоративный элемент" className={styles.mapDecor2} />
            <img src="/images/map-decor3.png" alt="Декоративный элемент" className={styles.mapDecor3} />

            <h2 className={styles.title}>Steppe Coffee на карте</h2>

            <div className={styles.contentWrapper}>
                {/* Левая часть: информация о кофейне */}
                <div className={styles.infoBlock}>
                    {/* Изображение будет на заднем плане */}
                    <img src="/images/address.png" alt="Фото кофейни" className={styles.addressBackgroundImage} />

                    {/* Этот блок будет позиционироваться поверх изображения */}
                    <div className={styles.overlayContent}>
                        <div className={styles.textInfo}>
                            <p className={styles.scheduleTitle}>График работы:</p>
                            <p className={styles.schedule}>Пн – Пт 07:45–23:00</p>
                            <p className={styles.schedule}>Сб – Вс 08:00–23:00</p>
                            <p className={styles.addressTitle}>Адрес:</p>
                            <p className={styles.address}>Улица Курмангазы, 63</p>
                        </div>
                        <button className={styles.routeButton} onClick={handleRouteClick}>
                            Проложить маршрут
                        </button>
                    </div>
                </div>

                {/* Правая часть: карта Leaflet */}
                <div className={styles.mapContainer}>
                    {/* MapContainer - основной компонент карты */}
                    {/* center: [широта, долгота] */}
                    {/* zoom: начальный зум */}
                    {/* scrollWheelZoom: можно отключить прокрутку колесиком, если не нужна */}
                    <MapContainer center={steppeCoffeePosition} zoom={initialZoom} scrollWheelZoom={false}
                                  style={{ height: '100%', width: '100%', borderRadius: '15px' }}>
                        {/* TileLayer - это слой с тайлами карты (сами изображения карты) */}
                        {/* Здесь используются тайлы OpenStreetMap, они бесплатны */}
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {/* Marker - компонент для маркера на карте */}
                        <Marker position={steppeCoffeePosition}>
                            {/* Popup - всплывающее окно при клике на маркер */}
                            <Popup>
                                Steppe Coffee <br /> Улица Курмангазы, 63.
                            </Popup>
                        </Marker>
                    </MapContainer>
                </div>
            </div>
        </section>
    );
};

export default MapSection;