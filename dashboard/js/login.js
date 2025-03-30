document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const alertMessage = document.getElementById('alert-message');
    const loginButton = document.querySelector('.login-button');
    const togglePasswordBtn = document.querySelector('.toggle-password');
    
    // Check if user is already logged in
    if (localStorage.getItem('token') && window.location.pathname.includes('login.html')) {
        // Redirect to dashboard if already logged in
        window.location.href = '/dashboard/index.html';
    }
    
    // Toggle password visibility
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Toggle eye icon
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }
    
    // Form validation
    function validateForm() {
        let isValid = true;
        
        // Email validation
        if (!emailInput.value.trim()) {
            showError('Please enter your email address');
            isValid = false;
        } else if (!isValidEmail(emailInput.value)) {
            showError('Please enter a valid email address');
            isValid = false;
        }
        
        // Password validation
        if (!passwordInput.value) {
            showError('Please enter your password');
            isValid = false;
        }
        
        return isValid;
    }
    
    // Email validation helper
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // Show error message
    function showError(message) {
        alertMessage.textContent = message;
        alertMessage.className = 'alert-message error';
    }
    
    // Show success message
    function showSuccess(message) {
        alertMessage.textContent = message;
        alertMessage.className = 'alert-message success';
    }
    
    // Set button loading state
    function setLoading(isLoading) {
        if (isLoading) {
            loginButton.classList.add('loading');
            loginButton.disabled = true;
        } else {
            loginButton.classList.remove('loading');
            loginButton.disabled = false;
        }
    }
    
    // Handle login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Reset alert message
            alertMessage.className = 'alert-message';
            
            // Validate form
            if (!validateForm()) return;
            
            // Show loading state
            setLoading(true);
            
            try {
                // Get form data
                const email = emailInput.value.trim();
                const password = passwordInput.value;
                const rememberMe = document.getElementById('remember').checked;
                
                // Call login API
                const response = await ApiService.auth.login(email, password);
                
                if (response.error) {
                    showError(response.message || 'Invalid email or password');
                    setLoading(false);
                    return;
                }
                
                // If remember me is checked, set expiry for 30 days
                if (rememberMe) {
                    const expiryDate = new Date();
                    expiryDate.setDate(expiryDate.getDate() + 30);
                    localStorage.setItem('tokenExpiry', expiryDate.toISOString());
                }
                
                // Show success message
                showSuccess('Login successful! Redirecting to dashboard...');
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = '/dashboard/index.html';
                }, 1000);
                
            } catch (error) {
                console.error('Login error:', error);
                showError('An error occurred. Please try again later.');
                setLoading(false);
            }
        });
    }
    
    // For demo purposes - allow quick login without API
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('demo') === 'true') {
        document.querySelector('.login-header').insertAdjacentHTML('afterend', 
            '<div class="demo-alert">Demo Mode: Click Login to enter with demo data</div>'
        );
        
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            localStorage.setItem('token', 'demo-token');
            localStorage.setItem('user', JSON.stringify({
                name: 'John Smith',
                email: 'john@example.com',
                role: 'user',
                plan: 'Professional Plan'
            }));
            window.location.href = '/dashboard/index.html';
        });
    }
});
