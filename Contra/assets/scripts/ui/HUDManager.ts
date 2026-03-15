import { _decorator, Component, ProgressBar, Label, Node, UIOpacity } from 'cc';
import { EventManager } from '../core/EventManager';
import { HealthComponent } from '../entity/HealthComponent';
import { GameManager, GameState } from '../core/GameManager';

const { ccclass, property } = _decorator;

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

    private _playerHealth: HealthComponent | null = null;
    private _bossHealth: HealthComponent | null = null;
    private _opacity: UIOpacity | null = null;

    start(): void {
        this._cacheRefs();
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
        this._setVisible(state === GameState.Playing);
    };

    private _setVisible(visible: boolean): void {
        if (this._opacity) {
            this._opacity.opacity = visible ? 255 : 0;
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
