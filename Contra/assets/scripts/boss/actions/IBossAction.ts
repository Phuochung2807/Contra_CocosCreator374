import { Node } from 'cc';
import { BulletPool } from '../../bullet/BulletPool';

export interface IBossActionContext {
    bossNode: Node;
    playerNode: Node;
    bulletPoolNode: Node;
    bulletPool: BulletPool | null;
}

export interface IBossAction {
    readonly name: string;
    enter(ctx: IBossActionContext): void;
    update(ctx: IBossActionContext, dt: number): void;
    isComplete(): boolean;
    exit(ctx: IBossActionContext): void;
}
