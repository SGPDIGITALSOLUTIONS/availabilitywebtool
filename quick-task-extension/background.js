// Background service worker for Chrome/Edge
// Handles keyboard shortcut commands

chrome.commands.onCommand.addListener((command) => {
  if (command === 'quick-task') {
    // Open the extension popup
    chrome.action.openPopup();
  }
});
