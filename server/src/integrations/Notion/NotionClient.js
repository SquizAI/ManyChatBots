/**
 * Notion API Client
 * Integrates with Notion for database management and content synchronization
 * 
 * @module NotionClient
 */

const { Client } = require('@notionhq/client');

class NotionClient {
  constructor() {
    // Initialize the Notion client with API key from env
    this.apiKey = process.env.NOTION_API_KEY;
    this.databaseId = process.env.NOTION_DATABASE_ID;
    this.notionVersion = process.env.NOTION_VERSION || '2022-06-28';
    
    // Create Notion client instance
    this.client = new Client({
      auth: this.apiKey,
      notionVersion: this.notionVersion,
    });
  }

  /**
   * Check if the Notion integration is properly configured
   * @returns {boolean} - True if API key and database ID are set
   */
  isConfigured() {
    return this.apiKey && this.apiKey !== 'YOUR_NOTION_API_KEY' && 
           this.databaseId && this.databaseId !== 'YOUR_NOTION_DATABASE_ID';
  }

  /**
   * Query a Notion database
   * @param {string} databaseId - The ID of the database to query (optional, uses default if not provided)
   * @param {Object} filter - Notion filter object
   * @param {Array} sorts - Notion sorts array
   * @returns {Promise<Array>} - Parsed database query results
   */
  async queryDatabase(databaseId = null, filter = {}, sorts = []) {
    try {
      const targetDb = databaseId || this.databaseId;
      
      if (!targetDb) {
        throw new Error('No database ID provided or configured');
      }

      // Set up query parameters
      const queryParams = {
        database_id: targetDb
      };
      
      // Add filter if provided
      if (Object.keys(filter).length > 0) {
        queryParams.filter = filter;
      }
      
      // Add sorts if provided
      if (sorts.length > 0) {
        queryParams.sorts = sorts;
      }

      // Execute the query
      const response = await this.client.databases.query(queryParams);
      
      // Return the results
      return this._parseQueryResults(response.results);
    } catch (error) {
      console.error('Notion database query error:', error);
      throw new Error(`Failed to query Notion database: ${error.message}`);
    }
  }

  /**
   * Create a new page in a Notion database
   * @param {Object} properties - Page properties matching the database schema
   * @param {string} databaseId - Database ID (optional, uses default if not provided)
   * @returns {Promise<Object>} - Created page data
   */
  async createDatabasePage(properties, databaseId = null) {
    try {
      const targetDb = databaseId || this.databaseId;
      
      if (!targetDb) {
        throw new Error('No database ID provided or configured');
      }

      // Create the page in the database
      const response = await this.client.pages.create({
        parent: {
          database_id: targetDb,
        },
        properties,
      });

      return response;
    } catch (error) {
      console.error('Notion page creation error:', error);
      throw new Error(`Failed to create Notion page: ${error.message}`);
    }
  }

  /**
   * Update an existing page in Notion
   * @param {string} pageId - The ID of the page to update
   * @param {Object} properties - Page properties to update
   * @returns {Promise<Object>} - Updated page data
   */
  async updatePage(pageId, properties) {
    try {
      const response = await this.client.pages.update({
        page_id: pageId,
        properties,
      });

      return response;
    } catch (error) {
      console.error('Notion page update error:', error);
      throw new Error(`Failed to update Notion page: ${error.message}`);
    }
  }

  /**
   * Retrieve a specific page from Notion
   * @param {string} pageId - The ID of the page to retrieve
   * @returns {Promise<Object>} - Page data
   */
  async getPage(pageId) {
    try {
      const response = await this.client.pages.retrieve({
        page_id: pageId,
      });

      return response;
    } catch (error) {
      console.error('Notion page retrieval error:', error);
      throw new Error(`Failed to retrieve Notion page: ${error.message}`);
    }
  }

