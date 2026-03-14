import { _decorator, Component, Sprite, Label, Node, UITransform, UIOpacity } from 'cc';
import { EventManager } from '../core/EventManager';
import { HealthComponent } from '../entity/HealthComponent';
import { GameManager, GameState } from '../core/GameManager';

const { ccclass, property } = _decorator;

@ccclass('HUDManager')
export class HUDManager extends Component {
    @property(Sprite)
    bossHPFill: Sprite | null = null;

    @property(Sprite)
    playerHPFill: Sprite | null = null;

    @property(Label)
    levelLabel: Label | null = null;

    @property(Node)
    playerNode: Node | null = null;

    @property(Node)
    bossNode: Node | null = null;

    private _playerHealth: HealthComponent | null = null;
    private _bossHealth: HealthComponent | null = null;
    private _playerFillMaxWidth = 0;
    private _bossFillMaxWidth = 0;
    private _playerFillHeight = 0;
    private _bossFillHeight = 0;
    private _playerFillUT: UITransform | null = null;
    private _bossFillUT: UITransform | null = null;
    private _opacity: UIOpacity | null = null;

    start(): void {
        this._cacheRefs();
        this._opacity = this.getComponent(UIOpacity) || this.addComponent(UIOpacity);
        // Hide HUD on init — will show when game starts
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
        if (this.playerHPFill) {
            this._playerFillUT = this.playerHPFill.getComponent(UITransform);
            if (this._playerFillUT) {
                this._playerFillMaxWidth = this._playerFillUT.contentSize.width;
                this._playerFillHeight = this._playerFillUT.contentSize.height;
            }
        }
        if (this.bossHPFill) {
            this._bossFillUT = this.bossHPFill.getComponent(UITransform);
            if (this._bossFillUT) {
                this._bossFillMaxWidth = this._bossFillUT.contentSize.width;
                this._bossFillHeight = this._bossFillUT.contentSize.height;
            }
        }
    }

    update(): void {
        if (!GameManager.instance || GameManager.instance.state !== GameState.Playing) return;

        if (this._playerFillUT && this._playerHealth) {
            this._playerFillUT.setContentSize(
                this._playerFillMaxWidth * this._playerHealth.hpRatio,
                this._playerFillHeight,
            );
        }

        if (this._bossFillUT && this._bossHealth) {
            this._bossFillUT.setContentSize(
                this._bossFillMaxWidth * this._bossHealth.hpRatio,
                this._bossFillHeight,
            );
        }
    }

    setLevel(n: number): void {
        if (this.levelLabel) {
            this.levelLabel.string = `Lv.${n}`;
        }
    }

    refreshHealthRefs(): void {
        this._cacheRefs();
        // Force bars to full width after re-caching
        if (this._playerFillUT) {
            this._playerFillUT.setContentSize(this._playerFillMaxWidth, this._playerFillHeight);
        }
        if (this._bossFillUT) {
            this._bossFillUT.setContentSize(this._bossFillMaxWidth, this._bossFillHeight);
        }
    }
}
