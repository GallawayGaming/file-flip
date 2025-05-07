/**
 * File Flip Web Application
 * Performs client-side file conversions using browser APIs
 */

// App state
const appState = {
  currentCategory: null,
  selectedFiles: [],
  outputFormat: null,
  conversionOptions: {},
  conversionResults: [],
  deferredPrompt: null // For PWA installation prompt
};

// Format definitions and conversion support
const formatDefinitions = {
  images: {
    title: "Convert Images",
    accepts: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'],
    outputFormats: [
      { value: 'png', label: 'PNG - Portable Network Graphics' },
      { value: 'jpeg', label: 'JPEG - Joint Photographic Experts Group' },
      { value: 'webp', label: 'WebP - Modern Image Format' },
      { value: 'gif', label: 'GIF - Graphics Interchange Format' }
    ],
    optionFields: {
      jpeg: [
        { id: 'quality', label: 'Quality', type: 'range', min: 1, max: 100, value: 85, step: 1 }
      ],
      webp: [
        { id: 'quality', label: 'Quality', type: 'range', min: 1, max: 100, value: 85, step: 1 }
      ],
      png: [
        { id: 'compressionLevel', label: 'Compression Level', type: 'range', min: 1, max: 9, value: 6, step: 1 }
      ]
    }
  },
  documents: {
    title: "Convert Documents",
    accepts: ['.txt', '.md', '.html', '.rtf', '.doc', '.docx', '.odt', '.pdf'],
    outputFormats: [
      { value: 'txt', label: 'TXT - Plain Text' },
      { value: 'pdf', label: 'PDF - Portable Document Format' },
      { value: 'md', label: 'MD - Markdown' },
      { value: 'html', label: 'HTML - HyperText Markup Language' }
    ],
    optionFields: {}
  },
  audio: {
    title: "Convert Audio",
    accepts: ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'],
    outputFormats: [
      { value: 'mp3', label: 'MP3 - MPEG Audio Layer III' },
      { value: 'wav', label: 'WAV - Waveform Audio File Format' },
      { value: 'ogg', label: 'OGG - Ogg Vorbis Audio Format' }
    ],
    optionFields: {
      mp3: [
        { id: 'bitrate', label: 'Bitrate (kbps)', type: 'select', options: [
          { value: '128', label: '128 kbps' },
          { value: '192', label: '192 kbps' },
          { value: '256', label: '256 kbps' },
          { value: '320', label: '320 kbps' }
        ], value: '192' }
      ],
      wav: [
        { id: 'sampleRate', label: 'Sample Rate', type: 'select', options: [
          { value: '44100', label: '44.1 kHz' },
          { value: '48000', label: '48 kHz' },
          { value: '96000', label: '96 kHz' }
        ], value: '44100' }
      ]
    }
  },
  video: {
    title: "Convert Video",
    accepts: ['.mp4', '.webm', '.mov', '.avi', '.mkv'],
    outputFormats: [
      { value: 'mp4', label: 'MP4 - MPEG-4 Part 14' },
      { value: 'webm', label: 'WebM - Web Video Format' }
    ],
    optionFields: {
      mp4: [
        { id: 'quality', label: 'Quality', type: 'select', options: [
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' }
        ], value: 'medium' }
      ],
      webm: [
        { id: 'quality', label: 'Quality', type: 'select', options: [
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' }
        ], value: 'medium' }
      ]
    }
  }
};

