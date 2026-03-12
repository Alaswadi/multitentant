import axios from 'axios';

// WHY: Creating a specialized axios instance for tenant-aware requests.
const getClient = (tenantSlug) => {
    const token = localStorage.getItem('token');

    return axios.create({
        baseURL: import.meta.env.VITE_API_URL,
        headers: {
            // WHY: X-Tenant-Slug header is our reliable tenant identifier for Docker local dev.
            'X-Tenant-Slug': tenantSlug || localStorage.getItem('tenantSlug'),
            'Authorization': token ? `Bearer ${token}` : ''
        }
    });
};

export default getClient;
export const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tenantSlug');
}
