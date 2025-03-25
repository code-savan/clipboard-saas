// Create and inject the floating button and widget container
function createFloatingElements() {
  // Check if button should be hidden according to user preferences
  chrome.storage.local.get(['settings'], (result) => {
    const settings = result.settings || {};
    if (settings.hideFloatingButton) {
      return; // Don't create the button if user has disabled it
    }

    // Don't add multiple buttons to the same page
    if (document.querySelector('.clipboard-trigger')) {
      return;
    }

    // Create a container for both the button and widget
    const container = document.createElement('div');
    container.className = 'clipboard-container';
    container.setAttribute('data-extension-id', chrome.runtime.id);

    // Create the button
    const button = document.createElement('button');
    button.className = 'clipboard-trigger';
    button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v11a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
      </svg>
    `;

    // Create widget container (initially hidden)
    const widget = document.createElement('div');
    widget.className = 'clipboard-widget-container';
    widget.style.display = 'none';

    // Force maximum z-index to ensure elements are always on top
    container.style.zIndex = '2147483647'; // Maximum z-index value

    // Add elements to the DOM
    container.appendChild(widget);
    container.appendChild(button);
    document.body.appendChild(container);

    // Handle button click
    button.addEventListener('click', () => {
      toggleWidget(widget);
    });

    // Add pulsing animation to highlight the button initially
    setTimeout(() => {
      button.classList.add('pulse-animation');
      setTimeout(() => {
        button.classList.remove('pulse-animation');
      }, 2000);
    }, 1000);

    // Apply any saved position if available
    chrome.storage.local.get(['buttonPosition'], (result) => {
      if (result.buttonPosition) {
        container.style.bottom = result.buttonPosition.bottom || '24px';
        container.style.right = result.buttonPosition.right || '24px';

        if (result.buttonPosition.top && result.buttonPosition.left) {
          container.style.top = result.buttonPosition.top;
          container.style.left = result.buttonPosition.left;
          container.style.bottom = 'auto';
          container.style.right = 'auto';
        }
      }
    });

    // Make container draggable
    makeContainerDraggable(container, button);
  });
}

// Toggle widget visibility and load content
function toggleWidget(widgetContainer) {
  const isVisible = widgetContainer.style.display !== 'none';

  if (isVisible) {
    // Hide widget with animation
    widgetContainer.style.opacity = '0';
    widgetContainer.style.transform = 'scale(0.95) translateY(10px)';

    setTimeout(() => {
      widgetContainer.style.display = 'none';
    }, 200);
  } else {
    // Show widget with animation
    widgetContainer.style.display = 'block';
    widgetContainer.style.opacity = '0';
    widgetContainer.style.transform = 'scale(0.95) translateY(10px)';

    // Force browser to process the display change before animating
    setTimeout(() => {
      widgetContainer.style.opacity = '1';
      widgetContainer.style.transform = 'scale(1) translateY(0)';

      // Load the widget content if not already loaded
      if (!widgetContainer.querySelector('iframe')) {
        loadWidgetContent(widgetContainer);
      }
    }, 10);
  }
}

// Load the widget iframe
function loadWidgetContent(widgetContainer) {
  const iframe = document.createElement('iframe');
  iframe.src = chrome.runtime.getURL('popup.html');
  iframe.style.width = '400px';
  iframe.style.height = '500px';
  iframe.style.border = 'none';
  iframe.style.borderRadius = 'var(--radius, 12px)';
  iframe.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
  iframe.style.backgroundColor = 'transparent';

  widgetContainer.appendChild(iframe);

  // Handle click outside to close
  document.addEventListener('mousedown', (e) => {
    if (widgetContainer.style.display !== 'none') {
      const container = widgetContainer.closest('.clipboard-container');
      if (container && !container.contains(e.target)) {
        toggleWidget(widgetContainer);
      }
    }
  });

  // Handle Escape key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && widgetContainer.style.display !== 'none') {
      toggleWidget(widgetContainer);
    }
  });
}

// Function to make the container draggable
function makeContainerDraggable(container, handle) {
  let isDragging = false;
  let offset = { x: 0, y: 0 };

  handle.addEventListener('mousedown', (e) => {
    // Only proceed if it's a left-click and not on the SVG (allow clicking the button)
    if (e.button !== 0 || e.target.tagName === 'svg' || e.target.tagName === 'path') {
      return;
    }

    e.preventDefault();
    isDragging = true;

    // Calculate the offset
    const rect = container.getBoundingClientRect();
    offset.x = e.clientX - rect.left;
    offset.y = e.clientY - rect.top;

    // Add dragging class
    container.classList.add('dragging');
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    // Calculate new position
    const left = e.clientX - offset.x;
    const top = e.clientY - offset.y;

    // Apply new position ensuring the container stays within viewport
    container.style.left = `${Math.max(0, Math.min(left, window.innerWidth - container.offsetWidth))}px`;
    container.style.top = `${Math.max(0, Math.min(top, window.innerHeight - container.offsetHeight))}px`;

    // Remove default positioning
    container.style.bottom = 'auto';
    container.style.right = 'auto';
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;

    isDragging = false;
    container.classList.remove('dragging');

    // Save the new position
    const position = {
      bottom: container.style.bottom,
      right: container.style.right,
      // Also save pixel positions for top/left positioning
      top: container.style.top,
      left: container.style.left
    };

    chrome.storage.local.set({ buttonPosition: position });
  });
}

// Handle double-tap anywhere on the page
let lastTap = 0;
let lastTapPosition = { x: 0, y: 0 };

document.addEventListener('touchend', (e) => {
  const currentTime = new Date().getTime();
  const tapLength = currentTime - lastTap;

  if (tapLength < 500 && tapLength > 0) {
    // Check if the second tap is within 50px of the first tap
    const distance = Math.sqrt(
      Math.pow(e.changedTouches[0].clientX - lastTapPosition.x, 2) +
      Math.pow(e.changedTouches[0].clientY - lastTapPosition.y, 2)
    );

    if (distance < 50) {
      const widgetContainer = document.querySelector('.clipboard-widget-container');
      if (widgetContainer) {
        toggleWidget(widgetContainer);
      }
    }
  }

  lastTap = currentTime;
  lastTapPosition = {
    x: e.changedTouches[0].clientX,
    y: e.changedTouches[0].clientY
  };
});

// Improved clipboard monitoring
let lastCopiedText = '';
let isMonitoring = true;

// Poll clipboard periodically to catch items even when events aren't fired
function startClipboardMonitoring() {
  setInterval(async () => {
    if (!isMonitoring) return;

    try {
      // Only try to read the clipboard if the document has focus
      if (document.hasFocus()) {
        const text = await navigator.clipboard.readText();

        if (text && text.trim() && text !== lastCopiedText) {
          lastCopiedText = text;

          const currentUrl = window.location.href;
          chrome.runtime.sendMessage({
            action: 'clipboardEvent',
            data: {
              text: text,
              url: currentUrl
            }
          });
        }
      }
    } catch (error) {
      // Don't log the error to avoid console spam
      // Some sites block clipboard access
    }
  }, 1000);
}

// Handle clipboard events (copy/cut)
function handleClipboardEvent(e) {
  setTimeout(async () => {
    try {
      // Give browser time to process the copy operation
      const selectedText = window.getSelection().toString().trim();
      const currentUrl = window.location.href;

      if (selectedText) {
        lastCopiedText = selectedText;

        chrome.runtime.sendMessage({
          action: 'clipboardEvent',
          data: {
            text: selectedText,
            url: currentUrl
          }
        });
      } else {
        // Try reading from clipboard directly as fallback
        const clipText = await navigator.clipboard.readText();
        if (clipText && clipText.trim() && clipText !== lastCopiedText) {
          lastCopiedText = clipText;

          chrome.runtime.sendMessage({
            action: 'clipboardEvent',
            data: {
              text: clipText,
              url: currentUrl
            }
          });
        }
      }
    } catch (error) {
      // Ignore errors (some sites block clipboard access)
    }
  }, 100);
}

// Handle Tab double-press for toggling the widget
let lastTabPress = 0;

document.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    const now = Date.now();
    const timeDiff = now - lastTabPress;

    // Check if this is a double-tap (within 500ms)
    if (timeDiff < 500 && timeDiff > 0) {
      const widgetContainer = document.querySelector('.clipboard-widget-container');
      if (widgetContainer) {
        e.preventDefault();
        toggleWidget(widgetContainer);
      }
    }

    lastTabPress = now;
  }
});

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'toggleFloatingButton') {
    const container = document.querySelector('.clipboard-container');
    if (container && message.hide) {
      container.remove();
    } else if (!container && !message.hide) {
      createFloatingElements();
    }
  } else if (message.action === 'toggleWidget') {
    const widgetContainer = document.querySelector('.clipboard-widget-container');
    if (widgetContainer) {
      toggleWidget(widgetContainer);
    }
  } else if (message.action === 'forceCaptureClipboard') {
    // Directly ask for clipboard content and force capture it
    navigator.clipboard.readText().then(text => {
      if (text && text.trim()) {
        const currentUrl = window.location.href;
        chrome.runtime.sendMessage({
          action: 'clipboardEvent',
          data: {
            text: text,
            url: currentUrl
          }
        });
        // Notify of success
        chrome.runtime.sendMessage({
          action: 'clipboardCaptureResult',
          success: true,
          data: { text }
        });
      } else {
        // Notify of empty clipboard
        chrome.runtime.sendMessage({
          action: 'clipboardCaptureResult',
          success: false,
          error: 'Clipboard is empty'
        });
      }
    }).catch(error => {
      // Notify of error
      chrome.runtime.sendMessage({
        action: 'clipboardCaptureResult',
        success: false,
        error: error.message
      });
    });
  }
});

// Initialize
createFloatingElements();
startClipboardMonitoring();

// Add event listeners
document.addEventListener('copy', handleClipboardEvent);
document.addEventListener('cut', handleClipboardEvent);
document.addEventListener('paste', handleClipboardEvent);

// Listen for theme changes
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.attributeName === 'data-theme') {
      const theme = document.documentElement.getAttribute('data-theme');
      chrome.runtime.sendMessage({ action: 'themeChanged', theme });
    }
  });
});

observer.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['data-theme']
});

// Listen for messages from the iframe to close the widget
window.addEventListener('message', (event) => {
  if (event.data.action === 'closeClipboardWidget') {
    const widgetContainer = document.querySelector('.clipboard-widget-container');
    if (widgetContainer) {
      toggleWidget(widgetContainer);
    }
  }
});
