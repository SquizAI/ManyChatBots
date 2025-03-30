/**
 * Memory System
 * Manages long-term memory for agents to recall past interactions
 */

class MemorySystem {
    constructor() {
        this.memories = new Map();
    }

    /**
     * Store a memory for a user
     * @param {string} userId - User ID
     * @param {Object} memory - Memory to store
     * @param {string} memory.type - Memory type
     * @param {string} memory.content - Memory content
     * @param {number} memory.importance - Importance score (1-10)
     * @returns {string} Memory ID
     */
    storeMemory(userId, memory) {
        if (!this.memories.has(userId)) {
            this.memories.set(userId, []);
        }
        
        const userMemories = this.memories.get(userId);
        const memoryId = `mem_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        
        userMemories.push({
            id: memoryId,
            type: memory.type || 'general',
            content: memory.content,
            importance: memory.importance || 5,
            createdAt: new Date(),
            lastAccessed: new Date()
        });
        
        // Sort memories by importance (descending)
        userMemories.sort((a, b) => b.importance - a.importance);
        
        return memoryId;
    }

    /**
     * Retrieve memories for a user
     * @param {string} userId - User ID
     * @param {Object} options - Retrieval options
     * @param {string} options.type - Filter by memory type
     * @param {number} options.limit - Maximum number of memories to retrieve
     * @param {number} options.minImportance - Minimum importance score
     * @returns {Array} Matching memories
     */
    retrieveMemories(userId, options = {}) {
        if (!this.memories.has(userId)) {
            return [];
        }
        
        const userMemories = this.memories.get(userId);
        let filteredMemories = [...userMemories];
        
        // Filter by type
        if (options.type) {
            filteredMemories = filteredMemories.filter(memory => memory.type === options.type);
        }
        
        // Filter by minimum importance
        if (options.minImportance) {
            filteredMemories = filteredMemories.filter(memory => memory.importance >= options.minImportance);
        }
        
        // Update last accessed timestamp for retrieved memories
        filteredMemories.forEach(memory => {
            memory.lastAccessed = new Date();
        });
        
        // Apply limit
        if (options.limit && options.limit > 0) {
            filteredMemories = filteredMemories.slice(0, options.limit);
        }
        
        return filteredMemories;
    }

    /**
     * Update a memory
     * @param {string} userId - User ID
     * @param {string} memoryId - Memory ID
     * @param {Object} updates - Updates to apply
     * @returns {boolean} Success
     */
    updateMemory(userId, memoryId, updates) {
        if (!this.memories.has(userId)) {
            return false;
        }
        
        const userMemories = this.memories.get(userId);
        const memoryIndex = userMemories.findIndex(memory => memory.id === memoryId);
        
        if (memoryIndex === -1) {
            return false;
        }
        
        // Apply updates
        Object.assign(userMemories[memoryIndex], updates);
        
        // Update last modified timestamp
        userMemories[memoryIndex].lastModified = new Date();
        
        return true;
    }

    /**
     * Delete a memory
     * @param {string} userId - User ID
     * @param {string} memoryId - Memory ID
     * @returns {boolean} Success
     */
    deleteMemory(userId, memoryId) {
        if (!this.memories.has(userId)) {
            return false;
        }
        
        const userMemories = this.memories.get(userId);
        const memoryIndex = userMemories.findIndex(memory => memory.id === memoryId);
        
        if (memoryIndex === -1) {
            return false;
        }
        
        // Remove memory
        userMemories.splice(memoryIndex, 1);
        
        return true;
    }

    /**
     * Clear all memories for a user
     * @param {string} userId - User ID
     */
    clearMemories(userId) {
        this.memories.delete(userId);
    }

    /**
     * Summarize memories for a user
     * @param {string} userId - User ID
     * @returns {string} Memory summary
     */
    summarizeMemories(userId) {
        if (!this.memories.has(userId) || this.memories.get(userId).length === 0) {
            return "No memories stored for this user.";
        }
        
        const userMemories = this.memories.get(userId);
        const importantMemories = userMemories
            .filter(memory => memory.importance >= 7)
            .slice(0, 5);
        
        if (importantMemories.length === 0) {
            return "No significant memories to summarize.";
        }
        
        return importantMemories
            .map(memory => `${memory.content} (Importance: ${memory.importance})`)
            .join('\n');
    }
}

module.exports = new MemorySystem();
