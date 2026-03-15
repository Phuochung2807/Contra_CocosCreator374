import { _decorator, Component, Node } from 'cc';
import { LevelConfig } from './LevelConfig';
import { GameConfig } from '../config/GameConfig';
import { GameManager } from '../core/GameManager';
import { EventManager } from '../core/EventManager';
import { BossController } from '../boss/BossController';
import { BossFSMConfig } from '../boss/BossFSM';
import { HUDManager } from '../ui/HUDManager';
import { ScreenManager } from '../ui/ScreenManager';

const { ccclass, property } = _decorator;

@ccclass('LevelManager')
export class LevelManager extends Component {
    @property(Node)
    bossNode: Node | null = null;

    @property(Node)
    hudNode: Node | null = null;

    @property(Node)
    screenNode: Node | null = null;

    private _levels: LevelConfig[] = [];
    private _currentLevel = 1;

    onLoad(): void {
        this._levels = GameConfig.levels as LevelConfig[];
    }

    start(): void {
        const screen = this.screenNode?.getComponent(ScreenManager);
        if (screen) {
            screen.setCallbacks(
                () => this.startLevel(1),
                () => this.nextLevel(),
                () => this.restartCurrentLevel(),
            );
        }
    }

    startLevel(levelNum: number): void {
        this._currentLevel = levelNum;
        const cfg = this._getLevelConfig(levelNum);
        if (!cfg) return;

        // Apply boss config
        if (this.bossNode) {
            const bossCtrl = this.bossNode.getComponent(BossController);
            if (bossCtrl) {
                const fsmConfig: BossFSMConfig = {
                    speedMult: cfg.bossSpeedMult,
                    bulletSpeedMult: cfg.bulletSpeedMult,
                    bulletCountMult: cfg.bulletCountMult,
                    allowedActions: cfg.allowedActions,
                };
                bossCtrl.applyLevelConfig(fsmConfig, cfg.bossHP);
            }
        }

        // Update HUD
        const hud = this.hudNode?.getComponent(HUDManager);
        if (hud) {
            hud.setLevel(levelNum);
            hud.refreshHealthRefs();
        }

        EventManager.emit('level_started', levelNum);
        GameManager.instance?.startGame();
    }

    nextLevel(): void {
        const next = this._currentLevel + 1;
        if (next > this._levels.length) {
            // All levels cleared — wrap to level 1
            this.startLevel(1);
        } else {
            this.startLevel(next);
        }
    }

    restartCurrentLevel(): void {
        this.startLevel(this._currentLevel);
    }

    private _getLevelConfig(levelNum: number): LevelConfig | null {
        const cfg = this._levels.find(l => l.level === levelNum);
        if (!cfg) {
            console.warn(`LevelManager: no config for level ${levelNum}`);
            return null;
        }
        return cfg;
    }
}
