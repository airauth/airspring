deleteDB('hand_data');
console.log("Hello");

var progressbar = $('.progress-bar');
var ret = ["AirSpring", 0, 0];
var scan = false;
var count = 0;
var prev_fing_count = 0;
var pincode = [];

var controller = Leap.loop(function (frame) {
                
    if (frame.hands[0]) {
      //console.log("Here1234");
        
      if(ret[1]<20){        
        
        ret = auth_ready(frame, ret[1]);
        //console.log(ret);
    
        switch(ret[0]) {
          case "5 Fingers Not Showing":
              show_message("hand-alerts", 'warning', ret[0]);
              break;
          case "Hand Too Far Right":
              show_message("hand-alerts", 'warning', ret[0]);
              break;
          case "Hand Too Far Left":
              show_message("hand-alerts", 'warning', ret[0]);
              break;
          case "Hand Too High":
              show_message("hand-alerts", 'warning', ret[0]);
              break;
          case "Hand Too Low":
              show_message("hand-alerts", 'warning', ret[0]);
              break;
          case "Hand Too Far From Body":
              show_message("hand-alerts", 'warning', ret[0]);
              break;          
          case "Hand Too Close To Body":
              show_message("hand-alerts", 'warning', ret[0]);
              break;
          case "Fingers Not Straight Enough":
              show_message("hand-alerts", 'warning', ret[0]);
              break;
          case "Hand Is Not Flat, Rolled Left":
              show_message("hand-alerts", 'warning', ret[0]);
              break;
          case "Hand Is Not Flat, Rolled Right":
              show_message("hand-alerts", 'warning', ret[0]);
              break;
          case "Hand Is Not Flat, Pitched Backwards":
              show_message("hand-alerts", 'warning', ret[0]);
              break;
          case "Hand Is Not Flat, Pitched Forwards":
              show_message("hand-alerts", 'warning', ret[0]);
              break;              
          case "No Hand After Check":
              show_message("hand-alerts", 'warning', ret[0]);
              break;
          case "More than One Hand":
              show_message("hand-alerts", 'warning', ret[0]);
              break;
          case "Gathering":
              show_message("hand-alerts", 'success', ret[0]);
              break;
        }
    
    
        if(ret[1]==2){
          progressbar.css("width", "10%");
           $(".progress-bar").html("10%");
        } 
        if(ret[1]==4){
          progressbar.css("width", "20%");
          $(".progress-bar").html("20%");
        }
        if(ret[1]==6){
          progressbar.css("width", "30%");
          $(".progress-bar").html("30%");
        }
        if(ret[1]==8){
          progressbar.css("width", "40%");
          $(".progress-bar").html("40%");
        }
        if(ret[1]==10){
          progressbar.css("width", "50%");
          $(".progress-bar").html("50%");
        }
        if(ret[1]==12){
          progressbar.css("width", "60%");
          $(".progress-bar").html("60%");
        }
        if(ret[1]==14){
          progressbar.css("width", "70%");
          $(".progress-bar").html("70%");
        }
        if(ret[1]==16){
          progressbar.css("width", "80%");
          $(".progress-bar").html("80%");
        }
        if(ret[1]==18){
          progressbar.css("width", "90%");
          $(".progress-bar").html("90%");
        }
        if(ret[1]==19){
          progressbar.css("width", "99%");
          $(".progress-bar").html("99%");
        }
        if (ret[1] == 20){
          ret[1]++;
          progressbar.css("width", "100%");
          $(".progress-bar").html("100%");
          show_message("hand-alerts", 'success', 'Complete!');
          //airspring.indexedDB.calcAvg_login();
          
        }
      }
    }
                
});