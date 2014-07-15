// Include navbar
var navbar_html = new EJS({url: '../../templates/navbar.ejs'});
$('#navbar').html(navbar_html.text);
var navbar__launcher_html = new EJS({url: '../../templates/navbar-launcher.ejs'});
$('#navbar_launcher').html(navbar__launcher_html.text);
var navbar__recorder_html = new EJS({url: '../../templates/navbar-recorder.ejs'});
$('#navbar_recorder').html(navbar__recorder_html.text);