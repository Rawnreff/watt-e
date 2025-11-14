class DashboardManager {
    constructor() {
        this.api = apiClient;
        this.currentUser = null;
        this.predictions = [];
        this.init();
    }

    async init() {
        try {
            await this.loadUserData();
            await this.loadPredictions();
            this.updateStats();
            this.setupEventListeners();
        } catch (error) {
            console.error('Dashboard initialization failed:', error);
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                window.location.href = 'login.html';
            }
        }
    }

    setupEventListeners() {
        // Quick predict button
        const quickPredictBtn = document.querySelector('[onclick="quickPredict()"]');
        if (quickPredictBtn) {
            quickPredictBtn.onclick = (e) => {
                e.preventDefault();
                this.handleQuickPredict();
            };
        }

        // Refresh button
        const refreshBtn = document.querySelector('[onclick="refreshData()"]');
        if (refreshBtn) {
            refreshBtn.onclick = (e) => {
                e.preventDefault();
                this.refreshData();
            };
        }
    }

    async loadUserData() {
        try {
            const result = await this.api.getCurrentUser();
            this.currentUser = result.user;
            this.updateUserDisplay();
        } catch (error) {
            console.error('Failed to load user data:', error);
            throw error;
        }
    }

    updateUserDisplay() {
        if (!this.currentUser) return;

        // Update greeting
        const userGreeting = document.getElementById('userGreeting');
        if (userGreeting) {
            const firstName = this.currentUser.name.split(' ')[0];
            userGreeting.textContent = firstName;
        }

        // Update profile summary
        const elements = {
            dashboardUserName: this.currentUser.name,
            dashboardUserEmail: this.currentUser.email,
            dashboardUserGolongan: this.currentUser.golongan_pln || 'Tidak diset',
            dashboardTariff: this.currentUser.golongan_pln || '-',
        };

        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        });

        // Update join date
        const joinDateEl = document.getElementById('dashboardJoinDate');
        if (joinDateEl && this.currentUser.created_at) {
            const joinDate = new Date(this.currentUser.created_at);
            joinDateEl.textContent = joinDate.toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'short'
            });
        }
    }

    async loadPredictions() {
        try {
            const result = await this.api.getPredictionHistory();
            this.predictions = result.predictions || [];
            this.displayRecentPredictions();
        } catch (error) {
            console.error('Failed to load predictions:', error);
            this.predictions = [];
        }
    }

    displayRecentPredictions() {
        const container = document.getElementById('recentPredictionsList');
        if (!container) return;

        if (this.predictions.length === 0) {
            container.innerHTML = `
                <div class="no-predictions">
                    <i class="ri-inbox-line"></i>
                    <p>Belum ada prediksi. Buat prediksi pertama Anda!</p>
                </div>
            `;
            return;
        }

        // Show only 5 most recent
        const recentPredictions = this.predictions.slice(0, 5);

        // helper to parse numeric values robustly
        const parseNumericFromString = (input) => {
            if (input === null || input === undefined) return 0;
            const s = String(input);
            let cleaned = s.replace(/[^0-9.,]/g, '');
            if (!cleaned) return 0;
            if (cleaned.indexOf('.') > -1 && cleaned.indexOf(',') > -1) {
                cleaned = cleaned.replace(/\./g, '').replace(',', '.');
            } else if (cleaned.indexOf(',') > -1) {
                cleaned = cleaned.replace(/,/g, '.');
            }
            cleaned = cleaned.replace(/,/g, '');
            const num = parseFloat(cleaned);
            return Number.isFinite(num) ? num : 0;
        };

        container.innerHTML = recentPredictions.map((pred, idx) => {
            const date = new Date(pred.created_at);
            const prediction = pred.prediction || {};

            const inputKwh = parseNumericFromString(pred.kwh_last_month) || 0;
            const predictedKwh = parseNumericFromString(prediction.kwh_prediction) || 0;

            // resolve tariff: try stored pred.golongan_pln, prediction.golongan_pln, then current user
            let tariffVal = 0;
            if (pred.golongan_pln) tariffVal = parseNumericFromString(pred.golongan_pln);
            if ((!tariffVal || tariffVal === 0) && prediction.golongan_pln) tariffVal = parseNumericFromString(prediction.golongan_pln);
            if ((!tariffVal || tariffVal === 0) && this.currentUser && this.currentUser.golongan_pln) tariffVal = parseNumericFromString(this.currentUser.golongan_pln);

            const apiPriceNum = parseNumericFromString(prediction.price_prediction) || 0;
            let finalPriceNum = apiPriceNum;
            if (tariffVal > 0 && predictedKwh > 0) {
                const computed = predictedKwh * tariffVal;
                if (!apiPriceNum || Math.abs((computed - apiPriceNum) / (apiPriceNum || computed)) > 0.02) {
                    finalPriceNum = computed;
                }
            }

            const formattedPrice = finalPriceNum ? `Rp ${finalPriceNum.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : (prediction.price_prediction || '-');

            const encodedFull = encodeURIComponent(JSON.stringify(pred));
            const number = idx + 1;
            return `
                <div class="prediction-item" data-full='${encodedFull}'>
                    <div class="prediction-number">${number}</div>
                    <div class="prediction-info">
                        <div class="prediction-date">
                            <i class="ri-calendar-line"></i>
                            ${date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div class="prediction-months">Bulan ini: <strong>${pred.month_current || '-'}</strong> &middot; Target: <strong>${pred.month_target || '-'}</strong></div>
                        <div class="prediction-details">
                            <span class="prediction-label">Input:</span>
                            <strong>${inputKwh} kWh</strong>
                        </div>
                    </div>
                    <div class="prediction-data">
                        <div class="prediction-kwh">
                            <i class="ri-flashlight-line"></i>
                            ${predictedKwh} kWh
                        </div>
                        <div class="prediction-cost">
                            <i class="ri-money-dollar-circle-line"></i>
                            ${formattedPrice}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // attach click handlers so clicking a recent prediction opens predict page with that prediction
        setTimeout(() => {
            const items = container.querySelectorAll('.prediction-item');
            items.forEach(item => {
                item.style.cursor = 'pointer';
                item.addEventListener('click', () => {
                    const data = item.getAttribute('data-full');
                    if (!data) return;
                    try {
                        const parsed = JSON.parse(decodeURIComponent(data));
                        // store full prediction object in localStorage and navigate
                        localStorage.setItem('selectedPrediction', JSON.stringify(parsed));
                        window.location.href = 'predict.html';
                    } catch (err) {
                        console.error('Failed to parse prediction data', err);
                    }
                });
            });
        }, 0);
    }

    updateStats() {
        if (this.predictions.length === 0) {
            this.setDefaultStats();
            return;
        }

        // Calculate statistics
        const totalPredictions = this.predictions.length;
        const latestPrediction = this.predictions[0];
        
        // Helper: parse numeric value from strings like "1.444,70 kWh" or numbers
        const parseNumericFromString = (input) => {
            if (input === null || input === undefined) return 0;
            const s = String(input);
            // keep digits, dots and commas
            let cleaned = s.replace(/[^0-9.,]/g, '');
            if (!cleaned) return 0;
            // If both '.' and ',' present assume '.' as thousand separator and ',' as decimal
            if (cleaned.indexOf('.') > -1 && cleaned.indexOf(',') > -1) {
                cleaned = cleaned.replace(/\./g, '').replace(',', '.');
            } else if (cleaned.indexOf(',') > -1) {
                // only comma present — treat as decimal separator
                cleaned = cleaned.replace(/,/g, '.');
            }
            // remove any remaining thousand separators (commas)
            cleaned = cleaned.replace(/,/g, '');
            const num = parseFloat(cleaned);
            return Number.isFinite(num) ? num : 0;
        };

        // Extract kWh values
        const kwhValues = this.predictions.map(p => parseNumericFromString(p.prediction?.kwh_prediction));

        const avgKwh = kwhValues.reduce((a, b) => a + b, 0) / kwhValues.length;
        const maxKwh = Math.max(...kwhValues);
        const minKwh = Math.min(...kwhValues);

        // Extract price value (robust to number or formatted string)
        const currentCostNum = parseNumericFromString(latestPrediction.prediction?.price_prediction);
        const currentCost = currentCostNum ? currentCostNum.toLocaleString('id-ID') : '0';

        // Update current usage (from latest prediction input)
        this.updateElement('currentUsage', `${latestPrediction.kwh_last_month} kWh`);
        this.updateElement('currentCost', `Rp ${currentCost}`);
        this.updateElement('totalPredictions', totalPredictions.toString());

        // Calculate efficiency score (example: based on comparison to average)
        const efficiencyScore = this.calculateEfficiencyScore(latestPrediction.kwh_last_month, avgKwh);
        this.updateElement('efficiencyScore', efficiencyScore);

        // Update trends
        this.updateTrends(latestPrediction.kwh_last_month, avgKwh);

        // Update chart stats
        this.updateElement('avgMonthlyUsage', `${avgKwh.toFixed(1)} kWh`);
        this.updateElement('highestUsage', `${maxKwh.toFixed(1)} kWh`);
        this.updateElement('lowestUsage', `${minKwh.toFixed(1)} kWh`);
    }

    calculateEfficiencyScore(current, average) {
        if (average === 0) return '100';
        
        const ratio = current / average;
        let score;
        
        if (ratio <= 0.8) score = 'A+';
        else if (ratio <= 0.9) score = 'A';
        else if (ratio <= 1.0) score = 'B+';
        else if (ratio <= 1.1) score = 'B';
        else if (ratio <= 1.2) score = 'C';
        else score = 'D';
        
        return score;
    }

    updateTrends(currentUsage, avgUsage) {
        const usageTrendEl = document.getElementById('usageTrend');
        const costTrendEl = document.getElementById('costTrend');
        const efficiencyTrendEl = document.getElementById('efficiencyTrend');

        if (this.predictions.length < 2) {
            if (usageTrendEl) {
                usageTrendEl.innerHTML = '<i class="ri-line-chart-line"></i><span>Data baru</span>';
                usageTrendEl.className = 'stat-trend';
            }
            if (costTrendEl) {
                costTrendEl.innerHTML = '<i class="ri-line-chart-line"></i><span>Data baru</span>';
                costTrendEl.className = 'stat-trend';
            }
            if (efficiencyTrendEl) {
                efficiencyTrendEl.innerHTML = '<i class="ri-trophy-line"></i><span>Pertahankan!</span>';
                efficiencyTrendEl.className = 'stat-trend positive';
            }
            return;
        }

        const difference = currentUsage - avgUsage;
        const percentChange = ((difference / avgUsage) * 100).toFixed(1);
        const isPositive = difference <= 0; // Negative usage change is positive

        if (usageTrendEl) {
            usageTrendEl.innerHTML = `
                <i class="ri-arrow-${isPositive ? 'down' : 'up'}-line"></i>
                <span>${Math.abs(percentChange)}% vs rata-rata</span>
            `;
            usageTrendEl.className = `stat-trend ${isPositive ? 'positive' : 'negative'}`;
        }

        if (costTrendEl) {
            costTrendEl.innerHTML = `
                <i class="ri-arrow-${isPositive ? 'down' : 'up'}-line"></i>
                <span>${Math.abs(percentChange)}% vs rata-rata</span>
            `;
            costTrendEl.className = `stat-trend ${isPositive ? 'positive' : 'negative'}`;
        }

        if (efficiencyTrendEl) {
            const message = isPositive ? 'Efisien!' : 'Perlu ditingkatkan';
            efficiencyTrendEl.innerHTML = `
                <i class="ri-${isPositive ? 'arrow-up' : 'arrow-down'}-line"></i>
                <span>${message}</span>
            `;
            efficiencyTrendEl.className = `stat-trend ${isPositive ? 'positive' : 'negative'}`;
        }
    }

    setDefaultStats() {
        this.updateElement('currentUsage', '0 kWh');
        this.updateElement('currentCost', 'Rp 0');
        this.updateElement('totalPredictions', '0');
        this.updateElement('efficiencyScore', '-');
        this.updateElement('avgMonthlyUsage', '0 kWh');
        this.updateElement('highestUsage', '0 kWh');
        this.updateElement('lowestUsage', '0 kWh');

        const trendEls = ['usageTrend', 'costTrend', 'efficiencyTrend'];
        trendEls.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.innerHTML = '<i class="ri-line-chart-line"></i><span>Belum ada data</span>';
                el.className = 'stat-trend';
            }
        });
    }

    async handleQuickPredict() {
        const input = document.getElementById('quickKwh');
        const resultDiv = document.getElementById('quickResult');
        
        if (!input || !resultDiv) return;

        const kwhValue = parseFloat(input.value);
        
        if (!kwhValue || kwhValue <= 0) {
            this.showQuickResult('error', 'Masukkan nilai kWh yang valid!');
            return;
        }

        try {
            // Show loading state
            this.showQuickResult('loading', 'Memprediksi...');

            // Make prediction - pastikan data dikirim sebagai number
            const golonganToSend = this.currentUser?.golongan_pln || null;
            // compute month_target as next month (YYYY-MM)
            const now = new Date();
            const nm = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            const monthTarget = `${nm.getFullYear()}-${String(nm.getMonth() + 1).padStart(2, '0')}`;

            const result = await this.api.predictConsumption({
                kwh_last_month: kwhValue, // Kirim sebagai number, bukan string
                golongan_pln: golonganToSend,
                month_target: monthTarget
            });

            const prediction = result.prediction;

            // helper to parse numeric from various formats
            const parseNumericFromString = (input) => {
                if (input === null || input === undefined) return 0;
                const s = String(input);
                let cleaned = s.replace(/[^0-9.,]/g, '');
                if (!cleaned) return 0;
                if (cleaned.indexOf('.') > -1 && cleaned.indexOf(',') > -1) {
                    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
                } else if (cleaned.indexOf(',') > -1) {
                    cleaned = cleaned.replace(/,/g, '.');
                }
                cleaned = cleaned.replace(/,/g, '');
                const num = parseFloat(cleaned);
                return Number.isFinite(num) ? num : 0;
            };

            const predictedKwh = parseNumericFromString(prediction.kwh_prediction);
            // get tariff numeric from current user if available
            let tariffVal = parseNumericFromString(this.currentUser?.golongan_pln);
            // also try reading from a select on page if present
            const golSelect = document.getElementById('golongan_pln');
            if (golSelect && golSelect.value) {
                const t = parseNumericFromString(golSelect.value);
                if (t) tariffVal = t;
            }

            const apiPriceNum = parseNumericFromString(prediction.price_prediction);
            let finalPriceNum = apiPriceNum;
            if (tariffVal && tariffVal > 0 && predictedKwh > 0) {
                const computed = predictedKwh * tariffVal;
                if (!apiPriceNum || Math.abs((computed - apiPriceNum) / (apiPriceNum || computed)) > 0.02) {
                    finalPriceNum = computed;
                }
            }

            const formattedPrice = finalPriceNum ? `Rp ${finalPriceNum.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : prediction.price_prediction || '-';

            // Show success result
            this.showQuickResult('success', `
                <div class="quick-result-header">
                    <i class="ri-checkbox-circle-line"></i>
                    <h4>Prediksi Berhasil!</h4>
                </div>
                <div class="quick-result-body">
                    <div class="result-row">
                        <span class="result-label">
                            <i class="ri-flashlight-line"></i>
                            Prediksi Penggunaan:
                        </span>
                        <strong>${prediction.kwh_prediction}</strong>
                    </div>
                    <div class="result-row">
                        <span class="result-label">
                            <i class="ri-money-dollar-circle-line"></i>
                            Perkiraan Biaya:
                        </span>
                        <strong>${formattedPrice}</strong>
                    </div>
                    <div class="confidence-badge ${prediction.confidence_level.toLowerCase()}">
                        Confidence: ${prediction.confidence_level}
                    </div>
                </div>
                <div class="quick-result-footer">
                    <a href="predict.html" class="btn-link">
                        <i class="ri-arrow-right-line"></i>
                        Lihat detail lengkap
                    </a>
                </div>
            `);

            // Clear input
            input.value = '';

            // Refresh predictions
            await this.loadPredictions();
            this.updateStats();

        } catch (error) {
            console.error('Quick prediction failed:', error);
            this.showQuickResult('error', `Gagal membuat prediksi: ${error.message}`);
        }
    }

    showQuickResult(type, content) {
        const resultDiv = document.getElementById('quickResult');
        if (!resultDiv) return;

        resultDiv.className = `quick-result ${type} show`;
        
        if (type === 'loading') {
            resultDiv.innerHTML = `
                <div class="loading-spinner">
                    <i class="ri-loader-4-line"></i>
                    <span>${content}</span>
                </div>
            `;
        } else if (type === 'error') {
            resultDiv.innerHTML = `
                <div class="error-message">
                    <i class="ri-error-warning-line"></i>
                    <span>${content}</span>
                </div>
            `;
        } else {
            resultDiv.innerHTML = content;
        }
    }

    async refreshData() {
        const btn = event.target;
        const icon = btn.querySelector('i');
        
        // Add spinning animation
        if (icon) {
            icon.style.animation = 'spin 1s linear infinite';
        }
        btn.disabled = true;

        try {
            await this.loadUserData();
            await this.loadPredictions();
            this.updateStats();
            
            this.showNotification('Data berhasil diperbarui!', 'success');
        } catch (error) {
            console.error('Failed to refresh data:', error);
            this.showNotification('Gagal memperbarui data', 'error');
        } finally {
            if (icon) {
                icon.style.animation = '';
            }
            btn.disabled = false;
        }
    }

    updateElement(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="ri-${type === 'success' ? 'checkbox-circle' : 'error-warning'}-line"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Add CSS for spinning animation
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    .notification {
        position: fixed;
        top: 100px;
        right: 20px;
        background: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 0.75rem;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        z-index: 10000;
    }

    .notification.show {
        transform: translateX(0);
    }

    .notification-success {
        border-left: 4px solid #10b981;
    }

    .notification-success i {
        color: #10b981;
        font-size: 1.5rem;
    }

    .notification-error {
        border-left: 4px solid #ef4444;
    }

    .notification-error i {
        color: #ef4444;
        font-size: 1.5rem;
    }
`;
document.head.appendChild(style);

// Initialize dashboard
let dashboardManager;
document.addEventListener('DOMContentLoaded', () => {
    dashboardManager = new DashboardManager();
});

// Make functions globally accessible for inline onclick handlers
window.quickPredict = () => dashboardManager?.handleQuickPredict();
window.refreshData = () => dashboardManager?.refreshData();