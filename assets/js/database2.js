var airspring = {};
airspring.indexedDB = {};
airspring.indexedDB.db = null;

//______________________________________________________________________________________________________________


airspring.indexedDB.open = function(dbname) {
  var version = 1;
  var request = indexedDB.open(dbname, version);

  // We can only create Object stores in a versionchange transaction.
  request.onupgradeneeded = function(e) {
    var db = e.target.result;

    // A versionchange transaction is started automatically.
    e.target.transaction.onerror = airspring.indexedDB.onerror;

    if(db.objectStoreNames.contains("airspring_handdata")) {
      db.deleteObjectStore("airspring_handdata");
    }

    var store = db.createObjectStore("airspring_handdata",
    {keyPath: "timeStamp"});
  };

  request.onsuccess = function(e) {
    airspring.indexedDB.db = e.target.result;
  };

  request.onerror = airspring.indexedDB.onerror;
};

//______________________________________________________________________________________________________________


airspring.indexedDB.addHandData3 = function(frame) {
  var db = airspring.indexedDB.db;
  var trans = db.transaction(["airspring_handdata"], "readwrite");
  var store = trans.objectStore("airspring_handdata");

  //console.log("Adding Data");

  var request = store.put({
    "valid" : frame.hands[0].valid,
    "handType" : frame.hands[0].type,
    "indexLenght" : frame.hands[0].indexFinger.length,
    "indexMetacarpalLenght" : frame.hands[0].indexFinger.metacarpal.length,
    "indexMetacarpalWidth" : frame.hands[0].indexFinger.metacarpal.width,
    "indexProximalLenght" : frame.hands[0].indexFinger.proximal.length,
    "indexProximalWidth" : frame.hands[0].indexFinger.proximal.width,
    "indexIntermediateLenght" : frame.hands[0].indexFinger.medial.length,
    "indexIntermediateWidth" : frame.hands[0].indexFinger.medial.width,
    "indexDistalLenght" : frame.hands[0].indexFinger.distal.length,
    "indexDistalWidth" : frame.hands[0].indexFinger.distal.width,
    "middleLenght" : frame.hands[0].middleFinger.length,
    "middleMetacarpalLenght" : frame.hands[0].middleFinger.metacarpal.length,
    "middleMetacarpalWidth" : frame.hands[0].middleFinger.metacarpal.width,
    "middleProximalLenght" : frame.hands[0].middleFinger.proximal.length,
    "middleProximalWidth" : frame.hands[0].middleFinger.proximal.width,
    "middleIntermediateLenght" : frame.hands[0].middleFinger.medial.length,
    "middleIntermediateWidth" : frame.hands[0].middleFinger.medial.width,
    "middleDistalLenght" : frame.hands[0].middleFinger.distal.length,
    "middleDistalWidth" : frame.hands[0].middleFinger.distal.width,
    "ringLenght" : frame.hands[0].ringFinger.length,
    "ringMetacarpalLenght" : frame.hands[0].ringFinger.metacarpal.length,
    "ringMetacarpalWidth" : frame.hands[0].ringFinger.metacarpal.width,
    "ringProximalLenght" : frame.hands[0].ringFinger.proximal.length,
    "ringProximalWidth" : frame.hands[0].ringFinger.proximal.width,
    "ringIntermediateLenght" : frame.hands[0].ringFinger.medial.length,
    "ringIntermediateWidth" : frame.hands[0].ringFinger.medial.width,
    "ringDistalLenght" : frame.hands[0].ringFinger.distal.length,
    "ringDistalWidth" : frame.hands[0].ringFinger.distal.width,
    "pinkyLenght" : frame.hands[0].pinky.length,
    "pinkyMetacarpalLenght" : frame.hands[0].pinky.metacarpal.length,
    "pinkyMetacarpalWidth" : frame.hands[0].pinky.metacarpal.width,
    "pinkyProximalLenght" : frame.hands[0].pinky.proximal.length,
    "pinkyProximalWidth" : frame.hands[0].pinky.proximal.width,
    "pinkyIntermediateLenght" : frame.hands[0].pinky.medial.length,
    "pinkyIntermediateWidth" : frame.hands[0].pinky.medial.width,
    "pinkyDistalLenght" : frame.hands[0].pinky.distal.length,
    "pinkyDistalWidth" : frame.hands[0].pinky.distal.width,
    "thumbLenght" : frame.hands[0].thumb.length,
    "thumbProximalLenght" : frame.hands[0].thumb.proximal.length,
    "thumbProximalWidth" : frame.hands[0].thumb.proximal.width,
    "thumbIntermediateLenght" : frame.hands[0].thumb.medial.length,
    "thumbIntermediateWidth" : frame.hands[0].thumb.medial.width,
    "thumbDistalLenght" : frame.hands[0].thumb.distal.length,
    "thumbDistalWidth" : frame.hands[0].thumb.distal.width,
    "timeStamp" : new Date().getTime()
  });

  request.onsuccess = function(e) {
    // Re-render all the todo's
    //airspring.indexedDB.getHandData();
    /*console.log(frame.hands[0].id);
    console.log("metacarpal: " + frame.hands[0].indexFinger.metacarpal.length);
    console.log("proximal: " + frame.hands[0].indexFinger.proximal.length);
    console.log("medial: " + frame.hands[0].indexFinger.medial.length);
    console.log("distal: " + frame.hands[0].indexFinger.distal.length);
    console.log("Total indexFinger: " + frame.hands[0].indexFinger.length);
    console.log(frame.hands[0]);*/
  };

  request.onerror = function(e) {
    console.log(e.value);
  };
};

