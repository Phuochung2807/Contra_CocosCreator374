import { _decorator, Component, Node } from 'cc';
import { BulletPool } from '../bullet/BulletPool';
import { BulletFactory } from '../bullet/BulletFactory';
import { BulletOwner } from '../bullet/BulletData';
import { GameConfig } from '../config/GameConfig';
import { GameManager, GameState } from '../core/GameManager';

const { ccclass, property } = _decorator;

@ccclass('ShootComponent')
export class ShootComponent extends Component {
    @property(Node)
    targetNode: Node | null = null;

    @property(Node)
    bulletPoolNode: Node | null = null;

    @property
    cooldown: number = 0.15;

    @property
    range: number = 1200;

    @property
    bulletSpeed: number = 800;

    @property
    bulletRadius: number = 8;

    @property
    bulletLifetime: number = 2.0;

    @property
    bulletDamage: number = 10;

    @property
    owner: number = 0; // 0 = Player, 1 = Boss

    private _timer = 0;
    private _pool: BulletPool | null = null;

    start(): void {
        if (this.bulletPoolNode) {
            this._pool = this.bulletPoolNode.getComponent(BulletPool);
        }
        // Apply config as defaults — Inspector values override if changed
        if (this.owner === BulletOwner.Player) {
            this.cooldown = GameConfig.player.shootCooldown;
            this.range = GameConfig.player.shootRange;
            this.bulletSpeed = GameConfig.player.bulletSpeed;
            this.bulletRadius = GameConfig.player.bulletRadius;
            this.bulletLifetime = GameConfig.player.bulletLifetime;
            this.bulletDamage = GameConfig.damage.playerBullet;
        }
    }

    update(dt: number): void {
        if (!GameManager.instance || GameManager.instance.state !== GameState.Playing) return;
        if (!this._pool || !this.targetNode) return;

        this._timer += dt;
        if (this._timer < this.cooldown) return;

        const myPos = this.node.position;
        const tPos = this.targetNode.position;
        const dx = tPos.x - myPos.x;
        const dy = tPos.y - myPos.y;
        const distSq = dx * dx + dy * dy;

        if (distSq > this.range * this.range) {
            this._timer = this.cooldown;
            return;
        }

        this._timer = 0;

        BulletFactory.spawnSingle(
            this._pool,
            this.owner as BulletOwner,
            myPos.x, myPos.y,
            dx, dy,
            this.bulletSpeed, this.bulletRadius,
            this.bulletLifetime, this.bulletDamage,
        );
    }
}
