// User Registration 

deleteDB('hand_data');
console.log("should have deleted the DB");

var progressbar = $('.progress-bar');
var ret = ["AirSpring", 0, 0];
var scan = true;
var handLeave = false;
var prev_hand_id;

var controller = Leap.loop(function (frame) {
    
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
        
      if(ret[1]< 5 && scan == true){
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
    
    
        
        if(ret[1]==1){
          progressbar.css("width", "20%");
          $(".progress-bar").html("20%");
        }
        if(ret[1]==2){
          progressbar.css("width", "40%");
          $(".progress-bar").html("40%");
        }
        if(ret[1]==3){
          progressbar.css("width", "60%");
          $(".progress-bar").html("60%");
        }
        if(ret[1]==4){
          progressbar.css("width", "80%");
          $(".progress-bar").html("80%");
        }
        if(ret[1]==5){
          progressbar.css("width", "99%");
          $(".progress-bar").html("99%");
        }
        if (ret[1] == 1 && ret[2] == 1){
          //ret[1]++;
          scan = false;
          show_message("hand-alerts", 'success', 'Remove and place your hand over the leap device'); 
        }
        if (ret[1] == 2 && ret[2] == 1){
          //ret[1]++;
          scan = false;
          show_message("hand-alerts", 'success', 'Remove and place your hand over the leap device');
        }
        if (ret[1] == 3 && ret[2] == 1){
          //ret[1]++;
          scan = false;
          show_message("hand-alerts", 'success', 'Remove and place your hand over the leap device'); 
        }
        if (ret[1] == 4 && ret[2] == 1){
          //ret[1]++;
          scan = false;
          show_message("hand-alerts", 'success', 'Remove and place your hand over the leap device'); 
        }
        if (ret[1] == 5 ){ 
          progressbar.css("width", "100%");
          $(".progress-bar").html("100%");
          show_message("hand-alerts", 'success', 'Complete!');
          ret[1] = 6; 
          airspring.indexedDB.calcAvg_registration();
        }
      }
    }

});