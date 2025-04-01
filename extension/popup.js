// Tips that will rotate in the tips container
const tips = [
  "Click on any item to copy it to clipboard instantly",
  "Press Ctrl+F (⌘+F) to quickly search your clipboard history",
  "Double-tap Tab to quickly toggle the clipboard widget",
  "Hover over an item to see actions like pin, new tab, or delete",
  "Pin important items to keep them at the top of your history",
  "Search for text, links, or images using keywords",
  "Use ESC to clear search or close the widget",
  "Long text items can be expanded to show more",
  "Images and links are categorized for easy access",
  "Your clipboard history is stored locally for 48 hours",
  "Instant search finds any copied item in milliseconds"
];

// State variables
let items = [];
let expandedItem = null;
let copiedId = null;
let selectedItems = new Set();
let searchQuery = '';
let currentTipIndex = 0;
let tipRotationInterval = null;
let lastCopyTime = 0; // Add this to track when we last copied

// DOM elements
let itemsList = null;
let searchInput = null;
let clearSearchButton = null;
let themeToggle = null;
let themeIcon = null;
let closeButton = null;
let tipText = null;
let emptyState = null;
let noResults = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  // Get DOM elements
  itemsList = document.getElementById('itemsList');
  searchInput = document.getElementById('searchInput');
  clearSearchButton = document.getElementById('clearSearchButton');
  themeToggle = document.getElementById('themeToggle');
  themeIcon = document.getElementById('themeIcon');
  closeButton = document.getElementById('closeButton');
  tipText = document.getElementById('tipText');
  emptyState = document.getElementById('emptyState');
  noResults = document.getElementById('noResults');

  // Load items from storage
  await loadItems();

  // Set up event listeners
  setupEventListeners();

  // Start tip rotation
  startTipRotation();

  // Load theme
  loadTheme();

  // Focus search input when popup opens
  const focusSearchInput = () => {
    if (searchInput) {
      searchInput.focus();
    } else {
      // Try again in case the element wasn't ready
      setTimeout(focusSearchInput, 100);
    }
  };

  setTimeout(focusSearchInput, 100);

  // Log debug info
  console.log('Clipboard widget initialized');
});

// Load clipboard items from storage
async function loadItems() {
  try {
    const result = await chrome.storage.local.get('items');
    const storedItems = result.items || [];
    const now = Date.now();

    // Filter out items older than 48 hours
    items = storedItems.filter(item => now - item.timestamp < 48 * 60 * 60 * 1000);

    // Ensure all pinned items have a pinTimestamp
    items.forEach(item => {
      if (item.isPinned && !item.pinTimestamp) {
        item.pinTimestamp = item.timestamp; // default to item creation time
      }
    });

    // Sort items: pinned first (sorted by pin timestamp), then by timestamp
    items.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      if (a.isPinned && b.isPinned) {
        // For pinned items, sort by pin timestamp (most recent first)
        return (b.pinTimestamp || 0) - (a.pinTimestamp || 0);
      }
      return b.timestamp - a.timestamp;
    });

    // Save filtered items back to storage
    if (items.length !== storedItems.length) {
      chrome.storage.local.set({ items });
    }

    renderItems();

    // Show a message if debug is needed
    if (items.length === 0) {
      console.log('No clipboard items found in storage');
    } else {
      console.log(`Loaded ${items.length} clipboard items`);
    }
  } catch (error) {
    console.error('Error loading items:', error);
  }
}

// Set up event listeners
function setupEventListeners() {
  // Search input event
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.trim().toLowerCase();
    clearSearchButton.style.display = searchQuery ? 'flex' : 'none';
    renderItems();
  });

  // Clear search button event
  clearSearchButton.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchButton.style.display = 'none';
    renderItems();
    searchInput.focus();
  });

  // Theme toggle event
  themeToggle.addEventListener('click', () => {
    toggleTheme();
  });

  // Close button event
  closeButton.addEventListener('click', () => {
    closeWidget();
  });

  // Keyboard events
  document.addEventListener('keydown', (e) => {
    // Ctrl+F or Cmd+F to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      searchInput.focus();
    }

    // Escape to clear search or close
    if (e.key === 'Escape') {
      if (searchQuery) {
        searchInput.value = '';
        searchQuery = '';
        clearSearchButton.style.display = 'none';
        renderItems();
        searchInput.focus();
        e.preventDefault();
      } else {
        closeWidget();
      }
    }
  });

  // Listen for storage changes to update in real-time
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.items) {
      items = changes.items.newValue || [];
      renderItems();
    }
  });
}

