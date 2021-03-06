'use strict';

chrome.runtime.onInstalled.addListener(details => {
  console.log('previousVersion', details.previousVersion);
});

// We expect only badge messages of form {'badge', 'count'}
chrome.runtime.onMessage.addListener((msg, sender) => {

  console.log('got a message!', msg);

  if (msg.subject === 'badge') {
    // Don't bother setting useless text.
    if (msg.count === 0) return;

    chrome.browserAction.setBadgeText({
      text: msg.count.toString(),
      tabId: sender.tab.id
    });
  }

});