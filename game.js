// PORTAL KOMBAT - Полная версия игры
console.log('🚀 Portal Kombat загружен!');

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
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
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

// Глобальные переменные
let game;
let player;
let platforms;
let enemies = [];
let cursors;
let spaceKey;
let shiftKey;
let qKey, wKey, eKey, rKey;
let comboSequence = [];
let comboText;
let score = 0;
let scoreText;
let portals = [];
let lastPortalTime = 0;
let isPlayerAlive = true;

// ЗАГРУЗКА РЕСУРСОВ
function preload() {
    // Используем базовые спрайты Phaser (доступны онлайн)
    this.load.image('sky', 'https://labs.phaser.io/assets/skies/space3.png');
    this.load.image('ground', 'https://labs.phaser.io/assets/sprites/platform.png');
    this.load.image('star', 'https://labs.phaser.io/assets/sprites/star.png');
    this.load.image('bomb', 'https://labs.phaser.io/assets/sprites/orb-blue.png');
    this.load.image('portal', 'https://labs.phaser.io/assets/sprites/bubble.png');
    this.load.image('player', 'https://labs.phaser.io/assets/sprites/phaser3-ship.png');
    
    // Загрузка врагов (разные цвета)
    this.load.image('enemy1', 'https://labs.phaser.io/assets/sprites/orb-red.png');
    this.load.image('enemy2', 'https://labs.phaser.io/assets/sprites/orb-green.png');
    this.load.image('enemy3', 'https://labs.phaser.io/assets/sprites/orb-yellow.png');
    
    // Эффекты
    this.load.spritesheet('explosion', 
        'https://labs.phaser.io/assets/sprites/explosion.png',
        { frameWidth: 64, frameHeight: 64 }
    );
    
    // Звуки (если нужны позже)
    // this.load.audio('jump', 'https://labs.phaser.io/assets/audio/SoundEffects/jump.mp3');
}

// СОЗДАНИЕ ИГРЫ
function create() {
    // 1. ФОН
    this.add.image(400, 300, 'sky').setScale(2);
    
    // 2. ПЛАТФОРМЫ (платформерная карта)
    platforms = this.physics.add.staticGroup();
    
    // Основная земля
    platforms.create(400, 568, 'ground').setScale(2).refreshBody();
    
    // Платформы для прыжков
    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');
    platforms.create(300, 350, 'ground');
    platforms.create(500, 150, 'ground');
    
    // 3. ИГРОК
    player = this.physics.add.sprite(100, 450, 'player');
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);
    player.setScale(1.5);
    player.setTint(0x00ffff); // Голубой цвет
    
    // 4. ВРАГИ
    const enemyTypes = ['enemy1', 'enemy2', 'enemy3'];
    
    for (let i = 0; i < 8; i++) {
        const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        const enemy = this.physics.add.sprite(
            Phaser.Math.Between(100, 700),
            Phaser.Math.Between(50, 300),
            enemyType
        );
        
        enemy.setBounce(1);
        enemy.setCollideWorldBounds(true);
        enemy.setVelocity(
            Phaser.Math.Between(-100, 100),
            Phaser.Math.Between(-100, 100)
        );
        
        // Уникальный цвет для каждого типа
        const tints = [0xff5555, 0x55ff55, 0xffff55];
        enemy.setTint(tints[enemyTypes.indexOf(enemyType)]);
        
        enemies.push(enemy);
    }
    
    // 5. ФИЗИКА
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(enemies, platforms);
    this.physics.add.collider(enemies, enemies);
    
    // Коллизия игрока с врагами (урон)
    this.physics.add.overlap(player, enemies, hitEnemy, null, this);
    
    // 6. УПРАВЛЕНИЕ
    cursors = this.input.keyboard.createCursorKeys();
    spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    
    // Клавиши комбо
    qKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    
    // 7. ИНТЕРФЕЙС
    // Текст комбо
    comboText = this.add.text(20, 20, 'КОМБО: 0x', {
        fontSize: '28px',
        fill: '#0ff',
        stroke: '#000',
        strokeThickness: 4,
        fontFamily: 'Courier'
    });
    
    // Счет
    scoreText = this.add.text(20, 60, 'СЧЕТ: 0', {
        fontSize: '24px',
        fill: '#fff',
        fontFamily: 'Arial'
    });
    
    // Инструкции
    this.add.text(20, 550, 'Управление: ←→↑↓ ПРОБЕЛ(атака) SHIFT(портал) QWER(комбо)', {
        fontSize: '16px',
        fill: '#aaa'
    });
    
    // 8. АНИМАЦИИ
    this.anims.create({
        key: 'explode',
        frames: this.anims.generateFrameNumbers('explosion'),
        frameRate: 20,
        repeat: 0
    });
    
    // 9. СОБИРАЕМЫЕ ЗВЕЗДЫ (для очков)
    const stars = this.physics.add.group({
        key: 'star',
        repeat: 11,
        setXY: { x: 12, y: 0, stepX: 70 }
    });
    
    stars.children.iterate(child => {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        child.setTint(0xffff00);
    });
    
    this.physics.add.collider(stars, platforms);
    this.physics.add.overlap(player, stars, collectStar, null, this);
    
    // 10. КАМЕРА СЛЕДИТ ЗА ИГРОКОМ
    this.cameras.main.startFollow(player);
}

