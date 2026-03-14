import { _decorator, Component } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('HealthComponent')
export class HealthComponent extends Component {
    @property
    maxHP: number = 100;

    private _currentHP = 0;
    private _invincible = false;

    get currentHP(): number {
        return this._currentHP;
    }

    get hpRatio(): number {
        return this.maxHP > 0 ? this._currentHP / this.maxHP : 1;
    }

    get isDead(): boolean {
        return this._currentHP <= 0;
    }

    get invincible(): boolean {
        return this._invincible;
    }

    set invincible(value: boolean) {
        this._invincible = value;
    }

    onLoad(): void {
        this._currentHP = this.maxHP;
    }

    reset(hp?: number): void {
        if (hp !== undefined) {
            this.maxHP = hp;
        }
        this._currentHP = this.maxHP;
        this._invincible = false;
    }

    takeDamage(amount: number): boolean {
        if (this._invincible || this._currentHP <= 0) return false;
        this._currentHP = Math.max(0, this._currentHP - amount);
        return true;
    }

    heal(amount: number): void {
        if (amount <= 0) return;
        this._currentHP = Math.min(this.maxHP, this._currentHP + amount);
    }
}