//______________________________________________________________________________________________________________


airspring.indexedDB.getHandData = function() {

  var db = airspring.indexedDB.db;
  var trans = db.transaction(["airspring_handdata"], "readwrite");
  var store = trans.objectStore("airspring_handdata");

  // Get everything in the store;
  var keyRange = IDBKeyRange.lowerBound(0);
  var cursorRequest = store.openCursor(keyRange);

  cursorRequest.onsuccess = function(e) {
    var result = e.target.result;
    if(!!result == false)
    return;

    result.continue();
  };

  cursorRequest.onerror = airspring.indexedDB.onerror;
};

//______________________________________________________________________________________________________________


airspring.indexedDB.login = function() {

  var db = airspring.indexedDB.db;
  var trans = db.transaction(["airspring_handdata"], "readwrite");
  var store = trans.objectStore("airspring_handdata");
  var url = "http://airauth.cloudnode.co/api/hand/authenticate";
  var keyRange = IDBKeyRange.lowerBound(0);
  var cursorRequest = store.openCursor(keyRange);
  
  var data = [];
  var hand = {};
  var server_data = {};
  var count = 0;
  var cookie_user_data = getCookies();
  var user_ids = []; 
  // Now Parse Object Data 
  for (var key in cookie_user_data) {
      var obj = cookie_user_data[key];
      user_ids.push(obj.id); 
  };
  var pin_tokens = [];
  var cookie_user_data = getPINCookies();
  for (var key in cookie_user_data) {
      var obj = cookie_user_data[key];
      pin_tokens.push(obj.token); 
  };

  cursorRequest.onsuccess = function(e) {
    
    var result = e.target.result;
    
    if(!!result == false) { 

       hand = {
        "indexMedialLength" : data[0],
        "indexDistalLength" : data[1],
        "middleMedialLength" : data[2],
        "middleDistalLength" : data[3],
        "ringMedialLength" : data[4],
        "ringDistalLength" : data[5],
        "pinkyMedialLength" : data[6],
        "pinkyDistalLength" : data[7],
        "thumbDistalLength" : data[8],
        "indexMedialWidth" : data[9],
        "indexDistalWidth" : data[10],
        "middleMedialWidth" : data[11],
        "middleDistalWidth" : data[12],
        "ringMedialWidth" : data[13],
        "ringDistalWidth" : data[15],
        "pinkyMedialWidth" : data[15],
        "pinkyDistalWidth" : data[16],
        "thumbDistalWidth" : data[17],
        "palmWidth" : data[18],
        "left/right" : data[19],
      }
      
        server_data = { "user_hand" : hand, "user_ids": user_ids, "pin_tokens":pin_tokens }; 
        console.log(server_data);
        $.ajax({ 
              url: url
            , type: 'POST'
            , data: server_data
            , complete: function() {
            },

            success: function(resData) {
                console.log(resData);
                if (resData.pin_valid) {
                    console.log("Pin Valid");
                    redirectURL = "chrome-extension://"+location.host+"/launcher.html";
                    //setTimeout(function(){redirect_success(redirectURL)},500)
                }else{
                    console.log("Pin Not Valid");
                    redirectURL = "chrome-extension://"+location.host+"/pin.html";
                    //setTimeout(function(){redirect_success(redirectURL)},500);
                }
                setTimeout(function(){redirect_success(redirectURL)},500);
             },

            error: function(error) {
                redirectURL = "chrome-extension://"+location.host+"/scan-error.html";
                console.log(error.responseText);
                setTimeout(function(){redirect_error(redirectURL)},500)
             },
        });
  
      return;
    }
  
    for(var x in result.value){
      data.push(result.value[x]);
    }

    result.continue();
  };

  cursorRequest.onerror = airspring.indexedDB.onerror;
  return data;
}

//______________________________________________________________________________________________________________ 

function redirect_error (redirectURL) {
    chrome.extension.sendRequest({redirect: redirectURL});
}
function redirect_success () {
    chrome.extension.sendRequest({redirect: redirectURL});
}
//______________________________________________________________________________________________________________ 

