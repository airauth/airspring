var myIndexURL = "chrome-extension://"+location.host+"/index.html";
chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.create({url: myIndexURL});
});

// Redirect to a Page in the Extension 
chrome.extension.onRequest.addListener(function(request, sender) {
    chrome.tabs.update(sender.tab.id, {url: request.redirect});
});
