import Phaser from 'phaser';

export class GameEngine {
  constructor(container, options) {
    this.callbacks = options;
    this.gameConfig = options.gameConfig;
    this.currentLevel = options.currentLevel;
    this.currentSword = 0;
    this.playerHealth = 100;
    this.playerEnergy = 100;
    this.score = 0;
    this.enemies = [];
    this.platforms = [];
    this.collectibles = [];

    const config = {
      type: Phaser.AUTO,
      width: container.offsetWidth,
      height: 500,
      parent: container,
      backgroundColor: this.currentLevel.background.primary,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 600 },
          debug: false
        }
      },
      scene: {
        preload: this.preload.bind(this),
        create: this.create.bind(this),
        update: this.update.bind(this)
      }
    };

    this.game = new Phaser.Game(config);
  }

  preload() {
    // Assign scene reference here, as preload is called before create
    this.scene = this.game.scene.scenes[0];

    // Create colored rectangles as sprites
    this.scene.add.graphics()
      .fillStyle(0x4a90e2)
      .fillRect(0, 0, 32, 32)
      .generateTexture('player', 32, 32);

    this.scene.add.graphics()
      .fillStyle(0x8b4513)
      .fillRect(0, 0, 30, 30)
      .generateTexture('zombie', 30, 30);

    this.scene.add.graphics()
      .fillStyle(0x800080)
      .fillRect(0, 0, 35, 35)
      .generateTexture('oni', 35, 35);

    this.scene.add.graphics()
      .fillStyle(0x654321)
      .fillRect(0, 0, 800, 20)
      .generateTexture('platform', 800, 20);

    this.scene.add.graphics()
      .fillStyle(0xffd700)
      .fillRect(0, 0, 16, 16)
      .generateTexture('essence', 16, 16);

    this.scene.add.graphics()
      .fillStyle(0xffffff)
      .fillRect(0, 0, 20, 20)
      .generateTexture('scroll', 20, 20);
  }

  create() {
    // this.scene is already assigned in preload, no need to reassign here
    
    // Create platforms from level data
    this.platformGroup = this.scene.physics.add.staticGroup();
    this.currentLevel.platforms.forEach(platform => {
      const p = this.platformGroup.create(platform.x + platform.width/2, platform.y + platform.height/2, 'platform');
      p.setScale(platform.width/800, 1);
      p.refreshBody();
    });

    // Create player
    this.player = this.scene.physics.add.sprite(this.gameConfig.playerDefaults.x, this.gameConfig.playerDefaults.y, 'player');
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    this.player.setTint(this.getSwordColor());

    // Create enemies from level data
    this.enemyGroup = this.scene.physics.add.group();
    this.currentLevel.enemies.forEach((enemyData, index) => {
      // Position enemies with some spacing to avoid overlap
      const x = 400 + (index * 200);
      const y = 320;
      
      const enemy = this.enemyGroup.create(x, y, enemyData.type === 'zombie' ? 'zombie' : 'oni');
      enemy.enemyData = {
        ...enemyData,
        x: x,
        y: y,
        health: enemyData.health,
        patrol: { start: x - 75, end: x + 75 }
      };
      enemy.direction = 1;
      enemy.setTint(Phaser.Display.Color.HexStringToColor(enemyData.color).color);
    });

    // Create collectibles from level data
    this.collectibleGroup = this.scene.physics.add.group();
    this.currentLevel.collectibles.forEach(collectible => {
      const item = this.collectibleGroup.create(collectible.x, collectible.y, 
        collectible.type === 'essence' ? 'essence' : 'scroll');
      item.collectibleData = collectible;
      item.setBounce(0.3);
    });

    // Physics collisions
    this.scene.physics.add.collider(this.player, this.platformGroup);
    this.scene.physics.add.collider(this.enemyGroup, this.platformGroup);
    this.scene.physics.add.collider(this.collectibleGroup, this.platformGroup);
    
    this.scene.physics.add.overlap(this.player, this.collectibleGroup, this.collectItem.bind(this));
    this.scene.physics.add.overlap(this.player, this.enemyGroup, this.playerHitEnemy.bind(this));

    // Create controls
    this.cursors = this.scene.input.keyboard.createCursorKeys();
    this.keys = this.scene.input.keyboard.addKeys('A,D,J,K,Q,E,SPACE');

    // UI Text
    this.createUI();

    // Energy regeneration
    this.energyTimer = this.scene.time.addEvent({
      delay: 1000,
      callback: this.regenerateEnergy.bind(this),
      loop: true
    });
  }

  createUI() {
    const swordData = this.gameConfig.elementalSwords[this.currentSword];
    this.swordText = this.scene.add.text(10, 10, `Espada: ${swordData.name}`, {
      fontSize: '18px',
      fill: swordData.color,
      fontFamily: 'Arial, sans-serif',
      stroke: '#000000',
      strokeThickness: 2
    });

    this.instructionText = this.scene.add.text(10, 450, 
      'A/D: Mover | SPACE: Pular | J: Atacar | K: Habilidade | Q/E: Trocar Espada', {
      fontSize: '14px',
      fill: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      stroke: '#000000',
      strokeThickness: 1
    });
  }

  update() {
    if (!this.player || !this.player.active) return;

    // Player movement
    if (this.keys.A.isDown) {
      this.player.setVelocityX(-this.gameConfig.playerDefaults.speed);
      this.player.setFlipX(true);
    } else if (this.keys.D.isDown) {
      this.player.setVelocityX(this.gameConfig.playerDefaults.speed);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }

    // Jumping
    if (this.keys.SPACE.isDown && this.player.body.touching.down) {
      this.player.setVelocityY(-this.gameConfig.playerDefaults.jumpPower);
    }

    // Sword switching
    if (Phaser.Input.Keyboard.JustDown(this.keys.Q)) {
      this.switchSword(-1);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.E)) {
      this.switchSword(1);
    }

    // Attack
    if (Phaser.Input.Keyboard.JustDown(this.keys.J)) {
      this.basicAttack();
    }

    // Special ability
    if (Phaser.Input.Keyboard.JustDown(this.keys.K)) {
      this.useSpecialAbility();
    }

    // Update enemies
    this.updateEnemies();
  }

  switchSword(direction) {
    this.currentSword = (this.currentSword + direction + this.gameConfig.elementalSwords.length) % this.gameConfig.elementalSwords.length;
    this.player.setTint(this.getSwordColor());
    
    const swordData = this.gameConfig.elementalSwords[this.currentSword];
    this.swordText.setText(`Espada: ${swordData.name}`);
    this.swordText.setColor(swordData.color);
    
    this.callbacks.onSwordChange(this.currentSword);
  }

  getSwordColor() {
    const swordData = this.gameConfig.elementalSwords[this.currentSword];
    return Phaser.Display.Color.HexStringToColor(swordData.color).color;
  }

  basicAttack() {
    // Create attack effect
    const attackRange = 50;
    const attackX = this.player.flipX ? this.player.x - attackRange : this.player.x + attackRange;
    
    // Visual effect
    const swordColor = this.getSwordColor();
    const attack = this.scene.add.rectangle(attackX, this.player.y, 30, 5, swordColor);
    this.scene.tweens.add({
      targets: attack,
      alpha: 0,
      duration: 200,
      onComplete: () => attack.destroy()
    });

    // Check for enemy hits
    this.enemyGroup.children.entries.forEach(enemy => {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (distance < attackRange) {
        this.damageEnemy(enemy, 25);
      }
    });
  }

  useSpecialAbility() {
    const swordData = this.gameConfig.elementalSwords[this.currentSword];
    
    if (this.playerEnergy < swordData.energyCost) return;
    
    this.playerEnergy -= swordData.energyCost;
    this.callbacks.onEnergyChange(this.playerEnergy);

    // Special ability effects
    switch (swordData.id) {
      case 'wind':
        this.windAbility();
        break;
      case 'fire':
        this.fireAbility();
        break;
      case 'water':
        this.waterAbility();
        break;
      case 'lightning':
        this.lightningAbility();
        break;
    }
  }

  windAbility() {
    // Create wind effect
    const windEffect = this.scene.add.ellipse(this.player.x, this.player.y, 100, 50, 0x00ff88, 0.3);
    this.scene.tweens.add({
      targets: windEffect,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 500,
      onComplete: () => windEffect.destroy()
    });

    // Push enemies away
    this.enemyGroup.children.entries.forEach(enemy => {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (distance < 100) {
        const pushX = enemy.x > this.player.x ? 200 : -200;
        enemy.setVelocityX(pushX);
        this.damageEnemy(enemy, 15);
      }
    });
  }

  fireAbility() {
    // Create fire wave
    for (let i = 0; i < 5; i++) {
      const fireX = this.player.x + (i * 40) - 80;
      const fire = this.scene.add.circle(fireX, this.player.y + 20, 20, 0xff4444, 0.7);
      this.scene.tweens.add({
        targets: fire,
        scaleX: 1.5,
        scaleY: 1.5,
        alpha: 0,
        duration: 800,
        delay: i * 100,
        onComplete: () => fire.destroy()
      });
    }

    // Damage enemies in area
    this.enemyGroup.children.entries.forEach(enemy => {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (distance < 120) {
        this.damageEnemy(enemy, 30);
      }
    });
  }

  waterAbility() {
    // Create water jet
    const jetLength = 150;
    const jetX = this.player.flipX ? this.player.x - jetLength/2 : this.player.x + jetLength/2;
    const water = this.scene.add.rectangle(jetX, this.player.y, jetLength, 20, 0x4488ff, 0.6);
    this.scene.tweens.add({
      targets: water,
      alpha: 0,
      duration: 600,
      onComplete: () => water.destroy()
    });

    // Push enemies and damage
    this.enemyGroup.children.entries.forEach(enemy => {
      const inRange = this.player.flipX ? 
        (enemy.x < this.player.x && enemy.x > this.player.x - jetLength) :
        (enemy.x > this.player.x && enemy.x < this.player.x + jetLength);
      
      if (inRange && Math.abs(enemy.y - this.player.y) < 50) {
        const pushX = this.player.flipX ? -300 : 300;
        enemy.setVelocityX(pushX);
        this.damageEnemy(enemy, 20);
      }
    });
  }

  lightningAbility() {
    // Lightning dash effect
    const dashDistance = 200;
    const targetX = this.player.flipX ? 
      Math.max(50, this.player.x - dashDistance) : 
      Math.min(this.scene.game.config.width - 50, this.player.x + dashDistance);

    // Create lightning trail
    const trail = this.scene.add.line(0, 0, this.player.x, this.player.y, targetX, this.player.y, 0xffff44);
    trail.setLineWidth(5);
    trail.setAlpha(0.8);
    
    this.scene.tweens.add({
      targets: trail,
      alpha: 0,
      duration: 300,
      onComplete: () => trail.destroy()
    });

    // Teleport player
    this.player.setPosition(targetX, this.player.y);
    this.player.setTint(0xffff44);
    
    // Reset color after effect
    this.scene.time.delayedCall(200, () => {
      this.player.setTint(this.getSwordColor());
    });

    // Damage enemies in path
    this.enemyGroup.children.entries.forEach(enemy => {
      const inPath = (this.player.flipX && enemy.x > targetX && enemy.x < this.player.x + dashDistance) ||
                     (!this.player.flipX && enemy.x < targetX && enemy.x > this.player.x - dashDistance);
      
      if (inPath && Math.abs(enemy.y - this.player.y) < 40) {
        enemy.setTint(0xffff44);
        this.scene.time.delayedCall(100, () => enemy.clearTint());
        this.damageEnemy(enemy, 40);
      }
    });
  }

  updateEnemies() {
    this.enemyGroup.children.entries.forEach(enemy => {
      if (!enemy.enemyData) return;

      const data = enemy.enemyData;
      
      // Basic AI patrol
      if (enemy.direction === 1 && enemy.x >= data.patrol.end) {
        enemy.direction = -1;
        enemy.setFlipX(true);
      } else if (enemy.direction === -1 && enemy.x <= data.patrol.start) {
        enemy.direction = 1;
        enemy.setFlipX(false);
      }

      enemy.setVelocityX(enemy.direction * data.speed);

      // Floating behavior for Onis
      if (data.type === 'oni' && data.canFly) {
        const floatY = data.y + Math.sin(this.scene.time.now * 0.003) * 20;
        enemy.setY(floatY);
      }
    });
  }

  damageEnemy(enemy, damage) {
    if (!enemy.enemyData.health) enemy.enemyData.health = enemy.enemyData.type === 'zombie' ? 30 : 40;
    
    enemy.enemyData.health -= damage;
    
    // Flash effect
    enemy.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => enemy.clearTint());

    if (enemy.enemyData.health <= 0) {
      this.score += enemy.enemyData.scoreValue || 100;
      this.callbacks.onScoreChange(this.score);
      enemy.destroy();
    }
  }

  playerHitEnemy(player, enemy) {
    if (this.scene.time.now - (this.lastHit || 0) < 1000) return;
    
    this.lastHit = this.scene.time.now;
    this.playerHealth -= 10;
    this.callbacks.onHealthChange(this.playerHealth);
    
    // Knockback
    const knockbackX = player.x < enemy.x ? -200 : 200;
    player.setVelocityX(knockbackX);
    player.setTint(0xff0000);
    
    this.scene.time.delayedCall(200, () => {
      player.setTint(this.getSwordColor());
    });

    if (this.playerHealth <= 0) {
      this.gameOver();
    }
  }

  collectItem(player, item) {
    const data = item.collectibleData;
    
    if (data.type === 'essence') {
      this.playerEnergy = Math.min(100, this.playerEnergy + 20);
      this.callbacks.onEnergyChange(this.playerEnergy);
      this.score += data.scoreValue || 50;
    } else if (data.type === 'scroll') {
      this.score += data.scoreValue || 100;
    }
    
    this.callbacks.onScoreChange(this.score);
    item.destroy();
  }

  regenerateEnergy() {
    if (this.playerEnergy < 100) {
      this.playerEnergy = Math.min(100, this.playerEnergy + 5);
      this.callbacks.onEnergyChange(this.playerEnergy);
    }
  }

  gameOver() {
    this.scene.scene.pause();
    // Game over logic would go here
  }

  pause() {
    if (this.game && this.game.scene.scenes[0]) {
      this.game.scene.scenes[0].scene.pause();
    }
  }

  resume() {
    if (this.game && this.game.scene.scenes[0]) {
      this.game.scene.scenes[0].scene.resume();
    }
  }

  destroy() {
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
  }
}

