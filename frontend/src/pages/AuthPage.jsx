import { useState } from 'react';
import apiClient from '../api/client';

function AuthPage({ onAuth }) {
    const [mode, setMode] = useState('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('business');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        const url = mode === 'login' ? '/auth/login' : '/auth/register';
        const body = mode === 'login'
            ? { email, password }
            : { name, email, password, role };

        apiClient.post(url, body)
            .then((response) => {
                onAuth(response.data);
            })
            .catch((err) => {
                setError(err.response?.data?.message || 'Something went wrong');
            })
            .finally(() => {
                setSubmitting(false);
            });
    };

    return (
        <form className="card auth-card" onSubmit={handleSubmit}>
            <h2>{mode === 'login' ? 'Log in' : 'Create an account'}</h2>

            {mode === 'register' && (
                <>
                    <div className="field">
                        <label>I am a</label>
                        <select value={role} onChange={(e) => setRole(e.target.value)}>
                            <option value="business">Business (I have invoices)</option>
                            <option value="investor">Investor (I want to fund invoices)</option>
                        </select>
                    </div>

                    <div className="field">
                        <label>{role === 'business' ? 'Business name' : 'Your name'}</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                </>
            )}

            <div className="field">
                <label>Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>

            <div className="field">
                <label>Password {mode === 'register' && '(at least 8 characters)'}</label>
                <input
                    type="password"
                    maxLength={mode === 'register' ? 72 : undefined}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </div>

            {error && <p className="error-text">{error}</p>}

            <div className="button-row">
                <button type="submit" className="primary" disabled={submitting}>
                    {submitting ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Register'}
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setMode(mode === 'login' ? 'register' : 'login');
                        setError('');
                    }}
                >
                    {mode === 'login' ? 'Need an account?' : 'Have an account?'}
                </button>
            </div>
        </form>
    );
}

export default AuthPage;