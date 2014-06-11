// Include navbar
var navbar_html = new EJS({url: '../../templates/navbar.ejs'});
$('#navbar').html(navbar_html.text);