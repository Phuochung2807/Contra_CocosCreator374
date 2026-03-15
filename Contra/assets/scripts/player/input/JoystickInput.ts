import { _decorator, Component, Node, EventTouch, Vec2, Vec3, UITransform, UIOpacity, tween, Tween } from 'cc';
import { IInputSource } from './IInputSource';

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
    private _outerRingUT: UITransform | null = null;
    private _parentUT: UITransform | null = null;
    private _opacity: UIOpacity | null = null;

    onLoad(): void {
        if (this.outerRing) {
            this._outerRingUT = this.outerRing.getComponent(UITransform);
            this._opacity = this.outerRing.getComponent(UIOpacity) || this.outerRing.addComponent(UIOpacity);
            this._opacity.opacity = 0;
            if (this.outerRing.parent) {
                this._parentUT = this.outerRing.parent.getComponent(UITransform);
            }
        }
    }

    onEnable(): void {
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

        // Move joystick to touch position
        const touch = event.getUILocation();
        if (this._parentUT) {
            _tmpWorldPos.set(touch.x, touch.y, 0);
            this._parentUT.convertToNodeSpaceAR(_tmpWorldPos, _tmpLocalPos);
            this.outerRing.setPosition(_tmpLocalPos.x, _tmpLocalPos.y, 0);
        }

        // Reset knob
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
        if (!this.outerRing || !this.innerKnob) return;

        const ut = this._outerRingUT;
        if (!ut) return;

        const touch = event.getUILocation();
        _tmpWorldPos.set(touch.x, touch.y, 0);
        ut.convertToNodeSpaceAR(_tmpWorldPos, _tmpLocalPos);

        const dx = _tmpLocalPos.x;
        const dy = _tmpLocalPos.y;
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

    private _fadeIn(): void {
        if (!this._opacity) return;
        Tween.stopAllByTarget(this._opacity);
        tween(this._opacity)
            .to(FADE_IN_DURATION, { opacity: 255 })
            .start();
    }

    private _fadeOut(): void {
        if (!this._opacity) return;
        Tween.stopAllByTarget(this._opacity);
        tween(this._opacity)
            .to(FADE_OUT_DURATION, { opacity: 0 })
            .start();
    }

    private _onDashPressed(): void {
        this._dashPressed = true;
    }
}
