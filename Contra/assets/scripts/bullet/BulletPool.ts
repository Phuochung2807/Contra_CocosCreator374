import { _decorator, Component, Node, Sprite, SpriteFrame, UIOpacity, UITransform, tween } from 'cc';
import { BulletData, BulletOwner, BulletSpriteType, createBulletData } from './BulletData';
import { GameConfig } from '../config/GameConfig';

const { ccclass, property } = _decorator;

const FADE_DURATION = 0.15;

@ccclass('BulletPool')
export class BulletPool extends Component {
    @property(SpriteFrame)
    playerBulletSprite: SpriteFrame | null = null;

    @property(SpriteFrame)
    bossBulletSprite: SpriteFrame | null = null;

    private _data: BulletData[] = [];
    private _nodes: Node[] = [];
    private _sprites: Sprite[] = [];
    private _opacities: UIOpacity[] = [];

    get data(): BulletData[] {
        return this._data;
    }

    get nodes(): Node[] {
        return this._nodes;
    }

    get activeCount(): number {
        let count = 0;
        for (let i = 0; i < this._data.length; i++) {
            if (this._data[i].active) count++;
        }
        return count;
    }

    onLoad(): void {
        const size = GameConfig.bullet.poolSize;
        this._data.length = size;
        this._nodes.length = size;
        this._sprites.length = size;
        this._opacities.length = size;

        for (let i = 0; i < size; i++) {
            this._data[i] = createBulletData(i);

            const node = new Node(`Bullet_${i}`);
            node.parent = this.node;
            node.active = false;

            const sprite = node.addComponent(Sprite);
            sprite.spriteFrame = this.playerBulletSprite;
            sprite.sizeMode = Sprite.SizeMode.CUSTOM;

            node.getComponent(UITransform)!.setContentSize(16, 16);

            const opacity = node.addComponent(UIOpacity);
            opacity.opacity = 255;

            this._nodes[i] = node;
            this._sprites[i] = sprite;
            this._opacities[i] = opacity;
        }
    }

    acquire(
        owner: BulletOwner,
        posX: number, posY: number,
        velX: number, velY: number,
        speed: number, radius: number,
        lifetime: number, damage: number,
    ): BulletData | null {
        for (let i = 0; i < this._data.length; i++) {
            const d = this._data[i];
            if (d.active) continue;

            d.active = true;
            d.posX = posX;
            d.posY = posY;
            d.velX = velX;
            d.velY = velY;
            d.speed = speed;
            d.radius = radius;
            d.lifetime = lifetime;
            d.elapsed = 0;
            d.owner = owner;
            d.damage = damage;
            d.spriteType = owner === BulletOwner.Player
                ? BulletSpriteType.PlayerBullet
                : BulletSpriteType.BossBullet;

            const node = this._nodes[i];
            node.setPosition(posX, posY, 0);
            node.active = true;
            this._opacities[i].opacity = 255;

            const sf = d.spriteType === BulletSpriteType.PlayerBullet
                ? this.playerBulletSprite
                : this.bossBulletSprite;
            this._sprites[i].spriteFrame = sf;

            return d;
        }
        return null;
    }

    release(d: BulletData): void {
        d.active = false;
        this._nodes[d.nodeIndex].active = false;
        this._opacities[d.nodeIndex].opacity = 255;
    }

    fadeRelease(d: BulletData): void {
        d.active = false;
        const opComp = this._opacities[d.nodeIndex];
        const node = this._nodes[d.nodeIndex];
        tween(opComp)
            .to(FADE_DURATION, { opacity: 0 })
            .call(() => {
                node.active = false;
                opComp.opacity = 255;
            })
            .start();
    }

    releaseAll(): void {
        for (let i = 0; i < this._data.length; i++) {
            this._data[i].active = false;
            this._nodes[i].active = false;
            this._opacities[i].opacity = 255;
        }
    }
}
