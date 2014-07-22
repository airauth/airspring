var cookies = getCookies();
var redirectURL = null; 
if(jQuery.isEmptyObject(cookies)){
    // Now Redirect to Welcome 
    redirectURL = "chrome-extension://"+location.host+"/welcome.html"; 
} else {
    redirectURL = "chrome-extension://"+location.host+"/launcher.html"; 
}
// Redirect to URL 
chrome.extension.sendRequest({redirect: redirectURL}); 