// ОБРАБОТЧИК СТОЛКНОВЕНИЯ С ВРАГОМ
function hitEnemy(player, enemy) {
    if (!isPlayerAlive) return;
    
    // Враг исчезает
    enemy.disableBody(true, true);
    
    // Создаем эффект взрыва
    const explosion = player.scene.add.sprite(enemy.x, enemy.y, 'explosion');
    explosion.play('explode');
    explosion.on('animationcomplete', () => explosion.destroy());
    
    // Увеличиваем счет
    score += 100;
    scoreText.setText('СЧЕТ: ' + score);
    
    // Увеличиваем комбо
    const comboCount = comboSequence.length > 0 ? comboSequence.length : 1;
    comboText.setText('КОМБО: ' + comboCount + 'x');
    
    // Меняем цвет комбо текста
    const colors = ['#fff', '#0ff', '#ff0', '#f0f', '#f00'];
    comboText.setFill(colors[Math.min(comboCount - 1, colors.length - 1)]);
    
    // Удаляем врага из массива
    const index = enemies.indexOf(enemy);
    if (index > -1) enemies.splice(index, 1);
}

// СОБРАТЬ ЗВЕЗДУ
function collectStar(player, star) {
    star.disableBody(true, true);
    
    score += 10;
    scoreText.setText('СЧЕТ: ' + score);
    
    // Если собраны все звезды - появляются новые враги
    if (score % 100 === 0) {
        spawnNewEnemies(player.scene);
    }
}

// ОСНОВНОЙ ЦИКЛ
function update() {
    if (!isPlayerAlive) return;
    
    // ДВИЖЕНИЕ ИГРОКА
    const speed = 160;
    
    if (cursors.left.isDown) {
        player.setVelocityX(-speed);
        player.setFlipX(true);
    } else if (cursors.right.isDown) {
        player.setVelocityX(speed);
        player.setFlipX(false);
    } else {
        player.setVelocityX(0);
    }
    
    // ПРЫЖОК
    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-330);
    }
    
    // АТАКА (ПРОБЕЛ)
    if (Phaser.Input.Keyboard.JustDown(spaceKey)) {
        performAttack();
    }
    
    // СОЗДАНИЕ ПОРТАЛА (SHIFT)
    if (Phaser.Input.Keyboard.JustDown(shiftKey)) {
        createPortal();
    }
    
    // КОМБО КЛАВИШИ
    const comboKeys = [qKey, wKey, eKey, rKey];
    const comboLetters = ['Q', 'W', 'E', 'R'];
    
    comboKeys.forEach((key, index) => {
        if (Phaser.Input.Keyboard.JustDown(key)) {
            addToCombo(comboLetters[index]);
        }
    });
    
    // АВТОМАТИЧЕСКОЕ ДВИЖЕНИЕ ВРАГОВ
    enemies.forEach(enemy => {
        if (Math.random() < 0.01) {
            enemy.setVelocity(
                Phaser.Math.Between(-150, 150),
                Phaser.Math.Between(-150, 150)
            );
        }
        
        // Преследование игрока (30% врагов)
        if (Math.random() < 0.3) {
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            
            if (distance < 300) {
                enemy.setVelocity(
                    (dx / distance) * 80,
                    (dy / distance) * 80
                );
            }
        }
    });
}

