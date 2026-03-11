import React, { useState } from 'react';
import getClient from '../utils/tenant';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
    const [form, setForm] = useState({ companyName: '', email: '', password: '' });
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            const { data } = await getClient().post('/api/signup', form);
            setSuccess(data.slug);
        } catch (err) {
            setError(err.response?.data?.error || 'Signup failed');
        }
    };

    if (success) {
        return (
            <div style={cardStyle}>
                <h2>Workspace Ready!</h2>
                <p>Tenant slug: <strong>{success}</strong></p>
                <p>You can now log in to your dedicated workspace.</p>
                <Link to="/login" style={buttonStyle}>Go to Login</Link>
            </div>
        );
    }

    return (
        <div style={cardStyle}>
            <h2>Create New Tenant</h2>
            <form onSubmit={handleSubmit}>
                <input style={inputStyle} placeholder="Company Name" onChange={e => setForm({ ...form, companyName: e.target.value })} required />
                <input style={inputStyle} type="email" placeholder="Email" onChange={e => setForm({ ...form, email: e.target.value })} required />
                <input style={inputStyle} type="password" placeholder="Password" onChange={e => setForm({ ...form, password: e.target.value })} required />
                <button style={buttonStyle} type="submit">Sign Up</button>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <p><Link to="/login">Already have a workspace? Login</Link></p>
        </div>
    );
};

const cardStyle = { background: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '400px' };
const inputStyle = { width: '100%', marginBottom: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' };
const buttonStyle = { width: '100%', background: '#3b82f6', color: 'white', padding: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' };

export default Signup;
