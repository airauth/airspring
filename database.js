var airspring = {};
airspring.indexedDB = {};
airspring.indexedDB.db = null;

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
    airspring.indexedDB.getHandData();
  };

  request.onerror = airspring.indexedDB.onerror;
};

airspring.indexedDB.addHandData = function(frame) {
  var db = airspring.indexedDB.db;
  var trans = db.transaction(["airspring_handdata"], "readwrite");
  var store = trans.objectStore("airspring_handdata");

  console.log("Adding Data");

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
  };

  request.onerror = function(e) {
    console.log(e.value);
  };
};

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

airspring.indexedDB.calcAvg = function() {

  var db = airspring.indexedDB.db;
  var trans = db.transaction(["airspring_handdata"], "readwrite");
  var store = trans.objectStore("airspring_handdata");

  var keyRange = IDBKeyRange.lowerBound(0);
  var cursorRequest = store.openCursor(keyRange);
  
  var total = [];
  for (var i = 0; i < 46; i++) { total[i] = 0; }
  var count = 0;

  cursorRequest.onsuccess = function(e) {
    var result = e.target.result;
    if(!!result == false) { 
      for (var i = 2; i < total.length; i++) { 
      total[i] = total[i]/count;
      }
      console.log(total);
      return;
    }

    ++count; 

    var data = [];
  
    for(var x in result.value){
      data.push(result.value[x]);
    }

    total[0] = data[0];
    total[1] = data[1];

    for (var i = 2; i < data.length; i++) { 
      total[i] += data[i];
    }


    //console.log(result);
    //console.log(total)
    result.continue();
  };

  cursorRequest.onerror = airspring.indexedDB.onerror;
  return total;
}

function init() {
  airspring.indexedDB.open("hand_data"); // open displays the data previously saved
}

window.addEventListener("DOMContentLoaded", init, false); 

function addHandData(frame) {
  airspring.indexedDB.addHandData(frame);
}  

function deleteDB(dbname){
  var req = indexedDB.deleteDatabase(dbname);
  req.onsuccess = function () {
    console.log("Deleted database successfully");
  };
  req.onerror = function () {
    console.log("Couldn't delete database");
  }
}