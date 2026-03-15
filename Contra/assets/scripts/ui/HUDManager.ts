import { _decorator, Component, ProgressBar, Label, Node, UIOpacity, Widget, view } from 'cc';
import { EventManager } from '../core/EventManager';
import { HealthComponent } from '../entity/HealthComponent';
import { GameManager, GameState } from '../core/GameManager';

const { ccclass, property } = _decorator;

const MARGIN = 20;

@ccclass('HUDManager')
export class HUDManager extends Component {
    @property(ProgressBar)
    bossHPBar: ProgressBar | null = null;

    @property(ProgressBar)
    playerHPBar: ProgressBar | null = null;

    @property(Label)
    levelLabel: Label | null = null;

    @property(Node)
    playerNode: Node | null = null;

    @property(Node)
    bossNode: Node | null = null;

    @property(Node)
    playerHPContainer: Node | null = null;

    @property(Node)
    bossHPContainer: Node | null = null;

    @property(Node)
    levelContainer: Node | null = null;

    private _playerHealth: HealthComponent | null = null;
    private _bossHealth: HealthComponent | null = null;
    private _opacity: UIOpacity | null = null;

    start(): void {
        this._cacheRefs();
        this._setupWidgets();
        this._opacity = this.getComponent(UIOpacity) || this.addComponent(UIOpacity);
        this._setVisible(false);
    }

    onEnable(): void {
        EventManager.on('game_state_changed', this._onStateChanged);
    }

    onDisable(): void {
        EventManager.off('game_state_changed', this._onStateChanged);
    }

    private _onStateChanged = (state: string): void => {
        const visible = state === GameState.Playing || state === GameState.Intro || state === GameState.Dying;
        this._setVisible(visible);
    };

    private _setVisible(visible: boolean): void {
        if (this._opacity) {
            this._opacity.opacity = visible ? 255 : 0;
        }
    }

    private _setupWidgets(): void {
        // Player HP — top-left
        if (this.playerHPContainer) {
            const w = this.playerHPContainer.getComponent(Widget) || this.playerHPContainer.addComponent(Widget);
            w.isAlignTop = true;
            w.isAlignLeft = true;
            w.isAlignBottom = false;
            w.isAlignRight = false;
            w.top = MARGIN;
            w.left = MARGIN;
            w.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        }

        // Boss HP — top-right
        if (this.bossHPContainer) {
            const w = this.bossHPContainer.getComponent(Widget) || this.bossHPContainer.addComponent(Widget);
            w.isAlignTop = true;
            w.isAlignRight = true;
            w.isAlignBottom = false;
            w.isAlignLeft = false;
            w.top = MARGIN;
            w.right = MARGIN;
            w.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        }

        // Level label — top-center
        if (this.levelContainer) {
            const w = this.levelContainer.getComponent(Widget) || this.levelContainer.addComponent(Widget);
            w.isAlignTop = true;
            w.isAlignLeft = true;
            w.isAlignRight = true;
            w.isAlignBottom = false;
            w.top = MARGIN * 2;
            w.left = 0;
            w.right = 0;
            w.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        }
    }

    private _cacheRefs(): void {
        if (this.playerNode) {
            this._playerHealth = this.playerNode.getComponent(HealthComponent);
        }
        if (this.bossNode) {
            this._bossHealth = this.bossNode.getComponent(HealthComponent);
        }
    }

    update(): void {
        if (!GameManager.instance || GameManager.instance.state !== GameState.Playing) return;

        if (this.playerHPBar && this._playerHealth) {
            this.playerHPBar.progress = this._playerHealth.hpRatio;
        }

        if (this.bossHPBar && this._bossHealth) {
            this.bossHPBar.progress = this._bossHealth.hpRatio;
        }
    }

    setLevel(n: number): void {
        if (this.levelLabel) {
            this.levelLabel.string = `Lv.${n}`;
        }
    }

    refreshHealthRefs(): void {
        this._cacheRefs();
        if (this.playerHPBar) this.playerHPBar.progress = 1;
        if (this.bossHPBar) this.bossHPBar.progress = 1;
    }
}
