import { _decorator, Component, Node, Rect, UITransform, view, ResolutionPolicy } from 'cc';
import { GameConfig } from '../config/GameConfig';

const { ccclass, property } = _decorator;

@ccclass('ArenaManager')
export class ArenaManager extends Component {
    private static _instance: ArenaManager | null = null;

    static get instance(): ArenaManager | null {
        return this._instance;
    }

    @property(Node)
    wallTop: Node | null = null;

    @property(Node)
    wallBottom: Node | null = null;

    @property(Node)
    wallLeft: Node | null = null;

    @property(Node)
    wallRight: Node | null = null;

    @property(Node)
    floor: Node | null = null;

    private _bounds: Rect = new Rect();

    get bounds(): Rect {
        return this._bounds;
    }

    onLoad(): void {
        ArenaManager._instance = this;
        this._layoutArena();
        view.on('canvas-resize', this._layoutArena, this);
    }

    private _layoutArena(): void {
        const { wallThickness } = GameConfig.arena;
        const visibleSize = view.getVisibleSize();
        const w = visibleSize.width;
        const h = visibleSize.height;
        const halfW = w / 2;
        const halfH = h / 2;
        const halfWall = wallThickness / 2;

        // Floor
        if (this.floor) {
            const ut = this.floor.getComponent(UITransform)!;
            ut.setContentSize(w, h);
            this.floor.setPosition(0, 0, 0);
        }

        // Top wall
        if (this.wallTop) {
            const ut = this.wallTop.getComponent(UITransform)!;
            ut.setContentSize(w, wallThickness);
            this.wallTop.setPosition(0, halfH - halfWall, 0);
        }

        // Bottom wall
        if (this.wallBottom) {
            const ut = this.wallBottom.getComponent(UITransform)!;
            ut.setContentSize(w, wallThickness);
            this.wallBottom.setPosition(0, -halfH + halfWall, 0);
        }

        // Left wall
        if (this.wallLeft) {
            const ut = this.wallLeft.getComponent(UITransform)!;
            ut.setContentSize(wallThickness, h);
            this.wallLeft.setPosition(-halfW + halfWall, 0, 0);
        }

        // Right wall
        if (this.wallRight) {
            const ut = this.wallRight.getComponent(UITransform)!;
            ut.setContentSize(wallThickness, h);
            this.wallRight.setPosition(halfW - halfWall, 0, 0);
        }

        // Playable bounds (inside walls)
        const xMin = -halfW + wallThickness;
        const yMin = -halfH + wallThickness;
        this._bounds.set(xMin, yMin, w - 2 * wallThickness, h - 2 * wallThickness);
    }

    clampPosition(x: number, y: number, halfSize: number): { x: number; y: number } {
        const b = this._bounds;
        const clampedX = Math.max(b.xMin + halfSize, Math.min(x, b.xMax - halfSize));
        const clampedY = Math.max(b.yMin + halfSize, Math.min(y, b.yMax - halfSize));
        return { x: clampedX, y: clampedY };
    }

    onDestroy(): void {
        view.off('canvas-resize', this._layoutArena, this);
        if (ArenaManager._instance === this) {
            ArenaManager._instance = null;
        }
    }
}
