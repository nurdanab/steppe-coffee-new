// src/components/ProfilePage/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import styles from './ProfilePage.module.scss';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const ProfilePage = ({ session, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [userMetadata, setUserMetadata] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUserMetadata() {
      if (session) {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('metadata')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Ошибка получения метаданных:', error);
        } else {
          setUserMetadata(data.metadata);
        }
        setLoading(false);
      }
    }
    fetchUserMetadata();
  }, [session]);

  const handleUpdatePasswordRedirect = () => {
    navigate('/update-password');
  };

  if (loading) {
    return (
      <main className={styles.profilePage}>
        <div className={styles.container}>
          <p>Загрузка данных пользователя...</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.profilePage}>
      <div className={styles.container}>
        <h1 className={styles.title}>Личный кабинет</h1>
        <div className={styles.profileInfo}>
          <p><strong>Email:</strong> {session.user.email}</p>
          {userMetadata && (
            <>
              {userMetadata.name && <p><strong>Имя:</strong> {userMetadata.name}</p>}
              {userMetadata.phone && <p><strong>Телефон:</strong> {userMetadata.phone}</p>}
            </>
          )}
        </div>
        <div className={styles.profileActions}>
          <button
            onClick={handleUpdatePasswordRedirect}
            className={styles.updatePasswordButton}
          >
            Изменить пароль
          </button>
          <button onClick={onLogout} className={styles.logoutButton}>
            Выйти
          </button>
        </div>
      </div>
    </main>
  );
};

export default ProfilePage;