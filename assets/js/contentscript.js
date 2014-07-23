//send message to extension - wait for reply then enter username and password into site
chrome.runtime.sendMessage({greeting: "hello"}, function(response) {
    
  
    if (response.site == "facebook") {
        console.log('facebook');
        var email = document.getElementById("email");
        email.value = response.username;
        var pass = document.getElementById("pass");
        pass.value = response.password;
        document.getElementById('u_0_n').click()
    }
    if (response.site == "gmail") {
        var email = document.getElementById("Email");
        email.value = response.username;
        var pass = document.getElementById("Passwd");
        pass.value = response.password;
        document.getElementById('signIn').click()
    }
    if (response.site == "linkedin") {
        var email = document.getElementById("session_key-login");
        email.value = response.username;
        var pass = document.getElementById("session_password-login");
        pass.value = response.password;
        document.getElementById('btn-primary').click()
    }
    if (response.site == "twitter") {
        var email = document.getElementsByClassName('js-username-field');
        email[1].value = response.username;
        var pass = document.getElementsByClassName('js-password-field');
        pass[1].value = response.password;
        var submit = document.getElementsByClassName('submit');
        submit[1].click();
    }
    if (response.site == "instagram") {
        var email = document.getElementById('id_username');
        email.value = response.username;
        var pass = document.getElementById('id_password');
        pass.value = response.password;
        var submit = document.getElementsByClassName('button-green');
        submit[0].click();
    } 
});