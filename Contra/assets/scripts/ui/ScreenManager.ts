import { _decorator, Component, Node, Button } from 'cc';
import { EventManager } from '../core/EventManager';
import { GameState } from '../core/GameManager';

const { ccclass, property } = _decorator;

@ccclass('ScreenManager')
export class ScreenManager extends Component {
    @property(Node)
    startScreen: Node | null = null;

    @property(Node)
    winScreen: Node | null = null;

    @property(Node)
    loseScreen: Node | null = null;

    @property(Button)
    playButton: Button | null = null;

    @property(Button)
    nextButton: Button | null = null;

    @property(Button)
    restartButton: Button | null = null;

    @property(Button)
    restartFromWinButton: Button | null = null;

    private _onPlay: (() => void) | null = null;
    private _onNextLevel: (() => void) | null = null;
    private _onRestart: (() => void) | null = null;

    setCallbacks(onPlay: () => void, onNext: () => void, onRestart: () => void): void {
        this._onPlay = onPlay;
        this._onNextLevel = onNext;
        this._onRestart = onRestart;
    }

    onEnable(): void {
        EventManager.on('game_state_changed', this._onStateChanged);

        if (this.playButton) {
            this.playButton.node.on(Button.EventType.CLICK, this._onPlayClicked, this);
        }
        if (this.nextButton) {
            this.nextButton.node.on(Button.EventType.CLICK, this._onNextClicked, this);
        }
        if (this.restartButton) {
            this.restartButton.node.on(Button.EventType.CLICK, this._onRestartClicked, this);
        }
        if (this.restartFromWinButton) {
            this.restartFromWinButton.node.on(Button.EventType.CLICK, this._onRestartClicked, this);
        }

        // Show start screen by default
        this._showScreen('Init');
    }

    onDisable(): void {
        EventManager.off('game_state_changed', this._onStateChanged);

        if (this.playButton) {
            this.playButton.node.off(Button.EventType.CLICK, this._onPlayClicked, this);
        }
        if (this.nextButton) {
            this.nextButton.node.off(Button.EventType.CLICK, this._onNextClicked, this);
        }
        if (this.restartButton) {
            this.restartButton.node.off(Button.EventType.CLICK, this._onRestartClicked, this);
        }
        if (this.restartFromWinButton) {
            this.restartFromWinButton.node.off(Button.EventType.CLICK, this._onRestartClicked, this);
        }
    }

    private _onStateChanged = (state: string): void => {
        this._showScreen(state);
    };

    private _showScreen(state: string): void {
        if (this.startScreen) this.startScreen.active = (state === GameState.Init);
        if (this.winScreen) this.winScreen.active = (state === GameState.Win);
        if (this.loseScreen) this.loseScreen.active = (state === GameState.Lose);
    }

    private _onPlayClicked(): void {
        if (!this._onPlay) { console.warn('ScreenManager: onPlay callback not set'); return; }
        this._onPlay();
    }

    private _onNextClicked(): void {
        if (!this._onNextLevel) { console.warn('ScreenManager: onNextLevel callback not set'); return; }
        this._onNextLevel();
    }

    private _onRestartClicked(): void {
        if (!this._onRestart) { console.warn('ScreenManager: onRestart callback not set'); return; }
        this._onRestart();
    }
}
