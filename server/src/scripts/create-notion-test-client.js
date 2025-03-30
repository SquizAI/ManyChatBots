/**
 * Create Notion Test Client
 * This script creates a sample client record in the Notion database.
 */
require('dotenv').config();
const NotionClient = require('../integrations/Notion/NotionClient');

// Initialize the Notion client
const notionClient = new NotionClient();

// Sample client data
const sampleClient = {
  name: "Sarah Johnson",
  email: "sarah@modernwellness.co",
  company: "Modern Wellness Co.",
  website: "https://modernwellness.co",
  industry: "Health & Wellness",
  joinedDate: new Date().toISOString(),
  plan: "Professional",
  status: "Active",
  chatbotType: "Customer Support & Appointment Booking",
  monthlyVisitors: 15000,
  leadsGenerated: 127,
  conversionRate: "8.5%",
  averageResponseTime: "12 seconds",
  chatHistory: [
    {
      date: "2025-03-25T19:30:00.000Z",
      customer: "John Doe",
      summary: "Inquired about yoga classes and pricing",
      outcome: "Booked introductory session"
    },
    {
      date: "2025-03-26T14:15:00.000Z",
      customer: "Emma Williams",
      summary: "Asked about nutritionist availability",
      outcome: "Scheduled consultation for next week"
    },
    {
      date: "2025-03-26T17:45:00.000Z",
      customer: "Michael Smith",
      summary: "Had questions about membership cancellation policy",
      outcome: "Retained customer by offering flexible pause option"
    }
  ],
  notes: "Sarah's chatbot has been particularly effective at booking consultations and answering FAQs. Considering upselling to Enterprise plan."
};

/**
 * Format client data for Notion database
 * This creates a properties object that matches Notion's expected format
 */
function formatClientForNotion(client) {
  return {
    "Name": {
      "title": [
        {
          "text": {
            "content": client.name
          }
        }
      ]
    },
    "Email": {
      "email": client.email
    },
    "Company": {
      "rich_text": [
        {
          "text": {
            "content": client.company
          }
        }
      ]
    },
    "Website": {
      "url": client.website
    },
    "Industry": {
      "select": {
        "name": client.industry
      }
    },
    "Joined": {
      "date": {
        "start": client.joinedDate
      }
    },
    "Plan": {
      "select": {
        "name": client.plan
      }
    },
    "Status": {
      "select": {
        "name": client.status
      }
    },
    "Monthly Visitors": {
      "number": client.monthlyVisitors
    },
    "Leads Generated": {
      "number": client.leadsGenerated
    },
    "Conversion Rate": {
      "rich_text": [
        {
          "text": {
            "content": client.conversionRate
          }
        }
      ]
    },
    "Notes": {
      "rich_text": [
        {
          "text": {
            "content": client.notes
          }
        }
      ]
    }
  };
}

/**
 * Create a client page in Notion
 */
async function createClientInNotion() {
  try {
    console.log('Creating sample client in Notion...');
    
    // Check if Notion client is properly configured
    if (!notionClient.isConfigured()) {
      console.error('Error: Notion API is not configured properly. Check your .env file for NOTION_API_KEY and NOTION_DATABASE_ID.');
      return;
    }
    
    // Format client data for Notion
    const properties = formatClientForNotion(sampleClient);
    
    // Create the page in Notion
    const response = await notionClient.createDatabasePage(properties);
    
    console.log('✅ Sample client successfully created in Notion!');
    console.log('Client name:', sampleClient.name);
    console.log('Page URL:', response.url);
    
    // Create additional blocks for chat history
    if (sampleClient.chatHistory && sampleClient.chatHistory.length > 0) {
      console.log('Adding chat history...');
      
      // Create blocks for each chat interaction
      const blocks = [
        {
          "object": "block",
          "type": "heading_2",
          "heading_2": {
            "rich_text": [
              {
                "type": "text",
                "text": {
                  "content": "Recent Chat Interactions"
                }
              }
            ]
          }
        },
        {
          "object": "block",
          "type": "paragraph",
          "paragraph": {
            "rich_text": [
              {
                "type": "text",
                "text": {
                  "content": "Below are the most recent customer interactions with this client's chatbot:"
                }
              }
            ]
          }
        }
      ];
      
      // Add a table of contents block
      blocks.push({
        "object": "block",
        "type": "table_of_contents",
        "table_of_contents": {}
      });
      
      // Add each chat interaction as a toggle block
      sampleClient.chatHistory.forEach(chat => {
        const date = new Date(chat.date).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        blocks.push({
          "object": "block",
          "type": "heading_3",
          "heading_3": {
            "rich_text": [
              {
                "type": "text",
                "text": {
                  "content": `Interaction with ${chat.customer} - ${date}`
                }
              }
            ]
          }
        });
        
        blocks.push({
          "object": "block",
          "type": "paragraph",
          "paragraph": {
            "rich_text": [
              {
                "type": "text",
                "text": {
                  "content": `Summary: ${chat.summary}`
                },
                "annotations": {
                  "bold": true
                }
              }
            ]
          }
        });
        
        blocks.push({
          "object": "block",
          "type": "paragraph",
          "paragraph": {
            "rich_text": [
              {
                "type": "text",
                "text": {
                  "content": `Outcome: ${chat.outcome}`
                }
              }
            ]
          }
        });
        
        // Add a divider between chat interactions
        blocks.push({
          "object": "block",
          "type": "divider",
          "divider": {}
        });
      });
      
      // Add ROI section
      blocks.push({
        "object": "block",
        "type": "heading_2",
        "heading_2": {
          "rich_text": [
            {
              "type": "text",
              "text": {
                "content": "ROI Analysis"
              }
            }
          ]
        }
      });
      
      blocks.push({
        "object": "block",
        "type": "callout",
        "callout": {
          "rich_text": [
            {
              "type": "text",
              "text": {
                "content": `Based on ${sampleClient.leadsGenerated} leads generated from ${sampleClient.monthlyVisitors} monthly visitors, ${sampleClient.name}'s chatbot has achieved a ${sampleClient.conversionRate} conversion rate, significantly higher than the industry average of 3.2%.`
              }
            }
          ],
          "icon": {
            "emoji": "📈"
          },
          "color": "green_background"
        }
      });
      
      // Add the blocks to the page
      await notionClient.appendBlocks(response.id, blocks);
      console.log('✅ Chat history and additional content added!');
    }
    
    console.log('Done! Your sample client is now in Notion.');
    return response;
  } catch (error) {
    console.error('Error creating client in Notion:', error);
    throw error;
  }
}

// Execute the function
createClientInNotion()
  .then(() => {
    console.log('Script completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
