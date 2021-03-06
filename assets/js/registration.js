// User Registration 
deleteDB('hand_data');

var progressbar = $('.progress-bar');
var ret = ["AirSpring", 0, 0];
var scan = true;
var handLeave = false;
var prev_hand_id;

var controller = Leap.loop(function (frame) {
        //console.log(frame);
        // Check for change in hand id 
        if (!scan) {
            //console.log("prev", prev_hand_id);
            //console.log("Cur", frame.hands[0].id);
            //console.log(ret[2]);
            if (!frame.hands[0]) {
                //console.log("No hand detected");
                handLeave = true;
            }
            if(frame.hands[0] && handLeave == true){
              //console.log("New Hand detected");
              handLeave = false;
              ret[2] = 0;
              scan = true;
            }
        }
            
    if (frame.hands[0]) {
      //console.log("Here1234");
        
      if(ret[1]<100 && scan == true){
        //console.log("In");
        
        //prev_hand_id = frame.hands[0].id;
        //console.log(frame.hands[0].id);
        
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
    
    
        if(ret[1]==10){
          progressbar.css("width", "10%");
           $(".progress-bar").html("10%");
        } 
        if(ret[1]==20){
          progressbar.css("width", "20%");
          $(".progress-bar").html("20%");
        }
        if(ret[1]==30){
          progressbar.css("width", "30%");
          $(".progress-bar").html("30%");
        }
        if(ret[1]==40){
          progressbar.css("width", "40%");
          $(".progress-bar").html("40%");
        }
        if(ret[1]==50){
          progressbar.css("width", "50%");
          $(".progress-bar").html("50%");
        }
        if(ret[1]==60){
          progressbar.css("width", "60%");
          $(".progress-bar").html("60%");
        }
        if(ret[1]==70){
          progressbar.css("width", "70%");
          $(".progress-bar").html("70%");
        }
        if(ret[1]==80){
          progressbar.css("width", "80%");
          $(".progress-bar").html("80%");
        }
        if(ret[1]==90){
          progressbar.css("width", "90%");
          $(".progress-bar").html("90%");
        }
        if(ret[1]==99){
          progressbar.css("width", "99%");
          $(".progress-bar").html("99%");
        }
        if (ret[1] == 20 && ret[2] == 1){
          //ret[1]++;
          scan = false;
          show_message("hand-alerts", 'success', 'Remove and place your hand over the leap device'); 
        }
        if (ret[1] == 40 && ret[2] == 1){
          //ret[1]++;
          scan = false;
          show_message("hand-alerts", 'success', 'Remove and place your hand over the leap device');
        }
        if (ret[1] == 60 && ret[2] == 1){
          //ret[1]++;
          scan = false;
          show_message("hand-alerts", 'success', 'Remove and place your hand over the leap device'); 
        }
        if (ret[1] == 80 && ret[2] == 1){
          //ret[1]++;
          scan = false;
          show_message("hand-alerts", 'success', 'Remove and place your hand over the leap device'); 
        }
        if (ret[1] == 100){ 
          progressbar.css("width", "100%");
          $(".progress-bar").html("100%");
          show_message("hand-alerts", 'success', 'Complete!');
          ret[1] = 101; 
          airspring.indexedDB.calcAvg_registration();
        }
      }
    }

});