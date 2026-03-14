import { Vec3 } from 'cc';
import { IBossAction, IBossActionContext } from './IBossAction';
import { GameConfig } from '../../config/GameConfig';
import { ArenaManager } from '../../map/ArenaManager';

const _tmpVec3 = new Vec3();

export class NormalMoveAction implements IBossAction {
    readonly name = 'normalMove';

    private _duration: number;
    private _speedMult: number;
    private _elapsed = 0;

    constructor(duration = 1.5, speedMult = 1.0) {
        this._duration = duration;
        this._speedMult = speedMult;
    }

    enter(_ctx: IBossActionContext): void {
        this._elapsed = 0;
    }

    update(ctx: IBossActionContext, dt: number): void {
        this._elapsed += dt;

        const bpos = ctx.bossNode.position;
        const ppos = ctx.playerNode.position;
        let dx = ppos.x - bpos.x;
        let dy = ppos.y - bpos.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) {
            dx /= len;
            dy /= len;
        }

        const speed = GameConfig.boss.speed * this._speedMult;
        _tmpVec3.set(
            bpos.x + dx * speed * dt,
            bpos.y + dy * speed * dt,
            0,
        );

        const arena = ArenaManager.instance;
        if (arena) {
            const clamped = arena.clampPosition(_tmpVec3.x, _tmpVec3.y, GameConfig.boss.colliderRadius);
            _tmpVec3.x = clamped.x;
            _tmpVec3.y = clamped.y;
        }

        ctx.bossNode.setPosition(_tmpVec3);
    }

    isComplete(): boolean {
        return this._elapsed >= this._duration;
    }

    exit(_ctx: IBossActionContext): void {}
}
