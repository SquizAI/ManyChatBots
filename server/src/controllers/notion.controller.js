/**
 * Notion Controller
 * Handles interactions with the Notion API via the NotionClient
 * 
 * @module NotionController
 */

const NotionClient = require('../integrations/Notion/NotionClient');
const notionClient = new NotionClient();

/**
 * Validate Notion API configuration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - API response
 */
const validateConfig = async (req, res) => {
  try {
    const isConfigured = notionClient.isConfigured();
    
    return res.status(200).json({
      success: true,
      isConfigured,
      message: isConfigured ? 'Notion API is properly configured' : 'Notion API is not configured yet'
    });
  } catch (error) {
    console.error('Notion config validation error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to validate Notion configuration'
    });
  }
};

/**
 * Query a Notion database
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - API response with database query results
 */
const queryDatabase = async (req, res) => {
  try {
    const { databaseId, filter, sorts } = req.body;
    
    if (!notionClient.isConfigured() && !databaseId) {
      return res.status(400).json({
        success: false,
        error: 'Notion API is not configured and no database ID provided'
      });
    }
    
    const results = await notionClient.queryDatabase(databaseId, filter, sorts);
    
    return res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error('Notion database query error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to query Notion database'
    });
  }
};

/**
 * Create a new page in a Notion database
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - API response with created page data
 */
const createPage = async (req, res) => {
  try {
    const { properties, databaseId } = req.body;
    
    if (!properties) {
      return res.status(400).json({
        success: false,
        error: 'Page properties are required'
      });
    }
    
    if (!notionClient.isConfigured() && !databaseId) {
      return res.status(400).json({
        success: false,
        error: 'Notion API is not configured and no database ID provided'
      });
    }
    
    const page = await notionClient.createDatabasePage(properties, databaseId);
    
    return res.status(201).json({
      success: true,
      data: page
    });
  } catch (error) {
    console.error('Notion page creation error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create Notion page'
    });
  }
};

/**
 * Update an existing page in Notion
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - API response with updated page data
 */
const updatePage = async (req, res) => {
  try {
    const { pageId, properties } = req.body;
    
    if (!pageId || !properties) {
      return res.status(400).json({
        success: false,
        error: 'Page ID and properties are required'
      });
    }
    
    if (!notionClient.isConfigured()) {
      return res.status(400).json({
        success: false,
        error: 'Notion API is not configured'
      });
    }
    
    const page = await notionClient.updatePage(pageId, properties);
    
    return res.status(200).json({
      success: true,
      data: page
    });
  } catch (error) {
    console.error('Notion page update error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update Notion page'
    });
  }
};

/**
 * Get a specific page from Notion
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - API response with page data
 */
const getPage = async (req, res) => {
  try {
    const { pageId } = req.params;
    
    if (!pageId) {
      return res.status(400).json({
        success: false,
        error: 'Page ID is required'
      });
    }
    
    if (!notionClient.isConfigured()) {
      return res.status(400).json({
        success: false,
        error: 'Notion API is not configured'
      });
    }
    
    const page = await notionClient.getPage(pageId);
    
    return res.status(200).json({
      success: true,
      data: page
    });
  } catch (error) {
    console.error('Notion page retrieval error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve Notion page'
    });
  }
};

/**
 * Get database metadata and schema
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - API response with database metadata
 */
const getDatabaseMetadata = async (req, res) => {
  try {
    const { databaseId } = req.params;
    
    if (!notionClient.isConfigured() && !databaseId) {
      return res.status(400).json({
        success: false,
        error: 'Notion API is not configured and no database ID provided'
      });
    }
    
    const metadata = await notionClient.getDatabaseMetadata(databaseId);
    
    return res.status(200).json({
      success: true,
      data: metadata
    });
  } catch (error) {
    console.error('Notion database metadata error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve Notion database metadata'
    });
  }
};

/**
 * Create a new database in Notion
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - API response with created database data
 */
const createDatabase = async (req, res) => {
  try {
    const { parentPageId, title, properties } = req.body;
    
    if (!parentPageId || !title || !properties) {
      return res.status(400).json({
        success: false,
        error: 'Parent page ID, title, and properties are required'
      });
    }
    
    if (!notionClient.isConfigured()) {
      return res.status(400).json({
        success: false,
        error: 'Notion API is not configured'
      });
    }
    
    const database = await notionClient.createDatabase(parentPageId, title, properties);
    
    return res.status(201).json({
      success: true,
      data: database
    });
  } catch (error) {
    console.error('Notion database creation error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create Notion database'
    });
  }
};

/**
 * Append content blocks to a page
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - API response with result of the append operation
 */
const appendBlocks = async (req, res) => {
  try {
    const { pageId, blocks } = req.body;
    
    if (!pageId || !blocks || !Array.isArray(blocks)) {
      return res.status(400).json({
        success: false,
        error: 'Page ID and blocks array are required'
      });
    }
    
    if (!notionClient.isConfigured()) {
      return res.status(400).json({
        success: false,
        error: 'Notion API is not configured'
      });
    }
    
    const result = await notionClient.appendBlocks(pageId, blocks);
    
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Notion block append error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to append blocks to Notion page'
    });
  }
};

// Export controller functions
module.exports = {
  validateConfig,
  queryDatabase,
  createPage,
  updatePage,
  getPage,
  getDatabaseMetadata,
  createDatabase,
  appendBlocks
};
