import React from 'react';
import './WhatsAppFeedback.css';

const WhatsAppFeedback = ({ phoneNumber, prefilledMessage }) => {
  const createWhatsAppLink = () => {
    const formattedPhoneNumber = phoneNumber.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(prefilledMessage);
    return `https://wa.me/${formattedPhoneNumber}?text=${encodedMessage}`;
  };

  return (
    <div className="whatsapp-feedback-container">
      <h3>Оставьте ваш отзыв</h3>
      <p>Ваше мнение очень важно для нас. Нажмите на кнопку ниже, чтобы написать нам в WhatsApp.</p>
      <a
        href={createWhatsAppLink()}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-button"
      >
        Написать в WhatsApp
      </a>
    </div>
  );
};

export default WhatsAppFeedback;