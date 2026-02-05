// Global configuration
const CONFIG = {
    API_BASE_URL: 'https://quantumai-backend.onrender.com',
    CURRENCY: 'XAF',
    MIN_DEPOSIT: 10000,
    MIN_WITHDRAWAL: 20000,
    WITHDRAWAL_FEE: 0.05,
    TRADING_START: new Date('2026-02-07T08:00:00+01:00'),
    ADMIN_PHONE: '672815642',
    WHATSAPP_NUMBER: '237672815642'
};

// Utility functions
const Utils = {
    formatCurrency(amount) {
        return `${parseFloat(amount).toLocaleString()} ${CONFIG.CURRENCY}`;
    },
    
    generateTradeId() {
        return 'TR' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
    },
    
    calculateProfit(balance) {
        const minProfit = 0.005; // 0.5%
        const maxProfit = 0.035; // 3.5%
        const profitPercentage = minProfit + (Math.random() * (maxProfit - minProfit));
        return Math.round(balance * profitPercentage);
    },
    
    getRandomPair() {
        const pairs = ['BTC/USD', 'EUR/USD', 'GOLD'];
        return pairs[Math.floor(Math.random() * pairs.length)];
    },
    
    getRandomEntryPrice() {
        const bases = {
            'BTC/USD': 60000,
            'EUR/USD': 1.08,
            'GOLD': 2300
        };
        const pair = this.getRandomPair();
        const base = bases[pair];
        const variation = base * 0.02 * (Math.random() - 0.5); // ±2%
        return Math.round((base + variation) * 100) / 100;
    },
    
    isTradingTime() {
        const now = new Date();
        const hour = now.getHours();
        // Slower at night (10PM to 6AM)
        return hour >= 6 && hour < 22;
    },
    
    generateWhatsAppLink(message) {
        const encoded = encodeURIComponent(message);
        return `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encoded}`;
    }
};

// Auth functions
const Auth = {
    isAuthenticated() {
        return !!localStorage.getItem('quantumai_token');
    },
    
    getToken() {
        return localStorage.getItem('quantumai_token');
    },
    
    getPhone() {
        return localStorage.getItem('quantumai_phone');
    },
    
    async validateSession() {
        if (!this.isAuthenticated()) return false;
        
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/validate`, {
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                }
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    },
    
    redirectToLogin() {
        if (!this.isAuthenticated() && !window.location.href.includes('login.html') && !window.location.href.includes('register.html')) {
            window.location.href = 'login.html';
        }
    }
};

// Trading functions
const Trading = {
    async startTrade() {
        if (!Auth.isAuthenticated()) {
            alert('Please login first');
            return;
        }
        
        if (new Date() < CONFIG.TRADING_START) {
            alert(`Trading starts on ${CONFIG.TRADING_START.toLocaleDateString()} at 8:00 AM WAT`);
            return;
        }
        
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/start-trade`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${Auth.getToken()}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showTradeStarted(data.trade);
            } else {
                alert(data.message || 'Failed to start trade');
            }
        } catch (error) {
            console.error('Trade error:', error);
            alert('Server error. Please try again.');
        }
    },
    
    showTradeStarted(trade) {
        // Show trade started notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50';
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-robot text-2xl mr-3"></i>
                <div>
                    <div class="font-bold">AI Trade Started!</div>
                    <div class="text-sm">${trade.pair} • Est. profit: +${trade.estimated_profit} XAF</div>
                </div>
            </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    },
    
    generateFakeTrade() {
        const pair = Utils.getRandomPair();
        const entry = Utils.getRandomEntryPrice();
        const profitPercent = 0.005 + (Math.random() * 0.03); // 0.5% to 3.5%
        const exit = entry * (1 + profitPercent);
        const profit = exit - entry;
        
        return {
            id: Utils.generateTradeId(),
            pair,
            entry: Utils.formatCurrency(entry),
            exit: Utils.formatCurrency(exit),
            profit: Utils.formatCurrency(profit),
            profitPercent: (profitPercent * 100).toFixed(2) + '%',
            timestamp: new Date().toISOString(),
            status: 'completed',
            result: 'win'
        };
    }
};

