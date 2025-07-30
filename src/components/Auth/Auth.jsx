// src/components/Auth/Auth.jsx
import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import styles from './Auth.module.scss';

const Auth = ({ isOpen, onClose, onAuthSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false); // <-- Новое состояние для сброса пароля

  if (!isOpen) {
    return null;
  }

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      let authResponse;
      if (isSignUp) {
        authResponse = await supabase.auth.signUp({
          email,
          password,
        });
      } else {
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
        } else {
          setMessage('Успешный вход! Вы вошли в систему.');
          if (onAuthSuccess) {
            onAuthSuccess(data.user);
          }
          onClose();
        }
      }
    } catch (err) {
      setMessage('Произошла непредвиденная ошибка.');
      console.error('Непредвиденная ошибка аутентификации:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- НОВАЯ ФУНКЦИЯ ДЛЯ СБРОСА ПАРОЛЯ ---
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (!email) {
        setMessage('Пожалуйста, введите ваш Email для сброса пароля.');
        setLoading(false);
        return;
      }

      // Отправляем запрос на сброс пароля
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/update-password', // <-- Важно: URL для страницы сброса пароля
      });

      if (error) {
        setMessage(error.message);
        console.error('Ошибка сброса пароля:', error.message);
      } else {
        setMessage('Ссылка для сброса пароля отправлена на ваш Email. Пожалуйста, проверьте почту.');
        setShowResetPassword(false); // Скрываем форму сброса после отправки
      }
    } catch (err) {
      setMessage('Произошла непредвиденная ошибка.');
      console.error('Непредвиденная ошибка сброса пароля:', err);
    } finally {
      setLoading(false);
    }
  };
  // --- КОНЕЦ НОВОЙ ФУНКЦИИ ---

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} disabled={loading}>&times;</button>
        <h2>{showResetPassword ? 'Сброс пароля' : (isSignUp ? 'Регистрация' : 'Вход')}</h2> {/* Динамический заголовок */}
        {message && <p className={styles.message}>{message}</p>}

        {showResetPassword ? ( // Если показываем форму сброса пароля
          <form onSubmit={handlePasswordReset}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Ваш Email:</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <button type="submit" disabled={loading} className={styles.authButton}>
              {loading ? 'Отправка...' : 'Отправить ссылку для сброса'}
            </button>
            <p className={styles.toggleAuth}>
              <button
                onClick={() => setShowResetPassword(false)}
                className={styles.toggleButton}
                disabled={loading}
              >
                Вернуться к входу
              </button>
            </p>
          </form>
        ) : ( // Если показываем форму входа/регистрации
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
            {/* <-- Кнопка "Забыли пароль" --> */}
            {!isSignUp && ( // Показываем только для формы входа
              <p className={styles.forgotPassword}>
                <button
                  onClick={() => setShowResetPassword(true)}
                  className={styles.toggleButton} // Можешь создать отдельный стиль
                  disabled={loading}
                >
                  Забыли пароль?
                </button>
              </p>
            )}
            {/* <-- КОНЕЦ Кнопки "Забыли пароль" --> */}
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;