# Estate Calculator - Property Insurance Frontend

## Overview
Estate Calculator is a modern, user-friendly ReactJS application designed to calculate property insurance premiums. This frontend application provides a seamless multi-step form experience for users to input property details, select insurance coverage options, enter personal information, and review their insurance order.

## Live Demo
Check out the live application: [https://propcalc-dy7.pages.dev/](https://propcalc-dy7.pages.dev/)

## Features
- **Multi-step Form Process**: Intuitive 4-step form with smooth animations between steps
- **Property Information Collection**: Gather details about property location, type, and characteristics
- **Insurance Coverage Selection**: Choose from predefined packages or customize insurance coverage
- **Personal Information Management**: Collect and validate insurer details
- **Order Preview**: Review all entered information before submission
- **Responsive Design**: Fully responsive UI that works on desktop and mobile devices
- **Seamless Authentication**: Automatic JWT token management with refresh mechanism

## Technology Stack
- **React 18**: Modern React with hooks for state management
- **Material UI**: Component library for consistent UI elements
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Axios**: HTTP client for API communication
- **Vite**: Next-generation frontend build tool

## Architecture
The application follows a modular architecture with:
- **Components**: Reusable UI components organized by functionality
- **Services**: API communication and authentication logic
- **Assets**: Static resources like images and icons

## API Integration
The frontend communicates with a Symfony-based RESTful API to:
- Authenticate users (anonymous authentication)
- Fetch property and insurance data
- Submit insurance orders

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Git

### Installation
```bash
# Clone the repository
git clone [repository-url]

# Navigate to the project directory
cd client

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Adding a Remote GitHub Repository
To add a remote GitHub repository URL to your local Git repository, use the following command:

```bash
git remote add origin https://github.com/plamen911/propcalc-client.git
```

Where:
- `origin` is the name of the remote (you can use any name, but "origin" is conventional)
- `https://github.com/username/repository.git` is your GitHub repository URL

You can also use SSH instead of HTTPS:

```bash
git remote add origin git@github.com:plamen911/propcalc-client.git
```

To verify the remote was added successfully:

```bash
git remote -v
```

### Building for Production
```bash
npm run build
```

## Development
- **Development Mode**: `npm run dev`
- **Code Linting**: `npm run lint`
- **Production Preview**: `npm run preview`

## Authentication
The application uses JWT (JSON Web Token) authentication with anonymous users. Tokens expire after 1 hour, and the application automatically refreshes them to provide a seamless user experience.

## Deployment
The application is configured to be deployed to any static hosting service. The production build outputs optimized static files to the `dist` directory.

The application is currently deployed on Cloudflare Pages and accessible at [https://propcalc-dy7.pages.dev/](https://propcalc-dy7.pages.dev/).
