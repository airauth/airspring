//alert("On the page!");

chrome.runtime.sendMessage({greeting: "hello"}, function(response) {
  console.log(response.farewell);
});

var email = document.getElementById("email");
email.value = "My default value";
///$('#email').text("conrad@foucher.ca");
//$('#pass').text("caf1101");