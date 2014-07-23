/**
 *  UI Message for Air.Spring
 *  Author: Anubhav Mishra 
 *
 **/

// Function shows UI messages based on html target element, type and message
function show_message(id, type, message){
    
    var html_elem = $("#" + id);
    
    html_elem.attr('class', 'alert alert-' + type);
    html_elem.html(message);
    
}

$( document ).ready(function() {
    function fadeOutAlert() {
        $("#dashboard-messages").delay(4000).fadeOut(function() {
            $(this).remove(); 
        });
    }
    
    fadeOutAlert();
    
});