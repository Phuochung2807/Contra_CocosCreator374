import { _decorator, Component, input, Input, EventKeyboard, KeyCode, Vec2 } from 'cc';
import { IInputSource } from './IInputSource';

const { ccclass } = _decorator;

@ccclass('KeyboardInput')
export class KeyboardInput extends Component implements IInputSource {
    private _moveDir: Vec2 = new Vec2();
    private _keys: Set<KeyCode> = new Set();
    private _dashPressed = false;

    private _onKeyDown = (event: EventKeyboard): void => {
        this._keys.add(event.keyCode);
        if (event.keyCode === KeyCode.SPACE || event.keyCode === KeyCode.SHIFT_LEFT) {
            this._dashPressed = true;
        }
    };

    private _onKeyUp = (event: EventKeyboard): void => {
        this._keys.delete(event.keyCode);
        if (event.keyCode === KeyCode.SPACE || event.keyCode === KeyCode.SHIFT_LEFT) {
            this._dashPressed = false;
        }
    };

    onLoad(): void {
        input.on(Input.EventType.KEY_DOWN, this._onKeyDown);
        input.on(Input.EventType.KEY_UP, this._onKeyUp);
    }

    getMovement(): Vec2 {
        let x = 0;
        let y = 0;

        if (this._keys.has(KeyCode.KEY_A) || this._keys.has(KeyCode.ARROW_LEFT)) x -= 1;
        if (this._keys.has(KeyCode.KEY_D) || this._keys.has(KeyCode.ARROW_RIGHT)) x += 1;
        if (this._keys.has(KeyCode.KEY_W) || this._keys.has(KeyCode.ARROW_UP)) y += 1;
        if (this._keys.has(KeyCode.KEY_S) || this._keys.has(KeyCode.ARROW_DOWN)) y -= 1;

        this._moveDir.set(x, y);
        if (x !== 0 && y !== 0) {
            this._moveDir.normalize();
        }
        return this._moveDir;
    }

    isDashPressed(): boolean {
        if (this._dashPressed) {
            this._dashPressed = false;
            return true;
        }
        return false;
    }

    onDestroy(): void {
        input.off(Input.EventType.KEY_DOWN, this._onKeyDown);
        input.off(Input.EventType.KEY_UP, this._onKeyUp);
    }
}
