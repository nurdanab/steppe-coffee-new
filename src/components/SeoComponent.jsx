import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';

const SeoComponent = ({ title, description, ogImage, ogUrl, structuredData }) => {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {/* Мета-теги Open Graph для социальных сетей */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={ogUrl} />
      <meta property="og:type" content="website" />
      {/* Каноническая ссылка, очень важна для SEO */}
      <link rel="canonical" href={ogUrl} />

      {/* Проверяем, есть ли структурированные данные, и добавляем их */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

SeoComponent.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  ogImage: PropTypes.string, // ogImage теперь не обязателен
  ogUrl: PropTypes.string, // ogUrl теперь не обязателен
  structuredData: PropTypes.object, // structuredData также не обязателен
};

export default SeoComponent;