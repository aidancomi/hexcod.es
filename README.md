# hexcod.es

A static single-page application for displaying hex colors with URL-based routing. Share colors easily by visiting `hexcod.es/000000` or `hexcod.es/fff`.

## Features

- **URL-Based Color Display**: Navigate to any hex code via URL (e.g., `/000000` or `/fff`)
- **Color Picker**: Use the browser's built-in color picker to select colors
- **Fullscreen Mode**: Press `F` or click the fullscreen button to view color only
- **Download**: Download the current color as a PNG image
- **Copy to Clipboard**: One-click copy of the hex code
- **Responsive Design**: Works on desktop and mobile devices
- **Keyboard Shortcuts**: 
  - `F` - Toggle fullscreen mode
  - `Escape` - Exit fullscreen mode
  - `Enter` - Apply manually entered hex code

## Usage

### Via URL
Simply navigate to `hexcod.es/{hexcode}` where `{hexcode}` is either:
- 3-digit hex: `hexcod.es/fff`
- 6-digit hex: `hexcod.es/ffffff`

The hash symbol (`#`) is optional in the URL.

### Via Color Picker
1. Click the color picker on the homepage
2. Select your desired color
3. The URL updates automatically

### Fullscreen Mode
- Click the "Fullscreen" button, or
- Press the `F` key
- Press `F` again or `Escape` to exit

### Download
Click the "Download" button to save the current color as a PNG image (1920x1080).

### Copy to Clipboard
Click the "Copy" button to copy the hex code (with `#`) to your clipboard.

## GitHub Pages Deployment

This site is designed to be hosted on GitHub Pages. Simply:
1. Push the files to a GitHub repository
2. Enable GitHub Pages in repository settings
3. The site will be available at `https://{username}.github.io/{repository-name}/`

For a custom domain like `hexcod.es`, configure the domain in GitHub Pages settings.

## Browser Support

Works in all modern browsers that support:
- CSS custom properties
- ES6 JavaScript
- Canvas API
- Clipboard API (with fallback)

## File Structure

```
hexcod.es/
├── index.html          # Main HTML file
├── styles.css          # All styling
├── script.js           # Main application logic
├── README.md           # This file
└── .gitignore          # Git ignore file
```

## License

This project is open source and available for use.
