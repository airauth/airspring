// Set up the controller:

locatorHeight = window.innerHeight;
$("#locator").css("padding-top", (locatorHeight/2)-125)

$(window).resize(function(){
    locatorHeight = window.innerHeight;
    $("#locator").css("padding-top", (locatorHeight/2)-125)
});

console.log(locatorHeight);
console.log(locatorHeight/2);
var controller = Leap.loop(function (frame) {

    visualizeHand = function(controller){
        
        controller.use('riggedHand', {
            scale: 1.5,
            boneColors: function (boneMesh, leapHand){
                return {
                    hue: 0.33,
                    saturation: 0,
                    lightness: 0.1
                }
            }
    
        });
    
        var camera = controller.plugins.riggedHand.camera;  
        camera.position.set(0,15,30);
        camera.lookAt(new THREE.Vector3(0,3,0));
    };
    visualizeHand(Leap.loopController);
});