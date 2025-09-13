"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CameraService = exports.CameraType = void 0;
const WorldCameraFinderProvider_1 = require("SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider");
var CameraType;
(function (CameraType) {
    CameraType[CameraType["Main"] = 0] = "Main";
    CameraType[CameraType["SpecsLeft"] = 1] = "SpecsLeft";
    CameraType[CameraType["SpecsRight"] = 2] = "SpecsRight";
})(CameraType || (exports.CameraType = CameraType = {}));
class CameraService {
    static getInstance() {
        if (!CameraService.instance) {
            CameraService.instance = new CameraService();
        }
        return CameraService.instance;
    }
    // Simplified constructor with no initialization that uses CameraModule
    constructor() {
        // Just keep the main camera
        this._mainCamera = WorldCameraFinderProvider_1.default.getInstance().getComponent();
        // No complex initialization needed
    }
    get mainCameraTransform() {
        return this._mainCamera.getTransform();
    }
    getCamera(cameraType) {
        if (cameraType === CameraType.Main) {
            return this._mainCamera;
        }
        if (cameraType === CameraType.SpecsLeft) {
            if (!this._specsLeftCamera) {
                print("Warning: SpecsLeft camera requested but not initialized");
            }
            return this._specsLeftCamera;
        }
        if (cameraType === CameraType.SpecsRight) {
            if (!this._specsRightCamera) {
                print("Warning: SpecsRight camera requested but not initialized");
            }
            return this._specsRightCamera;
        }
        throw new Error("Invalid camera type");
    }
}
exports.CameraService = CameraService;
//# sourceMappingURL=CameraService.js.map