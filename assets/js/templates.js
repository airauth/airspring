//Validate cookies
var url = "http://airauth.cloudnode.co/api/session/get";
var cookie_user_data = getCookies();
var keys = [];
var ids = [];
var current_page = location.pathname;
// Now Parse Object Data 
for (var key in cookie_user_data) {
    var obj = cookie_user_data[key];
    keys.push(obj.a_id);
    ids.push(obj.id);
}

data = {'auth_ids': keys, 'ids': ids};
$.ajax({ 
	url: url
	, type: 'POST'
	, data: data
	, complete: function() {
	},

	success: function(resData) {
            //console.log("resData = ", resData);
            if (resData.result.length != 0) {
                for(var i = 0; i < resData.result.length; i++){
                    var index = keys.indexOf(resData.result[i]);
                    
                    if (index != -1 ) {
                        console.log("here");
                        deleteCookie('_airauth_'+ids[index]);
                    }
                    var cookie_user_data = getCookies();
                    if (current_page != '/login.html' && current_page != '/register.html') {
                        if (jQuery.isEmptyObject(cookie_user_data)) {
                            redirectURL = "chrome-extension://"+location.host+"/login.html";
                            // Redirect to URL 
                            chrome.extension.sendRequest({redirect: redirectURL}); 
                        }
                    }
                    
                }
            }
	},

	error: function(error) {
            var cookie_user_data = getCookies();
                    
            if (current_page != '/login.html' && current_page != '/register.html') {
                if (jQuery.isEmptyObject(cookie_user_data)) {
                    redirectURL = "chrome-extension://"+location.host+"/login.html";
                    // Redirect to URL 
                    chrome.extension.sendRequest({redirect: redirectURL}); 
                }
            }
        },
});

// Include navbar
var navbar_html = new EJS({url: '../../templates/navbar.ejs'});
$('#navbar').html(navbar_html.text);
// Get Cookie Data for Air.Auth
var cookie_user_data = getCookies();
var users = []; 
// Now Parse Object Data 
for (var key in cookie_user_data) {
    var obj = cookie_user_data[key];
    users.push(obj.u_email); 
} 
// Now Render Navbar for Launcher 

var navbar__launcher_html = new EJS({url: '../../templates/navbar-launcher.ejs'}).render(users); 
$('#navbar_launcher').html(navbar__launcher_html);
var navbar__recorder_html = new EJS({url: '../../templates/navbar-recorder.ejs'});
$('#navbar_recorder').html(navbar__recorder_html.text);