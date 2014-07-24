var instagram_url = "https://instagram.com/accounts/login/";
var twitter_url = "https://twitter.com/login";
var linkedin_url = "https://www.linkedin.com/uas/login";
var gmail_url = "https://mail.google.com";
var facebook_url = "https://www.facebook.com";

var opened_window_id = null;
var launch_username;
var launch_password;
var launch_site;
var url;


var JsonFormatter = {
    stringify: function (cipherParams) {
        // create json object with ciphertext
        var jsonObj = {
            ct: cipherParams.ciphertext.toString(CryptoJS.enc.Base64)
        };

        // optionally add iv and salt
        if (cipherParams.iv) {
            jsonObj.iv = cipherParams.iv.toString();
        }
        if (cipherParams.salt) {
            jsonObj.s = cipherParams.salt.toString();
        }

        // stringify json object
        return JSON.stringify(jsonObj);
    },

    parse: function (jsonStr) {
        // parse json string
        var jsonObj = JSON.parse(jsonStr);

        // extract ciphertext from json object, and create cipher params object
        var cipherParams = CryptoJS.lib.CipherParams.create({
            ciphertext: CryptoJS.enc.Base64.parse(jsonObj.ct)
        });

        // optionally extract iv and salt
        if (jsonObj.iv) {
            cipherParams.iv = CryptoJS.enc.Hex.parse(jsonObj.iv)
        }
        if (jsonObj.s) {
            cipherParams.salt = CryptoJS.enc.Hex.parse(jsonObj.s)
        }

        return cipherParams;
    }
};

//Listen to message from launched site
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
        console.log("tab id = ", sender.tab.id);
        console.log("tab url = ", sender.tab.url);
        //check that message from launched site came from the correct site
        if (request.greeting == "hello" && sender.tab.id == opened_window_id){
            opened_window_id = null;
            sendResponse({username: launch_username, password: launch_password, site: launch_site});
            launch_username = null;
            launch_password = null;
        }
});

function exec_launch(url) {
    //console.log('Here');
    //launch page with url = url
    chrome.windows.create({url: url, incognito: true}, function (result){
        opened_window_id = result.tabs[0].id;        
    });
};

function launchpage(password, email, site, a_key, u_hash){

    //convert u_hash object to string
    var u_hash_string = JSON.stringify(u_hash);
    //console.log(u_hash_string);
    //decrypt u_hash
    var u_hash_decrypted = CryptoJS.AES.decrypt(u_hash_string, a_key, { format: JsonFormatter });
    u_hash_string = u_hash_decrypted.toString(CryptoJS.enc.Utf8);
    //decrypt email and password
    var email_decrypted = CryptoJS.AES.decrypt(email,u_hash_string, { format: JsonFormatter });
    var password_decrypted = CryptoJS.AES.decrypt(password,u_hash_string, { format: JsonFormatter });
    var email_string = email_decrypted.toString(CryptoJS.enc.Utf8);
    var password_string = password_decrypted.toString(CryptoJS.enc.Utf8);
    //console.log(decrypted.toString(CryptoJS.enc.Utf8));
    launch_username = email_string;
    launch_password = password_string;
    if (site == "facebook") {
        launch_site = site;
        url = facebook_url;
    }
    if (site == "gmail") {
        launch_site = site;
        url = gmail_url;
    }
    if (site == "linkedin") {
        launch_site = site;
        url = linkedin_url;
    }
    if (site == "instagram") {
        launch_site = site;
        url = instagram_url;
    }
    if (site == "twitter") {
        launch_site = site;
        url = twitter_url;
    }
    setTimeout(function(){exec_launch(url)},500);
}




