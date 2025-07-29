// src/components/Auth/Auth.jsx
import React, { useState } from 'react';
import { supabase } from '../../supabaseClient'; // Импортируем supabase клиент
import styles from './Auth.module.scss'; // Убедись, что этот файл существует и содержит стили

const Auth = ({ isOpen, onClose, onAuthSuccess }) => { // Добавляем пропсы для модального окна и коллбэка
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false); // Для переключения между регистрацией и входом
  const [message, setMessage] = useState(''); // Для сообщений пользователю

  if (!isOpen) { // Если не открыто, не рендерим
    return null;
  }

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      let authResponse;
      if (isSignUp) {
        // Регистрация нового пользователя
        authResponse = await supabase.auth.signUp({
          email,
          password,
        });
      } else {
        // Вход существующего пользователя
        authResponse = await supabase.auth.signInWithPassword({
          email,
          password,
        });
      }

      const { data, error } = authResponse;

      if (error) {
        setMessage(error.message);
        console.error('Ошибка аутентификации:', error.message);
      } else {
        if (isSignUp) {
          setMessage('Успешная регистрация! Пожалуйста, проверьте свою электронную почту для подтверждения.');
          // После регистрации, пользователь ДОЛЖЕН подтвердить email.
          // Сессия не будет активна до подтверждения.
        } else {
          setMessage('Успешный вход! Вы вошли в систему.');
          console.log('Пользователь вошел в систему:', data.user);
          if (onAuthSuccess) {
            onAuthSuccess(data.user); // Передаем данные пользователя обратно в App
          }
          onClose(); // Закрываем модальное окно после успешного входа
        }
      }
    } catch (err) {
      setMessage('Произошла непредвиденная ошибка.');
      console.error('Непредвиденная ошибка аутентификации:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}> {/* Модальный оверлей */}
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}> {/* Контент модального окна */}
        <button className={styles.closeButton} onClick={onClose} disabled={loading}>&times;</button>
        <h2>{isSignUp ? 'Регистрация' : 'Вход'}</h2>
        {message && <p className={styles.message}>{message}</p>}
        <form onSubmit={handleAuth}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password">Пароль:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <button type="submit" disabled={loading} className={styles.authButton}>
            {loading ? 'Загрузка...' : (isSignUp ? 'Зарегистрироваться' : 'Войти')}
          </button>
        </form>
        <p className={styles.toggleAuth}>
          {isSignUp ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className={styles.toggleButton}
            disabled={loading}
          >
            {isSignUp ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;