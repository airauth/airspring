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


airspring.indexedDB.calcAvg_login = function() {

  var db = airspring.indexedDB.db;
  var trans = db.transaction(["airspring_handdata"], "readwrite");
  var store = trans.objectStore("airspring_handdata");
  var data_total = [];

  var keyRange = IDBKeyRange.lowerBound(0);
  var cursorRequest = store.openCursor(keyRange);
  
  //Array to store the total of all samples
  var total = [];

  //Initialize to zeros
  for (var i = 0; i < 9; i++) { total[i] = 0; }

  var count = 0;

  cursorRequest.onsuccess = function(e) {
    
    var result = e.target.result;
    
    if(!!result == false) { 
      for (var i = 0; i < total.length; i++) { 
        total[i] = total[i]/10;
      }
      console.log(total); 
      return;
    }

    var data = [];
  
    for(var x in result.value){
      data.push(result.value[x]);
    }

    if(count > 4 && count < 15){
    
      for (var i = 0; i < data.length; i++) { 
        total[i] += data[i];
      }

    }

    ++count; 

    result.continue();
  };

  cursorRequest.onerror = airspring.indexedDB.onerror;
  return total;
}

//______________________________________________________________________________________________________________ 

airspring.indexedDB.calcAvg_registration = function() {

  var db = airspring.indexedDB.db;
  var trans = db.transaction(["airspring_handdata"], "readwrite");
  var store = trans.objectStore("airspring_handdata");
  var data_total = [];
  var url = "http://airauth.cloudnode.co/api/hand/compute";
  var server_data = {};
  var keyRange = IDBKeyRange.lowerBound(0);
 
  
  //Array to store the total of all samples
  var current_total = [];
  var total = [];
  //Initialize to zeros
  for (var i = 0; i < 9; i++) { current_total[i] = 0; }
  var count = 0;
  var total_index = 0;
  var user_id = $("#user_id").val();
  console.log(user_id); 

  //Request open
  var cursorRequest = store.openCursor(keyRange);

  cursorRequest.onsuccess = function(e) {
    
    var result = e.target.result;
    
    //No more in DataBase
    if(!!result == false) {
    server_data = { "user_hand" : total, "user_id": user_id }; 
      //console.log(total);
      
      $.ajax({ 
              url: url
            , type: 'POST'
            , data: server_data
            , complete: function() {
                  console.log("Submitted!"); 
            },

            success: function(resData) {
                  console.log(resData);
                  // Create a new object store
             },

            error: function(error) {
               console.log(error.responseText);
             },
          });

      console.log(total);
      return;
    }


    //console.log("dbCount", count);
    if (count == 20 || count == 40 || count == 60 || count == 80 || count == 99) {
      //console.log("Current Total Length = ", current_total.length);
      for (var i = 0; i < current_total.length; i++) { 
        current_total[i] = current_total[i]/10;
      }
      total[total_index] = {
        "indexMedialLength" : current_total[0],
        "indexDistalLength" : current_total[1],
        "middleMedialLength" : current_total[2],
        "middleDistalLength" : current_total[3],
        "ringMedialLength" : current_total[4],
        "ringDistalLength" : current_total[5],
        "pinkyMedialLength" : current_total[6],
        "pinkyDistalLength" : current_total[7],
        "thumbDistalLength" : current_total[8],
      }
      total_index++;
      for (var i = 0; i < 9; i++) { current_total[i] = 0; }
    }

    var data = [];
  
    for(var x in result.value){
      data.push(result.value[x]);
    }

    

    if(count > 4 && count < 15){
    
      for (var i = 0; i < data.length; i++) { 
        current_total[i] += data[i];
      }

    }
    
    if(count > 24 && count < 35){
    
      for (var i = 0; i < data.length; i++) { 
        current_total[i] += data[i];
      }

    }
    
    if(count > 44 && count < 55){
    
      for (var i = 0; i < data.length; i++) { 
        current_total[i] += data[i];
      }

    }
    
    if(count > 64 && count < 75){
    
      for (var i = 0; i < data.length; i++) { 
        current_total[i] += data[i];
      }

    }
    
    if(count > 84 && count < 95){
    
      for (var i = 0; i < data.length; i++) { 
        current_total[i] += data[i];
      }

    }

    ++count; 

    result.continue();
  };

  cursorRequest.onerror = airspring.indexedDB.onerror;
  return total;
}

//______________________________________________________________________________________________________________

airspring.indexedDB.addHandData = function(frame) {
  var db = airspring.indexedDB.db;
  var trans = db.transaction(["airspring_handdata"], "readwrite");
  var store = trans.objectStore("airspring_handdata");

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


function addHandData2(array) {
  airspring.indexedDB.addHandData2(array);
} 

//______________________________________________________________________________________________________________


function addHandData3(array) {
  airspring.indexedDB.addHandData3(array);
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