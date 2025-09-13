"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmoothRepositioning = void 0;
var __selfType = requireType("./SmoothRespositioning");
function component(target) { target.getTypeName = function () { return __selfType; }; }
const CameraService_1 = require("./CameraService");
let SmoothRepositioning = class SmoothRepositioning extends BaseScriptComponent {
    onAwake() {
        // Create the main update event
        this.createEvent("UpdateEvent").bind(() => this.onUpdate());
        this.cameraService = CameraService_1.CameraService.getInstance();
        // Store original Y position
        this.originalYPosition = this.getSceneObject()
            .getTransform()
            .getWorldPosition().y;
    }
    onUpdate() {
        if (this.isRepositioning) {
            this.updateAnimation();
        }
        else {
            this.checkAndReposition();
        }
    }
    updateAnimation() {
        const currentTime = getTime();
        const elapsed = currentTime - this.animStartTime;
        const t = Math.min(elapsed / this.animDuration, 1.0);
        const objTransform = this.getSceneObject().getTransform();
        // Lerp position and rotation
        const newPosition = vec3.lerp(this.animStartPosition, this.animTargetPosition, t);
        const newRotation = quat.slerp(this.animStartRotation, this.animTargetRotation, t);
        // Apply position and rotation
        objTransform.setWorldPosition(newPosition);
        objTransform.setWorldRotation(newRotation);
        // Check if animation is complete
        if (t >= 1.0) {
            // Set exact final position and rotation to avoid floating point errors
            objTransform.setWorldPosition(this.animTargetPosition);
            objTransform.setWorldRotation(this.animTargetRotation);
            // End animation state
            this.isRepositioning = false;
            this.lastRepositionTime = currentTime;
        }
    }
    // Separate the update logic
    checkAndReposition() {
        // Don't reposition if we're still in cooldown
        const currentTime = getTime();
        if (currentTime - this.lastRepositionTime < this.cooldownTime)
            return;
        if (this.needsRepositioning()) {
            this.repositionInFrontOfCamera();
            print("Repositioning");
        }
    }
    needsRepositioning() {
        // Get camera position
        const objTransform = this.getSceneObject().getTransform();
        const objPosition = objTransform.getWorldPosition();
        const camTransform = this.getCameraTransform();
        const camPosition = this.getCameraPosition();
        // Check distance
        const distance = objPosition.distance(camPosition);
        const isTooFar = distance > this.maxDistance;
        // Check Y-axis angle difference
        // Get forward direction in XZ plane for both camera and direction to object
        const camForwardXZ = new vec3(camTransform.forward.x, 0, camTransform.forward.z).normalize();
        const dirToObjectXZ = new vec3(objPosition.x - camPosition.x, 0, objPosition.z - camPosition.z).normalize();
        // Calculate angle in degrees (only considering y-axis rotation)
        const angleCos = camForwardXZ.dot(dirToObjectXZ);
        const angleRad = Math.acos(Math.min(Math.max(angleCos, -1), 1)); // Clamp to avoid domain errors
        const angleDeg = angleRad * (180 / Math.PI);
        const isAngleTooLarge = angleDeg > this.maxAngleDegrees;
        // Reposition ONLY if BOTH conditions are met
        return isTooFar || isAngleTooLarge;
    }
    repositionInFrontOfCamera() {
        this.isRepositioning = true;
        const objTransform = this.getSceneObject().getTransform();
        this.animStartPosition = objTransform.getWorldPosition();
        this.animStartRotation = objTransform.getWorldRotation();
        const camTransform = this.getCameraTransform();
        const camPosition = camTransform.getWorldPosition();
        // Get camera forward vector but flatten it to XZ plane
        const flatForward = new vec3(camTransform.forward.x, 0, camTransform.forward.z).normalize();
        // Calculate position in front of camera on XZ plane
        const basePositionXZ = camPosition.add(flatForward.uniformScale(this.frontDistance));
        // Apply horizontal offset (using right vector but flattened)
        const flatRight = new vec3(camTransform.right.x, 0, camTransform.right.z).normalize();
        const rightOffset = flatRight.uniformScale(this.xOffset);
        // Create final position with preserved Y + offset
        this.animTargetPosition = new vec3(basePositionXZ.x + rightOffset.x, this.originalYPosition + this.yOffset, basePositionXZ.z + rightOffset.z);
        // Calculate rotation to face camera, but only on Y axis
        const horizontalDir = new vec3(camPosition.x - this.animTargetPosition.x, 0, camPosition.z - this.animTargetPosition.z).normalize();
        // Create a rotation that only affects the Y axis
        this.animTargetRotation = quat.lookAt(horizontalDir, vec3.up());
        // Animation timing setup
        const distance = this.animStartPosition.distance(this.animTargetPosition);
        this.animDuration = distance / this.repositionSpeed;
        this.animStartTime = getTime();
    }
    getCameraPosition() {
        const mainCamera = this.cameraService.getCamera(CameraService_1.CameraType.Main);
        return mainCamera.getTransform().getWorldPosition();
    }
    getCameraTransform() {
        const mainCamera = this.cameraService.getCamera(CameraService_1.CameraType.Main);
        return mainCamera.getTransform();
    }
    __initialize() {
        super.__initialize();
        this.lastRepositionTime = 0;
        this.isRepositioning = false;
        this.animStartTime = 0;
        this.animDuration = 0;
    }
};
exports.SmoothRepositioning = SmoothRepositioning;
exports.SmoothRepositioning = SmoothRepositioning = __decorate([
    component
], SmoothRepositioning);
//# sourceMappingURL=SmoothRespositioning.js.map