// src/components/UpdatePassword/UpdatePassword.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom'; // Для перенаправления после сброса
// import styles from './UpdatePassword.module.scss'; // Создадим этот SCSS файл

const UpdatePassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // useEffect для проверки сессии и сброса пароля
  useEffect(() => {
    // Supabase автоматически обрабатывает токен сброса пароля из URL
    // и устанавливает временную сессию.
    // Нам нужно просто проверить, что есть сессия, и можно обновлять.
    // Если сессии нет, это означает, что пользователь зашел на страницу напрямую, без токена
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setError('Недействительная ссылка или сессия истекла. Пожалуйста, запросите сброс пароля заново.');
      }
    });

    // Можно также слушать изменения состояния аутентификации
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session && session.user) {
            setMessage('Вы можете обновить свой пароль.');
            setError('');
        } else {
            setError('Сессия не активна. Пожалуйста, запросите сброс пароля заново.');
        }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (password !== confirmPassword) {
      setError('Пароли не совпадают.');
      setLoading(false);
      return;
    }
    if (password.length < 6) { // Минимальная длина пароля
      setError('Пароль должен быть не менее 6 символов.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setError(error.message);
        console.error('Ошибка обновления пароля:', error.message);
      } else {
        setMessage('Пароль успешно обновлен! Вы можете войти с новым паролем.');
        alert('Пароль успешно обновлен! Пожалуйста, войдите.');
        // Перенаправляем пользователя на страницу входа или главную
        navigate('/'); // Или на страницу входа, если у тебя есть такая
      }
    } catch (err) {
      setError('Произошла непредвиденная ошибка.');
      console.error('Непредвиденная ошибка обновления пароля:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.updatePasswordPage}>
      <div className={styles.formContainer}>
        <h2>Сброс пароля</h2>
        {message && <p className={styles.successMessage}>{message}</p>}
        {error && <p className={styles.errorMessage}>{error}</p>}

        {/* Форма доступна только если нет критических ошибок и пользователь потенциально может сбросить пароль */}
        {!error ? (
          <form onSubmit={handlePasswordUpdate}>
            <div className={styles.formGroup}>
              <label htmlFor="new-password">Новый пароль:</label>
              <input
                type="password"
                id="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="confirm-password">Подтвердите пароль:</label>
              <input
                type="password"
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <button type="submit" disabled={loading} className={styles.updateButton}>
              {loading ? 'Обновление...' : 'Обновить пароль'}
            </button>
          </form>
        ) : (
          <p className={styles.instructions}>
            Если вы видите это сообщение об ошибке, пожалуйста, <a href="#" onClick={() => navigate('/')}>вернитесь на главную страницу</a> и снова запросите сброс пароля через форму входа.
          </p>
        )}
      </div>
    </main>
  );
};

export default UpdatePassword;