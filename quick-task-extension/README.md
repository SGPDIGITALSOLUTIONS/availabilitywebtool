# Quick Ad-hoc Task Browser Extension

A browser extension to quickly add completed ad-hoc tasks to your productivity tracker without opening the main application.

## Features

- ✅ Quick task entry from any webpage
- ✅ Automatically marks tasks as completed
- ✅ Sets today's date automatically
- ✅ Keyboard shortcut support (`Ctrl+Shift+T` / `Cmd+Shift+T`)
- ✅ Works with existing authentication (cookie-based)
- ✅ Customizable API URL
- ✅ Cross-browser support (Chrome, Edge, Firefox)

## Installation

### Chrome/Edge (Chromium-based browsers)

1. Open Chrome or Edge and navigate to:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`

2. Enable **Developer mode** (toggle in the top right corner)

3. Click **"Load unpacked"** or **"Load extension"**

4. Select the `quick-task-extension` folder

5. The extension icon should now appear in your browser toolbar

### Firefox

1. Open Firefox and navigate to `about:debugging`

2. Click **"This Firefox"** in the left sidebar

3. Click **"Load Temporary Add-on..."**

4. Navigate to the `quick-task-extension` folder and select `manifest-firefox.json`

5. The extension will be loaded temporarily (you'll need to reload it after browser restart)

**Note:** For permanent installation in Firefox, you'll need to package and sign the extension through Firefox Add-on Developer Hub.

## Usage

### Quick Task Entry

1. **Click the extension icon** in your browser toolbar
2. Enter the task title (required)
3. Optionally add a description
4. Click **"Save as Completed"** or press **Enter**
5. The task is instantly added to your completed list for today!

### Keyboard Shortcut

Press `Ctrl+Shift+T` (Windows/Linux) or `Cmd+Shift+T` (Mac) to quickly open the extension popup.

### API URL Configuration

The extension defaults to `https://availabilitywebtool.vercel.app`. If you're using a different URL (e.g., for local development), you can change it in the popup form. The URL is saved automatically for future use.

## How It Works

The extension:
- Creates tasks with `status: 'completed'` and `isAdhocTask: true`
- Sets `completedAt` timestamp automatically
- Uses your existing browser session cookies for authentication
- Sends requests to the `/api/tasks` endpoint
- Tasks appear in your productivity reports immediately

## Troubleshooting

### "Please log in to the app first"

**Solution:** Make sure you're logged into the web application in the same browser. The extension uses your existing session cookies for authentication.

1. Open the main app in a new tab
2. Log in if you're not already logged in
3. Try the extension again

### Network Error / Failed to Fetch

**Possible causes:**
- API URL is incorrect
- CORS issues (check browser console)
- Network connectivity problems

**Solutions:**
1. Verify the API URL in the extension popup matches your deployment
2. Check browser console (F12) for detailed error messages
3. Ensure the API endpoint allows requests from browser extensions
4. For local development, use `http://localhost:3000`

### Tasks Not Appearing

**Check:**
1. Verify you're logged in to the app
2. Check the browser console for API errors
3. Verify the API URL is correct
4. Check that tasks are being created in the app's task list

### Extension Not Loading

**Chrome/Edge:**
- Make sure Developer mode is enabled
- Check that all required files are present
- Look for errors in `chrome://extensions/` page

**Firefox:**
- Use `manifest-firefox.json` instead of `manifest.json`
- Check `about:debugging` for error messages
- Ensure all icon files are present

## Development

### File Structure

```
quick-task-extension/
├── manifest.json              # Chrome/Edge manifest (Manifest V3)
├── manifest-firefox.json      # Firefox manifest (Manifest V2)
├── popup.html                 # Extension popup UI
├── popup.css                  # Popup styling
├── popup.js                   # Main extension logic
├── background.js              # Service worker (Chrome/Edge)
├── icons/                     # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   ├── icon128.png
│   ├── ICON_INSTRUCTIONS.md
│   └── generate-icons.html    # Tool to generate icons
└── README.md                  # This file
```

### Creating Icons

1. Open `icons/generate-icons.html` in a browser
2. Click "Generate Icons"
3. Right-click each canvas and save as PNG
4. Name them: `icon16.png`, `icon48.png`, `icon128.png`

Alternatively, use an online icon generator or design tool to create custom icons.

### Testing

1. Load the extension in your browser (see Installation)
2. Click the extension icon
3. Enter a test task
4. Verify it appears in the main application
5. Check that it shows up in productivity reports

### API Integration

The extension uses the existing API endpoint:
- **Endpoint:** `POST /api/tasks`
- **Authentication:** Cookie-based (existing session)
- **Payload:**
  ```json
  {
    "title": "Task title",
    "description": "Optional description",
    "startDate": "2026-01-14",
    "deadline": "2026-01-14",
    "status": "completed",
    "importance": 3,
    "isAdhocTask": true
  }
  ```

## Browser Compatibility

- ✅ Chrome 88+ (Manifest V3)
- ✅ Edge 88+ (Manifest V3)
- ✅ Firefox 109+ (Manifest V2)

## Security Notes

- The extension only sends data to the configured API URL
- Authentication relies on existing browser session cookies
- No sensitive data is stored in the extension
- API URL preference is stored locally in browser storage

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review browser console for error messages
3. Verify API endpoint is accessible
4. Ensure you're logged into the main application

## License

This extension is part of the Vision Care Reporting application.
