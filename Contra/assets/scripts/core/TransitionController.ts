import { _decorator, Component, Node, tween, Tween, Vec3 } from 'cc';
import { GameConfig } from '../config/GameConfig';
import { ArenaManager } from '../map/ArenaManager';
import { BulletPool } from '../bullet/BulletPool';

const { ccclass, property } = _decorator;

@ccclass('TransitionController')
export class TransitionController extends Component {
    @property(Node)
    playerNode: Node | null = null;

    @property(Node)
    bossNode: Node | null = null;

    @property(Node)
    bulletWorldNode: Node | null = null;

    private _tweens: Tween<any>[] = [];

    hideEntities(): void {
        if (this.playerNode) this.playerNode.active = false;
        if (this.bossNode) this.bossNode.active = false;
        this._releaseAllBullets();
    }

    playIntro(onComplete: () => void): void {
        const cfg = GameConfig.transition;

        if (!this.playerNode) {
            this._playBossIntro(cfg, onComplete);
            return;
        }

        // Player: position center, scale 0 → 1
        this.playerNode.setPosition(0, -300, 0);
        this.playerNode.setScale(0, 0, 1);
        this.playerNode.active = true;

        const playerTween = tween(this.playerNode)
            .to(cfg.introScaleDuration, { scale: new Vec3(1, 1, 1) })
            .delay(cfg.introDelayBetween)
            .call(() => { this._playBossIntro(cfg, onComplete); })
            .start();
        this._tweens.push(playerTween);
    }

    private _playBossIntro(cfg: typeof GameConfig.transition, onComplete: () => void): void {
        if (!this.bossNode) {
            onComplete();
            return;
        }

        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * cfg.bossSpawnRadius;
        let x = Math.cos(angle) * dist;
        let y = Math.sin(angle) * dist;

        const arena = ArenaManager.instance;
        if (arena) {
            const clamped = arena.clampPosition(x, y, GameConfig.boss.colliderRadius);
            x = clamped.x;
            y = clamped.y;
        }

        this.bossNode.setPosition(x, y, 0);
        this.bossNode.setScale(0, 0, 1);
        this.bossNode.active = true;

        const bossTween = tween(this.bossNode)
            .to(cfg.introScaleDuration, { scale: new Vec3(1, 1, 1) })
            .call(() => { onComplete(); })
            .start();
        this._tweens.push(bossTween);
    }

    playDeath(who: 'player' | 'boss', onComplete: () => void): void {
        this._releaseAllBullets();

        const targetNode = who === 'player' ? this.playerNode : this.bossNode;
        if (!targetNode) {
            onComplete();
            return;
        }

        const cfg = GameConfig.transition;
        const blinkInterval = cfg.deathBlinkDuration / (cfg.deathBlinkCount * 2);

        // Build blink chain: toggle active on/off
        let t = tween(targetNode);
        for (let i = 0; i < cfg.deathBlinkCount; i++) {
            t = t
                .call(() => { targetNode.active = false; })
                .delay(blinkInterval)
                .call(() => { targetNode.active = true; })
                .delay(blinkInterval);
        }
        t = t.call(() => {
            this.hideEntities();
            onComplete();
        });

        const blinkTween = t.start();
        this._tweens.push(blinkTween);
    }

    cancelAll(): void {
        for (const t of this._tweens) {
            t.stop();
        }
        this._tweens.length = 0;

        // Reset scale and hide
        if (this.playerNode) {
            this.playerNode.setScale(1, 1, 1);
            this.playerNode.active = false;
        }
        if (this.bossNode) {
            this.bossNode.setScale(1, 1, 1);
            this.bossNode.active = false;
        }
    }

    private _releaseAllBullets(): void {
        if (this.bulletWorldNode) {
            const pool = this.bulletWorldNode.getComponent(BulletPool);
            if (pool) pool.releaseAll();
        }
    }
}
