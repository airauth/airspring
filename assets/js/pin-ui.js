/*!
 * The MIT License (MIT)
 * 
 * Copyright (c) 2013 Robert O'Leary
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 * ------------------------------ NOTE ----------------------------------
 *
 * The positionPalm and positionFinger functions, as well as the structure of the leap 
 * controller listener below, are based on code from jestPlay (also under the MIT license), by Theo Armour:
 * 
 * 	http://jaanga.github.io/gestification/cookbook/jest-play/r1/jest-play.html
 * 
 * Thanks Theo!
 * 
 * ----------------------------------------------------------------------
 */




jQuery(document).ready(function ($) {
	
	
	//Get vars from url
	var url_query = location.search;
	url_query = url_query.substring(1);
	var parseQueryString = function( queryString ) {
	var params = {}, queries, temp, i, l;
	
	   // Split into key/value pairs
	   queries = queryString.split("&");
	
	   // Convert the array of strings into an object
	   for ( i = 0, l = queries.length; i < l; i++ ) {
	       temp = queries[i].split('=');
	       params[temp[0]] = temp[1];
	   }
	
	   return params;
	};
	url_query = parseQueryString(url_query);
	if (url_query.id != null) {
		var cookie = getOneCookie(url_query.id);
		var obj = JSON.parse(cookie);
		//console.log(obj.u_email);
		$('#user_logged').html('Welcome '+ obj.u_email);
	}
	
	
	function fadeOutAlert() {
		$("#dashboard-messages").delay(4000).fadeOut(function() {
			$(this).remove(); 
		});
	}    
	
	
	if (url_query.message == 1) {
		$('#fade_message').html('Incorrect PIN. Please try again.')
		//console.log('message=',url_query.message);
		fadeOutAlert();
	}else if (url_query.message == 2) {
		$('#fade_message').html('Something went wrong. Please try again.')
		//console.log('message=',url_query.message);
		fadeOutAlert();
	}else{
		$("#dashboard-messages").remove();
	}
	
	var controller = new Leap.Controller();
	var trainer = new LeapTrainer.Controller({controller: controller});

	/*
	 * We get the DOM crawling done now during setup, so it's not consuming cycles at runtime.
	 */
	var 	win				= $(window),
		renderArea 			= $('#render-area'),
		main				= $('#main'),
		wegGlWarning			= $('#webgl-warning'),
		virtualhand			= $('#virtualhand'),
		PINCode				= [],
		scan				= true,
		url				= "http://airauth.cloudnode.co/api/pin/authenticate",
		thumbleft_count			= 0,
		/*
		 * We set up the WebGL renderer - switching to a canvas renderer if needed
		 */
		webGl				= Detector.webgl,
		renderer 			= webGl ? new THREE.WebGLRenderer({antialias:true}) : new THREE.CanvasRenderer(),

		/*
		 * Some constant colors are declared for interface modifications
		 */
		red				= '#EE5A40',
		white				= '#FFFFFF',
		black				= '#000000',
		grey				= '#848484',

		/*
		 * The WebGL variables, materials, and geometry
		 */
		material 			= new THREE.MeshBasicMaterial({color: black }),		// The normal material used to display hands and fingers
		recordingMaterial 		= new THREE.MeshBasicMaterial({color: grey }),	// The material used on hands and fingers during recording
		palmGeometry 			= new THREE.CubeGeometry(60, 10, 60),				// The geometry of a palm
		fingerGeometry 			= webGl ? new THREE.SphereGeometry(5, 20, 10) : new THREE.TorusGeometry(1, 5, 5, 5), // The geometry of a finger (simplified if using a canvas renderer)

		camera 				= new THREE.PerspectiveCamera(45, 2/1, 1, 3000),
		cameraInitialPos		= new THREE.Vector3(0, 0, 450),
		scene 				= new THREE.Scene(),
		controls 			= new THREE.OrbitControls(camera, renderer.domElement),

		/*
		 * When a gesture is being rendered, not all recorded frames will necessarily be needed.  This variable controls the interval between 
		 * frames chosen for rendering.  If 21 frames are recorded and the gestureRenderInterval is 3, then just 7 frames will be rendered.
		 */
		gestureRenderInterval = webGl ? 3 : 6,
		
		/*
		 * And finally we declare some working variables for use below
		 */
		windowHeight, 				// A holding variable for the current window height - used for calculations when the window is resized
		windowWidth, 				// The current window width
		data;

	if (webGl) { wegGlWarning.remove(); } else { wegGlWarning.css({display: 'block'}); }

	
	controls.noPan = true;

	
	/*
	 * ------------------------------------------------------------------------------------------
	 *  4. Handling window resize events
	 * ------------------------------------------------------------------------------------------
	 */

	/*
	 * When the window resizes we update: 
	 * 
	 * 	- The dimensions of the three.js render area
	 *  - The font size, left offset, and width of the output text at the top of the screen (to try to ensure it's visible even when the window gets very small)
	 * 	- The height of the main area, options panel, and overlay shade (to ensure they're all always 100% of the screen height)
	 *  - The size and position of the export/retrain overlay and its contents.
	 */
	function updateDimensions() {

		windowHeight 		= main.innerHeight();
		
		windowWidth 		= virtualhand.innerWidth();

		/*
		 * The three.js area and renderer are resized to fit the page
		 */
		var renderHeight 	= windowHeight - 5;

		renderArea.css({width: windowWidth, height: renderHeight});

		renderer.setSize(windowWidth, renderHeight);

	}			
	
	/*
	 * We fire the dimensions update once to set up the correct initial dimensions.
	 */
	updateDimensions();

	/*
	 * And then bind the update function to window resize events.
	 */
	win.resize(updateDimensions);	
	

	/**
	 * Updates the whole interface to a disabled state.  This function is used when the connection to the Leap Motion is lost.
	 */
	function disableUI(color, message) {
		
		main.css({background: color});
		show_message("hand-alerts", 'alert', message);
	}	
	
	/**
	 * Re-enables the UI after it has been disabled.
	 */
	function enableUI(message) {
		
		main.css({background: ''});
		show_message("hand-alerts", 'info', message);
		setTimeout(function() {changeText("Please enter your PIN then tap to Enter")}, 2000);
	}	
	
	/*
	 * When a known gesture is recognised we select it in the gesture list, render it, update the gesture list entry progress bar to 
	 * match the hit value, and set the output text.
	 */
	trainer.on('gesture-recognized', function(hit, gestureName, allHits) {
		
		//console.log(gestureName);
		var message_contents = $('#hand-alerts').text();
		
		if (gestureName == "THUMB-RIGHT" && scan == true) {
			if (PINCode.length < 4) {
;				show_message("hand-alerts", 'danger', 'PIN must be at least 4 digits');
				setTimeout(function() {show_message("hand-alerts", 'info', message_contents );}, 1500);
			}else{
				
				var cookie_user_data = getCookies();
				var user_ids = []; 
				// Now Parse Object Data 
				for (var key in cookie_user_data) {
				    var obj = cookie_user_data[key];
				    user_ids.push(obj.id); 
				}; 
				var hand_tokens = [];
				var cookie_user_data = getHandCookies();
				for (var key in cookie_user_data) {
				    var obj = cookie_user_data[key];
				    hand_tokens.push(obj.token); 
				};
				
				show_message("hand-alerts", 'success', 'Entered');
				scan = false;
				var data = {'pin': PINCode.join(""), 'user_ids':user_ids, 'hand_tokens':hand_tokens};
				console.log(data);
				$.ajax({ 
					url: url
					, type: 'POST'
					, data: data
					, complete: function() {
					},
	
					success: function(resData) {
						
						/*createCookie(
							       '_airp_'+resData.id,
							       '{"token": "'+resData.token+'"}',
							       0.00964444
						);*/
					    console.log(resData);
					    if (resData.token != null) {
						redirectURL = "chrome-extension://"+location.host+"/launcher.html?id="+resData.id;
						//console.log(redirectURL);
					    } else {
						redirectURL = "chrome-extension://"+location.host+"/scan.html?id="+resData.id;
						//console.log(redirectURL);
					    }
					    setTimeout(function(){redirect_success(redirectURL)},1000)
					 },
			    
					error: function(error) {
					    redirectURL = "chrome-extension://"+location.host+"/pin.html?message=1";
					    //console.log(error.responseText);
					    setTimeout(function(){redirect_error(redirectURL)},500)
					 },
				    });
			}
		}
		//console.log(message_contents.charAt(0));
		if (gestureName == "THUMB-LEFT" && message_contents.charAt(0) != "P" && scan == true) {
			message_contents = message_contents.slice(0, -2);
			if (message_contents == "") {
				$('#hand-alerts').text("Please enter your PIN");
			} else {
				$('#hand-alerts').text(message_contents);	
			}
			PINCode.pop();
		}/*else if (gestureName == "THUMB-LEFT" && message_contents.charAt(0) == "P" && scan == true) {
			//thumbleft_count++;
			if (thumbleft_count >1) {
				redirectURL = "chrome-extension://"+location.host+"/scan.html";
				chrome.extension.sendRequest({redirect: redirectURL});
			}
			
		}*/else if(gestureName != "THUMB-LEFT" && scan == true && gestureName != "THUMB-RIGHT") {
			PINCode.push(gestureName);
			if (message_contents.charAt(0) == "*") {
				var message_contents_final = message_contents.concat("* ");
				//var message_contents_tmp = message_contents.concat(gestureName.charAt(0)+" ");
				$('#hand-alerts').text(message_contents_final);
				//setTimeout(function() {changeText(message_contents_final)}, 1000);
				
			}else{
				$('#hand-alerts').text("* ");
				//$('#hand-alerts').text(gestureName.charAt(0)+" ");
				//setTimeout(function() {changeText("* ")}, 1000);
			}
		}
		
		
	});
	
	function changeText(message) {
		$('#hand-alerts').text(message)
	}
	function redirect_error (redirectURL) {
		chrome.extension.sendRequest({redirect: redirectURL});
	}
	function redirect_success () {
		chrome.extension.sendRequest({redirect: redirectURL});
	}

	/*
	 * ------------------------------------------------------------------------------------------
	 *  8. Leap controller event listeners
	 * ------------------------------------------------------------------------------------------
	 */

	/*
	 * When the controller connects to the Leap web service we update the output text
	 */

	/*
	 * When the connection to the Leap is lost we set the output text and disable the UI, making the background an alarming RED.
	 */
	controller.on('deviceDisconnected', function() { disableUI(red, 'DISCONNECTED!  Check the connection to your Leap Motion'); });
	
	/*
	 * When the connection to the Leap is restored, we re-enable the UI. 
	 */
	controller.on('deviceConnected', function() { enableUI('Connection restored!'); });


	/*
	 * ------------------------------------------------------------------------------------------
	 *  9. WebGL rendering functions
	 * ------------------------------------------------------------------------------------------
	 */

	/*
	 * The camera is set to its initial position
	 */
	camera.position.set(cameraInitialPos.x, cameraInitialPos.y, cameraInitialPos.z);

	/*
	 * The renderer is added to the rendering area in the DOM.  The size of the renderer will be modified when the window is resized.
	 */
	renderArea.append(renderer.domElement);

	/*
	 * Creates a palm mesh
	 */
	function createPalm() { return new THREE.Mesh(palmGeometry, material); }
	
	/*
	 * Creates a finger mesh
	 */
	function createFinger() { return new THREE.Mesh(fingerGeometry, material); }
	
	/*
	 * An inital pair of palm meshs and ten fingers are added to the scene. The second palm and second five fingers 
	 * are initially invisible.  The first palm and fingers are set in a default pose below.
	 */
	var palms = [createPalm(), createPalm()];

	palms[1].visible = false;

	scene.add(palms[0]);
	scene.add(palms[1]);

	var finger, fingers = [];
	
	for (var j = 0; j < 10; j++) { 
		
		finger = new THREE.Mesh(fingerGeometry, material);

		finger.visible = j < 5;
		
		scene.add(finger);

		fingers.push(finger); // Finger meshes are stored for animation below		
	}
	
	/*
	 * We set default a default pose for the one visible (right) hand
	 */
	var defaultHandPosition = true; // This is a flag used to indicate if the scene is currently just showing the default pose
	
	palms[0].position.set(-5.62994, -37.67400000000001, 96.368);
	palms[0].rotation.set(-2.0921488149553125, 0.051271951412566935, -2.6597446090413466);

	fingers[0].position.set(34.179, 24.22, 28.7022);
	fingers[0].rotation.set(-2.777879785829599, 0.02183472660404244, 3.133282166633954);
	fingers[0].scale.z = 8;
	
	fingers[1].position.set(53.8033, -15.913000000000011, 32.6661);
	fingers[1].rotation.set(-2.7753644328170965, 0.22532594370921782, 3.056111568660471);
	fingers[1].scale.z = 5;
	
	fingers[2].position.set(4.69965, 49.19499999999999, 31.643);
	fingers[2].rotation.set(-2.600622653205929, 0.033504548426940645, 3.121471314695975);
	fingers[2].scale.z = 9;
	
	fingers[3].position.set(-23.7075, 50.976, 50.363);
	fingers[3].rotation.set(-2.543443897235925, 0.04106473211751575, 3.113625377842598);
	fingers[3].scale.z = 8;
	
	fingers[4].position.set(-80.6532, -33.772999999999996, 84.7031);
	fingers[4].rotation.set(-2.589002343898949, -0.4631619960981157, -2.872745378807403);
	fingers[4].scale.z = 6;

	/*
	 * Updates the material of the palm and fingers created above.  This function is called when recording starts and ends, in order to 
	 * modify how visible hands look during recording.
	 */
	function setHandMaterial(m) {
		
		palms[0].material = m;
		palms[1].material = m;
		
		for (var i = 0, l = fingers.length; i < l; i++) { fingers[i].material = m; }		
	}
	
	/*
	 * We set the recording material during recording.
	 */
	trainer.on('started-recording', function () { setHandMaterial(recordingMaterial); })
		   .on('stopped-recording', function () { setHandMaterial(material); });
	
	/*
	 * We use Paul Irish's requestAnimFrame function (which is described 
	 * here: http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/) for 
	 * updating the scene.
	 * 	
	 */
	window.requestAnimFrame = (function(){
		  return  window.requestAnimationFrame       ||
		          window.webkitRequestAnimationFrame ||
		          window.mozRequestAnimationFrame    ||
		          function(callback){ window.setTimeout(callback, 1000 / 60); };
		})();
	
	/*
	 * And bind a simple update function into the requestAnimFrame function
	 */
	function updateRender() { controls.update(); TWEEN.update(); renderer.render(scene, camera); requestAnimFrame(updateRender); }

	requestAnimFrame(updateRender);

	/*
	 * In order to avoid as much variable creation as possible during animation, variables are created here once.
	 */
	var hand, palm, position, direction, normal, handFingers, handFingerCount, finger, handCount, palmCount = palms.length;

	/*
	 * TODO: WHY is it necessary to offset mesh positions on the y-axis by 170? I don't know at the moment - but this bit of nonsense should be fixed.
	 */
	var yOffset = -170;	
	
	/*
	 * This section animates the fingers and palm. 
	 * 
	 * The positionPalm and positionFinger functions, as well as the structure of the leap controller listener below, are based on code 
	 * from jestPlay (also under the MIT license), by Theo Armour:
	 * 
	 * 	http://jaanga.github.io/gestification/cookbook/jest-play/r1/jest-play.html
	 * 
	 * Thanks Theo!
	 */
	
	/**
	 * 
	 */
	function positionPalm(hand, palm) {
		
		position = hand.stabilizedPalmPosition || hand.position;

		palm.position.set(position[0], position[1] + yOffset, position[2]); 

		direction = hand.direction;
		
		palm.lookAt(new THREE.Vector3(direction[0], direction[1], direction[2]).add(palm.position));

		normal = hand.palmNormal || hand.normal;
		
		palm.rotation.z = Math.atan2(normal[0], normal[1]);
	}
	
	/**
	 * 
	 */
	function positionFinger(handFinger, finger) {

		position = handFinger.stabilizedTipPosition || handFinger.position;
		
		finger.position.set(position[0], position[1] + yOffset, position[2]);

		direction = handFinger.direction;
		
		finger.lookAt(new THREE.Vector3(direction[0], direction[1], direction[2]).add(finger.position));
		
		finger.scale.z = 0.1 * handFinger.length;		
	}
	
	/*
	 * Now we set up a Leap controller frame listener in order to animate the scene
	 */
	var clock = new THREE.Clock();
	
	clock.previousTime = 1000000;	

	controller.on('frame', function(frame) {

		if (clock.previousTime === 1000000) {

			handCount = frame.hands.length;
			
			for (var i = 0; i < palmCount; i++) { // We attempt to position all (normally, both) rendered hands
				
				palm = palms[i];

				if (i >= handCount) {
				
					if (!defaultHandPosition) { // If the default pose is showing we don't update anything

						palm.visible = false;

						for (var j = 0, k = 5, p; j < k; j++) { p = (i * 5) + j; fingers[p].visible = false; };						
					}

				} else {
					
					defaultHandPosition = false;
					
					hand = frame.hands[i];

					positionPalm(hand, palm);
					
					palm.visible = true;

					handFingers 	= hand.fingers;
					handFingerCount = handFingers.length;

					/*
					 * 
					 */
					for (var j = 0, k = 5; j < k; j++) {
						
						finger = fingers[(i * 5) + j];

						if (j >= handFingerCount) {
							
							finger.visible = false;
							
						} else {

							positionFinger(handFingers[j], finger);
							
							finger.visible = true;
						}
					};
				}
			}	
		}
	});	
	
	/*
	 * Finally we set up the rendering of gestures.  Gestures are rendered by placing hand renders periodically along a recorded set of 
	 * hand positions. 
	 * 
	 * We save each render in the renderedHands array so that the previous gesture can be deleted before a new one is rendered.
	 */
	var renderedHands = [];
	
	/*
	 * Removes the currently rendered gesture, if any.
	 */
	function clearGesture() {
		
		new TWEEN.Tween(camera.position).to({x: cameraInitialPos.x, y: cameraInitialPos.y, z: cameraInitialPos.z}).easing(TWEEN.Easing.Exponential.Out).start();
		new TWEEN.Tween(camera.rotation).to({x: 0, y: 0, z: 0}).easing(TWEEN.Easing.Exponential.Out).start();

		for (var i = 0, l = renderedHands.length; i < l; i++) { scene.remove(renderedHands[i]); }
		
		renderedHands = [];
	}
	
	/**
	 * This function is called when a training gesture is saved and when a gesture is recognized.  It depends on the LeapTrainer 
	 * Controller providing a renderableGesture array.
	 */
	function renderGesture() {
		
		if (!webGl) { return; } // Gesture renders are entirely disabled for canvas renderers (it's just too slow at the moment!)

		/*
		 * Only one gesture is rendered at a time, so first the current gesture - if any - is removed.
		 */
		clearGesture();

		/*
		 * The LeapTrainer controller should provide a renderableGesture array, which should always contain positioning data for the 
		 * LAST gesture recorded.
		 */
		var gestureFrames = trainer.renderableGesture;
		
		if (!gestureFrames || gestureFrames.length == 0) { return; } // If the controller doesn't supply this variable, or the array is empty, we return.

		/*
		 * Some variables are set up in order to avoid creation in the loops
		 */
		var frame, hand, handObject, palm, fingers, finger, fingerMesh, material;
		
		for (var i = 0, l = gestureFrames.length; i < l; i += gestureRenderInterval) { // Not all frames are necessarily rendered
			
			frame = gestureFrames[i];
			
			/*
			 * TODO: It sucks that new materials are being created in a loop here - but the frame count is variable, and the opacity increases 
			 * as the frame gets closer to the end.. So for the moment, this is how it is.
			 */
			material = new THREE.MeshBasicMaterial({wireframe: true, color: white, transparent: true, opacity: Math.min(0.02 * i, 0.5) });
			
			for (var j = 0, k = frame.length; j < k; j++) {
				
				hand = frame[j];
				
				handObject = new THREE.Object3D();
				
				/*
				 * Palm
				 */
				palm = createPalm();
				
				palm.material = material;
				
				positionPalm(hand, palm);

				handObject.add(palm);
				
				/*
				 * Fingers
				 */	
				fingers = hand.fingers;

				for (var p = 0, q = fingers.length; p < q; p++) {
					
					finger = fingers[p];
					
					fingerMesh = createFinger();

					fingerMesh.material = material;
					
					positionFinger(finger, fingerMesh);

					handObject.add(fingerMesh);
				}

				renderedHands.push(handObject);
				
				scene.add(handObject);
			}
		}
	}	


	/*
	 * ------------------------------------------------------------------------------------------
	 *  10. And finally...
	 * ------------------------------------------------------------------------------------------
	 */

	/*
	 * And finally we connect to the device
	 */
	controller.connect();
	
	//Add pre recorded gestures
	trainer.fromJSON('{"name":"5 - R - [ 1 1 1 1 1 ]","pose":true,"data":[[{"x":0.15846420623616914,"y":-0.05243499183150489,"z":0.14135659145826984,"stroke":1},{"x":0.053001734053509886,"y":-0.042058371891306526,"z":0.12104271737884298,"stroke":1},{"x":-0.052460738129149254,"y":-0.03168175195110816,"z":0.10072884329941634,"stroke":1},{"x":-0.15792321031180845,"y":-0.0213051320109098,"z":0.08041496921998958,"stroke":1},{"x":-0.26338568249446764,"y":-0.010928512070711431,"z":0.06010109514056272,"stroke":1},{"x":-0.3688481546771269,"y":-0.0005518921305130639,"z":0.03978722106113597,"stroke":1},{"x":0.631151845322873,"y":0.15896065188605385,"z":-0.5434314375582171,"stroke":1}],[{"x":0.15643816244440784,"y":-0.05153353457710117,"z":0.1428141348478691,"stroke":1},{"x":0.05168480558886507,"y":-0.040791255226798384,"z":0.12206805183457581,"stroke":1},{"x":-0.0530685512666777,"y":-0.030048975876495604,"z":0.10132196882128275,"stroke":1},{"x":-0.15782190812222038,"y":-0.019306696526193087,"z":0.08057588580798958,"stroke":1},{"x":-0.2625752649777631,"y":-0.0085644171758903,"z":0.059829802794696296,"stroke":1},{"x":-0.3673286218333059,"y":0.0021778621744122165,"z":0.03908371978140324,"stroke":1},{"x":0.6326713781666942,"y":0.14806701720806634,"z":-0.5456935638878168,"stroke":1}],[{"x":0.15607901657178996,"y":-0.051135914376627255,"z":0.14441506061096998,"stroke":1},{"x":0.05145136077166351,"y":-0.040071028230167435,"z":0.12358788043218916,"stroke":1},{"x":-0.053176295028462994,"y":-0.029006142083707352,"z":0.10276070025340811,"stroke":1},{"x":-0.1578039508285895,"y":-0.01794125593724754,"z":0.08193352007462718,"stroke":1},{"x":-0.262431606628716,"y":-0.00687636979078745,"z":0.06110633989584635,"stroke":1},{"x":-0.3670592624288425,"y":0.004188516355672363,"z":0.040279159717065305,"stroke":1},{"x":0.6329407375711575,"y":0.1408421940628647,"z":-0.5540826609841061,"stroke":1}],[{"x":0.1558511816120715,"y":-0.0549964402456587,"z":0.14493846281913325,"stroke":1},{"x":0.05130326804784646,"y":-0.042533944229588005,"z":0.12378170461591242,"stroke":1},{"x":-0.053244645516378586,"y":-0.03007144821351731,"z":0.10262494641269171,"stroke":1},{"x":-0.15779255908060366,"y":-0.017608952197446612,"z":0.08146818820947077,"stroke":1},{"x":-0.26234047264482874,"y":-0.005146456181375915,"z":0.060311430006250055,"stroke":1},{"x":-0.3668883862090538,"y":0.007316039834694789,"z":0.03915467180302923,"stroke":1},{"x":0.6331116137909463,"y":0.14304120123289177,"z":-0.5522794038664877,"stroke":1}],[{"x":0.15648159431282088,"y":-0.05456718017987193,"z":0.14639683320432084,"stroke":1},{"x":0.05171303630333357,"y":-0.0421821263347442,"z":0.124302798210149,"stroke":1},{"x":-0.05305552170615374,"y":-0.029797072489616466,"z":0.10220876321597716,"stroke":1},{"x":-0.15782407971564105,"y":-0.017412018644488735,"z":0.08011472822180543,"stroke":1},{"x":-0.26259263772512836,"y":-0.0050269647993612665,"z":0.05802069322763348,"stroke":1},{"x":-0.36736119573461573,"y":0.007358089045766465,"z":0.03592665823346164,"stroke":1},{"x":0.6326388042653843,"y":0.14162727340231612,"z":-0.5469704743133479,"stroke":1}]]}');
	trainer.fromJSON('{"name":"4 - R - [ 0 1 1 1 1 ]","pose":true,"data":[[{"x":-0.004860071280314793,"y":-0.11327266045004425,"z":0.3371870145199918,"stroke":1},{"x":-0.06264958689475639,"y":-0.08166171350257986,"z":0.2348748058079967,"stroke":1},{"x":-0.12043910250919798,"y":-0.050050766555115464,"z":0.1325625970960016,"stroke":1},{"x":-0.17822861812363958,"y":-0.018439819607651065,"z":0.0302503883840064,"stroke":1},{"x":-0.23601813373808112,"y":0.013171127339813321,"z":-0.07206182032798869,"stroke":1},{"x":0.6021955125459897,"y":0.25025383277557733,"z":-0.6628129854800082,"stroke":1}],[{"x":-0.0058786246014594645,"y":-0.11112305966974088,"z":0.337357267103196,"stroke":1},{"x":-0.06283759288726345,"y":-0.08068926657786499,"z":0.2349429068412784,"stroke":1},{"x":-0.11979656117306743,"y":-0.05025547348598908,"z":0.13252854657936086,"stroke":1},{"x":-0.1767555294588714,"y":-0.019821680394113167,"z":0.030114186317443337,"stroke":1},{"x":-0.23371449774467537,"y":0.010612112697762355,"z":-0.07230017394447419,"stroke":1},{"x":0.5989828058653373,"y":0.2512773674299457,"z":-0.662642732896804,"stroke":1}],[{"x":-0.0064053956247657196,"y":-0.10961008165847068,"z":0.3370621587480078,"stroke":1},{"x":-0.0628419845282695,"y":-0.07964808836502996,"z":0.23482486349920317,"stroke":1},{"x":-0.11927857343177335,"y":-0.04968609507158922,"z":0.1325875682503983,"stroke":1},{"x":-0.1757151623352772,"y":-0.019724101778148484,"z":0.030350273001593653,"stroke":1},{"x":-0.23215175123878104,"y":0.010237891515292238,"z":-0.07188702224721111,"stroke":1},{"x":0.5963928671588665,"y":0.2484304753579461,"z":-0.6629378412519922,"stroke":1}],[{"x":-0.004548216411967981,"y":-0.10402301884245606,"z":0.3362813894034735,"stroke":1},{"x":-0.061033343429099635,"y":-0.07608808652534035,"z":0.23451255576138952,"stroke":1},{"x":-0.11751847044623126,"y":-0.04815315420822465,"z":0.1327437221193053,"stroke":1},{"x":-0.17400359746336286,"y":-0.020218221891108945,"z":0.030974888477221074,"stroke":1},{"x":-0.23048872448049454,"y":0.007716710426006759,"z":-0.07079394516486304,"stroke":1},{"x":0.5875923522311564,"y":0.24076577104112318,"z":-0.6637186105965265,"stroke":1}],[{"x":-0.002821869086251483,"y":-0.09912045102922458,"z":0.3351952222385507,"stroke":1},{"x":-0.05923890985461994,"y":-0.07275941354161514,"z":0.23407808889542026,"stroke":1},{"x":-0.11565595062298846,"y":-0.046398376054005694,"z":0.13296095555228993,"stroke":1},{"x":-0.17207299139135693,"y":-0.02003733856639625,"z":0.0318438222091596,"stroke":1},{"x":-0.2284900321597254,"y":0.006323698921212831,"z":-0.06927331113397084,"stroke":1},{"x":0.5782797531149421,"y":0.23199188027002893,"z":-0.6648047777614493,"stroke":1}]]}');
	trainer.fromJSON('{"name":"3 - R - [ 1 1 1 0 0 ]","pose":true,"data":[[{"x":0.13265084511050695,"y":-0.04988981971370192,"z":0.21036593408516868,"stroke":1},{"x":0.041031454408780255,"y":-0.05836810658242546,"z":0.20172765568086137,"stroke":1},{"x":-0.05058793629294642,"y":-0.06684639345114901,"z":0.19308937727655417,"stroke":1},{"x":-0.1422073269946731,"y":-0.07532468031987255,"z":0.18445109887224698,"stroke":1},{"x":0.019112963768332325,"y":0.2504290000671489,"z":-0.7896340659148313,"stroke":1}],[{"x":0.13093684590888136,"y":-0.048204673600024915,"z":0.21030646953140208,"stroke":1},{"x":0.03899312946479852,"y":-0.056910534533651025,"z":0.2017177449219002,"stroke":1},{"x":-0.052950586979284286,"y":-0.06561639546727714,"z":0.19312902031239843,"stroke":1},{"x":-0.1448943034233671,"y":-0.07432225640090326,"z":0.18454029570289654,"stroke":1},{"x":0.027914915028971504,"y":0.2450538600018564,"z":-0.7896935304685979,"stroke":1}],[{"x":0.12917036662824075,"y":-0.043954736347630204,"z":0.21018196281380808,"stroke":1},{"x":0.03735578555508154,"y":-0.052779339149217855,"z":0.20169699380230133,"stroke":1},{"x":-0.05445879551807768,"y":-0.061603941950805506,"z":0.19321202479079447,"stroke":1},{"x":-0.14627337659123688,"y":-0.07042854475239316,"z":0.1847270557792876,"stroke":1},{"x":0.034206019925992204,"y":0.22876656220004668,"z":-0.7898180371861919,"stroke":1}],[{"x":0.12664237635071973,"y":-0.042224908592627786,"z":0.21017098526474087,"stroke":1},{"x":0.03506501033169432,"y":-0.0507223733775042,"z":0.20169516421079015,"stroke":1},{"x":-0.05651235568733115,"y":-0.05921983816238062,"z":0.19321934315683953,"stroke":1},{"x":-0.1480897217063566,"y":-0.06771730294725704,"z":0.1847435221028888,"stroke":1},{"x":0.04289469071127369,"y":0.21988442307976963,"z":-0.7898290147352591,"stroke":1}],[{"x":0.12579367621669077,"y":-0.042231859639461446,"z":0.20964619577944354,"stroke":1},{"x":0.03344848521113014,"y":-0.05017373003254862,"z":0.20160769929657385,"stroke":1},{"x":-0.05889670579443043,"y":-0.058115600425635794,"z":0.19356920281370427,"stroke":1},{"x":-0.15124189679999103,"y":-0.06605747081872297,"z":0.18553070633083457,"stroke":1},{"x":0.05089644116660055,"y":0.21657866091636885,"z":-0.7903538042205565,"stroke":1}]]}');
	trainer.fromJSON('{"name":"3 - R - [ 0 1 1 1 0 ]","pose":true,"data":[[{"x":0.003946730202784243,"y":-0.08482237321394351,"z":0.27555660375281155,"stroke":1},{"x":-0.027431136993097308,"y":-0.06761404555198096,"z":0.21259276729213517,"stroke":1},{"x":-0.05880900418897885,"y":-0.05040571789001872,"z":0.1496289308314589,"stroke":1},{"x":-0.0901868713848604,"y":-0.03319739022805648,"z":0.08666509437078251,"stroke":1},{"x":0.17248028236415228,"y":0.23603952688399968,"z":-0.7244433962471885,"stroke":1}],[{"x":0.0013163375523480847,"y":-0.08611944284195609,"z":0.27579080500261566,"stroke":1},{"x":-0.02991062082556778,"y":-0.0683640264029147,"z":0.21263180083376942,"stroke":1},{"x":-0.061137579203483644,"y":-0.050608609963873306,"z":0.14947279666492297,"stroke":1},{"x":-0.09236453758139951,"y":-0.03285319352483191,"z":0.08631379249607651,"stroke":1},{"x":0.18209640005810285,"y":0.23794527273357602,"z":-0.7242091949973843,"stroke":1}],[{"x":0.0020579543059784655,"y":-0.08646630004967275,"z":0.2761342018472437,"stroke":1},{"x":-0.030552507717991437,"y":-0.0685809840368287,"z":0.21268903364120728,"stroke":1},{"x":-0.06316296974196134,"y":-0.05069566802398467,"z":0.1492438654351711,"stroke":1},{"x":-0.09577343176593124,"y":-0.032810352011140624,"z":0.08579869722913469,"stroke":1},{"x":0.18743095491990558,"y":0.23855330412162673,"z":-0.7238657981527563,"stroke":1}],[{"x":0.004840660976499253,"y":-0.09173333823080987,"z":0.2763729703550579,"stroke":1},{"x":-0.02859810223370582,"y":-0.07295461884883414,"z":0.21272882839250973,"stroke":1},{"x":-0.06203686544391088,"y":-0.054175899466858427,"z":0.1490846864299613,"stroke":1},{"x":-0.09547562865411593,"y":-0.035397180084882705,"z":0.08544054446741312,"stroke":1},{"x":0.18126993535523342,"y":0.25426103663138516,"z":-0.7236270296449421,"stroke":1}],[{"x":0.004726809507569388,"y":-0.08991857944011317,"z":0.27632054764471403,"stroke":1},{"x":-0.028301296715163418,"y":-0.07139784683167619,"z":0.21272009127411895,"stroke":1},{"x":-0.06132940293789626,"y":-0.052877114223239215,"z":0.14911963490352398,"stroke":1},{"x":-0.0943575091606291,"y":-0.03435638161480224,"z":0.08551917853292901,"stroke":1},{"x":0.17926139930611937,"y":0.24854992210983085,"z":-0.723679452355286,"stroke":1}]]}');
	trainer.fromJSON('{"name":"3 - R - [ 0 0 1 1 1 ]","pose":true,"data":[[{"x":-0.12514653150109892,"y":-0.2056977594183042,"z":0.3373899894468272,"stroke":1},{"x":-0.14722813559269246,"y":-0.15597854225383911,"z":0.22289833157447114,"stroke":1},{"x":-0.16930973968428603,"y":-0.10625932508937405,"z":0.10840667370211521,"stroke":1},{"x":-0.19139134377587957,"y":-0.05654010792490896,"z":-0.006084984170240837,"stroke":1},{"x":0.633075750553957,"y":0.5244757346864264,"z":-0.6626100105531728,"stroke":1}],[{"x":-0.12944524006029068,"y":-0.20493377343053343,"z":0.33599596158232337,"stroke":1},{"x":-0.14929467962591916,"y":-0.15505487292287592,"z":0.22266599359705375,"stroke":1},{"x":-0.16914411919154768,"y":-0.10517597241521841,"z":0.10933602561178424,"stroke":1},{"x":-0.1889935587571762,"y":-0.05529707190756089,"z":-0.003993942373485382,"stroke":1},{"x":0.6368775976349338,"y":0.5204616906761886,"z":-0.6640040384176766,"stroke":1}],[{"x":-0.13389848735437707,"y":-0.207133297571178,"z":0.33631357640351,"stroke":1},{"x":-0.15353210513915244,"y":-0.15620598901580535,"z":0.22271892940058513,"stroke":1},{"x":-0.1731657229239278,"y":-0.10527868046043315,"z":0.10912428239766014,"stroke":1},{"x":-0.19279934070870314,"y":-0.05435137190506095,"z":-0.004470364605264843,"stroke":1},{"x":0.6533956561261605,"y":0.5229693389524774,"z":-0.66368642359649,"stroke":1}],[{"x":-0.13869393155228832,"y":-0.20858366646446194,"z":0.33654608296789024,"stroke":1},{"x":-0.1580065224949186,"y":-0.15677629490455477,"z":0.2227576804946485,"stroke":1},{"x":-0.1773191134375488,"y":-0.10496892334464761,"z":0.10896927802140677,"stroke":1},{"x":-0.19663170438017907,"y":-0.05316155178474044,"z":-0.004819124451835077,"stroke":1},{"x":0.6706512718649348,"y":0.5234904364984048,"z":-0.6634539170321098,"stroke":1}],[{"x":-0.14055535297277247,"y":-0.21020603286760906,"z":0.33633790188170676,"stroke":1},{"x":-0.15989665499022454,"y":-0.1575425465638442,"z":0.2227229836469511,"stroke":1},{"x":-0.17923795700767667,"y":-0.10487906026007889,"z":0.10910806541219564,"stroke":1},{"x":-0.1985792590251288,"y":-0.05221557395631404,"z":-0.004506852822560026,"stroke":1},{"x":0.6782692239958024,"y":0.524843213647846,"z":-0.6636620981182932,"stroke":1}]]}');
	trainer.fromJSON('{"name":"2 - R - [ 0 1 1 0 0 ]","pose":true,"data":[[{"x":0.006952549319134763,"y":-0.040198808868684315,"z":0.2892827045247872,"stroke":1},{"x":-0.01276250705085541,"y":-0.0342069994950778,"z":0.23690576515840422,"stroke":1},{"x":-0.03247756342084558,"y":-0.028215190121471286,"z":0.18452882579202134,"stroke":1},{"x":0.03828752115256624,"y":0.1026209984852334,"z":-0.7107172954752128,"stroke":1}],[{"x":0.006210296840389672,"y":-0.05272679665850634,"z":0.2894503931940926,"stroke":1},{"x":-0.01357276858212653,"y":-0.04443968156364617,"z":0.23684986893530258,"stroke":1},{"x":-0.03335583400464273,"y":-0.03615256646878601,"z":0.18424934467651255,"stroke":1},{"x":0.04071830574637961,"y":0.13331904469093853,"z":-0.7105496068059074,"stroke":1}],[{"x":0.0027300323475986515,"y":-0.05993890312593783,"z":0.28952107659059645,"stroke":1},{"x":-0.016138076348515024,"y":-0.05023406902412837,"z":0.2368263078031344,"stroke":1},{"x":-0.0350061850446287,"y":-0.04052923492231891,"z":0.18413153901567259,"stroke":1},{"x":0.04841422904554506,"y":0.1507022070723851,"z":-0.7104789234094036,"stroke":1}],[{"x":0.0006714351859347795,"y":-0.06852916689471407,"z":0.2897986238137302,"stroke":1},{"x":-0.01826172799869159,"y":-0.057084171382262995,"z":0.2367337920620899,"stroke":1},{"x":-0.037194891183317924,"y":-0.04563917586981192,"z":0.18366896031044955,"stroke":1},{"x":0.05478518399607474,"y":0.171252514146789,"z":-0.7102013761862698,"stroke":1}],[{"x":-0.0016154019894295685,"y":-0.07633973013197348,"z":0.2901744140674962,"stroke":1},{"x":-0.021160716761537454,"y":-0.0631205228691531,"z":0.23660852864416793,"stroke":1},{"x":-0.04070603153364534,"y":-0.049901315606332694,"z":0.18304264322083963,"stroke":1},{"x":0.06348215028461236,"y":0.18936156860745929,"z":-0.7098255859325038,"stroke":1}]]}');
	trainer.fromJSON('{"name":"2 - R - [ 1 1 0 0 0 ]","pose":true,"data":[[{"x":0.193069269075672,"y":-0.062204099352462516,"z":0.23865505145703236,"stroke":1},{"x":0.09847466278482186,"y":-0.07729553273601969,"z":0.24773101029140654,"stroke":1},{"x":0.0038800564939716065,"y":-0.09238696611957685,"z":0.2568069691257805,"stroke":1},{"x":-0.29542398835446537,"y":0.231886598208059,"z":-0.7431930308742195,"stroke":1}],[{"x":0.1951752627612851,"y":-0.058810972896196106,"z":0.23755209084813267,"stroke":1},{"x":0.10031389333891927,"y":-0.0735903402596557,"z":0.2475104181696266,"stroke":1},{"x":0.005452523916553376,"y":-0.08836970762311532,"z":0.2574687454911204,"stroke":1},{"x":-0.30094168001675775,"y":0.22077102077896715,"z":-0.7425312545088796,"stroke":1}],[{"x":0.1843053443096655,"y":-0.04794369091628911,"z":0.23883957388999844,"stroke":1},{"x":0.09070463367672899,"y":-0.058016921083594165,"z":0.24776791477799975,"stroke":1},{"x":-0.0028960769562076383,"y":-0.06809015125089922,"z":0.25669625566600096,"stroke":1},{"x":-0.2721139010301869,"y":0.1740507632507825,"z":-0.743303744333999,"stroke":1}],[{"x":0.18481446199239915,"y":-0.058785314531224576,"z":0.23663440929100543,"stroke":1},{"x":0.08954837949673417,"y":-0.06411394019422419,"z":0.24732688185820106,"stroke":1},{"x":-0.005717702998930763,"y":-0.0694425658572238,"z":0.2580193544253968,"stroke":1},{"x":-0.2686451384902026,"y":0.19234182058267257,"z":-0.7419806455746032,"stroke":1}],[{"x":0.1826143990017931,"y":-0.05418912170252701,"z":0.2366002870675178,"stroke":1},{"x":0.08777157034341032,"y":-0.05863958879327775,"z":0.2473200574135036,"stroke":1},{"x":-0.007071258314972573,"y":-0.0630900558840285,"z":0.2580398277594893,"stroke":1},{"x":-0.26331471103023074,"y":0.17591876637983328,"z":-0.7419601722405107,"stroke":1}]]}');
	trainer.fromJSON('{"name":"2 - R - [ 0 0 0 1 1 ]","pose":true,"data":[[{"x":-0.24868381291585728,"y":-0.10861025874935037,"z":0.3190047780019165,"stroke":1},{"x":-0.23295169120704406,"y":-0.07651205344059614,"z":0.2269984073326946,"stroke":1},{"x":-0.21721956949823085,"y":-0.04441384813184192,"z":0.1349920366634727,"stroke":1},{"x":0.6988550736211322,"y":0.22953616032178847,"z":-0.6809952219980835,"stroke":1}],[{"x":-0.22555654391598018,"y":-0.11030038917319851,"z":0.3157674568080244,"stroke":1},{"x":-0.21206842239306256,"y":-0.07971710244913476,"z":0.22807751439732515,"stroke":1},{"x":-0.19858030087014494,"y":-0.04913381572507101,"z":0.140387571986626,"stroke":1},{"x":0.6362052671791876,"y":0.23915130734740425,"z":-0.6842325431919756,"stroke":1}],[{"x":-0.23064587745272264,"y":-0.11207190001253237,"z":0.3168152067498631,"stroke":1},{"x":-0.21642303448842745,"y":-0.08211579453077478,"z":0.22772826441671223,"stroke":1},{"x":-0.2022001915241323,"y":-0.05215968904901677,"z":0.1386413220835615,"stroke":1},{"x":0.6492691034652824,"y":0.24634738359232394,"z":-0.6831847932501369,"stroke":1}],[{"x":-0.22803521264626542,"y":-0.11669757670434125,"z":0.31630366936018106,"stroke":1},{"x":-0.21431851631045762,"y":-0.08421068182262413,"z":0.22789877687993965,"stroke":1},{"x":-0.20060181997464985,"y":-0.05172378694090701,"z":0.13949388439969812,"stroke":1},{"x":0.642955548931373,"y":0.25263204546787243,"z":-0.6836963306398189,"stroke":1}],[{"x":-0.2251826096343082,"y":-0.11552662556068186,"z":0.31641486147296216,"stroke":1},{"x":-0.21258919684005187,"y":-0.08382411816880325,"z":0.2278617128423459,"stroke":1},{"x":-0.19999578404579554,"y":-0.05212161077692465,"z":0.13930856421172977,"stroke":1},{"x":0.6377675905201556,"y":0.2514723545064098,"z":-0.6835851385270378,"stroke":1}]]}');
	trainer.fromJSON('{"name":"1 - R - [ 0 1 0 0 0 ]","pose":true,"data":[[{"x":0.13466857039905794,"y":-0.04677635033997077,"z":0.3472222222222222,"stroke":1},{"x":0.11850834195117099,"y":-0.04116318829917435,"z":0.30555555555555547,"stroke":1},{"x":-0.25317691235022893,"y":0.08793953863914511,"z":-0.6527777777777778,"stroke":1}],[{"x":0.12391144942401464,"y":-0.03846039907224862,"z":0.3472222222222222,"stroke":1},{"x":0.10904207549313291,"y":-0.03384515118357873,"z":0.30555555555555547,"stroke":1},{"x":-0.23295352491714758,"y":0.07230555025582736,"z":-0.6527777777777778,"stroke":1}],[{"x":0.12731529618395854,"y":-0.031416213326960554,"z":0.3472222222222222,"stroke":1},{"x":0.11203746064188341,"y":-0.02764626772772531,"z":0.3055555555555556,"stroke":1},{"x":-0.239352756825842,"y":0.05906248105468587,"z":-0.6527777777777778,"stroke":1}],[{"x":0.12934882078233073,"y":-0.02899789141389043,"z":0.3472222222222222,"stroke":1},{"x":0.11382696228845107,"y":-0.025518144444223557,"z":0.3055555555555557,"stroke":1},{"x":-0.2431757830707818,"y":0.05451603585811397,"z":-0.6527777777777778,"stroke":1}],[{"x":0.13295706150158784,"y":-0.029061458541039597,"z":0.3472222222222222,"stroke":1},{"x":0.1170022141213973,"y":-0.02557408351611496,"z":0.3055555555555556,"stroke":1},{"x":-0.24995927562298506,"y":0.054635542057154554,"z":-0.6527777777777778,"stroke":1}]]}');
	//trainer.fromJSON('{"name":"1-TR","pose":true,"data":[[{"x":0.3472222222222222,"y":0.011260365314534695,"z":0.002833339050952997,"stroke":1},{"x":0.3055555555555556,"y":0.009909121476790635,"z":0.00249333836483863,"stroke":1},{"x":-0.6527777777777778,"y":-0.02116948679132533,"z":-0.005326677415791628,"stroke":1}],[{"x":0.3472222222222222,"y":0.011043829221500323,"z":0.001476831011532349,"stroke":1},{"x":0.3055555555555556,"y":0.009718569714920206,"z":0.0012996112901484734,"stroke":1},{"x":-0.6527777777777778,"y":-0.020762398936420526,"z":-0.0027764423016808227,"stroke":1}],[{"x":0.3472222222222222,"y":0.01197616956467008,"z":0.0007396263399824794,"stroke":1},{"x":0.3055555555555556,"y":0.010539029216909631,"z":0.0006508711791845903,"stroke":1},{"x":-0.6527777777777778,"y":-0.022515198781579714,"z":-0.0013904975191670697,"stroke":1}],[{"x":0.3472222222222222,"y":0.013522222202856062,"z":-0.0006169159276324013,"stroke":1},{"x":0.30555555555555547,"y":0.01189955553851341,"z":-0.0005428860163165132,"stroke":1},{"x":-0.6527777777777778,"y":-0.025421777741369462,"z":0.0011598019439489145,"stroke":1}],[{"x":0.3472222222222222,"y":0.01320068269477663,"z":-0.0007683357770425007,"stroke":1},{"x":0.3055555555555556,"y":0.011616600771403397,"z":-0.0006761354837974007,"stroke":1},{"x":-0.6527777777777778,"y":-0.024817283466180035,"z":0.001444471260839901,"stroke":1}]]}');
	//trainer.fromJSON('{"name":"1-TL","pose":true,"data":[[{"x":-0.34722222222222227,"y":-0.09703647643239943,"z":-0.022382853045624207,"stroke":1},{"x":-0.3055555555555556,"y":-0.08539209926051153,"z":-0.019696910680149334,"stroke":1},{"x":0.6527777777777777,"y":0.182428575692911,"z":0.042079763725773545,"stroke":1}],[{"x":-0.34722222222222227,"y":-0.1043825732212205,"z":-0.023574968323618595,"stroke":1},{"x":-0.3055555555555556,"y":-0.09185666443467405,"z":-0.020745972124784344,"stroke":1},{"x":0.6527777777777777,"y":0.19623923765589452,"z":0.04432094044840294,"stroke":1}],[{"x":-0.34722222222222227,"y":-0.10821871116157016,"z":-0.026071610770803832,"stroke":1},{"x":-0.3055555555555556,"y":-0.09523246582218164,"z":-0.022943017478307407,"stroke":1},{"x":0.6527777777777777,"y":0.20345117698375176,"z":0.049014628249111236,"stroke":1}],[{"x":-0.34722222222222227,"y":-0.11552883020983075,"z":-0.02622937568970953,"stroke":1},{"x":-0.3055555555555556,"y":-0.10166537058465105,"z":-0.02308185060694437,"stroke":1},{"x":0.6527777777777777,"y":0.21719420079448182,"z":0.04931122629665391,"stroke":1}],[{"x":-0.34722222222222227,"y":-0.1185341798815554,"z":-0.027018075864084404,"stroke":1},{"x":-0.3055555555555556,"y":-0.10431007829576876,"z":-0.023775906760394296,"stroke":1},{"x":0.6527777777777777,"y":0.22284425817732417,"z":0.05079398262447869,"stroke":1}]]}');
	trainer.fromJSON('{"name":"1 - R - [ 0 0 0 0 1 ]","pose":true,"data":[[{"x":-0.16703499488385556,"y":-0.0569774031255959,"z":0.3472222222222223,"stroke":1},{"x":-0.1469907954977929,"y":-0.05014011475052428,"z":0.30555555555555547,"stroke":1},{"x":0.31402579038164846,"y":0.10711751787612017,"z":-0.6527777777777777,"stroke":1}],[{"x":-0.1646785394265233,"y":-0.05279662222706577,"z":0.3472222222222222,"stroke":1},{"x":-0.14491711469534052,"y":-0.046461027559817986,"z":0.3055555555555556,"stroke":1},{"x":0.30959565412186374,"y":0.09925764978688376,"z":-0.6527777777777778,"stroke":1}],[{"x":-0.1577702910420141,"y":-0.045018691847293894,"z":0.3472222222222222,"stroke":1},{"x":-0.13883785611697239,"y":-0.03961644882561858,"z":0.30555555555555547,"stroke":1},{"x":0.29660814715898653,"y":0.08463514067291247,"z":-0.6527777777777778,"stroke":1}],[{"x":-0.16073964430849064,"y":-0.04005789993235632,"z":0.3472222222222222,"stroke":1},{"x":-0.14145088699147176,"y":-0.03525095194047368,"z":0.3055555555555556,"stroke":1},{"x":0.3021905312999624,"y":0.07530885187283001,"z":-0.6527777777777778,"stroke":1}],[{"x":-0.16824452277428056,"y":-0.07509245607057803,"z":0.3472222222222222,"stroke":1},{"x":-0.1480551800413669,"y":-0.06608136134210878,"z":0.3055555555555557,"stroke":1},{"x":0.31629970281564745,"y":0.1411738174126868,"z":-0.6527777777777778,"stroke":1}]]}');
	trainer.fromJSON('{"name":"1 - R - [ 0 0 1 0 0 ]","pose":true,"data":[[{"x":0.05340892872048132,"y":-0.13487163452779682,"z":0.3472222222222222,"stroke":1},{"x":0.046999857274023546,"y":-0.11868703838446122,"z":0.3055555555555556,"stroke":1},{"x":-0.10040878599450483,"y":0.25355867291225803,"z":-0.6527777777777778,"stroke":1}],[{"x":0.052069222791347416,"y":-0.1233753768690589,"z":0.3472222222222222,"stroke":1},{"x":0.04582091605638573,"y":-0.10857033164477192,"z":0.30555555555555547,"stroke":1},{"x":-0.09789013884773314,"y":0.23194570851383078,"z":-0.6527777777777778,"stroke":1}],[{"x":0.05303746052703942,"y":-0.13261840889646856,"z":0.3472222222222222,"stroke":1},{"x":0.04667296526379469,"y":-0.1167041998288923,"z":0.30555555555555547,"stroke":1},{"x":-0.09971042579083411,"y":0.2493226087253609,"z":-0.6527777777777778,"stroke":1}],[{"x":0.056412121581886576,"y":-0.14266371837307326,"z":0.3472222222222222,"stroke":1},{"x":0.049642666992060186,"y":-0.12554407216830446,"z":0.3055555555555556,"stroke":1},{"x":-0.10605478857394679,"y":0.2682077905413778,"z":-0.6527777777777778,"stroke":1}],[{"x":0.0578484943443337,"y":-0.1362704363452884,"z":0.3472222222222222,"stroke":1},{"x":0.05090667502301366,"y":-0.11991798398385387,"z":0.3055555555555556,"stroke":1},{"x":-0.10875516936734736,"y":0.2561884203291423,"z":-0.6527777777777778,"stroke":1}]]}');
	//trainer.fromJSON('{"name":"TAP","pose":false,"data":[[{"x":0.21383313983208085,"y":-0.16414436484335138,"z":0.4841737018990413,"stroke":1},{"x":0.08545366080730654,"y":-0.06565110105848042,"z":0.19360281014077207,"stroke":1},{"x":-0.042925818217467854,"y":0.03284216272639054,"z":-0.09696808161749731,"stroke":1},{"x":-0.17130529724224225,"y":0.1313354265112615,"z":-0.3875389733757666,"stroke":1},{"x":-0.15483940346352787,"y":0.11876032817648496,"z":-0.3502699535500987,"stroke":1},{"x":-0.026445732747824496,"y":0.020259088499738676,"z":-0.05967843602441264,"stroke":1},{"x":0.10196112853065836,"y":-0.07827656632755929,"z":0.2309498489904548,"stroke":1},{"x":0.19727929561268603,"y":-0.15142651362719214,"z":0.44670675884440436,"stroke":1},{"x":0.06882345663028505,"y":-0.05282421284006092,"z":0.15592619985418632,"stroke":1},{"x":-0.05964659718888099,"y":0.04579906907019213,"z":-0.13491484999195397,"stroke":1},{"x":-0.1881421130121329,"y":0.14446366975019626,"z":-0.4258602472043773,"stroke":1},{"x":-0.13780995999603962,"y":0.10583757257732723,"z":-0.31198088561410775,"stroke":1},{"x":-0.009249771375116234,"y":0.007144899862290721,"z":-0.020937722383379265,"stroke":1},{"x":0.11933079680275305,"y":-0.09156545095093474,"z":0.2701793343020693,"stroke":1},{"x":0.1797120210682272,"y":-0.13792382184586513,"z":0.40690563899777743,"stroke":1},{"x":0.05105460979504578,"y":-0.039139071362658845,"z":0.11553115483384713,"stroke":1},{"x":-0.22708341583581082,"y":0.1745088856822209,"z":-0.5158262981009587,"stroke":1}],[{"x":0.20555507106697235,"y":-0.17526694710918633,"z":0.5339666534430938,"stroke":1},{"x":-0.002926310621218897,"y":0.0025031837650310584,"z":-0.007535401384764662,"stroke":1},{"x":-0.14718825710268735,"y":0.12551400083902675,"z":-0.38223660198746634,"stroke":1},{"x":0.06129392236672887,"y":-0.0522568102958048,"z":0.1592649223655061,"stroke":1},{"x":0.1413360352424487,"y":-0.12050963628299291,"z":0.36715537925925495,"stroke":1},{"x":-0.06713966799319515,"y":0.0572502558613876,"z":-0.17435222293084218,"stroke":1},{"x":-0.08297560897917954,"y":0.07075274887157237,"z":-0.2154864919775349,"stroke":1},{"x":0.1255007170289914,"y":-0.10700822906566086,"z":0.3260205140171984,"stroke":1},{"x":0.07713749669466985,"y":-0.06577346777183475,"z":0.20037626512530543,"stroke":1},{"x":-0.1313277908776875,"y":0.1119732562104011,"z":-0.3411396693728437,"stroke":1},{"x":-0.1792656068258427,"y":0.15282164497806056,"z":-0.46603334655690626,"stroke":1}],[{"x":0.18435174291569942,"y":-0.15694630283246494,"z":0.5238617609108898,"stroke":1},{"x":-0.12285376318868094,"y":0.1046264326673487,"z":-0.34868727269271405,"stroke":1},{"x":0.09634738421449127,"y":-0.08201400506214697,"z":0.27390130510350924,"stroke":1},{"x":-0.03485195898112553,"y":0.029697146484135906,"z":-0.0987466876868196,"stroke":1},{"x":0.008349311830286116,"y":-0.007087059846912547,"z":0.02395870444201703,"stroke":1},{"x":0.053146317480778665,"y":-0.045229972495343135,"z":0.1511957890338737,"stroke":1},{"x":-0.0796493312326197,"y":0.06784037127909881,"z":-0.2259857960223307,"stroke":1},{"x":0.14114481005553295,"y":-0.12015811419063367,"z":0.4011401294686366,"stroke":1},{"x":-0.16606306363674744,"y":0.1414192898073062,"z":-0.47144248698350094,"stroke":1},{"x":0.1395611133270869,"y":-0.11879948813437344,"z":0.39663392107079115,"stroke":1},{"x":-0.0780669982418952,"y":0.06649757580812735,"z":-0.22151691709043003,"stroke":1},{"x":0.05157097359072185,"y":-0.043880662964851616,"z":0.14669337620003303,"stroke":1},{"x":0.009921637297026442,"y":-0.008413121283145475,"z":0.028384038603920747,"stroke":1},{"x":-0.03640101175332888,"y":0.031017678470668025,"z":-0.10325162526876613,"stroke":1},{"x":-0.16650716367722582,"y":0.14143023229318677,"z":-0.4761382390891103,"stroke":1}],[{"x":0.15654821949844488,"y":-0.12788534811589625,"z":0.49604796294079456,"stroke":1},{"x":0.012597433268286662,"y":-0.010239693188301688,"z":0.040139593519596395,"stroke":1},{"x":-0.13135161644339022,"y":0.10739513392673428,"z":-0.4157682033157963,"stroke":1},{"x":-0.04055397677634846,"y":0.03320068087889971,"z":-0.12818210813847314,"stroke":1},{"x":0.1033904780081023,"y":-0.08442892640991438,"z":0.3277271824979049,"stroke":1},{"x":0.06574642759152191,"y":-0.05366657481635048,"z":0.20850411735225616,"stroke":1},{"x":-0.07820109318037985,"y":0.06396777520069177,"z":-0.247407762877968,"stroke":1},{"x":-0.09371443132470429,"y":0.07664407028858952,"z":-0.29652875864718276,"stroke":1},{"x":0.05022672291513666,"y":-0.04097971676860332,"z":0.159365360018209,"stroke":1},{"x":0.11890610618433772,"y":-0.09710342309946507,"z":0.3768884560534833,"stroke":1},{"x":-0.025042238424262897,"y":0.020531991879935596,"z":-0.07902560592614205,"stroke":1},{"x":-0.1468825669219592,"y":0.12009936348773018,"z":-0.46491566781523563,"stroke":1},{"x":-0.002938108415458135,"y":0.002470418009574371,"z":-0.009017729152743126,"stroke":1},{"x":0.14101020834585676,"y":-0.11516258233090927,"z":0.4469027219556252,"stroke":1},{"x":0.028083445667372725,"y":-0.022881541311452328,"z":0.08922247859487598,"stroke":1},{"x":-0.157825009992557,"y":0.12803837236873794,"z":-0.5039520370592054,"stroke":1}],[{"x":0.15384940947523998,"y":-0.1192948210250292,"z":0.5448770671513452,"stroke":1},{"x":-0.04606255148673258,"y":0.03572196375999653,"z":-0.16300544927222366,"stroke":1},{"x":-0.010811092879550593,"y":0.00839072705744956,"z":-0.038184773259700544,"stroke":1},{"x":0.1185946487555033,"y":-0.09194957055328029,"z":0.4200311239034601,"stroke":1},{"x":-0.0813163152259149,"y":0.06306130020794545,"z":-0.287852969140577,"stroke":1},{"x":0.024446322699589906,"y":-0.018947795557529692,"z":0.0866440451466417,"stroke":1},{"x":0.08333508588172728,"y":-0.0646098721684151,"z":0.2951585922394122,"stroke":1},{"x":-0.11657326859389346,"y":0.09040157255124986,"z":-0.4127261120561984,"stroke":1},{"x":0.05970888469690927,"y":-0.04628449344456373,"z":0.2114801559049183,"stroke":1},{"x":0.04807108126245732,"y":-0.03726316963920123,"z":0.17025555173044304,"stroke":1},{"x":-0.10493396125993998,"y":0.0813715922496259,"z":-0.37155429949886615,"stroke":1},{"x":-0.12830824332539567,"y":0.09940256656175187,"z":-0.4551229328486548,"stroke":1}],[{"x":0.12478996099313575,"y":-0.10112042301898207,"z":0.49693716486431316,"stroke":1},{"x":-0.0739080430452444,"y":0.059871832659385046,"z":-0.294098599357767,"stroke":1},{"x":0.020177594575422647,"y":-0.01635573238585887,"z":0.0804638539016056,"stroke":1},{"x":0.03070459063575312,"y":-0.02488548460259983,"z":0.12237298045965728,"stroke":1},{"x":-0.08443405214018088,"y":0.06840837509128837,"z":-0.33600659184802306,"stroke":1},{"x":0.11426437699671432,"y":-0.09259112644401425,"z":0.4550294272718888,"stroke":1},{"x":-0.06338088702831791,"y":0.05134972065913675,"z":-0.2521929590741526,"stroke":1},{"x":0.009652084985534826,"y":-0.007826465962039994,"z":0.03855615401887236,"stroke":1},{"x":0.041232496110502115,"y":-0.03341525503871513,"z":0.16428042151600764,"stroke":1},{"x":-0.09496091496301488,"y":0.0769387380047092,"z":-0.37791905022217837,"stroke":1},{"x":0.10373676015025415,"y":-0.0840601224262436,"z":0.4131101933517969,"stroke":1},{"x":-0.05285206904080013,"y":0.04281974959561001,"z":-0.21029066406944258,"stroke":1},{"x":-0.0008725199259790317,"y":0.0007027870153563931,"z":-0.003357542982837858,"stroke":1},{"x":0.05176089112723167,"y":-0.041938205700997246,"z":0.20617804730594602,"stroke":1},{"x":-0.12591026943101144,"y":0.10210161255396526,"z":-0.5030628351356868,"stroke":1}],[{"x":0.13246027148759815,"y":-0.1167681796577474,"z":0.5360274129046777,"stroke":1},{"x":-0.04230067062624121,"y":0.03746638645997545,"z":-0.17209302514125213,"stroke":1},{"x":-0.01154510102391558,"y":0.010300617721839447,"z":-0.047278396974812786,"stroke":1},{"x":0.10166989704622283,"y":-0.08959512819871568,"z":0.4113289864165539,"stroke":1},{"x":-0.07315402650385416,"y":0.06462683101946572,"z":-0.2966247783477446,"stroke":1},{"x":0.019148457598561888,"y":-0.016821518164986518,"z":0.07729677002198998,"stroke":1},{"x":0.07090274466527376,"y":-0.06247195917912957,"z":0.2868406941362308,"stroke":1},{"x":-0.10400120309494908,"y":0.09175383345723993,"z":-0.42107533959090115,"stroke":1},{"x":0.04985176482261443,"y":-0.04393381073046643,"z":0.2017735242330424,"stroke":1},{"x":0.04010510032350405,"y":-0.035342590052586415,"z":0.16233486865313274,"stroke":1},{"x":-0.09435710173477824,"y":0.08314685140916749,"z":-0.3816215705021276,"stroke":1},{"x":0.08060731104834744,"y":-0.0710759394585528,"z":0.32634476179800687,"stroke":1},{"x":0.009242704362687357,"y":-0.008193032530408914,"z":0.03766548418444304,"stroke":1},{"x":-0.06362339278549244,"y":0.055969576117539624,"z":-0.25694680469591685,"stroke":1},{"x":-0.1150067555855795,"y":0.10093806178736643,"z":-0.4639725870953223,"stroke":1}],[{"x":0.5203537932372657,"y":-0.22874597378630648,"z":-0.015117487719592187,"stroke":1},{"x":-0.4414870961660459,"y":0.1931768533887341,"z":0.01728918858302333,"stroke":1},{"x":0.4334028432011324,"y":-0.1906047307846732,"z":-0.012186111626061633,"stroke":1},{"x":-0.35447712979404816,"y":0.15524056417449747,"z":0.013553912057415764,"stroke":1},{"x":0.3468889680601819,"y":-0.15260836813730017,"z":-0.009430836329069419,"stroke":1},{"x":-0.26790690167130016,"y":0.11743130479762628,"z":0.01000293254535627,"stroke":1},{"x":0.26079813155663334,"y":-0.11475921893208113,"z":-0.0068446535325942335,"stroke":1},{"x":-0.18176864196015385,"y":0.07975974269483668,"z":0.006576575485485278,"stroke":1},{"x":0.1751748576221669,"y":-0.0770652971092097,"z":-0.00445257060880546,"stroke":1},{"x":-0.09610507146694763,"y":0.0422631104991196,"z":0.0032487929010354237,"stroke":1},{"x":0.0900969802927809,"y":-0.03958986914109591,"z":-0.002299960073392733,"stroke":1},{"x":-0.01098234313545926,"y":0.0049612501337673864,"z":0.00002880499985309648,"stroke":1},{"x":0.005657816986528508,"y":-0.002357748733913839,"z":-0.0004476168766556262,"stroke":1},{"x":-0.4796462067627343,"y":0.21289838093599908,"z":0.00007903019400211375,"stroke":1}],[{"x":0.4178855015929466,"y":-0.30712943930531206,"z":0.49567882008893127,"stroke":1},{"x":0.033919095117245,"y":-0.024998040261351995,"z":0.04050609309200426,"stroke":1},{"x":-0.3500562561975016,"y":0.25716184692970284,"z":-0.41469586976854805,"stroke":1},{"x":-0.1087109116291452,"y":0.07983739445017085,"z":-0.12853588952256728,"stroke":1},{"x":0.27526234603243516,"y":-0.202286001361413,"z":0.32672249776773077,"stroke":1},{"x":0.1764565836907177,"y":-0.1296877533994568,"z":0.20959508260938842,"stroke":1},{"x":-0.2075602821715535,"y":0.15251547500098783,"z":-0.24570096696808097,"stroke":1},{"x":-0.2511914942418414,"y":0.18459150182948497,"z":-0.297441510484851,"stroke":1},{"x":0.1328518004458723,"y":-0.09761124288988379,"z":0.15789933324360517,"stroke":1},{"x":0.3187551489309609,"y":-0.2342272913509305,"z":0.3783341536770688,"stroke":1},{"x":-0.06536450014252032,"y":0.04805985842100102,"z":-0.07714522271662905,"stroke":1},{"x":-0.3932985559889659,"y":0.28905519711316346,"z":-0.46608142398328317,"stroke":1},{"x":-0.009109918097267022,"y":0.006737205716468242,"z":-0.010537129875286988,"stroke":1},{"x":0.3751279678502716,"y":-0.27564392746514244,"z":0.4451857104791648,"stroke":1},{"x":0.07615813422286316,"y":-0.05591186391102515,"z":0.09053750227242319,"stroke":1},{"x":-0.4211246594145177,"y":0.30953708048353595,"z":-0.5043211799110687,"stroke":1}],[{"x":0.2926577507458023,"y":-0.2503394891442269,"z":0.5268700862951019,"stroke":1},{"x":0.08634604673803303,"y":-0.07348433711368507,"z":0.1545682305592358,"stroke":1},{"x":-0.11996104152353584,"y":0.10332194190473959,"z":-0.21718818146902225,"stroke":1},{"x":-0.19284287969352257,"y":0.1657119064435928,"z":-0.3480358280067498,"stroke":1},{"x":0.013186515225509954,"y":-0.010893462510955937,"z":0.0236332435567701,"stroke":1},{"x":0.2193134999481388,"y":-0.18750814331372753,"z":0.39508051183568565,"stroke":1},{"x":0.15960814628163034,"y":-0.1363705435661714,"z":0.28760609892364825,"stroke":1},{"x":-0.04677475637436773,"y":0.04031198646993406,"z":-0.08386574452390921,"stroke":1},{"x":-0.25331853842552704,"y":0.21702563102438333,"z":-0.4555506992126537,"stroke":1},{"x":-0.060771322665034155,"y":0.05210894239770775,"z":-0.10885134684578068,"stroke":1},{"x":0.1458494407082892,"y":-0.12475727101604014,"z":0.263123800711556,"stroke":1},{"x":0.23228110411750014,"y":-0.19870251053332832,"z":0.4187501370274998,"stroke":1},{"x":0.025228531944159194,"y":-0.02166443763514106,"z":0.04602867991161136,"stroke":1},{"x":-0.18202727491218793,"y":0.15543725426669558,"z":-0.32716003598850163,"stroke":1},{"x":-0.1322889758851706,"y":0.11277521147814135,"z":-0.23770354463962767,"stroke":1},{"x":0.07517002012524782,"y":-0.06459328529467015,"z":0.13582450557003262,"stroke":1},{"x":-0.26165626635496403,"y":0.22162060614275275,"z":-0.47312991370489804,"stroke":1}],[{"x":0.25902191972993427,"y":-0.2034002726531899,"z":0.5160718382011648,"stroke":1},{"x":-0.22106918313553173,"y":0.17331376821564023,"z":-0.43886386153077767,"stroke":1},{"x":0.21764742175107918,"y":-0.1709348630059267,"z":0.43377616215352355,"stroke":1},{"x":-0.1796435916362919,"y":0.14084255585233837,"z":-0.3565936017656588,"stroke":1},{"x":0.1762676433820972,"y":-0.13844816516569394,"z":0.3514444857030954,"stroke":1},{"x":-0.1382032617356592,"y":0.10836152372497235,"z":-0.27430021572769636,"stroke":1},{"x":0.13487614860087913,"y":-0.10595571704020694,"z":0.2690546259974693,"stroke":1},{"x":-0.0967419955295992,"y":0.07584863162623809,"z":-0.1919559119430328,"stroke":1},{"x":0.09346500498891189,"y":-0.07344306030366043,"z":0.18658545971072482,"stroke":1},{"x":-0.055246137025527886,"y":0.04330938483245886,"z":-0.10954209653308711,"stroke":1},{"x":0.05202750419381949,"y":-0.04089892989622043,"z":0.10400507116483437,"stroke":1},{"x":-0.013705894450162404,"y":0.010733913943389545,"z":-0.02703040415890612,"stroke":1},{"x":0.010553807325701103,"y":-0.008312319685983005,"z":0.021276610527181994,"stroke":1},{"x":-0.23924938645964908,"y":0.18898354955584443,"z":-0.48392816179883524,"stroke":1}],[{"x":0.1514629469262813,"y":-0.1782765620761118,"z":0.5178287768893737,"stroke":1},{"x":-0.12878722049761485,"y":0.15160767306575695,"z":-0.4404615313212649,"stroke":1},{"x":0.12708427273181142,"y":-0.14958059013571132,"z":0.4345050574305102,"stroke":1},{"x":-0.10442270987283568,"y":0.12292339749201275,"z":-0.3571315131602716,"stroke":1},{"x":0.1027086177071389,"y":-0.12089611079154214,"z":0.35118573293965033,"stroke":1},{"x":-0.0800625604725269,"y":0.09425361489764239,"z":-0.27381180051459164,"stroke":1},{"x":0.07833606995462888,"y":-0.0922076839495913,"z":0.26787371247486386,"stroke":1},{"x":-0.05570473298450357,"y":0.06557700068744593,"z":-0.1904939019223424,"stroke":1},{"x":0.05396409940264574,"y":-0.06352031168839554,"z":0.18455728892586082,"stroke":1},{"x":-0.031346787257770584,"y":0.036900711320816015,"z":-0.10717205498771082,"stroke":1},{"x":0.02959028914731937,"y":-0.03483260188963727,"z":0.10123295026935925,"stroke":1},{"x":-0.006988369497426122,"y":0.008223661416809802,"z":-0.023842661932836573,"stroke":1},{"x":0.0052149757250859186,"y":-0.006144166919898136,"z":0.017901168020025893,"stroke":1},{"x":-0.14104889101223386,"y":0.1659719685704037,"z":-0.4821712231106264,"stroke":1}],[{"x":0.17500126654790427,"y":-0.19187190075211233,"z":0.52482388066198,"stroke":1},{"x":-0.116619753289194,"y":0.12792555328252883,"z":-0.3498344879337737,"stroke":1},{"x":0.09166493676727927,"y":-0.10048471499130096,"z":0.27487988679498415,"stroke":1},{"x":-0.03328352264644224,"y":0.03653537196928311,"z":-0.09987133042862589,"stroke":1},{"x":0.008323039655543596,"y":-0.009092315328837558,"z":0.02492109096862488,"stroke":1},{"x":0.05005466495572536,"y":-0.054856479988279305,"z":0.15008745737822077,"stroke":1},{"x":-0.07501943811560252,"y":0.08229893848466555,"z":-0.22503511282959032,"stroke":1},{"x":0.13339215038752367,"y":-0.1462384205071445,"z":0.40004656322388094,"stroke":1},{"x":-0.15823361327619723,"y":0.17354718048018006,"z":-0.47460071191616054,"stroke":1},{"x":0.13325845914583678,"y":-0.14609519069937796,"z":0.3996557624877642,"stroke":1},{"x":-0.07489807286990555,"y":0.0821592033107307,"z":-0.22464470505689554,"stroke":1},{"x":0.04991217705464482,"y":-0.05471111646242802,"z":0.14969930898590772,"stroke":1},{"x":0.008436761762300321,"y":-0.009230606960520471,"z":0.025316333297665083,"stroke":1},{"x":-0.03343865483376707,"y":0.036679798821106835,"z":-0.10026781629596121,"stroke":1},{"x":-0.1585504012456499,"y":0.173434699341506,"z":-0.47517611933802,"stroke":1}],[{"x":0.18204127399264727,"y":-0.18335860357854816,"z":0.5184357855792445,"stroke":1},{"x":-0.12494736019958926,"y":0.12579187724365865,"z":-0.3553759454643802,"stroke":1},{"x":0.094436001775665,"y":-0.09513648713057749,"z":0.26907657357119974,"stroke":1},{"x":-0.03733972569146274,"y":0.03757603513285404,"z":-0.10601541922766688,"stroke":1},{"x":0.006831283907836216,"y":-0.00690786626042475,"z":0.019714190133543363,"stroke":1},{"x":0.050268820043078505,"y":-0.0506510201785319,"z":0.1433460976000953,"stroke":1},{"x":-0.08077349771813391,"y":0.0813213797888972,"z":-0.22966564036842552,"stroke":1},{"x":0.13787850944248028,"y":-0.1388817717091536,"z":0.3927234441613975,"stroke":1},{"x":-0.16837557939574668,"y":0.1695540320591178,"z":-0.4790604821637333,"stroke":1},{"x":0.13859262754630688,"y":-0.13960145252975112,"z":0.39475665482814004,"stroke":1},{"x":-0.0814664022894602,"y":0.08203618963419462,"z":-0.23171056026802683,"stroke":1},{"x":0.050981150885918175,"y":-0.05135429773067382,"z":0.1453395160393679,"stroke":1},{"x":-0.16812710229953984,"y":0.16961198525893878,"z":-0.4815642144207555,"stroke":1}],[{"x":0.15702272396370343,"y":-0.15352117080266375,"z":0.5248462970413401,"stroke":1},{"x":-0.10429582237792817,"y":0.10215301815199601,"z":-0.35015951001052187,"stroke":1},{"x":0.08231485857499127,"y":-0.08042938741420569,"z":0.27503294513095844,"stroke":1},{"x":-0.029760338304635175,"y":0.029205061647695846,"z":-0.10018602867672788,"stroke":1},{"x":0.007618330767926562,"y":-0.007378788551446497,"z":0.025154832664003535,"stroke":1},{"x":0.04479046094635833,"y":-0.04372963205687781,"z":0.14979907096199774,"stroke":1},{"x":-0.0670761390979708,"y":0.06563955484950601,"z":-0.22477461739887628,"stroke":1},{"x":0.11935079811776589,"y":-0.11665694488764036,"z":0.3997923290449886,"stroke":1},{"x":-0.14178301528525952,"y":0.1386354993331943,"z":-0.474735128253651,"stroke":1},{"x":0.11944356932940015,"y":-0.11676386868002961,"z":0.40029032395983355,"stroke":1},{"x":-0.06734554988616451,"y":0.06582213369760753,"z":-0.22523469489802225,"stroke":1},{"x":0.04474732922396696,"y":-0.0437648032863434,"z":0.15028565994599263,"stroke":1},{"x":0.007250845629163838,"y":-0.007122061029573301,"z":0.024779484428125942,"stroke":1},{"x":-0.02995345769989459,"y":0.02921239032051673,"z":-0.09973726098078028,"stroke":1},{"x":-0.14232459390142388,"y":0.13869899870826402,"z":-0.4751537029586599,"stroke":1}],[{"x":0.21587803844607947,"y":-0.20986785245943745,"z":0.08868447021234338,"stroke":1},{"x":-0.15726033407241063,"y":0.16285710807350162,"z":0.38309229834763514,"stroke":1},{"x":-0.0005117431140597983,"y":-0.010035474733502775,"z":-0.4808187865845705,"stroke":1},{"x":0.09472099374291867,"y":-0.08796417330425728,"z":0.22534891535208967,"stroke":1},{"x":-0.11863742759418079,"y":0.1201877235626046,"z":0.16991896296903186,"stroke":1},{"x":0.06826515993806351,"y":-0.07398069893673329,"z":-0.31917454014218516,"stroke":1},{"x":-0.02708988378170668,"y":0.03459191952483642,"z":0.3627518438026275,"stroke":1},{"x":-0.07994963145334781,"y":0.07753609639219194,"z":-0.04320434323661981,"stroke":1},{"x":0.13994392190517732,"y":-0.13996118145540487,"z":-0.12113772101458475,"stroke":1},{"x":-0.14917930740887705,"y":0.15728887942399822,"z":0.4996945115750925,"stroke":1},{"x":-0.041004944910230184,"y":0.03456030615073158,"z":-0.25788201881918565,"stroke":1},{"x":0.21212191542295641,"y":-0.20640005923634255,"z":0.07831825176082108,"stroke":1},{"x":-0.1586697605684428,"y":0.1640274312956706,"z":0.3892923574230053,"stroke":1},{"x":-0.0016486492826225385,"y":-0.008817795833969078,"z":-0.47457871322059203,"stroke":1},{"x":0.0030216527306824725,"y":-0.014022228463887343,"z":-0.5003054884249075,"stroke":1}],[{"x":0.20612489685837768,"y":-0.1920440890483471,"z":0.536015840971106,"stroke":1},{"x":-0.0665782389069508,"y":0.061905328194373804,"z":-0.1728746020644803,"stroke":1},{"x":-0.017841406457951348,"y":0.016543981247053197,"z":-0.04612922470623143,"stroke":1},{"x":0.15755218084435765,"y":-0.14680661025206382,"z":0.4097684040044463,"stroke":1},{"x":-0.1148652507223459,"y":0.10693495350118307,"z":-0.2983114284217741,"stroke":1},{"x":0.030440266089498264,"y":-0.028392638789061092,"z":0.07935100363366848,"stroke":1},{"x":0.10948027111845002,"y":-0.10201891984822971,"z":0.2848074449597862,"stroke":1},{"x":-0.1627762125468209,"y":0.1516144031197695,"z":-0.42297586763404293,"stroke":1},{"x":0.07841652204792479,"y":-0.0730639138691253,"z":0.20399690634983242,"stroke":1},{"x":0.06161449276874184,"y":-0.05741008584044208,"z":0.16031336028313076,"stroke":1},{"x":-0.1459043325649677,"y":0.13595077958410648,"z":-0.37932141237909645,"stroke":1},{"x":0.1262894663516195,"y":-0.11764458541917623,"z":0.328409483316701,"stroke":1},{"x":0.013803363783089662,"y":-0.012833552326154934,"z":0.03588360857900669,"stroke":1},{"x":-0.09798548181561653,"y":0.09135078391088644,"z":-0.25494935786315986,"stroke":1},{"x":-0.17777053684740582,"y":0.16591416583522703,"z":-0.46398415902889395,"stroke":1}],[{"x":0.2852663973191372,"y":-0.26664187492881286,"z":0.508147285602714,"stroke":1},{"x":-0.1967951187026239,"y":0.18661459744502484,"z":-0.349958192084241,"stroke":1},{"x":0.14968340368803928,"y":-0.13916633774697457,"z":0.26681311931720475,"stroke":1},{"x":-0.061227943786859,"y":0.059122099224704905,"z":-0.10862643826620538,"stroke":1},{"x":0.014077407400006403,"y":-0.011676801070100828,"z":0.025435508411820407,"stroke":1},{"x":0.07435378788213809,"y":-0.06836591481723212,"z":0.13273778791087654,"stroke":1},{"x":-0.12156709245163183,"y":0.11581418254564346,"z":-0.21601719643276784,"stroke":1},{"x":0.20996528581979768,"y":-0.19588340673857324,"z":0.37416992749499145,"stroke":1},{"x":-0.2572866872192905,"y":0.24330556499709177,"z":-0.45762301002446654,"stroke":1},{"x":0.22476785437590768,"y":-0.20980835289714514,"z":0.4005616683241452,"stroke":1},{"x":-0.1364529455138912,"y":0.12958440783595532,"z":-0.2425164613150525,"stroke":1},{"x":0.08890341902770249,"y":-0.08219038344433849,"z":0.15872871545826617,"stroke":1},{"x":-0.27368776783843235,"y":0.23929221959475755,"z":-0.49185271439728595,"stroke":1}],[{"x":0.5029304176592493,"y":-0.2259912624039763,"z":-0.5345807682009652,"stroke":1},{"x":-0.08541975718034484,"y":0.03838823582026632,"z":0.09099586570477414,"stroke":1},{"x":-0.20352194329379059,"y":0.09145829849934936,"z":0.2165700154259681,"stroke":1},{"x":0.3848274523757233,"y":-0.1729209178518206,"z":-0.40900747040674457,"stroke":1},{"x":0.03266621191931346,"y":-0.014672984942359607,"z":-0.03460167785142937,"stroke":1},{"x":-0.3215724620073287,"y":0.14450803683634264,"z":0.34202188084805973,"stroke":1},{"x":0.2667970673940034,"y":-0.1198823631606314,"z":-0.2835319421483425,"stroke":1},{"x":0.1506789261611297,"y":-0.06770215739136473,"z":-0.1601069211442825,"stroke":1},{"x":-0.4377143129548389,"y":0.1967009446147789,"z":0.46541923179903477,"stroke":1},{"x":0.14884291894885354,"y":-0.06687725020679569,"z":-0.15815990167560656,"stroke":1},{"x":-0.4385145190219703,"y":0.1969914201862105,"z":0.4649816876495342,"stroke":1}],[{"x":0.4974425591908588,"y":-0.204409360638402,"z":0.30432105966980755,"stroke":1},{"x":-0.294457942783452,"y":0.12098717076521323,"z":-0.17979148562595637,"stroke":1},{"x":0.08041196769186676,"y":-0.0330485771889821,"z":0.04937044138876484,"stroke":1},{"x":0.12256952750377992,"y":-0.050371413031116447,"z":0.07514336106986996,"stroke":1},{"x":-0.3366043721967714,"y":0.13830731611612881,"z":-0.20558442003734081,"stroke":1},{"x":0.4553020064387634,"y":-0.1870922277744615,"z":0.2785572517664158,"stroke":1},{"x":-0.2523336671020548,"y":0.1037018007801542,"z":-0.1540756528834684,"stroke":1},{"x":0.038320168415814204,"y":-0.015738752712899123,"z":0.023618016189401514,"stroke":1},{"x":0.164642238807168,"y":-0.06764922545463734,"z":0.10085011846187614,"stroke":1},{"x":-0.3786469756996759,"y":0.1556096876866139,"z":-0.23132382409006647,"stroke":1},{"x":0.4132776830871375,"y":-0.1698226523507569,"z":0.25286101936244193,"stroke":1},{"x":-0.21031854790031862,"y":0.08643785325730627,"z":-0.12841770303298833,"stroke":1},{"x":-0.003674084090170615,"y":0.0015194202301491155,"z":-0.0020779440463546406,"stroke":1},{"x":0.20662687944619706,"y":-0.08490160581611933,"z":0.12650688110058544,"stroke":1},{"x":-0.5025574408091412,"y":0.20647056613180972,"z":-0.3099571192929878,"stroke":1}]]}');
	trainer.fromJSON('{"name":"THUMB-LEFT","pose":true,"data":[[{"x":0.3472222222222222,"y":0.013850568862619119,"z":-0.016155972292700434,"stroke":1},{"x":0.30555555555555547,"y":0.01218850059910485,"z":-0.014217255617576384,"stroke":1},{"x":-0.6527777777777778,"y":-0.026039069461723966,"z":0.03037322791027682,"stroke":1}],[{"x":0.3472222222222222,"y":0.015771352650966304,"z":-0.02006651118141006,"stroke":1},{"x":0.3055555555555556,"y":0.013878790332850353,"z":-0.017658529839640853,"stroke":1},{"x":-0.6527777777777778,"y":-0.029650142983816657,"z":0.03772504102105091,"stroke":1}],[{"x":0.3472222222222222,"y":0.017492256213828487,"z":-0.02094367248312241,"stroke":1},{"x":0.30555555555555547,"y":0.015393185468169174,"z":-0.018430431785147725,"stroke":1},{"x":-0.6527777777777778,"y":-0.03288544168199765,"z":0.039374104268270135,"stroke":1}],[{"x":0.3472222222222222,"y":0.022901008397107,"z":-0.024808849007987518,"stroke":1},{"x":0.3055555555555556,"y":0.02015288738945409,"z":-0.021831787127029018,"stroke":1},{"x":-0.6527777777777778,"y":-0.0430538957865611,"z":0.046640636135016525,"stroke":1}],[{"x":0.3472222222222222,"y":0.029541222411229286,"z":-0.025827210834299116,"stroke":1},{"x":0.3055555555555556,"y":0.02599627572188188,"z":-0.022727945534183225,"stroke":1},{"x":-0.6527777777777778,"y":-0.05553749813311117,"z":0.04855515636848233,"stroke":1}],[{"x":0.3472222222222222,"y":0.03363012932605809,"z":-0.03127294208149143,"stroke":1},{"x":0.30555555555555547,"y":0.029594513806931164,"z":-0.027520189031712456,"stroke":1},{"x":-0.6527777777777778,"y":-0.06322464313298926,"z":0.05879313111320388,"stroke":1}],[{"x":0.3472222222222222,"y":0.039925595113648085,"z":-0.03387752615663082,"stroke":1},{"x":0.30555555555555547,"y":0.035134523700010314,"z":-0.029812223017835118,"stroke":1},{"x":-0.6527777777777778,"y":-0.07506011881365841,"z":0.06368974917446593,"stroke":1}],[{"x":0.3472222222222222,"y":0.0420231108543415,"z":-0.03324762539369056,"stroke":1},{"x":0.3055555555555556,"y":0.03698033755182059,"z":-0.029257910346447695,"stroke":1},{"x":-0.6527777777777778,"y":-0.07900344840616212,"z":0.06250553574013826,"stroke":1}],[{"x":0.3472222222222222,"y":0.043387942033801155,"z":-0.032756659550126514,"stroke":1},{"x":0.30555555555555547,"y":0.03818138898974499,"z":-0.02882586040411133,"stroke":1},{"x":-0.6527777777777778,"y":-0.08156933102354617,"z":0.06158251995423785,"stroke":1}],[{"x":0.3472222222222222,"y":0.04912109796530974,"z":-0.03651722357918898,"stroke":1},{"x":0.3055555555555557,"y":0.04322656620947242,"z":-0.03213515674968631,"stroke":1},{"x":-0.6527777777777778,"y":-0.09234766417478214,"z":0.06865238032887527,"stroke":1}]]}');
	//trainer.fromJSON('{"name":"THUMB-RIGHT","pose":true,"data":[[{"x":-0.34722222222222227,"y":-0.01737222102896321,"z":0.09339173782549828,"stroke":1},{"x":-0.3055555555555556,"y":-0.015287554505487726,"z":0.08218472928643852,"stroke":1},{"x":0.6527777777777777,"y":0.03265977553445093,"z":-0.17557646711193678,"stroke":1}],[{"x":-0.34722222222222227,"y":0.02175868689375316,"z":0.12054297013854268,"stroke":1},{"x":-0.30555555555555564,"y":0.019147644466502682,"z":0.10607781372191752,"stroke":1},{"x":0.6527777777777777,"y":-0.040906331360255836,"z":-0.22662078386046022,"stroke":1}],[{"x":-0.34722222222222227,"y":0.005609547675120213,"z":0.11766137844340524,"stroke":1},{"x":-0.3055555555555556,"y":0.004936401954105678,"z":0.10354201303019661,"stroke":1},{"x":0.6527777777777777,"y":-0.010545949629225893,"z":-0.2212033914736018,"stroke":1}],[{"x":-0.34722222222222227,"y":-0.012251850663283227,"z":0.11370236211289825,"stroke":1},{"x":-0.3055555555555556,"y":-0.01078162858368913,"z":0.1000580786593504,"stroke":1},{"x":0.6527777777777777,"y":0.023033479246972355,"z":-0.21376044077224865,"stroke":1}],[{"x":-0.34722222222222227,"y":-0.019882192908920928,"z":0.1120381493574105,"stroke":1},{"x":-0.3055555555555556,"y":-0.017496329759850538,"z":0.09859357143452127,"stroke":1},{"x":0.6527777777777777,"y":0.037378522668771466,"z":-0.21063172079193174,"stroke":1}],[{"x":-0.34722222222222227,"y":-0.018321144225249615,"z":0.10742835337906667,"stroke":1},{"x":-0.3055555555555556,"y":-0.016122606918219793,"z":0.09453695097357864,"stroke":1},{"x":0.6527777777777777,"y":0.03444375114346941,"z":-0.20196530435264534,"stroke":1}],[{"x":-0.34722222222222227,"y":-0.026323490252390003,"z":0.1066883683689526,"stroke":1},{"x":-0.3055555555555556,"y":-0.023164671422103093,"z":0.09388576416467834,"stroke":1},{"x":0.6527777777777777,"y":0.04948816167449309,"z":-0.2005741325336309,"stroke":1}],[{"x":-0.34722222222222227,"y":-0.008329236977298437,"z":0.1044302913927965,"stroke":1},{"x":-0.3055555555555556,"y":-0.007329728540022687,"z":0.09189865642566089,"stroke":1},{"x":0.6527777777777777,"y":0.015658965517321124,"z":-0.19632894781845736,"stroke":1}],[{"x":-0.34722222222222227,"y":-0.00972996519389499,"z":0.10581864953076597,"stroke":1},{"x":-0.3055555555555556,"y":-0.008562369370627642,"z":0.09312041158707407,"stroke":1},{"x":0.6527777777777777,"y":0.018292334564522634,"z":-0.1989390611178401,"stroke":1}],[{"x":-0.34722222222222227,"y":-0.02357644003836137,"z":0.10633369893439062,"stroke":1},{"x":-0.3055555555555556,"y":-0.020747267233757968,"z":0.09357365506226381,"stroke":1},{"x":0.6527777777777777,"y":0.04432370727211933,"z":-0.19990735399665446,"stroke":1}]]}');
	trainer.fromJSON(test_thumb_right);
	trainer.fromJSON('{"name":"5 - R - [ 1 1 1 1 1 ]","pose":true,"data":[[{"x":0.1343412419485464,"y":-0.0005811898352904334,"z":0.16720625310011966,"stroke":1},{"x":0.03732180726655515,"y":0.0015005342332622754,"z":0.13024845217763187,"stroke":1},{"x":-0.059697627415436105,"y":0.003582258301814991,"z":0.09329065125514396,"stroke":1},{"x":-0.1567170620974273,"y":0.005663982370367453,"z":0.05633285033265617,"stroke":1},{"x":-0.25373649677941856,"y":0.007745706438920166,"z":0.01937504941016832,"stroke":1},{"x":-0.35075593146140976,"y":0.009827430507472635,"z":-0.017582751512319528,"stroke":1},{"x":0.6492440685385903,"y":-0.027738722016547073,"z":-0.44887050476340046,"stroke":1}],[{"x":0.13528167858926726,"y":0.00279655486130935,"z":0.16460859248193477,"stroke":1},{"x":0.03793309108302373,"y":0.00310454578793146,"z":0.1281250534367127,"stroke":1},{"x":-0.05941549642321975,"y":0.00341253671455357,"z":0.09164151439149065,"stroke":1},{"x":-0.15676408392946334,"y":0.0037205276411756798,"z":0.055157975346268595,"stroke":1},{"x":-0.2541126714357069,"y":0.00402851856779779,"z":0.018674436301046482,"stroke":1},{"x":-0.3514612589419505,"y":0.004336509494419896,"z":-0.017809102744175576,"stroke":1},{"x":0.6485387410580494,"y":-0.02139919306718772,"z":-0.44039846921327735,"stroke":1}],[{"x":0.1365418241847659,"y":0.003583819247571878,"z":0.15927253846835282,"stroke":1},{"x":0.03875218572009781,"y":0.003547126842675538,"z":0.12466947012442015,"stroke":1},{"x":-0.05903745274457023,"y":0.003510434437779198,"z":0.09006640178048747,"stroke":1},{"x":-0.15682709120923832,"y":0.003473742032882858,"z":0.055463333436554685,"stroke":1},{"x":-0.25461672967390636,"y":0.003437049627986518,"z":0.020860265092621955,"stroke":1},{"x":-0.3524063681385744,"y":0.003400357223090178,"z":-0.013742803251310831,"stroke":1},{"x":0.6475936318614256,"y":-0.020952529411986148,"z":-0.4365892056511264,"stroke":1}],[{"x":0.13732965437956524,"y":0.003658274584546886,"z":0.15347515734416523,"stroke":1},{"x":0.03926427534671745,"y":0.0037823765575066455,"z":0.12118016001700954,"stroke":1},{"x":-0.058801103686130396,"y":0.003906478530466408,"z":0.08888516268985375,"stroke":1},{"x":-0.15686648271897824,"y":0.004030580503426168,"z":0.056590165362698064,"stroke":1},{"x":-0.2549318617518261,"y":0.00415468247638617,"z":0.024295168035542325,"stroke":1},{"x":-0.3529972407846739,"y":0.004278784449345933,"z":-0.007999829291613414,"stroke":1},{"x":0.647002759215326,"y":-0.02381117710167821,"z":-0.4364259841576554,"stroke":1}],[{"x":0.13779463370204953,"y":0.005672142659437853,"z":0.15103472807023638,"stroke":1},{"x":0.0395665119063322,"y":0.005205669750427942,"z":0.1198834080549353,"stroke":1},{"x":-0.058661609889385125,"y":0.004739196841418023,"z":0.08873208803963434,"stroke":1},{"x":-0.15688973168510242,"y":0.004272723932408112,"z":0.05758076802433326,"stroke":1},{"x":-0.2551178534808197,"y":0.0038062510233981967,"z":0.02642944800903224,"stroke":1},{"x":-0.35334597527653705,"y":0.0033397781143882817,"z":-0.004721872006268779,"stroke":1},{"x":0.6466540247234629,"y":-0.027035762321478394,"z":-0.4389385681919024,"stroke":1}],[{"x":0.13729844157827925,"y":0.010395972864902618,"z":0.149411480901824,"stroke":1},{"x":0.0392439870258815,"y":0.008346908083180324,"z":0.1193583347246645,"stroke":1},{"x":-0.05881046752651625,"y":0.0062978433014580296,"z":0.08930518854750502,"stroke":1},{"x":-0.15686492207891398,"y":0.004248778519735978,"z":0.05925204237034554,"stroke":1},{"x":-0.2549193766313117,"y":0.002199713738013684,"z":0.029198896193186052,"stroke":1},{"x":-0.3529738311837094,"y":0.00015064895629163244,"z":-0.0008542499839733764,"stroke":1},{"x":0.6470261688162906,"y":-0.031639865463582266,"z":-0.4456716927535518,"stroke":1}],[{"x":0.13683042144132157,"y":0.010561701650127098,"z":0.149321594828643,"stroke":1},{"x":0.03893977393685899,"y":0.008702374355752787,"z":0.11943020879078353,"stroke":1},{"x":-0.058950873567603534,"y":0.006843047061378477,"z":0.08953882275292407,"stroke":1},{"x":-0.1568415210720661,"y":0.004983719767004159,"z":0.05964743671506462,"stroke":1},{"x":-0.2547321685765286,"y":0.0031243924726300915,"z":0.029756050677205215,"stroke":1},{"x":-0.3526228160809911,"y":0.001265065178255774,"z":-0.00013533536065413188,"stroke":1},{"x":0.6473771839190089,"y":-0.03548030048514835,"z":-0.44755877840396613,"stroke":1}],[{"x":0.13671670383392293,"y":0.01008549677998509,"z":0.14895924314638548,"stroke":1},{"x":0.038865857492049904,"y":0.008491800358012308,"z":0.11926234864754354,"stroke":1},{"x":-0.05898498884982312,"y":0.006898103936039533,"z":0.0895654541487017,"stroke":1},{"x":-0.15683583519169622,"y":0.0053044075140667515,"z":0.059868559649859876,"stroke":1},{"x":-0.25468668153356927,"y":0.0037107110920942127,"z":0.03017166515101799,"stroke":1},{"x":-0.3525375278754423,"y":0.002117014670121431,"z":0.00047477065217621517,"stroke":1},{"x":0.6474624721245577,"y":-0.03660753435031933,"z":-0.4483020413956847,"stroke":1}],[{"x":0.13563754041768783,"y":0.009238922254449326,"z":0.14666998323868874,"stroke":1},{"x":0.03816440127149712,"y":0.00790021644794435,"z":0.11759720842559918,"stroke":1},{"x":-0.05930873787469365,"y":0.0065615106414393665,"z":0.08852443361250972,"stroke":1},{"x":-0.15678187702088434,"y":0.00522280483493439,"z":0.05945165879942027,"stroke":1},{"x":-0.2542550161670751,"y":0.0038840990284294136,"z":0.030378883986330707,"stroke":1},{"x":-0.35172815531326584,"y":0.00254539322192443,"z":0.0013061091732412544,"stroke":1},{"x":0.6482718446867342,"y":-0.0353529464291213,"z":-0.44392827723578987,"stroke":1}],[{"x":0.13643723053039614,"y":0.0093157518198674,"z":0.14626025772332318,"stroke":1},{"x":0.03868419984475746,"y":0.007928045649821039,"z":0.11752099219456402,"stroke":1},{"x":-0.05906883084088116,"y":0.006540339479774435,"z":0.08878172666580508,"stroke":1},{"x":-0.1568218615265198,"y":0.005152633309728073,"z":0.060042461137046144,"stroke":1},{"x":-0.25457489221215845,"y":0.003764927139681476,"z":0.03130319560828715,"stroke":1},{"x":-0.35232792289779713,"y":0.0023772209696351146,"z":0.0025639300795280984,"stroke":1},{"x":0.6476720771022029,"y":-0.03507891836850758,"z":-0.44647256340855357,"stroke":1}]]}');
});