import { _decorator, Component, Vec3 } from 'cc';
import { IInputSource } from './input/IInputSource';
import { KeyboardInput } from './input/KeyboardInput';
import { ArenaManager } from '../map/ArenaManager';
import { GameConfig } from '../config/GameConfig';
import { GameManager, GameState } from '../core/GameManager';

const { ccclass } = _decorator;

const _tmpVec3 = new Vec3();

@ccclass('PlayerController')
export class PlayerController extends Component {
    private _inputSource: IInputSource | null = null;

    get inputSource(): IInputSource | null {
        return this._inputSource;
    }

    onLoad(): void {
        let kb = this.getComponent(KeyboardInput);
        if (!kb) {
            kb = this.addComponent(KeyboardInput);
        }
        this._inputSource = kb;
    }

    setInputSource(source: IInputSource): void {
        this._inputSource = source;
    }

    onDestroy(): void {
        this._inputSource = null;
    }

    update(dt: number): void {
        if (!GameManager.instance || GameManager.instance.state !== GameState.Playing) return;
        if (!this._inputSource) return;

        const move = this._inputSource.getMovement();
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