// DOM Elements
const elements = {
  categoryCards: document.querySelectorAll('.category-card'),
  fileSelectionSection: document.getElementById('file-selection-section'),
  converterTitle: document.getElementById('converter-title'),
  fileInput: document.getElementById('file-input'),
  fileSelectionHelp: document.getElementById('file-selection-help'),
  outputFormat: document.getElementById('output-format'),
  conversionOptions: document.getElementById('conversion-options'),
  convertButton: document.getElementById('convert-button'),
  conversionProgressSection: document.getElementById('conversion-progress-section'),
  overallProgress: document.getElementById('overall-progress'),
  fileProgressList: document.getElementById('file-progress-list'),
  resultsSection: document.getElementById('results-section'),
  resultsList: document.getElementById('results-list'),
  downloadAllButton: document.getElementById('download-all-button'),
  installAppButton: document.getElementById('install-app'),
  feedbackToast: document.getElementById('feedback-toast'),
  toastTitle: document.getElementById('toast-title'),
  toastMessage: document.getElementById('toast-message')
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  initCategorySelection();
  initFileInput();
  initFormatSelection();
  initConvertButton();
  initDownloadAllButton();
  initInstallPrompt();
  initFromURLParams();
  
  // Toast initialization with Bootstrap
  const toastElList = document.querySelectorAll('.toast');
  const toastList = [...toastElList].map(toastEl => new bootstrap.Toast(toastEl, { autohide: true, delay: 5000 }));
});

// Check if we should handle URL params
function initFromURLParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const category = urlParams.get('category');
  
  if (category && formatDefinitions[category]) {
    // Simulate clicking the category card
    document.querySelector(`.category-card[data-category="${category}"]`)?.click();
  }
}

// Initialize category selection
function initCategorySelection() {
  elements.categoryCards.forEach(card => {
    card.addEventListener('click', () => {
      const category = card.getAttribute('data-category');
      selectCategory(category);
    });
  });
}

// Select a conversion category
function selectCategory(category) {
  if (!formatDefinitions[category]) return;
  
  // Update UI
  elements.categoryCards.forEach(card => {
    if (card.getAttribute('data-category') === category) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });
  
  // Update state
  appState.currentCategory = category;
  appState.selectedFiles = [];
  appState.outputFormat = null;
  
  // Update converter section
  elements.converterTitle.textContent = formatDefinitions[category].title;
  elements.fileSelectionHelp.textContent = `Supported formats: ${formatDefinitions[category].accepts.join(', ')}`;
  elements.fileSelectionSection.classList.remove('d-none');
  
  // Reset file input
  elements.fileInput.value = '';
  
  // Update output format options
  updateOutputFormatOptions();
  
  // Reset conversion options
  elements.conversionOptions.innerHTML = '';
  
  // Disable convert button until files are selected
  elements.convertButton.disabled = true;
  
  // Hide results and progress sections
  elements.conversionProgressSection.classList.add('d-none');
  elements.resultsSection.classList.add('d-none');
  
  // Scroll to the file selection section
  elements.fileSelectionSection.scrollIntoView({ behavior: 'smooth' });
}

// Initialize file input
function initFileInput() {
  elements.fileInput.addEventListener('change', (event) => {
    handleFileSelection(event.target.files);
  });
}

// Handle file selection
function handleFileSelection(fileList) {
  if (!fileList || fileList.length === 0) {
    elements.convertButton.disabled = true;
    return;
  }
  
  const category = appState.currentCategory;
  const acceptedExtensions = formatDefinitions[category].accepts;
  
  // Filter files by accepted extensions
  appState.selectedFiles = Array.from(fileList).filter(file => {
    const fileName = file.name.toLowerCase();
    return acceptedExtensions.some(ext => fileName.endsWith(ext));
  });
  
  // Update UI based on selection
  if (appState.selectedFiles.length > 0) {
    elements.convertButton.disabled = appState.outputFormat ? false : true;
    showToast('info', 'Files Selected', `${appState.selectedFiles.length} files selected for conversion.`);
  } else {
    elements.convertButton.disabled = true;
    showToast('warning', 'No Valid Files', 'None of the selected files are in a supported format.');
  }
}

// Initialize format selection
function initFormatSelection() {
  elements.outputFormat.addEventListener('change', (event) => {
    const format = event.target.value;
    if (format) {
      appState.outputFormat = format;
      updateConversionOptions(format);
      elements.convertButton.disabled = appState.selectedFiles.length === 0;
    } else {
      appState.outputFormat = null;
      elements.conversionOptions.innerHTML = '';
      elements.convertButton.disabled = true;
    }
  });
}

