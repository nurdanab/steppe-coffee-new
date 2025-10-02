import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import './MovieNightModal.css';

const MovieNightModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    guests: 1
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Формируем сообщение для Telegram
      const message = `<b>🎬 🎬 🎬 Новая регистрация на киновечер! 🎬 🎬 🎬</b>\n\n` +
        `<b>Имя:</b> ${formData.name}\n` +
        `<b>Телефон:</b> ${formData.phone}\n` +
        `<b>Количество гостей:</b> ${formData.guests}\n`;

      console.log('Отправка сообщения в Telegram:', message);

      // Отправляем уведомление в Telegram
      const { data, error } = await supabase.functions.invoke('telegram-notification', {
        body: { message }
      });

      console.log('Ответ от Telegram функции:', { data, error });

      if (error) {
        console.error('Ошибка от Supabase функции:', error);
        throw error;
      }

      setSubmitStatus('success');
      setFormData({ name: '', phone: '', guests: 1 });

      setTimeout(() => {
        onClose();
        setSubmitStatus(null);
      }, 2000);

    } catch (error) {
      console.error('Полная ошибка при отправке:', error);
      console.error('Детали ошибки:', JSON.stringify(error, null, 2));
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="movie-modal-overlay" onClick={onClose}>
      <div className="movie-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="movie-modal-close" onClick={onClose}>×</button>

        <div className="movie-modal-header">
          <h2>Киновечер в Steppe Coffee</h2>
          <p>Забронируйте место на наш киновечер!</p>
        </div>

        <form onSubmit={handleSubmit} className="movie-modal-form">
          <div className="form-group">
            <label htmlFor="name">Ваше имя *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Введите ваше имя"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Номер телефона *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="+7 (___) ___-__-__"
            />
          </div>

          <div className="form-group">
            <label htmlFor="guests">Количество гостей *</label>
            <input
              type="number"
              id="guests"
              name="guests"
              value={formData.guests}
              onChange={handleChange}
              min="1"
              required
            />
          </div>

          {submitStatus === 'success' && (
            <div className="submit-message success">
              ✓ Спасибо! Ваша заявка принята!
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="submit-message error">
              ✗ Ошибка при отправке. Попробуйте снова.
            </div>
          )}

          <button
            type="submit"
            className="movie-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Отправка...' : 'Забронировать место'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MovieNightModal;
