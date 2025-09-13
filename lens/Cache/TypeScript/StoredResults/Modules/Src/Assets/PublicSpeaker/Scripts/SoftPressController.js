"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SoftPressController = void 0;
var __selfType = requireType("./SoftPressController");
function component(target) { target.getTypeName = function () { return __selfType; }; }
const NativeLogger_1 = require("SpectaclesInteractionKit.lspkg/Utils/NativeLogger");
const animate_1 = require("SpectaclesInteractionKit.lspkg/Utils/animate");
const mathUtils_1 = require("SpectaclesInteractionKit.lspkg/Utils/mathUtils");
const HandVisual_1 = require("SpectaclesInteractionKit.lspkg/Components/Interaction/HandVisual/HandVisual");
const log = new NativeLogger_1.default("SoftPressController");
let SoftPressController = class SoftPressController extends BaseScriptComponent {
    onAwake() {
        // Get the collider component
        this.collider = this.colliderObject.getComponent("Physics.ColliderComponent");
        // Setup hand tracking and instantiate interactor prefab
        this.setupHandTracking();
        // Bind the onStart event
        this.createEvent("OnStartEvent").bind(() => {
            this.onStart();
            log.d("OnStart event triggered");
        });
        // Bind the update event
        this.createEvent("UpdateEvent").bind(() => {
            this.update();
            log.d("Update event triggered");
        });
        // Calculate the top and bottom positions in local space by averaging the vertices
        const topPositions = [
            this.topVertex0.getTransform().getWorldPosition(),
            this.topVertex1.getTransform().getWorldPosition(),
            this.topVertex2.getTransform().getWorldPosition(),
            this.topVertex3.getTransform().getWorldPosition(),
        ];
        const bottomPositions = [
            this.bottomVertex0.getTransform().getWorldPosition(),
            this.bottomVertex1.getTransform().getWorldPosition(),
            this.bottomVertex2.getTransform().getWorldPosition(),
            this.bottomVertex3.getTransform().getWorldPosition(),
        ];
        // Average the top and bottom positions in world space
        const worldTop = topPositions
            .reduce((sum, pos) => sum.add(pos), vec3.zero())
            .scale(new vec3(0.25, 0.25, 0.25));
        const worldBottom = bottomPositions
            .reduce((sum, pos) => sum.add(pos), vec3.zero())
            .scale(new vec3(0.25, 0.25, 0.25));
        // Convert to local space of the collider
        const colliderTransform = this.colliderObject.getTransform();
        const inverseWorldTransform = colliderTransform.getInvertedWorldTransform();
        this.localTop = inverseWorldTransform.multiplyPoint(worldTop);
        this.localBottom = inverseWorldTransform.multiplyPoint(worldBottom);
        // Initialize press value and last closest point (in local space)
        this.pressValue = 0;
        this.lastClosestPointLocal = this.localTop;
    }
    setupHandTracking() {
        // Find the appropriate hand visual in the scene by searching all objects
        let foundHandVisual = null;
        // Search through all root objects and their children
        const rootCount = global.scene.getRootObjectsCount();
        for (let i = 0; i < rootCount; i++) {
            const rootObject = global.scene.getRootObject(i);
            foundHandVisual = this.searchForHandVisual(rootObject);
            if (foundHandVisual)
                break;
        }
        if (!foundHandVisual) {
            const handTypeName = this.useRightHand ? "Right" : "Left";
            log.e(`Could not find ${handTypeName} hand visual in the scene`);
            return;
        }
        this.handVisual = foundHandVisual;
        // Instantiate the interactor prefab
        if (this.interactorPrefab) {
            this.interactorObject = this.interactorPrefab.instantiate(null);
            // Attach the interactor to the wrist
            this.attachToWrist();
            const handTypeName = this.useRightHand ? "Right" : "Left";
            log.d(`Interactor prefab instantiated and attached to ${handTypeName} wrist`);
        }
        else {
            log.e("Interactor prefab is not assigned");
        }
    }
    searchForHandVisual(sceneObject) {
        // Check if this object has a HandVisual component
        try {
            const handVisual = sceneObject.getComponent(HandVisual_1.HandVisual.getTypeName());
            if (handVisual) {
                const handName = sceneObject.name.toLowerCase();
                // Check if this is the correct hand based on useRightHand selection
                // true = Right hand, false = Left hand
                const isCorrectHand = (!this.useRightHand && handName.includes("left")) ||
                    (this.useRightHand && handName.includes("right"));
                if (isCorrectHand) {
                    return handVisual;
                }
            }
        }
        catch (e) {
            // Object doesn't have HandVisual component, continue searching
        }
        // Search through children
        for (let i = 0; i < sceneObject.getChildrenCount(); i++) {
            const child = sceneObject.getChild(i);
            const result = this.searchForHandVisual(child);
            if (result)
                return result;
        }
        return null;
    }
    attachToWrist() {
        if (!this.handVisual || !this.interactorObject)
            return;
        // Get the wrist transform from the hand visual
        const wristObject = this.handVisual.wrist;
        if (wristObject) {
            // Parent the interactor to the wrist
            this.interactorObject.setParent(wristObject);
            // Reset local transform to attach properly
            this.interactorObject.getTransform().setLocalPosition(vec3.zero());
            this.interactorObject.getTransform().setLocalRotation(quat.quatIdentity());
            this.interactorObject.getTransform().setLocalScale(vec3.one());
            log.d("Interactor successfully attached to wrist");
        }
        else {
            log.e("Could not find wrist object in hand visual");
        }
    }
    onStart() {
        // Setup overlap events for the collider
        this.collider.onOverlapEnter.add((e) => {
            const overlap = e.overlap;
            if (overlap.collider.getSceneObject() === this.interactorObject) {
                // Check if the interactor entered from the top
                if (this.isEnteringFromTop()) {
                    log.d(`OverlapEnter(${overlap.id}): Interactor entered from the top. Starting soft press interaction.`);
                    this.isInteracting = true;
                    this.isResetting = false; // Stop any ongoing reset
                    this.resetProgress = 0;
                    this.activeOverlapId = overlap.id; // Store the overlap ID
                }
                else {
                    log.d(`OverlapEnter(${overlap.id}): Interactor did not enter from the top. Ignoring.`);
                }
            }
        });
        this.collider.onOverlapStay.add((e) => {
            const overlap = e.overlap;
            if (overlap.collider.getSceneObject() === this.interactorObject &&
                this.isInteracting &&
                overlap.id === this.activeOverlapId) {
                log.d(`OverlapStay(${overlap.id}): Processing soft press interaction.`);
                this.calculatePressValue();
            }
        });
        this.collider.onOverlapExit.add((e) => {
            const overlap = e.overlap;
            if (overlap.collider.getSceneObject() === this.interactorObject &&
                overlap.id === this.activeOverlapId) {
                log.d(`OverlapExit(${overlap.id}): Interactor exited the collider. Starting smooth reset of press value.`);
                this.isInteracting = false;
                this.isResetting = true;
                this.resetProgress = 0;
                this.activeOverlapId = null; // Clear the overlap ID
            }
        });
    }
    // Check if the interactor is entering from the top (local up direction of the collider)
    isEnteringFromTop() {
        const interactorPos = this.interactorObject.getTransform().getWorldPosition();
        const colliderPos = this.colliderObject.getTransform().getWorldPosition();
        const colliderUp = this.colliderObject.getTransform().up; // Local up direction in world space
        // Vector from collider center to interactor
        const directionToInteractor = interactorPos.sub(colliderPos).normalize();
        // Dot product between collider's up direction and the direction to the interactor
        const dot = directionToInteractor.dot(colliderUp);
        // If dot product is positive and close to 1, the interactor is above the collider
        return dot > 0.5; // Adjust threshold as needed
    }
    // Calculate the press value (0 to 1) based on the closest point's position
    calculatePressValue() {
        const interactorPos = this.interactorObject.getTransform().getWorldPosition();
        // Convert interactor position to local space of the collider
        const colliderTransform = this.colliderObject.getTransform();
        const inverseWorldTransform = colliderTransform.getInvertedWorldTransform();
        const interactorPosLocal = inverseWorldTransform.multiplyPoint(interactorPos);
        // Find the closest point on the collider to the interactor (in world space)
        // Since closestPoint is not available, we'll use the line from top to bottom instead
        const worldTop = colliderTransform.getWorldTransform().multiplyPoint(this.localTop);
        const worldBottom = colliderTransform.getWorldTransform().multiplyPoint(this.localBottom);
        // Calculate the direction from top to bottom
        const topToBottom = worldBottom.sub(worldTop);
        const topToInteractor = interactorPos.sub(worldTop);
        // Project the interactor position onto the line
        const projectionRatio = (0, mathUtils_1.clamp)(topToInteractor.dot(topToBottom) / topToBottom.dot(topToBottom), 0, 1);
        // Calculate the closest point on the line
        const closestPointWorld = worldTop.add(topToBottom.scale(new vec3(projectionRatio, projectionRatio, projectionRatio)));
        // Convert the closest point to local space
        const closestPointLocal = inverseWorldTransform.multiplyPoint(closestPointWorld);
        this.lastClosestPointLocal = closestPointLocal; // Store for reset
        // Project the closest point onto the line from top to bottom (in local space)
        const localTopToBottom = this.localBottom.sub(this.localTop);
        const topToClosest = closestPointLocal.sub(this.localTop);
        const projectionLength = topToClosest.dot(localTopToBottom.normalize());
        const totalLength = localTopToBottom.length;
        // Calculate the press value (0 at top, 1 at bottom)
        const newPressValue = (0, mathUtils_1.clamp)(projectionLength / totalLength, 0, 1);
        // Update press value and check for event trigger
        this.pressValue = newPressValue;
        log.d(`Press value: ${this.pressValue}`);
        // Optionally move the marker to the closest point (in world space, for visualization)
        if (this.closestPointMarker) {
            this.closestPointMarker.getTransform().setWorldPosition(closestPointWorld);
        }
        // Trigger event if press value exceeds threshold and hasn't been triggered yet
        if (this.pressValue >= this.pressThreshold && !this.hasTriggeredEvent) {
            this.onPressThresholdReached();
            this.hasTriggeredEvent = true;
        }
        // Reset the event trigger if the press value returns to 0 (top position)
        if (this.pressValue <= 0 && this.hasTriggeredEvent) {
            log.d("Press value reset to 0. Event can trigger again on next press.");
            this.hasTriggeredEvent = false;
        }
    }
    // Smoothly reset the press value to 0
    smoothReset() {
        if (!this.isResetting)
            return;
        // Increment reset progress based on time
        this.resetProgress += getDeltaTime() / this.resetDuration;
        this.resetProgress = (0, mathUtils_1.clamp)(this.resetProgress, 0, 1);
        // Interpolate the closest point from its last position to the top (in local space)
        const interpolatedPointLocal = (0, animate_1.mix)(this.lastClosestPointLocal, this.localTop, this.resetProgress);
        // Update press value based on the interpolated point
        const topToBottom = this.localBottom.sub(this.localTop);
        const topToCurrent = interpolatedPointLocal.sub(this.localTop);
        const projectionLength = topToCurrent.dot(topToBottom.normalize());
        const totalLength = topToBottom.length;
        this.pressValue = (0, mathUtils_1.clamp)(projectionLength / totalLength, 0, 1);
        // Optionally move the marker to the interpolated point (convert back to world space for visualization)
        if (this.closestPointMarker) {
            const colliderTransform = this.colliderObject.getTransform();
            const interpolatedPointWorld = colliderTransform.getWorldTransform().multiplyPoint(interpolatedPointLocal);
            this.closestPointMarker.getTransform().setWorldPosition(interpolatedPointWorld);
        }
        // Reset the event trigger if the press value returns to 0
        if (this.pressValue <= 0 && this.hasTriggeredEvent) {
            log.d("Press value reset to 0 during smooth reset. Event can trigger again on next press.");
            this.hasTriggeredEvent = false;
        }
        // Stop resetting when fully reset
        if (this.resetProgress >= 1) {
            this.isResetting = false;
            this.resetProgress = 0;
            this.pressValue = 0;
            this.lastClosestPointLocal = this.localTop;
            log.d("Smooth reset complete.");
        }
    }
    // Event triggered when the press threshold is reached
    onPressThresholdReached() {
        log.d(`Press threshold of ${this.pressThreshold} reached! Triggering event.`);
        if (this.next) {
            this.navigateToNext();
        }
        else {
            this.navigateToPrevious();
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
    update() {
        if (this.isInteracting) {
            this.calculatePressValue();
        }
        if (this.isResetting) {
            this.smoothReset();
        }
    }
    __initialize() {
        super.__initialize();
        this.isInteracting = false;
        this.pressValue = 0;
        this.hasTriggeredEvent = false;
        this.isResetting = false;
        this.resetProgress = 0;
        this.activeOverlapId = null;
    }
};
exports.SoftPressController = SoftPressController;
exports.SoftPressController = SoftPressController = __decorate([
    component
], SoftPressController);
//# sourceMappingURL=SoftPressController.js.map