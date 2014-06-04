// Extension JS code goes here :)
function auth_ready(frame) {
	var ret = "Passed";
	var hand;
	if(frame.hands.length === 0) {
		ret = "No Hand";		
	}
	else if(frame.hands.length > 1) {
		ret = "More than One Hand";
	}
	else {
		if(frame.hands[0]) {
			hand = frame.hands[0];
			if (count_extended_fingers(hand) < 5) {
				ret = "5 Fingers Not Showing";
			}
			else if (hand.palmPosition[0] > 50) {
				ret = "Hand Too Far Right";
			}
			else if (hand.palmPosition[0] < -50) {
				ret = "Hand Too Far Left";
			}
			else if (hand.palmPosition[1] > 150) {
				ret = "Hand Too High";
			}
			else if (hand.palmPosition[1] < 100) {
				ret = "Hand Too Low";
			}
			else if (hand.palmPosition[2] < -50) {
				ret = "Hand Too Far From Body";
			}
			else if (hand.palmPosition[2] > 50) {
				ret = "Hand Too Close To Body";
			}
			else if(hand.grabStrength > 0.01) {
				ret = "Fingers Not Straight Enough";
			}
			else if (hand.roll() > 0.15) {
				ret = "Hand Is Not Flat, Rolled Left";
			}
			else if (hand.roll() < -0.15) {
				ret = "Hand Is Not Flat, Rolled Right";
			}
			else if (hand.pitch() > 0.15) {
				ret = "Hand Is Not Flat, Pitched Backwards";
			}
			else if (hand.pitch() < -0.15) {
				ret = "Hand Is Not Flat, Pitched Forwards";
			}
		}
		else {
			ret = "No Hand After Check";
		}
	}
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