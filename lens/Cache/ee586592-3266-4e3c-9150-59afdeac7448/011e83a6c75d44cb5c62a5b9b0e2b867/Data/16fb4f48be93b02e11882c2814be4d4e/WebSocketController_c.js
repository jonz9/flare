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
// @input string serverUrl = "wss://google-slide-spectacles-03332e1cf78e.herokuapp.com" {"hint":"WebSocket server URL (e.g., wss://google-slide-spectacles-03332e1cf78e.herokuapp.com)"}
// @input Component.Text statusText {"hint":"Text component to display connection status"}
// @input bool autoConnect = true {"hint":"Auto-connect on start"}
// @input float maxReconnectAttempts = 5 {"hint":"Maximum reconnection attempts"}
// @input float reconnectInterval = 3 {"hint":"Reconnection interval in seconds"}
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
var Module = require("../../../../../Modules/Src/Assets/PublicSpeaker/Scripts/WebSocketController");
Object.setPrototypeOf(script, Module.WebSocketController.prototype);
script.__initialize();
let awakeEvent = script.createEvent("OnAwakeEvent");
awakeEvent.bind(() => {
    checkUndefined("serverUrl", []);
    checkUndefined("statusText", []);
    checkUndefined("autoConnect", []);
    checkUndefined("maxReconnectAttempts", []);
    checkUndefined("reconnectInterval", []);
    if (script.onAwake) {
       script.onAwake();
    }
});
