// Detect browser type
const isFirefox = typeof browser !== 'undefined' && browser.runtime && browser.runtime.getBrowserInfo;
const storage = isFirefox ? browser.storage : chrome.storage;

// Current active tab
let activeTab = 'adhoc';

// Load saved API URL
storage.sync.get(['apiUrl'], (result) => {
  if (result.apiUrl) {
    document.getElementById('apiUrl').value = result.apiUrl;
  }
});

// Save API URL when changed
document.getElementById('apiUrl').addEventListener('change', (e) => {
  storage.sync.set({ apiUrl: e.target.value });
});

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    switchTab(tab);
  });
});

function switchTab(tab) {
  activeTab = tab;
  
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
  
  // Update forms
  document.querySelectorAll('.task-form').forEach(f => {
    f.classList.toggle('active', f.id === `${tab}Form`);
  });
  
  // Focus appropriate input
  setTimeout(() => {
    if (tab === 'adhoc') {
      document.getElementById('adhocTitle')?.focus();
    } else {
      document.getElementById('normalTitle')?.focus();
      // Set default deadline to today if not set
      const deadlineInput = document.getElementById('normalDeadline');
      if (!deadlineInput.value) {
        const today = new Date();
        today.setDate(today.getDate() + 1); // Default to tomorrow
        deadlineInput.value = today.toISOString().split('T')[0];
      }
    }
  }, 50);
}

// Handle keyboard shortcut (Chrome/Edge only - Firefox handles via manifest)
if (!isFirefox && chrome.commands) {
  chrome.commands.onCommand.addListener((command) => {
    if (command === 'quick-task') {
      // Focus the popup if it's open
      const activeInput = activeTab === 'adhoc' 
        ? document.getElementById('adhocTitle')
        : document.getElementById('normalTitle');
      activeInput?.focus();
    }
  });
}

// Ad-hoc Task Form submission
document.getElementById('adhocForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const title = document.getElementById('adhocTitle').value.trim();
  const description = document.getElementById('adhocDesc').value.trim();
  const apiUrl = getApiUrl();
  
  if (!title) {
    showStatus('Please enter a task title', 'error');
    return;
  }
  
  await submitTask({
    title,
    description: description || null,
    startDate: new Date().toISOString().split('T')[0],
    deadline: new Date().toISOString().split('T')[0],
    status: 'completed',
    importance: 3,
    isAdhocTask: true,
  }, 'adhocSubmitBtn', apiUrl);
});

// Normal Task Form submission
document.getElementById('normalForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const title = document.getElementById('normalTitle').value.trim();
  const description = document.getElementById('normalDesc').value.trim();
  const deadline = document.getElementById('normalDeadline').value;
  const importance = parseInt(document.getElementById('normalImportance').value);
  const status = document.getElementById('normalStatus').value;
  const apiUrl = getApiUrl();
  
  if (!title || !deadline) {
    showStatus('Please fill in all required fields', 'error');
    return;
  }
  
  // Set start date to today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  await submitTask({
    title,
    description: description || null,
    startDate: today.toISOString().split('T')[0],
    deadline,
    status,
    importance,
    isAdhocTask: false,
  }, 'normalSubmitBtn', apiUrl);
});

function getApiUrl() {
  return document.getElementById('apiUrl').value.trim() || 'https://availabilitywebtool.vercel.app';
}

async function submitTask(taskData, submitBtnId, apiUrl) {
  const submitBtn = document.getElementById(submitBtnId);
  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoader = submitBtn.querySelector('.btn-loader');
  
  // Disable button and show loading
  submitBtn.disabled = true;
  btnText.style.display = 'none';
  btnLoader.style.display = 'inline';
  hideStatus();
  
  try {
    const response = await fetch(`${apiUrl}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication
      body: JSON.stringify(taskData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to create task');
    }
    
    // Success!
    showStatus('✓ Task added successfully!', 'success');
    
    // Save API URL to storage
    storage.sync.set({ apiUrl: apiUrl });
    
    // Clear form based on active tab
    if (activeTab === 'adhoc') {
      document.getElementById('adhocTitle').value = '';
      document.getElementById('adhocDesc').value = '';
      document.getElementById('adhocTitle').focus();
    } else {
      document.getElementById('normalTitle').value = '';
      document.getElementById('normalDesc').value = '';
      // Reset deadline to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      document.getElementById('normalDeadline').value = tomorrow.toISOString().split('T')[0];
      document.getElementById('normalImportance').value = '3';
      document.getElementById('normalStatus').value = 'pending';
      document.getElementById('normalTitle').focus();
    }
    
    // Auto-close after 1.5 seconds
    setTimeout(() => {
      window.close();
    }, 1500);
    
  } catch (error) {
    console.error('Error creating task:', error);
    
    let errorMessage = 'Failed to add task';
    
    if (error.message.includes('Unauthorized') || error.message.includes('401')) {
      errorMessage = 'Please log in to the app first';
    } else if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
      errorMessage = 'Network error. Check your connection and API URL';
    } else {
      errorMessage = error.message || 'Unknown error occurred';
    }
    
    showStatus(errorMessage, 'error');
    
  } finally {
    // Re-enable button
    submitBtn.disabled = false;
    btnText.style.display = 'inline';
    btnLoader.style.display = 'none';
  }
}

function showStatus(message, type = 'info') {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.className = `status-message show ${type}`;
}

function hideStatus() {
  const statusEl = document.getElementById('status');
  statusEl.className = 'status-message';
}

// Auto-focus title field when popup opens
document.getElementById('adhocTitle').focus();

// Handle Enter key in title fields (submit form)
document.getElementById('adhocTitle').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    document.getElementById('adhocForm').dispatchEvent(new Event('submit'));
  }
});

document.getElementById('normalTitle').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    document.getElementById('normalForm').dispatchEvent(new Event('submit'));
  }
});

// Initialize deadline to tomorrow for normal tasks
window.addEventListener('load', () => {
  const deadlineInput = document.getElementById('normalDeadline');
  if (deadlineInput && !deadlineInput.value) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    deadlineInput.value = tomorrow.toISOString().split('T')[0];
  }
});
