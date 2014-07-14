$("#inputRePassword").change(function(){
              
              var pswd_ag = $(this).val();
              if ( pswd_ag.length < 5 ) {
                           $(this).parent().addClass('has-error');
                           $("#inputPassword").parent().addClass('has-error');
                           $('#register-btn').attr( 'disabled', true );
              }
              else{
                            $("#error").hide();
                            $("#inputRePassword").keyup(function () {
                                       if( $(this).val() != $("#inputPassword").val() ){
                                             $(this).parent().removeClass('has-error');
                                             $("#inputPassword").parent().removeClass('has-error');
                                             
                                             $(this).parent().addClass('has-error');
                                             $("#inputPassword").parent().addClass('has-error');
                                             
                                             $('#register-btn').attr( 'disabled', true );
                                             
                                             $(this).parent().removeClass('has-success');
                                             $("#inputPassword").parent().removeClass('has-success');
                                             
                                       }
                                       else{
                                           $(this).parent().removeClass('has-success');
                                           $("#inputPassword").parent().removeClass('has-error');
                                           
                                           $('#register-btn').removeAttr('disabled');
                                           
                                           $(this).parent().addClass('has-success');
                                           $("#inputPassword").parent().addClass('has-success');
                                       }
                                     }).keyup();       
              }});
            
            $("#inputPassword").change(function(){
              var pswd = $(this).val();
              if ( pswd.length < 5 ) {
                           $(this).parent().addClass('has-error');
                           $("#inputPassword").parent().addClass('has-error');
                           $('#register-btn').attr( 'disabled', true );
              }
              else{
                            $("#error").hide();
              
                            $("#inputPassword").keyup(function () {
                                              if( $(this).val() != $("#inputRePassword").val() ){
                                                    $(this).parent().removeClass('has-error');
                                                    $("#inputRePassword").parent().removeClass('has-error');
                                                    
                                                    $(this).parent().addClass('has-error');
                                                    $("#inputRePassword").parent().addClass('has-error');
                                                    
                                                    $('#register-btn').attr( 'disabled', true );
                                                    
                                                    $(this).parent().removeClass('has-success');
                                                    $("#inputRePassword").parent().removeClass('has-success');
                                                    
                                              }
                                              else{
                                                  $(this).parent().removeClass('has-success');
                                                  $("#inputRePassword").parent().removeClass('has-error');
                                                  
                                                  $('#register-btn').removeAttr('disabled');
                                                  
                                                  $(this).parent().addClass('has-success');
                                                  $("#inputRePassword").parent().addClass('has-success');
                                              }
                                            }).keyup();
              }});
            
            
            
            
            
            
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
                  console.log(resData.user_id);
                  $('#user_id').val(resData.user_id);
                  $('#user-registration').hide();
                  $('#leap-hand-register').show();
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
    var data = $('#user-login').serialize();
    // Get registration form data
    var url = "http://airauth.cloudnode.co/api/user/login";
          $.ajax({ 
              url: url
            , type: 'POST'
            , data: data
            , complete: function() {
            },

            success: function(resData) {
                  if (resData.valid) {
                            console.log(resData);
                  }
             },

            error: function(error) {
              console.log(error.responseJSON.valid); 
               if (!error.responseJSON.valid) {
                            $('.login-message').addClass('alert-danger').html('Invalid username or password!'); 
                            $('.login-message').show(); 
              } else {
                            $('.login-message').addClass('alert-danger').html('Something went wrong!'); 
                            $('.login-message').show();    
              }
             },
          });
          
              
    
    console.log($('#user-login').serialize());
    return false;

});
            
            
            