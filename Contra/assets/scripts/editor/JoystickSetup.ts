import { _decorator, Component, Node, UITransform, UIOpacity, Sprite, Color, Widget } from 'cc';
import { JoystickInput } from '../player/input/JoystickInput';
import { GameConfig } from '../config/GameConfig';

const { ccclass, property, executeInEditMode, menu } = _decorator;

/**
 * Attach this to the JoyStick node, click the "setup" checkbox in Inspector,
 * then save the scene. It creates:
 *
 *   JoyStick (this node)        ← JoystickInput + UITransform(1920x1080)
 *   ├── TouchArea               ← fullscreen, transparent Sprite, Widget stretch
 *   └── OuterRing               ← circle sprite, semi-transparent
 *       └── InnerKnob           ← smaller circle sprite
 *
 * After setup, remove this component from the node.
 */
@ccclass('JoystickSetup')
@executeInEditMode
@menu('Editor/JoystickSetup')
export class JoystickSetup extends Component {
    @property({ tooltip: 'Check to run setup' })
    setup = false;

    @property({ tooltip: 'Outer ring diameter' })
    outerSize = 160;

    @property({ tooltip: 'Inner knob diameter' })
    knobSize = 60;

    update(): void {
        if (!this.setup) return;
        this.setup = false;
        this._buildHierarchy();
    }

    private _buildHierarchy(): void {
        const { width, height } = GameConfig.design;

        // --- Self: ensure UITransform ---
        let selfUT = this.getComponent(UITransform);
        if (!selfUT) {
            selfUT = this.addComponent(UITransform);
        }
        selfUT.setContentSize(width, height);

        // --- Clear existing children ---
        this.node.removeAllChildren();

        // --- TouchArea ---
        const touchArea = new Node('TouchArea');
        this.node.addChild(touchArea);

        const taUT = touchArea.addComponent(UITransform);
        taUT.setContentSize(width, height);

        const taWidget = touchArea.addComponent(Widget);
        taWidget.isAlignTop = true;
        taWidget.isAlignBottom = true;
        taWidget.isAlignLeft = true;
        taWidget.isAlignRight = true;
        taWidget.top = 0;
        taWidget.bottom = 0;
        taWidget.left = 0;
        taWidget.right = 0;
        taWidget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;

        const taSp = touchArea.addComponent(Sprite);
        taSp.sizeMode = Sprite.SizeMode.CUSTOM;
        taSp.color = new Color(0, 0, 0, 1);  // nearly invisible but receives touch

        const taOp = touchArea.addComponent(UIOpacity);
        taOp.opacity = 0;

        // --- OuterRing ---
        const outerRing = new Node('OuterRing');
        this.node.addChild(outerRing);

        const orUT = outerRing.addComponent(UITransform);
        orUT.setContentSize(this.outerSize, this.outerSize);

        const orSp = outerRing.addComponent(Sprite);
        orSp.sizeMode = Sprite.SizeMode.CUSTOM;
        orSp.color = new Color(255, 255, 255, 100);

        const orOp = outerRing.addComponent(UIOpacity);
        orOp.opacity = 0;  // starts hidden, JoystickInput fades in on touch

        // --- InnerKnob (child of OuterRing) ---
        const innerKnob = new Node('InnerKnob');
        outerRing.addChild(innerKnob);

        const ikUT = innerKnob.addComponent(UITransform);
        ikUT.setContentSize(this.knobSize, this.knobSize);

        const ikSp = innerKnob.addComponent(Sprite);
        ikSp.sizeMode = Sprite.SizeMode.CUSTOM;
        ikSp.color = new Color(255, 255, 255, 200);

        // --- Wire JoystickInput ---
        let ji = this.getComponent(JoystickInput);
        if (!ji) {
            ji = this.addComponent(JoystickInput);
        }
        ji.touchArea = touchArea;
        ji.outerRing = outerRing;
        ji.innerKnob = innerKnob;
        ji.maxRadius = this.outerSize / 2;

        console.log('JoystickSetup: Done! Save scene, then remove this component.');
    }
}
