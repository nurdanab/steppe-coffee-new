// src/components/UpdatePassword/UpdatePassword.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';

// Временно убираем импорт styles, чтобы обойти ошибку
// import styles from './UpdatePassword.module.scss';

const UpdatePassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setError('Недействительная ссылка или сессия истекла. Пожалуйста, запросите сброс пароля заново.');
      }
    });

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
    if (password.length < 6) {
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
        navigate('/');
      }
    } catch (err) {
      setError('Произошла непредвиденная ошибка.');
      console.error('Непредвиденная ошибка обновления пароля:', err);
    } finally {
      setLoading(false);
    }
  };

  // Простые инлайн-стили или глобальные классы, если они определены в main.scss
  const pageStyle = {
    padding: '80px 20px',
    maxWidth: '500px',
    margin: '0 auto',
    minHeight: 'calc(100vh - 150px)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  };

  const formContainerStyle = {
    backgroundColor: '#ffffff', // Белый фон
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
    width: '100%',
  };

  const formGroupStyle = {
    marginBottom: '15px',
  };

  const labelStyle = {
    display: 'block',
    textAlign: 'left',
    marginBottom: '8px',
    fontWeight: 'bold',
    color: '#333', // Темный текст
  };

  const inputStyle = {
    width: 'calc(100% - 20px)', // Учитываем padding
    padding: '10px',
    border: '1px solid #ddd', // Светлая граница
    borderRadius: '4px',
    fontSize: '16px',
  };

  const buttonStyle = {
    backgroundColor: '#007bff', // Синяя кнопка
    color: 'white',
    padding: '12px',
    fontSize: '18px',
    marginTop: '20px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    width: '100%',
  };

  const successMessageStyle = {
    color: '#155724',
    backgroundColor: '#d4edda',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '15px',
  };

  const errorMessageStyle = {
    color: '#721c24',
    backgroundColor: '#f8d7da',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '15px',
  };

  const instructionsStyle = {
    fontSize: '14px',
    color: '#666',
    marginTop: '20px',
  };


  return (
    <main style={pageStyle}>
      <div style={formContainerStyle}>
        <h2>Сброс пароля</h2>
        {message && <p style={successMessageStyle}>{message}</p>}
        {error && <p style={errorMessageStyle}>{error}</p>}

        {!error ? (
          <form onSubmit={handlePasswordUpdate}>
            <div style={formGroupStyle}>
              <label htmlFor="new-password" style={labelStyle}>Новый пароль:</label>
              <input
                type="password"
                id="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                style={inputStyle}
              />
            </div>
            <div style={formGroupStyle}>
              <label htmlFor="confirm-password" style={labelStyle}>Подтвердите пароль:</label>
              <input
                type="password"
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                style={inputStyle}
              />
            </div>
            <button type="submit" disabled={loading} style={buttonStyle}>
              {loading ? 'Обновление...' : 'Обновить пароль'}
            </button>
          </form>
        ) : (
          <p style={instructionsStyle}>
            Если вы видите это сообщение об ошибке, пожалуйста, <a href="#" onClick={() => navigate('/')}>вернитесь на главную страницу</a> и снова запросите сброс пароля через форму входа.
          </p>
        )}
      </div>
    </main>
  );
};

export default UpdatePassword;