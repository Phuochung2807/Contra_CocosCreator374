interface EventMap {
    player_damaged: [amount: number];
    player_died: [];
    boss_damaged: [amount: number];
    boss_phase_changed: [phase: string];
    boss_died: [];
    bullet_hit_player: [damage: number];
    bullet_hit_boss: [damage: number];
    game_state_changed: [state: string];
    level_cleared: [level: number];
    level_started: [level: number];
    screen_shake: [intensity: number, duration: number];
}

type EventCallback<K extends keyof EventMap> = (...args: EventMap[K]) => void;

export class EventManager {
    private static _listeners: Map<string, Function[]> = new Map();

    static on<K extends keyof EventMap>(event: K, callback: EventCallback<K>): void {
        const list = this._listeners.get(event);
        if (list) {
            list.push(callback);
        } else {
            this._listeners.set(event, [callback]);
        }
    }

    static off<K extends keyof EventMap>(event: K, callback: EventCallback<K>): void {
        const list = this._listeners.get(event);
        if (!list) return;
        const idx = list.indexOf(callback);
        if (idx !== -1) {
            list.splice(idx, 1);
        }
    }

    static emit<K extends keyof EventMap>(event: K, ...args: EventMap[K]): void {
        const list = this._listeners.get(event);
        if (!list) return;
        for (let i = 0; i < list.length; i++) {
            (list[i] as EventCallback<K>)(...args);
        }
    }

    static clear(): void {
        this._listeners.clear();
    }
}
