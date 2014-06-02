var myIndexURL = "chrome-extension://"+location.host+"/welcome.html";
chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.create({url: myIndexURL});
});
