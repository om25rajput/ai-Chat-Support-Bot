# AI E-commerce Customer Support Agent

## Overview

This is an AI-powered e-commerce customer support agent built with a hybrid architecture combining a layered Retrieval-Augmented Generation (RAG) system with Gemini API 2.0 Flash. The application provides intelligent customer support through an optimized flow: FAQ browsing → Knowledge Base matching → AI-powered fallback responses. The system features a React frontend with shadcn/ui components and an Express backend with PostgreSQL database integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript and Vite for development/build tooling
- **UI Components**: Comprehensive shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with structured error handling and request logging
- **Rate Limiting**: Built-in session-based rate limiting (25 queries per 24 hours)
- **Development**: Hot reload with Vite middleware integration

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Design**: 
  - Users table for authentication
  - Chat sessions for tracking user interactions
  - FAQ entries with embeddings for knowledge base
  - Chat messages for conversation history
- **Connection**: Neon Database serverless PostgreSQL

### RAG System Implementation  
- **Knowledge Base**: 1000+ comprehensive FAQ entries across 10 e-commerce categories (Orders, Payments, Returns, Delivery, Warranty, etc.)
- **Similarity Matching**: Text-based similarity using Jaccard similarity and phrase matching
- **Embedding Storage**: JSONB field for future vector embedding integration
- **Fallback Logic**: Three-tier response system (Instant FAQ → KB Search → Gemini AI as final tier agent)

### AI Integration
- **Primary LLM**: Google Gemini API 2.0 Flash positioned as final tier customer service agent
- **Agent Positioning**: Gemini serves as the escalation point for complex e-commerce queries beyond knowledge base
- **Usage Optimization**: Minimal token usage through KB pre-filtering and comprehensive context
- **Context Augmentation**: Top-3 relevant KB entries from 1000+ comprehensive database provided as context
- **Response Style**: Professional, authoritative customer service agent with solution-focused approach

### Session Management
- **Session Tracking**: UUID-based session identification
- **Usage Monitoring**: Query count tracking with time-based reset windows
- **Memory Fallback**: In-memory storage implementation for development/testing

## External Dependencies

- **Database Service**: Neon Database (PostgreSQL serverless)
- **AI Service**: Google Gemini API 2.0 Flash
- **UI Framework**: Radix UI component primitives
- **Development Platform**: Replit with specialized plugins and error handling
- **Styling System**: Tailwind CSS with PostCSS processing
- **State Management**: TanStack Query for server state caching
- **Build Tools**: Vite for development server and production builds
- **Type Safety**: TypeScript with Drizzle for database type generation