// Update output format dropdown options
function updateOutputFormatOptions() {
  const category = appState.currentCategory;
  const formats = formatDefinitions[category].outputFormats;
  
  // Clear previous options
  elements.outputFormat.innerHTML = '<option value="">Select an output format</option>';
  
  // Add new options
  formats.forEach(format => {
    const option = document.createElement('option');
    option.value = format.value;
    option.textContent = format.label;
    elements.outputFormat.appendChild(option);
  });
}

// Update conversion options based on selected format
function updateConversionOptions(format) {
  const category = appState.currentCategory;
  const optionFields = formatDefinitions[category].optionFields[format] || [];
  
  // Clear previous options
  elements.conversionOptions.innerHTML = '';
  appState.conversionOptions = {};
  
  if (optionFields.length === 0) return;
  
  const optionsContainer = document.createElement('div');
  optionsContainer.classList.add('card', 'p-3', 'mb-3');
  optionsContainer.innerHTML = '<h3 class="h6 mb-3">Conversion Options</h3>';
  
  // Add option fields
  optionFields.forEach(field => {
    const fieldContainer = document.createElement('div');
    fieldContainer.classList.add('mb-3');
    
    // Create label
    const label = document.createElement('label');
    label.setAttribute('for', field.id);
    label.classList.add('form-label');
    label.textContent = field.label;
    fieldContainer.appendChild(label);
    
    // Create input based on type
    let input;
    
    if (field.type === 'range') {
      // Create range input with value display
      const rangeContainer = document.createElement('div');
      rangeContainer.classList.add('d-flex', 'align-items-center', 'gap-2');
      
      input = document.createElement('input');
      input.setAttribute('type', 'range');
      input.classList.add('form-range', 'flex-grow-1');
      input.id = field.id;
      input.min = field.min;
      input.max = field.max;
      input.step = field.step;
      input.value = field.value;
      
      const valueDisplay = document.createElement('span');
      valueDisplay.classList.add('badge', 'bg-primary');
      valueDisplay.textContent = field.value;
      
      input.addEventListener('input', (e) => {
        valueDisplay.textContent = e.target.value;
        appState.conversionOptions[field.id] = e.target.value;
      });
      
      rangeContainer.appendChild(input);
      rangeContainer.appendChild(valueDisplay);
      fieldContainer.appendChild(rangeContainer);
      
    } else if (field.type === 'select') {
      // Create select input
      input = document.createElement('select');
      input.classList.add('form-select');
      input.id = field.id;
      
      field.options.forEach(option => {
        const optionEl = document.createElement('option');
        optionEl.value = option.value;
        optionEl.textContent = option.label;
        input.appendChild(optionEl);
      });
      
      input.value = field.value;
      
      input.addEventListener('change', (e) => {
        appState.conversionOptions[field.id] = e.target.value;
      });
      
      fieldContainer.appendChild(input);
    }
    
    // Set initial state
    appState.conversionOptions[field.id] = field.value;
    
    optionsContainer.appendChild(fieldContainer);
  });
  
  elements.conversionOptions.appendChild(optionsContainer);
}

// Initialize convert button
function initConvertButton() {
  elements.convertButton.addEventListener('click', startConversion);
}

