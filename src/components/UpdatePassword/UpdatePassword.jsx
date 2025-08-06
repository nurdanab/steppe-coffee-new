// src/components/UpdatePassword/UpdatePassword.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import styles from './UpdatePassword.module.scss'; // Импортируем новый файл стилей

const UpdatePassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    console.log('UpdatePassword component mounted.'); 

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('UpdatePassword Auth State Change Event:', _event, 'Session:', session); 

      if (session && session.user) {
        setMessage('');
        setError('');
      } else {
        setError('Недействительная ссылка или сессия истекла. Пожалуйста, запросите сброс пароля заново.');
      }
    });

    const checkInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('UpdatePassword Initial Session Check:', session); 
      if (session && session.user) {
        setMessage('');
        setError('');
      } else {
        setError('Недействительная ссылка или сессия истекла. Пожалуйста, запросите сброс пароля заново.');
      }
    };
    checkInitialSession();

    return () => {
      subscription.unsubscribe();
      console.log('UpdatePassword component unmounted.');
    };
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
    if (password.length < 6) {
      setError('Пароль должен быть не менее 6 символов.');
      setLoading(false);
      return;
    }

    try {
       const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(updateError.message);
        console.error('Ошибка обновления пароля:', updateError.message);
      } else {
        setMessage('Пароль успешно обновлен! Вы можете войти с новым паролем.');
        alert('Пароль успешно обновлен! Пожалуйста, войдите.');
        navigate('/');
      }
    } catch (err) {
      setError('Произошла непредвиденная ошибка.');
      console.error('Непредвиденная ошибка обновления пароля:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.pageContainer}>
      <div className={styles.formContainer}>
        <h2 className={styles.heading}>Сброс пароля</h2>
        {message && <p className={styles.successMessage}>{message}</p>}
        {error && <p className={styles.errorMessage}>{error}</p>}

         {!error && ( 
          <form onSubmit={handlePasswordUpdate}>
            <div className={styles.formGroup}>
              {/* <label htmlFor="new-password" className={styles.label}>Новый пароль:</label> */}
              <input
                type="password"
                id="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className={styles.input}
                placeholder="Новый пароль" // Добавлен placeholder
              />
            </div>
            <div className={styles.formGroup}>
              {/* <label htmlFor="confirm-password" className={styles.label}>Подтвердите пароль:</label> */}
              <input
                type="password"
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className={styles.input}
                placeholder="Подтвердите пароль" // Добавлен placeholder
              />
            </div>
            <button type="submit" disabled={loading} className={styles.button}>
              {loading ? 'Обновление...' : 'Обновить пароль'}
            </button>
          </form>
        )}
        {error && ( 
          <p className={styles.instructions}>
            Если вы видите это сообщение об ошибке, пожалуйста, <a href="#" onClick={() => navigate('/')}>вернитесь на главную страницу</a> и снова запросите сброс пароля через форму входа.
          </p>
        )}
      </div>
    </main>
  );
};

export default UpdatePassword;