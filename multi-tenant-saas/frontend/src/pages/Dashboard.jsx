import React, { useState, useEffect, useCallback } from 'react';
import getClient, { clearAuth } from '../utils/tenant';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const [data, setData] = useState(null);
    const [newProject, setNewProject] = useState({ name: '', description: '' });
    const navigate = useNavigate();

    const fetchDashboard = useCallback(async () => {
        try {
            const { data } = await getClient().get('/api/dashboard');
            setData(data);
        } catch (err) {
            clearAuth();
            navigate('/login');
        }
    }, [navigate]);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    const addProject = async (e) => {
        e.preventDefault();
        try {
            await getClient().post('/api/dashboard/projects', newProject);
            setNewProject({ name: '', description: '' });
            fetchDashboard();
        } catch (err) {
            alert('Failed to add project');
        }
    };

    if (!data) return <p>Loading...</p>;

    return (
        <div style={containerStyle}>
            <header style={headerStyle}>
                <h1>{data.tenant.name} Dashboard</h1>
                <p>Logged in as: {data.user.email} (Tenant: {data.user.tenantSlug})</p>
                <button onClick={() => { clearAuth(); navigate('/login'); }} style={logoutStyle}>Logout</button>
            </header>

            <div style={flexStyle}>
                <section style={sectionStyle}>
                    <h2>Projects</h2>
                    {data.projects.length === 0 ? <p>No projects yet.</p> : (
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {data.projects.map(p => (
                                <li key={p.id} style={projectCard}>
                                    <strong>{p.name}</strong>
                                    <p>{p.description}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section style={formSection}>
                    <h2>New Project</h2>
                    <form onSubmit={addProject}>
                        <input style={inputStyle} placeholder="Project Name" value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} required />
                        <textarea style={inputStyle} placeholder="Description" value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} required />
                        <button style={buttonStyle} type="submit">Add Project</button>
                    </form>
                </section>
            </div>
        </div>
    );
};

const containerStyle = { width: '900px', margin: 'auto', padding: '20px' };
const headerStyle = { borderBottom: '2px solid #3b82f6', marginBottom: '20px', paddingBottom: '10px', position: 'relative' };
const logoutStyle = { position: 'absolute', top: 10, right: 0, padding: '5px 10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' };
const flexStyle = { display: 'flex', gap: '20px' };
const sectionStyle = { flex: 2, background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const formSection = { flex: 1, background: 'white', padding: '20px', borderRadius: '10px', height: 'fit-content' };
const projectCard = { background: '#f3f4f6', padding: '15px', borderRadius: '8px', marginBottom: '10px' };
const inputStyle = { width: '100%', marginBottom: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' };
const buttonStyle = { width: '100%', background: '#3b82f6', color: 'white', padding: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' };

export default Dashboard;
