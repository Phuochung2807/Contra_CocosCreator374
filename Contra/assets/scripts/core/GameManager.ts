import { _decorator, Component, Node } from 'cc';
import { EventManager } from './EventManager';

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

        console.log('GameManager loaded, state:', this._state);
    }

    changeState(newState: GameState): void {
        if (this._state === newState) return;
        this._state = newState;
        EventManager.emit('game_state_changed', newState);
    }

    startGame(): void {
        this.changeState(GameState.Playing);
    }

    restartGame(): void {
        this.changeState(GameState.Playing);
    }

    onDestroy(): void {
        if (GameManager._instance === this) {
            GameManager._instance = null;
        }
    }
}
