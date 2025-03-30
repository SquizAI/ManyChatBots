/**
 * Create a new Notion database for ManyChatBot clients
 * This script creates a new database in your Notion workspace
 */
require('dotenv').config();
const { Client } = require('@notionhq/client');

// Initialize Notion client directly for better error handling
const notion = new Client({
  auth: process.env.NOTION_API_KEY
});

async function createClientDatabase() {
  try {
    console.log('Fetching your Notion workspace...');
    
    // First, we need to list all the pages the integration has access to
    const listResponse = await notion.search({
      filter: {
        value: 'page',
        property: 'object'
      },
      sort: {
        direction: 'descending',
        timestamp: 'last_edited_time'
      }
    });
    
    if (listResponse.results.length === 0) {
      console.error('Error: No pages found. Make sure your integration has access to at least one page in your workspace.');
      console.log('You need to go to a page in your Notion workspace, click "Share" in the top right, and add your integration.');
      return;
    }
    
    // Use the first page as the parent for our new database
    const parentPageId = listResponse.results[0].id;
    console.log(`Found parent page with ID: ${parentPageId}`);
    
    // Now create a new database as a child of this page
    console.log('Creating a new "ManyChatBot Clients" database...');
    
    const databaseSchema = {
      "Name": {
        "title": {}
      },
      "Email": {
        "email": {}
      },
      "Company": {
        "rich_text": {}
      },
      "Website": {
        "url": {}
      },
      "Industry": {
        "select": {
          "options": [
            { "name": "Health & Wellness", "color": "green" },
            { "name": "E-commerce", "color": "blue" },
            { "name": "Real Estate", "color": "orange" },
            { "name": "Professional Services", "color": "purple" },
            { "name": "Technology", "color": "gray" },
            { "name": "Education", "color": "yellow" },
            { "name": "Other", "color": "default" }
          ]
        }
      },
      "Joined": {
        "date": {}
      },
      "Plan": {
        "select": {
          "options": [
            { "name": "Free", "color": "gray" },
            { "name": "Basic", "color": "blue" },
            { "name": "Professional", "color": "green" },
            { "name": "Enterprise", "color": "purple" }
          ]
        }
      },
      "Status": {
        "select": {
          "options": [
            { "name": "Active", "color": "green" },
            { "name": "Inactive", "color": "red" },
            { "name": "Trial", "color": "yellow" },
            { "name": "Onboarding", "color": "blue" }
          ]
        }
      },
      "Monthly Visitors": {
        "number": {}
      },
      "Leads Generated": {
        "number": {}
      },
      "Conversion Rate": {
        "rich_text": {}
      },
      "Notes": {
        "rich_text": {}
      }
    };
    
    const response = await notion.databases.create({
      parent: {
        "type": "page_id",
        "page_id": parentPageId
      },
      icon: {
        "type": "emoji",
        "emoji": "🤖"
      },
      cover: {
        "type": "external",
        "external": {
          "url": "https://images.unsplash.com/photo-1596742578443-7682ef5251cd?ixlib=rb-4.0.3&q=80&cs=tinysrgb&fm=jpg&crop=entropy"
        }
      },
      title: [
        {
          "type": "text",
          "text": {
            "content": "ManyChatBot Clients",
            "link": null
          }
        }
      ],
      properties: databaseSchema
    });
    
    console.log('✅ Database created successfully!');
    console.log('Database ID:', response.id);
    console.log('Database URL:', response.url);
    
    // Update the .env file with the new database ID
    console.log('\n===========================');
    console.log('IMPORTANT: Update your .env file with the new database ID:');
    console.log(`NOTION_DATABASE_ID=${response.id}`);
    console.log('===========================\n');
    
    return response;
  } catch (error) {
    console.error('Error creating database:', error);
    
    if (error.code === 'unauthorized') {
      console.log('\nTROUBLESHOOTING TIPS:');
      console.log('1. Check that your Notion API key is correct in the .env file');
      console.log('2. Make sure your integration is properly set up at https://www.notion.so/my-integrations');
      console.log('3. Share at least one page with your integration:');
      console.log('   - Open a Notion page');
      console.log('   - Click "Share" in the top right');
      console.log('   - Search for your integration name and add it');
    }
  }
}

// Run the function
createClientDatabase()
  .then(database => {
    if (database) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
