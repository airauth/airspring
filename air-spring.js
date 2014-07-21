// Extension JS code goes here :)
function auth_ready(frame, count) {
	var ret = ["Passed", 1, 1];
	var hand;
        
	if(frame.hands.length === 0) {
		ret = ["No Hand", 0];		
	}
	else if(frame.hands.length > 1) {
		ret = ["More than One Hand", 0];
	}
	else {
		if(frame.hands[0]) {
			hand = frame.hands[0];
			if (count_extended_fingers(hand) < 5) {
				ret = ["5 Fingers Not Showing", 0, 0];
			}
			else if (hand.palmPosition[0] > 50) {
				ret = ["Hand Too Far Right", 0, 0];
			}
			else if (hand.palmPosition[0] < -50) {
				ret = ["Hand Too Far Left", 0, 0];
			}
			else if (hand.palmPosition[1] > 155) {
				ret = ["Hand Too High", 0, 0];
			}
			else if (hand.palmPosition[1] < 130) {
				ret = ["Hand Too Low", 0, 0];
			}
			else if (hand.palmPosition[2] < -50) {
				ret = ["Hand Too Far From Body", 0, 0];
			}
			else if (hand.palmPosition[2] > 50) {
				ret = ["Hand Too Close To Body", 0, 0];
			}
			else if(hand.grabStrength > 0.01) {
				ret = ["Fingers Not Straight Enough", 0, 0];
			}
			else if (hand.roll() > 0.15) {
				ret = ["Hand Is Not Flat, Rolled Left", 0, 0];
			}
			else if (hand.roll() < -0.15) {
				ret = ["Hand Is Not Flat, Rolled Right", 0, 0];
			}
			else if (hand.pitch() > 0.15) {
				ret = ["Hand Is Not Flat, Pitched Backwards", 0, 0];
			}
			else if (hand.pitch() < -0.15) {
				ret = ["Hand Is Not Flat, Pitched Forwards", 0, 0];
			}
		}
		else {
			ret = ["No Hand After Check", 0, 0];
		}
	}
	if(ret[1] == 1){
		if(count < 100){
            //console.log(count);
            ++count;
			ret = ["Gathering", count, 1];
			//console.log(frame);
			addHandData(frame);
		}else{
			ret = ["Gathered All Data!", count, 0];
		}
	}
	ret[1] = count;
	return ret;
}

function count_extended_fingers(hand) {
	var extended = 0;
	for(var f = 0; f < hand.fingers.length; f++) {
		var finger = hand.fingers[f];
		if(finger.extended) {
			extended++;
		}
	}
	return extended;
}

function finger_pin(frame){
	var pin_ret = [1, -1];
	var hand;
        
	if(frame.hands.length === 0) {
		pin_ret = ["No Hand", -1];		
	}
	else if(frame.hands.length > 1) {
		pin_ret = ["More than One Hand", -1];
	}
	else {
		if(frame.hands[0]) {
			hand = frame.hands[0];
			pin_ret = ["Passed", count_extended_fingers(hand)];
			//console.log(count_extended_fingers(hand));
		}
	}
	
	return pin_ret;
}