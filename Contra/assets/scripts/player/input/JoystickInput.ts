import { _decorator, Component, Node, EventTouch, Vec2, Vec3, UITransform } from 'cc';
import { IInputSource } from './IInputSource';

const { ccclass, property } = _decorator;

const _tmpWorldPos = new Vec3();
const _tmpLocalPos = new Vec3();
const DEAD_ZONE = 5;

@ccclass('JoystickInput')
export class JoystickInput extends Component implements IInputSource {
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

    onLoad(): void {
        if (this.outerRing) {
            this._outerRingUT = this.outerRing.getComponent(UITransform);
        }
    }

    onEnable(): void {
        if (this.outerRing) {
            this.outerRing.on(Node.EventType.TOUCH_START, this._onTouchStart, this);
            this.outerRing.on(Node.EventType.TOUCH_MOVE, this._onTouchMove, this);
            this.outerRing.on(Node.EventType.TOUCH_END, this._onTouchEnd, this);
            this.outerRing.on(Node.EventType.TOUCH_CANCEL, this._onTouchEnd, this);
        }
        if (this.dashButton) {
            this.dashButton.on(Node.EventType.TOUCH_START, this._onDashPressed, this);
        }
    }

    onDisable(): void {
        if (this.outerRing) {
            this.outerRing.off(Node.EventType.TOUCH_START, this._onTouchStart, this);
            this.outerRing.off(Node.EventType.TOUCH_MOVE, this._onTouchMove, this);
            this.outerRing.off(Node.EventType.TOUCH_END, this._onTouchEnd, this);
            this.outerRing.off(Node.EventType.TOUCH_CANCEL, this._onTouchEnd, this);
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
        this._tracking = true;
        this._updateKnob(event);
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
    }

    private _updateKnob(event: EventTouch): void {
        if (!this.outerRing || !this.innerKnob) return;

        const ut = this._outerRingUT;
        if (!ut) return;

        // Convert touch world position to outerRing local space
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
        const knobX = dx * ratio;
        const knobY = dy * ratio;

        this.innerKnob.setPosition(knobX, knobY, 0);

        // Normalize direction
        this._moveDir.x = dx / dist;
        this._moveDir.y = dy / dist;
    }

    private _onDashPressed(): void {
        this._dashPressed = true;
    }
}
