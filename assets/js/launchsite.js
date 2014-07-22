$("#TestButton").click(function() {
    launchpage();
});

//https://instagram.com/accounts/login/
//https://twitter.com/login
//https://www.linkedin.com/uas/login
//https://mail.google.com
//https://www.facebook.com

var opened_window_id = null;
var username = "conrad@foucher.ca";
var password = "Test123";
var site = "facebook";
var url = "https://www.facebook.com";

//Listen to message from launched site
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
        console.log("tab id = ", sender.tab.id);
        console.log("tab url = ", sender.tab.url);
        //check that message from launched site came from the correct site
        if (request.greeting == "hello" && sender.tab.id == opened_window_id){
            opened_window_id = null;
            sendResponse({username: username, password: password, site: site});
            username = null;
            password = null;
        }
});

function launchpage(){
    //launch page with url = url
    chrome.windows.create({url: url, incognito: true}, function (result){
        opened_window_id = result.tabs[0].id;        
    });
}