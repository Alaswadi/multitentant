import { Link } from 'react-router-dom';

const Landing = () => (
    <div style={{ textAlign: 'center', padding: '50px' }}>
        <h1>Welcome to Multi-tenant SaaS</h1>
        <p>A boilerplate demonstrating schema-per-tenant isolation with Docker.</p>
        <div style={{ marginTop: '20px' }}>
            <Link to="/signup" style={buttonStyle}>Sign Up</Link>
            <Link to="/login" style={{ ...buttonStyle, marginLeft: '10px', background: '#4b5563' }}>Login</Link>
        </div>
    </div>
);

const buttonStyle = {
    background: '#3b82f6', color: 'white', padding: '10px 20px', borderRadius: '5px', textDecoration: 'none', fontWeight: 'bold'
};

export default Landing;
