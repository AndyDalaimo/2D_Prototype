/*   Revision History 2D Game Prototype

    25/10/2022 - Andrew Dalaimo - main.js is where the game's 
    logic is stored. Where the Phaser scene is set and given variables. 
    25/10/2022 - Andrew Dalaimo - Added Enemy to scene. Added assets and loaded spritesheets for 
    enemy and enemy fire attack. Player has movement animation (left, right, and idle)
    25/10/2022 - Andrew Dalaimo - Added controls with mouse and fixed some animations
    27/10/2022 - Andrew Dalaimo - Added variables for health and enemy state. Need to implement 
    classes to trigger those events
    31/10/2022 - Andrew Dalaimo - Added Enemy Class. This class will handle enemy's different states
    as well as when an attack hits a player. 
    01/11/2022 - Andrew Dalaimo - Added fade functions to fade in and out the alpha of enemy 
    for stage 2. 
    07/11/2022 - Andrew Dalaimo - Added healthbar class to handle UI for player 
    health and enemy health
    09/11/2022 - Andrew Dalaimo - Finsished Stage 2. Randomly spawn shield and parry enemy attacks to
    beat stage. Initiate stage 3.
    11/11/2022 - Andrew Dalaimo - Added Health bar for player. Need to add gameover state for after 
    the player loses all HP. (in hitPlayer within Enemy Class)
    13/11/2022 - Andrew Dalaimo - Finished stage 3 and win state. Updated shield/bubble mechanic. 
    14/11/2022 - Andrew Dalaimo - After play testing, update shield colliders with platforms, 
    reworked stage 3. 
    20/11/2022 - Andrew Dalaimo - Shield colliders fixed in Stage 3. Now recognize all projectiles.

    @author Andrew Dalaimo
*/

