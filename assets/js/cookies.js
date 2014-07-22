/**
 *
 * Cookies Management for Air.Auth 
 * Author: Anubhav Mishra 
 *
 *
 **/ 

// Create a Air.Auth Cookie 
function createCookie(name, value, days){
    // Set Date 
    var expires = '',
        date = new Date();
    if (days) {
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = '; expires=' + date.toGMTString();
    }
    // Set Cookie 
    document.cookie = name + '=' + value + expires + '; path=/'; 
}

// Get Air.Auth Cookies 
function getCookies() {
    var cookies = jaaulde.utils.cookies.filter( /_airauth/ );
    return cookies; 
}

// Delete All Cookies 
function deleteAllCookies() {
    var result = jaaulde.utils.cookies.del(true);
    return result; 
}

// Delete One Cookie 
function deleteCookie(name) {
    return jaaulde.utils.cookies.del(name);
} 