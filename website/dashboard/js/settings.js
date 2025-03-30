document.addEventListener('DOMContentLoaded', function() {
    // Check for authentication
    if (!localStorage.getItem('token') && !window.location.pathname.includes('login.html')) {
        window.location.href = '/dashboard/login.html';
        return;
    }

    // DOM Elements
    const menuToggle = document.querySelector('.menu-toggle');
    const closeSidebar = document.querySelector('.close-sidebar');
    const sidebar = document.querySelector('.sidebar');
    const navTabs = document.querySelectorAll('.nav-tabs li');
    const tabPanels = document.querySelectorAll('.tab-panel');
    const profileForm = document.querySelector('.profile-form');
    const securityForm = document.querySelector('.security-form');
    const notificationForm = document.querySelector('.notification-options');
    const toggleSwitches = document.querySelectorAll('.toggle-switch input');
    const revokeSessionBtns = document.querySelectorAll('.session-item .btn-danger-text');
    const logoutAllBtn = document.querySelector('.security-section .btn-danger');
    const addPaymentBtn = document.querySelector('.billing-section .btn-secondary.mt-3');
    const upgradeButtons = document.querySelectorAll('.btn-primary:not([type="submit"])');
    
    // Toggle sidebar on mobile
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.add('active');
        });
    }
    
    if (closeSidebar) {
        closeSidebar.addEventListener('click', function() {
            sidebar.classList.remove('active');
        });
    }
    
    // Tab navigation
    navTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Update active tab
            navTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding tab panel
            tabPanels.forEach(panel => {
                panel.classList.remove('active');
                if (panel.id === `${tabName}-panel`) {
                    panel.classList.add('active');
                }
            });
            
            // Update URL with hash
            window.location.hash = tabName;
        });
    });
    
    // Check URL hash on page load
    function checkTabFromHash() {
        const hash = window.location.hash.substring(1);
        if (hash) {
            const tab = document.querySelector(`.nav-tabs li[data-tab="${hash}"]`);
            if (tab) {
                tab.click();
            }
        }
    }
    
    // Load user profile
    async function loadUserProfile() {
        try {
            if (window.ApiService) {
                const response = await ApiService.user.getProfile();
                
                if (response.error) {
                    showNotification('Failed to load profile: ' + response.message, 'error');
                    return;
                }
                
                populateProfileForm(response.data);
            } else {
                // Demo mode - profile is already populated in HTML
                console.log('Using demo profile data');
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    }
    
    // Populate profile form with user data
    function populateProfileForm(user) {
        if (!user) return;
        
        // Set user avatar initials
        const avatarContainer = document.querySelector('.avatar-container span');
        if (avatarContainer) {
            avatarContainer.textContent = getInitials(user.firstName, user.lastName);
        }
        
        // Set user name in sidebar
        const sidebarUserName = document.querySelector('.sidebar-user h4');
        if (sidebarUserName) {
            sidebarUserName.textContent = `${user.firstName} ${user.lastName}`;
        }
        
        // Set form fields
        document.getElementById('first-name').value = user.firstName || '';
        document.getElementById('last-name').value = user.lastName || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('phone').value = user.phone || '';
        document.getElementById('company').value = user.company || '';
        document.getElementById('website').value = user.website || '';
        
        // Set timezone if exists
        const timezoneSelect = document.getElementById('timezone');
        if (timezoneSelect && user.timezone) {
            for (let i = 0; i < timezoneSelect.options.length; i++) {
                if (timezoneSelect.options[i].value === user.timezone) {
                    timezoneSelect.selectedIndex = i;
                    break;
                }
            }
        }
    }
    
    // Profile form submission
    if (profileForm) {
        profileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
                firstName: document.getElementById('first-name').value,
                lastName: document.getElementById('last-name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                company: document.getElementById('company').value,
                website: document.getElementById('website').value,
                timezone: document.getElementById('timezone').value
            };
            
            try {
                if (window.ApiService) {
                    const response = await ApiService.user.updateProfile(formData);
                    
                    if (response.error) {
                        showNotification('Failed to update profile: ' + response.message, 'error');
                        return;
                    }
                    
                    showNotification('Profile updated successfully', 'success');
                } else {
                    // Demo mode
                    showNotification('Profile updated successfully', 'success');
                    
                    // Update initials and name in sidebar
                    const avatarContainer = document.querySelector('.avatar-container span');
                    if (avatarContainer) {
                        avatarContainer.textContent = getInitials(formData.firstName, formData.lastName);
                    }
                    
                    const sidebarUserName = document.querySelector('.sidebar-user h4');
                    if (sidebarUserName) {
                        sidebarUserName.textContent = `${formData.firstName} ${formData.lastName}`;
                    }
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                showNotification('An error occurred while updating your profile', 'error');
            }
        });
    }
    
    // Security form submission (change password)
    if (securityForm) {
        securityForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            if (!currentPassword || !newPassword || !confirmPassword) {
                showNotification('Please fill in all password fields', 'error');
                return;
            }
            
            if (newPassword !== confirmPassword) {
                showNotification('New passwords do not match', 'error');
                return;
            }
            
            try {
                if (window.ApiService) {
                    const response = await ApiService.user.changePassword({
                        currentPassword,
                        newPassword
                    });
                    
                    if (response.error) {
                        showNotification('Failed to change password: ' + response.message, 'error');
                        return;
                    }
                    
                    showNotification('Password changed successfully', 'success');
                    securityForm.reset();
                } else {
                    // Demo mode
                    showNotification('Password changed successfully', 'success');
                    securityForm.reset();
                }
            } catch (error) {
                console.error('Error changing password:', error);
                showNotification('An error occurred while changing your password', 'error');
            }
        });
    }
    
    // Toggle switches
    toggleSwitches.forEach(toggle => {
        toggle.addEventListener('change', function() {
            const settingName = this.closest('.notification-option').querySelector('.option-title').textContent;
            const isEnabled = this.checked;
            
            saveNotificationPreference(settingName, isEnabled);
        });
    });
    
    // Save notification preference
    async function saveNotificationPreference(settingName, isEnabled) {
        try {
            if (window.ApiService) {
                const response = await ApiService.user.updateNotificationPreference({
                    setting: settingName,
                    enabled: isEnabled
                });
                
                if (response.error) {
                    showNotification('Failed to update notification preference', 'error');
                    return;
                }
                
                showNotification(`${settingName} notification ${isEnabled ? 'enabled' : 'disabled'}`, 'success');
            } else {
                // Demo mode
                showNotification(`${settingName} notification ${isEnabled ? 'enabled' : 'disabled'}`, 'success');
            }
        } catch (error) {
            console.error('Error updating notification preference:', error);
            showNotification('An error occurred while updating notification preference', 'error');
        }
    }
    
    // Revoke session buttons
    revokeSessionBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const sessionItem = this.closest('.session-item');
            const deviceName = sessionItem.querySelector('.session-device').textContent;
            
            revokeSession(sessionItem, deviceName);
        });
    });
    
    // Revoke a specific session
    async function revokeSession(sessionItem, deviceName) {
        try {
            if (window.ApiService) {
                // In a real implementation, we would have a session ID to revoke
                const sessionId = sessionItem.getAttribute('data-session-id') || 'demo-session';
                
                const response = await ApiService.user.revokeSession(sessionId);
                
                if (response.error) {
                    showNotification('Failed to revoke session', 'error');
                    return;
                }
                
                sessionItem.remove();
                showNotification(`Session on ${deviceName} revoked successfully`, 'success');
            } else {
                // Demo mode
                sessionItem.remove();
                showNotification(`Session on ${deviceName} revoked successfully`, 'success');
            }
        } catch (error) {
            console.error('Error revoking session:', error);
            showNotification('An error occurred while revoking the session', 'error');
        }
    }
    
    // Log out of all sessions
    if (logoutAllBtn) {
        logoutAllBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to log out of all sessions? You will need to log in again on all devices.')) {
                logoutAllSessions();
            }
        });
    }
    
    // Log out of all sessions
    async function logoutAllSessions() {
        try {
            if (window.ApiService) {
                const response = await ApiService.user.logoutAllSessions();
                
                if (response.error) {
                    showNotification('Failed to log out of all sessions', 'error');
                    return;
                }
                
                // Redirect to login page
                localStorage.removeItem('token');
                window.location.href = '/dashboard/login.html';
            } else {
                // Demo mode
                showNotification('You have been logged out of all sessions', 'success');
                
                // Simulate redirect after a short delay
                setTimeout(() => {
                    localStorage.removeItem('token');
                    window.location.href = '/dashboard/login.html';
                }, 2000);
            }
        } catch (error) {
            console.error('Error logging out of all sessions:', error);
            showNotification('An error occurred while logging out', 'error');
        }
    }
    
    // Add payment method button
    if (addPaymentBtn) {
        addPaymentBtn.addEventListener('click', function() {
            showPaymentModal();
        });
    }
    
    // Show payment method modal
    function showPaymentModal() {
        // In a real implementation, this would show a modal for adding a new payment method
        showNotification('Payment method feature coming soon', 'info');
    }
    
    // Upgrade plan buttons
    upgradeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            window.location.href = '/dashboard/billing.html#plans';
        });
    });
    
    // Show notification
    function showNotification(message, type = 'info') {
        // Check if notification container exists, if not create it
        let notificationContainer = document.querySelector('.notification-container');
        
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.className = 'notification-container';
            document.body.appendChild(notificationContainer);
            
            // Add styles
            const style = document.createElement('style');
            style.textContent = `
                .notification-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 1000;
                }
                .notification {
                    background-color: white;
                    border-radius: 4px;
                    box-shadow: 0 3px 10px rgba(0,0,0,0.15);
                    padding: 15px 20px;
                    margin-bottom: 10px;
                    display: flex;
                    align-items: center;
                    min-width: 300px;
                    transform: translateX(120%);
                    transition: transform 0.3s ease;
                }
                .notification.show {
                    transform: translateX(0);
                }
                .notification.success {
                    border-left: 4px solid #28a745;
                }
                .notification.error {
                    border-left: 4px solid #dc3545;
                }
                .notification.info {
                    border-left: 4px solid #0071e3;
                }
                .notification i {
                    margin-right: 10px;
                    font-size: 18px;
                }
                .notification.success i {
                    color: #28a745;
                }
                .notification.error i {
                    color: #dc3545;
                }
                .notification.info i {
                    color: #0071e3;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        `;
        
        notificationContainer.appendChild(notification);
        
        // Show with animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    }
    
    // Helper function to get initials from name
    function getInitials(firstName, lastName) {
        let initials = '';
        
        if (firstName) {
            initials += firstName.charAt(0).toUpperCase();
        }
        
        if (lastName) {
            initials += lastName.charAt(0).toUpperCase();
        }
        
        return initials || 'U'; // Default to 'U' for user if no name
    }
    
    // Initialize
    checkTabFromHash();
    loadUserProfile();
});
