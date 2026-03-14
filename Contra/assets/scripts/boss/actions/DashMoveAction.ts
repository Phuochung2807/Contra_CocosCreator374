import { Vec3 } from 'cc';
import { IBossAction, IBossActionContext } from './IBossAction';
import { GameConfig } from '../../config/GameConfig';
import { ArenaManager } from '../../map/ArenaManager';

const _tmpVec3 = new Vec3();

export class DashMoveAction implements IBossAction {
    readonly name = 'dashMove';

    private _speedMult: number;
    private _elapsed = 0;
    private _dirX = 0;
    private _dirY = 0;

    constructor(speedMult = 1.0) {
        this._speedMult = speedMult;
    }

    enter(ctx: IBossActionContext): void {
        this._elapsed = 0;

        // Lock direction toward player at moment of enter
        const bpos = ctx.bossNode.position;
        const ppos = ctx.playerNode.position;
        const dx = ppos.x - bpos.x;
        const dy = ppos.y - bpos.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) {
            this._dirX = dx / len;
            this._dirY = dy / len;
        } else {
            this._dirX = 0;
            this._dirY = 1;
        }
    }

    update(ctx: IBossActionContext, dt: number): void {
        this._elapsed += dt;

        const speed = GameConfig.boss.dashSpeed * this._speedMult;
        const bpos = ctx.bossNode.position;
        _tmpVec3.set(
            bpos.x + this._dirX * speed * dt,
            bpos.y + this._dirY * speed * dt,
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
        return this._elapsed >= GameConfig.boss.dashDuration;
    }

    exit(_ctx: IBossActionContext): void {}
}
