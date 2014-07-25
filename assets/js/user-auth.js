//______________________________________________________________________________________________________________________
//________________________________________Registration Page Validation JS_______________________________________________

$(".register_password_class").keyup(function(){
  // perform checks, all return bools
  top_length_flag = check_length('#inputPassword',5);
  bottom_length_flag = check_length('#inputRePassword',5);
  match_flag = check_match('#inputPassword','#inputRePassword');
  pin_flag = check_pin('#pin_div');

  // if all true, enable submit button, set calsses to success
  if(match_flag && top_length_flag && bottom_length_flag && check_pin('#pin_div')) {
    $('#register-btn').removeAttr('disabled');
    $('#help-password').html('');
    $('#help-retype-password').html('');
    has_success('#inputRePassword');
    has_success('#inputPassword');
    return;
  }
  else {
    $('#register-btn').attr( 'disabled', true );
  }

  if(match_flag && top_length_flag && bottom_length_flag) {
    has_success('#inputRePassword');
    has_success('#inputPassword');
  }

  // if top field length failed display help, set class to warning
  if(!top_length_flag) {
    $('#help-password').html('Password must be at least 5 characters long');
    return;
  }
  else {
    $('#help-password').html('');
  }

  // if bottom field length failed display help, set class to warning 
  if(!bottom_length_flag) {
    $('#help-retype-password').html('Password must be at least 5 characters long');
    return;
  }
  else {
    $('#help-retype-password').html('');
  }

  // if fields did not match display help, set class to warning, disable
  if(!match_flag) {
    $('#help-password').html('Passwords do not match');
    $('#help-retype-password').html('Password do not match');
  }
  else {
    $('#help-password').html('');
    $('#help-retype-password').html('');
  }
});

$(".register_pin_class").change(function(){
  if(!check_pin('#pin_div'))
    $('#register-btn').attr( 'disabled', true );
  else {
    $('#register-btn').removeAttr('disabled');
  }
}); 


//______________________________________________________________________________________________________________________
//_______________________________________________Helper Functions_______________________________________________________

function check_match(field_id,check_id){
  if($(field_id).val() !== $(check_id).val()){
    has_error(field_id);
    has_error(check_id);
    return false;
  }
  else {
    return true;
  }
}

function check_length(field_id,length) {
  field_val = $(field_id).val();
  if ( field_val.length < length ) {
    has_error(field_id);
    return false;
  }
  else {
    return true;
  }
}

function has_error(field_id) {
  $(field_id).parent().removeClass('has-error');
  $(field_id).parent().removeClass('has-success');
  $(field_id).parent().addClass('has-error');
}

function has_success(field_id) {
  $(field_id).parent().removeClass('has-error');
  $(field_id).parent().removeClass('has-success');
  $(field_id).parent().addClass('has-success');
}

function check_pin(select_id) {
  p_1 = $(select_id).find('#pin_select_1 option:selected').val();
  p_2 = $(select_id).find('#pin_select_2 option:selected').val();
  p_3 = $(select_id).find('#pin_select_3 option:selected').val();
  p_4 = $(select_id).find('#pin_select_4 option:selected').val();

  if(p_1 === '0' || p_2 === '0' || p_3 === '0' || p_4 === '0') {
    return false;
  }
  else {
    return true;
  }
}

//______________________________________________________________________________________________________________________
//______________________________________________________________________________________________________________________
                                
// User registration
$('#user-registration').submit(function() {
    var data = $('#user-registration').serialize();
    // Get registration form data
    var url = "http://airauth.cloudnode.co/api/user/signup";
          $.ajax({ 
              url: url 
            , data: data
            , complete: function() {
            },

            success: function(resData) {
                  console.log(resData.user_email);
                  $('#user_id').val(resData.user_email);
                  $('#user-registration').hide();
                  $('#leap-hand-register').show();
                  show_hand_shaddow();
                  // Create a new object store
                  // var request = window.indexedDB.open("airspringUserStore", 2);
             },

            error: function(error) {
               console.log(error.responseText);
             },
          });
          
              
    
    console.log($('#user-registration').serialize());
    return false;

});

// User Login
$('#user-login').submit(function() {
    var data = {}; // $('#user-login').serialize();
       
    var cookie_user_data = getCookies();
              var user_ids = [];
              var auth_ids = [];
              // Now Parse Object Data 
              for (var key in cookie_user_data) {
                  var obj = cookie_user_data[key];
                  user_ids.push(obj.id);
                  auth_ids.push(obj.a_id);
              };
    console.log(auth_ids);
    // Get registration form data
    data["user_ids"]=user_ids;
    data["email"]=$('#inputEmail').val();
    data["password"]=$('#inputPassword').val();
    data["auth_ids"]=auth_ids;
    
    //console.log(form_data);
    var url = "http://airauth.cloudnode.co/api/user/login";
          $.ajax({ 
              url: url
            , type: 'POST'
            , data: data
            , complete: function() {
            },

            success: function(resData) {
                  console.log('resdata = ',resData);
                  if (resData.valid) {
                            // console.log(resData);
                            if (typeof resData.duplicate_ids != "undefined") {
                                          for(var index = 0; index < resData.duplicate_ids.length; index++){
                                                        console.log('delete cookie _airauth_'+resData.duplicate_ids[index]);
                                                        deleteCookie("_airauth_"+resData.duplicate_ids[index]);
                                          }
                                          
                            }
                            createCookie(
                                         '_airauth_'+resData.u_id,
                                         '{"a_id": "'+resData.a_id+'", "u_hash": '+resData.u_hash+', "u_email": "'+resData.u_email+'", "id": "'+resData.u_id+'"}',
                                         7
                            );
                            // Now Redirect to scan 
                            var redirectURL = "chrome-extension://"+location.host+"/pin.html";
                            chrome.extension.sendRequest({redirect: redirectURL}); 
                  } 
             },

            error: function(error) {
              console.log(error.responseJSON); 
               if (!error.responseJSON.valid) {
                            $('.login-message').addClass('alert-danger').html('Invalid username or password!'); 
                            $('.login-message').show(); 
              } else {
                            $('.login-message').addClass('alert-danger').html('Something went wrong!'); 
                            $('.login-message').show();    
              }
             },
          });
          
              
    
    //console.log($('#user-login').serialize());
    return false;

});
            
            
            