// Close widget by sending message to parent
function closeWidget() {
  // Try both methods to close the widget
  // Method 1: Send message to parent if we're in an iframe
  try {
    window.parent.postMessage({ action: 'closeClipboardWidget' }, '*');
  } catch (e) {
    console.error('Error posting message to parent:', e);
  }

  // Method 2: Use window.close() as fallback
  try {
    window.close();
  } catch (e) {
    console.error('Error closing window:', e);
  }
}

// Render clipboard items based on current state
function renderItems() {
  // Filter items based on search query
  const filteredItems = items.filter(item => {
    if (!searchQuery) return true;
    return item.content.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Clear items list
  itemsList.innerHTML = '';

  // Update header actions based on selection state
  const headerActions = document.querySelector('.header-actions');
  const existingDeleteButton = headerActions.querySelector('.delete-selected-button');
  const existingClearSelectionButton = headerActions.querySelector('.clear-selection-button');

  if (selectedItems.size > 0) {
    // Add delete button if not already there
    if (!existingDeleteButton) {
      const deleteButton = document.createElement('button');
      deleteButton.className = 'icon-button delete-selected-button';
      deleteButton.title = `Delete ${selectedItems.size} selected item(s)`;
      deleteButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 text-red-600 dark:text-red-400"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
      deleteButton.addEventListener('click', () => {
        removeItems(Array.from(selectedItems));
      });
      headerActions.insertBefore(deleteButton, headerActions.firstChild);
    } else {
      // Update existing button title
      existingDeleteButton.title = `Delete ${selectedItems.size} selected item(s)`;
    }

    // Add clear selection button if not already there
    if (!existingClearSelectionButton) {
      const clearSelectionButton = document.createElement('button');
      clearSelectionButton.className = 'icon-button clear-selection-button';
      clearSelectionButton.title = `Clear selection (${selectedItems.size} items)`;
      clearSelectionButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
      clearSelectionButton.addEventListener('click', () => {
        selectedItems.clear();
        renderItems();
      });
      headerActions.insertBefore(clearSelectionButton, existingDeleteButton ? existingDeleteButton.nextSibling : headerActions.firstChild);
    } else {
      // Update existing button title
      existingClearSelectionButton.title = `Clear selection (${selectedItems.size} items)`;
    }
  } else {
    // Remove buttons if no items selected
    if (existingDeleteButton) {
      headerActions.removeChild(existingDeleteButton);
    }
    if (existingClearSelectionButton) {
      headerActions.removeChild(existingClearSelectionButton);
    }
  }

  // Show appropriate empty state
  if (filteredItems.length === 0) {
    if (searchQuery) {
      emptyState.style.display = 'none';
      noResults.style.display = 'flex';
    } else {
      emptyState.style.display = 'flex';
      noResults.style.display = 'none';
    }
  } else {
    emptyState.style.display = 'none';
    noResults.style.display = 'none';

    // Create and append items
    filteredItems.forEach(item => {
      const itemElement = createItemElement(item);
      itemsList.appendChild(itemElement);
    });
  }
}

// Create DOM element for a clipboard item
function createItemElement(item) {
  const itemElement = document.createElement('div');
  itemElement.className = 'clipboard-item';
  itemElement.dataset.id = item.id;

  if (item.isPinned) {
    itemElement.classList.add('pinned-item');
  }

  if (expandedItem === item.id) {
    itemElement.classList.add('item-expanded');
  }

  if (selectedItems.has(item.id)) {
    itemElement.classList.add('selected');
  }

  // Create item content container
  const contentContainer = document.createElement('div');
  contentContainer.className = 'item-content';

  // Create type icon
  const typeIcon = document.createElement('div');
  typeIcon.className = `item-type ${item.type}`;

  let iconSvg = '';
  switch(item.type) {
    case 'link':
      iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>';
      break;
    case 'image':
      iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
      break;
    default: // text
      iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>';
  }

  typeIcon.innerHTML = iconSvg;
  contentContainer.appendChild(typeIcon);

  // Create text container
  const textContainer = document.createElement('div');
  textContainer.className = 'item-text';

  // Create text content
  if (item.type === 'link') {
    const linkContent = document.createElement('p');
    linkContent.className = 'link-content';
    linkContent.textContent = item.content;
    textContainer.appendChild(linkContent);
  } else {
    const textContent = document.createElement('div');
    textContent.className = 'text-content';

    // Preserve whitespace and line breaks
    if (item.content.includes('\n')) {
      // For multiline content, use pre-wrap to preserve formatting
      textContent.style.whiteSpace = 'pre-wrap';
      textContent.style.wordBreak = 'break-word';
      textContent.textContent = item.content;
    } else {
      // For single line content
      textContent.textContent = item.content;
    }

    textContainer.appendChild(textContent);
  }

  // Add image preview if applicable
  if (item.type === 'image' || (item.type === 'link' && isImageUrl(item.content))) {
    const imgPreview = document.createElement('img');
    imgPreview.src = item.content;
    imgPreview.className = 'item-preview';
    imgPreview.onerror = () => {
      imgPreview.style.display = 'none';
    };
    textContainer.appendChild(imgPreview);
  }

  contentContainer.appendChild(textContainer);
  itemElement.appendChild(contentContainer);

  // Create item actions
  const actionsContainer = document.createElement('div');
  actionsContainer.className = 'item-actions';

  // Pin button
  const pinButton = document.createElement('button');
  pinButton.className = `action-button pin-button ${item.isPinned ? 'pinned' : ''}`;
  pinButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 16.24Z"></path></svg>';
  pinButton.title = item.isPinned ? 'Unpin item' : 'Pin item';
  pinButton.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePin(item.id);
  });
  actionsContainer.appendChild(pinButton);

  // Add appropriate action buttons based on item type
  if (item.type === 'link') {
    const openButton = document.createElement('button');
    openButton.className = 'action-button open-button';
    openButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>';
    openButton.title = 'Open in new tab';
    openButton.addEventListener('click', (e) => {
      e.stopPropagation();
      chrome.tabs.create({ url: item.content });
    });
    actionsContainer.appendChild(openButton);
  }

  if (item.type === 'image' || (item.type === 'link' && isImageUrl(item.content))) {
    const downloadButton = document.createElement('button');
    downloadButton.className = 'action-button download-button';
    downloadButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>';
    downloadButton.title = 'Download image';
    downloadButton.addEventListener('click', (e) => {
      e.stopPropagation();
      chrome.downloads.download({ url: item.content });
    });
    actionsContainer.appendChild(downloadButton);
  }

  if (item.type === 'text' && item.content.length > 150) {
    const expandButton = document.createElement('button');
    expandButton.className = 'action-button expand-button';
    if (expandedItem === item.id) {
      expandButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>';
      expandButton.title = 'Collapse text';
    } else {
      expandButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>';
      expandButton.title = 'Expand text';
    }
    expandButton.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleExpand(item.id);
    });
    actionsContainer.appendChild(expandButton);
  }

  // Select button
  const selectButton = document.createElement('button');
  selectButton.className = `action-button select-button ${selectedItems.has(item.id) ? 'selected' : ''}`;
  if (selectedItems.has(item.id)) {
    selectButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  } else {
    selectButton.innerHTML = '<div style="width: 12px; height: 12px; border: 1px solid currentColor; border-radius: 2px;"></div>';
  }
  selectButton.title = selectedItems.has(item.id) ? 'Unselect item' : 'Select item';
  selectButton.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleSelection(item.id);
  });
  actionsContainer.appendChild(selectButton);

  // Delete button
  const deleteButton = document.createElement('button');
  deleteButton.className = 'action-button delete-item-button';
  deleteButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
  deleteButton.title = 'Delete item';
  deleteButton.addEventListener('click', (e) => {
    e.stopPropagation();
    removeItems([item.id]);
  });
  actionsContainer.appendChild(deleteButton);

  itemElement.appendChild(actionsContainer);

  // Add copied indicator if needed
  if (copiedId === item.id) {
    const copiedIndicator = document.createElement('div');
    copiedIndicator.className = 'item-copied';
    copiedIndicator.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Copied</span>';
    itemElement.appendChild(copiedIndicator);
  }

  // Add click event to copy item content
  itemElement.addEventListener('click', function() {
    // If in selection mode, toggle selection instead of copying
    if (selectedItems.size > 0) {
      toggleSelection(item.id);
      return;
    }

    // Prevent double-clicking from triggering multiple copies
    const now = Date.now();
    if (now - lastCopyTime < 1000) {
      return; // Ignore clicks within 1 second of the last copy
    }
    lastCopyTime = now;

    // Fallback copy method - more compatible with different browsers
    const textArea = document.createElement('textarea');
    textArea.value = item.content;
    textArea.style.position = 'fixed';  // Avoid scrolling to bottom
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    let successful = false;
    try {
      successful = document.execCommand('copy');
      if (successful) {
        copiedId = item.id;
        renderItems(); // Re-render to show copied indicator

        // Hide copied indicator after 1.5 seconds
        setTimeout(function() {
          copiedId = null;
          renderItems();
        }, 1500);
      } else {
        console.error('Fallback copy was unsuccessful');
      }
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }

    document.body.removeChild(textArea);

    // If fallback didn't work, try the modern approach
    if (!successful) {
      navigator.clipboard.writeText(item.content)
        .then(function() {
          copiedId = item.id;
          renderItems();

          setTimeout(function() {
            copiedId = null;
            renderItems();
          }, 1500);
        })
        .catch(function(err) {
          console.error('Clipboard API error:', err);
        });
    }
  });

  return itemElement;
}

