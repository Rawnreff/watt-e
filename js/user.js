class UserManager {
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
            this.setupEventListeners();
            this.updateAllProfileElements();
        } catch (error) {
            console.error('User manager initialization failed:', error);
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                window.location.href = 'login.html';
            }
        }
    }

    setupEventListeners() {
        // Profile form
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
        }

        // Password form
        const passwordForm = document.getElementById('passwordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => this.handlePasswordChange(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtnProfile');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    async loadUserData() {
        try {
            const result = await this.api.getCurrentUser();
            this.currentUser = result.user;
            this.populateUserForm();
        } catch (error) {
            console.error('Failed to load user data:', error);
            throw error;
        }
    }

    async loadPredictions() {
        try {
            const result = await this.api.getPredictionHistory();
            this.predictions = result.predictions || [];
        } catch (error) {
            console.error('Failed to load predictions:', error);
            this.predictions = [];
        }
    }

    populateUserForm() {
        if (!this.currentUser) return;

        // Profile form fields
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const golonganSelect = document.getElementById('golongan_pln');
        const joinDateInput = document.getElementById('joinDate');

        if (nameInput) nameInput.value = this.currentUser.name || '';
        if (emailInput) emailInput.value = this.currentUser.email || '';
        if (golonganSelect && this.currentUser.golongan_pln) {
            golonganSelect.value = this.currentUser.golongan_pln;
        }
        if (joinDateInput && this.currentUser.created_at) {
            const joinDate = new Date(this.currentUser.created_at);
            joinDateInput.value = joinDate.toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    }

    updateAllProfileElements() {
        if (!this.currentUser) return;

        const firstName = this.currentUser.name.split(' ')[0];
        const joinDate = this.currentUser.created_at 
            ? new Date(this.currentUser.created_at).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
            : '-';

        // Update profile header
        this.updateElement('profileHeaderName', this.currentUser.name);
        this.updateElement('profileHeaderEmail', this.currentUser.email);
        this.updateElement('profileHeaderGolongan', this.currentUser.golongan_pln || 'Belum diset');

        // Update stats
        this.updateElement('statsUserPredictions', this.predictions.length.toString());
        this.updateElement('statsJoinDate', joinDate);

        // Update sidebar user summary
        this.updateElement('userName', this.currentUser.name);
        this.updateElement('userEmail', this.currentUser.email);
        this.updateElement('userGolongan', this.currentUser.golongan_pln || 'Belum diset');
        this.updateElement('totalUserPredictions', this.predictions.length.toString());
        this.updateElement('userJoinDate', joinDate);
    }

    async handleProfileUpdate(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const updateData = {
            name: formData.get('name'),
            golongan_pln: formData.get('golongan_pln')
        };

        // Validate
        if (!updateData.name || updateData.name.trim().length < 3) {
            this.showNotification('Nama harus minimal 3 karakter', 'error');
            return;
        }

        if (!updateData.golongan_pln) {
            this.showNotification('Silakan pilih golongan tarif PLN', 'error');
            return;
        }

        try {
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="ri-loader-4-line"></i> Menyimpan...';
            submitBtn.disabled = true;

            const result = await this.api.updateUser(updateData);
            
            // Update current user data
            this.currentUser = result.user;
            
            // Update localStorage
            localStorage.setItem('watt_e_user', JSON.stringify(result.user));
            
            // Update all elements
            this.updateAllProfileElements();
            
            this.showNotification('Profil berhasil diperbarui!', 'success');

            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;

        } catch (error) {
            console.error('Profile update failed:', error);
            this.showNotification(error.message || 'Gagal memperbarui profil', 'error');
            
            const submitBtn = e.target.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="ri-save-line"></i> Simpan Perubahan';
            submitBtn.disabled = false;
        }
    }

    async handlePasswordChange(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const passwordData = {
            current_password: formData.get('current_password'),
            new_password: formData.get('new_password')
        };
        const confirmPassword = formData.get('confirm_password');

        // Validate
        if (passwordData.new_password !== confirmPassword) {
            this.showNotification('Konfirmasi password tidak sesuai!', 'error');
            return;
        }

        if (passwordData.new_password.length < 6) {
            this.showNotification('Password baru harus minimal 6 karakter', 'error');
            return;
        }

        if (passwordData.new_password === passwordData.current_password) {
            this.showNotification('Password baru harus berbeda dari password lama', 'error');
            return;
        }

        try {
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="ri-loader-4-line"></i> Mengubah...';
            submitBtn.disabled = true;

            await this.api.changePassword(passwordData);
            
            this.showNotification('Password berhasil diubah!', 'success');
            
            // Reset form
            e.target.reset();

            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;

        } catch (error) {
            console.error('Password change failed:', error);
            this.showNotification(error.message || 'Gagal mengubah password', 'error');
            
            const submitBtn = e.target.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="ri-shield-keyhole-line"></i> Ubah Password';
            submitBtn.disabled = false;
        }
    }

    handleLogout() {
        if (confirm('Apakah Anda yakin ingin logout?')) {
            // Clear all auth data
            this.api.removeToken();
            localStorage.removeItem('watt_e_user');
            
            this.showNotification('Logout berhasil!', 'success');
            
            // Redirect to login
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
        }
    }

    updateElement(id, value) {
        const el = document.getElementById(id);
        if (el) {
            if (el.tagName === 'INPUT' || el.tagName === 'SELECT') {
                el.value = value;
            } else {
                el.textContent = value;
            }
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const iconMap = {
            success: 'ri-checkbox-circle-line',
            error: 'ri-error-warning-line',
            warning: 'ri-alert-line',
            info: 'ri-information-line'
        };
        
        notification.innerHTML = `
            <i class="${iconMap[type] || iconMap.info}"></i>
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

// Add notification styles if not already added
if (!document.querySelector('#user-notification-styles')) {
    const style = document.createElement('style');
    style.id = 'user-notification-styles';
    style.textContent = `
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        .ri-loader-4-line {
            animation: spin 1s linear infinite;
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
            max-width: 400px;
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

        .notification-warning {
            border-left: 4px solid #f59e0b;
        }

        .notification-warning i {
            color: #f59e0b;
            font-size: 1.5rem;
        }

        .notification-info {
            border-left: 4px solid #3b82f6;
        }

        .notification-info i {
            color: #3b82f6;
            font-size: 1.5rem;
        }

        .notification span {
            flex: 1;
            color: var(--text-dark);
            font-size: 0.95rem;
        }

        @media (max-width: 480px) {
            .notification {
                right: 10px;
                left: 10px;
                max-width: none;
            }
        }
    `;
    document.head.appendChild(style);
}

// Initialize user manager
let userManager;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        userManager = new UserManager();
    });
} else {
    userManager = new UserManager();
}