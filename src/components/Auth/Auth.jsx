// src/components/Auth/Auth.jsx
import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import styles from './Auth.module.scss';
// import { useNavigate } from 'react-router-dom'; // Эту строку можно удалить, так как useNavigate больше не нужен

const Auth = ({ isOpen, onClose, onAuthSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  // const navigate = useNavigate(); // Эту строку можно удалить

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
        if (error.message.includes('User already registered') || error.message.includes('Email already registered')) {
          setMessage('Пользователь с таким Email уже зарегистрирован. Пожалуйста, войдите или используйте другой Email.');
        } else {
          setMessage(error.message);
        }
        console.error('Ошибка аутентификации:', error.message);
      } else {
        if (isSignUp) {
          setMessage('Успешная регистрация! Пожалуйста, проверьте свою электронную почту для подтверждения.');
        } else {
          setMessage('Успешный вход! Вы вошли в систему.');
          if (onAuthSuccess) {
            onAuthSuccess(data.user);
          }
        }
      }
    } catch (err) {
      setMessage('Произошла непредвиденная ошибка.');
      console.error('Непредвиденная ошибка аутентификации:', err);
    } finally {
      setLoading(false);
    }
  };

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

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/update-password',
        });

        if (error) {
            setMessage(error.message);
            console.error('Ошибка сброса пароля:', error.message);
        } else {
            setMessage('Ссылка для сброса пароля отправлена на ваш Email. Пожалуйста, проверьте почту.');
            setShowResetPassword(false);
        }
    } catch (err) {
        setMessage('Произошла непредвиденная ошибка.');
        console.error('Непредвиденная ошибка сброса пароля:', err);
    } finally {
        setLoading(false);
    }
};

  const handleOverlayClick = (e) => {
    if (e.target.className.includes(styles.modalOverlay)) {
      onClose(); // Просто вызываем onClose, навигация будет в App.jsx
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <h2>{showResetPassword ? 'Сброс пароля' : (isSignUp ? 'Регистрация' : 'Вход')}</h2>
        {message && <p className={styles.message}>{message}</p>}

        {showResetPassword ? (
          <form onSubmit={handlePasswordReset}>
            <div className={styles.formGroup}>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className={styles.input}
                placeholder="Email"
              />
            </div>
            <button type="submit" disabled={loading} className={styles.authButton}>
              {loading ? 'Отправка...' : 'Получить ссылку'}
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
        ) : (
          <form onSubmit={handleAuth}>
            <div className={styles.formGroup}>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className={styles.input}
                placeholder="Email"
              />
            </div>
            <div className={styles.formGroup}>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className={styles.input}
                placeholder="Пароль"
              />
            </div>
            <button type="submit" disabled={loading} className={styles.authButton}>
              {loading ? 'Загрузка...' : (isSignUp ? 'Зарегистрироваться' : 'Войти')}
            </button>
            <p className={styles.toggleAuth}>
              {isSignUp ? 'Уже есть аккаунт?' : 'Нет аккаунта?  '}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className={styles.toggleButton}
                disabled={loading}
              >
                {isSignUp ? 'Войти' : 'Зарегистрироваться'}
              </button>
            </p>
            {!isSignUp && (
              <p className={styles.forgotPassword}>
                <button
                  onClick={() => setShowResetPassword(true)}
                  className={styles.toggleButton}
                  disabled={loading}
                >
                  Забыли пароль?
                </button>
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;