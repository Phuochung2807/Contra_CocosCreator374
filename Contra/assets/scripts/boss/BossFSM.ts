import { Node } from 'cc';
import { IBossAction, IBossActionContext } from './actions/IBossAction';
import { NormalMoveAction } from './actions/NormalMoveAction';
import { DashMoveAction } from './actions/DashMoveAction';
import { NormalShootAction } from './actions/NormalShootAction';
import { CrazyShootAction } from './actions/CrazyShootAction';
import { BulletPool } from '../bullet/BulletPool';
import { HealthComponent } from '../entity/HealthComponent';
import { EventManager } from '../core/EventManager';
import { GameConfig } from '../config/GameConfig';

export enum BossPhase {
    HighHP = 'HighHP',
    MediumHP = 'MediumHP',
    LowHP = 'LowHP',
}

export interface BossFSMConfig {
    speedMult: number;
    bulletSpeedMult: number;
    bulletCountMult: number;
    allowedActions: string[];
}

const ACTION_COOLDOWN = 0.5;

export class BossFSM {
    private _ctx: IBossActionContext;
    private _health: HealthComponent;
    private _config: BossFSMConfig;
    private _phase: BossPhase = BossPhase.HighHP;
    private _currentAction: IBossAction | null = null;
    private _actionQueue: IBossAction[] = [];
    private _cooldownTimer = 0;

    constructor(
        bossNode: Node,
        playerNode: Node,
        bulletPoolNode: Node,
        health: HealthComponent,
        config: BossFSMConfig,
    ) {
        this._health = health;
        this._config = config;
        this._ctx = {
            bossNode,
            playerNode,
            bulletPoolNode,
            bulletPool: bulletPoolNode.getComponent(BulletPool),
        };
    }

    update(dt: number): void {
        // 1. Check phase transition
        this._checkPhaseTransition();

        // 2. Cooldown between actions
        if (this._cooldownTimer > 0) {
            this._cooldownTimer -= dt;
            return;
        }

        // 3. If no action or action complete → pick next
        if (!this._currentAction || this._currentAction.isComplete()) {
            if (this._currentAction) {
                this._currentAction.exit(this._ctx);
            }
            this._currentAction = this._pickNextAction();
            if (this._currentAction) {
                this._currentAction.enter(this._ctx);
            }
            return;
        }

        // 4. Update current action
        this._currentAction.update(this._ctx, dt);
    }

    private _checkPhaseTransition(): void {
        const ratio = this._health.hpRatio;
        let newPhase = this._phase;

        if (ratio <= GameConfig.boss.phaseThresholds.low) {
            newPhase = BossPhase.LowHP;
        } else if (ratio <= GameConfig.boss.phaseThresholds.medium) {
            newPhase = BossPhase.MediumHP;
        } else {
            newPhase = BossPhase.HighHP;
        }

        if (newPhase !== this._phase) {
            this._phase = newPhase;
            EventManager.emit('boss_phase_changed', this._phase);

            // Reset current action + queue on phase change
            if (this._currentAction) {
                this._currentAction.exit(this._ctx);
                this._currentAction = null;
            }
            this._actionQueue.length = 0;
            this._cooldownTimer = 0;
        }
    }

    private _pickNextAction(): IBossAction | null {
        // If queue has items → shift + set cooldown
        if (this._actionQueue.length > 0) {
            this._cooldownTimer = ACTION_COOLDOWN;
            return this._actionQueue.shift()!;
        }

        // Build queue based on phase
        const cfg = this._config;

        switch (this._phase) {
            case BossPhase.HighHP:
                this._actionQueue.push(
                    new NormalMoveAction(1.5, cfg.speedMult),
                    new NormalShootAction(cfg.bulletCountMult, cfg.bulletSpeedMult),
                );
                break;

            case BossPhase.MediumHP: {
                const moveAction = this._randomPick(cfg.allowedActions, [
                    new NormalMoveAction(1.2, cfg.speedMult),
                    new DashMoveAction(cfg.speedMult),
                ]);
                const shootAction = this._randomPick(cfg.allowedActions, [
                    new NormalShootAction(cfg.bulletCountMult, cfg.bulletSpeedMult),
                    new CrazyShootAction(cfg.bulletCountMult, cfg.bulletSpeedMult),
                ]);
                if (moveAction) this._actionQueue.push(moveAction);
                if (shootAction) this._actionQueue.push(shootAction);
                break;
            }

            case BossPhase.LowHP:
                this._actionQueue.push(
                    new DashMoveAction(cfg.speedMult),
                    new CrazyShootAction(cfg.bulletCountMult, cfg.bulletSpeedMult),
                );
                break;
        }

        if (this._actionQueue.length === 0) return null;

        // First action of new batch: NO cooldown
        return this._actionQueue.shift()!;
    }

    private _randomPick(allowed: string[], candidates: IBossAction[]): IBossAction | null {
        const filtered = candidates.filter(a => allowed.includes(a.name));
        if (filtered.length === 0) {
            return candidates.length > 0 ? candidates[0] : null;
        }
        return filtered[Math.floor(Math.random() * filtered.length)];
    }

    reset(): void {
        if (this._currentAction) {
            this._currentAction.exit(this._ctx);
            this._currentAction = null;
        }
        this._phase = BossPhase.HighHP;
        this._actionQueue.length = 0;
        this._cooldownTimer = 0;
    }

    updateConfig(config: BossFSMConfig): void {
        this._config = config;
    }
}
