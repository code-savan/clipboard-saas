// Initialize storage with default settings
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['items', 'settings'], (result) => {
    if (!result.items) {
      chrome.storage.local.set({ items: [] });
    }

    if (!result.settings) {
      // Default to light theme - service workers can't access window.matchMedia
      let defaultTheme = 'light';

      // We'll use the prefers-color-scheme in the content script later
      chrome.storage.local.set({
        settings: {
          maxItems: 100,
          autoSave: true,
          notifications: false, // Disable notifications by default
          theme: defaultTheme,
          hideFloatingButton: false,
          hasExplicitTheme: false
        }
      });
    } else if (result.settings && typeof result.settings.hideFloatingButton === 'undefined') {
      // Update existing settings if they don't have the hideFloatingButton property
      const settings = result.settings;
      settings.hideFloatingButton = false;
      settings.notifications = false; // Ensure notifications are disabled
      chrome.storage.local.set({ settings });
    }
  });

  // Notify any existing content scripts that extension was reloaded
  // This helps recover from "Extension context invalidated" errors
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.url && tab.url.startsWith('http')) {
        try {
          chrome.tabs.sendMessage(tab.id, {
            action: 'extensionReloaded'
          }).catch(() => {
            // Ignore errors as some tabs might not have content script loaded
          });
        } catch (e) {
          // Ignore errors
        }
      }
    });
  });

  // We can't listen for system color scheme changes here,
  // we'll do that in the content script instead
});

// Add a context menu item to toggle the floating button
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'toggleButton',
    title: 'Toggle Floating Button',
    contexts: ['action']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === 'toggleButton') {
    // Toggle the hideFloatingButton setting
    chrome.storage.local.get(['settings'], (result) => {
      const settings = result.settings || {};
      settings.hideFloatingButton = !settings.hideFloatingButton;
      chrome.storage.local.set({ settings });

      // Broadcast to all tabs to update the button state
      toggleFloatingButtonOnAllTabs(settings.hideFloatingButton);
    });
  }
});

// Function to toggle the floating button on all tabs
function toggleFloatingButtonOnAllTabs(hide) {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'toggleFloatingButton',
        hide
      }).catch(() => {
        // Ignore errors as some tabs might not have content script loaded
      });
    });
  });
}

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'clipboardEvent':
      handleCopyEvent(message.data);
      break;
    case 'themeChanged':
      handleThemeChange(message.theme);
      break;
    case 'clipboardCaptureResult':
      // Log the result of forced clipboard capture for debugging
      if (message.success) {
        console.log('Forced clipboard capture successful:', message.data.text);
      } else {
        console.error('Forced clipboard capture failed:', message.error);
      }
      break;
    case 'detectSystemTheme':
      // Tabs can tell us their detected theme - we'll use the first one
      handleThemeChange(message.theme, false);
      break;
  }
  return true;
});

// Track recent items to prevent duplicates within short timeframes
const recentItems = new Set();
const RECENT_ITEM_TIMEOUT = 3000; // 3 seconds

// Handle copy events
async function handleCopyEvent(data) {
  try {
    const { text, url } = data;
    if (!text || !text.trim()) return;

    // Create a unique key for this item combining content and time
    const itemKey = `${text.substring(0, 50)}`;

    // Check if we've recently processed this item
    if (recentItems.has(itemKey)) {
      return;
    }

    // Add to recent items and set timeout to remove
    recentItems.add(itemKey);
    setTimeout(() => {
      recentItems.delete(itemKey);
    }, RECENT_ITEM_TIMEOUT);

    // Get current settings
    const result = await chrome.storage.local.get('settings');
    const settings = result.settings || { autoSave: true, maxItems: 100 };

    if (!settings.autoSave) return;

    // Get current items
    const { items = [] } = await chrome.storage.local.get('items');

    // Check if this content already exists
    if (items.some(item => item.content === text)) {
      // If the item exists but is not at the top, move it to the top
      const existingIndex = items.findIndex(item => item.content === text);
      if (existingIndex > 0) {
        const item = items[existingIndex];
        // Only update the timestamp if it's not pinned
        if (!item.isPinned) {
          item.timestamp = Date.now();
          // Remove and reinsert
          items.splice(existingIndex, 1);
          items.unshift(item);
          // Sort for pinned items
          items.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return b.timestamp - a.timestamp;
          });
          await chrome.storage.local.set({ items });
        }
      }
      return;
    }

    // Create new item
    const newItem = {
      id: Date.now().toString(),
      content: text,
      type: determineItemType(text),
      timestamp: Date.now(),
      isPinned: false,
      source: url
    };

    // Add new item to the beginning of the list
    items.unshift(newItem);

    // Sort items (pinned first)
    items.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.timestamp - a.timestamp;
    });

    // Limit items based on settings
    const maxItems = settings.maxItems || 100;
    if (items.length > maxItems) {
      const unpinnedItems = items.filter(item => !item.isPinned);
      const pinnedItems = items.filter(item => item.isPinned);

      // Keep all pinned items, but limit unpinned ones
      unpinnedItems.length = Math.min(unpinnedItems.length, maxItems - pinnedItems.length);
      items.length = 0;
      items.push(...pinnedItems, ...unpinnedItems);

      // Re-sort items
      items.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.timestamp - a.timestamp;
      });
    }

    await chrome.storage.local.set({ items });

    // Notifications removed
  } catch (error) {
    console.error('Error handling copy event:', error);
  }
}

// Handle theme changes
async function handleThemeChange(theme, isExplicit = true) {
  try {
    const result = await chrome.storage.local.get('settings');
    const settings = result.settings || {};

    // Only update if explicit change or no explicit preference set
    if (isExplicit || !settings.hasExplicitTheme) {
      settings.theme = theme;
      if (isExplicit) {
        settings.hasExplicitTheme = true;
      }
      await chrome.storage.local.set({ settings });
    }
  } catch (error) {
    console.error('Error handling theme change:', error);
  }
}

// Determine item type
function determineItemType(text) {
  // Check if it's a URL
  if (text.match(/^https?:\/\//i)) {
    // Check if it's an image URL
    if (text.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/i) ||
        text.match(/\/(img|image|photo|pic|picture)\//i) ||
        text.includes('imgur.com') ||
        text.includes('ibb.co') ||
        text.includes('postimg.cc') ||
        text.includes('cloudinary.com') ||
        text.includes('images.unsplash.com')) {
      return 'image';
    }
    return 'link';
  }
  return 'text';
}

// When a tab is updated, check if we need to inject the floating button
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    chrome.storage.local.get(['settings'], (result) => {
      const settings = result.settings || {};
      // Send message to toggle the button based on settings
      chrome.tabs.sendMessage(tabId, {
        action: 'toggleFloatingButton',
        hide: settings.hideFloatingButton
      }).catch(() => {
        // Ignore errors from tabs where content script isn't loaded
      });
    });
  }
});

// Listen for keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle_popup') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'toggleWidget'
        }).catch(() => {
          // Ignore errors
        });
      }
    });
  }
});

// Add a click handler to the browser action icon to force clipboard capture
chrome.action.onClicked.addListener((tab) => {
  // Only try on valid tabs
  if (tab.url && tab.url.startsWith('http')) {
    // Send message to the content script to force clipboard capture
    chrome.tabs.sendMessage(tab.id, {
      action: 'forceCaptureClipboard'
    }).catch(error => {
      console.error('Error sending forceCaptureClipboard message:', error);
    });
  }
});
