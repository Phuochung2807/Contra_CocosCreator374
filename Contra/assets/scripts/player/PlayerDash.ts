import { _decorator, Component, Vec3 } from 'cc';
import { PlayerController } from './PlayerController';
import { HealthComponent } from '../entity/HealthComponent';
import { ArenaManager } from '../map/ArenaManager';
import { GameConfig } from '../config/GameConfig';
import { GameManager, GameState } from '../core/GameManager';
import { AudioManager } from '../audio/AudioManager';

const { ccclass } = _decorator;

const _tmpVec3 = new Vec3();

enum DashState {
    Ready,
    Dashing,
    Cooldown,
}

@ccclass('PlayerDash')
export class PlayerDash extends Component {
    private _controller: PlayerController | null = null;
    private _health: HealthComponent | null = null;
    private _state: DashState = DashState.Ready;
    private _timer = 0;
    private _dirX = 0;
    private _dirY = 0;

    get canDash(): boolean {
        return this._state === DashState.Ready;
    }

    get cooldownRatio(): number {
        if (this._state === DashState.Cooldown) {
            return this._timer / GameConfig.player.dashCooldown;
        }
        return 0;
    }

    onLoad(): void {
        this._controller = this.getComponent(PlayerController);
        this._health = this.getComponent(HealthComponent);
    }

    update(dt: number): void {
        if (!GameManager.instance || GameManager.instance.state !== GameState.Playing) return;

        switch (this._state) {
            case DashState.Ready:
                this._handleReady();
                break;
            case DashState.Dashing:
                this._handleDashing(dt);
                break;
            case DashState.Cooldown:
                this._handleCooldown(dt);
                break;
        }
    }

    resetDash(): void {
        this.unscheduleAllCallbacks();
        this._state = DashState.Ready;
        this._timer = 0;
        this._dirX = 0;
        this._dirY = 0;
        if (this._health) {
            this._health.invincible = false;
        }
    }

    private _handleReady(): void {
        if (!this._controller) return;
        if (!this._controller.isDashPressed()) return;

        // Lock direction from current movement
        const move = this._controller.getMovement();
        if (move.x !== 0 || move.y !== 0) {
            const len = Math.sqrt(move.x * move.x + move.y * move.y);
            this._dirX = move.x / len;
            this._dirY = move.y / len;
        } else {
            // Default: dash upward if no input
            this._dirX = 0;
            this._dirY = 1;
        }

        // Start dash
        this._state = DashState.Dashing;
        this._timer = 0;
        AudioManager.instance?.playSFXDash();
        if (this._health) {
            this._health.invincible = true;
        }
    }

    private _handleDashing(dt: number): void {
        this._timer += dt;

        // Move at dash speed
        this.node.getPosition(_tmpVec3);
        _tmpVec3.x += this._dirX * GameConfig.player.dashSpeed * dt;
        _tmpVec3.y += this._dirY * GameConfig.player.dashSpeed * dt;

        // Clamp to arena
        const arena = ArenaManager.instance;
        if (arena) {
            const clamped = arena.clampPosition(_tmpVec3.x, _tmpVec3.y, GameConfig.player.colliderRadius);
            _tmpVec3.x = clamped.x;
            _tmpVec3.y = clamped.y;
        }

        this.node.setPosition(_tmpVec3);

        if (this._timer >= GameConfig.player.dashDuration) {
            // Dash ended — schedule invincibility removal
            this.scheduleOnce(() => {
                if (this._health) {
                    this._health.invincible = false;
                }
            }, GameConfig.player.dashInvincibleDuration);

            this._state = DashState.Cooldown;
            this._timer = 0;
        }
    }

    private _handleCooldown(dt: number): void {
        this._timer += dt;
        if (this._timer >= GameConfig.player.dashCooldown) {
            this._state = DashState.Ready;
            this._timer = 0;
        }
    }
}