// АТАКА ИГРОКА
function performAttack() {
    // Создаем "пулю" от игрока
    const bullet = player.scene.physics.add.sprite(
        player.x + (player.flipX ? -30 : 30),
        player.y - 10,
        'star'
    );
    
    bullet.setTint(0xff0000);
    bullet.setVelocityX(player.flipX ? -400 : 400);
    bullet.setVelocityY(-100);
    
    // Уничтожаем врагов при попадании
    enemies.forEach(enemy => {
        player.scene.physics.add.overlap(bullet, enemy, (bullet, enemy) => {
            bullet.destroy();
            hitEnemy(player, enemy);
        });
    });
    
    // Автоуничтожение пули через 2 секунды
    player.scene.time.delayedCall(2000, () => {
        if (bullet.active) bullet.destroy();
    });
    
    // Эффект атаки
    showAttackEffect();
}

// ЭФФЕКТ АТАКИ
function showAttackEffect() {
    const graphics = player.scene.add.graphics();
    graphics.lineStyle(3, 0xff5555, 1);
    
    const startX = player.x + (player.flipX ? -40 : 40);
    graphics.lineBetween(startX, player.y - 20, startX + (player.flipX ? -50 : 50), player.y - 20);
    
    player.scene.time.delayedCall(100, () => graphics.destroy());
}

// СОЗДАТЬ ПОРТАЛ
function createPortal() {
    const now = Date.now();
    if (now - lastPortalTime < 2000) return; // Кулдаун 2 секунды
    
    lastPortalTime = now;
    
    // Максимум 2 портала одновременно
    if (portals.length >= 2) {
        portals[0].destroy();
        portals.shift();
    }
    
    const portal = player.scene.physics.add.sprite(player.x, player.y, 'portal');
    portal.setTint(0xaa00ff);
    portal.setScale(1.5);
    
    // Анимация пульсации
    player.scene.tweens.add({
        targets: portal,
        scale: 2.2,
        alpha: 0.7,
        duration: 800,
        yoyo: true,
        repeat: -1
    });
    
    portals.push(portal);
    
    // ТЕЛЕПОРТАЦИЯ: при касании портала враги телепортируются
    enemies.forEach(enemy => {
        player.scene.physics.add.overlap(portal, enemy, (portal, enemy) => {
            if (portals.length > 1) {
                const targetPortal = portals[0] === portal ? portals[1] : portals[0];
                if (targetPortal && targetPortal.active) {
                    // Телепортация
                    enemy.x = targetPortal.x;
                    enemy.y = targetPortal.y;
                    
                    // Эффект телепорта
                    const effect = player.scene.add.sprite(enemy.x, enemy.y, 'explosion');
                    effect.play('explode');
                    effect.setTint(0xaa00ff);
                    effect.on('animationcomplete', () => effect.destroy());
                }
            }
        });
    });
    
    // Автоудаление портала через 10 секунд
    player.scene.time.delayedCall(10000, () => {
        if (portal.active) {
            portal.destroy();
            const index = portals.indexOf(portal);
            if (index > -1) portals.splice(index, 1);
        }
    });
}

// СИСТЕМА КОМБО
function addToCombo(key) {
    comboSequence.push(key);
    
    // Ограничение длины комбо
    if (comboSequence.length > 6) {
        comboSequence.shift();
    }
    
    // Показываем текущее комбо
    comboText.setText('КОМБО: ' + comboSequence.join(''));
    
    // Сбрасываем комбо через 3 секунды
    player.scene.time.delayedCall(3000, () => {
        if (comboSequence.length > 0) {
            executeCombo();
            comboSequence = [];
            comboText.setText('КОМБО: 0x');
            comboText.setFill('#0ff');
        }
    });
}

