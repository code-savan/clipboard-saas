// DOM elements
const statusEl = document.getElementById('status');
const itemCountEl = document.getElementById('itemCount');
const itemsEl = document.getElementById('items');
const settingsEl = document.getElementById('settings');
const clipboardContentEl = document.getElementById('clipboardContent');
const widgetToggle = document.getElementById('widgetToggle');

// Buttons
const refreshBtn = document.getElementById('refresh');
const clearItemsBtn = document.getElementById('clearItems');
const readClipboardBtn = document.getElementById('readClipboard');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  loadData();
  setupListeners();

  // Initialize widget toggle state
  try {
    const { settings = {} } = await chrome.storage.local.get('settings');
    widgetToggle.checked = !settings.hideFloatingButton;
    console.log('Widget toggle initialized:', widgetToggle.checked);
  } catch (error) {
    console.error('Error initializing widget toggle:', error);
  }

  // Add event listener for widget toggle
  widgetToggle.addEventListener('change', async () => {
    try {
      console.log('Toggle changed to:', widgetToggle.checked);
      const { settings = {} } = await chrome.storage.local.get('settings');
      settings.hideFloatingButton = !widgetToggle.checked;

      // First save the settings
      await chrome.storage.local.set({ settings });

      // Update all existing tabs
      const tabs = await chrome.tabs.query({});
      console.log(`Sending toggle message to ${tabs.length} tabs`);

      const updatePromises = tabs
        .filter(tab => tab.url && tab.url.startsWith('http'))
        .map(tab => {
          return new Promise(resolve => {
            try {
              chrome.tabs.sendMessage(
                tab.id,
                { action: 'toggleFloatingButton', hide: settings.hideFloatingButton },
                response => {
                  const success = response && response.success;
                  console.log(`Tab ${tab.id}: ${success ? 'updated' : 'failed'}`);
                  resolve(success);
                }
              );
            } catch (err) {
              console.log(`Could not update tab ${tab.id}: ${err?.message}`);
              resolve(false);
            }
          });
        });

      // Wait for all tab updates to complete
      await Promise.all(updatePromises);
      console.log('All tabs updated');

    } catch (error) {
      console.error('Error updating widget visibility:', error);
    }
  });

  // Listen for storage changes to keep toggle in sync
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.settings && changes.settings.newValue) {
      const newSettings = changes.settings.newValue;
      widgetToggle.checked = !newSettings.hideFloatingButton;
      console.log('Widget toggle updated from storage:', widgetToggle.checked);
    }
  });

  // Listen for changes to storage
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      if (changes.items) {
        // Update the items count and display
        const items = changes.items.newValue || [];
        itemCountEl.textContent = items.length;
        if (items.length === 0) {
          itemsEl.innerHTML = '<p>No clipboard items found in storage.</p>';
        } else {
          renderItems(items);
        }
      }

      if (changes.settings) {
        // Update settings display
        const settings = changes.settings.newValue || {};
        settingsEl.textContent = JSON.stringify(settings, null, 2);
      }

      // Add a notification that storage changed
      const notification = document.createElement('div');
      notification.className = 'notification';
      notification.textContent = `Storage updated at ${new Date().toLocaleTimeString()}`;
      notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        animation: fadeInOut 3s forwards;
      `;

      document.body.appendChild(notification);

      // Remove notification after 3 seconds
      setTimeout(() => {
        notification.remove();
      }, 3000);
    }
  });

  // Add the fadeInOut animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInOut {
      0% { opacity: 0; transform: translateY(20px); }
      10% { opacity: 1; transform: translateY(0); }
      90% { opacity: 1; transform: translateY(0); }
      100% { opacity: 0; transform: translateY(-20px); }
    }
  `;
  document.head.appendChild(style);
});

// Load data from storage
async function loadData() {
  try {
    // Display extension info
    const manifest = chrome.runtime.getManifest();
    statusEl.innerHTML = `
      <p><strong>Extension:</strong> ${manifest.name} v${manifest.version}</p>
      <p><strong>Permissions:</strong> ${manifest.permissions.join(', ')}</p>
    `;

    // Get and display items
    const { items = [] } = await chrome.storage.local.get('items');
    itemCountEl.textContent = items.length;

    if (items.length === 0) {
      itemsEl.innerHTML = '<p>No clipboard items found in storage.</p>';
    } else {
      renderItems(items);
    }

    // Get and display settings
    const { settings = {} } = await chrome.storage.local.get('settings');
    settingsEl.textContent = JSON.stringify(settings, null, 2);
  } catch (error) {
    statusEl.innerHTML = `<p style="color: red">Error: ${error.message}</p>`;
    console.error('Error loading data:', error);
  }
}

// Setup event listeners
function setupListeners() {
  refreshBtn.addEventListener('click', loadData);

  clearItemsBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear all clipboard items?')) {
      try {
        await chrome.storage.local.set({ items: [] });
        loadData();
      } catch (error) {
        alert(`Error clearing items: ${error.message}`);
      }
    }
  });

  readClipboardBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      clipboardContentEl.innerHTML = `
        <p style="margin-top: 10px"><strong>Current clipboard content:</strong></p>
        <pre style="margin-top: 5px">${text || '(empty)'}</pre>
      `;
    } catch (error) {
      clipboardContentEl.innerHTML = `<p style="color: red">Error reading clipboard: ${error.message}</p>`;
    }
  });
}

// Render clipboard items
function renderItems(items) {
  const html = items.map(item => {
    const date = new Date(item.timestamp);
    const formattedDate = date.toLocaleString();

    return `
      <div class="item ${item.isPinned ? 'pinned' : ''}">
        <div class="item-content">${escapeHtml(limitString(item.content, 100))}</div>
        <div class="item-meta">
          <span class="label ${item.type}">${item.type}</span>
          <span>${formattedDate}</span>
          ${item.isPinned ? '<span class="label" style="background: #f59e0b; color: white;">Pinned</span>' : ''}
          ${item.source ? `<span>From: ${item.source}</span>` : ''}
        </div>
      </div>
    `;
  }).join('');

  itemsEl.innerHTML = html;
}

// Helper function to limit string length
function limitString(str, maxLength) {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}

// Helper function to escape HTML
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