// Start tip rotation
function startTipRotation() {
  if (tipRotationInterval) {
    clearInterval(tipRotationInterval);
  }

  tipText.textContent = tips[currentTipIndex];

  tipRotationInterval = setInterval(() => {
    currentTipIndex = (currentTipIndex + 1) % tips.length;

    // Animate tip change - current tip fades up and out
    tipText.style.opacity = '0';
    tipText.style.transform = 'translateY(-20px)';
    tipText.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

    setTimeout(() => {
      // Prepare new tip to enter from below
      tipText.style.transition = 'none';
      tipText.style.transform = 'translateY(20px)';
      tipText.textContent = tips[currentTipIndex];

      // Small delay before animating in
      setTimeout(() => {
        tipText.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        tipText.style.opacity = '1';
        tipText.style.transform = 'translateY(0)';
      }, 20);
    }, 300);
  }, 7000);
}

// Toggle pin status of an item
async function togglePin(id) {
  try {
    const item = items.find(item => item.id === id);
    if (!item) return;

    // Check maximum pins (3)
    if (!item.isPinned) {
      const pinnedCount = items.filter(item => item.isPinned).length;
      if (pinnedCount >= 3) {
        // In a real widget we'd show a toast here
        console.warn('Maximum of 3 items can be pinned');
        return;
      }
    }

    // Update pin status
    item.isPinned = !item.isPinned;

    // If pinned, update pinTimestamp to current time
    if (item.isPinned) {
      item.pinTimestamp = Date.now();
    } else {
      item.pinTimestamp = 0;
    }

    // Sort items: pinned first (sorted by pin timestamp), then unpinned by timestamp
    items.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      if (a.isPinned && b.isPinned) {
        // For pinned items, sort by pin timestamp (most recent first)
        return (b.pinTimestamp || 0) - (a.pinTimestamp || 0);
      }
      // For unpinned items, sort by regular timestamp
      return b.timestamp - a.timestamp;
    });

    // Save to storage
    await chrome.storage.local.set({ items });

    // Re-render
    renderItems();
  } catch (error) {
    console.error('Error toggling pin:', error);
  }
}

