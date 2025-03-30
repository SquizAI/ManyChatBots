/**
 * ManyChatBot Dashboard API Service
 * Handles all communication with the backend API
 */

const API_BASE_URL = '/api/v1';

// Error handling utility
const handleApiError = (error) => {
    console.error('API Error:', error);
    if (error.response) {
        // Server responded with a status code outside of 2xx range
        if (error.response.status === 401) {
            // Unauthorized - redirect to login
            localStorage.removeItem('token');
            window.location.href = '/login.html';
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
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const ApiService = {
    /**
     * Authentication Methods
     */
    auth: {
        login: async (email, password) => {
            try {
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
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
                    localStorage.setItem('token', data.token);
                }
                
                return data;
            } catch (error) {
                return handleApiError(error);
            }
        },
        
        register: async (userData) => {
            try {
                const response = await fetch(`${API_BASE_URL}/auth/register`, {
                    method: 'POST',
                    headers: {
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
        
        logout: () => {
            localStorage.removeItem('token');
            window.location.href = '/login.html';
        },
        
        forgotPassword: async (email) => {
            try {
                const response = await fetch(`${API_BASE_URL}/auth/forgotpassword`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email })
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
        
        resetPassword: async (token, password) => {
            try {
                const response = await fetch(`${API_BASE_URL}/auth/resetpassword/${token}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ password })
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
     * User Methods
     */
    user: {
        getCurrentUser: async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/auth/me`, {
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
                const response = await fetch(`${API_BASE_URL}/auth/updatedetails`, {
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
                const response = await fetch(`${API_BASE_URL}/auth/updatepassword`, {
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
     * Chatbot Methods 
     */
    chatbots: {
        getAllChatbots: async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/chatbots`, {
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
                const response = await fetch(`${API_BASE_URL}/chatbots/${id}`, {
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
        
        createChatbot: async (chatbotData) => {
            try {
                const response = await fetch(`${API_BASE_URL}/chatbots`, {
                    method: 'POST',
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
        
        updateChatbot: async (id, chatbotData) => {
            try {
                const response = await fetch(`${API_BASE_URL}/chatbots/${id}`, {
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
                const response = await fetch(`${API_BASE_URL}/chatbots/${id}`, {
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
        },
        
        getChatbotAnalytics: async (id, period = '7d') => {
            try {
                const response = await fetch(`${API_BASE_URL}/chatbots/${id}/analytics?period=${period}`, {
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
    },
    
    /**
     * Conversations Methods
     */
    conversations: {
        getRecentConversations: async (limit = 10) => {
            try {
                const response = await fetch(`${API_BASE_URL}/conversations?limit=${limit}`, {
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
        
        getConversation: async (id) => {
            try {
                const response = await fetch(`${API_BASE_URL}/conversations/${id}`, {
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
    },
    
    /**
     * Consultation Methods
     */
    consultations: {
        getAllConsultations: async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/consultations`, {
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
                const response = await fetch(`${API_BASE_URL}/consultations/${id}`, {
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
        
        createConsultation: async (consultationData) => {
            try {
                const response = await fetch(`${API_BASE_URL}/consultations`, {
                    method: 'POST',
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
        
        updateConsultation: async (id, consultationData) => {
            try {
                const response = await fetch(`${API_BASE_URL}/consultations/${id}`, {
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
        }
    },
    
    /**
     * Analytics Methods
     */
    analytics: {
        getDashboardStats: async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/analytics/dashboard`, {
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
        
        getTrafficSources: async (period = '7d') => {
            try {
                const response = await fetch(`${API_BASE_URL}/analytics/traffic?period=${period}`, {
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
        
        getConversationTrends: async (period = '7d') => {
            try {
                const response = await fetch(`${API_BASE_URL}/analytics/conversations/trends?period=${period}`, {
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
window.ApiService = ApiService;