// Start the conversion process
function startConversion() {
  if (appState.selectedFiles.length === 0 || !appState.outputFormat) {
    showToast('warning', 'Cannot Convert', 'Please select files and an output format.');
    return;
  }
  
  // Show progress section
  elements.conversionProgressSection.classList.remove('d-none');
  elements.conversionProgressSection.scrollIntoView({ behavior: 'smooth' });
  
  // Reset progress UI
  elements.overallProgress.style.width = '0%';
  elements.fileProgressList.innerHTML = '';
  
  // Create progress items for each file
  appState.selectedFiles.forEach(file => {
    const progressItem = createProgressItem(file);
    elements.fileProgressList.appendChild(progressItem);
  });
  
  // Start conversion process for each file
  appState.conversionResults = [];
  let completedFiles = 0;
  
  appState.selectedFiles.forEach((file, index) => {
    // Simulate conversion progress with setTimeout
    simulateFileConversion(file, index, () => {
      completedFiles++;
      
      // Update overall progress
      const overallPercent = (completedFiles / appState.selectedFiles.length) * 100;
      elements.overallProgress.style.width = `${overallPercent}%`;
      
      // If all files are done, show results
      if (completedFiles === appState.selectedFiles.length) {
        setTimeout(() => {
          showConversionResults();
        }, 500);
      }
    });
  });
}

// Create a progress item for a file
function createProgressItem(file) {
  const item = document.createElement('div');
  item.classList.add('list-group-item', 'd-flex', 'align-items-center', 'file-item');
  item.id = `progress-${file.name.replace(/[^a-zA-Z0-9]/g, '-')}`;
  
  const fileIcon = getFileIconHTML(getFileExtension(file.name));
  
  item.innerHTML = `
    <div class="file-icon me-3">${fileIcon}</div>
    <div class="flex-grow-1">
      <div class="d-flex justify-content-between align-items-center">
        <h3 class="h6 mb-1">${file.name}</h3>
        <span class="badge bg-info processing-animation">Processing</span>
      </div>
      <div class="progress mt-2" style="height: 5px;">
        <div class="progress-bar" role="progressbar" style="width: 0%"></div>
      </div>
    </div>
  `;
  
  return item;
}

// Simulate file conversion (in a real app, this would be actual conversion)
function simulateFileConversion(file, index, onComplete) {
  const itemId = `progress-${file.name.replace(/[^a-zA-Z0-9]/g, '-')}`;
  const progressItem = document.getElementById(itemId);
  const progressBar = progressItem.querySelector('.progress-bar');
  const statusBadge = progressItem.querySelector('.badge');
  
  // Simulate a conversion that takes 1-3 seconds
  const duration = 1000 + Math.random() * 2000;
  const startTime = Date.now();
  
  // Create a placeholder for the converted file's data
  const convertedData = {
    originalFile: file,
    convertedBlob: null, // This would be the actual converted file data
    outputFormat: appState.outputFormat,
    fileName: getNewFileName(file.name, appState.outputFormat)
  };
  
  // Update progress bar at intervals
  const updateInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min((elapsed / duration) * 100, 100);
    
    progressBar.style.width = `${progress}%`;
    
    if (progress >= 100) {
      clearInterval(updateInterval);
      
      // In a real app, this is where you'd have the actual converted file data
      // For demo purposes, we're just creating a mock result
      
      // Simulate creating a blob (in a real app, this would be the conversion result)
      convertedData.convertedBlob = new Blob(['mock converted data'], { type: getMimeType(appState.outputFormat) });
      
      // Update UI to show completion
      statusBadge.classList.remove('bg-info', 'processing-animation');
      statusBadge.classList.add('bg-success');
      statusBadge.textContent = 'Completed';
      
      // Add to results
      appState.conversionResults.push(convertedData);
      
      // Call completion callback
      onComplete();
    }
  }, 100);
}

// Show conversion results
function showConversionResults() {
  elements.resultsList.innerHTML = '';
  
  appState.conversionResults.forEach(result => {
    const resultItem = createResultItem(result);
    elements.resultsList.appendChild(resultItem);
  });
  
  elements.resultsSection.classList.remove('d-none');
  elements.resultsSection.scrollIntoView({ behavior: 'smooth' });
  
  showToast('success', 'Conversion Complete', `${appState.conversionResults.length} files have been converted successfully.`);
}

