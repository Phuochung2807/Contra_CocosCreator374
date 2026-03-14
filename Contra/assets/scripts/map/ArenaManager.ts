import { _decorator, Component, Node, Rect, Sprite, UITransform, view } from 'cc';
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

    private _setupSprite(node: Node, w: number, h: number): void {
        const sprite = node.getComponent(Sprite);
        if (sprite) {
            sprite.type = Sprite.Type.TILED;
            sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        }
        node.getComponent(UITransform)!.setContentSize(w, h);
    }

    private _layoutArena(): void {
        const { wallThickness } = GameConfig.arena;
        const parentUT = this.node.parent?.getComponent(UITransform);
        const w = parentUT ? parentUT.contentSize.width : GameConfig.design.width;
        const h = parentUT ? parentUT.contentSize.height : GameConfig.design.height;
        const halfW = w / 2;
        const halfH = h / 2;
        const halfWall = wallThickness / 2;

        if (this.floor) {
            this._setupSprite(this.floor, w, h);
            this.floor.setPosition(0, 0, 0);
        }

        if (this.wallTop) {
            this._setupSprite(this.wallTop, w, wallThickness);
            this.wallTop.setPosition(0, halfH - halfWall, 0);
        }

        if (this.wallBottom) {
            this._setupSprite(this.wallBottom, w, wallThickness);
            this.wallBottom.setPosition(0, -halfH + halfWall, 0);
        }

        if (this.wallLeft) {
            this._setupSprite(this.wallLeft, wallThickness, h);
            this.wallLeft.setPosition(-halfW + halfWall, 0, 0);
        }

        if (this.wallRight) {
            this._setupSprite(this.wallRight, wallThickness, h);
            this.wallRight.setPosition(halfW - halfWall, 0, 0);
        }

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
