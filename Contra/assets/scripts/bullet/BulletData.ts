export enum BulletOwner {
    Player = 0,
    Boss = 1,
}

export enum BulletSpriteType {
    PlayerBullet = 0,
    BossBullet = 1,
}

export interface BulletData {
    active: boolean;
    posX: number;
    posY: number;
    velX: number;
    velY: number;
    speed: number;
    radius: number;
    lifetime: number;
    elapsed: number;
    owner: BulletOwner;
    spriteType: BulletSpriteType;
    nodeIndex: number;
    damage: number;
}

export function createBulletData(nodeIndex: number): BulletData {
    return {
        active: false,
        posX: 0,
        posY: 0,
        velX: 0,
        velY: 0,
        speed: 0,
        radius: 0,
        lifetime: 0,
        elapsed: 0,
        owner: BulletOwner.Player,
        spriteType: BulletSpriteType.PlayerBullet,
        nodeIndex,
        damage: 0,
    };
}
