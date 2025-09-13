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
// @input Component.Text text {"hint":"Text component to display transcriptions"}
// @input AssignableType presentationSwitcher {"hint":"Reference to the PresentationSwitcher component"}
// @input AssignableType_1 googleSlideBridge {"hint":"Reference to the GoogleSlideBridge component"}
// @input float commandDelay = 2 {"hint":"Delay time (in seconds) to wait before confirming a command"}
// @input Component.Image buttonImage {"hint":"The button image component to swap icons"}
// @input Asset.Texture normalMicImage {"hint":"Texture for the normal mic icon (listening off)"}
// @input Asset.Texture listeningMicImage {"hint":"Texture for the listening mic icon (listening on)"}
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
var Module = require("../../../../../Modules/Src/Assets/PublicSpeaker/Scripts/VoiceController");
Object.setPrototypeOf(script, Module.SpeechToText.prototype);
script.__initialize();
let awakeEvent = script.createEvent("OnAwakeEvent");
awakeEvent.bind(() => {
    checkUndefined("text", []);
    checkUndefined("presentationSwitcher", []);
    checkUndefined("googleSlideBridge", []);
    checkUndefined("commandDelay", []);
    checkUndefined("buttonImage", []);
    checkUndefined("normalMicImage", []);
    checkUndefined("listeningMicImage", []);
    checkUndefined("useGoogleSlide", []);
    if (script.onAwake) {
       script.onAwake();
    }
});
