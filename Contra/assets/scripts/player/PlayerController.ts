import { _decorator, Component, Vec3 } from 'cc';
import { KeyboardInput } from './input/KeyboardInput';
import { JoystickInput } from './input/JoystickInput';
import { ArenaManager } from '../map/ArenaManager';
import { GameConfig } from '../config/GameConfig';
import { GameManager, GameState } from '../core/GameManager';

const { ccclass } = _decorator;

const _tmpVec3 = new Vec3();

@ccclass('PlayerController')
export class PlayerController extends Component {
    private _keyboard: KeyboardInput | null = null;
    private _joystick: JoystickInput | null = null;

    get inputSource(): IInputSource | null {
        return this._keyboard;
    }

    get joystickSource(): IInputSource | null {
        return this._joystick;
    }

    onLoad(): void {
        let kb = this.getComponent(KeyboardInput);
        if (!kb) {
            kb = this.addComponent(KeyboardInput);
        }
        this._keyboard = kb;
    }

    setJoystick(joystick: JoystickInput): void {
        this._joystick = joystick;
    }

    onDestroy(): void {
        this._keyboard = null;
        this._joystick = null;
    }

    getMovement(): { x: number; y: number } {
        // Joystick takes priority when actively touching
        if (this._joystick) {
            const jm = this._joystick.getMovement();
            if (jm.x !== 0 || jm.y !== 0) return jm;
        }
        if (this._keyboard) {
            return this._keyboard.getMovement();
        }
        return { x: 0, y: 0 };
    }

    isDashPressed(): boolean {
        const kbDash = this._keyboard ? this._keyboard.isDashPressed() : false;
        const jsDash = this._joystick ? this._joystick.isDashPressed() : false;
        return kbDash || jsDash;
    }

    update(dt: number): void {
        if (!GameManager.instance || GameManager.instance.state !== GameState.Playing) return;

        const move = this.getMovement();
        if (move.x === 0 && move.y === 0) return;

        this.node.getPosition(_tmpVec3);
        _tmpVec3.x += move.x * GameConfig.player.speed * dt;
        _tmpVec3.y += move.y * GameConfig.player.speed * dt;

        const arena = ArenaManager.instance;
        if (arena) {
            const clamped = arena.clampPosition(_tmpVec3.x, _tmpVec3.y, GameConfig.player.colliderRadius);
            _tmpVec3.x = clamped.x;
            _tmpVec3.y = clamped.y;
        }

        this.node.setPosition(_tmpVec3);
    }
}
