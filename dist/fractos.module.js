var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import * as THREE from "three";
import { EventDispatcher, Vector3, MOUSE, TOUCH, Quaternion, Spherical, Vector2, MathUtils, OrthographicCamera, BufferGeometry, Float32BufferAttribute, Mesh, ShaderMaterial, UniformsUtils, WebGLRenderTarget, Clock, LinearFilter, RGBAFormat, Color, RGBFormat, Texture, NearestFilter } from "three";
var colorBackground = "uniform vec3 bg_color;\n\nvec3 background(vec3 direction) {\n    return bg_color;\n}";
var hemisphereBackground = "uniform vec3 bg_top;\nuniform vec3 bg_bottom;\nuniform float bg_blendAngle;\n\nvec3 background(vec3 direction) {\n    float angle = atan(direction.y / length(direction.xz));\n    return mix(bg_bottom, bg_top, clamp((angle + bg_blendAngle) / 2.0 / bg_blendAngle, 0.0, 1.0));\n}";
var imageBackground = "uniform samplerCube bg_image;\n\nvec3 background(vec3 direction) {\n    return texture(bg_image, direction).xyz;\n}";
class Background {
}
class ColorBackground extends Background {
  constructor(color) {
    super();
    __publicField(this, "color");
    this.color = color;
  }
  getCode() {
    return colorBackground;
  }
}
class HemisphereBackground extends Background {
  constructor(top, bottom, blendAngle = 0.1) {
    super();
    __publicField(this, "top");
    __publicField(this, "bottom");
    __publicField(this, "blendAngle");
    this.top = top;
    this.bottom = bottom;
    this.blendAngle = blendAngle;
  }
  getCode() {
    return hemisphereBackground;
  }
}
class ImageBackground extends Background {
  constructor(image) {
    super();
    __publicField(this, "image");
    this.image = image;
  }
  getCode() {
    return imageBackground;
  }
}
const _changeEvent = { type: "change" };
const _startEvent = { type: "start" };
const _endEvent = { type: "end" };
class OrbitControls extends EventDispatcher {
  constructor(object, domElement) {
    super();
    if (domElement === void 0)
      console.warn('THREE.OrbitControls: The second parameter "domElement" is now mandatory.');
    if (domElement === document)
      console.error('THREE.OrbitControls: "document" should not be used as the target "domElement". Please use "renderer.domElement" instead.');
    this.object = object;
    this.domElement = domElement;
    this.enabled = true;
    this.target = new Vector3();
    this.minDistance = 0;
    this.maxDistance = Infinity;
    this.minZoom = 0;
    this.maxZoom = Infinity;
    this.minPolarAngle = 0;
    this.maxPolarAngle = Math.PI;
    this.minAzimuthAngle = -Infinity;
    this.maxAzimuthAngle = Infinity;
    this.enableDamping = false;
    this.dampingFactor = 0.05;
    this.enableZoom = true;
    this.zoomSpeed = 1;
    this.enableRotate = true;
    this.rotateSpeed = 1;
    this.enablePan = true;
    this.panSpeed = 1;
    this.screenSpacePanning = true;
    this.keyPanSpeed = 7;
    this.autoRotate = false;
    this.autoRotateSpeed = 2;
    this.keys = { LEFT: "ArrowLeft", UP: "ArrowUp", RIGHT: "ArrowRight", BOTTOM: "ArrowDown" };
    this.mouseButtons = { LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN };
    this.touches = { ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN };
    this.target0 = this.target.clone();
    this.position0 = this.object.position.clone();
    this.zoom0 = this.object.zoom;
    this._domElementKeyEvents = null;
    this.getPolarAngle = function() {
      return spherical.phi;
    };
    this.getAzimuthalAngle = function() {
      return spherical.theta;
    };
    this.listenToKeyEvents = function(domElement2) {
      domElement2.addEventListener("keydown", onKeyDown);
      this._domElementKeyEvents = domElement2;
    };
    this.saveState = function() {
      scope.target0.copy(scope.target);
      scope.position0.copy(scope.object.position);
      scope.zoom0 = scope.object.zoom;
    };
    this.reset = function() {
      scope.target.copy(scope.target0);
      scope.object.position.copy(scope.position0);
      scope.object.zoom = scope.zoom0;
      scope.object.updateProjectionMatrix();
      scope.dispatchEvent(_changeEvent);
      scope.update();
      state = STATE.NONE;
    };
    this.update = function() {
      const offset = new Vector3();
      const quat = new Quaternion().setFromUnitVectors(object.up, new Vector3(0, 1, 0));
      const quatInverse = quat.clone().invert();
      const lastPosition = new Vector3();
      const lastQuaternion = new Quaternion();
      const twoPI = 2 * Math.PI;
      return function update() {
        const position2 = scope.object.position;
        offset.copy(position2).sub(scope.target);
        offset.applyQuaternion(quat);
        spherical.setFromVector3(offset);
        if (scope.autoRotate && state === STATE.NONE) {
          rotateLeft(getAutoRotationAngle());
        }
        if (scope.enableDamping) {
          spherical.theta += sphericalDelta.theta * scope.dampingFactor;
          spherical.phi += sphericalDelta.phi * scope.dampingFactor;
        } else {
          spherical.theta += sphericalDelta.theta;
          spherical.phi += sphericalDelta.phi;
        }
        let min = scope.minAzimuthAngle;
        let max = scope.maxAzimuthAngle;
        if (isFinite(min) && isFinite(max)) {
          if (min < -Math.PI)
            min += twoPI;
          else if (min > Math.PI)
            min -= twoPI;
          if (max < -Math.PI)
            max += twoPI;
          else if (max > Math.PI)
            max -= twoPI;
          if (min <= max) {
            spherical.theta = Math.max(min, Math.min(max, spherical.theta));
          } else {
            spherical.theta = spherical.theta > (min + max) / 2 ? Math.max(min, spherical.theta) : Math.min(max, spherical.theta);
          }
        }
        spherical.phi = Math.max(scope.minPolarAngle, Math.min(scope.maxPolarAngle, spherical.phi));
        spherical.makeSafe();
        spherical.radius *= scale;
        spherical.radius = Math.max(scope.minDistance, Math.min(scope.maxDistance, spherical.radius));
        if (scope.enableDamping === true) {
          scope.target.addScaledVector(panOffset, scope.dampingFactor);
        } else {
          scope.target.add(panOffset);
        }
        offset.setFromSpherical(spherical);
        offset.applyQuaternion(quatInverse);
        position2.copy(scope.target).add(offset);
        scope.object.lookAt(scope.target);
        if (scope.enableDamping === true) {
          sphericalDelta.theta *= 1 - scope.dampingFactor;
          sphericalDelta.phi *= 1 - scope.dampingFactor;
          panOffset.multiplyScalar(1 - scope.dampingFactor);
        } else {
          sphericalDelta.set(0, 0, 0);
          panOffset.set(0, 0, 0);
        }
        scale = 1;
        if (zoomChanged || lastPosition.distanceToSquared(scope.object.position) > EPS || 8 * (1 - lastQuaternion.dot(scope.object.quaternion)) > EPS) {
          scope.dispatchEvent(_changeEvent);
          lastPosition.copy(scope.object.position);
          lastQuaternion.copy(scope.object.quaternion);
          zoomChanged = false;
          return true;
        }
        return false;
      };
    }();
    this.dispose = function() {
      scope.domElement.removeEventListener("contextmenu", onContextMenu);
      scope.domElement.removeEventListener("pointerdown", onPointerDown);
      scope.domElement.removeEventListener("wheel", onMouseWheel);
      scope.domElement.removeEventListener("touchstart", onTouchStart);
      scope.domElement.removeEventListener("touchend", onTouchEnd);
      scope.domElement.removeEventListener("touchmove", onTouchMove);
      scope.domElement.ownerDocument.removeEventListener("pointermove", onPointerMove);
      scope.domElement.ownerDocument.removeEventListener("pointerup", onPointerUp);
      if (scope._domElementKeyEvents !== null) {
        scope._domElementKeyEvents.removeEventListener("keydown", onKeyDown);
      }
    };
    const scope = this;
    const STATE = {
      NONE: -1,
      ROTATE: 0,
      DOLLY: 1,
      PAN: 2,
      TOUCH_ROTATE: 3,
      TOUCH_PAN: 4,
      TOUCH_DOLLY_PAN: 5,
      TOUCH_DOLLY_ROTATE: 6
    };
    let state = STATE.NONE;
    const EPS = 1e-6;
    const spherical = new Spherical();
    const sphericalDelta = new Spherical();
    let scale = 1;
    const panOffset = new Vector3();
    let zoomChanged = false;
    const rotateStart = new Vector2();
    const rotateEnd = new Vector2();
    const rotateDelta = new Vector2();
    const panStart = new Vector2();
    const panEnd = new Vector2();
    const panDelta = new Vector2();
    const dollyStart = new Vector2();
    const dollyEnd = new Vector2();
    const dollyDelta = new Vector2();
    function getAutoRotationAngle() {
      return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;
    }
    function getZoomScale() {
      return Math.pow(0.95, scope.zoomSpeed);
    }
    function rotateLeft(angle) {
      sphericalDelta.theta -= angle;
    }
    function rotateUp(angle) {
      sphericalDelta.phi -= angle;
    }
    const panLeft = function() {
      const v = new Vector3();
      return function panLeft2(distance, objectMatrix) {
        v.setFromMatrixColumn(objectMatrix, 0);
        v.multiplyScalar(-distance);
        panOffset.add(v);
      };
    }();
    const panUp = function() {
      const v = new Vector3();
      return function panUp2(distance, objectMatrix) {
        if (scope.screenSpacePanning === true) {
          v.setFromMatrixColumn(objectMatrix, 1);
        } else {
          v.setFromMatrixColumn(objectMatrix, 0);
          v.crossVectors(scope.object.up, v);
        }
        v.multiplyScalar(distance);
        panOffset.add(v);
      };
    }();
    const pan = function() {
      const offset = new Vector3();
      return function pan2(deltaX, deltaY) {
        const element2 = scope.domElement;
        if (scope.object.isPerspectiveCamera) {
          const position2 = scope.object.position;
          offset.copy(position2).sub(scope.target);
          let targetDistance = offset.length();
          targetDistance *= Math.tan(scope.object.fov / 2 * Math.PI / 180);
          panLeft(2 * deltaX * targetDistance / element2.clientHeight, scope.object.matrix);
          panUp(2 * deltaY * targetDistance / element2.clientHeight, scope.object.matrix);
        } else if (scope.object.isOrthographicCamera) {
          panLeft(deltaX * (scope.object.right - scope.object.left) / scope.object.zoom / element2.clientWidth, scope.object.matrix);
          panUp(deltaY * (scope.object.top - scope.object.bottom) / scope.object.zoom / element2.clientHeight, scope.object.matrix);
        } else {
          console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.");
          scope.enablePan = false;
        }
      };
    }();
    function dollyOut(dollyScale) {
      if (scope.object.isPerspectiveCamera) {
        scale /= dollyScale;
      } else if (scope.object.isOrthographicCamera) {
        scope.object.zoom = Math.max(scope.minZoom, Math.min(scope.maxZoom, scope.object.zoom * dollyScale));
        scope.object.updateProjectionMatrix();
        zoomChanged = true;
      } else {
        console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.");
        scope.enableZoom = false;
      }
    }
    function dollyIn(dollyScale) {
      if (scope.object.isPerspectiveCamera) {
        scale *= dollyScale;
      } else if (scope.object.isOrthographicCamera) {
        scope.object.zoom = Math.max(scope.minZoom, Math.min(scope.maxZoom, scope.object.zoom / dollyScale));
        scope.object.updateProjectionMatrix();
        zoomChanged = true;
      } else {
        console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.");
        scope.enableZoom = false;
      }
    }
    function handleMouseDownRotate(event) {
      rotateStart.set(event.clientX, event.clientY);
    }
    function handleMouseDownDolly(event) {
      dollyStart.set(event.clientX, event.clientY);
    }
    function handleMouseDownPan(event) {
      panStart.set(event.clientX, event.clientY);
    }
    function handleMouseMoveRotate(event) {
      rotateEnd.set(event.clientX, event.clientY);
      rotateDelta.subVectors(rotateEnd, rotateStart).multiplyScalar(scope.rotateSpeed);
      const element2 = scope.domElement;
      rotateLeft(2 * Math.PI * rotateDelta.x / element2.clientHeight);
      rotateUp(2 * Math.PI * rotateDelta.y / element2.clientHeight);
      rotateStart.copy(rotateEnd);
      scope.update();
    }
    function handleMouseMoveDolly(event) {
      dollyEnd.set(event.clientX, event.clientY);
      dollyDelta.subVectors(dollyEnd, dollyStart);
      if (dollyDelta.y > 0) {
        dollyOut(getZoomScale());
      } else if (dollyDelta.y < 0) {
        dollyIn(getZoomScale());
      }
      dollyStart.copy(dollyEnd);
      scope.update();
    }
    function handleMouseMovePan(event) {
      panEnd.set(event.clientX, event.clientY);
      panDelta.subVectors(panEnd, panStart).multiplyScalar(scope.panSpeed);
      pan(panDelta.x, panDelta.y);
      panStart.copy(panEnd);
      scope.update();
    }
    function handleMouseWheel(event) {
      if (event.deltaY < 0) {
        dollyIn(getZoomScale());
      } else if (event.deltaY > 0) {
        dollyOut(getZoomScale());
      }
      scope.update();
    }
    function handleKeyDown(event) {
      let needsUpdate = false;
      switch (event.code) {
        case scope.keys.UP:
          pan(0, scope.keyPanSpeed);
          needsUpdate = true;
          break;
        case scope.keys.BOTTOM:
          pan(0, -scope.keyPanSpeed);
          needsUpdate = true;
          break;
        case scope.keys.LEFT:
          pan(scope.keyPanSpeed, 0);
          needsUpdate = true;
          break;
        case scope.keys.RIGHT:
          pan(-scope.keyPanSpeed, 0);
          needsUpdate = true;
          break;
      }
      if (needsUpdate) {
        event.preventDefault();
        scope.update();
      }
    }
    function handleTouchStartRotate(event) {
      if (event.touches.length == 1) {
        rotateStart.set(event.touches[0].pageX, event.touches[0].pageY);
      } else {
        const x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
        const y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);
        rotateStart.set(x, y);
      }
    }
    function handleTouchStartPan(event) {
      if (event.touches.length == 1) {
        panStart.set(event.touches[0].pageX, event.touches[0].pageY);
      } else {
        const x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
        const y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);
        panStart.set(x, y);
      }
    }
    function handleTouchStartDolly(event) {
      const dx = event.touches[0].pageX - event.touches[1].pageX;
      const dy = event.touches[0].pageY - event.touches[1].pageY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      dollyStart.set(0, distance);
    }
    function handleTouchStartDollyPan(event) {
      if (scope.enableZoom)
        handleTouchStartDolly(event);
      if (scope.enablePan)
        handleTouchStartPan(event);
    }
    function handleTouchStartDollyRotate(event) {
      if (scope.enableZoom)
        handleTouchStartDolly(event);
      if (scope.enableRotate)
        handleTouchStartRotate(event);
    }
    function handleTouchMoveRotate(event) {
      if (event.touches.length == 1) {
        rotateEnd.set(event.touches[0].pageX, event.touches[0].pageY);
      } else {
        const x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
        const y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);
        rotateEnd.set(x, y);
      }
      rotateDelta.subVectors(rotateEnd, rotateStart).multiplyScalar(scope.rotateSpeed);
      const element2 = scope.domElement;
      rotateLeft(2 * Math.PI * rotateDelta.x / element2.clientHeight);
      rotateUp(2 * Math.PI * rotateDelta.y / element2.clientHeight);
      rotateStart.copy(rotateEnd);
    }
    function handleTouchMovePan(event) {
      if (event.touches.length == 1) {
        panEnd.set(event.touches[0].pageX, event.touches[0].pageY);
      } else {
        const x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
        const y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);
        panEnd.set(x, y);
      }
      panDelta.subVectors(panEnd, panStart).multiplyScalar(scope.panSpeed);
      pan(panDelta.x, panDelta.y);
      panStart.copy(panEnd);
    }
    function handleTouchMoveDolly(event) {
      const dx = event.touches[0].pageX - event.touches[1].pageX;
      const dy = event.touches[0].pageY - event.touches[1].pageY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      dollyEnd.set(0, distance);
      dollyDelta.set(0, Math.pow(dollyEnd.y / dollyStart.y, scope.zoomSpeed));
      dollyOut(dollyDelta.y);
      dollyStart.copy(dollyEnd);
    }
    function handleTouchMoveDollyPan(event) {
      if (scope.enableZoom)
        handleTouchMoveDolly(event);
      if (scope.enablePan)
        handleTouchMovePan(event);
    }
    function handleTouchMoveDollyRotate(event) {
      if (scope.enableZoom)
        handleTouchMoveDolly(event);
      if (scope.enableRotate)
        handleTouchMoveRotate(event);
    }
    function onPointerDown(event) {
      if (scope.enabled === false)
        return;
      switch (event.pointerType) {
        case "mouse":
        case "pen":
          onMouseDown(event);
          break;
      }
    }
    function onPointerMove(event) {
      if (scope.enabled === false)
        return;
      switch (event.pointerType) {
        case "mouse":
        case "pen":
          onMouseMove(event);
          break;
      }
    }
    function onPointerUp(event) {
      switch (event.pointerType) {
        case "mouse":
        case "pen":
          onMouseUp();
          break;
      }
    }
    function onMouseDown(event) {
      event.preventDefault();
      scope.domElement.focus ? scope.domElement.focus() : window.focus();
      let mouseAction;
      switch (event.button) {
        case 0:
          mouseAction = scope.mouseButtons.LEFT;
          break;
        case 1:
          mouseAction = scope.mouseButtons.MIDDLE;
          break;
        case 2:
          mouseAction = scope.mouseButtons.RIGHT;
          break;
        default:
          mouseAction = -1;
      }
      switch (mouseAction) {
        case MOUSE.DOLLY:
          if (scope.enableZoom === false)
            return;
          handleMouseDownDolly(event);
          state = STATE.DOLLY;
          break;
        case MOUSE.ROTATE:
          if (event.ctrlKey || event.metaKey || event.shiftKey) {
            if (scope.enablePan === false)
              return;
            handleMouseDownPan(event);
            state = STATE.PAN;
          } else {
            if (scope.enableRotate === false)
              return;
            handleMouseDownRotate(event);
            state = STATE.ROTATE;
          }
          break;
        case MOUSE.PAN:
          if (event.ctrlKey || event.metaKey || event.shiftKey) {
            if (scope.enableRotate === false)
              return;
            handleMouseDownRotate(event);
            state = STATE.ROTATE;
          } else {
            if (scope.enablePan === false)
              return;
            handleMouseDownPan(event);
            state = STATE.PAN;
          }
          break;
        default:
          state = STATE.NONE;
      }
      if (state !== STATE.NONE) {
        scope.domElement.ownerDocument.addEventListener("pointermove", onPointerMove);
        scope.domElement.ownerDocument.addEventListener("pointerup", onPointerUp);
        scope.dispatchEvent(_startEvent);
      }
    }
    function onMouseMove(event) {
      if (scope.enabled === false)
        return;
      event.preventDefault();
      switch (state) {
        case STATE.ROTATE:
          if (scope.enableRotate === false)
            return;
          handleMouseMoveRotate(event);
          break;
        case STATE.DOLLY:
          if (scope.enableZoom === false)
            return;
          handleMouseMoveDolly(event);
          break;
        case STATE.PAN:
          if (scope.enablePan === false)
            return;
          handleMouseMovePan(event);
          break;
      }
    }
    function onMouseUp(event) {
      scope.domElement.ownerDocument.removeEventListener("pointermove", onPointerMove);
      scope.domElement.ownerDocument.removeEventListener("pointerup", onPointerUp);
      if (scope.enabled === false)
        return;
      scope.dispatchEvent(_endEvent);
      state = STATE.NONE;
    }
    function onMouseWheel(event) {
      if (scope.enabled === false || scope.enableZoom === false || state !== STATE.NONE && state !== STATE.ROTATE)
        return;
      event.preventDefault();
      scope.dispatchEvent(_startEvent);
      handleMouseWheel(event);
      scope.dispatchEvent(_endEvent);
    }
    function onKeyDown(event) {
      if (scope.enabled === false || scope.enablePan === false)
        return;
      handleKeyDown(event);
    }
    function onTouchStart(event) {
      if (scope.enabled === false)
        return;
      event.preventDefault();
      switch (event.touches.length) {
        case 1:
          switch (scope.touches.ONE) {
            case TOUCH.ROTATE:
              if (scope.enableRotate === false)
                return;
              handleTouchStartRotate(event);
              state = STATE.TOUCH_ROTATE;
              break;
            case TOUCH.PAN:
              if (scope.enablePan === false)
                return;
              handleTouchStartPan(event);
              state = STATE.TOUCH_PAN;
              break;
            default:
              state = STATE.NONE;
          }
          break;
        case 2:
          switch (scope.touches.TWO) {
            case TOUCH.DOLLY_PAN:
              if (scope.enableZoom === false && scope.enablePan === false)
                return;
              handleTouchStartDollyPan(event);
              state = STATE.TOUCH_DOLLY_PAN;
              break;
            case TOUCH.DOLLY_ROTATE:
              if (scope.enableZoom === false && scope.enableRotate === false)
                return;
              handleTouchStartDollyRotate(event);
              state = STATE.TOUCH_DOLLY_ROTATE;
              break;
            default:
              state = STATE.NONE;
          }
          break;
        default:
          state = STATE.NONE;
      }
      if (state !== STATE.NONE) {
        scope.dispatchEvent(_startEvent);
      }
    }
    function onTouchMove(event) {
      if (scope.enabled === false)
        return;
      event.preventDefault();
      switch (state) {
        case STATE.TOUCH_ROTATE:
          if (scope.enableRotate === false)
            return;
          handleTouchMoveRotate(event);
          scope.update();
          break;
        case STATE.TOUCH_PAN:
          if (scope.enablePan === false)
            return;
          handleTouchMovePan(event);
          scope.update();
          break;
        case STATE.TOUCH_DOLLY_PAN:
          if (scope.enableZoom === false && scope.enablePan === false)
            return;
          handleTouchMoveDollyPan(event);
          scope.update();
          break;
        case STATE.TOUCH_DOLLY_ROTATE:
          if (scope.enableZoom === false && scope.enableRotate === false)
            return;
          handleTouchMoveDollyRotate(event);
          scope.update();
          break;
        default:
          state = STATE.NONE;
      }
    }
    function onTouchEnd(event) {
      if (scope.enabled === false)
        return;
      scope.dispatchEvent(_endEvent);
      state = STATE.NONE;
    }
    function onContextMenu(event) {
      if (scope.enabled === false)
        return;
      event.preventDefault();
    }
    scope.domElement.addEventListener("contextmenu", onContextMenu);
    scope.domElement.addEventListener("pointerdown", onPointerDown);
    scope.domElement.addEventListener("wheel", onMouseWheel, { passive: false });
    scope.domElement.addEventListener("touchstart", onTouchStart, { passive: false });
    scope.domElement.addEventListener("touchend", onTouchEnd);
    scope.domElement.addEventListener("touchmove", onTouchMove, { passive: false });
    this.update();
  }
}
const _lookDirection = new Vector3();
const _spherical = new Spherical();
const _target = new Vector3();
class FirstPersonControls {
  constructor(object, domElement) {
    if (domElement === void 0) {
      console.warn('THREE.FirstPersonControls: The second parameter "domElement" is now mandatory.');
      domElement = document;
    }
    this.object = object;
    this.domElement = domElement;
    this.enabled = true;
    this.movementSpeed = 1;
    this.lookSpeed = 5e-3;
    this.lookVertical = true;
    this.autoForward = false;
    this.activeLook = true;
    this.heightSpeed = false;
    this.heightCoef = 1;
    this.heightMin = 0;
    this.heightMax = 1;
    this.constrainVertical = false;
    this.verticalMin = 0;
    this.verticalMax = Math.PI;
    this.mouseDragOn = false;
    this.autoSpeedFactor = 0;
    this.mouseX = 0;
    this.mouseY = 0;
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.viewHalfX = 0;
    this.viewHalfY = 0;
    let lat = 0;
    let lon = 0;
    this.handleResize = function() {
      if (this.domElement === document) {
        this.viewHalfX = window.innerWidth / 2;
        this.viewHalfY = window.innerHeight / 2;
      } else {
        this.viewHalfX = this.domElement.offsetWidth / 2;
        this.viewHalfY = this.domElement.offsetHeight / 2;
      }
    };
    this.onMouseDown = function(event) {
      if (this.domElement !== document) {
        this.domElement.focus();
      }
      event.preventDefault();
      if (this.activeLook) {
        switch (event.button) {
          case 0:
            this.moveForward = true;
            break;
          case 2:
            this.moveBackward = true;
            break;
        }
      }
      this.mouseDragOn = true;
    };
    this.onMouseUp = function(event) {
      event.preventDefault();
      if (this.activeLook) {
        switch (event.button) {
          case 0:
            this.moveForward = false;
            break;
          case 2:
            this.moveBackward = false;
            break;
        }
      }
      this.mouseDragOn = false;
    };
    this.onMouseMove = function(event) {
      if (this.domElement === document) {
        this.mouseX = event.pageX - this.viewHalfX;
        this.mouseY = event.pageY - this.viewHalfY;
      } else {
        this.mouseX = event.pageX - this.domElement.offsetLeft - this.viewHalfX;
        this.mouseY = event.pageY - this.domElement.offsetTop - this.viewHalfY;
      }
    };
    this.onKeyDown = function(event) {
      switch (event.code) {
        case "ArrowUp":
        case "KeyW":
          this.moveForward = true;
          break;
        case "ArrowLeft":
        case "KeyA":
          this.moveLeft = true;
          break;
        case "ArrowDown":
        case "KeyS":
          this.moveBackward = true;
          break;
        case "ArrowRight":
        case "KeyD":
          this.moveRight = true;
          break;
        case "KeyR":
          this.moveUp = true;
          break;
        case "KeyF":
          this.moveDown = true;
          break;
      }
    };
    this.onKeyUp = function(event) {
      switch (event.code) {
        case "ArrowUp":
        case "KeyW":
          this.moveForward = false;
          break;
        case "ArrowLeft":
        case "KeyA":
          this.moveLeft = false;
          break;
        case "ArrowDown":
        case "KeyS":
          this.moveBackward = false;
          break;
        case "ArrowRight":
        case "KeyD":
          this.moveRight = false;
          break;
        case "KeyR":
          this.moveUp = false;
          break;
        case "KeyF":
          this.moveDown = false;
          break;
      }
    };
    this.lookAt = function(x, y, z) {
      if (x.isVector3) {
        _target.copy(x);
      } else {
        _target.set(x, y, z);
      }
      this.object.lookAt(_target);
      setOrientation(this);
      return this;
    };
    this.update = function() {
      const targetPosition = new Vector3();
      return function update(delta) {
        if (this.enabled === false)
          return;
        if (this.heightSpeed) {
          const y = MathUtils.clamp(this.object.position.y, this.heightMin, this.heightMax);
          const heightDelta = y - this.heightMin;
          this.autoSpeedFactor = delta * (heightDelta * this.heightCoef);
        } else {
          this.autoSpeedFactor = 0;
        }
        const actualMoveSpeed = delta * this.movementSpeed;
        if (this.moveForward || this.autoForward && !this.moveBackward)
          this.object.translateZ(-(actualMoveSpeed + this.autoSpeedFactor));
        if (this.moveBackward)
          this.object.translateZ(actualMoveSpeed);
        if (this.moveLeft)
          this.object.translateX(-actualMoveSpeed);
        if (this.moveRight)
          this.object.translateX(actualMoveSpeed);
        if (this.moveUp)
          this.object.translateY(actualMoveSpeed);
        if (this.moveDown)
          this.object.translateY(-actualMoveSpeed);
        let actualLookSpeed = delta * this.lookSpeed;
        if (!this.activeLook) {
          actualLookSpeed = 0;
        }
        let verticalLookRatio = 1;
        if (this.constrainVertical) {
          verticalLookRatio = Math.PI / (this.verticalMax - this.verticalMin);
        }
        lon -= this.mouseX * actualLookSpeed;
        if (this.lookVertical)
          lat -= this.mouseY * actualLookSpeed * verticalLookRatio;
        lat = Math.max(-85, Math.min(85, lat));
        let phi = MathUtils.degToRad(90 - lat);
        const theta = MathUtils.degToRad(lon);
        if (this.constrainVertical) {
          phi = MathUtils.mapLinear(phi, 0, Math.PI, this.verticalMin, this.verticalMax);
        }
        const position2 = this.object.position;
        targetPosition.setFromSphericalCoords(1, phi, theta).add(position2);
        this.object.lookAt(targetPosition);
      };
    }();
    this.dispose = function() {
      this.domElement.removeEventListener("contextmenu", contextmenu);
      this.domElement.removeEventListener("mousedown", _onMouseDown);
      this.domElement.removeEventListener("mousemove", _onMouseMove);
      this.domElement.removeEventListener("mouseup", _onMouseUp);
      window.removeEventListener("keydown", _onKeyDown);
      window.removeEventListener("keyup", _onKeyUp);
    };
    const _onMouseMove = this.onMouseMove.bind(this);
    const _onMouseDown = this.onMouseDown.bind(this);
    const _onMouseUp = this.onMouseUp.bind(this);
    const _onKeyDown = this.onKeyDown.bind(this);
    const _onKeyUp = this.onKeyUp.bind(this);
    this.domElement.addEventListener("contextmenu", contextmenu);
    this.domElement.addEventListener("mousemove", _onMouseMove);
    this.domElement.addEventListener("mousedown", _onMouseDown);
    this.domElement.addEventListener("mouseup", _onMouseUp);
    window.addEventListener("keydown", _onKeyDown);
    window.addEventListener("keyup", _onKeyUp);
    function setOrientation(controls2) {
      const quaternion = controls2.object.quaternion;
      _lookDirection.set(0, 0, -1).applyQuaternion(quaternion);
      _spherical.setFromVector3(_lookDirection);
      lat = 90 - MathUtils.radToDeg(_spherical.phi);
      lon = MathUtils.radToDeg(_spherical.theta);
    }
    this.handleResize();
    setOrientation(this);
  }
}
function contextmenu(event) {
  event.preventDefault();
}
var CopyShader = {
  uniforms: {
    "tDiffuse": { value: null },
    "opacity": { value: 1 }
  },
  vertexShader: `

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,
  fragmentShader: `

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;

		}`
};
class Pass {
  constructor() {
    this.enabled = true;
    this.needsSwap = true;
    this.clear = false;
    this.renderToScreen = false;
  }
  setSize() {
  }
  render() {
    console.error("THREE.Pass: .render() must be implemented in derived pass.");
  }
}
const _camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
const _geometry$1 = new BufferGeometry();
_geometry$1.setAttribute("position", new Float32BufferAttribute([-1, 3, 0, -1, -1, 0, 3, -1, 0], 3));
_geometry$1.setAttribute("uv", new Float32BufferAttribute([0, 2, 0, 0, 2, 0], 2));
class FullScreenQuad {
  constructor(material) {
    this._mesh = new Mesh(_geometry$1, material);
  }
  dispose() {
    this._mesh.geometry.dispose();
  }
  render(renderer2) {
    renderer2.render(this._mesh, _camera);
  }
  get material() {
    return this._mesh.material;
  }
  set material(value) {
    this._mesh.material = value;
  }
}
class ShaderPass extends Pass {
  constructor(shader, textureID) {
    super();
    this.textureID = textureID !== void 0 ? textureID : "tDiffuse";
    if (shader instanceof ShaderMaterial) {
      this.uniforms = shader.uniforms;
      this.material = shader;
    } else if (shader) {
      this.uniforms = UniformsUtils.clone(shader.uniforms);
      this.material = new ShaderMaterial({
        defines: Object.assign({}, shader.defines),
        uniforms: this.uniforms,
        vertexShader: shader.vertexShader,
        fragmentShader: shader.fragmentShader
      });
    }
    this.fsQuad = new FullScreenQuad(this.material);
  }
  render(renderer2, writeBuffer, readBuffer) {
    if (this.uniforms[this.textureID]) {
      this.uniforms[this.textureID].value = readBuffer.texture;
    }
    this.fsQuad.material = this.material;
    if (this.renderToScreen) {
      renderer2.setRenderTarget(null);
      this.fsQuad.render(renderer2);
    } else {
      renderer2.setRenderTarget(writeBuffer);
      if (this.clear)
        renderer2.clear(renderer2.autoClearColor, renderer2.autoClearDepth, renderer2.autoClearStencil);
      this.fsQuad.render(renderer2);
    }
  }
}
class MaskPass extends Pass {
  constructor(scene, camera2) {
    super();
    this.scene = scene;
    this.camera = camera2;
    this.clear = true;
    this.needsSwap = false;
    this.inverse = false;
  }
  render(renderer2, writeBuffer, readBuffer) {
    const context = renderer2.getContext();
    const state = renderer2.state;
    state.buffers.color.setMask(false);
    state.buffers.depth.setMask(false);
    state.buffers.color.setLocked(true);
    state.buffers.depth.setLocked(true);
    let writeValue, clearValue;
    if (this.inverse) {
      writeValue = 0;
      clearValue = 1;
    } else {
      writeValue = 1;
      clearValue = 0;
    }
    state.buffers.stencil.setTest(true);
    state.buffers.stencil.setOp(context.REPLACE, context.REPLACE, context.REPLACE);
    state.buffers.stencil.setFunc(context.ALWAYS, writeValue, 4294967295);
    state.buffers.stencil.setClear(clearValue);
    state.buffers.stencil.setLocked(true);
    renderer2.setRenderTarget(readBuffer);
    if (this.clear)
      renderer2.clear();
    renderer2.render(this.scene, this.camera);
    renderer2.setRenderTarget(writeBuffer);
    if (this.clear)
      renderer2.clear();
    renderer2.render(this.scene, this.camera);
    state.buffers.color.setLocked(false);
    state.buffers.depth.setLocked(false);
    state.buffers.stencil.setLocked(false);
    state.buffers.stencil.setFunc(context.EQUAL, 1, 4294967295);
    state.buffers.stencil.setOp(context.KEEP, context.KEEP, context.KEEP);
    state.buffers.stencil.setLocked(true);
  }
}
class ClearMaskPass extends Pass {
  constructor() {
    super();
    this.needsSwap = false;
  }
  render(renderer2) {
    renderer2.state.buffers.stencil.setLocked(false);
    renderer2.state.buffers.stencil.setTest(false);
  }
}
class EffectComposer {
  constructor(renderer2, renderTarget) {
    this.renderer = renderer2;
    if (renderTarget === void 0) {
      const parameters = {
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        format: RGBAFormat
      };
      const size = renderer2.getSize(new Vector2());
      this._pixelRatio = renderer2.getPixelRatio();
      this._width = size.width;
      this._height = size.height;
      renderTarget = new WebGLRenderTarget(this._width * this._pixelRatio, this._height * this._pixelRatio, parameters);
      renderTarget.texture.name = "EffectComposer.rt1";
    } else {
      this._pixelRatio = 1;
      this._width = renderTarget.width;
      this._height = renderTarget.height;
    }
    this.renderTarget1 = renderTarget;
    this.renderTarget2 = renderTarget.clone();
    this.renderTarget2.texture.name = "EffectComposer.rt2";
    this.writeBuffer = this.renderTarget1;
    this.readBuffer = this.renderTarget2;
    this.renderToScreen = true;
    this.passes = [];
    if (CopyShader === void 0) {
      console.error("THREE.EffectComposer relies on CopyShader");
    }
    if (ShaderPass === void 0) {
      console.error("THREE.EffectComposer relies on ShaderPass");
    }
    this.copyPass = new ShaderPass(CopyShader);
    this.clock = new Clock();
  }
  swapBuffers() {
    const tmp = this.readBuffer;
    this.readBuffer = this.writeBuffer;
    this.writeBuffer = tmp;
  }
  addPass(pass) {
    this.passes.push(pass);
    pass.setSize(this._width * this._pixelRatio, this._height * this._pixelRatio);
  }
  insertPass(pass, index) {
    this.passes.splice(index, 0, pass);
    pass.setSize(this._width * this._pixelRatio, this._height * this._pixelRatio);
  }
  removePass(pass) {
    const index = this.passes.indexOf(pass);
    if (index !== -1) {
      this.passes.splice(index, 1);
    }
  }
  isLastEnabledPass(passIndex) {
    for (let i = passIndex + 1; i < this.passes.length; i++) {
      if (this.passes[i].enabled) {
        return false;
      }
    }
    return true;
  }
  render(deltaTime) {
    if (deltaTime === void 0) {
      deltaTime = this.clock.getDelta();
    }
    const currentRenderTarget = this.renderer.getRenderTarget();
    let maskActive = false;
    for (let i = 0, il = this.passes.length; i < il; i++) {
      const pass = this.passes[i];
      if (pass.enabled === false)
        continue;
      pass.renderToScreen = this.renderToScreen && this.isLastEnabledPass(i);
      pass.render(this.renderer, this.writeBuffer, this.readBuffer, deltaTime, maskActive);
      if (pass.needsSwap) {
        if (maskActive) {
          const context = this.renderer.getContext();
          const stencil = this.renderer.state.buffers.stencil;
          stencil.setFunc(context.NOTEQUAL, 1, 4294967295);
          this.copyPass.render(this.renderer, this.writeBuffer, this.readBuffer, deltaTime);
          stencil.setFunc(context.EQUAL, 1, 4294967295);
        }
        this.swapBuffers();
      }
      if (MaskPass !== void 0) {
        if (pass instanceof MaskPass) {
          maskActive = true;
        } else if (pass instanceof ClearMaskPass) {
          maskActive = false;
        }
      }
    }
    this.renderer.setRenderTarget(currentRenderTarget);
  }
  reset(renderTarget) {
    if (renderTarget === void 0) {
      const size = this.renderer.getSize(new Vector2());
      this._pixelRatio = this.renderer.getPixelRatio();
      this._width = size.width;
      this._height = size.height;
      renderTarget = this.renderTarget1.clone();
      renderTarget.setSize(this._width * this._pixelRatio, this._height * this._pixelRatio);
    }
    this.renderTarget1.dispose();
    this.renderTarget2.dispose();
    this.renderTarget1 = renderTarget;
    this.renderTarget2 = renderTarget.clone();
    this.writeBuffer = this.renderTarget1;
    this.readBuffer = this.renderTarget2;
  }
  setSize(width, height) {
    this._width = width;
    this._height = height;
    const effectiveWidth = this._width * this._pixelRatio;
    const effectiveHeight = this._height * this._pixelRatio;
    this.renderTarget1.setSize(effectiveWidth, effectiveHeight);
    this.renderTarget2.setSize(effectiveWidth, effectiveHeight);
    for (let i = 0; i < this.passes.length; i++) {
      this.passes[i].setSize(effectiveWidth, effectiveHeight);
    }
  }
  setPixelRatio(pixelRatio) {
    this._pixelRatio = pixelRatio;
    this.setSize(this._width, this._height);
  }
}
new OrthographicCamera(-1, 1, 1, -1, 0, 1);
const _geometry = new BufferGeometry();
_geometry.setAttribute("position", new Float32BufferAttribute([-1, 3, 0, -1, -1, 0, 3, -1, 0], 3));
_geometry.setAttribute("uv", new Float32BufferAttribute([0, 2, 0, 0, 2, 0], 2));
class RenderPass extends Pass {
  constructor(scene, camera2, overrideMaterial, clearColor, clearAlpha) {
    super();
    this.scene = scene;
    this.camera = camera2;
    this.overrideMaterial = overrideMaterial;
    this.clearColor = clearColor;
    this.clearAlpha = clearAlpha !== void 0 ? clearAlpha : 0;
    this.clear = true;
    this.clearDepth = false;
    this.needsSwap = false;
    this._oldClearColor = new Color();
  }
  render(renderer2, writeBuffer, readBuffer) {
    const oldAutoClear = renderer2.autoClear;
    renderer2.autoClear = false;
    let oldClearAlpha, oldOverrideMaterial;
    if (this.overrideMaterial !== void 0) {
      oldOverrideMaterial = this.scene.overrideMaterial;
      this.scene.overrideMaterial = this.overrideMaterial;
    }
    if (this.clearColor) {
      renderer2.getClearColor(this._oldClearColor);
      oldClearAlpha = renderer2.getClearAlpha();
      renderer2.setClearColor(this.clearColor, this.clearAlpha);
    }
    if (this.clearDepth) {
      renderer2.clearDepth();
    }
    renderer2.setRenderTarget(this.renderToScreen ? null : readBuffer);
    if (this.clear)
      renderer2.clear(renderer2.autoClearColor, renderer2.autoClearDepth, renderer2.autoClearStencil);
    renderer2.render(this.scene, this.camera);
    if (this.clearColor) {
      renderer2.setClearColor(this._oldClearColor, oldClearAlpha);
    }
    if (this.overrideMaterial !== void 0) {
      this.scene.overrideMaterial = oldOverrideMaterial;
    }
    renderer2.autoClear = oldAutoClear;
  }
}
const SMAAEdgesShader = {
  defines: {
    "SMAA_THRESHOLD": "0.1"
  },
  uniforms: {
    "tDiffuse": { value: null },
    "resolution": { value: new Vector2(1 / 1024, 1 / 512) }
  },
  vertexShader: `

		uniform vec2 resolution;

		varying vec2 vUv;
		varying vec4 vOffset[ 3 ];

		void SMAAEdgeDetectionVS( vec2 texcoord ) {
			vOffset[ 0 ] = texcoord.xyxy + resolution.xyxy * vec4( -1.0, 0.0, 0.0,  1.0 ); // WebGL port note: Changed sign in W component
			vOffset[ 1 ] = texcoord.xyxy + resolution.xyxy * vec4(  1.0, 0.0, 0.0, -1.0 ); // WebGL port note: Changed sign in W component
			vOffset[ 2 ] = texcoord.xyxy + resolution.xyxy * vec4( -2.0, 0.0, 0.0,  2.0 ); // WebGL port note: Changed sign in W component
		}

		void main() {

			vUv = uv;

			SMAAEdgeDetectionVS( vUv );

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,
  fragmentShader: `

		uniform sampler2D tDiffuse;

		varying vec2 vUv;
		varying vec4 vOffset[ 3 ];

		vec4 SMAAColorEdgeDetectionPS( vec2 texcoord, vec4 offset[3], sampler2D colorTex ) {
			vec2 threshold = vec2( SMAA_THRESHOLD, SMAA_THRESHOLD );

			// Calculate color deltas:
			vec4 delta;
			vec3 C = texture2D( colorTex, texcoord ).rgb;

			vec3 Cleft = texture2D( colorTex, offset[0].xy ).rgb;
			vec3 t = abs( C - Cleft );
			delta.x = max( max( t.r, t.g ), t.b );

			vec3 Ctop = texture2D( colorTex, offset[0].zw ).rgb;
			t = abs( C - Ctop );
			delta.y = max( max( t.r, t.g ), t.b );

			// We do the usual threshold:
			vec2 edges = step( threshold, delta.xy );

			// Then discard if there is no edge:
			if ( dot( edges, vec2( 1.0, 1.0 ) ) == 0.0 )
				discard;

			// Calculate right and bottom deltas:
			vec3 Cright = texture2D( colorTex, offset[1].xy ).rgb;
			t = abs( C - Cright );
			delta.z = max( max( t.r, t.g ), t.b );

			vec3 Cbottom  = texture2D( colorTex, offset[1].zw ).rgb;
			t = abs( C - Cbottom );
			delta.w = max( max( t.r, t.g ), t.b );

			// Calculate the maximum delta in the direct neighborhood:
			float maxDelta = max( max( max( delta.x, delta.y ), delta.z ), delta.w );

			// Calculate left-left and top-top deltas:
			vec3 Cleftleft  = texture2D( colorTex, offset[2].xy ).rgb;
			t = abs( C - Cleftleft );
			delta.z = max( max( t.r, t.g ), t.b );

			vec3 Ctoptop = texture2D( colorTex, offset[2].zw ).rgb;
			t = abs( C - Ctoptop );
			delta.w = max( max( t.r, t.g ), t.b );

			// Calculate the final maximum delta:
			maxDelta = max( max( maxDelta, delta.z ), delta.w );

			// Local contrast adaptation in action:
			edges.xy *= step( 0.5 * maxDelta, delta.xy );

			return vec4( edges, 0.0, 0.0 );
		}

		void main() {

			gl_FragColor = SMAAColorEdgeDetectionPS( vUv, vOffset, tDiffuse );

		}`
};
const SMAAWeightsShader = {
  defines: {
    "SMAA_MAX_SEARCH_STEPS": "8",
    "SMAA_AREATEX_MAX_DISTANCE": "16",
    "SMAA_AREATEX_PIXEL_SIZE": "( 1.0 / vec2( 160.0, 560.0 ) )",
    "SMAA_AREATEX_SUBTEX_SIZE": "( 1.0 / 7.0 )"
  },
  uniforms: {
    "tDiffuse": { value: null },
    "tArea": { value: null },
    "tSearch": { value: null },
    "resolution": { value: new Vector2(1 / 1024, 1 / 512) }
  },
  vertexShader: `

		uniform vec2 resolution;

		varying vec2 vUv;
		varying vec4 vOffset[ 3 ];
		varying vec2 vPixcoord;

		void SMAABlendingWeightCalculationVS( vec2 texcoord ) {
			vPixcoord = texcoord / resolution;

			// We will use these offsets for the searches later on (see @PSEUDO_GATHER4):
			vOffset[ 0 ] = texcoord.xyxy + resolution.xyxy * vec4( -0.25, 0.125, 1.25, 0.125 ); // WebGL port note: Changed sign in Y and W components
			vOffset[ 1 ] = texcoord.xyxy + resolution.xyxy * vec4( -0.125, 0.25, -0.125, -1.25 ); // WebGL port note: Changed sign in Y and W components

			// And these for the searches, they indicate the ends of the loops:
			vOffset[ 2 ] = vec4( vOffset[ 0 ].xz, vOffset[ 1 ].yw ) + vec4( -2.0, 2.0, -2.0, 2.0 ) * resolution.xxyy * float( SMAA_MAX_SEARCH_STEPS );

		}

		void main() {

			vUv = uv;

			SMAABlendingWeightCalculationVS( vUv );

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,
  fragmentShader: `

		#define SMAASampleLevelZeroOffset( tex, coord, offset ) texture2D( tex, coord + float( offset ) * resolution, 0.0 )

		uniform sampler2D tDiffuse;
		uniform sampler2D tArea;
		uniform sampler2D tSearch;
		uniform vec2 resolution;

		varying vec2 vUv;
		varying vec4 vOffset[3];
		varying vec2 vPixcoord;

		#if __VERSION__ == 100
		vec2 round( vec2 x ) {
			return sign( x ) * floor( abs( x ) + 0.5 );
		}
		#endif

		float SMAASearchLength( sampler2D searchTex, vec2 e, float bias, float scale ) {
			// Not required if searchTex accesses are set to point:
			// float2 SEARCH_TEX_PIXEL_SIZE = 1.0 / float2(66.0, 33.0);
			// e = float2(bias, 0.0) + 0.5 * SEARCH_TEX_PIXEL_SIZE +
			//     e * float2(scale, 1.0) * float2(64.0, 32.0) * SEARCH_TEX_PIXEL_SIZE;
			e.r = bias + e.r * scale;
			return 255.0 * texture2D( searchTex, e, 0.0 ).r;
		}

		float SMAASearchXLeft( sampler2D edgesTex, sampler2D searchTex, vec2 texcoord, float end ) {
			/**
				* @PSEUDO_GATHER4
				* This texcoord has been offset by (-0.25, -0.125) in the vertex shader to
				* sample between edge, thus fetching four edges in a row.
				* Sampling with different offsets in each direction allows to disambiguate
				* which edges are active from the four fetched ones.
				*/
			vec2 e = vec2( 0.0, 1.0 );

			for ( int i = 0; i < SMAA_MAX_SEARCH_STEPS; i ++ ) { // WebGL port note: Changed while to for
				e = texture2D( edgesTex, texcoord, 0.0 ).rg;
				texcoord -= vec2( 2.0, 0.0 ) * resolution;
				if ( ! ( texcoord.x > end && e.g > 0.8281 && e.r == 0.0 ) ) break;
			}

			// We correct the previous (-0.25, -0.125) offset we applied:
			texcoord.x += 0.25 * resolution.x;

			// The searches are bias by 1, so adjust the coords accordingly:
			texcoord.x += resolution.x;

			// Disambiguate the length added by the last step:
			texcoord.x += 2.0 * resolution.x; // Undo last step
			texcoord.x -= resolution.x * SMAASearchLength(searchTex, e, 0.0, 0.5);

			return texcoord.x;
		}

		float SMAASearchXRight( sampler2D edgesTex, sampler2D searchTex, vec2 texcoord, float end ) {
			vec2 e = vec2( 0.0, 1.0 );

			for ( int i = 0; i < SMAA_MAX_SEARCH_STEPS; i ++ ) { // WebGL port note: Changed while to for
				e = texture2D( edgesTex, texcoord, 0.0 ).rg;
				texcoord += vec2( 2.0, 0.0 ) * resolution;
				if ( ! ( texcoord.x < end && e.g > 0.8281 && e.r == 0.0 ) ) break;
			}

			texcoord.x -= 0.25 * resolution.x;
			texcoord.x -= resolution.x;
			texcoord.x -= 2.0 * resolution.x;
			texcoord.x += resolution.x * SMAASearchLength( searchTex, e, 0.5, 0.5 );

			return texcoord.x;
		}

		float SMAASearchYUp( sampler2D edgesTex, sampler2D searchTex, vec2 texcoord, float end ) {
			vec2 e = vec2( 1.0, 0.0 );

			for ( int i = 0; i < SMAA_MAX_SEARCH_STEPS; i ++ ) { // WebGL port note: Changed while to for
				e = texture2D( edgesTex, texcoord, 0.0 ).rg;
				texcoord += vec2( 0.0, 2.0 ) * resolution; // WebGL port note: Changed sign
				if ( ! ( texcoord.y > end && e.r > 0.8281 && e.g == 0.0 ) ) break;
			}

			texcoord.y -= 0.25 * resolution.y; // WebGL port note: Changed sign
			texcoord.y -= resolution.y; // WebGL port note: Changed sign
			texcoord.y -= 2.0 * resolution.y; // WebGL port note: Changed sign
			texcoord.y += resolution.y * SMAASearchLength( searchTex, e.gr, 0.0, 0.5 ); // WebGL port note: Changed sign

			return texcoord.y;
		}

		float SMAASearchYDown( sampler2D edgesTex, sampler2D searchTex, vec2 texcoord, float end ) {
			vec2 e = vec2( 1.0, 0.0 );

			for ( int i = 0; i < SMAA_MAX_SEARCH_STEPS; i ++ ) { // WebGL port note: Changed while to for
				e = texture2D( edgesTex, texcoord, 0.0 ).rg;
				texcoord -= vec2( 0.0, 2.0 ) * resolution; // WebGL port note: Changed sign
				if ( ! ( texcoord.y < end && e.r > 0.8281 && e.g == 0.0 ) ) break;
			}

			texcoord.y += 0.25 * resolution.y; // WebGL port note: Changed sign
			texcoord.y += resolution.y; // WebGL port note: Changed sign
			texcoord.y += 2.0 * resolution.y; // WebGL port note: Changed sign
			texcoord.y -= resolution.y * SMAASearchLength( searchTex, e.gr, 0.5, 0.5 ); // WebGL port note: Changed sign

			return texcoord.y;
		}

		vec2 SMAAArea( sampler2D areaTex, vec2 dist, float e1, float e2, float offset ) {
			// Rounding prevents precision errors of bilinear filtering:
			vec2 texcoord = float( SMAA_AREATEX_MAX_DISTANCE ) * round( 4.0 * vec2( e1, e2 ) ) + dist;

			// We do a scale and bias for mapping to texel space:
			texcoord = SMAA_AREATEX_PIXEL_SIZE * texcoord + ( 0.5 * SMAA_AREATEX_PIXEL_SIZE );

			// Move to proper place, according to the subpixel offset:
			texcoord.y += SMAA_AREATEX_SUBTEX_SIZE * offset;

			return texture2D( areaTex, texcoord, 0.0 ).rg;
		}

		vec4 SMAABlendingWeightCalculationPS( vec2 texcoord, vec2 pixcoord, vec4 offset[ 3 ], sampler2D edgesTex, sampler2D areaTex, sampler2D searchTex, ivec4 subsampleIndices ) {
			vec4 weights = vec4( 0.0, 0.0, 0.0, 0.0 );

			vec2 e = texture2D( edgesTex, texcoord ).rg;

			if ( e.g > 0.0 ) { // Edge at north
				vec2 d;

				// Find the distance to the left:
				vec2 coords;
				coords.x = SMAASearchXLeft( edgesTex, searchTex, offset[ 0 ].xy, offset[ 2 ].x );
				coords.y = offset[ 1 ].y; // offset[1].y = texcoord.y - 0.25 * resolution.y (@CROSSING_OFFSET)
				d.x = coords.x;

				// Now fetch the left crossing edges, two at a time using bilinear
				// filtering. Sampling at -0.25 (see @CROSSING_OFFSET) enables to
				// discern what value each edge has:
				float e1 = texture2D( edgesTex, coords, 0.0 ).r;

				// Find the distance to the right:
				coords.x = SMAASearchXRight( edgesTex, searchTex, offset[ 0 ].zw, offset[ 2 ].y );
				d.y = coords.x;

				// We want the distances to be in pixel units (doing this here allow to
				// better interleave arithmetic and memory accesses):
				d = d / resolution.x - pixcoord.x;

				// SMAAArea below needs a sqrt, as the areas texture is compressed
				// quadratically:
				vec2 sqrt_d = sqrt( abs( d ) );

				// Fetch the right crossing edges:
				coords.y -= 1.0 * resolution.y; // WebGL port note: Added
				float e2 = SMAASampleLevelZeroOffset( edgesTex, coords, ivec2( 1, 0 ) ).r;

				// Ok, we know how this pattern looks like, now it is time for getting
				// the actual area:
				weights.rg = SMAAArea( areaTex, sqrt_d, e1, e2, float( subsampleIndices.y ) );
			}

			if ( e.r > 0.0 ) { // Edge at west
				vec2 d;

				// Find the distance to the top:
				vec2 coords;

				coords.y = SMAASearchYUp( edgesTex, searchTex, offset[ 1 ].xy, offset[ 2 ].z );
				coords.x = offset[ 0 ].x; // offset[1].x = texcoord.x - 0.25 * resolution.x;
				d.x = coords.y;

				// Fetch the top crossing edges:
				float e1 = texture2D( edgesTex, coords, 0.0 ).g;

				// Find the distance to the bottom:
				coords.y = SMAASearchYDown( edgesTex, searchTex, offset[ 1 ].zw, offset[ 2 ].w );
				d.y = coords.y;

				// We want the distances to be in pixel units:
				d = d / resolution.y - pixcoord.y;

				// SMAAArea below needs a sqrt, as the areas texture is compressed
				// quadratically:
				vec2 sqrt_d = sqrt( abs( d ) );

				// Fetch the bottom crossing edges:
				coords.y -= 1.0 * resolution.y; // WebGL port note: Added
				float e2 = SMAASampleLevelZeroOffset( edgesTex, coords, ivec2( 0, 1 ) ).g;

				// Get the area for this direction:
				weights.ba = SMAAArea( areaTex, sqrt_d, e1, e2, float( subsampleIndices.x ) );
			}

			return weights;
		}

		void main() {

			gl_FragColor = SMAABlendingWeightCalculationPS( vUv, vPixcoord, vOffset, tDiffuse, tArea, tSearch, ivec4( 0.0 ) );

		}`
};
const SMAABlendShader = {
  uniforms: {
    "tDiffuse": { value: null },
    "tColor": { value: null },
    "resolution": { value: new Vector2(1 / 1024, 1 / 512) }
  },
  vertexShader: `

		uniform vec2 resolution;

		varying vec2 vUv;
		varying vec4 vOffset[ 2 ];

		void SMAANeighborhoodBlendingVS( vec2 texcoord ) {
			vOffset[ 0 ] = texcoord.xyxy + resolution.xyxy * vec4( -1.0, 0.0, 0.0, 1.0 ); // WebGL port note: Changed sign in W component
			vOffset[ 1 ] = texcoord.xyxy + resolution.xyxy * vec4( 1.0, 0.0, 0.0, -1.0 ); // WebGL port note: Changed sign in W component
		}

		void main() {

			vUv = uv;

			SMAANeighborhoodBlendingVS( vUv );

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,
  fragmentShader: `

		uniform sampler2D tDiffuse;
		uniform sampler2D tColor;
		uniform vec2 resolution;

		varying vec2 vUv;
		varying vec4 vOffset[ 2 ];

		vec4 SMAANeighborhoodBlendingPS( vec2 texcoord, vec4 offset[ 2 ], sampler2D colorTex, sampler2D blendTex ) {
			// Fetch the blending weights for current pixel:
			vec4 a;
			a.xz = texture2D( blendTex, texcoord ).xz;
			a.y = texture2D( blendTex, offset[ 1 ].zw ).g;
			a.w = texture2D( blendTex, offset[ 1 ].xy ).a;

			// Is there any blending weight with a value greater than 0.0?
			if ( dot(a, vec4( 1.0, 1.0, 1.0, 1.0 )) < 1e-5 ) {
				return texture2D( colorTex, texcoord, 0.0 );
			} else {
				// Up to 4 lines can be crossing a pixel (one through each edge). We
				// favor blending by choosing the line with the maximum weight for each
				// direction:
				vec2 offset;
				offset.x = a.a > a.b ? a.a : -a.b; // left vs. right
				offset.y = a.g > a.r ? -a.g : a.r; // top vs. bottom // WebGL port note: Changed signs

				// Then we go in the direction that has the maximum weight:
				if ( abs( offset.x ) > abs( offset.y )) { // horizontal vs. vertical
					offset.y = 0.0;
				} else {
					offset.x = 0.0;
				}

				// Fetch the opposite color and lerp by hand:
				vec4 C = texture2D( colorTex, texcoord, 0.0 );
				texcoord += sign( offset ) * resolution;
				vec4 Cop = texture2D( colorTex, texcoord, 0.0 );
				float s = abs( offset.x ) > abs( offset.y ) ? abs( offset.x ) : abs( offset.y );

				// WebGL port note: Added gamma correction
				C.xyz = pow(C.xyz, vec3(2.2));
				Cop.xyz = pow(Cop.xyz, vec3(2.2));
				vec4 mixed = mix(C, Cop, s);
				mixed.xyz = pow(mixed.xyz, vec3(1.0 / 2.2));

				return mixed;
			}
		}

		void main() {

			gl_FragColor = SMAANeighborhoodBlendingPS( vUv, vOffset, tColor, tDiffuse );

		}`
};
class SMAAPass extends Pass {
  constructor(width, height) {
    super();
    this.edgesRT = new WebGLRenderTarget(width, height, {
      depthBuffer: false,
      generateMipmaps: false,
      minFilter: LinearFilter,
      format: RGBFormat
    });
    this.edgesRT.texture.name = "SMAAPass.edges";
    this.weightsRT = new WebGLRenderTarget(width, height, {
      depthBuffer: false,
      generateMipmaps: false,
      minFilter: LinearFilter,
      format: RGBAFormat
    });
    this.weightsRT.texture.name = "SMAAPass.weights";
    const scope = this;
    const areaTextureImage = new Image();
    areaTextureImage.src = this.getAreaTexture();
    areaTextureImage.onload = function() {
      scope.areaTexture.needsUpdate = true;
    };
    this.areaTexture = new Texture();
    this.areaTexture.name = "SMAAPass.area";
    this.areaTexture.image = areaTextureImage;
    this.areaTexture.format = RGBFormat;
    this.areaTexture.minFilter = LinearFilter;
    this.areaTexture.generateMipmaps = false;
    this.areaTexture.flipY = false;
    const searchTextureImage = new Image();
    searchTextureImage.src = this.getSearchTexture();
    searchTextureImage.onload = function() {
      scope.searchTexture.needsUpdate = true;
    };
    this.searchTexture = new Texture();
    this.searchTexture.name = "SMAAPass.search";
    this.searchTexture.image = searchTextureImage;
    this.searchTexture.magFilter = NearestFilter;
    this.searchTexture.minFilter = NearestFilter;
    this.searchTexture.generateMipmaps = false;
    this.searchTexture.flipY = false;
    if (SMAAEdgesShader === void 0) {
      console.error("THREE.SMAAPass relies on SMAAShader");
    }
    this.uniformsEdges = UniformsUtils.clone(SMAAEdgesShader.uniforms);
    this.uniformsEdges["resolution"].value.set(1 / width, 1 / height);
    this.materialEdges = new ShaderMaterial({
      defines: Object.assign({}, SMAAEdgesShader.defines),
      uniforms: this.uniformsEdges,
      vertexShader: SMAAEdgesShader.vertexShader,
      fragmentShader: SMAAEdgesShader.fragmentShader
    });
    this.uniformsWeights = UniformsUtils.clone(SMAAWeightsShader.uniforms);
    this.uniformsWeights["resolution"].value.set(1 / width, 1 / height);
    this.uniformsWeights["tDiffuse"].value = this.edgesRT.texture;
    this.uniformsWeights["tArea"].value = this.areaTexture;
    this.uniformsWeights["tSearch"].value = this.searchTexture;
    this.materialWeights = new ShaderMaterial({
      defines: Object.assign({}, SMAAWeightsShader.defines),
      uniforms: this.uniformsWeights,
      vertexShader: SMAAWeightsShader.vertexShader,
      fragmentShader: SMAAWeightsShader.fragmentShader
    });
    this.uniformsBlend = UniformsUtils.clone(SMAABlendShader.uniforms);
    this.uniformsBlend["resolution"].value.set(1 / width, 1 / height);
    this.uniformsBlend["tDiffuse"].value = this.weightsRT.texture;
    this.materialBlend = new ShaderMaterial({
      uniforms: this.uniformsBlend,
      vertexShader: SMAABlendShader.vertexShader,
      fragmentShader: SMAABlendShader.fragmentShader
    });
    this.needsSwap = false;
    this.fsQuad = new FullScreenQuad(null);
  }
  render(renderer2, writeBuffer, readBuffer) {
    this.uniformsEdges["tDiffuse"].value = readBuffer.texture;
    this.fsQuad.material = this.materialEdges;
    renderer2.setRenderTarget(this.edgesRT);
    if (this.clear)
      renderer2.clear();
    this.fsQuad.render(renderer2);
    this.fsQuad.material = this.materialWeights;
    renderer2.setRenderTarget(this.weightsRT);
    if (this.clear)
      renderer2.clear();
    this.fsQuad.render(renderer2);
    this.uniformsBlend["tColor"].value = readBuffer.texture;
    this.fsQuad.material = this.materialBlend;
    if (this.renderToScreen) {
      renderer2.setRenderTarget(null);
      this.fsQuad.render(renderer2);
    } else {
      renderer2.setRenderTarget(writeBuffer);
      if (this.clear)
        renderer2.clear();
      this.fsQuad.render(renderer2);
    }
  }
  setSize(width, height) {
    this.edgesRT.setSize(width, height);
    this.weightsRT.setSize(width, height);
    this.materialEdges.uniforms["resolution"].value.set(1 / width, 1 / height);
    this.materialWeights.uniforms["resolution"].value.set(1 / width, 1 / height);
    this.materialBlend.uniforms["resolution"].value.set(1 / width, 1 / height);
  }
  getAreaTexture() {
    return "data:image/png;base64,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";
  }
  getSearchTexture() {
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEIAAAAhCAAAAABIXyLAAAAAOElEQVRIx2NgGAWjYBSMglEwEICREYRgFBZBqDCSLA2MGPUIVQETE9iNUAqLR5gIeoQKRgwXjwAAGn4AtaFeYLEAAAAASUVORK5CYII=";
  }
}
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
const screenSize = new THREE.Vector2();
renderer.extensions.get("EXT_color_buffer_float");
let element;
function init(selector) {
  element = document.querySelector(selector);
  if (!element)
    return;
  renderer.setSize(element.clientWidth, element.clientHeight);
  element.appendChild(renderer.domElement);
  const observer = new ResizeObserver(() => {
    if (!element)
      return;
    screenSize.set(element.clientWidth * window.devicePixelRatio, element.clientHeight * window.devicePixelRatio);
    const canvasSize = new THREE.Vector2();
    renderer.getSize(canvasSize);
    const divisor = Math.max(canvasSize.x / screenSize.x, canvasSize.y / screenSize.y);
    renderer.domElement.style.width = canvasSize.x / divisor + "px";
    renderer.domElement.style.height = canvasSize.y / divisor + "px";
  });
  observer.observe(element);
  return renderer.domElement;
}
function setResolution(width, height, fixed = true) {
  renderer.setSize(width, height);
  effectsComposer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  if (controls instanceof FirstPersonControls)
    controls.handleResize();
  if (!fixed)
    return;
  const divisor = Math.max(width / screenSize.x, height / screenSize.y);
  renderer.domElement.style.width = width / divisor + "px";
  renderer.domElement.style.height = height / divisor + "px";
}
const quadScene = new THREE.Scene();
const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const camera = new THREE.PerspectiveCamera(90, document.body.clientWidth / document.body.clientHeight, 0.01, 10);
camera.position.set(2, 2, 2);
camera.lookAt(new THREE.Vector3(0, 0, 0));
const controls = new OrbitControls(camera, renderer.domElement);
const quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2, 1, 1));
quadScene.add(quad);
function setShader(shader) {
  quad.material = shader;
}
function createShader(code, uniforms = {}) {
  const shader = new THREE.ShaderMaterial({
    uniforms: __spreadValues({
      resolution: { value: new THREE.Vector2() },
      cameraPos: { value: new THREE.Vector3() },
      cameraDirection: { value: new THREE.Vector3() },
      fov: { value: 0 },
      modelView: { value: new THREE.Matrix4() },
      projection: { value: new THREE.Matrix4() }
    }, uniforms),
    vertexShader: "void main(){\ngl_Position = vec4(position, 1.0);\n}\n",
    fragmentShader: code
  });
  setShader(shader);
  renderer.compile(quadScene, ortho);
  return shader;
}
const effectsComposer = new EffectComposer(renderer);
effectsComposer.addPass(new RenderPass(quadScene, ortho));
effectsComposer.addPass(new SMAAPass(document.body.clientWidth, document.body.clientHeight));
function render(shader, target = null) {
  quad.material = shader;
  renderer.setRenderTarget(target);
  renderer.getSize(quad.material.uniforms.resolution.value);
  quad.material.uniforms.cameraPos.value.copy(camera.position);
  camera.getWorldDirection(quad.material.uniforms.cameraDirection.value);
  quad.material.uniforms.fov.value = camera.fov / 180 * Math.PI;
  quad.material.uniforms.projection.value = camera.projectionMatrix;
  renderer.render(quadScene, ortho);
}
function renderAA(shader, target = null) {
  quad.material = shader;
  renderer.setRenderTarget(target);
  renderer.getSize(quad.material.uniforms.resolution.value);
  quad.material.uniforms.cameraPos.value.copy(camera.position);
  camera.getWorldDirection(quad.material.uniforms.cameraDirection.value);
  quad.material.uniforms.fov.value = camera.fov / 180 * Math.PI;
  quad.material.uniforms.projection.value = camera.projectionMatrix;
  effectsComposer.render();
}
class Utils {
  static objectToUniforms(object, prefix = "") {
    const uniforms = {};
    for (const [key, value] of Object.entries(object)) {
      if (value instanceof Array)
        continue;
      uniforms[prefix + key] = { value };
    }
    return uniforms;
  }
  static setUniformsFromObject(shader, object, prefix = "") {
    for (const [key, value] of Object.entries(object)) {
      if (value instanceof Array)
        continue;
      shader.uniforms[prefix + key] = { value };
    }
  }
  static createUniformsFromVariables(object, ...variables) {
    const uniforms = {};
    variables.forEach((variable) => {
      uniforms[variable] = { value: object[variable] };
    });
    return uniforms;
  }
  static setUniformsFromVariables(shader, object, ...uniforms) {
    uniforms.forEach((uniform) => {
      shader.uniforms[uniform].value = object[uniform];
    });
  }
}
new THREE.Scene();
var realtimeRenderer = "#include <packing>\n\nuniform vec2 resolution;\nuniform vec3 cameraPos;\nuniform vec3 cameraDirection;\n\nuniform float fov;\n\nuniform bool enableShadows;\nuniform float shadowHardness;\nuniform float epsilonScale;\n\nuniform bool farIsBlack;\n\nuniform float time;\n\nfloat sdf(vec3 position);\n\nconst int maximumRaySteps = 2048;\n\nfloat rand(vec2 n) { \n    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);\n}\n\nvec3 march(vec3 direction) {\n    float minDist = 0.0;\n\n    float totalDistance = 0.0;\n    for (int steps = 0; steps < maximumRaySteps; ++steps) {\n        vec3 p = cameraPos + totalDistance * direction;\n\n        if(length(p) > 100.0)\n            break;\n        \n        float dist = sdf(p);\n        totalDistance += (steps < 1 ? rand(gl_FragCoord.xy / resolution * 100.0) * dist : dist);\n       \n        if(steps == 0) {\n            if(dist < 0.0) return vec3(farIsBlack ? 1.0 : 0.0);\n            minDist = dist * epsilonScale;\n        }\n        else if(dist < minDist) {\n            float depth = 1.0 / totalDistance;\n\n            return vec3(farIsBlack ? depth : 1.0 - depth);\n        }\n    }   \n    return vec3(farIsBlack ? 0.0 : 1.0);\n}\n\nmat3 cameraMatrix() {\n    vec3 cw = cameraDirection;\n    vec3 cp = vec3(0.0, 1.0, 0.0);\n    vec3 cu = normalize(cross(cw, cp));\n    vec3 cv = cross(cu, cw);\n    return mat3(cu, cv, cw);\n}\n\nvoid main() {        \n    vec2 uv = (2.0 * gl_FragCoord.xy - resolution) / resolution.y;\n    mat3 view = cameraMatrix();\n\n    vec3 rayDirection = view * normalize(vec3(uv, 1.0 / tan(fov / 2.0)));\n\n    vec3 color = march(rayDirection);\n\n    gl_FragColor = vec4(color.xyz, 1);\n}";
let autoResize = false;
function setAutoResize(value) {
  autoResize = value;
}
const _Queue = class {
  static loop(callback, cleanup = () => {
  }) {
    _Queue.cleanup();
    _Queue.callback = callback;
    _Queue.cleanup = cleanup;
  }
  static cancel() {
    _Queue.callback = () => {
    };
    _Queue.cleanup();
    _Queue.cleanup = () => {
    };
  }
  static once(callback) {
    _Queue.callback = () => {
      callback();
      this.callback = () => {
      };
    };
  }
};
let Queue = _Queue;
__publicField(Queue, "callback", () => {
});
__publicField(Queue, "cleanup", () => {
});
function animator() {
  requestAnimationFrame(animator);
  const currentSize = new THREE.Vector2();
  renderer.getSize(currentSize);
  if (autoResize && !screenSize.equals(currentSize))
    setResolution(screenSize.x, screenSize.y, false);
  Queue.callback();
}
animator();
class DepthRenderer {
  constructor(sdf) {
    __publicField(this, "shader");
    __publicField(this, "sdf");
    __publicField(this, "epsilonScale", 1e-3);
    __publicField(this, "clock");
    __publicField(this, "farIsBlack", false);
    this.sdf = sdf;
    const size = new THREE.Vector2();
    renderer.getSize(size);
    this.clock = new THREE.Clock();
    this.shader = createShader(realtimeRenderer + sdf.getCode(), __spreadValues(__spreadValues({
      time: { value: 0 }
    }, Utils.createUniformsFromVariables(this, "epsilonScale", "farIsBlack")), Utils.objectToUniforms(this.sdf, "sdf_")));
  }
  start() {
    setAutoResize(true);
    Queue.loop(() => {
      Utils.setUniformsFromObject(this.shader, this.sdf, "sdf_");
      this.shader.uniforms.time.value = this.clock.getElapsedTime();
      Utils.setUniformsFromVariables(this.shader, this, "epsilonScale", "farIsBlack");
      render(this.shader, null);
    });
  }
}
var menger = "uniform int sdf_iterations;\nuniform float sdf_scale;\n\nfloat sdf(vec3 z) {\n    for(int i = 0; i < sdf_iterations; ++i) {\n        \n        TRANSFORM0\n\n        z = abs(z);\n        \n        if(z.x - z.y < 0.0) z.xy = z.yx;\n        if(z.x - z.z < 0.0) z.xz = z.zx;\n        if(z.y - z.z < 0.0) z.zy = z.yz;\n        if(z.x + z.y < 0.0) z.xy = -z.yx;\n        if(z.x + z.z < 0.0) z.xz = -z.zx;\n        if(z.y + z.z < 0.0) z.zy = -z.yz;\n\n        z.z -= 1.0 / 3.0;\n        z.z = -abs(z.z);\n        z.z += 1.0 / 3.0;\n\n        TRANSFORM1\n\n        z *= sdf_scale;\n        z += vec3(-2, -2, 0);\n\n        \n\n    }\n\n    return box(z * pow(sdf_scale, float(-sdf_iterations)), vec3(pow(sdf_scale, float(-sdf_iterations))));\n}";
var sierpinski = "uniform int sdf_iterations;\nuniform float sdf_scale;\n\nfloat sdf(vec3 z) {\n\n    for(int i = 0; i < sdf_iterations; ++i) {\n        TRANSFORM0\n\n        if(z.x + z.y < 0.0) z.xy = -z.yx;\n        if(z.x + z.z < 0.0) z.xz = -z.zx;\n        if(z.y + z.z < 0.0) z.zy = -z.yz;\n\n        TRANSFORM1\n\n        z *= sdf_scale;\n        z += 1.0 - sdf_scale;\n    }\n\n    return tetrahedron(z * pow(sdf_scale, -float(sdf_iterations)), pow(sdf_scale, -float(sdf_iterations)));\n}";
var mandelbulb = "uniform int sdf_iterations;\nuniform float sdf_power;\n\n/*float sdf(vec3 pos) {\n    const int sdf_iterations = 6;\n    const float sdf_power = 4.0;\n\n    vec3 z = pos;\n    float dr = 1.0;\n    float r = 0.0;\n\n    for (int i = 0; i < sdf_iterations; ++i) {\n        r = length(z);\n        if (r > 2.0) break;\n        \n        \n        float theta = acos(z.z/r);\n        float phi = atan(z.y,z.x);\n        dr = pow(r, sdf_power - 1.0) * sdf_power * dr + 1.0;\n        \n        \n        float zr = pow(r, sdf_power);\n        theta = theta * sdf_power;\n        phi = phi * sdf_power;\n        \n        \n        z = zr * vec3(sin(theta) * cos(phi), sin(phi) * sin(theta), cos(theta));\n        z += pos;\n    }\n\n    return 0.5 * log(r) * r / dr;\n}*/\n\nfloat sdf(vec3 position) {\n    vec3 z = position;\n    float dr = 1.0;\n    float r = 0.0;\n    for (int i = 0; i < sdf_iterations; i++) {\n        r = length(z);\n        if (r > 2.0) break;\n        \n        \n        float theta = acos(z.z / r);\n        float phi = atan(z.y, z.x);\n        dr =  pow(r, sdf_power - 1.0) * sdf_power * dr + 1.0;\n        \n        \n        float zr = pow(r, sdf_power);\n        theta = theta * sdf_power;\n        phi = phi * sdf_power;\n        \n        \n        z = zr*vec3(sin(theta)*cos(phi), sin(phi)*sin(theta), cos(theta));\n        z += position;\n    }\n    \n    return 0.5 * log(r) * r / dr;\n}\n\nvec3 csdf(vec3 z) {\n    return vec3(1);\n}";
class SDF {
}
function transform(shaderCode, index, steps) {
  const possibleTransforms = ["rotate", "translate", "scale", "rotateX", "rotateY", "rotateZ", "abs", "absX", "absY", "absZ"];
  steps = steps.map((step) => {
    if (!step.trim())
      return "// Empty transform step";
    const match = step.match(/([^\(]*)\((.*)\)/);
    const name = match ? match[1] : step;
    if (!possibleTransforms.includes(name))
      throw new Error(`Invalid transform step: ${step}`);
    step = step.replace(/([^a-zA-Z\.\d])(\d+)([^\.\d])/g, "$1$2.0$3");
    if (!match)
      return `z = ${step}(z);`;
    else if (match[2].trim() === "")
      return "z = " + step.replace(/\(/, "(z") + ";";
    else
      return "z = " + step.replace(/\(/, "(z, ") + ";";
  });
  return shaderCode.replace(new RegExp(`TRANSFORM${index}`), steps.join("\n"));
}
class Menger extends SDF {
  constructor(iterations, scale = 3) {
    super();
    __publicField(this, "iterations");
    __publicField(this, "scale");
    __publicField(this, "transform", []);
    __publicField(this, "transform2", []);
    this.iterations = iterations;
    this.scale = scale;
  }
  getCode() {
    return transform(transform(menger, 0, this.transform), 1, this.transform2);
  }
}
class Sierpinski extends SDF {
  constructor(iterations, scale = 2) {
    super();
    __publicField(this, "iterations");
    __publicField(this, "scale");
    __publicField(this, "transform", []);
    __publicField(this, "transform2", []);
    this.iterations = iterations;
    this.scale = scale;
  }
  getCode() {
    return transform(transform(sierpinski, 0, this.transform), 1, this.transform2);
  }
}
class Mandelbulb extends SDF {
  constructor(iterations, power) {
    super();
    __publicField(this, "iterations");
    __publicField(this, "power");
    this.iterations = iterations;
    this.power = power;
  }
  getCode() {
    return mandelbulb;
  }
}
class CustomSDF extends SDF {
  constructor(code) {
    super();
    __publicField(this, "code");
    this.code = code;
  }
  getCode() {
    return this.code;
  }
}
var copyGLSL = "uniform vec2 resolution;\nuniform sampler2D data;\n\nvoid main() {\n    gl_FragColor = texture(data, gl_FragCoord.xy / resolution);\n}";
const copyShader = createShader(copyGLSL, {
  data: { value: null }
});
function copy(from, to) {
  if (from instanceof THREE.WebGLRenderTarget)
    from = from.texture;
  copyShader.uniforms.data.value = from;
  render(copyShader, to);
}
function copyAA(from, to) {
  if (from instanceof THREE.WebGLRenderTarget)
    from = from.texture;
  copyShader.uniforms.data.value = from;
  renderAA(copyShader, to);
}
function downloadCanvas(name) {
  const link = document.createElement("a");
  link.download = name;
  link.href = renderer.domElement.toDataURL();
  link.click();
  link.remove();
}
function downloadJSON(data, name) {
  const link = document.createElement("a");
  link.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
  link.download = name;
  link.click();
  link.remove();
}
var pathTracer = "uniform vec2 offset;\nuniform vec2 size;\n\nuniform sampler2D previousFrame;\nuniform int sampleIndex;\nuniform int pixelDivisions;\n\nuniform int rayDepth;\nuniform float roughness;\nuniform vec3 sunDirection;\nuniform float sunStrength;\nuniform float backgroundMultiplier;\n\nuniform vec3 color;\n\nuniform vec3 emissionR;\nuniform vec3 emissionG;\nuniform vec3 emissionB;\n\n#define PI 3.141592653589\n\nvec3 ortho(vec3 v) {\n    return abs(v.x) > abs(v.z) ? vec3(-v.y, v.x, 0.0)  : vec3(0.0, -v.z, v.y);\n}\n\nvec3 getSampleBiased(vec3 dir, float power) {\n    dir = normalize(dir);\n    vec3 o1 = normalize(ortho(dir));\n    vec3 o2 = normalize(cross(dir, o1));\n    vec2 r = rand2();\n    r.x = r.x * 2.0 * PI;\n    r.y = pow(r.y, 1.0 / (power + 1.0));\n    float oneminus = sqrt(1.0 - r.y * r.y);\n    return cos(r.x) * oneminus * o1 + sin(r.x) * oneminus * o2 + r.y * dir;\n} \n\nvec3 getCosineWeightedSample(vec3 dir) {\n    return getSampleBiased(dir, 1.0);\n}\n\nvec3 sampleBiased(vec3 normal) {\n    return normalize(normal + sphericalRand());\n}\n\nvec3 sampleUnbiased(vec3 normal) {\n    while(true) {\n        vec3 dir = sphericalRand();\n        if(dot(normal, dir) > 0.0) return dir;\n    }\n\n    return vec3(0);\n}\n\nvec3 raytrace(vec3 from, vec3 direction) {\n    vec3 direct = vec3(0.0);\n    vec3 luminance = vec3(1.0);\n\n    for (int i = 0; i < rayDepth; i++) {\n        Ray ray = raycast(from, direction);\n\n        if(ray.hit) {\n            \n            vec3 reflected = reflect(direction, ray.normal);\n            vec3 sampleDir = sampleBiased(ray.normal);\n            float lerpFactor = roughness * roughness;\n\n            direction = normalize(mix(reflected, sampleDir, lerpFactor)); \n            luminance *= clamp(color, 0.0, 1.0) * mix(max(dot(ray.normal, direction), 0.0), 1.0, lerpFactor);\n\n            from = ray.position + ray.normal * epsilon;\n\n            \n            vec3 sunSampleDir = normalize(-sunDirection);\n            float sunLight = dot(ray.normal, sunSampleDir);\n\n            Ray directLightRay = raycast(from, sunSampleDir);\n\n            if (sunLight > 0.0 && !directLightRay.hit) {\n                direct += luminance * sunLight * sunStrength;\n            }\n        }\n        else {\n            return direct + luminance * background(direction) * backgroundMultiplier;\n        }\n    }\n    return vec3(0.0);\n}\n\nvec3 shading() {\n    vec3 previousColor = texture2D(previousFrame, gl_FragCoord.xy / resolution).xyz;\n\n    if(\n        gl_FragCoord.x < offset.x ||\n        gl_FragCoord.y < offset.y ||\n        gl_FragCoord.x > offset.x + size.x ||\n        gl_FragCoord.y > offset.y + size.y\n    ) {\n        return previousColor;\n    }\n\n   \n\n    int subpixelIndex = sampleIndex % (pixelDivisions * pixelDivisions);\n    int subX = subpixelIndex % pixelDivisions;\n    int subY = subpixelIndex / pixelDivisions;\n\n    seed = (subpixelCoord(subX, subY, pixelDivisions)) * (1.0 + float(sampleIndex) * 0.001);\n\n    vec3 rayDirection = subpixelDirection(subX, subY, pixelDivisions);\n\n    vec3 pixelColor = raytrace(cameraPos, rayDirection);\n\n    return previousColor * float(sampleIndex) / float(sampleIndex + 1) + pixelColor / float(sampleIndex + 1);\n\n    /*vec3 rayDirection = pixelDirection();\n\n    \n    vec3 pixelColor = vec3(0);\n\n    for(int i = 0; i < samplesPerDrawCall; ++i) {\n        seed = (1.0 * gl_FragCoord.xy) * (1.0 + float(sampleIndex) * 0.1);\n        pixelColor += raytrace(cameraPos, rayDirection);\n    }\n\n    \n    return previousColor * float(sampleIndex) / float(sampleIndex + samplesPerDrawCall) + pixelColor / float(sampleIndex + samplesPerDrawCall);*/\n}";
var _core = "uniform vec2 resolution;\nuniform vec3 cameraPos;\nuniform vec3 cameraDirection;\nuniform float fov;\nuniform float time;\n\nuniform bool adaptiveEpsilon;\nuniform float epsilonScale;\nuniform float epsilon;\n\nconst float PI = 3.1415926535897932384626433832795;\nconst float DEG_TO_RAD = PI / 180.0;\n\nconst int maximumRaySteps = 16536;\n\nfloat sdf(vec3 position);\nvec3 background(vec3 direction);\n\nvec3 calculateNormal(vec3 position, float minDist) {\n    vec2 h = vec2(minDist, 0.0);\n    return normalize(vec3(sdf(position + h.xyy) - sdf(position - h.xyy),\n                           sdf(position + h.yxy) - sdf(position - h.yxy),\n                           sdf(position + h.yyx) - sdf(position - h.yyx)));\n}\n\nvec3 trap;\n\nvec2 seed = vec2(0);\nfloat rand() { \n    seed += vec2(-0.1, 0.1);\n    return fract(sin(dot(seed, vec2(12.9898, 4.1414))) * 43758.5453);\n}\n\n/*float seed = 10.0;\n\nfloat PHI = 1.61803398874989484820459;\n\nfloat rand() {\n    vec2 xy = gl_FragCoord.xy;\n    seed += 1.0;\n    return fract(tan(distance(xy * PHI, xy) * seed) * xy.x);\n}*/\n\nvec2 rand2() {\n    return vec2(rand(), rand());\n}\n\nvec3 rand3() {\n    return vec3(rand(), rand(), rand());\n}\n\nvec3 sphericalRand() {\n    float z = rand() * 2.0 - 1.0;\n    float rxy = sqrt(1.0 - z * z);\n    float phi = rand() * 2.0 * PI;\n    float x = rxy * cos(phi);\n    float y = rxy * sin(phi);\n\n    return vec3(x, y, z);\n}\n\nstruct Ray {\n    vec3 origin;\n    vec3 direction;\n\n    float closest;\n\n    bool hit;\n    vec3 position;\n    vec3 normal;\n    float steps;\n\n    float epsilon;\n};\n\nmat3 cameraMatrix(vec3 direction) {\n    vec3 cw = direction;\n    vec3 cp = vec3(0.0, 1.0, 0.0);\n    vec3 cu = normalize(cross(cw, cp));\n    vec3 cv = cross(cu, cw);\n    return mat3(cu, cv, cw);\n}\n\nvec2 subpixelCoord(int x, int y, int divisions) {\n    float subpixelSize = 1.0 / float(divisions);\n    vec2 offset = vec2(subpixelSize * (float(x) + 0.5) - 0.5, subpixelSize * (float(y) + 0.5) - 0.5);\n    return gl_FragCoord.xy + offset;\n}\n\nvec3 subpixelDirection(int x, int y, int divisions) {\n    mat3 view = cameraMatrix(cameraDirection);\n    vec2 uv = (subpixelCoord(x, y, divisions) / resolution) * 2.0 - 1.0;\n    uv.x *= resolution.x / resolution.y;\n    return view * normalize(vec3(uv, 1.0 / tan(fov / 2.0)));\n}\n\nvec3 pixelDirection() {\n    mat3 view = cameraMatrix(cameraDirection);\n    vec2 uv = (gl_FragCoord.xy / resolution) * 2.0 - 1.0;\n    uv.x *= resolution.x / resolution.y;\n    return view * normalize(vec3(uv, 1.0 / tan(fov / 2.0)));\n}\n\nvec2 directionPixel(vec3 position, vec3 cameraPos, vec3 cameraDir) {\n    mat3 inverseView = inverse(cameraMatrix(cameraDir));\n    vec3 toPos = normalize(position - cameraPos);\n    vec3 fromCameraDir = inverseView * toPos;\n\n    float zDistance = 1.0 / tan(fov / 2.0);\n    vec2 uv = (fromCameraDir * zDistance / fromCameraDir.z).xy;\n    uv /= resolution.x / resolution.y;\n    return (uv + 1.0) / 2.0;\n}\n\nuniform int orbitSampler;\nuniform int orbitMapping;\n\nvec3 sampleOrbit(vec3 a, vec3 b) {\n    switch (orbitSampler) {\n    case 0:\n        return min(a, b);\n    case 1:\n        return max(a, b);\n    case 2:\n        return a + b;\n    case 3:\n        return min(abs(a), abs(b));\n    case 4:\n        return max(abs(a), abs(b));\n    case 5:\n        return abs(a) + abs(b);\n    }\n}\n\nfloat mapOrbit(float x) {\n    switch (orbitMapping) {\n    case 0:\n        return 1.0 / 3.0;\n    case 1:\n        return x;\n    case 2:\n        return 1.0 / (1.0 + pow(2.71828182846, -x));\n    case 3:\n        return x / (x + 1.0);\n    }\n}\n\nvec3 mapToChannels(vec3 color1, vec3 color2, vec3 color3, vec3 map) {\n    return (mapOrbit(map.x) * color1 + mapOrbit(map.y) * color2 + mapOrbit(map.z) * color3);\n}\n\nRay raycast(vec3 origin, vec3 direction) {\n    Ray data;\n    data.origin = origin;\n    data.direction = direction;\n\n    if(!adaptiveEpsilon)\n        data.epsilon = epsilon;\n\n    float totalDistance = 0.0;\n    float closest = 100.0;\n    for (int steps = 0; steps < maximumRaySteps; ++steps) {\n        vec3 currentPosition = origin + totalDistance * direction;\n\n        if(totalDistance > 100.0)\n            break;\n\n        float currentDistance = sdf(currentPosition);\n        closest = min(closest, currentDistance);\n\n        \n        totalDistance += max(0.0, (steps < 1 ? rand() * currentDistance : currentDistance));\n\n        if(steps == 0) {\n            if(currentDistance < 0.0) {\n                data.hit = true;\n                data.position = origin;\n                data.normal = vec3(0);\n                data.steps = 0.0;\n\n                return data;\n            }\n\n            if(adaptiveEpsilon)\n                data.epsilon = currentDistance * epsilonScale;\n        }\n        else if(currentDistance < data.epsilon) {\n            data.hit = true;\n            data.position = origin + totalDistance * direction;\n            data.normal = calculateNormal(data.position, data.epsilon);\n            data.steps = float(steps) + currentDistance / data.epsilon;\n\n            return data;\n        }\n    }\n\n    data.closest = closest;\n    data.hit = false;\n    return data;\n}\n\nRay raycastEpsilon(vec3 origin, vec3 direction, float epsilon) {\n    Ray data;\n    data.origin = origin;\n    data.direction = direction;\n    data.epsilon = epsilon;\n\n    float totalDistance = 0.0;\n      float closest = 100.0;\n    for (int steps = 0; steps < maximumRaySteps; ++steps) {\n        vec3 currentPosition = origin + totalDistance * direction;\n\n        if(totalDistance > 100.0)\n            break;\n\n        float currentDistance = sdf(currentPosition);\n        closest = min(closest, currentDistance);\n\n        \n        totalDistance += max(0.0, (steps < 1 ? rand() * currentDistance : currentDistance));\n\n        if(steps == 0) {\n            if(currentDistance < 0.0) {\n                data.hit = true;\n                data.position = origin;\n                data.normal = vec3(0);\n                data.steps = 0.0;\n\n                return data;\n            }\n\n        }\n        else if(currentDistance < data.epsilon) {\n            data.hit = true;\n            data.position = origin + totalDistance * direction;\n            data.normal = calculateNormal(data.position, data.epsilon);\n            data.steps = float(steps) + currentDistance / data.epsilon;\n\n            return data;\n        }\n    }\n\n    data.closest = closest;\n    data.hit = false;\n    return data;\n}\n\nRay pixelRaycast() {\n    return raycast(cameraPos, pixelDirection());\n}\n\nvec3 shading();\n\nvoid main() {        \n    gl_FragColor = vec4(shading(), 1);\n}";
var primitives = "float merge(float a, float b, float k){\r\n    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);\r\n    return mix(b, a, h) - k * h * (1.0 - h);\r\n}\n\nfloat merge(float a, float b) {\r\n    return min(a, b);\r\n}\n\nfloat subtract(float a, float b) {\r\n    return max(a, -b);\r\n}\n\nfloat intersect(float a, float b) {\r\n    return max(a, b);\r\n}\n\nmat4 rotationMatrix(vec3 axis, float angle) {\r\n    axis = normalize(axis);\r\n    float s = sin(angle);\r\n    float c = cos(angle);\r\n    float oc = 1.0 - c;\r\n    \r\n    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,\r\n                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,\r\n                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,\r\n                0.0,                                0.0,                                0.0,                                1.0);\r\n}\n\nvec3 rotate(vec3 z, float axisX, float axisY, float axisZ, float angle) {\r\n    vec4 u = vec4(z, 1);\r\n    u *= rotationMatrix(vec3(axisX, axisY, axisZ), angle * DEG_TO_RAD);\r\n    return u.xyz;\r\n}\n\nvec3 rotateX(vec3 z, float angle) {\r\n    return (vec4(z, 1) * rotationMatrix(vec3(1, 0, 0), angle * DEG_TO_RAD)).xyz;\r\n}\r\nvec3 rotateY(vec3 z, float angle) {\r\n    return (vec4(z, 1) * rotationMatrix(vec3(0, 1, 0), angle * DEG_TO_RAD)).xyz;\r\n}\r\nvec3 rotateZ(vec3 z, float angle) {\r\n    return (vec4(z, 1) * rotationMatrix(vec3(0, 0, 1), angle * DEG_TO_RAD)).xyz;\r\n}\n\nvec3 absX(vec3 z) {\r\n    return vec3(abs(z.x), z.y, z.z);\r\n}\r\nvec3 absY(vec3 z) {\r\n    return vec3(z.x, abs(z.y), z.z);\r\n}\r\nvec3 absZ(vec3 z) {\r\n    return vec3(z.x, z.y, abs(z.z));\r\n}\n\nvec3 translate(vec3 p, float x, float y, float z) {\r\n    return p + vec3(x, y, z);\r\n}\n\nvec3 scale(vec3 p, float x, float y, float z) {\r\n    return p * vec3(x, y, z);\r\n}\n\nvec3 scale(vec3 p, float s) {\r\n    return p * s;\r\n}\r\n\nfloat between(float a, float b) {\r\n    return mix(a, b, mod(time, 1.0));\r\n}\n\nvec3 between(vec3 a, vec3 b) {\r\n    return mix(a, b, mod(time, 1.0));\r\n}\r\n\nfloat sphere(vec3 p, float r) {\r\n    return length(p) - r;\r\n}\n\nfloat box(vec3 p, vec3 b) {\r\n    vec3 q = abs(p) - b;\r\n    return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)), 0.0);\r\n}\n\nfloat tetrahedron(vec3 p, float r) {\r\n    float md = max(max(-p.x - p.y - p.z, p.x + p.y - p.z),\r\n              max(-p.x + p.y + p.z, p.x - p.y + p.z));\r\n    return (md - r) / sqrt(3.0);\r\n}\n\nfloat octahedron(vec3 p, float s) {\r\n    p = abs(p);\r\n    float m = p.x + p.y + p.z - s;\r\n    vec3 q;\r\n        if(3.0 * p.x < m) q = p.xyz;\r\n    else if(3.0 * p.y < m) q = p.yzx;\r\n    else if(3.0 * p.z < m) q = p.zxy;\r\n    else return m*0.57735027;\r\n        \r\n    float k = clamp(0.5 * (q.z - q.y + s), 0.0, s); \r\n    return length(vec3(q.x, q.y - s + k, q.z - k)); \r\n}";
const core = _core + primitives;
var postprocess = "uniform vec2 resolution;\nuniform sampler2D data;\n\nvec3 reinhard(vec3 x) {\n    return x / (1.0 + x);\n}\n\nvec3 uchimura(vec3 x, float P, float a, float m, float l, float c, float b) {\n    float l0 = ((P - m) * l) / a;\n    float L0 = m - m / a;\n    float L1 = m + (1.0 - m) / a;\n    float S0 = m + l0;\n    float S1 = m + a * l0;\n    float C2 = (a * P) / (P - S1);\n    float CP = -C2 / P;\n\n    vec3 w0 = vec3(1.0 - smoothstep(0.0, m, x));\n    vec3 w2 = vec3(step(m + l0, x));\n    vec3 w1 = vec3(1.0 - w0 - w2);\n\n    vec3 T = vec3(m * pow(x / m, vec3(c)) + b);\n    vec3 S = vec3(P - (P - S1) * exp(CP * (x - S0)));\n    vec3 L = vec3(m + a * (x - m));\n\n    return T * w0 + L * w1 + S * w2;\n}\n\nvec3 uchimura(vec3 x) {\n    const float P = 1.0;  \n    const float a = 1.0;  \n    const float m = 0.22; \n    const float l = 0.4;  \n    const float c = 1.33; \n    const float b = 0.0;  \n\n    return uchimura(x, P, a, m, l, c, b);\n}\n\nvec3 aces(vec3 x) {\n    const float a = 2.51;\n    const float b = 0.03;\n    const float c = 2.43;\n    const float d = 0.59;\n    const float e = 0.14;\n    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);\n}\n\nvec3 contrast(vec3 color, float contrast) {\n    return (color - 0.5) * max(contrast, 0.0) + 0.5;\n}\n\nvec3 brightness(vec3 color, float brightness) {\n    return color * max(brightness, 0.0);\n}\n\nvec3 add(vec3 color, float r, float g, float b) {\n    return color + vec3(r, g, b);\n}\n\nvec3 add(vec3 color, float l) {\n    return color + l;\n}\n\nvec3 filmic(vec3 x) {\n    vec3 X = max(vec3(0.0), x - 0.004);\n    vec3 result = (X * (6.2 * X + 0.5)) / (X * (6.2 * X + 1.7) + 0.06);\n    return pow(result, vec3(2.2));\n}\n\nvec3 vignette(vec3 color, float radius, float smoothness) {\n    vec2 uv = gl_FragCoord.xy / resolution.xy;\n\n    float diff = radius - distance(uv, vec2(0.5, 0.5));\n    return color * smoothstep(-smoothness, smoothness, diff);\n}\n\nvec3 hsv2rgb(vec3 c) {\n    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);\n    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);\n    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);\n}\n\nvec3 rgb2hsv(vec3 c) {\n    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);\n    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));\n    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));\n\n    float d = q.x - min(q.w, q.y);\n    float e = 1.0e-10;\n    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);\n}\n\nvec3 saturation(vec3 color, float saturation) {\n    if(color.r == color.g && color.r == color.b) return color;\n    vec3 hsv = rgb2hsv(color);\n    hsv.y *= saturation;\n    return hsv2rgb(hsv); \n}\n\nfloat sRGB(float x) {\n    if (x <= 0.00031308)\n        return 12.92 * x;\n    else\n        return 1.055*pow(x,(1.0 / 2.4) ) - 0.055;\n}\nvec3 sRGB(vec3 c) {\n    return vec3(sRGB(c.x), sRGB(c.y), sRGB(c.z));\n}\n\nvoid main() {\n    vec2 uv = gl_FragCoord.xy / resolution.xy;\n    vec3 color = texture2D(data, uv).xyz;\n\n    POSTPROCESS\n\n    gl_FragColor = vec4(color, 1);\n}";
class TemporaryImage {
  constructor(texture) {
    __publicField(this, "texture");
    __publicField(this, "postprocessing", []);
    if (texture instanceof THREE.WebGLRenderTarget)
      texture = texture.texture;
    this.texture = texture;
  }
  postprocess(...steps) {
    this.postprocessing.push(...steps);
    return this;
  }
  renderToScreen() {
    const possibleEffects = ["reinhard", "filmic", "aces", "uchimura", "contrast", "brightness", "saturation", "vignette", "add", "sRGB"];
    const shaderSteps = this.postprocessing.map((step) => {
      if (!step.trim())
        return "// Empty postprocessing step";
      const match = step.match(/(.*)\((.*)\)/);
      const name = match ? match[1] : step;
      if (!possibleEffects.includes(name))
        throw new Error(`Invalid postprocessing step: ${step}`);
      step = step.replace(/([^a-zA-Z\.\d])(\d+)([^\.\d])/g, "$1$2.0$3");
      if (!match)
        return `color = ${step}(color);`;
      else if (match[2].trim() === "")
        return "color = " + step.replace(/\(/, "(color") + ";";
      else
        return "color = " + step.replace(/\(/, "(color, ") + ";";
    });
    const shader = createShader(postprocess.replace(/POSTPROCESS/, shaderSteps.join("\n")), {
      data: { value: this.texture }
    });
    render(shader, null);
  }
  download() {
    this.renderToScreen();
    downloadCanvas("image.png");
    return this;
  }
  show() {
    this.renderToScreen();
    return this;
  }
}
function autoBufferSize(width, heigth) {
  let owidth = width;
  let oheight = heigth;
  let widthDiv = 1;
  let heightDiv = 1;
  while (width * heigth > 16e5) {
    if (width > heigth) {
      width = owidth / ++widthDiv;
    } else {
      heigth = oheight / ++heightDiv;
    }
  }
  return { x: width, y: heigth };
}
function humanReadableTime(ms) {
  const milliseconds = Math.floor(ms % 1e3);
  const seconds = Math.floor(ms / 1e3 % 60);
  const minutes = Math.floor(seconds / 60 % 60);
  const hours = Math.floor(minutes / 60);
  return `${hours > 0 ? `${hours}h ` : ""}${minutes > 0 ? `${minutes}m ` : ""}${seconds > 0 ? `${seconds}s ` : ""}${milliseconds > 0 ? `${milliseconds % 1e3}ms` : ""}`;
}
class PathTracer {
  constructor(sdf, background) {
    __publicField(this, "textures", []);
    __publicField(this, "shader");
    __publicField(this, "sdf");
    __publicField(this, "background");
    __publicField(this, "pixelDivisions", 1);
    __publicField(this, "roughness", 1);
    __publicField(this, "sunDirection", new THREE.Vector3(-0.5, -2, -1));
    __publicField(this, "sunStrength", 1);
    __publicField(this, "backgroundMultiplier", 1);
    __publicField(this, "rayDepth", 5);
    __publicField(this, "epsilon", 1e-6);
    __publicField(this, "bufferSize");
    __publicField(this, "lastImage", null);
    __publicField(this, "color", new THREE.Color(1, 1, 1));
    this.sdf = sdf;
    this.background = background;
    const size = new THREE.Vector2();
    renderer.getSize(size);
    this.textures = [
      new THREE.WebGLRenderTarget(size.x, size.y, { format: THREE.RGBAFormat, type: THREE.FloatType }),
      new THREE.WebGLRenderTarget(size.x, size.y, { format: THREE.RGBAFormat, type: THREE.FloatType })
    ];
    this.shader = createShader(core + pathTracer + sdf.getCode() + background.getCode(), __spreadValues(__spreadValues(__spreadValues({
      previousFrame: { value: this.textures[0].texture },
      sampleIndex: { value: 0 },
      offset: { value: new THREE.Vector2(0, 0) },
      size: { value: new THREE.Vector2(0, 0) },
      adaptiveEpsilon: { value: false },
      time: { value: 0 }
    }, Utils.createUniformsFromVariables(this, "sunDirection", "sunStrength", "roughness", "rayDepth", "pixelDivisions", "color", "epsilon", "backgroundMultiplier")), Utils.objectToUniforms(this.sdf, "sdf_")), Utils.objectToUniforms(this.background, "bg_")));
  }
  renderImage(width, height, time = 0) {
    const bufferSize = this.bufferSize ? { x: this.bufferSize, y: this.bufferSize } : autoBufferSize(width, height);
    const start = performance.now();
    return new Promise((resolve, reject) => {
      setAutoResize(false);
      setResolution(width, height);
      const targetSize = new THREE.Vector2(width, height);
      const textureSize = new THREE.Vector2(this.textures[0].texture.image.width, this.textures[0].texture.image.height);
      if (!targetSize.equals(textureSize)) {
        this.textures[0].dispose();
        this.textures[1].dispose();
        this.textures = [
          new THREE.WebGLRenderTarget(targetSize.x, targetSize.y, { format: THREE.RGBAFormat, type: THREE.FloatType }),
          new THREE.WebGLRenderTarget(targetSize.x, targetSize.y, { format: THREE.RGBAFormat, type: THREE.FloatType })
        ];
      }
      renderer.setRenderTarget(this.textures[0]);
      renderer.clear();
      renderer.setRenderTarget(this.textures[1]);
      renderer.clear();
      Utils.setUniformsFromObject(this.shader, this.sdf, "sdf_");
      Utils.setUniformsFromObject(this.shader, this.background, "bg_");
      const widths = Math.ceil(width / bufferSize.x);
      const heights = Math.ceil(height / bufferSize.y);
      let x = 0, y = 0;
      let sample = 0;
      const handleVisibilityChange = () => {
        if (document.visibilityState === "hidden")
          console.log("Render task paused");
        else
          console.log("Render task resumed");
      };
      const timer = setInterval(() => {
        document.addEventListener("visibilitychange", handleVisibilityChange);
        if (document.visibilityState === "visible")
          console.log(`Render task: ${Math.floor(sample / (this.pixelDivisions * this.pixelDivisions) * 100)}%`);
      }, 1e3);
      Queue.loop(() => {
        this.shader.uniforms.adaptiveEpsilon.value = false;
        this.shader.uniforms.previousFrame.value = this.textures[1].texture;
        this.shader.uniforms.sampleIndex.value = sample;
        this.shader.uniforms.offset.value = new THREE.Vector2(x * bufferSize.x, y * bufferSize.y);
        this.shader.uniforms.size.value = new THREE.Vector2(bufferSize.x, bufferSize.y);
        this.shader.uniforms.time.value = time;
        Utils.setUniformsFromVariables(this.shader, this, "sunDirection", "sunStrength", "roughness", "rayDepth", "pixelDivisions", "color", "epsilon", "backgroundMultiplier");
        render(this.shader, this.textures[0]);
        copy(this.textures[0], null);
        this.textures = [this.textures[1], this.textures[0]];
        ++x;
        if (x >= widths) {
          x = 0;
          ++y;
        }
        if (y >= heights) {
          y = 0;
          sample += 1;
        }
        if (sample >= this.pixelDivisions * this.pixelDivisions) {
          const durationMs = performance.now() - start;
          console.log("Render task: 100%");
          console.log(`Rendering done in ${humanReadableTime(durationMs)}`);
          console.log(`Render Size: ${Math.floor(this.pixelDivisions * this.pixelDivisions * width * height / 1e5) / 10} megapixels`);
          console.log(`Render Speed: ${Math.floor(this.pixelDivisions * this.pixelDivisions * width * height / durationMs / 10) / 100} megapixels per second`);
          Queue.cancel();
        }
      }, () => {
        clearInterval(timer);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        this.lastImage = new TemporaryImage(this.textures[1]);
        if (sample >= this.pixelDivisions * this.pixelDivisions)
          resolve(this.lastImage);
        else
          reject(new Error("Render task cancelled"));
      });
    });
  }
  async renderAnimation(width, height, path, postprocess2) {
    const frames = [];
    const files = [];
    function downloadCurrent() {
      const filename = `${index}-${index + frames.length - 1}.json`;
      downloadJSON(frames, filename);
      files.push(filename);
      index += frames.length;
      frames.length = 0;
    }
    let index = 1;
    for (let i = 0; i < path.length; i++) {
      if (frames.length === 50)
        downloadCurrent();
      const point = path[i];
      camera.position.copy(point.position);
      camera.lookAt(point.position.clone().add(point.direction));
      const image = await this.renderImage(width, height, point.time);
      image.postprocess(...postprocess2).show();
      frames.push(renderer.domElement.toDataURL());
      console.log(`Frame ${i + 1}/${path.length} done`);
    }
    downloadCurrent();
    downloadJSON({ files, totalFrames: path.length }, "header.json");
  }
}
var simple = "uniform vec3 sunDirection;\nuniform vec3 sunColor;\nuniform float aoStrength;\nuniform bool enableShadows;\nuniform float roughness;\n\nuniform vec3 color;\n\nfloat calculateDirectLight(vec3 position, vec3 normal, float epsilon) {\n    if(enableShadows) {\n        Ray shadowRay = raycastEpsilon(position + normal * 2.0 * epsilon, -sunDirection, epsilon);\n        return shadowRay.hit ? 0.0 : max(dot(normal, -sunDirection), 0.0);\n    }\n    else {\n        return max(dot(normal, -sunDirection), 0.0);\n    }\n}\n\nfloat statixAO(vec3 p, vec3 n, float k, float delta) {\n    float sum = 0.0;\n    for(int i = 1; i <= 5; ++i) {\n        float fi = float(i);\n        sum += pow(2.0, -fi) * (fi * delta - sdf(p + n * fi * delta));\n    }\n    return k * sum;\n}\n\nfloat tracerAO(vec3 position, vec3 normal, float epsilon) {\n\n    float luminance = 1.0;\n\n    for(int i = 0; i < 5; ++i) {\n        Ray tracer = raycastEpsilon(position + normal * 2.0 * epsilon, normal, epsilon);\n\n        if(!tracer.hit) break;\n\n        luminance *= 0.5;\n        position = tracer.position;\n        normal = normalize(tracer.normal);\n    }\n\n    return luminance;\n    \n\n}\n\nvec3 shading() {\n    Ray ray = pixelRaycast();\n    \n    if(ray.hit) {\n        if(ray.steps == 0.0) {\n            return vec3(0);\n        }\n\n        const int samples = 4;\n        vec3 backgroundAverage = vec3(0);\n        float lerpFactor = roughness * roughness;\n\n        for(int i = 0; i < samples; ++i)  {\n            vec3 random = normalize(rand3() * 2.0 - 1.0); \n            vec3 reflected = reflect(ray.direction, ray.normal);\n            backgroundAverage += background(normalize(mix(reflected, random, lerpFactor))) * mix(max(dot(reflected, ray.normal), 0.0), 1.0, lerpFactor);\n        }\n\n        \n        vec3 scolor = clamp(color, 0.0, 1.0);\n\n        vec3 indirect = (backgroundAverage / float(samples)) * scolor * pow(ray.steps, -0.2);\n        vec3 direct = calculateDirectLight(ray.position, ray.normal, ray.epsilon) * sunColor * scolor;\n      \n        return indirect + direct;\n    }\n    else {\n        return background(ray.direction);\n    }\n}";
class Timer {
  constructor() {
    __publicField(this, "startTime", this.time());
    __publicField(this, "running", true);
    __publicField(this, "stoppedTime", 0);
  }
  time() {
    return performance.now() / 1e3;
  }
  stop() {
    if (!this.running)
      return;
    this.stoppedTime = this.get();
    this.running = false;
  }
  start() {
    if (this.running)
      return;
    this.running = true;
    this.set(this.stoppedTime);
  }
  toggle() {
    if (this.running)
      this.stop();
    else
      this.start();
  }
  reset() {
    if (!this.running)
      this.stoppedTime = 0;
    else
      this.startTime = this.time();
  }
  set(time) {
    if (!this.running)
      this.stoppedTime = time;
    else
      this.startTime = this.time() - time;
  }
  get() {
    if (!this.running)
      return this.stoppedTime;
    else
      return this.time() - this.startTime;
  }
}
function normalize(vector) {
  vector.normalize();
  return vector;
}
class RealtimeRenderer {
  constructor(sdf, background) {
    __publicField(this, "shader");
    __publicField(this, "target");
    __publicField(this, "targetFinal");
    __publicField(this, "sdf");
    __publicField(this, "background");
    __publicField(this, "enableShadows", true);
    __publicField(this, "aoStrength", 1);
    __publicField(this, "sunDirection", new THREE.Vector3(-0.5, -2, -1));
    __publicField(this, "sunColor", new THREE.Vector3(1, 1, 1));
    __publicField(this, "roughness", 1);
    __publicField(this, "epsilon", 1e-4);
    __publicField(this, "adaptiveEpsilon", true);
    __publicField(this, "epsilonScale", 1e-3);
    __publicField(this, "color", new THREE.Color(1, 1, 1));
    __publicField(this, "timer", new Timer());
    __publicField(this, "animationDuration", 1);
    __publicField(this, "clock", new THREE.Clock());
    __publicField(this, "framerate", 0);
    __publicField(this, "lastImage", null);
    __publicField(this, "postprocess", []);
    this.sdf = sdf;
    this.background = background;
    const size = new THREE.Vector2();
    renderer.getSize(size);
    this.target = new THREE.WebGLRenderTarget(size.x, size.y, { format: THREE.RGBAFormat, type: THREE.FloatType });
    this.targetFinal = new THREE.WebGLRenderTarget(size.x, size.y, { format: THREE.RGBAFormat, type: THREE.FloatType });
    this.shader = createShader(core + simple + sdf.getCode() + background.getCode(), __spreadValues(__spreadValues(__spreadValues({
      rasterizerColor: { value: null },
      rasterizerDepth: { value: null },
      sunDirection: { value: normalize(this.sunDirection) },
      time: { value: 0 }
    }, Utils.createUniformsFromVariables(this, "enableShadows", "aoStrength", "sunColor", "sunDirection", "epsilon", "adaptiveEpsilon", "epsilonScale", "roughness", "color")), Utils.objectToUniforms(this.sdf, "sdf_")), Utils.objectToUniforms(this.background, "bg_")));
  }
  get time() {
    return this.timer.get();
  }
  set time(value) {
    this.timer.set(value);
  }
  renderImage(width, height, time = 0) {
    Queue.cancel();
    setAutoResize(false);
    setResolution(width, height);
    const targetSize = new THREE.Vector2(width, height);
    const textureSize = new THREE.Vector2(this.target.texture.image.width, this.target.texture.image.height);
    if (!targetSize.equals(textureSize)) {
      this.target.dispose();
      this.targetFinal.dispose();
      this.target = new THREE.WebGLRenderTarget(targetSize.x, targetSize.y, { format: THREE.RGBAFormat, type: THREE.FloatType });
      this.targetFinal = new THREE.WebGLRenderTarget(targetSize.x, targetSize.y, { format: THREE.RGBAFormat, type: THREE.FloatType });
    }
    Utils.setUniformsFromObject(this.shader, this.sdf, "sdf_");
    Utils.setUniformsFromObject(this.shader, this.background, "bg_");
    this.shader.uniforms.time.value = time;
    this.shader.uniforms.rasterizerColor.value = this.target.texture;
    this.shader.uniforms.sunDirection.value = normalize(this.sunDirection);
    Utils.setUniformsFromVariables(this.shader, this, "enableShadows", "aoStrength", "sunColor", "sunDirection", "epsilon", "adaptiveEpsilon", "epsilonScale", "roughness", "color");
    render(this.shader, this.targetFinal);
    this.lastImage = new TemporaryImage(this.targetFinal);
    return this.lastImage;
  }
  start(onFrame = () => {
  }) {
    setAutoResize(true);
    let accumulatedTime = 0;
    Queue.loop(() => {
      const interval = 1 / this.framerate;
      const delta = this.clock.getDelta();
      accumulatedTime += delta;
      if (controls instanceof FirstPersonControls)
        controls.update(delta);
      if (this.framerate !== 0 && accumulatedTime < interval)
        return;
      accumulatedTime = accumulatedTime - interval;
      onFrame();
      const size = new THREE.Vector2();
      renderer.getSize(size);
      const targetSize = new THREE.Vector2(this.target.texture.image.width, this.target.texture.image.height);
      if (!size.equals(targetSize)) {
        this.target.dispose();
        this.targetFinal.dispose();
        this.target = new THREE.WebGLRenderTarget(size.x, size.y, { format: THREE.RGBAFormat, type: THREE.FloatType });
        this.targetFinal = new THREE.WebGLRenderTarget(size.x, size.y, { format: THREE.RGBAFormat, type: THREE.FloatType });
      }
      Utils.setUniformsFromObject(this.shader, this.sdf, "sdf_");
      Utils.setUniformsFromObject(this.shader, this.background, "bg_");
      this.shader.uniforms.time.value = this.time / this.animationDuration;
      this.shader.uniforms.rasterizerColor.value = this.target.texture;
      this.shader.uniforms.sunDirection.value = normalize(this.sunDirection);
      Utils.setUniformsFromVariables(this.shader, this, "enableShadows", "aoStrength", "sunColor", "sunDirection", "epsilon", "adaptiveEpsilon", "epsilonScale", "roughness", "color");
      render(this.shader, this.targetFinal);
      this.lastImage = new TemporaryImage(this.targetFinal);
      this.lastImage.postprocess(...this.postprocess).show();
    });
  }
}
var position = "vec3 shading() {\n    return pixelRaycast().position;\n}";
var normal = "vec3 shading() {\n    return pixelRaycast().normal;\n}";
var edges = "uniform sampler2D positionTexture;\nuniform sampler2D normalTexture;\n\nuniform vec3 backgroundColor;\nuniform vec3 lineColor;\n\nstruct Pixel {\n    vec3 position;\n    vec3 normal;\n};\n\nPixel pixel(int x, int y) {\n    vec2 uv = (gl_FragCoord.xy + vec2(x, y)) / resolution;\n\n    Pixel pixel;\n    pixel.position = texture2D(positionTexture, uv).xyz;\n    pixel.normal = texture2D(normalTexture, uv).xyz;\n\n    return pixel;\n}\n\nvec3 shading() {\n    \n\n    Pixel center = pixel(0, 0);\n\n    float distanceFromCamera = length(center.position - cameraPos);\n\n    if(distanceFromCamera < 2.0 * epsilon) return backgroundColor; \n\n    bool edge = false;\n\n    for(int x = 0; x <= 1; ++x) {\n        for(int y = 0; y <= 1; ++y) {\n            Pixel nearby = pixel(x, y);\n\n            float dist = length(nearby.position - center.position);\n            vec3 towards = normalize(nearby.position - center.position);\n\n            if(\n                dot(center.normal, nearby.normal) < 0.9 && center.normal != vec3(0)||\n                abs(dot(center.normal, towards)) > max(distanceFromCamera * 0.1, 0.1) && dist > 2.0 * epsilon ||\n                center.normal == vec3(0) && nearby.normal != vec3(0)\n            )\n                edge = true;\n        }\n    }\n\n    \n    return edge ? lineColor : backgroundColor;\n}";
var expandLines = "uniform float lineWidth;\nuniform vec3 lineColor;\nuniform vec3 backgroundColor;\nuniform sampler2D linesTexture;\n\nvec3 pixel(int x, int y) {\n    return texture2D(linesTexture, (gl_FragCoord.xy + vec2(x, y)) / resolution).xyz;\n}\n\nvec3 shading() {\n    float radius = max(0.0, (min(lineWidth, 10.0) - 1.0) * 0.5);\n    int grid = int(ceil(radius));\n\n    for(int x = -grid; x <= grid; ++x) {\n        for(int y = -grid; y <= grid; ++y) {\n            if(sqrt(float(x * x + y * y)) <= radius && pixel(x, y) == lineColor) {\n                return lineColor;\n            } \n        }\n    }\n    return backgroundColor;\n}";
class EdgeRenderer {
  constructor(sdf) {
    __publicField(this, "positionShader");
    __publicField(this, "normalShader");
    __publicField(this, "edgesShader");
    __publicField(this, "expandShader");
    __publicField(this, "position");
    __publicField(this, "normal");
    __publicField(this, "edges");
    __publicField(this, "expanded");
    __publicField(this, "sdf");
    __publicField(this, "epsilon", 1e-5);
    __publicField(this, "backgroundColor", new THREE.Color(1, 1, 1));
    __publicField(this, "lineColor", new THREE.Color(0, 0, 0));
    __publicField(this, "lineWidth", 1);
    __publicField(this, "clock");
    this.sdf = sdf;
    const size = new THREE.Vector2();
    renderer.getSize(size);
    this.clock = new THREE.Clock();
    this.position = new THREE.WebGLRenderTarget(size.x, size.y, { format: THREE.RGBAFormat, type: THREE.FloatType });
    this.normal = new THREE.WebGLRenderTarget(size.x, size.y, { format: THREE.RGBAFormat, type: THREE.FloatType });
    this.edges = new THREE.WebGLRenderTarget(size.x, size.y, { format: THREE.RGBAFormat, type: THREE.FloatType });
    this.expanded = new THREE.WebGLRenderTarget(size.x, size.y, { format: THREE.RGBAFormat, type: THREE.FloatType });
    const uniforms = __spreadValues({
      epsilon: { value: this.epsilon }
    }, Utils.objectToUniforms(this.sdf, "sdf_"));
    this.positionShader = createShader(core + position + sdf.getCode(), uniforms);
    this.normalShader = createShader(core + normal + sdf.getCode(), uniforms);
    this.edgesShader = createShader(core + edges + sdf.getCode(), __spreadProps(__spreadValues({}, Utils.createUniformsFromVariables(this, "backgroundColor", "lineColor")), {
      positionTexture: { value: this.position.texture },
      normalTexture: { value: this.normal.texture }
    }));
    this.expandShader = createShader(core + expandLines + sdf.getCode(), __spreadProps(__spreadValues({}, Utils.createUniformsFromVariables(this, "backgroundColor", "lineColor", "lineWidth")), {
      linesTexture: { value: this.edges.texture }
    }));
  }
  setUniforms(shader) {
    Utils.setUniformsFromObject(shader, this.sdf, "sdf_");
    shader.uniforms.epsilon.value = this.epsilon;
  }
  renderImage(width, height) {
    return new Promise((resolve) => {
      Queue.once(() => {
        setAutoResize(false);
        setResolution(width, height);
        const targetSize = new THREE.Vector2(width, height);
        const textureSize = new THREE.Vector2(this.position.texture.image.width, this.position.texture.image.height);
        if (!targetSize.equals(textureSize)) {
          this.position.dispose();
          this.normal.dispose();
          this.edges.dispose();
          this.expanded.dispose();
          this.position = new THREE.WebGLRenderTarget(targetSize.x, targetSize.y, { format: THREE.RGBAFormat, type: THREE.FloatType });
          this.normal = new THREE.WebGLRenderTarget(targetSize.x, targetSize.y, { format: THREE.RGBAFormat, type: THREE.FloatType });
          this.edges = new THREE.WebGLRenderTarget(targetSize.x, targetSize.y, { format: THREE.RGBAFormat, type: THREE.FloatType });
          this.expanded = new THREE.WebGLRenderTarget(targetSize.x, targetSize.y, { format: THREE.RGBAFormat, type: THREE.FloatType });
        }
        this.setUniforms(this.positionShader);
        render(this.positionShader, this.position);
        this.setUniforms(this.normalShader);
        render(this.normalShader, this.normal);
        this.edgesShader.uniforms.positionTexture.value = this.position.texture;
        this.edgesShader.uniforms.normalTexture.value = this.normal.texture;
        Utils.setUniformsFromVariables(this.edgesShader, this, "backgroundColor", "lineColor"), render(this.edgesShader, this.edges);
        this.expandShader.uniforms.linesTexture.value = this.edges.texture;
        Utils.setUniformsFromVariables(this.expandShader, this, "backgroundColor", "lineColor", "lineWidth"), render(this.expandShader, this.expanded);
        copyAA(this.expanded, null);
        resolve();
      });
    });
  }
  start() {
    setAutoResize(true);
    Queue.loop(() => {
      const screenSize2 = new THREE.Vector2();
      renderer.getSize(screenSize2);
      const textureSize = new THREE.Vector2(this.position.texture.image.width, this.position.texture.image.height);
      if (!screenSize2.equals(textureSize)) {
        this.position.dispose();
        this.normal.dispose();
        this.edges.dispose();
        this.expanded.dispose();
        const floorX = Math.floor(screenSize2.x);
        const floorY = Math.floor(screenSize2.y);
        this.position = new THREE.WebGLRenderTarget(floorX, floorY, { format: THREE.RGBAFormat, type: THREE.FloatType });
        this.normal = new THREE.WebGLRenderTarget(floorX, floorY, { format: THREE.RGBAFormat, type: THREE.FloatType });
        this.edges = new THREE.WebGLRenderTarget(floorX, floorY, { format: THREE.RGBAFormat, type: THREE.FloatType });
        this.expanded = new THREE.WebGLRenderTarget(floorX, floorY, { format: THREE.RGBAFormat, type: THREE.FloatType });
      }
      this.setUniforms(this.positionShader);
      render(this.positionShader, this.position);
      this.setUniforms(this.normalShader);
      render(this.normalShader, this.normal);
      this.edgesShader.uniforms.positionTexture.value = this.position.texture;
      this.edgesShader.uniforms.normalTexture.value = this.normal.texture;
      Utils.setUniformsFromVariables(this.edgesShader, this, "backgroundColor", "lineColor"), render(this.edgesShader, this.edges);
      this.expandShader.uniforms.linesTexture.value = this.edges.texture;
      Utils.setUniformsFromVariables(this.expandShader, this, "backgroundColor", "lineColor", "lineWidth"), render(this.expandShader, this.expanded);
      copyAA(this.expanded, null);
    });
  }
}
export { ColorBackground, CustomSDF, DepthRenderer, EdgeRenderer, HemisphereBackground, ImageBackground, Mandelbulb, Menger, PathTracer, Queue, RealtimeRenderer, Sierpinski, camera, controls, init };
