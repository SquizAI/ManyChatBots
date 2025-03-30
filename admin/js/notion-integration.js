/**
 * Notion Integration
 * Handles the Notion integration functionality in the admin panel
 */

class NotionIntegration {
    constructor() {
        // DOM elements
        this.apiKeyInput = document.getElementById('notion-api-key');
        this.databaseIdInput = document.getElementById('notion-database-id');
        this.testConnectionBtn = document.getElementById('test-notion-connection');
        this.saveSettingsBtn = document.getElementById('save-notion-settings');
        this.statusBadge = document.getElementById('notion-status');
        this.connectionResult = document.getElementById('notion-connection-result');
        this.togglePasswordBtn = document.querySelector('.toggle-password');
        
        // Configuration
        this.apiBaseUrl = '/api/notion';
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize the Notion integration
     */
    init() {
        // Load saved settings
        this.loadSavedSettings();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Check connection status
        this.checkConnectionStatus();
    }
    
    /**
     * Set up event listeners for the Notion integration UI
     */
    setupEventListeners() {
        // Test connection button
        if (this.testConnectionBtn) {
            this.testConnectionBtn.addEventListener('click', () => {
                this.testConnection();
            });
        }
        
        // Save settings button
        if (this.saveSettingsBtn) {
            this.saveSettingsBtn.addEventListener('click', () => {
                this.saveSettings();
            });
        }
        
        // Toggle password visibility
        if (this.togglePasswordBtn) {
            this.togglePasswordBtn.addEventListener('click', () => {
                const type = this.apiKeyInput.getAttribute('type') === 'password' ? 'text' : 'password';
                this.apiKeyInput.setAttribute('type', type);
                
                // Toggle eye icon
                const icon = this.togglePasswordBtn.querySelector('i');
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            });
        }
    }
    
    /**
     * Load saved Notion settings from localStorage
     */
    loadSavedSettings() {
        try {
            const savedSettings = localStorage.getItem('notionSettings');
            
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                
                // Fill form with saved values
                if (this.apiKeyInput && settings.apiKey) {
                    this.apiKeyInput.value = settings.apiKey;
                }
                
                if (this.databaseIdInput && settings.databaseId) {
                    this.databaseIdInput.value = settings.databaseId;
                }
                
                // Update status indicator
                if (settings.isConnected) {
                    this.updateConnectionStatus(true);
                }
            }
        } catch (error) {
            console.error('Error loading Notion settings:', error);
        }
    }
    
    /**
     * Save Notion settings to localStorage
     */
    saveSettings() {
        try {
            const apiKey = this.apiKeyInput.value.trim();
            const databaseId = this.databaseIdInput.value.trim();
            
            if (!apiKey) {
                this.showConnectionResult('Please enter a valid Notion API Key', false);
                return;
            }
            
            // Save to localStorage
            const settings = {
                apiKey,
                databaseId,
                isConnected: false,
                lastUpdated: new Date().toISOString()
            };
            
            localStorage.setItem('notionSettings', JSON.stringify(settings));
            
            // Test the connection after saving
            this.testConnection();
            
        } catch (error) {
            console.error('Error saving Notion settings:', error);
            this.showConnectionResult('Failed to save settings: ' + error.message, false);
        }
    }
    
    /**
     * Test the Notion API connection
     */
    async testConnection() {
        try {
            this.showConnectionResult('Testing connection...', null);
            
            const apiKey = this.apiKeyInput.value.trim();
            const databaseId = this.databaseIdInput.value.trim();
            
            if (!apiKey) {
                this.showConnectionResult('Please enter a valid Notion API Key', false);
                return;
            }
            
            // In a real implementation, this would call the backend to test the connection
            // For demo purposes, we'll simulate a successful connection
            const isDemo = window.location.search.includes('demo=true');
            
            if (isDemo) {
                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                const isSuccess = true;
                const message = 'Connection successful! Your Notion workspace is now connected.';
                
                this.showConnectionResult(message, isSuccess);
                this.updateConnectionStatus(isSuccess);
                
                // Update saved settings with connection status
                const settings = JSON.parse(localStorage.getItem('notionSettings') || '{}');
                settings.isConnected = isSuccess;
                localStorage.setItem('notionSettings', JSON.stringify(settings));
                
                return;
            }
            
            // For non-demo mode, call the actual API
            const response = await fetch(`${this.apiBaseUrl}/validate`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showConnectionResult(
                    data.isConfigured 
                        ? 'Connection successful! Your Notion workspace is now connected.' 
                        : 'Notion API is not configured on the server. Please check your .env file.',
                    data.isConfigured
                );
                this.updateConnectionStatus(data.isConfigured);
                
                // Update saved settings
                const settings = JSON.parse(localStorage.getItem('notionSettings') || '{}');
                settings.isConnected = data.isConfigured;
                localStorage.setItem('notionSettings', JSON.stringify(settings));
            } else {
                this.showConnectionResult('Connection failed: ' + (data.error || 'Unknown error'), false);
                this.updateConnectionStatus(false);
            }
            
        } catch (error) {
            console.error('Error testing Notion connection:', error);
            this.showConnectionResult('Connection failed: ' + error.message, false);
            this.updateConnectionStatus(false);
        }
    }
    
    /**
     * Check connection status with the server
     */
    async checkConnectionStatus() {
        try {
            // Get saved settings
            const savedSettings = localStorage.getItem('notionSettings');
            
            if (!savedSettings) {
                // No settings saved yet
                return;
            }
            
            const settings = JSON.parse(savedSettings);
            
            // For demo mode, use the saved connection status
            const isDemo = window.location.search.includes('demo=true');
            
            if (isDemo) {
                this.updateConnectionStatus(settings.isConnected || false);
                return;
            }
            
            // For non-demo mode, check with the server
            const response = await fetch(`${this.apiBaseUrl}/validate`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.updateConnectionStatus(data.isConfigured);
                
                // Update saved settings
                settings.isConnected = data.isConfigured;
                localStorage.setItem('notionSettings', JSON.stringify(settings));
            } else {
                this.updateConnectionStatus(false);
            }
            
        } catch (error) {
            console.error('Error checking Notion connection status:', error);
            this.updateConnectionStatus(false);
        }
    }
    
    /**
     * Update the connection status in the UI
     * @param {boolean} isConnected - Whether the connection is active
     */
    updateConnectionStatus(isConnected) {
        if (this.statusBadge) {
            if (isConnected) {
                this.statusBadge.textContent = 'Connected';
                this.statusBadge.className = 'status-badge status-active';
            } else {
                this.statusBadge.textContent = 'Not Connected';
                this.statusBadge.className = 'status-badge status-inactive';
            }
        }
    }
    
    /**
     * Show connection test result in the UI
     * @param {string} message - Message to display
     * @param {boolean|null} isSuccess - Whether the connection was successful (null for pending)
     */
    showConnectionResult(message, isSuccess) {
        if (this.connectionResult) {
            // Clear previous classes
            this.connectionResult.className = 'connection-result';
            
            // Add appropriate class based on result
            if (isSuccess === true) {
                this.connectionResult.classList.add('success');
            } else if (isSuccess === false) {
                this.connectionResult.classList.add('error');
            }
            
            // Show the element and set message
            this.connectionResult.classList.remove('hidden');
            this.connectionResult.innerHTML = `
                <p>${message}</p>
                ${isSuccess === true ? '<i class="fas fa-check-circle"></i>' : ''}
                ${isSuccess === false ? '<i class="fas fa-exclamation-triangle"></i>' : ''}
            `;
        }
    }
}

// Initialize Notion integration when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const notionIntegration = new NotionIntegration();
});
