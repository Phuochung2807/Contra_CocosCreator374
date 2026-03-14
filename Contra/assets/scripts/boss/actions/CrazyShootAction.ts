import { IBossAction, IBossActionContext } from './IBossAction';
import { BulletFactory } from '../../bullet/BulletFactory';
import { BulletOwner } from '../../bullet/BulletData';
import { GameConfig } from '../../config/GameConfig';

export class CrazyShootAction implements IBossAction {
    readonly name = 'crazyShoot';

    private _bulletCountMult: number;
    private _bulletSpeedMult: number;
    private _fired = false;

    constructor(bulletCountMult = 1.0, bulletSpeedMult = 1.0) {
        this._bulletCountMult = bulletCountMult;
        this._bulletSpeedMult = bulletSpeedMult;
    }

    enter(_ctx: IBossActionContext): void {
        this._fired = false;
    }

    update(ctx: IBossActionContext, _dt: number): void {
        if (this._fired) return;
        if (!ctx.bulletPool) return;

        const bpos = ctx.bossNode.position;
        const ppos = ctx.playerNode.position;
        const dx = ppos.x - bpos.x;
        const dy = ppos.y - bpos.y;

        const count = Math.round(GameConfig.boss.crazyFanCount * this._bulletCountMult);
        const speed = GameConfig.boss.bulletSpeed * this._bulletSpeedMult;

        BulletFactory.spawnFan(
            ctx.bulletPool,
            BulletOwner.Boss,
            bpos.x, bpos.y,
            dx, dy,
            speed, GameConfig.boss.bulletRadius,
            GameConfig.boss.bulletLifetime, GameConfig.damage.bossBullet,
            GameConfig.boss.crazyFanSpread, count,
        );

        this._fired = true;
    }

    isComplete(): boolean {
        return this._fired;
    }

    exit(_ctx: IBossActionContext): void {}
}
