const form = document.querySelector('#download-form');
const input = document.querySelector('#url-input');
const clearButton = document.querySelector('#clear-button');
const dropZone = document.querySelector('#drop-zone');
const statusArea = document.querySelector('#status-area');
const statusText = document.querySelector('#status-text');
const endpointInput = document.querySelector('#endpoint-input');
const settingsToggle = document.querySelector('#settings-toggle');
const settings = document.querySelector('#settings');
const saveEndpoint = document.querySelector('#save-endpoint');
const recentList = document.querySelector('#recent-list');
const emptyState = document.querySelector('#empty-state');
const clearHistory = document.querySelector('#clear-history');

const defaultEndpoint = 'https://api.cobalt.tools/api/json';
let history = readHistory();

function readHistory() {
  try {
    return JSON.parse(localStorage.getItem('dropfile-history') || '[]');
  } catch {
    return [];
  }
}

function saveHistory() {
  localStorage.setItem('dropfile-history', JSON.stringify(history.slice(0, 6)));
}

function showStatus(message, isError = false, busy = false) {
  statusArea.hidden = false;
  statusArea.classList.toggle('error', isError);
  statusArea.querySelector('.loader').hidden = !busy;
  statusText.textContent = message;
}

function hideStatus() {
  statusArea.hidden = true;
  statusArea.classList.remove('error');
}

function validUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

function getEndpoint() {
  return localStorage.getItem('dropfile-endpoint') || defaultEndpoint;
}

function renderHistory() {
  recentList.replaceChildren();
  emptyState.hidden = history.length > 0;
  clearHistory.hidden = history.length === 0;
  if (history.length === 0) {
    recentList.append(emptyState);
    return;
  }

  history.forEach((item) => {
    const row = document.createElement('article');
    row.className = 'history-item';
    const info = document.createElement('div');
    info.className = 'history-info';
    const title = document.createElement('div');
    title.className = 'history-title';
    title.textContent = item.title;
    title.title = item.url;
    const meta = document.createElement('div');
    meta.className = 'history-meta';
    meta.textContent = `${item.type || 'media'} · ${item.date}`;
    info.append(title, meta);
    const button = document.createElement('button');
    button.className = 'redownload';
    button.type = 'button';
    button.textContent = 'Download ↗';
    button.addEventListener('click', () => resolveAndDownload(item.url));
    row.append(info, button);
    recentList.append(row);
  });
}

function addToHistory(url, type = 'media') {
  history = [{
    url,
    title: new URL(url).hostname.replace(/^www\./, ''),
    type,
    date: new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date()),
  }, ...history.filter((item) => item.url !== url)].slice(0, 6);
  saveHistory();
  renderHistory();
}

function triggerDownload(url) {
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener';
  link.download = '';
  document.body.append(link);
  link.click();
  link.remove();
}

async function resolveAndDownload(url) {
  if (!validUrl(url)) {
    showStatus('Paste a complete http or https link.', true);
    input.focus();
    return;
  }

  showStatus('Finding the file behind your link...', false, true);
  const endpoint = getEndpoint();

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, downloadMode: 'auto', filenameStyle: 'pretty' }),
    });
    const result = await response.json();
    if (!response.ok || result.status === 'error') {
      throw new Error(result.error?.code || 'The service could not resolve this link.');
    }

    const mediaUrl = result.url || result.audio?.url || result.video?.url;
    if (!mediaUrl) throw new Error('No downloadable file was returned.');
    triggerDownload(mediaUrl);
    addToHistory(url, result.type || 'media');
    showStatus('Download started. Check your browser downloads.', false, false);
  } catch (error) {
    showStatus(`${error.message} You can try another service in settings.`, true);
  }
}

input.addEventListener('input', () => {
  clearButton.hidden = input.value.length === 0;
});

clearButton.addEventListener('click', () => {
  input.value = '';
  clearButton.hidden = true;
  hideStatus();
  input.focus();
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  resolveAndDownload(input.value.trim());
});

['dragenter', 'dragover'].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add('dragging');
  });
});
['dragleave', 'drop'].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove('dragging');
  });
});
dropZone.addEventListener('drop', (event) => {
  const droppedText = event.dataTransfer.getData('text').trim();
  if (droppedText) {
    input.value = droppedText;
    clearButton.hidden = false;
    input.focus();
  }
});

settingsToggle.addEventListener('click', () => {
  const isOpen = !settings.hidden;
  settings.hidden = isOpen;
  settingsToggle.setAttribute('aria-expanded', String(!isOpen));
});

saveEndpoint.addEventListener('click', () => {
  if (!validUrl(endpointInput.value)) {
    showStatus('Enter a valid service URL.', true);
    return;
  }
  localStorage.setItem('dropfile-endpoint', endpointInput.value.trim());
  showStatus('Service endpoint saved.', false, false);
});

clearHistory.addEventListener('click', () => {
  history = [];
  saveHistory();
  renderHistory();
});

endpointInput.value = getEndpoint();
renderHistory();
