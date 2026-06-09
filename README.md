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
- **PDF-direct reading**: Renders a single web-optimized PDF per issue via pdf.js,
  streaming only the pages in view (HTTP range requests) — no per-page image export
- **Lazy Loading**: Pages render as you scroll; off-screen pages are released to bound memory
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
    reuby2.pdf        # Web-optimized, linearized PDF per issue (read directly by pdf.js)
  /data/              # JSON data files
    issues.json       # Registry of all issues (source: "pdf" + pdfUrl per issue)
    reuby2.json       # Table of contents / article metadata for an issue
/src
  /components
    PdfPageViewer.tsx # Renders an issue's PDF on demand via pdf.js
    PageViewer.tsx    # Legacy PNG viewer (fallback when source !== "pdf")
  /utils/pdf.ts       # pdf.js worker setup + range-streaming loader
  /hooks              # Custom React hooks
  /types              # TypeScript type definitions
/tools
  optimize_pdf.sh     # Downsamples + linearizes a source PDF for web delivery
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

The source code is The GNU General Public License (GPL) Licensed (GPLv3). However, the content of magazines is not.

##  Magazine Content Licence

The editorial content contained in the **/magazine/**, **/images/**,  **/data/** directory (including articles, poetry, photographs, artwork, page layouts, and any other creative material) is **not** distributed under the The GNU General Public License (GPL) License (GPLv3).  

Unless an individual file or folder explicitly states otherwise, **all rights are reserved** by the respective authors and/or Reuby Magazine.

You **may not** reproduce, modify, distribute, or create derivative works from this content without prior written permission from the copyright holder(s). 
