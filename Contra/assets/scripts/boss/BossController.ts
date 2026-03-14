import { _decorator, Component, Node } from 'cc';
import { BossFSM, BossFSMConfig } from './BossFSM';
import { BossVisual } from './BossVisual';
import { HealthComponent } from '../entity/HealthComponent';
import { GameManager, GameState } from '../core/GameManager';

const { ccclass, property } = _decorator;

@ccclass('BossController')
export class BossController extends Component {
    @property(Node)
    playerNode: Node | null = null;

    @property(Node)
    bulletPoolNode: Node | null = null;

    private _health: HealthComponent | null = null;
    private _fsm: BossFSM | null = null;

    onLoad(): void {
        this._health = this.getComponent(HealthComponent);
    }

    start(): void {
        if (!this._health || !this.playerNode || !this.bulletPoolNode) {
            console.warn('BossController: missing refs — health:', !!this._health,
                'playerNode:', !!this.playerNode, 'bulletPoolNode:', !!this.bulletPoolNode);
            return;
        }

        const defaultConfig: BossFSMConfig = {
            speedMult: 1.0,
            bulletSpeedMult: 1.0,
            bulletCountMult: 1.0,
            allowedActions: ['normalMove', 'normalShoot'],
        };

        this._fsm = new BossFSM(
            this.node,
            this.playerNode,
            this.bulletPoolNode,
            this._health,
            defaultConfig,
        );
    }

    update(dt: number): void {
        if (!GameManager.instance || GameManager.instance.state !== GameState.Playing) return;
        if (!this._fsm) return;
        this._fsm.update(dt);
    }

    applyLevelConfig(fsmConfig: BossFSMConfig, bossHP: number): void {
        if (this._health) {
            this._health.reset(bossHP);
        }
        if (this._fsm) {
            this._fsm.updateConfig(fsmConfig);
            this._fsm.reset();
        }
        this.getComponent(BossVisual)?.resetVisual();
    }

    resetBoss(spawnX: number, spawnY: number): void {
        this.node.setPosition(spawnX, spawnY, 0);
        if (this._health) {
            this._health.reset();
        }
        if (this._fsm) {
            this._fsm.reset();
        }
        this.node.active = true;
    }
}
