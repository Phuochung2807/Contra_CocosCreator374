import { _decorator, Component, Node, EventTouch, Vec2, Vec3, UITransform, UIOpacity } from 'cc';
import { IInputSource } from './IInputSource';
import { EventManager } from '../../core/EventManager';
import { GameManager, GameState } from '../../core/GameManager';

const { ccclass, property } = _decorator;

const _tmpWorldPos = new Vec3();
const _tmpLocalPos = new Vec3();
const DEAD_ZONE = 5;
const FADE_IN_DURATION = 0.1;
const FADE_OUT_DURATION = 0.25;

@ccclass('JoystickInput')
export class JoystickInput extends Component implements IInputSource {
    @property(Node)
    touchArea: Node | null = null;

    @property(Node)
    outerRing: Node | null = null;

    @property(Node)
    innerKnob: Node | null = null;

    @property(Node)
    dashButton: Node | null = null;

    @property
    maxRadius = 80;

    private _moveDir: Vec2 = new Vec2(0, 0);
    private _dashPressed = false;
    private _tracking = false;
    private _parentUT: UITransform | null = null;
    private _opacity: UIOpacity | null = null;
    private _touchStartUI: Vec2 = new Vec2();
    private _fadeTarget = 0;
    private _fadeSpeed = 0;

    onLoad(): void {
        if (this.outerRing) {
            this._opacity = this.outerRing.getComponent(UIOpacity) || this.outerRing.addComponent(UIOpacity);
            this._opacity.opacity = 0;
            if (this.outerRing.parent) {
                this._parentUT = this.outerRing.parent.getComponent(UITransform);
            }
        }
        // Start disabled — only active during Playing
        this._setActive(false);
    }

    onEnable(): void {
        EventManager.on('game_state_changed', this._onStateChanged);
        if (this.touchArea) {
            this.touchArea.on(Node.EventType.TOUCH_START, this._onTouchStart, this);
            this.touchArea.on(Node.EventType.TOUCH_MOVE, this._onTouchMove, this);
            this.touchArea.on(Node.EventType.TOUCH_END, this._onTouchEnd, this);
            this.touchArea.on(Node.EventType.TOUCH_CANCEL, this._onTouchEnd, this);
        }
        if (this.dashButton) {
            this.dashButton.on(Node.EventType.TOUCH_START, this._onDashPressed, this);
        }
    }

    onDisable(): void {
        EventManager.off('game_state_changed', this._onStateChanged);
        if (this.touchArea) {
            this.touchArea.off(Node.EventType.TOUCH_START, this._onTouchStart, this);
            this.touchArea.off(Node.EventType.TOUCH_MOVE, this._onTouchMove, this);
            this.touchArea.off(Node.EventType.TOUCH_END, this._onTouchEnd, this);
            this.touchArea.off(Node.EventType.TOUCH_CANCEL, this._onTouchEnd, this);
        }
        if (this.dashButton) {
            this.dashButton.off(Node.EventType.TOUCH_START, this._onDashPressed, this);
        }
    }

    private _onStateChanged = (state: string): void => {
        this._setActive(state === GameState.Playing);
    };

    private _setActive(active: boolean): void {
        if (this.touchArea) this.touchArea.active = active;
        if (!active) {
            this._tracking = false;
            this._moveDir.x = 0;
            this._moveDir.y = 0;
            if (this.innerKnob) this.innerKnob.setPosition(0, 0, 0);
            if (this._opacity) this._opacity.opacity = 0;
        }
    }

    getMovement(): { x: number; y: number } {
        return this._moveDir;
    }

    isDashPressed(): boolean {
        if (this._dashPressed) {
            this._dashPressed = false;
            return true;
        }
        return false;
    }

    private _onTouchStart(event: EventTouch): void {
        if (!this.outerRing || !this.innerKnob) return;

        this._tracking = true;

        // Remember touch origin in UI (screen) space
        const touch = event.getUILocation();
        this._touchStartUI.set(touch.x, touch.y);

        // Move entire joystick to touch position
        if (this._parentUT) {
            _tmpWorldPos.set(touch.x, touch.y, 0);
            this._parentUT.convertToNodeSpaceAR(_tmpWorldPos, _tmpLocalPos);
            this.outerRing.setPosition(_tmpLocalPos.x, _tmpLocalPos.y, 0);
        }

        // Reset knob to center of outerRing
        this.innerKnob.setPosition(0, 0, 0);
        this._moveDir.x = 0;
        this._moveDir.y = 0;

        // Fade in
        this._fadeIn();
    }

    private _onTouchMove(event: EventTouch): void {
        if (!this._tracking) return;
        this._updateKnob(event);
    }

    private _onTouchEnd(): void {
        this._tracking = false;
        this._moveDir.x = 0;
        this._moveDir.y = 0;
        if (this.innerKnob) {
            this.innerKnob.setPosition(0, 0, 0);
        }

        // Fade out
        this._fadeOut();
    }

    private _updateKnob(event: EventTouch): void {
        if (!this.innerKnob) return;

        // Offset from touch-start in screen-space = offset in local-space
        // (UI coordinate system has same scale/rotation as local joystick space)
        const touch = event.getUILocation();
        const dx = touch.x - this._touchStartUI.x;
        const dy = touch.y - this._touchStartUI.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < DEAD_ZONE) {
            this._moveDir.x = 0;
            this._moveDir.y = 0;
            this.innerKnob.setPosition(0, 0, 0);
            return;
        }

        // Clamp to maxRadius
        const clampedDist = Math.min(dist, this.maxRadius);
        const ratio = clampedDist / dist;
        this.innerKnob.setPosition(dx * ratio, dy * ratio, 0);

        // Normalize direction
        this._moveDir.x = dx / dist;
        this._moveDir.y = dy / dist;
    }

    update(dt: number): void {
        if (!this._opacity || this._fadeSpeed === 0) return;
        const cur = this._opacity.opacity;
        if ((this._fadeSpeed > 0 && cur >= this._fadeTarget) ||
            (this._fadeSpeed < 0 && cur <= this._fadeTarget)) {
            this._opacity.opacity = this._fadeTarget;
            this._fadeSpeed = 0;
            return;
        }
        this._opacity.opacity = Math.round(Math.min(255, Math.max(0, cur + this._fadeSpeed * dt)));
    }

    private _fadeIn(): void {
        if (!this._opacity) return;
        this._opacity.opacity = 255;
        this._fadeTarget = 255;
        this._fadeSpeed = 0;
    }

    private _fadeOut(): void {
        if (!this._opacity) return;
        this._fadeTarget = 0;
        this._fadeSpeed = -255 / FADE_OUT_DURATION;
    }

    private _onDashPressed(): void {
        this._dashPressed = true;
    }
}
