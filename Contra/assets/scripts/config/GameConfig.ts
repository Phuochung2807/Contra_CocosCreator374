export const GameConfig = {
    arena: { width: 1920, height: 1080, wallThickness: 20 },
    design: { width: 1920, height: 1080 },

    player: {
        speed: 400,
        hp: 100,
        size: { width: 48, height: 48 },
        colliderRadius: 20,
        shootCooldown: 0.15,
        shootRange: 1200,
        bulletSpeed: 800,
        bulletRadius: 8,
        bulletLifetime: 2.0,
        dashSpeed: 1200,
        dashDuration: 0.15,
        dashCooldown: 1.5,
        dashInvincibleDuration: 0.2,
    },

    boss: {
        hp: 200,
        speed: 150,
        size: { width: 80, height: 80 },
        colliderRadius: 36,
        phaseThresholds: { medium: 0.6, low: 0.3 },
        normalShootCooldown: 1.5,
        crazyShootCooldown: 0.8,
        normalFanCount: 6,
        crazyFanCount: 18,
        normalFanSpread: 60,
        crazyFanSpread: 160,
        bulletSpeed: 350,
        bulletRadius: 10,
        bulletLifetime: 3.0,
        dashSpeed: 600,
        dashDuration: 0.4,
        spawnPos: { x: 0, y: 300 },
    },

    bullet: { poolSize: 500 },

    levels: [
        {
            level: 1, bossHP: 150, bossSpeedMult: 1.0, bulletSpeedMult: 1.0, bulletCountMult: 1.0,
            allowedActions: ['normalMove', 'normalShoot'],
        },
        {
            level: 2, bossHP: 250, bossSpeedMult: 1.2, bulletSpeedMult: 1.1, bulletCountMult: 1.0,
            allowedActions: ['normalMove', 'dashMove', 'normalShoot', 'crazyShoot'],
        },
        {
            level: 3, bossHP: 400, bossSpeedMult: 1.4, bulletSpeedMult: 1.2, bulletCountMult: 1.5,
            allowedActions: ['normalMove', 'dashMove', 'normalShoot', 'crazyShoot'],
        },
    ],

    damage: { playerBullet: 10, bossBullet: 15 },

    vfx: {
        hitFlashDuration: 0.1,
        screenShakeSmall: 3,
        screenShakeMedium: 6,
        screenShakeLarge: 12,
        screenShakeDuration: 0.2,
    },
};
