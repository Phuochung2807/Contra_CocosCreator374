import { _decorator, Component, Sprite, SpriteFrame, Color } from 'cc';
import { EventManager } from '../core/EventManager';
import { GameConfig } from '../config/GameConfig';

const { ccclass, property } = _decorator;

const COLOR_WHITE = new Color(255, 255, 255, 255);
const COLOR_FLASH = new Color(255, 100, 100, 255);

@ccclass('BossVisual')
export class BossVisual extends Component {
    @property(SpriteFrame)
    spriteHighHP: SpriteFrame | null = null;

    @property(SpriteFrame)
    spriteMediumHP: SpriteFrame | null = null;

    @property(SpriteFrame)
    spriteLowHP: SpriteFrame | null = null;

    private _sprite: Sprite | null = null;

    private _onPhaseChanged = (phase: string): void => {
        if (!this._sprite) return;
        switch (phase) {
            case 'MediumHP':
                this._sprite.spriteFrame = this.spriteMediumHP;
                break;
            case 'LowHP':
                this._sprite.spriteFrame = this.spriteLowHP;
                break;
            default:
                this._sprite.spriteFrame = this.spriteHighHP;
                break;
        }
    };

    private _onHit = (_damage: number): void => {
        if (!this._sprite) return;
        this._sprite.color = COLOR_FLASH;
        this.scheduleOnce(() => {
            if (this._sprite) {
                this._sprite.color = COLOR_WHITE;
            }
        }, GameConfig.vfx.hitFlashDuration);
    };

    onLoad(): void {
        this._sprite = this.getComponent(Sprite);
    }

    onEnable(): void {
        EventManager.on('boss_phase_changed', this._onPhaseChanged);
        EventManager.on('bullet_hit_boss', this._onHit);
    }

    onDisable(): void {
        EventManager.off('boss_phase_changed', this._onPhaseChanged);
        EventManager.off('bullet_hit_boss', this._onHit);
    }

    resetVisual(): void {
        if (this._sprite) {
            this._sprite.spriteFrame = this.spriteHighHP;
            this._sprite.color = COLOR_WHITE;
        }
        this.unscheduleAllCallbacks();
    }
}
