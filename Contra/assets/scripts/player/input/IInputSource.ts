export interface IInputSource {
    getMovement(): { x: number; y: number };
    isDashPressed(): boolean;
}
