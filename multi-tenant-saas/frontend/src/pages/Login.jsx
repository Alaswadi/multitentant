import React, { useState } from 'react';
import getClient from '../utils/tenant';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [form, setForm] = useState({ email: '', password: '', slug: '' });
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            const { data } = await getClient(form.slug).post('/api/login', form);
            localStorage.setItem('token', data.token);
            localStorage.setItem('tenantSlug', data.tenantSlug);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        }
    };

    return (
        <div style={cardStyle}>
            <h2>Login to Workspace</h2>
            <form onSubmit={handleSubmit}>
                {/* WHY: Since subdomains might not work in local Docker, we provide a slug input. */}
                <input style={inputStyle} placeholder="Tenant Slug (e.g. acme-corp)" onChange={e => setForm({ ...form, slug: e.target.value })} required />
                <input style={inputStyle} type="email" placeholder="Email" onChange={e => setForm({ ...form, email: e.target.value })} required />
                <input style={inputStyle} type="password" placeholder="Password" onChange={e => setForm({ ...form, password: e.target.value })} required />
                <button style={buttonStyle} type="submit">Login</button>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <p><Link to="/signup">Need a workspace? Sign up</Link></p>
        </div>
    );
};

const cardStyle = { background: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '400px' };
const inputStyle = { width: '100%', marginBottom: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' };
const buttonStyle = { width: '100%', background: '#3b82f6', color: 'white', padding: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' };

export default Login;
