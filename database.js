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
  //var hand = frame.hands[0];


  console.log(frame.hands[0].valid);
  var request = store.put({
    "valid" : frame.hands[0].valid,
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

function init() {
  airspring.indexedDB.open("hand_data"); // open displays the data previously saved
}

window.addEventListener("DOMContentLoaded", init, false); 

function addHandData(frame) {
  airspring.indexedDB.addHandData(frame);
}  

function deleteDB(dbname){
  window.indexedDB.deleteDatabase(dbname);
}