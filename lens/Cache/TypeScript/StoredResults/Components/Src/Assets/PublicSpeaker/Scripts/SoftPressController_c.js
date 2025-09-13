if (script.onAwake) {
	script.onAwake();
	return;
};
function checkUndefined(property, showIfData){
   for (var i = 0; i < showIfData.length; i++){
       if (showIfData[i][0] && script[showIfData[i][0]] != showIfData[i][1]){
           return;
       }
   }
   if (script[property] == undefined){
      throw new Error('Input ' + property + ' was not provided for the object ' + script.getSceneObject().name);
   }
}
// @input SceneObject colliderObject {"hint":"The collider that will detect the soft press interaction"}
// @input Asset.ObjectPrefab interactorPrefab {"hint":"The prefab to attach to the wrist as the interactor"}
// @input bool useRightHand = true {"hint":"Use right hand? (true = Right hand, false = Left hand)"}
// @input SceneObject closestPointMarker {"hint":"Optional: A SceneObject to visually mark the closest point on the line (for debugging)"}
// @input SceneObject topVertex0 {"hint":"Top vertex 0 of the collider cube"}
// @input SceneObject topVertex1 {"hint":"Top vertex 1 of the collider cube"}
// @input SceneObject topVertex2 {"hint":"Top vertex 2 of the collider cube"}
// @input SceneObject topVertex3 {"hint":"Top vertex 3 of the collider cube"}
// @input SceneObject bottomVertex0 {"hint":"Bottom vertex 0 of the collider cube"}
// @input SceneObject bottomVertex1 {"hint":"Bottom vertex 1 of the collider cube"}
// @input SceneObject bottomVertex2 {"hint":"Bottom vertex 2 of the collider cube"}
// @input SceneObject bottomVertex3 {"hint":"Bottom vertex 3 of the collider cube"}
// @input float pressThreshold = 0.7 {"hint":"The threshold for triggering the press event (0 to 1)"}
// @input float resetDuration = 1 {"hint":"Time (in seconds) for the press value to smoothly reset to 0 after exit"}
// @input AssignableType presentationSwitcher {"hint":"The switcher manager"}
// @input AssignableType_1 googleSlideBridge {"hint":"The google switcher manager"}
// @input bool next {"hint":"Does the presentation switcher bring you to the previous slide?"}
// @input bool useGoogleSlide {"hint":"Enable this boolean if you are planning to Use Google Slide API and the Google Slide Bridge"}
var scriptPrototype = Object.getPrototypeOf(script);
if (!global.BaseScriptComponent){
   function BaseScriptComponent(){}
   global.BaseScriptComponent = BaseScriptComponent;
   global.BaseScriptComponent.prototype = scriptPrototype;
   global.BaseScriptComponent.prototype.__initialize = function(){};
   global.BaseScriptComponent.getTypeName = function(){
       throw new Error("Cannot get type name from the class, not decorated with @component");
   }
}
var Module = require("../../../../../Modules/Src/Assets/PublicSpeaker/Scripts/SoftPressController");
Object.setPrototypeOf(script, Module.SoftPressController.prototype);
script.__initialize();
let awakeEvent = script.createEvent("OnAwakeEvent");
awakeEvent.bind(() => {
    checkUndefined("colliderObject", []);
    checkUndefined("interactorPrefab", []);
    checkUndefined("useRightHand", []);
    checkUndefined("topVertex0", []);
    checkUndefined("topVertex1", []);
    checkUndefined("topVertex2", []);
    checkUndefined("topVertex3", []);
    checkUndefined("bottomVertex0", []);
    checkUndefined("bottomVertex1", []);
    checkUndefined("bottomVertex2", []);
    checkUndefined("bottomVertex3", []);
    checkUndefined("pressThreshold", []);
    checkUndefined("resetDuration", []);
    checkUndefined("presentationSwitcher", []);
    checkUndefined("googleSlideBridge", []);
    checkUndefined("next", []);
    checkUndefined("useGoogleSlide", []);
    if (script.onAwake) {
       script.onAwake();
    }
});
