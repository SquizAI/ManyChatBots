# ManyChatBot Unified Agentic Architecture

## Overview

ManyChatBot uses a unified agentic architecture that powers all chatbots across the platform. This ensures consistency in behavior, shared capabilities, and simplified management for users.

## Key Principles

1. **Single Core Engine** - All chatbots use the same core processing engine
2. **Personality Layer** - Customization happens at the personality/behavior layer
3. **Knowledge Independence** - Each chatbot maintains its own knowledge base
4. **Unified API** - All chatbots interact with the same standardized API
5. **Action Framework** - Common framework for defining and executing actions

## Architecture Diagram

```
┌───────────────────────────────────────────────────────────┐
│                  UNIFIED CHATBOT CORE                      │
├───────────┬───────────┬────────────┬──────────┬───────────┤
│ NLU       │ Context   │ Response   │ Memory   │ Learning  │
│ Engine    │ Manager   │ Generator  │ System   │ System    │
└───────────┴───────────┴────────────┴──────────┴───────────┘
               ▲                 │
               │                 ▼
┌───────────────────────────────────────────────────────────┐
│                  AGENTIC ACTION FRAMEWORK                  │
├───────────┬───────────┬────────────┬──────────┬───────────┤
│ API       │ Function  │ External   │ Database │ Analytics │
│ Gateway   │ Executor  │ Services   │ Access   │ Collector │
└───────────┴───────────┴────────────┴──────────┴───────────┘
       ▲                                              │
       │                                              ▼
┌──────────────────┐    ┌────────────────────────────────────┐
│  KNOWLEDGE BASE  │◄───┤        PERSONALITY PROFILES        │
└──────────────────┘    └────────────────────────────────────┘
       ▲                                 ▲
       │                                 │
       └─────────────┬───────────────────┘
                     │
       ┌─────────────▼───────────────┐
       │      CHATBOT INSTANCES      │
       └─────────────────────────────┘
                     ▲
                     │
       ┌─────────────▼───────────────┐
       │    USER INTERFACE LAYER     │
       └─────────────────────────────┘
```

## Component Descriptions

### Unified Chatbot Core

- **NLU Engine**: Processes user messages to understand intent and entities
- **Context Manager**: Maintains conversation context and state
- **Response Generator**: Creates appropriate responses based on intent and personality
- **Memory System**: Stores and retrieves conversation history
- **Learning System**: Improves responses based on interactions

### Agentic Action Framework

- **API Gateway**: Provides standardized access to external systems
- **Function Executor**: Safely runs code functions requested by chatbots
- **External Services**: Connects to third-party services (payment, shipping, etc.)
- **Database Access**: Manages data operations across systems
- **Analytics Collector**: Gathers usage and performance metrics

### Knowledge Base

Each chatbot has access to:
- Shared general knowledge (configurable)
- Chatbot-specific domain knowledge
- Customer/business data (with proper authorization)
- Document repositories
- FAQs and predefined responses

### Personality Profiles

Defines how the chatbot interacts with users:
- Tone and voice settings
- Response templates
- Behavioral rules
- Decision-making parameters
- Conversation flow preferences

## Workflow

1. User sends a message to a specific chatbot instance
2. Message is processed by the NLU Engine
3. Context Manager adds conversation context
4. Knowledge Base provides relevant information
5. Personality Profile guides response style
6. Agentic Action Framework executes any required actions
7. Response Generator creates the final message
8. Response is delivered to the user

## Benefits for Users

- **Consistency**: All chatbots behave predictably with the same core capabilities
- **Simplified Management**: Update the core once to improve all chatbots
- **Easier Learning Curve**: Learn one system to manage multiple chatbots
- **Maximum Customization**: Focus on personality and knowledge, not architecture
- **Improved Performance**: Optimizations benefit all chatbots automatically

## Implementation Guidelines

When configuring a new chatbot:

1. Define the business purpose and goals
2. Configure the personality profile
3. Prepare the knowledge base with domain-specific information
4. Set up required actions and API connections
5. Test the chatbot with sample conversations
6. Deploy to production

No coding is required for standard configurations. Custom actions can be defined through the Action Builder UI or via the API for advanced use cases.
