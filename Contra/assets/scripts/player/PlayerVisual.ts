import { _decorator, Component, Sprite, SpriteFrame, Color, Node, UITransform, UIOpacity, tween, Tween, Size, Vec3 } from 'cc';
import { EventManager } from '../core/EventManager';
import { GameConfig } from '../config/GameConfig';

const { ccclass, property } = _decorator;

const COLOR_WHITE = new Color(255, 255, 255, 255);
const COLOR_FLASH = new Color(255, 100, 100, 255);
const SCALE_ONE = new Vec3(1, 1, 1);
const SCALE_BOUNCE = new Vec3(1.15, 1.15, 1);

@ccclass('PlayerVisual')
export class PlayerVisual extends Component {
    @property(SpriteFrame)
    glowSpriteFrame: SpriteFrame | null = null;

    private _sprite: Sprite | null = null;
    private _glowOpacity: UIOpacity | null = null;
    private _glowNode: Node | null = null;

    private _onHit = (_damage: number): void => {
        if (!this._sprite) return;
        this._sprite.color = COLOR_FLASH;
        this.scheduleOnce(() => {
            if (this._sprite) {
                this._sprite.color = COLOR_WHITE;
            }
        }, GameConfig.vfx.hitFlashDuration);

        // Bounce effect
        Tween.stopAllByTarget(this.node);
        this.node.setScale(SCALE_ONE);
        tween(this.node)
            .to(0.06, { scale: SCALE_BOUNCE }, { easing: 'sineOut' })
            .to(0.1, { scale: SCALE_ONE }, { easing: 'sineIn' })
            .start();

        if (this._glowNode && this._glowOpacity) {
            Tween.stopAllByTarget(this._glowOpacity);
            this._glowOpacity.opacity = GameConfig.vfx.glowMaxOpacity;
            this._glowNode.active = true;
            tween(this._glowOpacity)
                .to(GameConfig.vfx.glowFadeDuration, { opacity: 0 })
                .call(() => { if (this._glowNode) this._glowNode.active = false; })
                .start();
        }
    };

    onLoad(): void {
        this._sprite = this.getComponent(Sprite);

        if (this.glowSpriteFrame) {
            const glowNode = new Node('PlayerGlow');
            this.node.addChild(glowNode);
            const glowSprite = glowNode.addComponent(Sprite);
            glowSprite.spriteFrame = this.glowSpriteFrame;
            glowSprite.sizeMode = Sprite.SizeMode.CUSTOM;
            const ut = glowNode.addComponent(UITransform);
            ut.contentSize = new Size(87, 87);
            this._glowOpacity = glowNode.addComponent(UIOpacity);
            this._glowOpacity.opacity = 0;
            glowNode.active = false;
            this._glowNode = glowNode;
        }
    }

    onEnable(): void {
        EventManager.on('bullet_hit_player', this._onHit);
    }

    onDisable(): void {
        EventManager.off('bullet_hit_player', this._onHit);
        Tween.stopAllByTarget(this.node);
        if (this._glowOpacity) Tween.stopAllByTarget(this._glowOpacity);
    }

    resetVisual(): void {
        Tween.stopAllByTarget(this.node);
        this.node.setScale(SCALE_ONE);
        if (this._sprite) {
            this._sprite.color = COLOR_WHITE;
        }
        if (this._glowOpacity) {
            Tween.stopAllByTarget(this._glowOpacity);
            this._glowOpacity.opacity = 0;
        }
        if (this._glowNode) this._glowNode.active = false;
        this.unscheduleAllCallbacks();
    }
}