// Toggle expanded state of an item
function toggleExpand(id) {
  expandedItem = expandedItem === id ? null : id;
  renderItems();
}

// Toggle selection of an item
function toggleSelection(id) {
  if (selectedItems.has(id)) {
    selectedItems.delete(id);
  } else {
    selectedItems.add(id);
  }
  renderItems();
}

// Remove items from storage
async function removeItems(ids) {
  try {
    // Filter out items to remove
    items = items.filter(item => !ids.includes(item.id));

    // Save to storage
    await chrome.storage.local.set({ items });

    // Clear selection if needed
    if (ids.includes(expandedItem)) {
      expandedItem = null;
    }

    selectedItems = new Set([...selectedItems].filter(id => !ids.includes(id)));

    // Re-render
    renderItems();
  } catch (error) {
    console.error('Error removing items:', error);
  }
}

// Check if a URL is an image
function isImageUrl(url) {
  return (
    url.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/i) ||
    url.match(/\/(img|image|photo|pic|picture)\//i) ||
    url.includes('imgur.com') ||
    url.includes('ibb.co') ||
    url.includes('postimg.cc') ||
    url.includes('cloudinary.com') ||
    url.includes('images.unsplash.com')
  );
}

// Load theme from storage
async function loadTheme() {
  try {
    const result = await chrome.storage.local.get('settings');
    const settings = result.settings || {};
    const theme = settings.theme || 'light';

    applyTheme(theme);
  } catch (error) {
    console.error('Error loading theme:', error);
  }
}

// Toggle between light and dark theme
async function toggleTheme() {
  try {
    const result = await chrome.storage.local.get('settings');
    const settings = result.settings || {};
    const currentTheme = settings.theme || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    // Update settings
    settings.theme = newTheme;
    await chrome.storage.local.set({ settings });

    // Apply theme
    applyTheme(newTheme);
  } catch (error) {
    console.error('Error toggling theme:', error);
  }
}

// Apply theme to document
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);

  // Update theme icon
  if (theme === 'dark') {
    themeIcon.innerHTML = '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"></path>';
  } else {
    themeIcon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
  }
}

// Listen for messages from the parent window
window.addEventListener('message', function(event) {
  // Check if the message is coming from our content script
  if (event.data.action === 'closeWidget') {
    closeWidget();
  }
});
