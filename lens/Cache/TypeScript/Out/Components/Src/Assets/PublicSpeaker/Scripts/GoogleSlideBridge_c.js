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
// @input string presentationId {"hint":"Your presentation id - find it in the google slide link"}
// @input string accessToken {"hint":"Your refreshed access token, find it in the https://developers.google.com/oauthplayground"}
// @input Component.Image slideImage {"hint":"Image component to display slide"}
// @input Component.Text speakerNotes {"hint":"Text component to display speaker notes"}
// @input bool syncNavigationToGoogle = true {"hint":"Auto-sync with Google Slides when navigating locally"}
// @input bool pollForChanges = true {"hint":"Poll for changes from Google Slides"}
// @input float pollingInterval = 5 {"hint":"Polling interval in seconds"}
// @input AssignableType webSocketController
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
var Module = require("../../../../../Modules/Src/Assets/PublicSpeaker/Scripts/GoogleSlideBridge");
Object.setPrototypeOf(script, Module.GoogleSlideBridge.prototype);
script.__initialize();
let awakeEvent = script.createEvent("OnAwakeEvent");
awakeEvent.bind(() => {
    checkUndefined("presentationId", []);
    checkUndefined("accessToken", []);
    checkUndefined("slideImage", []);
    checkUndefined("speakerNotes", []);
    checkUndefined("syncNavigationToGoogle", []);
    checkUndefined("pollForChanges", []);
    checkUndefined("pollingInterval", []);
    checkUndefined("webSocketController", []);
    if (script.onAwake) {
       script.onAwake();
    }
});