// Create a result item
function createResultItem(result) {
  const item = document.createElement('div');
  item.classList.add('list-group-item', 'd-flex', 'align-items-center', 'result-item');
  
  const fileIcon = getFileIconHTML(getFileExtension(result.fileName));
  const fileUrl = URL.createObjectURL(result.convertedBlob);
  
  item.innerHTML = `
    <div class="file-icon me-3">${fileIcon}</div>
    <div class="flex-grow-1">
      <div class="d-flex justify-content-between align-items-center">
        <h3 class="h6 mb-1">${result.fileName}</h3>
        <button class="btn btn-sm btn-outline-primary download-btn">
          Download
        </button>
      </div>
      <div class="small text-muted">
        Converted from ${result.originalFile.name}
      </div>
    </div>
  `;
  
  // Add download button functionality
  const downloadButton = item.querySelector('.download-btn');
  downloadButton.addEventListener('click', () => {
    downloadFile(fileUrl, result.fileName);
  });
  
  return item;
}

// Initialize download all button
function initDownloadAllButton() {
  elements.downloadAllButton.addEventListener('click', () => {
    if (appState.conversionResults.length === 0) return;
    
    // Create a zip file in a real application
    // For this demo, we'll just download each file individually
    appState.conversionResults.forEach(result => {
      const fileUrl = URL.createObjectURL(result.convertedBlob);
      downloadFile(fileUrl, result.fileName);
    });
    
    showToast('info', 'Downloading Files', 'All converted files are being downloaded.');
  });
}

// Helper to download a file
function downloadFile(url, fileName) {
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Initialize PWA install prompt
function initInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    appState.deferredPrompt = e;
    // Update UI to show the install button
    elements.installAppButton.classList.remove('d-none');
    
    // Add click handler for install button
    elements.installAppButton.addEventListener('click', async () => {
      if (!appState.deferredPrompt) return;
      
      // Show the install prompt
      appState.deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await appState.deferredPrompt.userChoice;
      
      // We no longer need the prompt
      appState.deferredPrompt = null;
      
      // Hide the install button
      elements.installAppButton.classList.add('d-none');
      
      if (outcome === 'accepted') {
        showToast('success', 'App Installed', 'Thank you for installing File Flip!');
      }
    });
  });
  
  // Listen for app installed event
  window.addEventListener('appinstalled', () => {
    // Hide the install button
    elements.installAppButton.classList.add('d-none');
    // Clear the deferredPrompt
    appState.deferredPrompt = null;
    // Log or show a message
    console.log('PWA was installed');
  });
}

// Show a toast notification
function showToast(type, title, message) {
  // Set the toast content
  elements.toastTitle.textContent = title;
  elements.toastMessage.textContent = message;
  
  // Set the toast type
  const toast = bootstrap.Toast.getInstance(elements.feedbackToast);
  
  // Remove previous color classes
  elements.feedbackToast.classList.remove('bg-success', 'bg-danger', 'bg-warning', 'bg-info');
  
  // Add color based on type
  switch (type) {
    case 'success':
      elements.feedbackToast.classList.add('text-white', 'bg-success');
      break;
    case 'error':
      elements.feedbackToast.classList.add('text-white', 'bg-danger');
      break;
    case 'warning':
      elements.feedbackToast.classList.add('bg-warning');
      break;
    case 'info':
      elements.feedbackToast.classList.add('text-white', 'bg-info');
      break;
  }
  
  // Show the toast
  toast.show();
}

// Helper to get file extension
function getFileExtension(fileName) {
  return fileName.split('.').pop().toLowerCase();
}

// Helper to create a new filename with the target extension
function getNewFileName(originalName, newExtension) {
  const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
  return `${baseName}.${newExtension}`;
}

// Helper to get MIME type for a file extension
function getMimeType(extension) {
  const mimeTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'md': 'text/markdown',
    'html': 'text/html',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'mp4': 'video/mp4',
    'webm': 'video/webm'
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}

