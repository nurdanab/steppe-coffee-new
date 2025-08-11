// src/components/SeoContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const SeoContext = createContext(null);

export const SeoProvider = ({ children }) => {
  const [seoData, setSeoData] = useState({});

  return (
    <SeoContext.Provider value={{ seoData, setSeoData }}>
      {children}
    </SeoContext.Provider>
  );
};

export const useSeo = () => {
  const context = useContext(SeoContext);
  if (!context) {
    throw new Error('useSeo должен использоваться внутри SeoProvider');
  }
  return context;
};

export const useSeoData = (data) => {
    const { setSeoData } = useSeo();
  
    useEffect(() => {
      setSeoData(data);
      return () => setSeoData({}); // Очищаем данные при размонтировании
    }, [data, setSeoData]);
  };