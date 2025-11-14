class PredictionManager {
    constructor() {
        this.api = apiClient;
        this.currentUser = null;
        this.initEventListeners();
        this.loadUserData();
    }

    initEventListeners() {
        const predictForm = document.getElementById('predictForm');
        if (predictForm) {
            predictForm.addEventListener('submit', (e) => this.handlePrediction(e));
        }
    }

    async loadUserData() {
        try {
            const result = await this.api.getCurrentUser();
            this.currentUser = result.user;
            
            // Update form with user's golongan_pln
            const golonganSelect = document.getElementById('golongan_pln');
            if (golonganSelect && this.currentUser.golongan_pln) {
                golonganSelect.value = this.currentUser.golongan_pln;
            }

            // Load prediction history
            this.loadPredictionHistory();
        } catch (error) {
            console.error('Failed to load user data:', error);
        }
    }

    async handlePrediction(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const predictionData = {
            kwh_last_month: parseFloat(formData.get('kwh_last_month'))
        };

        try {
            const predictBtn = e.target.querySelector('button[type="submit"]');
            const originalText = predictBtn.textContent;
            predictBtn.textContent = 'Memprediksi...';
            predictBtn.disabled = true;

            const result = await this.api.predictConsumption(predictionData);
            this.displayPredictionResult(result.prediction);
            
            // Reload history to include new prediction
            this.loadPredictionHistory();

        } catch (error) {
            this.showNotification(error.message, 'error');
        } finally {
            const predictBtn = e.target.querySelector('button[type="submit"]');
            if (predictBtn) {
                predictBtn.textContent = 'Prediksi Sekarang';
                predictBtn.disabled = false;
            }
        }
    }

    displayPredictionResult(prediction) {
        const resultElement = document.getElementById('predictionResult');
        if (!resultElement) return;

        const confidenceClass = `confidence-${prediction.confidence_level.toLowerCase()}`;
        
        resultElement.innerHTML = `
            <div class="result-header">
                <h3 class="result-title">Hasil Prediksi</h3>
                <span class="confidence-badge ${confidenceClass}">
                    ${prediction.confidence_level}
                </span>
            </div>
            <div class="result-grid">
                <div class="result-item">
                    <div class="result-value">${prediction.kwh_prediction}</div>
                    <div class="result-label">Prediksi kWh</div>
                </div>
                <div class="result-item">
                    <div class="result-value">${prediction.price_prediction}</div>
                    <div class="result-label">Perkiraan Biaya</div>
                </div>
            </div>
            <div class="tips-section">
                <h4>Tips Penghematan:</h4>
                <ul class="tips-list">
                    ${prediction.tips.map(tip => `
                        <li class="tip-item">
                            <i class="ri-lightbulb-flash-line"></i>
                            ${tip}
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;

        // toggle show class (CSS handles animation/display)
        resultElement.classList.remove('show');
        // force reflow for animation restart
        // eslint-disable-next-line no-unused-expressions
        resultElement.offsetHeight;
        resultElement.classList.add('show');
        resultElement.scrollIntoView({ behavior: 'smooth' });
    }

    async loadPredictionHistory() {
        try {
            const result = await this.api.getPredictionHistory();
            this.displayPredictionHistory(result.predictions);
        } catch (error) {
            console.error('Failed to load prediction history:', error);
        }
    }

    displayPredictionHistory(predictions) {
        const historyElement = document.getElementById('predictionHistory');
        if (!historyElement) return;

        if (predictions.length === 0) {
            historyElement.innerHTML = `
                <div class="text-center">
                    <i class="ri-history-line" style="font-size: 3rem; color: #cbd5e0; margin-bottom: 1rem;"></i>
                    <p>Belum ada riwayat prediksi</p>
                </div>
            `;
            return;
        }

        historyElement.innerHTML = predictions.map(pred => `
            <div class="history-item">
                <div class="history-date">
                    ${new Date(pred.created_at).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </div>
                <div class="history-kwh">
                    Penggunaan bulan lalu: <strong>${pred.kwh_last_month} kWh</strong>
                </div>
                <div class="history-prediction">
                    Prediksi: ${pred.prediction.kwh_prediction} kWh 
                    (${pred.prediction.price_prediction})
                </div>
            </div>
        `).join('');
    }

    showNotification(message, type = 'info') {
        // Reuse the notification system from auth.js
        if (window.authManager) {
            window.authManager.showNotification(message, type);
        }
    }

    // Tambahkan di class PredictionManager
    async loadUserStats() {
        try {
            const result = await this.api.getPredictionHistory();
            const predictions = result.predictions;
            
            if (predictions.length > 0) {
                // Calculate average consumption
                const totalKwh = predictions.reduce((sum, pred) => sum + parseFloat(pred.kwh_last_month), 0);
                const avgKwh = totalKwh / predictions.length;
                
                document.getElementById('avgConsumption').textContent = avgKwh.toFixed(1);
                document.getElementById('totalPredictions').textContent = predictions.length;
                
                // Update user predictions in profile
                document.getElementById('totalUserPredictions').textContent = predictions.length;
            }
        } catch (error) {
            console.error('Failed to load user stats:', error);
        }
    }

    // Panggil di loadUserData
    async loadUserData() {
        try {
            const result = await this.api.getCurrentUser();
            this.currentUser = result.user;
            
            // Update form dengan golongan_pln user
            const golonganSelect = document.getElementById('golongan_pln');
            if (golonganSelect && this.currentUser.golongan_pln) {
                golonganSelect.value = this.currentUser.golongan_pln;
            }

            // Load prediction history dan stats
            await this.loadPredictionHistory();
            await this.loadUserStats();
            
        } catch (error) {
            console.error('Failed to load user data:', error);
        }
    }
}

// Initialize prediction manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PredictionManager();
});