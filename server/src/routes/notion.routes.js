/**
 * Notion API Routes
 * Endpoints for interacting with the Notion API
 * 
 * @module NotionRoutes
 */

const express = require('express');
const router = express.Router();
const notionController = require('../controllers/notion.controller');
const { protect, authorize } = require('../middleware/auth');

// Restrict all Notion routes to authenticated users with admin role
router.use(protect);
router.use(authorize('admin'));

// GET /api/notion/validate - Validate Notion API configuration
router.get('/validate', notionController.validateConfig);

// POST /api/notion/databases/query - Query a Notion database
router.post('/databases/query', notionController.queryDatabase);

// GET /api/notion/databases/:databaseId - Get database metadata and schema
router.get('/databases/:databaseId', notionController.getDatabaseMetadata);

// POST /api/notion/databases - Create a new database
router.post('/databases', notionController.createDatabase);

// POST /api/notion/pages - Create a new page in a database
router.post('/pages', notionController.createPage);

// GET /api/notion/pages/:pageId - Get a specific page
router.get('/pages/:pageId', notionController.getPage);

// PUT /api/notion/pages - Update an existing page
router.put('/pages', notionController.updatePage);

// POST /api/notion/blocks - Append blocks to a page
router.post('/blocks', notionController.appendBlocks);

module.exports = router;