airspring.indexedDB.calcAvg_registration = function() {
    
    console.log("Here");

  var db = airspring.indexedDB.db;
  var trans = db.transaction(["airspring_handdata"], "readwrite");
  var store = trans.objectStore("airspring_handdata");
  //var data_total = [];
  var url = "http://airauth.cloudnode.co/api/hand/compute";
  var server_data = {};
  var keyRange = IDBKeyRange.lowerBound(0);
 
  
  //Array to store the total of all samples
  //var current_total = [];
  var total = [];
  //Initialize to zeros
  //for (var i = 0; i < 5; i++) { current_total[i] = 0; }
  var count = 0;
  var total_index = 0;
  var user_email = $("#user_id").val();
  console.log(user_email); 

  //Request open
  var cursorRequest = store.openCursor(keyRange);

  cursorRequest.onsuccess = function(e) {
    
    var result = e.target.result;
    
    //No more in DataBase
    if(!!result == false) {
    server_data = { "user_hand" : total, "user_email": user_email }; 
      console.log(server_data);
      
      $.ajax({ 
              url: url
            , type: 'POST'
            , data: server_data
            , complete: function() {
                  console.log("Submitted!"); 
            },

            success: function(resData) {
              console.log("here");
                if(resData){
                  $('#leap-hand-register-complete').show();
                  //console.log("here");
                }
             },

            error: function(error) {
               console.log(error.responseText);
             },
          });

      console.log(total);
      return;
    }

    var data = [];
  
    for(var x in result.value){
      data.push(result.value[x]);
    }

    total[total_index] = {
        "indexMedialLength" : data[0],
        "indexDistalLength" : data[1],
        "middleMedialLength" : data[2],
        "middleDistalLength" : data[3],
        "ringMedialLength" : data[4],
        "ringDistalLength" : data[5],
        "pinkyMedialLength" : data[6],
        "pinkyDistalLength" : data[7],
        "thumbDistalLength" : data[8],
        "indexMedialWidth" : data[9],
        "indexDistalWidth" : data[10],
        "middleMedialWidth" : data[11],
        "middleDistalWidth" : data[12],
        "ringMedialWidth" : data[13],
        "ringDistalWidth" : data[15],
        "pinkyMedialWidth" : data[15],
        "pinkyDistalWidth" : data[16],
        "thumbDistalWidth" : data[17],
        "palmWidth" : data[18],
        "left/right" : data[19],
    }
    total_index++;
    count++; 

    result.continue();
  };

  cursorRequest.onerror = airspring.indexedDB.onerror;
  return total;
}

//______________________________________________________________________________________________________________

airspring.indexedDB.addHandData = function(frame) {
  //console.log(frame);
  var db = airspring.indexedDB.db;
  var trans = db.transaction(["airspring_handdata"], "readwrite");
  var store = trans.objectStore("airspring_handdata");

  //console.log("HELL0");
  //console.log(frame);
  var hand_type;
  if (frame.hands[0].type == "right") {
    hand_type = 0;
  }else{
    hand_type =1;
  }

  var request = store.put({
    "indexMedialLength" : frame.hands[0].indexFinger.medial.length,
    "indexDistalLength" : frame.hands[0].indexFinger.distal.length,
    "middleMedialLength" : frame.hands[0].middleFinger.medial.length,
    "middleDistalLength" : frame.hands[0].middleFinger.distal.length,
    "ringMedialLength" : frame.hands[0].ringFinger.medial.length,
    "ringDistalLength" : frame.hands[0].ringFinger.distal.length,
    "pinkyMedialLength" : frame.hands[0].pinky.medial.length,
    "pinkyDistalLength" : frame.hands[0].pinky.distal.length,
    "thumbDistalLength" : frame.hands[0].thumb.distal.length,
    "indexMedialWidth" : frame.hands[0].indexFinger.medial.width,
    "indexDistalWidth" : frame.hands[0].indexFinger.distal.width,
    "middleMedialWidth" : frame.hands[0].middleFinger.medial.width,
    "middleDistalWidth" : frame.hands[0].middleFinger.distal.width,
    "ringMedialWidth" : frame.hands[0].ringFinger.medial.width,
    "ringDistalWidth" : frame.hands[0].ringFinger.distal.width,
    "pinkyMedialWidth" : frame.hands[0].pinky.medial.width,
    "pinkyDistalWidth" : frame.hands[0].pinky.distal.width,
    "thumbDistalWidth" : frame.hands[0].thumb.distal.width,
    "palmWidth" : frame.data.hands[0].palmWidth,
    "left/right" : hand_type,
    "timeStamp" : new Date().getTime()
  });

  request.onsuccess = function(e) {
  };

  request.onerror = function(e) {
    console.log(e.value);
  };
};

//______________________________________________________________________________________________________________


function init() {
  airspring.indexedDB.open("hand_data"); // open displays the data previously saved
}

//______________________________________________________________________________________________________________


window.addEventListener("DOMContentLoaded", init, false); 

function addHandData(frame) {
  airspring.indexedDB.addHandData(frame);
} 

//______________________________________________________________________________________________________________


function deleteDB(dbname){
  var req = indexedDB.deleteDatabase(dbname);
  req.onsuccess = function () {
    console.log("Deleted database successfully");
  };
  req.onerror = function () {
    console.log("Couldn't delete database");
  }
}