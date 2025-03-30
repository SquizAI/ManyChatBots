/**
 * ManyChatBot Admin API Service
 * Handles all communication with the backend API
 */

const ADMIN_API_BASE_URL = '/api/v1/admin';

// Error handling utility
const handleApiError = (error) => {
    console.error('API Error:', error);
    if (error.response) {
        // Server responded with a status code outside of 2xx range
        if (error.response.status === 401) {
            // Unauthorized - redirect to login
            localStorage.removeItem('adminToken');
            window.location.href = '/admin/login.html';
            return;
        }
        return {
            error: true,
            status: error.response.status,
            message: error.response.data.message || 'An error occurred'
        };
    } else if (error.request) {
        // Request was made but no response received
        return {
            error: true,
            message: 'No response from server. Please check your internet connection.'
        };
    } else {
        // Error setting up the request
        return {
            error: true,
            message: error.message || 'An error occurred'
        };
    }
};

// Get auth header
const getAuthHeader = () => {
    const token = localStorage.getItem('adminToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const AdminApiService = {
    /**
     * Authentication Methods
     */
    auth: {
        login: async (email, password) => {
            try {
                const response = await fetch(`${ADMIN_API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw { response: { status: response.status, data } };
                }
                
                // Store token in localStorage
                if (data.token) {
                    localStorage.setItem('adminToken', data.token);
                }
                
                return data;
            } catch (error) {
                return handleApiError(error);
            }
        },
        
        logout: () => {
            localStorage.removeItem('adminToken');
            window.location.href = '/admin/login.html';
        },
        
        getCurrentAdmin: async () => {
            try {
                const response = await fetch(`${ADMIN_API_BASE_URL}/auth/me`, {
                    method: 'GET',
                    headers: {
                        ...getAuthHeader(),
                        'Content-Type': 'application/json'
                    }
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw { response: { status: response.status, data } };
                }
                
                return data;
            } catch (error) {
                return handleApiError(error);
            }
        },
        
        updateProfile: async (userData) => {
            try {
                const response = await fetch(`${ADMIN_API_BASE_URL}/auth/updatedetails`, {
                    method: 'PUT',
                    headers: {
                        ...getAuthHeader(),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw { response: { status: response.status, data } };
                }
                
                return data;
            } catch (error) {
                return handleApiError(error);
            }
        },
        
        updatePassword: async (passwordData) => {
            try {
                const response = await fetch(`${ADMIN_API_BASE_URL}/auth/updatepassword`, {
                    method: 'PUT',
                    headers: {
                        ...getAuthHeader(),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(passwordData)
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw { response: { status: response.status, data } };
                }
                
                return data;
            } catch (error) {
                return handleApiError(error);
            }
        }
    },
    
    /**
     * User Management Methods
     */
    users: {
        getAllUsers: async (query = '') => {
            try {
                const response = await fetch(`${ADMIN_API_BASE_URL}/users?${query}`, {
                    method: 'GET',
                    headers: {
                        ...getAuthHeader(),
                        'Content-Type': 'application/json'
                    }
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw { response: { status: response.status, data } };
                }
                
                return data;
            } catch (error) {
                return handleApiError(error);
            }
        },
        
        getUser: async (id) => {
            try {
                const response = await fetch(`${ADMIN_API_BASE_URL}/users/${id}`, {
                    method: 'GET',
                    headers: {
                        ...getAuthHeader(),
                        'Content-Type': 'application/json'
                    }
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw { response: { status: response.status, data } };
                }
                
                return data;
            } catch (error) {
                return handleApiError(error);
            }
        },
        
        createUser: async (userData) => {
            try {
                const response = await fetch(`${ADMIN_API_BASE_URL}/users`, {
                    method: 'POST',
                    headers: {
                        ...getAuthHeader(),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw { response: { status: response.status, data } };
                }
                
                return data;
            } catch (error) {
                return handleApiError(error);
            }
        },
        
        updateUser: async (id, userData) => {
            try {
                const response = await fetch(`${ADMIN_API_BASE_URL}/users/${id}`, {
                    method: 'PUT',
                    headers: {
                        ...getAuthHeader(),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw { response: { status: response.status, data } };
                }
                
                return data;
            } catch (error) {
                return handleApiError(error);
            }
        },
        
        deleteUser: async (id) => {
            try {
                const response = await fetch(`${ADMIN_API_BASE_URL}/users/${id}`, {
                    method: 'DELETE',
                    headers: {
                        ...getAuthHeader(),
                        'Content-Type': 'application/json'
                    }
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw { response: { status: response.status, data } };
                }
                
                return data;
            } catch (error) {
                return handleApiError(error);
            }
        }
    },
    
    /**
     * Chatbot Management Methods
     */
    chatbots: {
        getAllChatbots: async (query = '') => {
            try {
                const response = await fetch(`${ADMIN_API_BASE_URL}/chatbots?${query}`, {
                    method: 'GET',
                    headers: {
                        ...getAuthHeader(),
                        'Content-Type': 'application/json'
                    }
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw { response: { status: response.status, data } };
                }
                
                return data;
            } catch (error) {
                return handleApiError(error);
            }
        },
        
        getChatbot: async (id) => {
            try {
                const response = await fetch(`${ADMIN_API_BASE_URL}/chatbots/${id}`, {
                    method: 'GET',
                    headers: {
                        ...getAuthHeader(),
                        'Content-Type': 'application/json'
                    }
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw { response: { status: response.status, data } };
                }
                
                return data;
            } catch (error) {
                return handleApiError(error);
            }
        },
        
        updateChatbot: async (id, chatbotData) => {
            try {
                const response = await fetch(`${ADMIN_API_BASE_URL}/chatbots/${id}`, {
                    method: 'PUT',
                    headers: {
                        ...getAuthHeader(),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(chatbotData)
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw { response: { status: response.status, data } };
                }
                
                return data;
            } catch (error) {
                return handleApiError(error);
            }
        },
        
        deleteChatbot: async (id) => {
            try {
                const response = await fetch(`${ADMIN_API_BASE_URL}/chatbots/${id}`, {
                    method: 'DELETE',
                    headers: {
                        ...getAuthHeader(),
                        'Content-Type': 'application/json'
                    }
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw { response: { status: response.status, data } };
                }
                
                return data;
            } catch (error) {
                return handleApiError(error);
            }
        }
    },
    
    /**
     * Consultation Management Methods
     */
    consultations: {
        getAllConsultations: async (query = '') => {
            try {
                const response = await fetch(`${ADMIN_API_BASE_URL}/consultations?${query}`, {
                    method: 'GET',
                    headers: {
                        ...getAuthHeader(),
                        'Content-Type': 'application/json'
                    }
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw { response: { status: response.status, data } };
                }
                
                return data;
            } catch (error) {
                return handleApiError(error);
            }
        },
        
        getConsultation: async (id) => {
            try {
                const response = await fetch(`${ADMIN_API_BASE_URL}/consultations/${id}`, {
                    method: 'GET',
                    headers: {
                        ...getAuthHeader(),
                        'Content-Type': 'application/json'
                    }
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw { response: { status: response.status, data } };
                }
                
                return data;
            } catch (error) {
                return handleApiError(error);
            }
        },
        
        updateConsultation: async (id, consultationData) => {
            try {
                const response = await fetch(`${ADMIN_API_BASE_URL}/consultations/${id}`, {
                    method: 'PUT',
                    headers: {
                        ...getAuthHeader(),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(consultationData)
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw { response: { status: response.status, data } };
                }
                
                return data;
            } catch (error) {
                return handleApiError(error);
            }
        },
        
        deleteConsultation: async (id) => {
            try {
                const response = await fetch(`${ADMIN_API_BASE_URL}/consultations/${id}`, {
                    method: 'DELETE',
                    headers: {
                        ...getAuthHeader(),
                        'Content-Type': 'application/json'
                    }
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw { response: { status: response.status, data } };
                }
                
                return data;
            } catch (error) {
                return handleApiError(error);
            }
        }
    },
    
    /**
     * Dashboard Analytics Methods
     */
    analytics: {
        getDashboardStats: async () => {
            try {
                const response = await fetch(`${ADMIN_API_BASE_URL}/analytics/dashboard`, {
                    method: 'GET',
                    headers: {
                        ...getAuthHeader(),
                        'Content-Type': 'application/json'
                    }
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw { response: { status: response.status, data } };
                }
                
                return data;
            } catch (error) {
                return handleApiError(error);
            }
        },
        
        getSystemStatus: async () => {
            try {
                const response = await fetch(`${ADMIN_API_BASE_URL}/analytics/system`, {
                    method: 'GET',
                    headers: {
                        ...getAuthHeader(),
                        'Content-Type': 'application/json'
                    }
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw { response: { status: response.status, data } };
                }
                
                return data;
            } catch (error) {
                return handleApiError(error);
            }
        },
        
        getUserStats: async (period = '7d') => {
            try {
                const response = await fetch(`${ADMIN_API_BASE_URL}/analytics/users?period=${period}`, {
                    method: 'GET',
                    headers: {
                        ...getAuthHeader(),
                        'Content-Type': 'application/json'
                    }
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw { response: { status: response.status, data } };
                }
                
                return data;
            } catch (error) {
                return handleApiError(error);
            }
        },
        
        getChatbotStats: async (period = '7d') => {
            try {
                const response = await fetch(`${ADMIN_API_BASE_URL}/analytics/chatbots?period=${period}`, {
                    method: 'GET',
                    headers: {
                        ...getAuthHeader(),
                        'Content-Type': 'application/json'
                    }
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw { response: { status: response.status, data } };
                }
                
                return data;
            } catch (error) {
                return handleApiError(error);
            }
        },
        
        getConsultationStats: async (period = '7d') => {
            try {
                const response = await fetch(`${ADMIN_API_BASE_URL}/analytics/consultations?period=${period}`, {
                    method: 'GET',
                    headers: {
                        ...getAuthHeader(),
                        'Content-Type': 'application/json'
                    }
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw { response: { status: response.status, data } };
                }
                
                return data;
            } catch (error) {
                return handleApiError(error);
            }
        }
    }
};

// Export the API service
window.AdminApiService = AdminApiService;
