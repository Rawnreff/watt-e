class DashboardManager {
    constructor() {
        this.api = apiClient;
        this.currentUser = null;
        this.predictions = [];
        this.initDashboard();
    }

    async initDashboard() {
        await this.loadUserData();
        await this.loadPredictions();
        this.updateDashboardStats();
        this.updateRecentPredictions();
        this.updateComparisonChart();
    }

    async loadUserData() {
        try {
            const result = await this.api.getCurrentUser();
            this.currentUser = result.user;
            this.updateUserGreeting();
            this.updateProfileSummary();
        } catch (error) {
            console.error('Failed to load user data:', error);
            this.showNotification('Gagal memuat data pengguna', 'error');
        }
    }

    async loadPredictions() {
        try {
            const result = await this.api.getPredictionHistory();
            this.predictions = result.predictions;
        } catch (error) {
            console.error('Failed to load predictions:', error);
        }
    }

    updateUserGreeting() {
        const greetingElement = document.getElementById('userGreeting');
        if (greetingElement && this.currentUser) {
            const name = this.currentUser.name.split(' ')[0]; // First name only
            greetingElement.textContent = name;
        }
    }

    updateProfileSummary() {
        if (!this.currentUser) return;

        // Update profile elements
        const elements = {
            'dashboardUserName': this.currentUser.name,
            'dashboardUserEmail': this.currentUser.email,
            'dashboardUserGolongan': this.currentUser.golongan_pln,
            'dashboardTariff': this.currentUser.golongan_pln
        };

        for (const [id, value] of Object.entries(elements)) {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        }

        // Format join date
        const joinDateElement = document.getElementById('dashboardJoinDate');
        if (joinDateElement && this.currentUser.created_at) {
            const joinDate = new Date(this.currentUser.created_at);
            const formattedDate = joinDate.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
            joinDateElement.textContent = formattedDate;
        }
    }

    updateDashboardStats() {
        // Update total predictions
        const totalPredictionsElement = document.getElementById('totalPredictions');
        if (totalPredictionsElement) {
            totalPredictionsElement.textContent = this.predictions.length;
        }

        // Calculate and update other stats
        if (this.predictions.length > 0) {
            this.updateUsageStats();
            this.updateEfficiencyScore();
        } else {
            this.setDefaultStats();
        }
    }

    updateUsageStats() {
        const latestPrediction = this.predictions[0];
        if (!latestPrediction) return;

        const kwh = latestPrediction.prediction.kwh_prediction;
        const cost = latestPrediction.prediction.price_prediction;

        // Update current usage
        const usageElement = document.getElementById('currentUsage');
        if (usageElement) {
            usageElement.textContent = `${kwh} kWh`;
        }

        // Update current cost
        const costElement = document.getElementById('currentCost');
        if (costElement) {
            costElement.textContent = cost;
        }

        // Calculate trend (simplified)
        this.calculateUsageTrend();
    }

    calculateUsageTrend() {
        if (this.predictions.length < 2) return;

        const currentKwh = parseFloat(this.predictions[0].prediction.kwh_prediction);
        const previousKwh = parseFloat(this.predictions[1].prediction.kwh_prediction);
        
        const trend = ((currentKwh - previousKwh) / previousKwh) * 100;
        
        const trendElement = document.getElementById('usageTrend');
        const costTrendElement = document.getElementById('costTrend');
        
        if (trendElement && costTrendElement) {
            const isPositive = trend > 0;
            const trendClass = isPositive ? 'negative' : 'positive';
            const trendIcon = isPositive ? 'ri-arrow-up-line' : 'ri-arrow-down-line';
            const trendText = isPositive ? `+${trend.toFixed(1)}%` : `${trend.toFixed(1)}%`;

            trendElement.className = `stat-trend ${trendClass}`;
            trendElement.innerHTML = `<i class="${trendIcon}"></i><span>${trendText}</span>`;

            costTrendElement.className = `stat-trend ${trendClass}`;
            costTrendElement.innerHTML = `<i class="${trendIcon}"></i><span>${trendText}</span>`;
        }
    }

    updateEfficiencyScore() {
        // Simplified efficiency score calculation
        const avgUsage = this.predictions.reduce((sum, pred) => {
            return sum + parseFloat(pred.prediction.kwh_prediction);
        }, 0) / this.predictions.length;

        let efficiencyScore = 85; // Base score
        if (avgUsage < 100) efficiencyScore = 95;
        else if (avgUsage > 200) efficiencyScore = 75;

        const scoreElement = document.getElementById('efficiencyScore');
        const trendElement = document.getElementById('efficiencyTrend');
        
        if (scoreElement) {
            scoreElement.textContent = `${efficiencyScore}/100`;
        }

        if (trendElement) {
            const trendClass = efficiencyScore >= 80 ? 'positive' : 'negative';
            const trendIcon = efficiencyScore >= 80 ? 'ri-arrow-up-line' : 'ri-arrow-down-line';
            const trendText = efficiencyScore >= 80 ? 'Baik' : 'Perlu perbaikan';

            trendElement.className = `stat-trend ${trendClass}`;
            trendElement.innerHTML = `<i class="${trendIcon}"></i><span>${trendText}</span>`;
        }
    }

    setDefaultStats() {
        const defaultValues = {
            'currentUsage': '0 kWh',
            'currentCost': 'Rp 0',
            'efficiencyScore': '-/100'
        };

        for (const [id, value] of Object.entries(defaultValues)) {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        }

        // Set trend to neutral
        const trendElements = ['usageTrend', 'costTrend', 'efficiencyTrend'];
        trendElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.className = 'stat-trend';
                element.innerHTML = '<i class="ri-line-chart-line"></i><span>Data belum tersedia</span>';
            }
        });
    }

    updateRecentPredictions() {
        const container = document.getElementById('recentPredictionsList');
        if (!container) return;

        if (this.predictions.length === 0) {
            container.innerHTML = `
                <div class="no-predictions">
                    <i class="ri-inbox-line"></i>
                    <p>Belum ada prediksi</p>
                    <small>Buat prediksi pertama Anda untuk melihat riwayat</small>
                </div>
            `;
            return;
        }

        const recentPredictions = this.predictions.slice(0, 5);
        container.innerHTML = recentPredictions.map(pred => `
            <div class="prediction-item">
                <div class="prediction-date">
                    ${new Date(pred.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                    })}
                </div>
                <div class="prediction-data">
                    <div class="prediction-kwh">
                        ${pred.prediction.kwh_prediction} kWh
                    </div>
                    <div class="prediction-cost">
                        ${pred.prediction.price_prediction}
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateComparisonChart() {
        if (this.predictions.length < 2) return;

        const usages = this.predictions.map(p => parseFloat(p.prediction.kwh_prediction));
        const avgUsage = usages.reduce((a, b) => a + b) / usages.length;
        const highestUsage = Math.max(...usages);
        const lowestUsage = Math.min(...usages);

        document.getElementById('avgMonthlyUsage').textContent = `${avgUsage.toFixed(1)} kWh`;
        document.getElementById('highestUsage').textContent = `${highestUsage} kWh`;
        document.getElementById('lowestUsage').textContent = `${lowestUsage} kWh`;
    }

    showNotification(message, type = 'info') {
        if (window.authManager) {
            window.authManager.showNotification(message, type);
        }
    }
}

// Global functions for button actions
async function quickPredict() {
    const kwhInput = document.getElementById('quickKwh');
    const kwh = kwhInput.value;

    if (!kwh || kwh < 1) {
        alert('Masukkan jumlah kWh yang valid');
        return;
    }

    try {
        const result = await apiClient.predictConsumption({ kwh_last_month: kwh });
        displayQuickResult(result.prediction);
    } catch (error) {
        alert('Gagal membuat prediksi: ' + error.message);
    }
}

function displayQuickResult(prediction) {
    const resultElement = document.getElementById('quickResult');
    if (!resultElement) return;

    resultElement.innerHTML = `
        <div class="result-header">
            <h4>Hasil Prediksi Cepat</h4>
            <span class="confidence-badge confidence-${prediction.confidence_level.toLowerCase()}">
                ${prediction.confidence_level}
            </span>
        </div>
        <div class="result-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1rem 0;">
            <div style="text-align: center;">
                <div style="font-size: 1.5rem; font-weight: bold; color: #1e90ff;">${prediction.kwh_prediction}</div>
                <div style="font-size: 0.9rem; color: #718096;">Prediksi kWh</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 1.5rem; font-weight: bold; color: #00cc66;">${prediction.price_prediction}</div>
                <div style="font-size: 0.9rem; color: #718096;">Perkiraan Biaya</div>
            </div>
        </div>
        <div style="margin-top: 1rem;">
            <strong>Tips:</strong>
            <ul style="margin: 0.5rem 0 0 1rem; color: #4a5568;">
                ${prediction.tips.map(tip => `<li>${tip}</li>`).join('')}
            </ul>
        </div>
    `;

    resultElement.classList.add('show');
}

async function refreshData() {
    const dashboard = window.dashboardManager;
    if (dashboard) {
        const refreshBtn = document.querySelector('button[onclick="refreshData()"]');
        const originalText = refreshBtn.innerHTML;
        
        refreshBtn.innerHTML = '<i class="ri-refresh-line"></i> Memuat...';
        refreshBtn.disabled = true;

        await dashboard.initDashboard();
        
        refreshBtn.innerHTML = originalText;
        refreshBtn.disabled = false;
        
        dashboard.showNotification('Data berhasil diperbarui', 'success');
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
});