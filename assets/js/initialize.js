var cookies = getCookies();
var redirectURL = null; 
if(jQuery.isEmptyObject(cookies)){
    // Now Redirect to Welcome 
    redirectURL = "chrome-extension://"+location.host+"/login.html"; 
} else {
    redirectURL = "chrome-extension://"+location.host+"/pin.html"; 
}
// Redirect to URL 
chrome.extension.sendRequest({redirect: redirectURL}); 