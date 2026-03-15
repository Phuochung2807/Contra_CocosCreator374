import { _decorator, Component, Node, Button, UIOpacity, BlockInputEvents, tween, Tween } from 'cc';
import { EventManager } from '../core/EventManager';
import { GameState } from '../core/GameManager';

const { ccclass, property } = _decorator;

const FADE_DURATION = 0.2;

@ccclass('ScreenManager')
export class ScreenManager extends Component {
    @property(Node)
    backer: Node | null = null;

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

    private _onPlay: (() => void) | null = null;
    private _onNextLevel: (() => void) | null = null;
    private _onRestart: (() => void) | null = null;
    private _backerOpacity: UIOpacity | null = null;

    setCallbacks(onPlay: () => void, onNext: () => void, onRestart: () => void): void {
        this._onPlay = onPlay;
        this._onNextLevel = onNext;
        this._onRestart = onRestart;
    }

    onLoad(): void {
        if (this.backer) {
            this._backerOpacity = this.backer.getComponent(UIOpacity) || this.backer.addComponent(UIOpacity);
            // Ensure backer blocks input to layers below
            if (!this.backer.getComponent(BlockInputEvents)) {
                this.backer.addComponent(BlockInputEvents);
            }
        }
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

        this._showScreen(GameState.Init);
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
    }

    private _onStateChanged = (state: string): void => {
        this._showScreen(state);
    };

    private _showScreen(state: string): void {
        const noOverlay = [GameState.Playing, GameState.Intro, GameState.Dying];
        const hasScreen = !noOverlay.includes(state as GameState);
        const activeScreen = state === GameState.Init ? this.startScreen
            : state === GameState.Win ? this.winScreen
            : state === GameState.Lose ? this.loseScreen
            : null;

        // Hide all screens first
        if (this.startScreen) this.startScreen.active = false;
        if (this.winScreen) this.winScreen.active = false;
        if (this.loseScreen) this.loseScreen.active = false;

        if (hasScreen && activeScreen) {
            // Reorder: backer sits above HUD, screen sits above backer
            this._showBacker();
            activeScreen.active = true;
            if (this.backer) {
                activeScreen.setSiblingIndex(this.backer.getSiblingIndex() + 1);
            }
        } else {
            this._hideBacker();
        }
    }

    private _showBacker(): void {
        if (!this.backer || !this._backerOpacity) return;
        this.backer.active = true;
        Tween.stopAllByTarget(this._backerOpacity);
        tween(this._backerOpacity)
            .to(FADE_DURATION, { opacity: 150 })
            .start();
    }

    private _hideBacker(): void {
        if (!this.backer || !this._backerOpacity) return;
        Tween.stopAllByTarget(this._backerOpacity);
        tween(this._backerOpacity)
            .to(FADE_DURATION, { opacity: 0 })
            .call(() => { if (this.backer) this.backer.active = false; })
            .start();
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
