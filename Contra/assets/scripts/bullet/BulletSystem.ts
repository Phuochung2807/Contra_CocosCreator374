import { _decorator, Component } from 'cc';
import { BulletPool } from './BulletPool';
import { GameManager, GameState } from '../core/GameManager';
import { ArenaManager } from '../map/ArenaManager';

const { ccclass, property } = _decorator;

const OOB_MARGIN = 50;

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
                this.pool.release(d);
                continue;
            }

            // Move
            d.posX += d.velX * d.speed * dt;
            d.posY += d.velY * d.speed * dt;

            // OOB check
            if (bounds) {
                if (d.posX < bounds.xMin - OOB_MARGIN || d.posX > bounds.xMax + OOB_MARGIN ||
                    d.posY < bounds.yMin - OOB_MARGIN || d.posY > bounds.yMax + OOB_MARGIN) {
                    this.pool.release(d);
                    continue;
                }
            }

            // Sync node position — NO getComponent
            nodes[d.nodeIndex].setPosition(d.posX, d.posY, 0);
        }
    }
}