// Helper to get an appropriate icon for a file type
function getFileIconHTML(extension) {
  // Map extensions to Bootstrap icons
  const iconMap = {
    // Images
    'jpg': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-image" viewBox="0 0 16 16"><path d="M6.502 7a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/><path d="M14 14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5V14zM4 1a1 1 0 0 0-1 1v10l2.224-2.224a.5.5 0 0 1 .61-.075L8 11l2.157-3.02a.5.5 0 0 1 .76-.063L13 10V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4z"/></svg>',
    'jpeg': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-image" viewBox="0 0 16 16"><path d="M6.502 7a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/><path d="M14 14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5V14zM4 1a1 1 0 0 0-1 1v10l2.224-2.224a.5.5 0 0 1 .61-.075L8 11l2.157-3.02a.5.5 0 0 1 .76-.063L13 10V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4z"/></svg>',
    'png': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-image" viewBox="0 0 16 16"><path d="M6.502 7a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/><path d="M14 14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5V14zM4 1a1 1 0 0 0-1 1v10l2.224-2.224a.5.5 0 0 1 .61-.075L8 11l2.157-3.02a.5.5 0 0 1 .76-.063L13 10V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4z"/></svg>',
    'gif': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-image" viewBox="0 0 16 16"><path d="M6.502 7a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/><path d="M14 14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5V14zM4 1a1 1 0 0 0-1 1v10l2.224-2.224a.5.5 0 0 1 .61-.075L8 11l2.157-3.02a.5.5 0 0 1 .76-.063L13 10V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4z"/></svg>',
    'webp': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-image" viewBox="0 0 16 16"><path d="M6.502 7a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/><path d="M14 14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5V14zM4 1a1 1 0 0 0-1 1v10l2.224-2.224a.5.5 0 0 1 .61-.075L8 11l2.157-3.02a.5.5 0 0 1 .76-.063L13 10V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4z"/></svg>',
    'svg': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-image" viewBox="0 0 16 16"><path d="M6.502 7a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/><path d="M14 14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5V14zM4 1a1 1 0 0 0-1 1v10l2.224-2.224a.5.5 0 0 1 .61-.075L8 11l2.157-3.02a.5.5 0 0 1 .76-.063L13 10V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4z"/></svg>',
    
    // Documents
    'pdf': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-pdf" viewBox="0 0 16 16"><path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 1 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/><path d="M4.603 14.087a.81.81 0 0 1-.438-.42c-.195-.388-.13-.776.08-1.102.198-.307.526-.568.897-.787a7.68 7.68 0 0 1 1.482-.645 19.697 19.697 0 0 0 1.062-2.227 7.269 7.269 0 0 1-.43-1.295c-.086-.4-.119-.796-.046-1.136.075-.354.274-.672.65-.823.192-.077.4-.12.602-.077a.7.7 0 0 1 .477.365c.088.164.12.356.127.538.007.188-.012.396-.047.614-.084.51-.27 1.134-.52 1.794a10.954 10.954 0 0 0 .98 1.686 5.753 5.753 0 0 1 1.334.05c.364.066.734.195.96.465.12.144.193.32.2.518.007.192-.047.382-.138.563a1.04 1.04 0 0 1-.354.416.856.856 0 0 1-.51.138c-.331-.014-.654-.196-.933-.417a5.712 5.712 0 0 1-.911-.95 11.651 11.651 0 0 0-1.997.406 11.307 11.307 0 0 1-1.02 1.51c-.292.35-.609.656-.927.787a.793.793 0 0 1-.58.029zm1.379-1.901c-.166.076-.32.156-.459.238-.328.194-.541.383-.647.547-.094.145-.096.25-.04.361.01.022.02.036.026.044a.266.266 0 0 0 .035-.012c.137-.056.355-.235.635-.572a8.18 8.18 0 0 0 .45-.606zm1.64-1.33a12.71 12.71 0 0 1 1.01-.193 11.744 11.744 0 0 1-.51-.858 20.801 20.801 0 0 1-.5 1.05zm2.446.45c.15.163.296.3.435.41.24.19.407.253.498.256a.107.107 0 0 0 .07-.015.307.307 0 0 0 .094-.125.436.436 0 0 0 .059-.2.095.095 0 0 0-.026-.063c-.052-.062-.2-.152-.518-.209a3.876 3.876 0 0 0-.612-.053zM8.078 7.8a6.7 6.7 0 0 0 .2-.828c.031-.188.043-.343.038-.465a.613.613 0 0 0-.032-.198.517.517 0 0 0-.145.04c-.087.035-.158.106-.196.283-.04.192-.03.469.046.822.024.111.054.227.09.346z"/></svg>',
    'txt': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-text" viewBox="0 0 16 16"><path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5z"/><path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5L9.5 0zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z"/></svg>',
    'md': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-text" viewBox="0 0 16 16"><path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5z"/><path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5L9.5 0zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z"/></svg>',
    'html': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-code" viewBox="0 0 16 16"><path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/><path d="M8.646 6.646a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1 0 .708l-2 2a.5.5 0 0 1-.708-.708L10.293 9 8.646 7.354a.5.5 0 0 1 0-.708zm-1.292 0a.5.5 0 0 0-.708 0l-2 2a.5.5 0 0 0 0 .708l2 2a.5.5 0 0 0 .708-.708L5.707 9l1.647-1.646a.5.5 0 0 0 0-.708z"/></svg>',
    
    // Audio
    'mp3': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-music" viewBox="0 0 16 16"><path d="M11 6.64a1 1 0 0 0-1.243-.97l-1 .25A1 1 0 0 0 8 6.89v4.306A2.572 2.572 0 0 0 7 11c-.5 0-.974.134-1.338.377-.36.24-.662.628-.662 1.123s.301.883.662 1.123c.364.243.839.377 1.338.377.5 0 .974-.134 1.338-.377.36-.24.662-.628.662-1.123V8.89l2-.5V6.64z"/><path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 1 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/></svg>',
    'wav': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-music" viewBox="0 0 16 16"><path d="M11 6.64a1 1 0 0 0-1.243-.97l-1 .25A1 1 0 0 0 8 6.89v4.306A2.572 2.572 0 0 0 7 11c-.5 0-.974.134-1.338.377-.36.24-.662.628-.662 1.123s.301.883.662 1.123c.364.243.839.377 1.338.377.5 0 .974-.134 1.338-.377.36-.24.662-.628.662-1.123V8.89l2-.5V6.64z"/><path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 1 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/></svg>',
    'ogg': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-music" viewBox="0 0 16 16"><path d="M11 6.64a1 1 0 0 0-1.243-.97l-1 .25A1 1 0 0 0 8 6.89v4.306A2.572 2.572 0 0 0 7 11c-.5 0-.974.134-1.338.377-.36.24-.662.628-.662 1.123s.301.883.662 1.123c.364.243.839.377 1.338.377.5 0 .974-.134 1.338-.377.36-.24.662-.628.662-1.123V8.89l2-.5V6.64z"/><path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 1 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/></svg>',
    
    // Video
    'mp4': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-play" viewBox="0 0 16 16"><path d="M6 6.883v4.234a.5.5 0 0 0 .757.429l3.528-2.117a.5.5 0 0 0 0-.858L6.757 6.454a.5.5 0 0 0-.757.43z"/><path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 1 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/></svg>',
    'webm': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-play" viewBox="0 0 16 16"><path d="M6 6.883v4.234a.5.5 0 0 0 .757.429l3.528-2.117a.5.5 0 0 0 0-.858L6.757 6.454a.5.5 0 0 0-.757.43z"/><path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 1 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/></svg>'
  };
  
  // Default icon if not found
  const defaultIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark" viewBox="0 0 16 16"><path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/></svg>';
  
  return iconMap[extension] || defaultIcon;
}