// Dashboard functions
const Dashboard = {
    updateBalances(userData) {
        const elements = {
            totalBalance: userData.total_balance,
            availableBalance: userData.available_balance,
            totalProfit: userData.total_profit,
            todayProfit: userData.today_profit || 0
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                this.animateNumber(element, value);
            }
        });
    },
    
    animateNumber(element, target) {
        const current = parseFloat(element.textContent.replace(/[^0-9.-]+/g, '')) || 0;
        const duration = 1000;
        const steps = 60;
        const increment = (target - current) / steps;
        let step = 0;
        
        const timer = setInterval(() => {
            step++;
            const value = current + (increment * step);
            
            if (step >= steps) {
                element.textContent = Utils.formatCurrency(target);
                clearInterval(timer);
            } else {
                element.textContent = Utils.formatCurrency(Math.round(value));
            }
        }, duration / steps);
    },
    
    updateTradeList(trades) {
        const container = document.getElementById('tradesList');
        if (!container) return;
        
        container.innerHTML = trades.map(trade => `
            <div class="trade-item p-3 bg-gray-800 rounded-lg mb-2 hover:bg-gray-700 transition">
                <div class="flex justify-between items-center">
                    <div>
                        <div class="font-bold">${trade.pair}</div>
                        <div class="text-sm text-gray-400">${new Date(trade.timestamp).toLocaleTimeString()}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-green-400 font-bold">+${trade.profit} XAF</div>
                        <div class="text-xs ${trade.result === 'win' ? 'text-green-400' : 'text-red-400'}">
                            ${trade.result === 'win' ? 'WIN' : 'LOSS'}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    },
    
    updateChart(data) {
        // Simple chart implementation
        const container = document.getElementById('chartContainer');
        if (!container) return;
        
        container.innerHTML = '';
        const maxValue = Math.max(...data);
        
        data.forEach((value, index) => {
            const bar = document.createElement('div');
            bar.className = 'flex flex-col items-center mx-1';
            bar.style.height = '200px';
            
            const barHeight = (value / maxValue) * 180;
            const barElement = document.createElement('div');
            barElement.className = 'w-6 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t';
            barElement.style.height = `${barHeight}px`;
            barElement.style.marginTop = `${180 - barHeight}px`;
            
            bar.appendChild(barElement);
            container.appendChild(bar);
        });
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication on protected pages
    if (window.location.pathname.includes('dashboard.html')) {
        Auth.redirectToLogin();
    }
    
    // Initialize tooltips
    initializeTooltips();
    
    // Update countdown if on dashboard
    if (document.getElementById('countdown')) {
        updateCountdown();
    }
    
    // Generate initial fake data
    generateInitialData();
});

function initializeTooltips() {
    // Add tooltips to elements with data-tooltip attribute
    document.querySelectorAll('[data-tooltip]').forEach(element => {
        element.addEventListener('mouseenter', (e) => {
            const tooltip = document.createElement('div');
            tooltip.className = 'absolute z-50 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg shadow-lg';
            tooltip.textContent = e.target.dataset.tooltip;
            
            const rect = e.target.getBoundingClientRect();
            tooltip.style.left = `${rect.left + rect.width / 2}px`;
            tooltip.style.top = `${rect.top - 40}px`;
            tooltip.style.transform = 'translateX(-50%)';
            
            document.body.appendChild(tooltip);
            e.target.tooltipElement = tooltip;
        });
        
        element.addEventListener('mouseleave', (e) => {
            if (e.target.tooltipElement) {
                e.target.tooltipElement.remove();
            }
        });
    });
}

function updateCountdown() {
    const targetDate = CONFIG.TRADING_START;
    const countdownElement = document.getElementById('countdown');
    
    if (!countdownElement) return;
    
    function update() {
        const now = new Date();
        const diff = targetDate - now;
        
        if (diff <= 0) {
            countdownElement.textContent = 'TRADING LIVE!';
            countdownElement.className = 'text-green-400 text-3xl font-bold';
            return;
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        countdownElement.textContent = 
            `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }
    
    update();
    setInterval(update, 1000);
}

function generateInitialData() {
    // Generate fake chart data
    const chartData = Array.from({ length: 20 }, () => 
        Math.random() * 100 + 50
    );
    
    Dashboard.updateChart(chartData);
    
    // Generate fake trades for dashboard
    if (document.getElementById('tradesList')) {
        const fakeTrades = Array.from({ length: 5 }, () => Trading.generateFakeTrade());
        Dashboard.updateTradeList(fakeTrades);
    }
}

// Export for use in HTML files
window.QuantumAI = {
    Auth,
    Trading,
    Dashboard,
    Utils,
    CONFIG

};
