var myIndexURL = "chrome-extension://"+location.host+"/spring.html";
chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.create({url: myIndexURL});
});
