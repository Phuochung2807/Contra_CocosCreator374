import { _decorator, Component, Node } from 'cc';
import { EventManager } from './EventManager';
import { GameConfig } from '../config/GameConfig';
import { HealthComponent } from '../entity/HealthComponent';
import { BossController } from '../boss/BossController';
import { BossVisual } from '../boss/BossVisual';
import { PlayerVisual } from '../player/PlayerVisual';
import { BulletPool } from '../bullet/BulletPool';

const { ccclass, property } = _decorator;

export enum GameState {
    Init = 'Init',
    Playing = 'Playing',
    Win = 'Win',
    Lose = 'Lose',
}

@ccclass('GameManager')
export class GameManager extends Component {
    private static _instance: GameManager | null = null;

    static get instance(): GameManager | null {
        return this._instance;
    }

    @property(Node)
    playerNode: Node | null = null;

    @property(Node)
    bossNode: Node | null = null;

    @property(Node)
    bulletWorldNode: Node | null = null;

    private _state: GameState = GameState.Init;

    get state(): GameState {
        return this._state;
    }

    onLoad(): void {
        GameManager._instance = this;
        this._state = GameState.Init;
        EventManager.on('player_died', this._onPlayerDied);
        EventManager.on('boss_died', this._onBossDied);
    }

    changeState(newState: GameState): void {
        if (this._state === newState) return;
        this._state = newState;
        EventManager.emit('game_state_changed', newState);
    }

    startGame(): void {
        this._resetAll();
        this.changeState(GameState.Playing);
    }

    restartGame(): void {
        this._resetAll();
        this.changeState(GameState.Playing);
    }

    private _resetAll(): void {
        // Reset player
        if (this.playerNode) {
            this.playerNode.setPosition(0, -300, 0);
            const playerHealth = this.playerNode.getComponent(HealthComponent);
            if (playerHealth) playerHealth.reset(GameConfig.player.hp);
            const playerVisual = this.playerNode.getComponent(PlayerVisual);
            if (playerVisual) playerVisual.resetVisual();
        }

        // Reset boss
        if (this.bossNode) {
            const bossCtrl = this.bossNode.getComponent(BossController);
            if (bossCtrl) bossCtrl.resetBoss(GameConfig.boss.spawnPos.x, GameConfig.boss.spawnPos.y);
            const bossVisual = this.bossNode.getComponent(BossVisual);
            if (bossVisual) bossVisual.resetVisual();
        }

        // Clear bullets
        if (this.bulletWorldNode) {
            const pool = this.bulletWorldNode.getComponent(BulletPool);
            if (pool) pool.releaseAll();
        }
    }

    private _onPlayerDied = (): void => {
        this.changeState(GameState.Lose);
    };

    private _onBossDied = (): void => {
        // Clear all bullets before showing win
        if (this.bulletWorldNode) {
            const pool = this.bulletWorldNode.getComponent(BulletPool);
            if (pool) pool.releaseAll();
        }
        this.changeState(GameState.Win);
    };

    onDestroy(): void {
        EventManager.off('player_died', this._onPlayerDied);
        EventManager.off('boss_died', this._onBossDied);

        if (GameManager._instance === this) {
            GameManager._instance = null;
        }
    }
}
