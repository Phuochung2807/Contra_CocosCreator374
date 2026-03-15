import { _decorator, Component, Node } from 'cc';
import { EventManager } from './EventManager';
import { TransitionController } from './TransitionController';
import { GameConfig } from '../config/GameConfig';
import { HealthComponent } from '../entity/HealthComponent';
import { BossController } from '../boss/BossController';
import { BossVisual } from '../boss/BossVisual';
import { PlayerVisual } from '../player/PlayerVisual';
import { PlayerDash } from '../player/PlayerDash';
import { BulletPool } from '../bullet/BulletPool';

const { ccclass, property } = _decorator;

export enum GameState {
    Init = 'Init',
    Intro = 'Intro',
    Playing = 'Playing',
    Dying = 'Dying',
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

    @property(TransitionController)
    transitionCtrl: TransitionController | null = null;

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

    start(): void {
        // Hide entities on scene load (Init state)
        if (this.transitionCtrl) this.transitionCtrl.hideEntities();
    }

    changeState(newState: GameState): void {
        if (this._state === newState) return;
        this._state = newState;
        EventManager.emit('game_state_changed', newState);
    }

    startGame(): void {
        if (this.transitionCtrl) this.transitionCtrl.cancelAll();
        this._resetAll();
        if (this.transitionCtrl) this.transitionCtrl.hideEntities();
        this.changeState(GameState.Intro);
        if (this.transitionCtrl) {
            this.transitionCtrl.playIntro(() => {
                if (this._state === GameState.Intro) {
                    this.changeState(GameState.Playing);
                }
            });
        } else {
            this.changeState(GameState.Playing);
        }
    }

    restartGame(): void {
        this.startGame();
    }

    private _resetAll(): void {
        // Reset player (data only, no position — TransitionController handles visibility)
        if (this.playerNode) {
            const playerHealth = this.playerNode.getComponent(HealthComponent);
            if (playerHealth) playerHealth.reset(GameConfig.player.hp);
            const playerVisual = this.playerNode.getComponent(PlayerVisual);
            if (playerVisual) playerVisual.resetVisual();
            const playerDash = this.playerNode.getComponent(PlayerDash);
            if (playerDash) playerDash.resetDash();
        }

        // Reset boss (data only)
        if (this.bossNode) {
            const bossCtrl = this.bossNode.getComponent(BossController);
            if (bossCtrl) bossCtrl.resetBossData();
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
        if (this._state !== GameState.Playing) return;
        // Release bullets immediately
        if (this.bulletWorldNode) {
            const pool = this.bulletWorldNode.getComponent(BulletPool);
            if (pool) pool.releaseAll();
        }
        this.changeState(GameState.Dying);
        if (this.transitionCtrl) {
            this.transitionCtrl.playDeath('player', () => {
                this.changeState(GameState.Lose);
            });
        } else {
            this.changeState(GameState.Lose);
        }
    };

    private _onBossDied = (): void => {
        if (this._state !== GameState.Playing) return;
        // Release bullets immediately
        if (this.bulletWorldNode) {
            const pool = this.bulletWorldNode.getComponent(BulletPool);
            if (pool) pool.releaseAll();
        }
        this.changeState(GameState.Dying);
        if (this.transitionCtrl) {
            this.transitionCtrl.playDeath('boss', () => {
                this.changeState(GameState.Win);
            });
        } else {
            this.changeState(GameState.Win);
        }
    };

    onDestroy(): void {
        EventManager.off('player_died', this._onPlayerDied);
        EventManager.off('boss_died', this._onBossDied);

        if (GameManager._instance === this) {
            GameManager._instance = null;
        }
    }
}
