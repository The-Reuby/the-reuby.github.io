# Reuby Reader

A responsive React application for browsing *Reuby*, the Reuben College student magazine.

![Reuby Reader Screenshot](screenshots/screenshot.png)

## Features

- **Issue Selection**: Switch between different magazine issues
- **Table of Contents**: Browse articles with easy navigation
- **Multiple View Modes**: 
  - Single-page view (default on mobile)
  - Two-page spread (on larger screens)
- **Responsive Design**: Optimized for all devices
- **Lazy Loading**: Images load as you scroll
- **Keyboard Navigation**: Use arrow keys to navigate pages

## Technology Stack

- React 18 with TypeScript
- Tailwind CSS 3.4.17
- Framer Motion for animations
- Vite for fast development and building

## Project Structure

```
/public
  /magazines/
    /spring-2025/     # Example issue with page images (001.png, 002.png, etc.)
  /data/              # JSON data files
    issues.json       # Registry of all issues
    spring-2025.json  # Metadata for spring 2025 issue
/src
  /components         # React components
  /hooks              # Custom React hooks
  /types              # TypeScript type definitions
```

## Getting Started

### Prerequisites

- Node.js 16.0 or higher
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/reuby-reader.git
   cd reuby-reader
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open your browser and visit:
   ```
   http://localhost:5173
   ```

## Building for Production

```
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Adding New Issues

1. Add page images to `/public/magazines/[issue-slug]/` (named 001.png, 002.png, etc.)
2. Add issue metadata to `/public/data/issues.json`
3. Create a table of contents file at `/public/data/[issue-slug].json`

## License

The source code is MIT licensed. However, the content is not.