var config = {
    type: Phaser.Auto,
    width: 1280,
    height: 720,
    physics: {
        default: 'arcade',
        arcade : {
            gravity: {y: 1000},
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update,
    },
};

var game = new Phaser.Game(config);

// Variables in game

let platforms,
    ground,
    player,
    playerHP,
    canvas,
    staff,
    state,
    shield,
    enemy,
    enemy_attack,
    projectiles,
    enemy_health = 1,
    enemy_state = 1,
    player_attack,
    player_health = 0,
    hasStaff = false, // Set true for testing
    hasShield = false,
    keyW,
    keyA,
    keyS,
    keyD,
    keySpace,
    timer_DestroyFire,
    timer_shieldSpawn,
    timer_EnemySpawn,
    timer_EnemyAlpha,
    timer_EnemyAttack;


function preload() 
{
    // Set canvas variable
    canvas = this.game.canvas;
    this.load.image('background', 'assets/static_Background.png');
    this.load.spritesheet('player', 'assets/lpc-necromancer.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('enemy', 'assets/wizard_walking.png', { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('blue', 'assets/blueFire.png', { frameWidth: 64, frameHeight: 64 });
    this.load.image('blueStaff', 'assets/blueStaff.png');
    this.load.image('bullet', 'assets/fireIcon.png');
    this.load.image('ground', 'assets/grassLongPlatform.png');
    this.load.image('enemyProjectile', 'assets/enemyProjectile.png');
    this.load.image('blueShield', 'assets/spr_shield.png');
    this.load.spritesheet('explosion', 'assets/Explosion.png', { frameWidth: 96, frameHeight: 96});
    this.load.image('platforms', 'assets/platform.png');
}

function create()
{
    // Add in background
    this.add.image(640, 360, 'background');

    // Groups of static objects that will be interacted with
    ground = this.physics.add.staticGroup();
    platforms = this.physics.add.staticGroup();
    staff = this.physics.add.staticGroup();
    
    // Text indicating Phase 1. Will delete itself after delayed timer.
    let phaseOneText = new Phaser.GameObjects.Text(this, 640, 350, 'Phase 1', 100, 
           { font: "Press Start 2P" });
    this.add.existing(phaseOneText);
    let timedEvent = this.time.delayedCall(3000, onEvent, [], this);
    function onEvent()
    {
        phaseOneText.destroy();
    }

    // Acts as ground for player
    ground.create(150, 750, 'ground');
    ground.create(450, 750, 'ground');
    ground.create(750, 750, 'ground');
    ground.create(1050, 750, 'ground');
    ground.create(1350, 750, 'ground');

    // platforms
    platforms.create(500, 550, 'platforms').setScale(.8).refreshBody();
    platforms.create(1200, 400, 'platforms').setScale(.8).refreshBody();
    platforms.create(700, 400, 'platforms').setScale(.8).refreshBody();
    platforms.create(300, 450, 'platforms').setScale(.5).refreshBody();
    platforms.create(100, 200, 'platforms').setScale(.5).refreshBody();
    platforms.create(900, 300, 'platforms').setScale(.3).refreshBody();

    // Create staff for player to pick up
    staff.create(1200, 350, 'blueStaff').setScale(.2).refreshBody();

    // Add in Player and Enemy
    player = this.physics.add.sprite(1200, 550, 'player');
    enemy = this.physics.add.sprite(100, 150, 'enemy').setScale(1.5).refreshBody();

    // Player's physics properties
    player.setCollideWorldBounds(true);
    playerHP = new HealthBar(this, 0, 0, 10, 440);

    // Enemy's initial physics properties for initial state
    initialState = new Enemy(enemy_state, this, player, enemy, ground, platforms);
    initialState.setState(enemy_state);

    // Set Colliders 
    this.physics.add.collider(player, ground);
    this.physics.add.collider(enemy, ground);
    this.physics.add.collider(enemy, platforms);
    this.physics.add.collider(player, platforms);
    this.physics.add.overlap(player, enemy);

    // Set Physics overlap for Player and Staff. Sets hasStaff to true. 
    this.physics.add.overlap(player, staff, collectStaff, null, this);

    // Set Player Animations for all movements

    this.anims.create({
        key: 'jump',
        frames: this.anims.generateFrameNumbers('player', { start: 39, end: 45 }),
        frameRate: 5,
        repeat: -1
    });

    this.anims.create({
        key: 'jumpRight',
        frames: this.anims.generateFrameNumbers('player', { start: 40, end: 45 }),
        frameRate: 5,
        repeat: -1
    });

    this.anims.create({
        key: 'jumpLeft',
        frames: this.anims.generateFrameNumbers('player', { start: 15, end: 19 }),
        frameRate: 5,
        repeat: -1
    });

    this.anims.create({
        key: 'idle',
        frames: [ { key: 'player', frame: 6 } ],
        frameRate: 20,
    });

    this.anims.create({
        key: 'walkRight',
        frames: this.anims.generateFrameNumbers('player', { start: 145, end: 151 }),
        frameRate: 8,
        repeat: -1
    });

    this.anims.create({
        key: 'walkLeft',
        frames: this.anims.generateFrameNumbers('player', { start: 119, end: 125 }),
        frameRate: 8,
        repeat: -1
    });

    this.anims.create({
        key: 'explode',
        frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 11}),
        frameRate: 10,
        repeat: 0
    });

    // Enemy Animations
    this.anims.create({
        key: 'enemyIdle',
        frames: this.anims.generateFrameNumbers('enemy', { start: 0, end: 2 }),
        frameRate: 8,
        repeat: -1
    });

    // Blue Fire / attack animation
    this.anims.create({
        key: 'blueFire',
        frames: this.anims.generateFrameNumbers('blue', { start: 0, end: 60 }),
        frameRate: 60,
        repeat: -1
    });


    // Setup controller
    keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
}

