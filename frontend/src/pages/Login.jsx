import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { api } from '../api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await api.auth.login({ email, contrasena: password });
      if (data.token) {
        login({ id: data.id, email: data.email, rol: data.rol, nombre: data.nombre }, data.token);
        navigate(data.rol === 'cliente' ? '/cliente' : '/dashboard');
      } else {
        setError(data.msg || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError('Error de conexión');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🔧</span>
          <span style={styles.logoText}>TallerPro</span>
        </div>
        <h2 style={styles.title}>Iniciar Sesión</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />
          <button type="submit" style={styles.button}>Entrar</button>
        </form>
        {error && <p style={styles.error}>{error}</p>}
        <p onClick={() => navigate('/register')} style={styles.link}>¿No tienes cuenta? Regístrate</p>
      </div>
    </div>
  );
};

const styles = {
  container: { 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '100vh', 
    background: '#1a1a2e',
    fontFamily: "'Inter', -apple-system, sans-serif"
  },
  loginBox: {
    background: '#16213e',
    padding: '40px',
    borderRadius: '16px',
    width: '400px',
    maxWidth: '90%'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '30px'
  },
  logoIcon: { fontSize: '36px' },
  logoText: { fontSize: '28px', fontWeight: '700', color: 'white' },
  title: { color: 'white', marginBottom: '24px', textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  input: { 
    padding: '14px 16px', 
    fontSize: '15px',
    border: '1px solid #333',
    borderRadius: '8px',
    background: '#1a1a2e',
    color: 'white',
    outline: 'none'
  },
  button: { 
    padding: '14px', 
    fontSize: '16px', 
    background: '#e94560', 
    color: 'white', 
    border: 'none', 
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    marginTop: '10px'
  },
  error: { color: '#ef4444', textAlign: 'center', marginTop: '10px' },
  link: { color: '#e94560', cursor: 'pointer', marginTop: '20px', textAlign: 'center' }
};

export default Login;
