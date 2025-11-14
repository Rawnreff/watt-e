// contact.js - Contact Page Functionality

// FAQ Toggle Functionality
document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
        const item = question.parentElement;
        const isActive = item.classList.contains('active');
        
        // Close all FAQ items
        document.querySelectorAll('.faq-item').forEach(faqItem => {
            faqItem.classList.remove('active');
        });
        
        // Open clicked item if it wasn't active
        if (!isActive) {
            item.classList.add('active');
        }
    });
});

// Auto-resize Textarea
const textarea = document.getElementById('contactMessage');
if (textarea) {
    textarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 300) + 'px';
    });
}

// Auto-fill name and email for logged-in users
function populateContactFromUser() {
    try {
        const raw = localStorage.getItem('watt_e_user');
        let user = null;
        if (raw) {
            user = JSON.parse(raw);
        } else {
            // Only call API if we have an auth token — avoid triggering 401 when anonymous
            const token = localStorage.getItem('watt_e_token');
            if (token && typeof apiClient !== 'undefined' && apiClient.getCurrentUser) {
                apiClient.getCurrentUser()?.then(r => {
                    if (r && r.user) setContactFields(r.user);
                }).catch(() => {});
            }
        }

        if (user) {
            setContactFields(user);
        } else {
            // no logged-in user detected — prefill anonymous email but keep it editable
            const emailInput = document.getElementById('contactEmail');
            if (emailInput) {
                emailInput.value = 'anonymous@user.id';
                emailInput.readOnly = false;
                emailInput.removeAttribute('aria-readonly');
                emailInput.classList.remove('readonly');
            }
        }
    } catch (err) {
        console.error('Failed to populate contact from user', err);
    }
}

function setContactFields(user) {
    const nameInput = document.getElementById('contactName');
    const emailInput = document.getElementById('contactEmail');
    if (nameInput && user.name) {
        nameInput.value = user.name;
    }
    if (emailInput && user.email) {
        emailInput.value = user.email;
        // prevent editing email
        emailInput.readOnly = true;
        emailInput.setAttribute('aria-readonly', 'true');
        emailInput.classList.add('readonly');
    }
}

// Contact Form Submission
document.getElementById('contactForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const messageDiv = document.getElementById('messageDiv');
    const form = this;
    
    // Disable button and show loading state
    submitBtn.disabled = true;
    submitText.innerHTML = '<i class="ri-loader-4-line spin"></i> Mengirim...';
    messageDiv.style.display = 'none';
    
    try {
        // Get form data
        const formData = new FormData(form);
        const contactData = {
            name: formData.get('name'),
            email: formData.get('email'),
            subject: formData.get('subject'),
            message: formData.get('message')
        };
        
        // Call API if apiClient exists
        if (typeof apiClient !== 'undefined' && apiClient.sendContactMessage) {
            const result = await apiClient.sendContactMessage(contactData);
            
            // Show success message
            messageDiv.className = 'contact-message success';
            messageDiv.innerHTML = `
                <i class="ri-checkbox-circle-line"></i>
                <span>${result.message || 'Pesan berhasil dikirim! Kami akan menghubungi Anda dalam 1x24 jam.'}</span>
            `;
        } else {
            // Simulate API call for demo
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Show success message
            messageDiv.className = 'contact-message success';
            messageDiv.innerHTML = `
                <i class="ri-checkbox-circle-line"></i>
                <span>Pesan berhasil dikirim! Kami akan menghubungi Anda dalam 1x24 jam.</span>
            `;
        }
        
        messageDiv.style.display = 'flex';
        
        // Reset form but preserve auto-filled values (name/email) for logged-in users
        form.reset();
        // restore auto-filled fields if present
        try {
            const raw = localStorage.getItem('watt_e_user');
            if (raw) {
                const user = JSON.parse(raw);
                setContactFields(user);
            } else {
                // if no user in storage, restore anonymous email
                const emailInput = document.getElementById('contactEmail');
                if (emailInput) {
                    emailInput.value = 'anonymous@user.id';
                    emailInput.readOnly = false;
                    emailInput.removeAttribute('aria-readonly');
                    emailInput.classList.remove('readonly');
                }
            }
        } catch (err) {
            // ignore
        }
        
        // Reset textarea height
        if (textarea) {
            textarea.style.height = 'auto';
        }
        
        // Scroll to message
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
    } catch (error) {
        // Show error message
        messageDiv.className = 'contact-message error';
        messageDiv.innerHTML = `
            <i class="ri-error-warning-line"></i>
            <span>${error.message || 'Gagal mengirim pesan. Silakan coba lagi.'}</span>
        `;
        messageDiv.style.display = 'flex';
    } finally {
        // Re-enable button
        submitBtn.disabled = false;
        submitText.innerHTML = '<i class="ri-send-plane-line"></i> Kirim Pesan';
    }
});

// Input validation and styling
const inputs = document.querySelectorAll('.form-input, .form-textarea');
inputs.forEach(input => {
    // Add focus effect
    input.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
    });
    
    // Remove focus effect
    input.addEventListener('blur', function() {
        this.parentElement.classList.remove('focused');
        
        // Validate input
        if (this.value.trim() === '' && this.hasAttribute('required')) {
            this.classList.add('error');
        } else {
            this.classList.remove('error');
        }
    });
    
    // Remove error on input
    input.addEventListener('input', function() {
        this.classList.remove('error');
    });
});

// Email validation
const emailInput = document.getElementById('contactEmail');
if (emailInput) {
    emailInput.addEventListener('blur', function() {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (this.value && !emailRegex.test(this.value)) {
            this.classList.add('error');
        }
    });
}

// Smooth scroll for internal links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href !== '#' && document.querySelector(href)) {
            e.preventDefault();
            document.querySelector(href).scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Populate contact fields when page is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', populateContactFromUser);
} else {
    populateContactFromUser();
}