function update()
{
    // Move Player with Controls and set animations according to direction and 
    // if the player is touching the ground or not
    if (keyA.isDown)
    {
        if (!player.body.touching.down)
        {
            player.anims.play('jumpLeft', true);
        }
        else 
        {
            player.anims.play('walkLeft', true);
        }
        player.setVelocityX(-300);
    } 
    else if (keyD.isDown)
    {
        if (!player.body.touching.down)
        {
            player.anims.play('jumpRight', true);
        }
        else 
        {
            player.anims.play('walkRight', true);
        }
        player.setVelocityX(300);
    } 
     else 
    {
        player.setVelocityX(0);
        // Idle Animation
        player.anims.play('idle');
    }

    // Jump
    if (keySpace.isDown && player.body.touching.down && !hasShield)
    {
        player.setVelocityY(-500);
    } 
    if (!keyA.isDown && !keyD.isDown 
        && !player.body.touching.down) 
    {
        player.anims.play('jump', true);
    }

    // play Enemy animation
    enemy.anims.play('enemyIdle', true);

    // Fire with mouse. Using some trig, grab the angle between mouse and player
    // position, then set velocity. 
    let pointer = this.input.activePointer;
    if (pointer.isDown && hasStaff)
    {  
        // Get angle (in radians) of mouse pointer and position of player
        let angle = Math.atan2((pointer.y-player.y), (pointer.x-player.x));

        // Set velocity from this angle, convert radians into Degrees for function
        let velo = this.physics.velocityFromAngle((angle*180)/Math.PI, 75);

        if (pointer.getDuration() < 2)
        {
            player_attack = this.physics.add.sprite(player.x, player.y, 'blueFire');
            player_attack.setScale(0.5);

            // Player Hits enemy (collider not activated while Enemy is fading in and out)
            if (enemy.alpha > 0.1)
            {
                this.physics.add.collider(player_attack, enemy, hitEnemy, null, this);
            }

            // Destroy attack sprite if it hits platform
            this.physics.add.collider(player_attack, ground, destroy, null, this);
            this.physics.add.collider(player_attack, platforms, destroy, null, this);
            this.physics.add.collider(player_attack, platforms, destroy, null, this);

            // Set Velocity(speed and direction) of player's attack
            player_attack.setVelocityX(velo.x * 20);
            player_attack.setVelocityY(velo.y * 20);
            player_attack.body.setGravity(0,-1000); 

            // player_attack.setCollideWorldBounds(true);
            if (player_attack.x > canvas.x || player_attack.x < canvas.x 
                || player_attack.y > canvas.y || player_attack.y < 0)
            {
                player_attack.destroy();
            }
            
            player_attack.anims.play('blueFire', true);
        }
    }

    // if player collects shield, gravity is negated and player will float 
    if (hasShield)
    {
        player.setGravity(0, -1200);
        if (keyW.isDown)
        {
            player.setVelocityY(-200);
        }
        if (keyS.isDown)
        {
            player.setVelocityY(200);
        }
    } else {
        player.setGravity(0, 0);
    }

}

