import { useState } from 'react';
import AuthPage from './pages/AuthPage';
import BusinessDashboard from './pages/BusinessDashboard';
import InvestorDashboard from './pages/InvestorDashboard';

function readSavedUser() {
  try {
    return localStorage.getItem('token') ? JSON.parse(localStorage.getItem('user')) : null;
  } catch {
    return null;
  }
}

function App() {
  const [user, setUser] = useState(readSavedUser);

  const handleAuth = ({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (!user) {
    return (
      <div className="container">
        <h1>Invoice liquidity</h1>
        <AuthPage onAuth={handleAuth} />
      </div>
    );
  }

  return (
    <div className="container">
      <div className="topbar">
        <h1>Invoice liquidity</h1>
        <div className="topbar-user">
          <span className="muted">{user.name} · {user.role}</span>
          <button onClick={handleLogout}>Log out</button>
        </div>
      </div>

      {user.role === 'business' && <BusinessDashboard />}
      {user.role === 'investor' && <InvestorDashboard />}
    </div>
  );
}

export default App;