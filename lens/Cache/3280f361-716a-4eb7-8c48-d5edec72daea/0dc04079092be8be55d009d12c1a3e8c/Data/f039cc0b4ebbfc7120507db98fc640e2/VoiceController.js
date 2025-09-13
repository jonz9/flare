"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpeechToText = void 0;
var __selfType = requireType("./VoiceController");
function component(target) { target.getTypeName = function () { return __selfType; }; }
const NativeLogger_1 = require("SpectaclesInteractionKit.lspkg/Utils/NativeLogger");
const log = new NativeLogger_1.default("SpeechToText");
let SpeechToText = class SpeechToText extends BaseScriptComponent {
    onAwake() {
        // Bind the onStart event
        this.createEvent("OnStartEvent").bind(() => {
            this.onStart();
            log.d("OnStart event triggered");
        });
        // Bind the update event (for delay tracking)
        this.createEvent("UpdateEvent").bind(() => {
            this.update();
        });
        // Setup listening options
        this.listeningOptions = VoiceML.ListeningOptions.create();
        this.listeningOptions.speechRecognizer = VoiceMLModule.SpeechRecognizer.Default;
        this.listeningOptions.shouldReturnAsrTranscription = true;
        this.listeningOptions.shouldReturnInterimAsrTranscription = true;
        // Define the onListenUpdate callback
        this.onListenUpdate = (eventData) => {
            if (eventData.transcription.trim() === "") {
                log.d("Transcription is empty");
                return;
            }
            log.d(`Transcription: ${eventData.transcription}`);
            if (eventData.isFinalTranscription) {
                log.d(`Final Transcription: "${eventData.transcription}"`);
                if (this.isListening) { // Only update text if listening is enabled
                    this.text.text = eventData.transcription;
                    this.handleTranscription(eventData.transcription);
                }
                else {
                    log.d("Listening is disabled - ignoring transcription");
                }
            }
        };
        // Set the initial button icon to normal mic (listening off)
        if (this.buttonImage && this.normalMicImage) {
            this.buttonImage.mainMaterial.mainPass.baseTex = this.normalMicImage;
        }
        else {
            log.d("Button image or normal mic image not assigned in inspector");
        }
    }
    onStart() {
        // Setup VoiceMLModule callbacks
        this.voiceMLModule.onListeningEnabled.add(() => {
            log.d("Microphone permissions granted - starting listening");
            this.voiceMLModule.startListening(this.listeningOptions);
            this.eventRegistration = this.voiceMLModule.onListeningUpdate.add(this.onListenUpdate);
        });
        this.voiceMLModule.onListeningDisabled.add(() => {
            this.voiceMLModule.stopListening();
            if (this.eventRegistration) {
                this.voiceMLModule.onListeningUpdate.remove(this.eventRegistration);
                this.eventRegistration = null;
            }
            log.d("Listening stopped due to permissions being revoked");
            // Reset the button icon and state when permissions are revoked
            this.isListening = false;
            if (this.buttonImage && this.normalMicImage) {
                this.buttonImage.mainMaterial.mainPass.baseTex = this.normalMicImage;
            }
        });
        this.voiceMLModule.onListeningError.add((eventErrorArgs) => {
            log.d(`Listening Error: ${eventErrorArgs.error}, Description: ${eventErrorArgs.description}`);
        });
    }
    // Public method to toggle listening
    toggleListening() {
        this.isListening = !this.isListening;
        if (this.isListening) {
            log.d("Listening toggled ON");
            if (this.buttonImage && this.listeningMicImage) {
                this.buttonImage.mainMaterial.mainPass.baseTex = this.listeningMicImage;
            }
        }
        else {
            log.d("Listening toggled OFF");
            if (this.buttonImage && this.normalMicImage) {
                this.buttonImage.mainMaterial.mainPass.baseTex = this.normalMicImage;
            }
            this.text.text = ""; // Clear the text feedback when listening is disabled
            this.commandPending = false; // Reset any pending commands
            this.lastTranscription = "";
        }
    }
    // Handle the transcription directly
    handleTranscription(transcription) {
        // Normalize the transcription for comparison
        const normalizedText = transcription.trim().toLowerCase();
        // Check for valid commands
        if (normalizedText === "next" || normalizedText === "next.") {
            log.d("Detected 'next' command - starting delay");
            this.lastTranscription = normalizedText;
            this.commandPending = true;
            this.commandTimer = 0;
        }
        else if (normalizedText === "previous" ||
            normalizedText === "previous." ||
            normalizedText === "go back" ||
            normalizedText === "go back.") {
            log.d("Detected 'previous' or 'go back' command - starting delay");
            this.lastTranscription = normalizedText;
            this.commandPending = true;
            this.commandTimer = 0;
        }
        else {
            log.d(`Transcription "${transcription}" does not match any commands`);
            this.commandPending = false; // Reset if the transcription doesn't match
        }
    }
    // Update method to handle the delay
    update() {
        if (!this.commandPending)
            return;
        this.commandTimer += getDeltaTime();
        log.d(`Command delay timer: ${this.commandTimer.toFixed(2)} seconds`);
        if (this.commandTimer >= this.commandDelay) {
            // Check if the text is still the same after the delay
            const currentText = this.text.text.trim().toLowerCase();
            if (currentText === this.lastTranscription) {
                log.d(`Command "${this.lastTranscription}" confirmed after delay`);
                if (this.isListening) { // Only execute if listening is enabled
                    if (this.lastTranscription === "next"
                        || this.lastTranscription === "next.") {
                        this.navigateToNext();
                    }
                    else if (this.lastTranscription === "previous"
                        || this.lastTranscription === "go back" ||
                        this.lastTranscription === "previous."
                        || this.lastTranscription === "go back.") {
                        this.navigateToPrevious();
                    }
                }
                else {
                    log.d("Listening is disabled - ignoring command execution");
                }
            }
            else {
                log.d(`Command "${this.lastTranscription}" changed to "${currentText}" during delay - ignoring`);
            }
            this.commandPending = false;
            this.lastTranscription = "";
        }
    }
    // Navigate to the next slide and synchronize across all platforms
    navigateToNext() {
        // Update local presentation
        if (this.presentationSwitcher && !this.useGoogleSlide) {
            this.presentationSwitcher.next();
        }
        // Update Google Slides via direct API
        if (this.googleSlideBridge && this.useGoogleSlide) {
            this.googleSlideBridge.next();
        }
        log.d("Going to next slide");
    }
    // Navigate to the previous slide and synchronize across all platforms
    navigateToPrevious() {
        // Update local presentation
        if (this.presentationSwitcher && !this.useGoogleSlide) {
            this.presentationSwitcher.previous();
        }
        // Update Google Slides via direct API
        if (this.googleSlideBridge && this.useGoogleSlide) {
            this.googleSlideBridge.previous();
        }
        log.d("Going to previous slide");
    }
    __initialize() {
        super.__initialize();
        this.voiceMLModule = require("LensStudio:VoiceMLModule");
        this.lastTranscription = "";
        this.commandPending = false;
        this.commandTimer = 0;
        this.isListening = false;
    }
};
exports.SpeechToText = SpeechToText;
exports.SpeechToText = SpeechToText = __decorate([
    component
], SpeechToText);
//# sourceMappingURL=VoiceController.js.map