/*
    HUGE HUGE HUGE -- Pass IN a reference of the game variables to be referenced in Enemy 
    local scope. Resumes Physics after different stage is set and timer begins for 
    enemy finite state.

    TODO -- 
    FIX ME -- 
*/
class Enemy {
    projectiles;
    projectile = [];
    shield;
    shieldPlatformCollider;
    state = 1;
    enemy_attack;
    shields;
    // Spawn points are slightly above static platforms
    spawnPoints = [ [640, 510], [50, 580], [1200, 580], [50, 230], [1230, 230], [1000, 500], [1100, 200] ];
    constructor(state, game, player, enemy, ground, platforms) {
        this.state = state;
        this.game = game;
        this.player = player;
        this.enemy = enemy;
        this.ground = ground;
        this.platforms = platforms;
        this.hp = new HealthBar(game, 1, 600, 340, 40);

        this.enemy.setCollideWorldBounds(true);
    }
    // Logic for enemy in specific state
    setState(x)
    {
        if (x == 1)
        {
            // Group of enemy attacks will be created and destroyed within state
            projectiles = this.game.physics.add.group();
            projectiles.maxSize = 3;
            console.log("New Enemy state: " + x);
            // Creates a timed event to shoot every 2 Seconds in a random direction. Projectile 
            // will bounce on ground and pass through platforms
            timer_EnemyAttack = this.game.time.addEvent({ delay: 2000, 
                callback: onEvent, callbackScope: this, loop: true });

            function onEvent()
            {
                if (projectiles.countActive(true) < projectiles.maxSize)
                {
                    let projectile = projectiles.create(enemy.x+5, enemy.y-5, 'enemyProjectile');
                    console.log(projectiles.countActive(true));
                    projectile.setBounce(1);
                    projectile.setVelocityY(Phaser.Math.Between(-400, 400), 20);
                    projectile.setVelocityX(Phaser.Math.Between(-800, 800), 10);
                    projectile.setCollideWorldBounds(true);
                    this.game.physics.add.collider(projectile, ground);
                    this.game.physics.add.collider(projectile, player, hitPlayer, null, this);               
                }
            }

        } 
        else if (x == 2)
        {
            // Player restarts phase without staff
            this.state++;
            hasStaff = false;
            
            // Reset position of Player and Enemy 
            player.x = 1200;
            player.y = 610;
            enemy.x = 50;
            enemy.y = 230;

            // Group of shields (1). To be dropped after it is destroyed. Repeating in timed event. 
            this.shields = this.game.physics.add.group();
            this.shields.maxSize = 1;

            // Clear projectiles and platforms left on screen
            projectiles.clear(true, true);
            platforms.clear(true, true);
            // Create new platforms for second phase
            platforms.create(650, 360, 'platforms').setScale(0.5).refreshBody();
            platforms.create(120, 280, 'platforms').setScale(1).refreshBody();
            platforms.create(320, 450, 'platforms').setScale(0.5).refreshBody();
            platforms.create(970, 450, 'platforms').setScale(0.5).refreshBody();
            platforms.create(640, 560, 'platforms').setScale(1).refreshBody();
            platforms.create(1160, 280, 'platforms').setScale(1).refreshBody();

            // Destroy event from last phase 
            timer_EnemyAttack.destroy();
            console.log("enemy has now entered stage: " + x);

            // New event for second form of enemy attacks
            timer_EnemySpawn = this.game.time.addEvent({ delay: 3500, 
                callback: onEvent, callbackScope: this, loop: true });
            // Timed event to spawn shield when player does not have one available or is destroyed
            timer_shieldSpawn = this.game.time.addEvent({ delay: 4000, 
                callback: spawnShield, callbackScope: this, loop: true });
                       
            function onEvent()
            {
                this.game.physics.resume();
                // Enemy will fade in and out and appear at different spawn points across maps. Then
                // shoot projectile at player when fading in. Projectiles will track player. 
                fadeOut(this);
                player.clearTint();

                // Get angle (in radians) of enemy position and player position
                let angle = Math.atan2((player.y-enemy.y), (player.x-enemy.x));
                // Set velocity from this angle, convert radians into Degrees for function
                let velo = this.game.physics.velocityFromAngle((angle*180)/Math.PI, 75);
                this.enemy_attack = this.game.physics.add.sprite(enemy.x, enemy.y, 'enemyProjectile');
                this.enemy_attack.body.setGravity(0,-1000); 
                this.enemy_attack.setVelocityX(velo.x * 10);
                this.enemy_attack.setVelocityY(velo.y * 10);
                this.game.physics.add.collider(this.enemy_attack, shield, parry, null, this);
                this.game.physics.add.collider(this.enemy_attack, player, hitPlayer, null, this);   
            }

            // Spawn shield for the player only if they do not have one available
            function spawnShield()
            {
                if (this.shields.countActive() < this.shields.maxSize)
                {
                    shield = this.shields.create(Phaser.Math.Between(0, 1280), 260, 'blueShield').setScale(.2).refreshBody();
                    shield.setBounce(0);
                    shield.setVelocityY(10);
                    shield.setCollideWorldBounds(true);
                    this.game.physics.add.collider(shield, ground);
                    this.game.physics.add.collider(shield, platforms);
                    this.game.physics.add.overlap(shield, player, collectShield, null, this);
                }
            }
            
        } 
        else if (x == 3)
        {
            this.state++;
            console.log("Curent Stage: " + this.state);
            // resume the physics after new state has been set
            platforms.clear(true, true);
            // A check to make sure enemys alpha is set back to 1
            enemy.alpha = 1;
            this.game.physics.resume();

            // Destroy previous stages timers
            timer_EnemySpawn.destroy();
            timer_shieldSpawn.destroy();
            console.log("enemy has now entered stage: " + x);

            // Create new phases platforms and reposition enemy
            platforms.create(100, 130, 'platforms').setScale(.5).refreshBody();
            platforms.create(1180, 130, 'platforms').setScale(.5).refreshBody();
            platforms.create(640, 300, 'platforms').setScale(.5).refreshBody();
            enemy.x = 640;
            enemy.y = 260;

            // Possible points the staff can spawn
            let staffSpawn = [[1180, 90], [100, 90], [640, 260]]; 
            
            projectiles = this.game.physics.add.group();
            projectiles.maxSize = 4;
            let shield = [];
            this.shields = this.game.physics.add.group();
            this.shields.maxSize = 1;
            
            // Player loses staff when taking damage. Staff will spawn in one of three places
            let timer = this.game.time.addEvent({ delay: 3000, 
                callback: spawnStaff, callbackScope: this, loop: true });
            function spawnStaff()
            {
                if (staff.countActive(true) < 1)
                {
                    // Spawn Staff in one of three spots randomly after player loses it. (on damage)
                    let point = staffSpawn[Math.floor(Math.random() * staffSpawn.length)]
                    staff.create(point[0], point[1], 'blueStaff').setScale(.2).refreshBody();
                }
            }

            // Enemy will spawn in various places on map and fade in and out. Shooting 
            // Projectiles in random areas on map for player to dodge. Enemy will only 
            // take damage if alpha is > 0.3
            timer_EnemySpawn = this.game.time.addEvent({ delay: 3000, 
                callback: onEvent, callbackScope: this, loop: true });
            this.game.physics.add.collider(shield, ground);

            // Timed event to spawn shield when player does not have one available or is destroyed
            timer_shieldSpawn = this.game.time.addEvent({ delay: 4000, 
                callback: spawnShield, callbackScope: this, loop: true });
            
            enemy.setVelocityX(300);    
            function onEvent()
            {
                fadeOut(this);
                
                // Enemy Roams
                if (enemy.x > 1200)
                {
                    enemy.setVelocityX(-300);
                } else if (enemy.x < 150) {
                    enemy.setVelocityX(300);
                } else 
                {
                    enemy.setVelocityX(Phaser.Math.Between(-400, 400))
                }
                
                // Only shoot new projectile if there are < 4 on screen. Projectiles will bounce on ground 
                // and platforms. Will destroy shields on contact. 
                if (projectiles.countActive(true) < projectiles.maxSize)
                {
                    this.projectile.push(projectiles.create(enemy.x, enemy.y, 'enemyProjectile'));
                    console.log(projectiles.countActive(true));
                    this.projectile[this.projectile.length-1].setBounce(1);
                    this.projectile[this.projectile.length-1].setVelocityY(Phaser.Math.Between(-800, 800), 10);
                    this.projectile[this.projectile.length-1].setVelocityX(Phaser.Math.Between(-800, 800), 10);
                    this.projectile[this.projectile.length-1].setGravity(0,-1000);
                    this.projectile[this.projectile.length-1].setCollideWorldBounds(true);
                    this.game.physics.add.collider(this.projectile[this.projectile.length-1], ground);
                    this.game.physics.add.collider(this.projectile[this.projectile.length-1], platforms);
                    this.game.physics.add.collider(this.projectile[this.projectile.length-1], shield, parry, null, this);
                    this.game.physics.add.collider(this.projectile[this.projectile.length-1], player, hitPlayer, null, this);
                } 
            }

            // Spawn shield for the player only if they do not have one available
            function spawnShield()
            {
                if (this.shields.countActive() < this.shields.maxSize)
                {
                    shield.push(this.shields.create(Phaser.Math.Between(0, 1280), 260, 'blueShield').setScale(.2).refreshBody());
                    shield[shield.length-1].setBounce(0);
                    shield[shield.length-1].setVelocityY(10);
                    shield[shield.length-1].setCollideWorldBounds(true);
                    this.game.physics.add.collider(shield[shield.length-1], ground);
                    this.game.physics.add.collider(shield[shield.length-1], platforms);
                    this.game.physics.add.overlap(shield[shield.length-1], player, collectShield, null, this);
                }
            }
        
        } else if (x == 4)
        {
            // End of game, pause physics
            timer_EnemySpawn.destroy();
            this.game.physics.pause();
        }

        // Hit player function will destroy projectile and play animation. Decrease the health of the player and 
        // Create a game over message if players health is depleted. 
        function hitPlayer(enemy_attack, player)
        {
            let explosion = this.game.physics.add.sprite((player.x /enemy_attack.x) * enemy_attack.x, 
                    (player.y /enemy_attack.y) * enemy_attack.y, 'explosion');
            enemy_attack.destroy();
            explosion.anims.play('explode');
            player_health++;
            if (this.state == 4)
            {
                hasStaff = false;
            }
            // This calls HealthBar class to redraw health bar with new, lower amount 
            playerHP.decreasePlayer(15);
            player.setTint(0xff0000);

            // A timer that will clear the red tint from the player after they are damaged
            let timer = this.game.time.delayedCall(1000, onEvent, [], this);
            function onEvent()
            {
                player.clearTint();
            }
            console.log("Player Health: " + player_health);
            // if player_health == 10 -> game over. 
            if (player_health == 10) // Set lower for Testing. 10 is total amount for health bar. 
            {
                if (this.state == 2)
                {
                    hasStaff = false;
                    timer_EnemyAttack.destroy();
                } else if (this.state == 3)
                {
                    hasStaff = false;
                    timer_EnemySpawn.destroy();
                    timer_shieldSpawn.destroy();
                }

                // GameOver
                projectiles.clear(true, true);
                this.game.physics.pause();
                let gameOverText = new Phaser.GameObjects.Text(this.game, 600, 350, 'Game Over', 50, 
               { font: "Press Start 2P" });
                this.game.add.existing(gameOverText);
            }
        }

    }

}

