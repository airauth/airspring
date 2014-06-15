// Extension JS code goes here :)
function auth_ready(frame, count) {
	var ret = ["Passed", 1];
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
				ret = ["5 Fingers Not Showing", 0];
			}
			else if (hand.palmPosition[0] > 50) {
				ret = ["Hand Too Far Right", 0];
			}
			else if (hand.palmPosition[0] < -50) {
				ret = ["Hand Too Far Left", 0];
			}
			else if (hand.palmPosition[1] > 115) {
				ret = ["Hand Too High", 0];
			}
			else if (hand.palmPosition[1] < 110) {
				ret = ["Hand Too Low", 0];
			}
			else if (hand.palmPosition[2] < -50) {
				ret = ["Hand Too Far From Body", 0];
			}
			else if (hand.palmPosition[2] > 50) {
				ret = ["Hand Too Close To Body", 0];
			}
			else if(hand.grabStrength > 0.01) {
				ret = ["Fingers Not Straight Enough", 0];
			}
			else if (hand.roll() > 0.15) {
				ret = ["Hand Is Not Flat, Rolled Left", 0];
			}
			else if (hand.roll() < -0.15) {
				ret = ["Hand Is Not Flat, Rolled Right", 0];
			}
			else if (hand.pitch() > 0.15) {
				ret = ["Hand Is Not Flat, Pitched Backwards", 0];
			}
			else if (hand.pitch() < -0.15) {
				ret = ["Hand Is Not Flat, Pitched Forwards", 0];
			}
		}
		else {
			ret = ["No Hand After Check", 0];
		}
	}
	if(ret[1] == 1){
		if(count < 200){
			++count;
			ret = ["Gathering", count];
			//add hand data here
		}else{
			ret = ["Gathered All Data!", count];
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




function generateChart(data, div_id){
	console.log(data);
	var highcharts_data = {
                    chart: {
                        zoomType: 'x'
                    },
                    title: {
                        text: 'Air.Auth Hand Data Visualization'
                    },
                    subtitle: {
                        text: document.ontouchstart === undefined ?
                            'Click and drag in the plot area to zoom in' :
                            'Pinch the chart to zoom in'
                    },
                    xAxis: {
                        type: 'datetime',
                        minRange: 14 * 24 * 3600000 // fourteen days
                    },
                    yAxis: {
                        title: {
                            text: 'Exchange rate'
                        }
                    },
                    legend: {
                        enabled: false
                    },
                    plotOptions: {
                        area: {
                            fillColor: {
                                linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1},
                                stops: [
                                    [0, Highcharts.getOptions().colors[0]],
                                    [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                                ]
                            },
                            marker: {
                                radius: 2
                            },
                            lineWidth: 1,
                            states: {
                                hover: {
                                    lineWidth: 1
                                }
                            },
                            threshold: null
                        }
                    },
            
                    series: [{
                        type: 'area',
                        name: 'USD to EUR',
                        pointInterval: 24 * 3600 * 1000,
                        pointStart: Date.UTC(2006, 0, 01),
                        data: data
                    }]
                };

  $(function () {
          $(div_id).highcharts(highcharts_data);
      });
}