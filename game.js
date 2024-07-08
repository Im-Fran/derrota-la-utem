const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const player = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 60,
    width: 40,
    height: 40,
    speed: 5,
    health: 50
};

const bullets = [];
const enemyBullets = [];
const rockets = [];
const logoObj = {
    x: canvas.width / 2 - 50,
    y: 50,
    width: 100,
    height: 100,
    hits: 0,
    maxHits: 100,
    speed: 2,
    direction: 1,
    health: 100
};

let keys = {};
let gameOver = false;
let canShoot = true;
let canBlast = true;
let shootCooldown = 6000; // 6 seconds for special ability
let lastShotTime = 0;
let shootInterval = 250; // 250ms for normal shooting
let lastBlastTime = 0;
let explosionTimer = 0;

const explosionImage = new Image();
explosionImage.src = './explosion.gif';

const shootSound = new Audio('./shoot.mp3');
const explosionSound = new Audio('./explosion.mp3');

document.addEventListener('keydown', function (e) {
    keys[e.code] = true;
});

document.addEventListener('keyup', function (e) {
    keys[e.code] = false;
});

function preloadSounds() {
    shootSound.load();
    explosionSound.load();
}

function playShootSound() {
    const shootSound = new Audio('./shoot.mp3');
    shootSound.volume = 0.5; // Adjust volume as needed
    shootSound.play().then();
}

function playExplosionSound() {
    const explosionSound = new Audio('./explosion.mp3');
    explosionSound.volume = 0.5; // Adjust volume as needed
    explosionSound.play().then();
}

function update() {
    if (gameOver) return;

    if (keys['ArrowLeft'] && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
    if (keys['Space'] && canShoot) {
        let now = Date.now();
        if (now - lastShotTime > shootInterval) {
            bullets.push(
                { x: player.x + player.width / 2 - 2.5, y: player.y, width: 5, height: 10, speed: 7 }
            );
            playShootSound()
            lastShotTime = now;
        }
    }
    if (keys['KeyK'] && canBlast) {
        rockets.push({
            x: player.x + player.width / 2 - 10,
            y: player.y,
            width: 20,
            height: 40,
            speed: 10
        });
        canBlast = false;
        lastBlastTime = Date.now();
    }

    // Re-enable special ability if cooldown has passed
    if (!canBlast && Date.now() - lastBlastTime > shootCooldown) {
        canBlast = true;
    }

    bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed;
        if (bullet.y < 0) {
            bullets.splice(index, 1);
        }
        if (bullet.x > logoObj.x && bullet.x < logoObj.x + logoObj.width && bullet.y < logoObj.y + logoObj.height) {
            logoObj.health -= 1;
            bullets.splice(index, 1);
            if (logoObj.health <= 0) {
                gameOver = true;
                playExplosionSound()
                setTimeout(() => {
                    alert('¡Has derrotado al logo de UTEM!');
                    window.location.reload();
                }, 500);
            }
        }
    });

    rockets.forEach((rocket, index) => {
        rocket.y -= rocket.speed;
        if (rocket.y < 0) {
            rockets.splice(index, 1);
        }
        if (rocket.x > logoObj.x && rocket.x < logoObj.x + logoObj.width && rocket.y < logoObj.y + logoObj.height) {
            logoObj.health -= 5;
            rockets.splice(index, 1);
            explosionTimer = 30;
            playExplosionSound()
            if (logoObj.health <= 0) {
                gameOver = true;
                setTimeout(() => {
                    alert('¡Has derrotado al logo de UTEM!');
                    window.location.reload();
                }, 500);
            }
        }
    });

    // Move the logo
    logoObj.x += logoObj.speed * logoObj.direction;
    if (logoObj.x < 0 || logoObj.x > canvas.width - logoObj.width) {
        logoObj.direction *= -1;
    }

    // Logo shooting back
    if (Math.random() < 0.02) { // Adjust the shooting frequency here
        enemyBullets.push({
            x: logoObj.x + logoObj.width / 2,
            y: logoObj.y + logoObj.height,
            width: 5,
            height: 10,
            speed: 5
        });
    }

    enemyBullets.forEach((bullet, index) => {
        bullet.y += bullet.speed;
        if (bullet.y > canvas.height) {
            enemyBullets.splice(index, 1);
        }
        if (bullet.x > player.x && bullet.x < player.x + player.width && bullet.y > player.y && bullet.y < player.y + player.height) {
            player.health -= 1.5;
            enemyBullets.splice(index, 1);
            if (player.health <= 0) {
                gameOver = true;
                playExplosionSound()
                setTimeout(() => {
                    alert('¡Has sido derrotado por el logo de UTEM!');
                    window.location.reload();
                }, 500)
            }
        }
    });

    draw();
}