/**
 * HealthBar class for Player and Enemy to appear in given x and y values 
 * in constructor
 * 
 * Bar is updated via decrease() methods called in hitEnemy() and hitPlayer()
 * then drawn over background according to amount decreased.
 */
class HealthBar {
    constructor (game, type, value, x, y)
    {
        this.enemyBar = new Phaser.GameObjects.Graphics(game);
        this.enemyHP_text = new Phaser.GameObjects.Text(game, 640, 10, 'Enemy HP', 
                { font: '"Press Start 2P"' });
        this.playerBar = new Phaser.GameObjects.Graphics(game);
        this.playerHP_text = new Phaser.GameObjects.Text(game, 13, 600, 'HP', 
                { font: '"Press Start 2P"' });

        this.type = type;
        this.x = x;
        this.y = y;
        this.value = value;

        if (type == 0) 
        {
            this.playerDraw();
        }
        if (type == 1)
        {
            this.enemyDraw();
        }
    
        game.add.existing(this.enemyBar);
        game.add.existing(this.enemyHP_text);
        game.add.existing(this.playerBar);
        game.add.existing(this.playerHP_text);
    }

    decreaseEnemy(amount)
    {
        this.value -= amount;
        console.log(amount);

        if (this.value < 0)
        {
            this.value = 0;
        }

        this.enemyDraw();
    }
    
