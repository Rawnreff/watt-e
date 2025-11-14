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
            
            // Update form with user's golongan_pln (robust matching)
            const golonganSelect = document.getElementById('golongan_pln');
            if (golonganSelect && this.currentUser.golongan_pln) {
                const userGol = String(this.currentUser.golongan_pln);
                // try direct match first
                let matched = Array.from(golonganSelect.options).find(o => o.value === userGol);
                if (!matched) {
                    // try to match by visible text (e.g., option contains the code or tariff name)
                    matched = Array.from(golonganSelect.options).find(o => (o.textContent || '').includes(userGol));
                }
                if (matched) golonganSelect.value = matched.value;
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
        // Prefer the form's selected golongan_pln, fallback to currentUser value
        const selectedGolongan = formData.get('golongan_pln');
        const golonganToSend = selectedGolongan && selectedGolongan !== '' ? selectedGolongan : (this.currentUser?.golongan_pln || null);

        // Allow user to specify the month they want to predict (YYYY-MM) — fallback will be handled server-side
        const monthTarget = formData.get('month_target') || null;

        const predictionData = {
            kwh_last_month: parseFloat(formData.get('kwh_last_month')),
            golongan_pln: golonganToSend,
            month_target: monthTarget
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
        
        // Helper: parse numeric from various string formats (e.g. "1.444,70", "Rp 1.444,70", or plain numbers)
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

        // determine predicted kWh numeric
        const predictedKwh = parseNumericFromString(prediction.kwh_prediction);

        // determine tariff from select or currentUser (may be code or numeric); try to parse numeric
        const golSelect = document.getElementById('golongan_pln');
        let tariffVal = null;
        if (golSelect && golSelect.value) tariffVal = parseNumericFromString(golSelect.value);
        if ((!tariffVal || tariffVal === 0) && this.currentUser && this.currentUser.golongan_pln) {
            tariffVal = parseNumericFromString(this.currentUser.golongan_pln);
        }

        // If API returned price_prediction, try to parse it and compare. Otherwise compute client-side price.
        const apiPriceNum = parseNumericFromString(prediction.price_prediction);
        let finalPriceNum = apiPriceNum;
        // If tariff available, compute price and prefer it when api price is missing or differs significantly (>2%)
        if (tariffVal && tariffVal > 0 && predictedKwh > 0) {
            const computed = predictedKwh * tariffVal;
            if (!apiPriceNum || Math.abs((computed - apiPriceNum) / (apiPriceNum || computed)) > 0.02) {
                finalPriceNum = computed;
            }
        }

        const formattedPrice = finalPriceNum ? `Rp ${finalPriceNum.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : prediction.price_prediction || '-';

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
                    <div class="result-value">${formattedPrice}</div>
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

        historyElement.innerHTML = predictions.map((pred, idx) => {
            const dateStr = new Date(pred.created_at).toLocaleDateString('id-ID', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });

            const inputKwh = parseNumericFromString(pred.kwh_last_month) || 0;

            const prediction = pred.prediction || {};
            const predictedKwh = parseNumericFromString(prediction.kwh_prediction) || 0;

            // determine tariff: try stored pred.golongan_pln, then prediction.golongan_pln, then fallback to page select/current user
            let tariffVal = 0;
            if (pred.golongan_pln) tariffVal = parseNumericFromString(pred.golongan_pln);
            if ((!tariffVal || tariffVal === 0) && prediction.golongan_pln) tariffVal = parseNumericFromString(prediction.golongan_pln);
            const golSelect = document.getElementById('golongan_pln');
            if ((!tariffVal || tariffVal === 0) && golSelect && golSelect.value) tariffVal = parseNumericFromString(golSelect.value);
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

            // attach the prediction object to the element via a data attribute (encoded)
            const dataPrediction = encodeURIComponent(JSON.stringify(prediction || {}));

            const number = idx + 1;
                return `
                <div class="history-item" data-prediction='${dataPrediction}' data-created='${pred.created_at}'>
                    <div class="history-number">${number}</div>
                    <div class="history-content">
                        <div class="history-date">${dateStr}</div>
                        <div class="history-months">Bulan ini: <strong>${pred.month_current || '-'}</strong> &middot; Target: <strong>${pred.month_target || '-'}</strong></div>
                        <div class="history-kwh">Penggunaan bulan lalu: <strong>${inputKwh} kWh</strong></div>
                        <div class="history-prediction">Prediksi: <strong>${predictedKwh} kWh</strong> &middot; <span class="history-price">${formattedPrice}</span></div>
                    </div>
                </div>
            `;
        }).join('');

        // After rendering, make each history item clickable to show its prediction
        // Use a short timeout / microtask to ensure innerHTML was applied
        setTimeout(() => {
            const items = historyElement.querySelectorAll('.history-item');
            items.forEach(item => {
                item.style.cursor = 'pointer';
                item.addEventListener('click', (ev) => {
                    // highlight selected
                    historyElement.querySelectorAll('.history-item.selected').forEach(s => s.classList.remove('selected'));
                    item.classList.add('selected');

                    const dp = item.getAttribute('data-prediction');
                    if (!dp) return;
                    try {
                        const parsed = JSON.parse(decodeURIComponent(dp));
                        // If there's no prediction object (empty), build a minimal one from displayed values
                        const predictionObj = (parsed && Object.keys(parsed).length > 0) ? parsed : {
                            kwh_prediction: item.querySelector('.history-prediction strong') ? item.querySelector('.history-prediction strong').textContent.trim().split(' ')[0] : null,
                            price_prediction: item.querySelector('.history-price') ? item.querySelector('.history-price').textContent.trim() : null,
                            tips: [] ,
                            confidence_level: 'Medium'
                        };

                        // display the prediction in the main result area
                        this.displayPredictionResult(predictionObj);
                    } catch (err) {
                        console.error('Failed to parse prediction from history item', err);
                    }
                });
            });

            // If a prediction was selected from the dashboard, auto-apply it here
            try {
                const storedRaw = localStorage.getItem('selectedPrediction');
                if (storedRaw) {
                    const stored = JSON.parse(storedRaw);
                    const targetCreated = stored?.created_at || stored?.createdAt || null;
                    if (targetCreated) {
                        const match = Array.from(items).find(it => it.getAttribute('data-created') === targetCreated);
                        if (match) {
                            // simulate click to display and highlight
                            match.click();
                            localStorage.removeItem('selectedPrediction');
                        } else {
                            // fallback: if stored contains a prediction object, display it directly
                            const candidatePrediction = stored.prediction || stored;
                            if (candidatePrediction) {
                                this.displayPredictionResult(candidatePrediction);
                                localStorage.removeItem('selectedPrediction');
                            }
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to auto-apply selectedPrediction from localStorage', err);
            }
        }, 0);
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