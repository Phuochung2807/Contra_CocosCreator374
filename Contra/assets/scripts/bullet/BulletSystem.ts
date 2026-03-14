import { _decorator, Component } from 'cc';
import { BulletPool } from './BulletPool';
import { GameManager, GameState } from '../core/GameManager';
import { ArenaManager } from '../map/ArenaManager';

const { ccclass, property } = _decorator;

@ccclass('BulletSystem')
export class BulletSystem extends Component {
    @property(BulletPool)
    pool: BulletPool | null = null;

    update(dt: number): void {
        if (!GameManager.instance || GameManager.instance.state !== GameState.Playing) return;
        if (!this.pool) return;

        const data = this.pool.data;
        const nodes = this.pool.nodes;
        const arena = ArenaManager.instance;
        const bounds = arena ? arena.bounds : null;

        for (let i = 0; i < data.length; i++) {
            const d = data[i];
            if (!d.active) continue;

            // Lifetime check
            d.elapsed += dt;
            if (d.elapsed >= d.lifetime) {
                this.pool.fadeRelease(d);
                continue;
            }

            // Move
            d.posX += d.velX * d.speed * dt;
            d.posY += d.velY * d.speed * dt;

            // Wall collision — release when hitting arena bounds
            if (bounds) {
                if (d.posX - d.radius < bounds.xMin || d.posX + d.radius > bounds.xMax ||
                    d.posY - d.radius < bounds.yMin || d.posY + d.radius > bounds.yMax) {
                    this.pool.fadeRelease(d);
                    continue;
                }
            }

            // Sync node position — NO getComponent
            nodes[d.nodeIndex].setPosition(d.posX, d.posY, 0);
        }
    }
}