    decreasePlayer(amount)
    {
        this.value += amount;
        console.log(amount);

        if (this.value < 0)
        {
            this.value = 0;
        }

        this.playerDraw();
    }

    enemyDraw()
    {
        this.enemyBar.clear();

        // Background
        this.enemyBar.fillStyle(0x000000);
        this.enemyBar.fillRect(this.x, this.y, 600, 20)
        //  Health
        this.enemyBar.fillStyle(0xff0000);
        this.enemyBar.fillRect(this.x, this.y, this.value, 20);
        console.log(this.value);

    }

    playerDraw()
    {
        this.playerBar.clear();
        
        // Background
        this.enemyBar.fillStyle(0x00ff00);
        this.enemyBar.fillRect(this.x, this.y, 20, 150)
        
        //  Health
        this.enemyBar.fillStyle(0x000000);
        this.enemyBar.fillRect(this.x, this.y, 20, this.value);
        console.log(this.value);
        
    }
}

/*
    Decrease health of enemy when player hits enemy with attack.  
    Destroy Player Attack sprite
*/
function hitEnemy(attack, enemy)
{
    state = new Enemy(null, this, player, enemy, ground);
    attack.destroy();
    enemy_health++;

    // Decraese healthbar UI
    state.hp.decreaseEnemy(30 * enemy_health);
    if (enemy_health == 20)
    {
        enemy_health = 0;
        enemy_state++;

        // Increase the state variable to set new enemy finite state if the health bar is depleted 
        // This sets player hasStaff to false, sets the text on screen indicating phase, and 
        // resets position of player 
        if (enemy_state == 2)
        {
            hasStaff = false;
            this.physics.pause();
            let phaseText = new Phaser.GameObjects.Text(this, 640, 350, 'Phase 2', 50, 
               { font: "Press Start 2P" });
            this.add.existing(phaseText);
            let timedEvent = this.time.delayedCall(3000, onEvent, [], this);
            function onEvent()
            {
                phaseText.destroy();
                player.x = 1200;
                player.y = 550;
                let state_Two = new Enemy(2, this, player, enemy, null);
                state_Two.setState(2);
            }
        } else if (enemy_state == 3)
        {
            hasStaff = false;
            // Win State
            let finalPhaseText = new Phaser.GameObjects.Text(this, 640, 350, 'You Win', 50, 
               { font: "Press Start 2P" });
            this.add.existing(finalPhaseText);
            this.physics.pause();
            let state_Final = new Enemy(4, this, player, enemy, null);
            state_Final.setState(4);
        } 
    }
    console.log("Enemy health: " + enemy_health);
}

