$("#TestButton").click(function() {
    launchbackpage();
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    console.log("tab id = ", sender.tab.id);
    if (request.greeting == "hello")
      sendResponse({farewell: "goodbye"});
  });

function launchbackpage(){
    
    chrome.windows.create({url: "http://www.facebook.com", incognito: true});
}