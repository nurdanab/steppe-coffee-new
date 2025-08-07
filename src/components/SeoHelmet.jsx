// src/components/SeoHelmet.jsx
import React from 'react';
import { Helmet } from 'react-helmet-async';
import StructuredData from './StructuredData';

const SeoHelmet = ({ title, description, ogImage, ogUrl, structuredData }) => {
  const defaultTitle = "Steppe Coffee - Уютная кофейня в Алматы: насладитесь лучшим кофе!";
  const defaultDescription = "Пространство для общения, вдохновения и новых впечатлений.";
  const defaultOgImage = "https://steppecoffee.netlify.app/images/og/og-image.webp";
  const defaultOgUrl = "https://steppecoffee.netlify.app/";

  return (
    <Helmet>
      <title>{title || defaultTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      
      {/* Open Graph мета-теги для социальных сетей */}
      <meta property="og:title" content={title || defaultTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:image" content={ogImage || defaultOgImage} />
      <meta property="og:url" content={ogUrl || defaultOgUrl} />
      <meta property="og:type" content="website" />

      {/* Структурированные данные для поисковых систем */}
      <StructuredData data={structuredData} />
    </Helmet>
  );
};

export default SeoHelmet;