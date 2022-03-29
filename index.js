const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const canvas = $('#canvas');
canvas.width = innerWidth;
canvas.height = innerHeight;

const ctx = canvas.getContext('2d');

const scoreEl = $('#score');
const btnStartGame = $('#btnStartGame');
console.log(scoreEl);

class Player {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }
    draw() {
        ctx.beginPath();
        ctx.fillStyle = this.color
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fill()
    }
}

class Projectile {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }
    draw() {
        ctx.beginPath();
        ctx.fillStyle = this.color
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fill()
    }
    update() {
        this.draw();
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }
}

class Enemy {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }
    draw() {
        ctx.beginPath();
        ctx.fillStyle = this.color
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fill()
    }
    update() {
        this.draw();
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }
}

const friction = 0.99;

class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.fillStyle = this.color
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fill()
        ctx.restore();
    }
    update() {
        this.draw();
        this.velocity.x *= friction;
        this.velocity.y *= friction;
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
        this.alpha -= 0.01;
    }
}


const x = canvas.width / 2;
const y = canvas.height / 2;

let player = new Player(x, y, 20, 'white')
let projectiles = [];
let enemies = [];
let particles = [];
let score = 0;

function init() {
    player = new Player(x, y, 20, 'white')
    projectiles = [];
    enemies = [];
    particles = [];
    score = 0;
    scoreEl.innerText = "0"
    $('#modal-score').innerText = `0`;
}

function spawnEnemies() {
    setInterval(() => {
        const radius = Math.random() * (30 - 10) + 10;
        let x, y;
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
            y = Math.random() * canvas.height;
        } else {
            x = Math.random() * canvas.width;
            y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
        }
        const color = `hsl(${Math.random() * 360}, 50%, 50%)`;
        const angle = Math.atan2(
            canvas.height / 2 - y,
            canvas.width / 2 - x
        );
        const velocity = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        }
        enemies.push(new Enemy(x, y, radius, color, velocity))
    }, 1000)
}

let animationId;
function animate() {
    animationId = requestAnimationFrame(animate);
    // ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    player.draw();

    particles.forEach((particle, particlIndex) => {
        if (particle.alpha < 0) {
            particles.splice(particlIndex, 1);
        } else {
            particle.update();
        }
    })

    projectiles.forEach((projectile, projectileIndex) => {
        projectile.update();

        // remove from edges of screen
        if (projectile.x + projectile.radius < 0 ||
            projectile.x - projectile.radius > canvas.width ||
            projectile.y + projectile.radius < 0 ||
            projectile.y - projectile.radius > canvas.height
        ) {
            setTimeout(() => {
                projectiles.splice(projectileIndex, 1)
            }, 0);
        }
    });

    enemies.forEach((enemy, enemyIndex) => {
        enemy.update();

        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        // END GAME
        if (dist - enemy.radius - player.radius < 1) {
            cancelAnimationFrame(animationId);
            $('#modal').style.display = 'flex';
            $('#modal-score').innerText = `${Math.round(score)}`;
            console.log("ENDGAME");
        }
        projectiles.forEach((projectile, projectileIndex) => {
            const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
            // when projectiles touche enemy
            if (dist - enemy.radius - projectile.radius < 1) {


                // create explosions
                for (let index = 0; index < 10; index++) {
                    particles.push(new Particle(
                        projectile.x,
                        projectile.y,
                        Math.random() * 4,
                        enemy.color,
                        {
                            x: (Math.random() - 0.5) * (Math.random() * 8),
                            y: (Math.random() - 0.5) * (Math.random() * 8)
                        }
                    ))
                }
                if (enemy.radius - 10 > 5) {
                    // increase score
                    score += enemy.radius;
                    scoreEl.innerText = "" + Math.round(score);
                    enemy.radius -= projectile.radius;
                    // gsap.to(enemy, {
                    //     radius: enemy.radius - 10
                    // });
                    setTimeout(() => {
                        projectiles.splice(projectileIndex, 1)
                    }, 0);
                } else {
                    score += 100;
                    setTimeout(() => {
                        enemies.splice(enemyIndex, 1)
                        projectiles.splice(projectileIndex, 1)
                    }, 0);

                }
            }

        });
    })
}


window.addEventListener('click', (event) => {
    console.log(projectiles);
    const angle = Math.atan2(
        event.clientY - canvas.height / 2,
        event.clientX - canvas.width / 2
    );
    const velocity = {
        x: Math.cos(angle) * 4,
        y: Math.sin(angle) * 4
    }
    projectiles.push(new Projectile(
        canvas.width / 2,
        canvas.height / 2,
        Math.random() * 7 + 5,
        'white',
        velocity
    ));
})

btnStartGame.addEventListener('click', (event) => {
    init();
    animate();
    spawnEnemies();
    $('#modal').style.display = 'none';
})


