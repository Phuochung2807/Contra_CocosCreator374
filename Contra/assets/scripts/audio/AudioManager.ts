import { _decorator, Component, AudioClip, AudioSource } from 'cc';
import { EventManager } from '../core/EventManager';
import { GameConfig } from '../config/GameConfig';

const { ccclass, property } = _decorator;

@ccclass('AudioManager')
export class AudioManager extends Component {
    private static _instance: AudioManager | null = null;

    static get instance(): AudioManager | null {
        return this._instance;
    }

    @property(AudioClip)
    bgm: AudioClip | null = null;

    @property(AudioClip)
    sfxShoot: AudioClip | null = null;

    @property(AudioClip)
    sfxHit: AudioClip | null = null;

    @property(AudioClip)
    sfxExplosion: AudioClip | null = null;

    @property(AudioClip)
    sfxDash: AudioClip | null = null;

    private _audioSource: AudioSource | null = null;

    onLoad(): void {
        AudioManager._instance = this;
        this._audioSource = this.getComponent(AudioSource) || this.node.addComponent(AudioSource);
    }

    onEnable(): void {
        EventManager.on('game_state_changed', this._onGameStateChanged);
        EventManager.on('bullet_hit_boss', this._onBulletHitBoss);
        EventManager.on('bullet_hit_player', this._onBulletHitPlayer);
        EventManager.on('boss_died', this._onBossDied);
    }

    onDisable(): void {
        EventManager.off('game_state_changed', this._onGameStateChanged);
        EventManager.off('bullet_hit_boss', this._onBulletHitBoss);
        EventManager.off('bullet_hit_player', this._onBulletHitPlayer);
        EventManager.off('boss_died', this._onBossDied);
    }

    onDestroy(): void {
        if (AudioManager._instance === this) {
            AudioManager._instance = null;
        }
    }

    playSFXShoot(): void {
        this._playSFX(this.sfxShoot);
    }

    playSFXDash(): void {
        this._playSFX(this.sfxDash);
    }

    private _onGameStateChanged = (state: string): void => {
        if (state === 'Playing') {
            this._playBGM();
        } else {
            this._stopBGM();
        }
    };

    private _onBulletHitBoss = (_damage: number): void => {
        this._playSFX(this.sfxHit);
    };

    private _onBulletHitPlayer = (_damage: number): void => {
        this._playSFX(this.sfxHit);
    };

    private _onBossDied = (): void => {
        this._playSFX(this.sfxExplosion);
    };

    private _playBGM(): void {
        if (!this._audioSource || !this.bgm) return;
        if (this._audioSource.playing && this._audioSource.clip === this.bgm) return;
        this._audioSource.clip = this.bgm;
        this._audioSource.loop = true;
        this._audioSource.volume = GameConfig.audio.bgmVolume;
        this._audioSource.play();
    }

    private _stopBGM(): void {
        if (!this._audioSource) return;
        this._audioSource.stop();
    }

    private _playSFX(clip: AudioClip | null): void {
        if (!this._audioSource || !clip) return;
        this._audioSource.playOneShot(clip, GameConfig.audio.sfxVolume);
    }
}
