//Validate cookies
var url = "http://airauth.cloudnode.co/api/session/get";
var cookie_user_data = getCookies();
var keys = [];
var ids = [];
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
            console.log("resData = ", resData);
            if (resData.result.length != 0) {
                for(var i = 0; i < resData.result.length; i++){
                    var index = keys.indexOf(resData.result[i]);
                    
                    if (index != -1 ) {
                        deleteCookie('_airauth_'+ids[index]);
                    }
                    
                }
            }
	},

	error: function(error) {
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
var navbar__launcher_error_html = new EJS({url: '../../templates/navbar-launcher-error.ejs'}).render(users); 
$('#navbar_launcher-error').html(navbar__launcher_error_html);
var navbar__launcher_html = new EJS({url: '../../templates/navbar-launcher.ejs'}).render(users); 
$('#navbar_launcher').html(navbar__launcher_html);
var navbar__launcher_PIN_error_html = new EJS({url: '../../templates/navbar-launcher-pin-error.ejs'}).render(users); 
$('#navbar_launcher_PIN_error').html(navbar__launcher_PIN_error_html); 
var navbar__recorder_html = new EJS({url: '../../templates/navbar-recorder.ejs'});
$('#navbar_recorder').html(navbar__recorder_html.text);