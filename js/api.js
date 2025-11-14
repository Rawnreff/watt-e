const API_BASE_URL = 'http://localhost:5000';

class ApiClient {
    constructor() {
        this.token = localStorage.getItem('watt_e_token');
    }

    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                // If unauthorized, clear token
                if (response.status === 401) {
                    this.removeToken();
                    localStorage.removeItem('watt_e_user');
                    window.location.href = 'login.html';
                }
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('watt_e_token', token);
    }

    removeToken() {
        this.token = null;
        localStorage.removeItem('watt_e_token');
    }

    // Auth endpoints
    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    }

    async login(credentials) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
    }

    // User endpoints
    async getCurrentUser() {
        return this.request('/user/me');
    }

    async updateUser(userData) {
        return this.request('/user/update', {
            method: 'PATCH',
            body: JSON.stringify(userData),
        });
    }

    async changePassword(passwordData) {
        return this.request('/user/change-password', {
            method: 'PATCH',
            body: JSON.stringify(passwordData),
        });
    }

    // Prediction endpoints
    async predictConsumption(predictionData) {
        // CRITICAL FIX: Ensure kwh_last_month is sent as a number, not string
        const sanitizedData = {
            kwh_last_month: Number(predictionData.kwh_last_month)
        };

        // Include golongan_pln if provided (may be code or numeric tarif)
        if (predictionData.golongan_pln !== undefined) {
            sanitizedData.golongan_pln = predictionData.golongan_pln;
        }

        // Include month_target if provided (format YYYY-MM)
        if (predictionData.month_target !== undefined && predictionData.month_target !== null) {
            sanitizedData.month_target = String(predictionData.month_target);
        }

        // Validate the number
        if (isNaN(sanitizedData.kwh_last_month) || sanitizedData.kwh_last_month <= 0) {
            throw new Error('Nilai kWh tidak valid. Harap masukkan angka yang benar.');
        }

        console.log('Sending prediction data:', sanitizedData);

        return this.request('/predict/ai', {
            method: 'POST',
            body: JSON.stringify(sanitizedData),
        });
    }

    async getPredictionHistory() {
        return this.request('/predict/history/me');
    }

    // Contact endpoints
    async sendContactMessage(messageData) {
        return this.request('/contact/send', {
            method: 'POST',
            body: JSON.stringify(messageData),
        });
    }
}

const apiClient = new ApiClient();