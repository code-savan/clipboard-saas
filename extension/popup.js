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
let clearSearchFromEmpty = null;

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
  clearSearchFromEmpty = document.getElementById('clearSearchFromEmpty');

  // Load items from storage
  await loadItems();

  // Set up event listeners
  setupEventListeners();

  // Start tip rotation
  startTipRotation();

  // Load theme
  loadTheme();

  // Focus search input
  setTimeout(() => {
    searchInput.focus();
  }, 300);

  // Reload items every 2 seconds to catch new ones
  setInterval(async () => {
    await loadItems();
  }, 2000);

  // Log debug info
  console.log('Clipboard widget initialized');

  // Add animations CSS
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(5px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes fadeOut {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(5px); }
    }
  `;
  document.head.appendChild(style);
});

// Load clipboard items from storage
async function loadItems() {
  try {
    const result = await chrome.storage.local.get('items');
    const storedItems = result.items || [];
    const now = Date.now();

    // Filter out items older than 48 hours
    items = storedItems.filter(item => now - item.timestamp < 48 * 60 * 60 * 1000);

    // Sort items: pinned first, then by timestamp
    items.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.timestamp - a.timestamp;
    });

    // Save filtered items back to storage
    if (items.length !== storedItems.length) {
      try {
        await chrome.storage.local.set({ items });
      } catch (storageError) {
        // Handle storage error silently
        console.warn('Could not save filtered items:', storageError);
      }
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

    // Handle "Extension context invalidated" error gracefully
    if (error.message && error.message.includes('Extension context invalidated')) {
      console.log('Extension context was invalidated. The page needs to be refreshed.');

      // Show a message to the user instead of just failing
      itemsList.innerHTML = `
        <div style="padding: 20px; text-align: center;">
          <p>The extension was updated or reloaded.</p>
          <p>Please close and reopen the clipboard widget.</p>
        </div>
      `;

      // Try to automatically recover by reloading after a short delay
      setTimeout(() => {
        try {
          window.location.reload();
        } catch (reloadError) {
          console.warn('Could not automatically reload:', reloadError);
        }
      }, 3000);
    }
  }
}

// Set up event listeners
function setupEventListeners() {
  // Search input event
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.trim().toLowerCase();
    renderItems();
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
        renderItems();
        searchInput.focus();
        e.preventDefault();
      } else {
        closeWidget();
      }
    }
  });

  // Track double-tap of Tab key
  let lastTabPress = 0;
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      const now = Date.now();
      const timeDiff = now - lastTabPress;

      // Check if this is a double-tap (within 500ms)
      if (timeDiff < 500 && timeDiff > 0) {
        e.preventDefault();
        closeWidget();
      }

      lastTabPress = now;
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
    return item.content.toLowerCase().includes(searchQuery);
  });

  // Clear items list
  itemsList.innerHTML = '';

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
  itemElement.dataset.type = item.type;

  if (item.isPinned) {
    itemElement.classList.add('pinned-item');
  }

  if (expandedItem === item.id) {
    itemElement.classList.add('item-expanded');
  }

  if (selectedItems.has(item.id)) {
    itemElement.classList.add('selected-item');
  }

  // Add shadow similar to ClipboardWidget.tsx
  itemElement.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
  itemElement.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease';

  if (item.type === 'link') {
    itemElement.style.background = 'linear-gradient(to bottom right, white, rgba(239, 246, 255, 0.5))';
  } else if (item.type === 'image') {
    itemElement.style.background = 'linear-gradient(to bottom right, white, rgba(245, 243, 255, 0.5))';
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
    const textContent = document.createElement('p');
    textContent.className = 'text-content';
    textContent.textContent = item.content;
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
  pinButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>';
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

    // Style similar to ClipboardWidget.tsx
    copiedIndicator.style.position = 'absolute';
    copiedIndicator.style.bottom = '4px';
    copiedIndicator.style.right = '8px';
    copiedIndicator.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
    copiedIndicator.style.color = 'rgb(16, 185, 129)';
    copiedIndicator.style.fontSize = '12px';
    copiedIndicator.style.padding = '2px 8px';
    copiedIndicator.style.borderRadius = '9999px';
    copiedIndicator.style.display = 'flex';
    copiedIndicator.style.alignItems = 'center';
    copiedIndicator.style.gap = '4px';
    copiedIndicator.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
    copiedIndicator.style.animation = 'fadeIn 0.3s ease-in-out';

    // Content with check icon and appropriate text
    const checkIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

    let copiedText = 'Copied';
    if (items.find(item => item.id === id)?.type === 'link') {
      const content = items.find(item => item.id === id)?.content || '';
      copiedText = content.length > 20 ? content.substring(0, 20) + '...' : content;
    }

    copiedIndicator.innerHTML = `${checkIcon}<span>${copiedText}</span>`;
    itemElement.appendChild(copiedIndicator);
  }

  // Add click event to copy item content
  itemElement.addEventListener('click', () => {
    // If in selection mode, toggle selection instead of copying
    if (selectedItems.size > 0) {
      toggleSelection(item.id);
      return;
    }

    copyToClipboard(item.content, item.id);
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

    // Animate tip change
    tipText.style.opacity = '0';
    tipText.style.transform = 'translateY(-5px)';

    setTimeout(() => {
      tipText.textContent = tips[currentTipIndex];
      tipText.style.opacity = '1';
      tipText.style.transform = 'translateY(0)';
    }, 300);
  }, 7000);
}

// Copy content to clipboard
async function copyToClipboard(content, id) {
  try {
    // Try to use the Clipboard API first
    await navigator.clipboard.writeText(content);
    showCopiedIndicator(id);
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);

    // If Clipboard API fails, try fallback methods
    if (error.name === 'NotAllowedError' ||
        error.message?.includes('permissions policy') ||
        error.message?.includes('permission')) {

      console.log('Using fallback copy method due to permissions restrictions');

      try {
        // Fallback 1: Use execCommand (deprecated but works in most browsers)
        const textArea = document.createElement('textarea');
        textArea.value = content;

        // Make the textarea out of viewport
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);

        textArea.focus();
        textArea.select();

        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (successful) {
          showCopiedIndicator(id);
        } else {
          // Fallback 2: Show manual copy instructions
          showManualCopyInstructions(content, id);
        }
      } catch (fallbackError) {
        console.error('Fallback copy also failed:', fallbackError);
        showManualCopyInstructions(content, id);
      }
    } else {
      // For other errors, show a simple error message
      alert('Could not copy to clipboard. Please try again.');
    }
  }
}

// Show copied indicator after successful copy
function showCopiedIndicator(id) {
  // Prevent indicator flickering by checking if we're already showing this indicator
  if (copiedId === id) return;

  // Show copied indicator
  copiedId = id;

  // Add the indicator directly to avoid full re-render
  const itemElement = document.querySelector(`.clipboard-item[data-id="${id}"]`);
  if (itemElement) {
    // Remove any existing indicators first
    const existingIndicator = itemElement.querySelector('.item-copied');
    if (existingIndicator) {
      itemElement.removeChild(existingIndicator);
    }

    const copiedIndicator = document.createElement('div');
    copiedIndicator.className = 'item-copied';

    // Style similar to ClipboardWidget.tsx
    copiedIndicator.style.position = 'absolute';
    copiedIndicator.style.bottom = '4px';
    copiedIndicator.style.right = '8px';
    copiedIndicator.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
    copiedIndicator.style.color = 'rgb(16, 185, 129)';
    copiedIndicator.style.fontSize = '12px';
    copiedIndicator.style.padding = '2px 8px';
    copiedIndicator.style.borderRadius = '9999px';
    copiedIndicator.style.display = 'flex';
    copiedIndicator.style.alignItems = 'center';
    copiedIndicator.style.gap = '4px';
    copiedIndicator.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
    copiedIndicator.style.animation = 'fadeIn 0.3s ease-in-out';

    // Content with check icon and appropriate text
    const checkIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

    let copiedText = 'Copied';
    if (items.find(item => item.id === id)?.type === 'link') {
      const content = items.find(item => item.id === id)?.content || '';
      copiedText = content.length > 20 ? content.substring(0, 20) + '...' : content;
    }

    copiedIndicator.innerHTML = `${checkIcon}<span>${copiedText}</span>`;
    itemElement.appendChild(copiedIndicator);
  } else {
    // Fall back to re-rendering if we can't find the element
    renderItems();
  }

  // Hide after 2 seconds
  setTimeout(() => {
    copiedId = null;

    // Remove the indicator directly instead of re-rendering
    const itemElement = document.querySelector(`.clipboard-item[data-id="${id}"]`);
    if (itemElement) {
      const indicator = itemElement.querySelector('.item-copied');
      if (indicator) {
        // Add fade-out animation
        indicator.style.animation = 'fadeOut 0.3s ease-in-out';
        setTimeout(() => {
          if (indicator.parentNode === itemElement) {
            itemElement.removeChild(indicator);
          }
        }, 280);
      }
    } else {
      // Fall back to re-rendering if we can't find the element
      renderItems();
    }
  }, 2000);
}

// Show manual copy instructions when all copy methods fail
function showManualCopyInstructions(content, id) {
  // Create and show a modal with the content to copy
  const modal = document.createElement('div');
  modal.className = 'manual-copy-modal';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  modal.style.zIndex = '1000';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';

  const modalContent = document.createElement('div');
  modalContent.style.backgroundColor = 'white';
  modalContent.style.padding = '20px';
  modalContent.style.borderRadius = '8px';
  modalContent.style.maxWidth = '90%';
  modalContent.style.maxHeight = '80%';
  modalContent.style.overflow = 'auto';
  modalContent.style.position = 'relative';

  const closeButton = document.createElement('button');
  closeButton.innerHTML = '&times;';
  closeButton.style.position = 'absolute';
  closeButton.style.top = '10px';
  closeButton.style.right = '10px';
  closeButton.style.border = 'none';
  closeButton.style.background = 'none';
  closeButton.style.fontSize = '20px';
  closeButton.style.cursor = 'pointer';
  closeButton.style.fontWeight = 'bold';

  const instructions = document.createElement('p');
  instructions.textContent = 'Unable to automatically copy. Please select and copy this text manually:';
  instructions.style.marginBottom = '10px';

  const textArea = document.createElement('textarea');
  textArea.value = content;
  textArea.style.width = '100%';
  textArea.style.minHeight = '100px';
  textArea.style.padding = '8px';
  textArea.style.marginBottom = '10px';
  textArea.style.border = '1px solid #ccc';
  textArea.style.borderRadius = '4px';
  textArea.onclick = function() {
    this.select();
  };

  const doneButton = document.createElement('button');
  doneButton.textContent = 'Done';
  doneButton.style.padding = '8px 16px';
  doneButton.style.backgroundColor = '#4f46e5';
  doneButton.style.color = 'white';
  doneButton.style.border = 'none';
  doneButton.style.borderRadius = '4px';
  doneButton.style.cursor = 'pointer';

  modalContent.appendChild(closeButton);
  modalContent.appendChild(instructions);
  modalContent.appendChild(textArea);
  modalContent.appendChild(doneButton);
  modal.appendChild(modalContent);

  document.body.appendChild(modal);

  // Auto-select the text for easy copying
  setTimeout(() => {
    textArea.select();
  }, 100);

  // Close on button clicks
  closeButton.onclick = doneButton.onclick = function() {
    document.body.removeChild(modal);

    // Still show the copied indicator for UX consistency
    showCopiedIndicator(id);
  };
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

    // Sort items
    items.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
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
    settings.hasExplicitTheme = true; // Mark that user has explicitly set a theme
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