  /**
   * Get database metadata and schema
   * @param {string} databaseId - The ID of the database
   * @returns {Promise<Object>} - Database metadata including schema
   */
  async getDatabaseMetadata(databaseId = null) {
    try {
      const targetDb = databaseId || this.databaseId;
      
      if (!targetDb) {
        throw new Error('No database ID provided or configured');
      }

      const response = await this.client.databases.retrieve({
        database_id: targetDb,
      });

      return response;
    } catch (error) {
      console.error('Notion database metadata error:', error);
      throw new Error(`Failed to retrieve Notion database metadata: ${error.message}`);
    }
  }

  /**
   * Create a new database in Notion
   * @param {string} parentPageId - The ID of the parent page
   * @param {string} title - Database title
   * @param {Object} properties - Database properties schema
   * @returns {Promise<Object>} - Created database data
   */
  async createDatabase(parentPageId, title, properties) {
    try {
      const response = await this.client.databases.create({
        parent: {
          page_id: parentPageId,
        },
        title: [
          {
            type: 'text',
            text: {
              content: title,
            },
          },
        ],
        properties,
      });

      return response;
    } catch (error) {
      console.error('Notion database creation error:', error);
      throw new Error(`Failed to create Notion database: ${error.message}`);
    }
  }

  /**
   * Add/append content blocks to a page
   * @param {string} pageId - Page ID to add content to
   * @param {Array} blocks - Array of block objects to append
   * @returns {Promise<Object>} - Result of the append operation
   */
  async appendBlocks(pageId, blocks) {
    try {
      const response = await this.client.blocks.children.append({
        block_id: pageId,
        children: blocks,
      });

      return response;
    } catch (error) {
      console.error('Notion block append error:', error);
      throw new Error(`Failed to append blocks to Notion page: ${error.message}`);
    }
  }

  /**
   * Helper method to parse Notion database query results
   * @param {Array} results - Raw results from database query
   * @returns {Array} - Parsed results with simpler structure
   * @private
   */
  _parseQueryResults(results) {
    return results.map(page => {
      const parsedPage = {
        id: page.id,
        createdTime: page.created_time,
        lastEditedTime: page.last_edited_time,
        url: page.url,
        properties: {}
      };

      // Parse each property based on its type
      Object.entries(page.properties).forEach(([key, property]) => {
        parsedPage.properties[key] = this._parseProperty(property);
      });

      return parsedPage;
    });
  }

  /**
   * Helper method to parse a Notion property based on its type
   * @param {Object} property - Notion property object
   * @returns {*} - Parsed property value
   * @private
   */
  _parseProperty(property) {
    switch (property.type) {
      case 'title':
        return property.title.map(t => t.plain_text).join('');
      case 'rich_text':
        return property.rich_text.map(t => t.plain_text).join('');
      case 'number':
        return property.number;
      case 'select':
        return property.select ? property.select.name : null;
      case 'multi_select':
        return property.multi_select.map(option => option.name);
      case 'date':
        return property.date;
      case 'people':
        return property.people.map(person => ({
          id: person.id,
          name: person.name,
          avatar_url: person.avatar_url
        }));
      case 'files':
        return property.files.map(file => ({
          name: file.name,
          url: file.file ? file.file.url : file.external.url
        }));
      case 'checkbox':
        return property.checkbox;
      case 'url':
        return property.url;
      case 'email':
        return property.email;
      case 'phone_number':
        return property.phone_number;
      case 'formula':
        return this._parseProperty({ type: property.formula.type, [property.formula.type]: property.formula[property.formula.type] });
      case 'relation':
        return property.relation.map(rel => rel.id);
      case 'rollup':
        return property.rollup.array ? property.rollup.array.map(item => this._parseProperty(item)) : null;
      case 'created_time':
        return property.created_time;
      case 'created_by':
        return {
          id: property.created_by.id,
          name: property.created_by.name,
          avatar_url: property.created_by.avatar_url
        };
      case 'last_edited_time':
        return property.last_edited_time;
      case 'last_edited_by':
        return {
          id: property.last_edited_by.id,
          name: property.last_edited_by.name,
          avatar_url: property.last_edited_by.avatar_url
        };
      default:
        return null;
    }
  }
}

module.exports = NotionClient;
