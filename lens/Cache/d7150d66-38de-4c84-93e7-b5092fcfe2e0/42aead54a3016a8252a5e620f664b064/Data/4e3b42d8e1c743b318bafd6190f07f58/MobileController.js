"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MobileController = void 0;
var __selfType = requireType("./MobileController");
function component(target) { target.getTypeName = function () { return __selfType; }; }
const SIK_1 = require("SpectaclesInteractionKit.lspkg/SIK");
const NativeLogger_1 = require("SpectaclesInteractionKit.lspkg/Utils/NativeLogger");
const log = new NativeLogger_1.default("MobileController");
let MobileController = class MobileController extends BaseScriptComponent {
    onAwake() {
        this.createEvent("OnStartEvent").bind(() => {
            this.onStart();
        });
    }
    onStart() {
        // Retrieve MobileInputData from SIK's definitions.
        let mobileInputData = SIK_1.SIK.MobileInputData;
        // Fetch the MotionController for the phone.
        let motionController = mobileInputData.motionController;
        // Add touch event handler that uses the normalized position to decide next/previous.
        motionController.onTouchEvent.add((normalizedPosition, touchId, timestampMs, phase) => {
            // Wait until the touch is finished (Ended phase)
            if (phase !== MotionController.TouchPhase.Ended)
                return;
            // Check if the touch occurred on the left half of the screen.
            if (normalizedPosition.x < 0.5) {
                log.d("Previous slide");
                this.navigateToPrevious();
            }
            else {
                log.d("Next slide");
                this.navigateToNext();
            }
        });
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
    }
};
exports.MobileController = MobileController;
exports.MobileController = MobileController = __decorate([
    component
], MobileController);
//# sourceMappingURL=MobileController.js.map