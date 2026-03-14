import { BulletOwner } from './BulletData';
import { BulletPool } from './BulletPool';

export class BulletFactory {
    static spawnSingle(
        pool: BulletPool,
        owner: BulletOwner,
        posX: number, posY: number,
        dirX: number, dirY: number,
        speed: number, radius: number,
        lifetime: number, damage: number,
    ): void {
        const len = Math.sqrt(dirX * dirX + dirY * dirY);
        if (len === 0) return;
        const nx = dirX / len;
        const ny = dirY / len;
        pool.acquire(owner, posX, posY, nx, ny, speed, radius, lifetime, damage);
    }

    static spawnFan(
        pool: BulletPool,
        owner: BulletOwner,
        posX: number, posY: number,
        centerDirX: number, centerDirY: number,
        speed: number, radius: number,
        lifetime: number, damage: number,
        spreadDeg: number, count: number,
    ): void {
        if (count <= 0) return;

        const centerAngle = Math.atan2(centerDirY, centerDirX);

        if (count === 1) {
            const nx = Math.cos(centerAngle);
            const ny = Math.sin(centerAngle);
            pool.acquire(owner, posX, posY, nx, ny, speed, radius, lifetime, damage);
            return;
        }

        const spreadRad = spreadDeg * Math.PI / 180;
        const startAngle = centerAngle - spreadRad / 2;
        const step = spreadRad / (count - 1);

        for (let i = 0; i < count; i++) {
            const angle = startAngle + step * i;
            const nx = Math.cos(angle);
            const ny = Math.sin(angle);
            pool.acquire(owner, posX, posY, nx, ny, speed, radius, lifetime, damage);
        }
    }
}
