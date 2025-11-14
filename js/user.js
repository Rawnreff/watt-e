class UserManager {
    constructor() {
        this.api = apiClient;
        this.currentUser = null;
        this.initEventListeners();
        this.loadUserProfile();
    }

    initEventListeners() {
        // Profile update form
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
        }

        // Password change form
        const passwordForm = document.getElementById('passwordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => this.handlePasswordChange(e));
        }
    }

    async loadUserProfile() {
        try {
            const result = await this.api.getCurrentUser();
            this.currentUser = result.user;
            this.displayUserProfile(this.currentUser);
        } catch (error) {
            console.error('Failed to load user profile:', error);
            this.showNotification('Gagal memuat profil pengguna', 'error');
        }
    }

    displayUserProfile(user) {
        // Update profile form
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const golonganSelect = document.getElementById('golongan_pln');

        if (nameInput) nameInput.value = user.name || '';
        if (emailInput) emailInput.value = user.email || '';
        if (golonganSelect) golonganSelect.value = user.golongan_pln || '';

        // Update profile display
        const userNameElement = document.getElementById('userName');
        const userEmailElement = document.getElementById('userEmail');
        const userGolonganElement = document.getElementById('userGolongan');

        if (userNameElement) userNameElement.textContent = user.name;
        if (userEmailElement) userEmailElement.textContent = user.email;
        if (userGolonganElement) userGolonganElement.textContent = user.golongan_pln;

        // Format join date
        const joinDateElement = document.getElementById('joinDate');
        const userJoinDateElement = document.getElementById('userJoinDate');
        
        if (user.created_at) {
            const joinDate = new Date(user.created_at);
            const formattedDate = joinDate.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
            
            if (joinDateElement) joinDateElement.value = formattedDate;
            if (userJoinDateElement) userJoinDateElement.textContent = formattedDate;
        }
    }

    async handleProfileUpdate(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const updateData = {
            name: formData.get('name'),
            golongan_pln: formData.get('golongan_pln')
        };

        try {
            const updateBtn = e.target.querySelector('button[type="submit"]');
            const originalText = updateBtn.textContent;
            updateBtn.textContent = 'Menyimpan...';
            updateBtn.disabled = true;

            await this.api.updateUser(updateData);
            this.showNotification('Profil berhasil diperbarui', 'success');
            
            // Reload user data
            this.loadUserProfile();

        } catch (error) {
            this.showNotification(error.message, 'error');
        } finally {
            const updateBtn = e.target.querySelector('button[type="submit"]');
            if (updateBtn) {
                updateBtn.textContent = 'Simpan Perubahan';
                updateBtn.disabled = false;
            }
        }
    }

    async handlePasswordChange(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const passwordData = {
            current_password: formData.get('current_password'),
            new_password: formData.get('new_password')
        };

        // Validation
        if (passwordData.new_password.length < 6) {
            this.showNotification('Password baru minimal 6 karakter', 'error');
            return;
        }

        try {
            const changeBtn = e.target.querySelector('button[type="submit"]');
            const originalText = changeBtn.textContent;
            changeBtn.textContent = 'Mengubah...';
            changeBtn.disabled = true;

            await this.api.changePassword(passwordData);
            this.showNotification('Password berhasil diubah', 'success');
            e.target.reset();

        } catch (error) {
            this.showNotification(error.message, 'error');
        } finally {
            const changeBtn = e.target.querySelector('button[type="submit"]');
            if (changeBtn) {
                changeBtn.textContent = 'Ubah Password';
                changeBtn.disabled = false;
            }
        }
    }

    showNotification(message, type = 'info') {
        if (window.authManager) {
            window.authManager.showNotification(message, type);
        }
    }
}

// Initialize user manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new UserManager();
});