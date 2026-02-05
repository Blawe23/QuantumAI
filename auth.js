// Authentication module for QuantumAI

const AuthModule = {
    API_BASE_URL: 'https://quantumai-backend.onrender.com/',
    
    async register(phone, password, referralCode) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/api/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    phone,
                    password,
                    referral_code: referralCode
                })
            });
            
            return await response.json();
        } catch (error) {
            console.error('Registration error:', error);
            return {
                success: false,
                message: 'Network error. Please try again.'
            };
        }
    },
    
    async login(phone, password) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    phone,
                    password
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Store authentication data
                localStorage.setItem('quantumai_token', data.token);
                localStorage.setItem('quantumai_phone', phone);
                localStorage.setItem('quantumai_user', JSON.stringify(data.user));
                
                // Set session expiry (7 days)
                const expiry = new Date();
                expiry.setDate(expiry.getDate() + 7);
                localStorage.setItem('quantumai_expiry', expiry.toISOString());
            }
            
            return data;
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: 'Network error. Please try again.'
            };
        }
    },
    
    async logout() {
        try {
            const token = this.getToken();
            
            if (token) {
                await fetch(`${this.API_BASE_URL}/api/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearSession();
        }
    },
    
    async getUserData() {
        try {
            const token = this.getToken();
            
            if (!token) {
                return null;
            }
            
            const response = await fetch(`${this.API_BASE_URL}/api/user-data`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.status === 401) {
                this.clearSession();
                return null;
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get user data error:', error);
            return null;
        }
    },
    
    async changePassword(oldPassword, newPassword) {
        try {
            const token = this.getToken();
            
            if (!token) {
                return {
                    success: false,
                    message: 'Not authenticated'
                };
            }
            
            const response = await fetch(`${this.API_BASE_URL}/api/change-password`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    old_password: oldPassword,
                    new_password: newPassword
                })
            });
            
            return await response.json();
        } catch (error) {
            console.error('Change password error:', error);
            return {
                success: false,
                message: 'Network error. Please try again.'
            };
        }
    },
    
    async requestPasswordReset(phone) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/api/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phone })
            });
            
            return await response.json();
        } catch (error) {
            console.error('Password reset error:', error);
            return {
                success: false,
                message: 'Network error. Please try again.'
            };
        }
    },
    
    getToken() {
        return localStorage.getItem('quantumai_token');
    },
    
    getPhone() {
        return localStorage.getItem('quantumai_phone');
    },
    
    getUser() {
        const userStr = localStorage.getItem('quantumai_user');
        return userStr ? JSON.parse(userStr) : null;
    },
    
    isAuthenticated() {
        const token = this.getToken();
        const expiry = localStorage.getItem('quantumai_expiry');
        
        if (!token || !expiry) {
            return false;
        }
        
        // Check if session is expired
        const now = new Date();
        const expiryDate = new Date(expiry);
        
        if (now > expiryDate) {
            this.clearSession();
            return false;
        }
        
        return true;
    },
    
    clearSession() {
        localStorage.removeItem('quantumai_token');
        localStorage.removeItem('quantumai_phone');
        localStorage.removeItem('quantumai_user');
        localStorage.removeItem('quantumai_expiry');
    },
    
    validateSession() {
        if (!this.isAuthenticated()) {
            this.redirectToLogin();
            return false;
        }
        return true;
    },
    
    redirectToLogin() {
        if (!window.location.href.includes('login.html') && 
            !window.location.href.includes('register.html') &&
            !window.location.href.includes('index.html')) {
            window.location.href = 'login.html';
        }
    },
    
    // Check session on page load
    init() {
        if (!this.isAuthenticated() && 
            (window.location.href.includes('dashboard.html') || 
             window.location.href.includes('profile.html'))) {
            this.redirectToLogin();
        }
        
        // Auto-logout after 7 days
        this.checkSessionExpiry();
    },
    
    checkSessionExpiry() {
        const expiry = localStorage.getItem('quantumai_expiry');
        
        if (expiry) {
            const now = new Date();
            const expiryDate = new Date(expiry);
            
            if (now > expiryDate) {
                this.clearSession();
                
                if (window.location.href.includes('dashboard.html')) {
                    alert('Your session has expired. Please login again.');
                    this.redirectToLogin();
                }
            }
        }
    },
    
    // WhatsApp integration for password reset
    initiatePasswordReset() {
        const phone = this.getPhone();
        const message = encodeURIComponent("Hi QuantumAI Support, I need password reset.");
        window.open(`https://wa.me/237672815642?text=${message}`, '_blank');
    },
    
    // Format phone number for display
    formatPhone(phone) {
        if (!phone) return '';
        // Remove country code if present
        phone = phone.replace(/^\+237/, '');
        // Format as 6XX XXX XXX
        return phone.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
    }
};

// Initialize auth module on page load
document.addEventListener('DOMContentLoaded', () => {
    AuthModule.init();
});

// Export for use in other files

window.AuthModule = AuthModule;
