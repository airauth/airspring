// Set up the controller:
var controller = Leap.loop(function (frame) {

    visualizeHand = function(controller){
        
        console.log(frame);
        controller.use('riggedHand', {
            scale: 1.3,
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