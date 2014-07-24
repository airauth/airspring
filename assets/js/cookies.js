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
    var cookies = $.cookie();
    var keys_to_delete = [];
    var parsed_cookies = {};
    //console.log(cookies);
    for( var key in cookies){
        //console.log(key);
        if (key.indexOf('_airauth') == -1) {
            //console.log('delete');
            //delete cookies[key];
            keys_to_delete.push(key);
        }
    }
    for(var i = 0; i < keys_to_delete.length; i++){
        delete cookies[keys_to_delete[i]];
    }
    for(var key in cookies){
        var obj = jQuery.parseJSON(cookies[key]);
        parsed_cookies[key]=obj;
    }
    //var cookies = jaaulde.utils.cookies.filter( /_airauth/ );
    return parsed_cookies; 
}


// Get Specific Air.Auth Cookies 
function getOneCookie(id) {
    var cookie = $.cookie('_airauth_'+id); 
    //var cookie = jaaulde.utils.cookies.get('_airauth_'+id);
    return cookie; 
}

// Get Air.Auth PIN cookies
//function getPINCookies() {
//    var cookies = jaaulde.utils.cookies.filter( /_airp/ );
//    return cookies; 
//}

// Get Air.Auth Cookies 
function getHandCookies() {
    var cookies = $.cookie();
    var keys_to_delete = [];
    var parsed_cookies = {};
    //console.log(cookies);
    for( var key in cookies){
        //console.log(key);
        if (key.indexOf('_airh') == -1) {
            //console.log('delete');
            //delete cookies[key];
            keys_to_delete.push(key);
        }
    }
    for(var i = 0; i < keys_to_delete.length; i++){
        delete cookies[keys_to_delete[i]];
    }
    for(var key in cookies){
        var obj = jQuery.parseJSON(cookies[key]);
        parsed_cookies[key]=obj;
    }
    //var cookies = jaaulde.utils.cookies.filter( /_airauth/ );
    return parsed_cookies; 
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