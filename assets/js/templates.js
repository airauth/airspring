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