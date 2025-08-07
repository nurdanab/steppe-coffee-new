// src/components/StructuredData.jsx
import React from 'react';

const StructuredData = ({ data }) => {
  if (!data) {
    return null;
  }
  return (
    <script type="application/ld+json">
      {JSON.stringify(data, null, 2)}
    </script>
  );
};

export default StructuredData;