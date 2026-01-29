// PORTAL KOMBAT - Основной файл
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    backgroundColor: '#000000'
};

let game = new Phaser.Game(config);
let player, cursors, spaceKey;
let platforms, enemies = [];
let portals = [];
let lastPortalTime = 0;
let comboCount = 0;

// Загрузка
function preload() {
    // Временные спрайты - позже замените на свои
    this.load.image('player', 'https://labs.phaser.io/assets/sprites/phaser3-ship.png');
    this.load.image('platform', 'https://labs.phaser.io/assets/sprites/platform.png');
    this.load.image('enemy', 'https://labs.phaser.io/assets/sprites/orb.png');
    this.load.image('portal', 'https://labs.phaser.io/assets/sprites/bubble.png');
    this.load.image('bullet', 'https://labs.phaser.io/assets/sprites/diamond.png');
    
    // Эффекты
    this.load.spritesheet('explosion', 'https://labs.phaser.io/assets/sprites/explosion.png', {
        frameWidth: 64, frameHeight: 64
    });
    
    this.load.audio('hit', 'https://labs.phaser.io/assets/audio/SoundEffects/hit.mp3');
}

// Создание сцены
function create() {
    // Платформы
    platforms = this.physics.add.staticGroup();
    platforms.create(400, 580, 'platform').setScale(2).refreshBody();
    
    // Рандомные платформы
    for (let i = 0; i < 10; i++) {
        let x = Phaser.Math.Between(50, 750);
        let y = Phaser.Math.Between(100, 400);
        platforms.create(x, y, 'platform');
    }
    
    // Игрок
    player = this.physics.add.sprite(100, 450, 'player');
    player.setCollideWorldBounds(true);
    player.setBounce(0.2);
    player.setScale(1.5);
    player.setTint(0x00ffff);
    
    // Враги
    for (let i = 0; i < 5; i++) {
        let enemy = this.physics.add.sprite(
            Phaser.Math.Between(100, 700),
            Phaser.Math.Between(50, 300),
            'enemy'
        );
        enemy.setTint(0xff5555);
        enemy.setVelocity(Phaser.Math.Between(-50, 50), Phaser.Math.Between(-50, 50));
        enemy.setCollideWorldBounds(true);
        enemy.setBounce(1);
        enemies.push(enemy);
    }
    
    // Коллизии
    this.physics.add.collider(player, platforms);
    enemies.forEach(enemy => {
        this.physics.add.collider(enemy, platforms);
    });
    
    // Управление
    cursors = this.input.keyboard.createCursorKeys();
    spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    // Комбо-клавиши
    this.input.keyboard.on('keydown-Q', () => triggerCombo('Q', this));
    this.input.keyboard.on('keydown-W', () => triggerCombo('W', this));
    this.input.keyboard.on('keydown-E', () => triggerCombo('E', this));
    this.input.keyboard.on('keydown-R', () => triggerCombo('R', this));
    
    // Анимации
    this.anims.create({
        key: 'explode',
        frames: this.anims.generateFrameNumbers('explosion'),
        frameRate: 20,
        repeat: 0
    });
    
    // Мобильное управление
    document.querySelectorAll('.mobile-btn').forEach(btn => {
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            let key = btn.getAttribute('data-key');
            simulateKey(key, true);
        });
        
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            let key = btn.getAttribute('data-key');
            simulateKey(key, false);
        });
    });
    
    // HUD обновление
    setInterval(() => {
        document.getElementById('health').textContent = '100';
        document.getElementById('combo-counter').textContent = comboCount + 'x';
        document.getElementById('portals').textContent = portals.length + '/3';
    }, 100);
}

// Игровой цикл
function update() {
    // Движение игрока
    let speed = 200;
    player.setVelocityX(0);
    
    if (cursors.left.isDown) {
        player.setVelocityX(-speed);
        player.setFlipX(true);
    } else if (cursors.right.isDown) {
        player.setVelocityX(speed);
        player.setFlipX(false);
    }
    
    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-350);
    }
    
    // Атака пробелом
    if (Phaser.Input.Keyboard.JustDown(spaceKey)) {
        createBullet(this);
    }
    
    // Создание портала (Shift)
    if (this.input.keyboard.checkDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT), 1000)) {
        createPortal(this);
    }
    
    // Авто-движение врагов
    enemies.forEach(enemy => {
        if (Math.random() < 0.02) {
            enemy.setVelocity(
                Phaser.Math.Between(-100, 100),
                Phaser.Math.Between(-100, 100)
            );
        }
    });
}

// Пули
function createBullet(scene) {
    let bullet = scene.physics.add.sprite(
        player.x + (player.flipX ? -30 : 30),
        player.y,
        'bullet'
    );
    
    bullet.setTint(0xffff00);
    bullet.setVelocityX(player.flipX ? -500 : 500);
    
    // Коллизия с врагами
    enemies.forEach(enemy => {
        scene.physics.add.overlap(bullet, enemy, () => {
            bullet.destroy();
            enemy.setTint(0xff0000);
            comboCount++;
            
            scene.time.delayedCall(100, () => {
                enemy.setTint(0xff5555);
            });
        });
    });
    
    // Автоудаление пули
    scene.time.delayedCall(2000, () => {
        if (bullet.active) bullet.destroy();
    });
}

// Портал
function createPortal(scene) {
    if (portals.length >= 3) {
        portals[0].destroy();
        portals.shift();
    }
    
    let portal = scene.physics.add.sprite(player.x, player.y, 'portal');
    portal.setTint(0xaa00ff);
    portal.setScale(1.5);
    
    // Анимация портала
    scene.tweens.add({
        targets: portal,
        scale: 2,
        alpha: 0.5,
        duration: 1000,
        yoyo: true,
        repeat: -1
    });
    
    portals.push(portal);
    
    // Телепорт при касании
    enemies.forEach(enemy => {
        scene.physics.add.overlap(portal, enemy, () => {
            if (portals.length > 1) {
                let targetPortal = portals[0] === portal ? portals[1] : portals[0];
                if (targetPortal) {
                    enemy.x = targetPortal.x;
                    enemy.y = targetPortal.y;
                    
                    // Эффект телепорта
                    let explosion = scene.add.sprite(enemy.x, enemy.y, 'explosion');
                    explosion.play('explode');
                    explosion.on('animationcomplete', () => explosion.destroy());
                }
            }
        });
    });
}

// Симуляция клавиш для мобильных
function simulateKey(key, isDown) {
    if (key === ' ') key = 'Space';
    
    let event = new KeyboardEvent(isDown ? 'keydown' : 'keyup', {
        key: key,
        code: key
    });
    
    document.dispatchEvent(event);
                    }
