// Clear the tracking deck when the extension starts or reloads from zero
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    total_spent: 0,
    tracked_sites: {},
    focus_mode_active: false
  });
});

// The core tracking function that looks at your screen layout
function trackCurrentTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || tabs.length === 0) return;
    
    const activeTab = tabs[0];
    if (!activeTab || !activeTab.url) return;

    try {
      const urlObj = new URL(activeTab.url);
      let domain = urlObj.hostname;

      // Filter out empty system screens or native computer settings pages
      if (!urlObj.protocol.startsWith('http')) return;
      if (domain.startsWith('www.')) {
        domain = domain.substring(4);
      }

      chrome.storage.local.get(['total_spent', 'tracked_sites'], (data) => {
        let total = data.total_spent || 0;
        let sites = data.tracked_sites || {};

        // Track time updates dynamically on page movement events
        sites[domain] = (sites[domain] || 0) + 1;
        total = total + 1;

        chrome.storage.local.set({
          total_spent: total,
          tracked_sites: sites
        });
      });
    } catch (error) {
      console.error("Tracking pause layout:", error);
    }
  });
}

// Wake up the code whenever you change website tabs on your laptop
chrome.tabs.onActivated.addListener(trackCurrentTab);

// Wake up the code whenever a tab changes its web address (URL)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    trackCurrentTab();
  }
});