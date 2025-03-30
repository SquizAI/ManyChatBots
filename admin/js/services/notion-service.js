/**
 * Notion API Service
 * Handles communication with the Notion API endpoints on the server
 */

class NotionApiService {
    constructor() {
        this.baseUrl = '/api/notion';
        this.headers = {
            'Content-Type': 'application/json'
        };
    }

    /**
     * Set the authentication token for API requests
     * @param {string} token - Admin authentication token
     */
    setAuthToken(token) {
        this.headers['Authorization'] = `Bearer ${token}`;
    }

    /**
     * Validate the Notion API configuration
     * @returns {Promise<Object>} - API response
     */
    async validateConfig() {
        try {
            const response = await fetch(`${this.baseUrl}/validate`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            return await response.json();
        } catch (error) {
            console.error('Error validating Notion config:', error);
            return {
                success: false,
                error: error.message || 'Failed to validate Notion configuration'
            };
        }
    }

    /**
     * Query a Notion database
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} - API response with query results
     */
    async queryDatabase(params) {
        try {
            const response = await fetch(`${this.baseUrl}/databases/query`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(params)
            });

            return await response.json();
        } catch (error) {
            console.error('Error querying Notion database:', error);
            return {
                success: false,
                error: error.message || 'Failed to query Notion database'
            };
        }
    }

    /**
     * Create a new page in a Notion database
     * @param {Object} data - Page data with properties
     * @returns {Promise<Object>} - API response with created page
     */
    async createPage(data) {
        try {
            const response = await fetch(`${this.baseUrl}/pages`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });

            return await response.json();
        } catch (error) {
            console.error('Error creating Notion page:', error);
            return {
                success: false,
                error: error.message || 'Failed to create Notion page'
            };
        }
    }

    /**
     * Update an existing Notion page
     * @param {Object} data - Page data with ID and properties
     * @returns {Promise<Object>} - API response with updated page
     */
    async updatePage(data) {
        try {
            const response = await fetch(`${this.baseUrl}/pages`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });

            return await response.json();
        } catch (error) {
            console.error('Error updating Notion page:', error);
            return {
                success: false,
                error: error.message || 'Failed to update Notion page'
            };
        }
    }

    /**
     * Get database metadata including schema
     * @param {string} databaseId - Database ID (optional)
     * @returns {Promise<Object>} - API response with database metadata
     */
    async getDatabaseMetadata(databaseId) {
        try {
            const url = databaseId 
                ? `${this.baseUrl}/databases/${databaseId}`
                : `${this.baseUrl}/databases`;

            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders()
            });

            return await response.json();
        } catch (error) {
            console.error('Error getting Notion database metadata:', error);
            return {
                success: false,
                error: error.message || 'Failed to get Notion database metadata'
            };
        }
    }

    /**
     * Export chats to Notion
     * @param {Array} chats - Array of chat conversations to export
     * @returns {Promise<Object>} - API response with export results
     */
    async exportChats(chats) {
        try {
            // Format the chats data for Notion
            const properties = this.formatChatsForNotion(chats);

            // Create a new page in the Notion database for each chat
            const exportPromises = chats.map(chat => {
                return this.createPage({
                    properties: this.formatChatForNotion(chat)
                });
            });

            const results = await Promise.all(exportPromises);
            
            return {
                success: true,
                count: results.length,
                data: results
            };
        } catch (error) {
            console.error('Error exporting chats to Notion:', error);
            return {
                success: false,
                error: error.message || 'Failed to export chats to Notion'
            };
        }
    }

    /**
     * Export users to Notion
     * @param {Array} users - Array of user data to export
     * @returns {Promise<Object>} - API response with export results
     */
    async exportUsers(users) {
        try {
            // Create a new page in the Notion database for each user
            const exportPromises = users.map(user => {
                return this.createPage({
                    properties: this.formatUserForNotion(user)
                });
            });

            const results = await Promise.all(exportPromises);
            
            return {
                success: true,
                count: results.length,
                data: results
            };
        } catch (error) {
            console.error('Error exporting users to Notion:', error);
            return {
                success: false,
                error: error.message || 'Failed to export users to Notion'
            };
        }
    }

    /**
     * Get the headers for API requests
     * @returns {Object} - Headers object with auth token if available
     * @private
     */
    getHeaders() {
        // Add auth token if not already set
        if (!this.headers['Authorization'] && localStorage.getItem('adminToken')) {
            this.setAuthToken(localStorage.getItem('adminToken'));
        }

        return this.headers;
    }

    /**
     * Format chat data for Notion database
     * @param {Object} chat - Chat conversation data
     * @returns {Object} - Formatted properties for Notion
     * @private
     */
    formatChatForNotion(chat) {
        return {
            "Name": {
                "title": [
                    {
                        "text": {
                            "content": `Chat with ${chat.userName || 'User'}`
                        }
                    }
                ]
            },
            "User": {
                "rich_text": [
                    {
                        "text": {
                            "content": chat.userName || 'Anonymous'
                        }
                    }
                ]
            },
            "Date": {
                "date": {
                    "start": chat.timestamp || new Date().toISOString()
                }
            },
            "Messages": {
                "number": chat.messages ? chat.messages.length : 0
            },
            "Status": {
                "select": {
                    "name": chat.status || "Completed"
                }
            }
        };
    }

    /**
     * Format user data for Notion database
     * @param {Object} user - User data
     * @returns {Object} - Formatted properties for Notion
     * @private
     */
    formatUserForNotion(user) {
        return {
            "Name": {
                "title": [
                    {
                        "text": {
                            "content": user.name || 'Unknown User'
                        }
                    }
                ]
            },
            "Email": {
                "email": user.email || ''
            },
            "Role": {
                "select": {
                    "name": user.role || "User"
                }
            },
            "Plan": {
                "select": {
                    "name": user.plan || "Free"
                }
            },
            "Joined": {
                "date": {
                    "start": user.joinedDate || new Date().toISOString()
                }
            },
            "Status": {
                "select": {
                    "name": user.status || "Active"
                }
            }
        };
    }
}

// Export for use in other files
window.NotionApiService = new NotionApiService();
