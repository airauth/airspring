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
  };

  request.onerror = airspring.indexedDB.onerror;
};

airspring.indexedDB.addHandData = function(frame) {
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

airspring.indexedDB.getFrameDB = function(index) {

  var db = airspring.indexedDB.db;
  var trans = db.transaction(["airspring_handdata"], "readwrite");
  var store = trans.objectStore("airspring_handdata");

  var keyRange = IDBKeyRange.lowerBound(index);
  var cursorRequest = store.openCursor(keyRange);
  
  var data = [];
  for (var i = 0; i < 100; i++) { data[i] = 0; }
  var i = 0;

  cursorRequest.onsuccess = function(e) {
    var result = e.target.result;
    if(!!result == false) { 
      generateChart(data, "#container");
      return;
    }

    data[i++] = result.value.indexProximalLenght;
    //console.log(data);

    result.continue();

  };


  cursorRequest.onerror = airspring.indexedDB.onerror;
  

  return;
};

airspring.indexedDB.calcAvg = function() {

  var db = airspring.indexedDB.db;
  var trans = db.transaction(["airspring_handdata"], "readwrite");
  var store = trans.objectStore("airspring_handdata");
  var data_total = [];

  var keyRange = IDBKeyRange.lowerBound(0);
  var cursorRequest = store.openCursor(keyRange);
  
  var total = [];
  for (var i = 0; i < 46; i++) { total[i] = 0; }
  var count = 0;
  var csvContent = "data:text/csv;charset=utf-8,";
  var csv = 0;

  cursorRequest.onsuccess = function(e) {
    var result = e.target.result;
    if(!!result == false) { 
      /*for (var i = 2; i < total.length; i++) { 
      total[i] = total[i]/count;
      
      }*/
      if(csv == 0){
        csv = 1;
      console.log(data_total);
      data_total.forEach(function(infoArray, index){
        dataString = infoArray.join(",");
        csvContent += index < 300 ? dataString+ "\n" : dataString;
      }); 
      console.log(csvContent);
      var encodedUri = encodeURI(csvContent);
      window.open(encodedUri);
    }
      return;
    }


    var data = [];
  
    for(var x in result.value){
      data.push(result.value[x]);
    }

    data_total[count] = data;

    ++count; 

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
//__________________________________________________________________________________________________________________

airspring.indexedDB.addHandData2 = function(array) {
  var db = airspring.indexedDB.db;
  var trans = db.transaction(["airspring_handdata"], "readwrite");
  var store = trans.objectStore("airspring_handdata");

  var request = store.put({
    "indexMetacarpalLenght" : array[0],
    "indexMetacarpalWidth" : array[1],
    "indexProximalLenght" : array[2],
    "indexProximalWidth" : array[3],
    "indexIntermediateLenght" : array[4],
    "indexIntermediateWidth" : array[4],
    "indexDistalLenght" : array[5],
    "indexDistalWidth" : array[6],
    "middleMetacarpalLenght" : array[7],
    "middleMetacarpalWidth" : array[8],
    "middleProximalLenght" : array[9],
    "middleProximalWidth" : array[10],
    "middleIntermediateLenght" : array[11],
    "middleIntermediateWidth" : array[12],
    "middleDistalLenght" : array[13],
    "middleDistalWidth" : array[14],
    "ringMetacarpalLenght" : array[15],
    "ringMetacarpalWidth" : array[16],
    "ringProximalLenght" : array[17],
    "ringProximalWidth" : array[18],
    "ringIntermediateLenght" : array[19],
    "ringIntermediateWidth" : array[20],
    "ringDistalLenght" : array[21],
    "ringDistalWidth" : array[22],
    "pinkyMetacarpalLenght" : array[23],
    "pinkyMetacarpalWidth" : array[24],
    "pinkyProximalLenght" : array[25],
    "pinkyProximalWidth" : array[26],
    "pinkyIntermediateLenght" : array[27],
    "pinkyIntermediateWidth" : array[28],
    "pinkyDistalLenght" : array[29],
    "pinkyDistalWidth" : array[30],
    "thumbProximalLenght" : array[31],
    "thumbProximalWidth" : array[32],
    "thumbIntermediateLenght" : array[33],
    "thumbIntermediateWidth" : array[34],
    "thumbDistalLenght" : array[35],
    "thumbDistalWidth" : array[36],
    "timeStamp" : new Date().getTime()
  });

  request.onsuccess = function(e) {
  airspring.indexedDB.calcAvg();
  };

  request.onerror = function(e) {
    console.log(e.value);
  };
};
//______________________________________________________________________________________________________________







function init() {
  airspring.indexedDB.open("hand_data"); // open displays the data previously saved
}

window.addEventListener("DOMContentLoaded", init, false); 

function addHandData(frame) {
  airspring.indexedDB.addHandData(frame);
} 

function addHandData2(array) {
  airspring.indexedDB.addHandData2(array);
} 

function getFrameDB() {
  airspring.indexedDB.getFrameDB(0);
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