/*
    Destroy attack sprite when hitting ground or platforms.
    Pause on collision, allow animation to play, then destroy.
*/
function destroy(attack, hit)
{   
    attack.setVelocity(0);
    timer_DestroyFire = this.time.delayedCall(800, onEvent, [], this);
    function onEvent()
    {
        attack.destroy();
    }
}

// Once Player has Staff, shooting becomes available
function collectStaff(player, staff)
{
    hasStaff = true;
    staff.destroy();
}

// Player collects shield to pary enemy attacks 
function collectShield(shield)
{
    hasShield = true;
    shield.setVelocityY(0);
    shield.x = player.x;
    shield.y = player.y;
}

/**
* Parry function for stage 2. Send enemyAttack back to enemy.
* tempPoint is gathering the position of where the enemy_attack
* landing on shield to then shoot it back from that location
*/
function parry(enemy_attack, shield)
{   
    let tempPoint = [enemy_attack.x, enemy_attack.y];
    enemy_attack.destroy();
    console.log("Parry");
    // Get angle (in radians) of enemy position and player position
    let angle = Math.atan2((enemy.y-player.y), (enemy.x-player.x));
    // Set velocity from this angle, convert radians into Degrees for function
    let velo = this.game.physics.velocityFromAngle((angle*180)/Math.PI, 75);
    enemy_attack = this.game.physics.add.sprite(tempPoint[0], tempPoint[1], 'enemyProjectile');
    enemy_attack.body.setGravity(0,-1000); 
    enemy_attack.setVelocityX(velo.x * 20);
    enemy_attack.setVelocityY(velo.y * 20);
    shield.setTint(0xff0000);

    if (this.state == 3)
    {
        this.game.physics.add.collider(enemy_attack, enemy, parryDamage, null, this);
    } else 
    {
        let explosion = this.game.physics.add.sprite(enemy_attack.x, enemy_attack.y, 'explosion');
        enemy_attack.destroy();
        explosion.anims.play('explode');
    }
    let timer = this.game.time.delayedCall(500, onEvent, [], this);
    function onEvent()
    {
       shield.destroy();
       hasShield = false;
    }
}

/**
 * Parry the enemy's attack to cause damage. Parry Damage only allowed on stage 2
 * Sets new stage (stage 3) after parrying damage has done 6 damage to the enemy.
 * Health is depleted at different rate for parry damage. 
 */
function parryDamage(enemy_attack, enemy)
{
    let health = new HealthBar(this.game, 1, 600, 340, 40);
    let explosion = this.game.physics.add.sprite((enemy.x /enemy_attack.x) * enemy_attack.x, 
                    (enemy.y /enemy_attack.y) * enemy_attack.y, 'explosion');
    enemy_attack.destroy();
    explosion.anims.play('explode');
    enemy_health++;

    // Decraese healthbar UI
    health.decreaseEnemy(100 * enemy_health);
    
    if (enemy_health == 6)
    {
        enemy_health = 0;
    
        let phaseThreeText = new Phaser.GameObjects.Text(this.game, 640, 350, 'Phase 3', 50, 
           { font: "Press Start 2P" });
        this.game.add.existing(phaseThreeText);
        // Reset Player and Enemy position
        enemy.x = 50;
        enemy.y = 400;
        player.x = 1200;
        player.y = 580;
        enemy_attack.destroy();
        this.game.physics.pause();
        let timedEvent = this.game.time.delayedCall(3000, onEvent, [], this);
        function onEvent()
        {
            enemy_attack.destroy();
            shield.destroy();
            phaseThreeText.destroy();
            let state_Three = new Enemy(3, this.game, player, enemy, null);
            state_Three.setState(3);
        }
    }
    
}

// Fade in when spawning onto platforms in enemy's second stage
function fadeIn()
{
    enemy.alpha += 0.005;
    
    if (enemy.alpha < 1) setTimeout(fadeIn, 10);
}

// Fade out enemy becomes invisible and teleports to new spawn point 
function fadeOut(inEnemy)
{
    enemy.alpha -= 0.005;
    console.log(enemy.alpha);
    if (enemy.alpha > 0)
    {
        setTimeout(fadeOut, enemy);
    } else {
        let point = inEnemy.spawnPoints[Math.floor(Math.random() * inEnemy.spawnPoints.length)]
        console.log(point);
        enemy.x = point[0];
        enemy.y = point[1];
        fadeIn();
    }
}
