// src/components/NotFoundPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import SeoHelmet from './SeoHelmet'; // Используем наш компонент для SEO

const NotFoundPage = () => {
  return (
    <main style={{ textAlign: 'center', padding: '50px 20px', minHeight: '80vh' }}>
      <SeoHelmet
        title="Страница не найдена (404) | Steppe Coffee"
        description="К сожалению, запрашиваемая вами страница не существует."
      />
      <h1>404</h1>
      <h2>Страница не найдена</h2>
      <p>Кажется, вы попали на несуществующую страницу. Не переживайте, вы можете вернуться на главную!</p>
      <Link to="/" style={{ display: 'inline-block', marginTop: '20px', padding: '10px 20px', backgroundColor: '#5D4037', color: '#fff', textDecoration: 'none', borderRadius: '5px' }}>
        Вернуться на главную
      </Link>
    </main>
  );
};

export default NotFoundPage;