const spaceship = new Image();
spaceship.src = './spaceship.png';

const rocketSprite = new Image();
rocketSprite.src = './rocket.png';

function drawSpaceship(x, y, width, height) {
    ctx.drawImage(spaceship, x, y, width, height);
}

function drawRocket(x, y, width, height) {
    ctx.drawImage(rocketSprite, x, y, width, height);
}

function drawHealthBar(x, y, width, height, health, maxHealth, color) {
    ctx.fillStyle = '#ef4444'; // Background color (red)
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width * (health / maxHealth), height);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`${Math.round(health)}/${maxHealth}`, x + width / 2 - 20, y + height / 1.5);
}

function drawRechargeIndicator(x, y, radius, cooldown, lastUse) {
    const timeElapsed = Date.now() - lastUse;
    const fraction = Math.min(timeElapsed / cooldown, 1);
    
    ctx.beginPath();
    ctx.arc(x, y, radius, -0.5 * Math.PI, (fraction * 2 - 0.5) * Math.PI);
    ctx.lineTo(x, y);
    ctx.closePath();
    
    ctx.fillStyle = '#facc15'; // Yellow
    ctx.fill();
    
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.stroke();
    
    const remainingTime = Math.max((cooldown - timeElapsed) / 1000, 0).toFixed(2);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`${remainingTime}s`, x - 20, y + 5);
}

function draw() {
    // Dark mode background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawSpaceship(player.x, player.y, player.width, player.height);

    // Draw health bars
    drawHealthBar(10, 10, 200, 20, player.health, 50, '#22c55e'); // Green for player
    drawHealthBar(canvas.width - 210, 10, 200, 20, logoObj.health, 100, '#22c55e'); // Green for logo

    // Draw recharge indicator at the lower left corner
    drawRechargeIndicator(60, canvas.height - 40, 20, shootCooldown, lastBlastTime);

    bullets.forEach(bullet => {
        ctx.fillStyle = '#ef4444'; // Red
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    rockets.forEach(rocket => {
        drawRocket(rocket.x, rocket.y, rocket.width, rocket.height);
    });

    ctx.drawImage(logo, logoObj.x, logoObj.y, logoObj.width, logoObj.height);

    if (explosionTimer > 0) {
        ctx.drawImage(explosionImage, logoObj.x, logoObj.y, logoObj.width, logoObj.height);
        explosionTimer--;
    }

    enemyBullets.forEach(bullet => {
        ctx.fillStyle = '#facc15'; // Yellow
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
}

function gameLoop() {
    update();
    requestAnimationFrame(gameLoop);
}

const logo = new Image();
logo.src = './logo.png';
document.getElementById('uploadButton').addEventListener('click', function() {
    document.getElementById('imageInput').click();
    document.getElementById('uploadButton').blur()
});

document.getElementById('imageInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            if(e.target.result instanceof ArrayBuffer) {
                const blob = new Blob([e.target.result]);
                logo.src = URL.createObjectURL(blob);
            } else {
                logo.src = e.target.result;
            }
        };
        reader.readAsDataURL(file);
    }
});

preloadSounds();
gameLoop();
