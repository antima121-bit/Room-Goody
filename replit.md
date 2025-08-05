# replit.md

## Overview

RoomScanner is a comprehensive cross-platform web application designed for interior designers, architects, and home enthusiasts to digitally capture and catalog physical spaces and objects within them. The application combines professional room layout scanning with AI-powered real-time object detection, providing a powerful tool for space management and inventory tracking.

## Recent Changes (January 2025)

✓ **Enhanced MagicPlan Integration**: Implemented friction-free deep linking with one-time setup flow that eliminates repeated login prompts
✓ **Real-Time Camera Detection**: Built comprehensive live camera system with TensorFlow.js for real-time object detection
✓ **Advanced Object & Logo Detection**: Integrated YOLOv7-powered detection system with comprehensive brand recognition capabilities
✓ **Multi-Feature Analysis**: Enhanced detection with color extraction, shape analysis, size estimation, and brand identification
✓ **Comprehensive Detection API**: Created Flask-based YOLOv7 service with object detection, logo recognition, and brand mapping
✓ **Professional Detection Results**: Delivers accurate object names, categories, brands, confidence scores, and bounding boxes
✓ **Seamless User Experience**: Created guided setup process that maintains session persistence across all future scans

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Responsive Design**: Mobile-first approach with a maximum width of 430px to simulate mobile app experience

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with proper error handling and logging middleware
- **File Upload**: Multer for handling multipart form data and image uploads
- **Session Management**: Express sessions with PostgreSQL storage

### Database Layer
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL via Neon serverless with connection pooling
- **Schema**: Structured tables for users, rooms, detected objects, and search caching
- **Migrations**: Drizzle Kit for database schema management

### Authentication System
- **Provider**: Replit Auth using OpenID Connect (OIDC)
- **Session Storage**: PostgreSQL-backed sessions with configurable TTL
- **Security**: Row Level Security implementation to ensure data isolation between users

### AI/ML Integration
- **Object Detection**: Client-side TensorFlow.js integration for real-time object recognition
- **Image Processing**: Custom color extraction algorithms for dominant color analysis
- **Text Recognition**: Planned Firebase ML Kit integration for brand/label detection
- **Shape Detection**: Custom algorithms for basic geometric shape identification

### File Storage and Management
- **Image Handling**: In-memory storage with Multer, 10MB file size limits
- **Supported Formats**: Image files only with MIME type validation
- **Processing Pipeline**: Client-side image processing before upload to reduce server load

### Search and Caching Architecture
- **Multi-criteria Search**: Complex filtering system supporting category, color, shape, brand, and location-based queries
- **Query Optimization**: Search result caching with hash-based keys for performance
- **Real-time Updates**: Automatic cache invalidation when new data is added

### Component Architecture
- **Modular Design**: Separation of concerns with dedicated components for detection, search, and UI elements
- **Reusable Components**: Comprehensive UI component library with consistent theming
- **Feature-based Organization**: Code organized by functionality rather than technical layers

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18+ with TypeScript, React Query for data fetching
- **UI Framework**: Radix UI primitives with shadcn/ui component system
- **Styling**: Tailwind CSS with CSS variables for theming support
- **Build Tools**: Vite with TypeScript support and hot module replacement

### Database and ORM
- **Neon Database**: Serverless PostgreSQL with WebSocket support
- **Drizzle ORM**: Type-safe database operations with schema validation
- **Connection Pooling**: @neondatabase/serverless for optimized database connections

### Authentication Services
- **Replit Auth**: OpenID Connect integration for user authentication
- **Session Management**: connect-pg-simple for PostgreSQL session storage
- **Passport.js**: Authentication middleware with OpenID strategy

### AI/ML Services
- **TensorFlow.js**: Client-side machine learning for object detection
- **Image Processing**: Custom algorithms for color extraction and shape detection
- **Future Integrations**: Firebase ML Kit for advanced text recognition and object classification

### Development and Deployment
- **TypeScript**: Type safety across the entire application stack
- **ESBuild**: Fast bundling for production builds
- **PostCSS**: CSS processing with Autoprefixer
- **Development Tools**: Replit-specific plugins for error handling and cartographer integration

### Third-party Integrations
- **MagicPlan API**: Deep linking integration for professional room scanning
- **Geolocation Services**: High-precision GPS coordinate tracking (12-decimal places)
- **File Upload**: Multer for handling multipart form data
- **Date Utilities**: date-fns for timestamp formatting and manipulation