// ВЫПОЛНЕНИЕ КОМБО
function executeCombo() {
    const comboString = comboSequence.join('');
    
    const combos = {
        'QWE': { name: '🌀 ПОРТАЛЬНЫЙ УДАР', damage: 3, color: 0xaa00ff },
        'WER': { name: '⚡ ЦЕПНАЯ МОЛНИЯ', damage: 2, color: 0x00ffff },
        'QER': { name: '💥 ГРАВИТОННЫЙ ВЗРЫВ', damage: 4, color: 0xffff00 },
        'QQQ': { name: '👊 ТРОЙНОЙ УДАР', damage: 2, color: 0xff5555 },
        'WWW': { name: '🛡️ ЗАЩИТНОЕ ПОЛЕ', damage: 0, color: 0x55ff55 }
    };
    
    const combo = combos[comboString];
    if (combo) {
        // Показываем название комбо
        const text = player.scene.add.text(
            player.x, player.y - 50,
            combo.name,
            {
                fontSize: '24px',
                fill: '#' + combo.color.toString(16),
                stroke: '#000',
                strokeThickness: 4,
                fontFamily: 'Courier'
            }
        );
        text.setOrigin(0.5);
        
        // Анимация появления текста
        player.scene.tweens.add({
            targets: text,
            y: player.y - 100,
            alpha: 0,
            duration: 2000,
            onComplete: () => text.destroy()
        });
        
        // Применяем эффект комбо
        applyComboEffect(combo);
        
        // Увеличиваем счет за комбо
        score += combo.damage * 50;
        scoreText.setText('СЧЕТ: ' + score);
    }
}

// ЭФФЕКТ КОМБО
function applyComboEffect(combo) {
    switch(combo.name) {
        case '🌀 ПОРТАЛЬНЫЙ УДАР':
            // Создаем 3 портала
            for (let i = 0; i < 3; i++) {
                player.scene.time.delayedCall(i * 300, () => {
                    createPortal();
                });
            }
            break;
            
        case '⚡ ЦЕПНАЯ МОЛНИЯ':
            // Молния между врагами
            enemies.forEach(enemy => {
                const graphics = player.scene.add.graphics();
                graphics.lineStyle(2, 0x00ffff, 1);
                graphics.lineBetween(player.x, player.y, enemy.x, enemy.y);
                
                player.scene.time.delayedCall(200, () => graphics.destroy());
                
                // Урон врагу
                hitEnemy(player, enemy);
            });
            break;
            
        case '💥 ГРАВИТОННЫЙ ВЗРЫВ':
            // Взрыв отталкивает врагов
            enemies.forEach(enemy => {
                const dx = enemy.x - player.x;
                const dy = enemy.y - player.y;
                const distance = Math.sqrt(dx*dx + dy*dy);
                
                if (distance < 200) {
                    enemy.setVelocity(
                        (dx / distance) * 500,
                        (dy / distance) * 500
                    );
                }
            });
            break;
            
        case '👊 ТРОЙНОЙ УДАР':
            // Три быстрые атаки
            for (let i = 0; i < 3; i++) {
                player.scene.time.delayedCall(i * 200, () => {
                    performAttack();
                });
            }
            break;
    }
}

// ПОЯВЛЕНИЕ НОВЫХ ВРАГОВ
function spawnNewEnemies(scene) {
    const enemyTypes = ['enemy1', 'enemy2', 'enemy3'];
    
    for (let i = 0; i < 3; i++) {
        const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        const enemy = scene.physics.add.sprite(
            Phaser.Math.Between(50, 750),
            Phaser.Math.Between(50, 200),
            enemyType
        );
        
        enemy.setBounce(1);
        enemy.setCollideWorldBounds(true);
        enemy.setVelocity(
            Phaser.Math.Between(-150, 150),
            Phaser.Math.Between(-150, 150)
        );
        
        const tints = [0xff5555, 0x55ff55, 0xffff55];
        enemy.setTint(tints[enemyTypes.indexOf(enemyType)]);
        
        scene.physics.add.collider(enemy, platforms);
        enemies.push(enemy);
    }
}

// ЗАПУСК ИГРЫ
game = new Phaser.Game(config);
