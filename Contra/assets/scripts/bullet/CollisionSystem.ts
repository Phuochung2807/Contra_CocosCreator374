import { _decorator, Component, Node } from 'cc';
import { BulletPool } from './BulletPool';
import { BulletOwner } from './BulletData';
import { HealthComponent } from '../entity/HealthComponent';
import { EventManager } from '../core/EventManager';
import { GameManager, GameState } from '../core/GameManager';
import { GameConfig } from '../config/GameConfig';
import { BossController } from '../boss/BossController';
import { ArenaManager } from '../map/ArenaManager';

const { ccclass, property } = _decorator;

@ccclass('CollisionSystem')
export class CollisionSystem extends Component {
    @property(BulletPool)
    pool: BulletPool | null = null;

    @property(Node)
    playerNode: Node | null = null;

    @property(Node)
    bossNode: Node | null = null;

    private _playerHealth: HealthComponent | null = null;
    private _bossHealth: HealthComponent | null = null;
    private _bossCtrl: BossController | null = null;

    start(): void {
        if (this.playerNode) {
            this._playerHealth = this.playerNode.getComponent(HealthComponent);
        }
        if (this.bossNode) {
            this._bossHealth = this.bossNode.getComponent(HealthComponent);
            this._bossCtrl = this.bossNode.getComponent(BossController);
        }
    }

    refreshRefs(): void {
        if (this.playerNode) {
            this._playerHealth = this.playerNode.getComponent(HealthComponent);
        }
        if (this.bossNode) {
            this._bossHealth = this.bossNode.getComponent(HealthComponent);
            this._bossCtrl = this.bossNode.getComponent(BossController);
        }
    }

    update(dt: number): void {
        if (!GameManager.instance || GameManager.instance.state !== GameState.Playing) return;
        if (!this.pool) return;

        const data = this.pool.data;

        for (let i = 0; i < data.length; i++) {
            const d = data[i];
            if (!d.active) continue;

            if (d.owner === BulletOwner.Player && this.bossNode && this._bossHealth) {
                const bpos = this.bossNode.position;
                const dx = d.posX - bpos.x;
                const dy = d.posY - bpos.y;
                const distSq = dx * dx + dy * dy;
                const rSum = d.radius + GameConfig.boss.colliderRadius;
                if (distSq <= rSum * rSum) {
                    if (this._bossHealth.takeDamage(d.damage)) {
                        EventManager.emit('bullet_hit_boss', d.damage);
                        EventManager.emit('boss_damaged', d.damage);
                        if (this._bossHealth.isDead) {
                            EventManager.emit('boss_died');
                        }
                    }
                    this.pool.release(d);
                    continue;
                }
            }

            if (d.owner === BulletOwner.Boss && this.playerNode && this._playerHealth) {
                const ppos = this.playerNode.position;
                const dx = d.posX - ppos.x;
                const dy = d.posY - ppos.y;
                const distSq = dx * dx + dy * dy;
                const rSum = d.radius + GameConfig.player.colliderRadius;
                if (distSq <= rSum * rSum) {
                    if (this._playerHealth.takeDamage(d.damage)) {
                        EventManager.emit('bullet_hit_player', d.damage);
                        EventManager.emit('player_damaged', d.damage);
                        if (this._playerHealth.isDead) {
                            EventManager.emit('player_died');
                        }
                    }
                    this.pool.release(d);
                    continue;
                }
            }
        }

        this._resolveEntityCollision();
    }

    private _resolveEntityCollision(): void {
        if (!this.playerNode || !this.bossNode) return;

        const ppos = this.playerNode.position;
        const bpos = this.bossNode.position;

        const dx = ppos.x - bpos.x;
        const dy = ppos.y - bpos.y;
        const distSq = dx * dx + dy * dy;

        const pRad = GameConfig.player.colliderRadius;
        const bRad = GameConfig.boss.colliderRadius;
        const minSep = pRad + bRad;
        const minSepSq = minSep * minSep;

        if (distSq >= minSepSq) return;

        let dist = Math.sqrt(distSq);
        let nx = dx, ny = dy;
        if (dist < 0.001) { nx = 1; ny = 0; dist = 0.001; }
        else { nx /= dist; ny /= dist; }

        const overlap = minSep - dist;
        const cfg = GameConfig.collision;
        const isDashing = this._bossCtrl?.isDashing ?? false;

        let playerPush: number;
        let bossPush: number;

        if (isDashing) {
            playerPush = overlap * cfg.dashPushMultiplier;
            bossPush = 0;
        } else {
            playerPush = overlap * cfg.playerWeight;
            bossPush = overlap * (1 - cfg.playerWeight);
        }

        const px = ppos.x + nx * playerPush;
        const py = ppos.y + ny * playerPush;
        const bx = bpos.x - nx * bossPush;
        const by = bpos.y - ny * bossPush;

        const arena = ArenaManager.instance;
        if (arena) {
            const cp = arena.clampPosition(px, py, pRad);
            this.playerNode.setPosition(cp.x, cp.y, 0);
            const cb = arena.clampPosition(bx, by, bRad);
            this.bossNode.setPosition(cb.x, cb.y, 0);
        } else {
            this.playerNode.setPosition(px, py, 0);
            this.bossNode.setPosition(bx, by, 0);
        }
    }
}
