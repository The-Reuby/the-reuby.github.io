# Reuby Reader - Project Summary

## Overview

Reuby Reader is a responsive React application that allows users to browse through issues of the Reuben College student magazine "Reuby." The application provides a modern, intuitive interface for reading digital magazine content using image-based rendering.

## Key Features Implemented

1. **Issue Selection**
   - Global dropdown selector in the header
   - Smooth transition between issues
   - Loads appropriate image sets and metadata for each issue

2. **Table of Contents (TOC)**
   - Desktop: Persistent left sidebar showing the full table of contents
   - Mobile: Animated slide-in menu that can be toggled with a button
   - Each article entry shows title, author, and page numbers
   - Clicking an article navigates to its first page

3. **Page Viewer with Multiple Layout Modes**
   - Single-page view (default on mobile and narrow viewports)
   - Two-page spread view (on larger screens)
   - Lazy loading of images for performance
   - Page number indicators
   - Navigation controls (prev/next buttons)
   - Keyboard navigation support (left/right arrow keys)

4. **Responsive Design**
   - Optimized for phones, tablets, and desktop layouts
   - Adapts layout based on screen size
   - Proper spacing and sizing on various devices

5. **Visual Design & UX**
   - Glass-morphism cards and UI elements
   - Dark mode support
   - Smooth animations for transitions
   - Clean, modern aesthetics

## Technical Implementation

- **React 18 with TypeScript**: For type-safe component development
- **Tailwind CSS 3.4.17**: For responsive styling and theming
- **Framer Motion**: For animations (TOC slide-in/out)
- **Intersection Observer API**: For lazy loading images
- **CSS Grid & Flexbox**: For responsive layouts
- **Custom React Hooks**: For managing state and functionality

## Project Structure

- Clean, organized component structure
- Separation of concerns (components, hooks, types)
- JSON data store for issue registry and metadata
- Structured image assets for magazine pages

## Usage Workflow

1. User opens the application and sees the default issue
2. They can browse articles via the table of contents
3. Navigation through pages via scrolling or navigation controls
4. Switch between issues using the dropdown
5. Toggle between single and double-page views (on desktop)

## Future Enhancement Opportunities

- Search functionality across titles/authors
- Bookmarking pages in localStorage
- Automatic page pre-fetching
- Touch-friendly zoom on mobile
- Analytics to track reading patterns 