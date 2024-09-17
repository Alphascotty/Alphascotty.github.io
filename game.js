var myGamePiece;
var myObstacles = [];
var myFlyingObstacles = [];
var myBullets = [];
var myScore;
var keys = {};
var gamePaused = false;
var gameSpeed = 1;
var backgroundImage;

// Add error handling to audio
var backgroundMusic = new Audio();
backgroundMusic.src = "./Media/backgroundMusic.mp3";
backgroundMusic.onerror = function() {
    console.error("Error loading background music.");
};
backgroundMusic.loop = true;
backgroundMusic.muted = false;

var gunshotSound = new Audio();
gunshotSound.src = "./Media/gunshot.mp3";
gunshotSound.onerror = function() {
    console.error("Error loading gunshot sound.");
};

// Add event listeners
document.getElementById("startButton").addEventListener("click", function() {
    startGame();
    backgroundMusic.play().catch(function(error) {
        console.error("Autoplay blocked or error playing background music:", error);
    });
});
document.getElementById("pauseButton").addEventListener("click", togglePause);

function startGame() {
    console.log("Game starting...");

    // Initialize game piece (character image)
    myGamePiece = new gameObject(30, 30, "./Media/character.png", 10, 120, "image");

    // Initialize score display
    myScore = new gameObject("30px", "Consolas", "black", 280, 40, "text");

    // Start game area
    myGameArea.start();

    // Add event listeners for keydown and keyup
    window.addEventListener('keydown', function(e) {
        keys[e.key] = true;

        // Fire bullet on spacebar press
        if (e.key === " ") {
            fireBullet();
        }
    });

    window.addEventListener('keyup', function(e) {
        keys[e.key] = false;
    });
}

function fireBullet() {
    var bullet = new gameObject(10, 10, "black", myGamePiece.x + myGamePiece.width, myGamePiece.y + myGamePiece.height / 2 - 5, "bullet");
    bullet.speedX = 4 * gameSpeed;
    myBullets.push(bullet);

    gunshotSound.play().catch(function(error) {
        console.error("Error playing gunshot sound:", error);
    });
}

var myGameArea = {
    canvas: document.createElement("canvas"),
    start: function() {
        console.log("Game area started...");

        this.canvas.width = 500;
        this.canvas.height = 400;
        this.context = this.canvas.getContext("2d");

        // Load background image with error handling
        backgroundImage = new Image();
        backgroundImage.src = "./Media/background.jpg";
        backgroundImage.onload = () => {
            console.log("Background image loaded...");
            this.context.drawImage(backgroundImage, 0, 0, this.canvas.width, this.canvas.height);
        };
        backgroundImage.onerror = function() {
            console.error("Error loading background image.");
        };

        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        console.log("Canvas added to DOM.");

        this.frameNo = 0;
        this.interval = setInterval(updateGameArea, 20); // Game loop
    },
    clear: function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    stop: function() {
        clearInterval(this.interval);
        alert("Game Over! Your Score: " + this.frameNo);
    },
    adjustSpeed: function() {
        if (this.frameNo > 1000 && this.frameNo % 1000 === 0) {
            gameSpeed += 0.5;
        }
    }
}

function gameObject(width, height, colorOrImage, x, y, type) {
    this.type = type;
    this.width = width;
    this.height = height;
    this.speedX = 0;
    this.speedY = 0;
    this.x = x;
    this.y = y;

    if (type === "image") {
        this.image = new Image();
        this.image.src = colorOrImage;

        // Ensure image is ready before drawing
        this.imageReady = false;
        this.image.onload = function() {
            this.imageReady = true;
            console.log("Character image loaded.");
        }.bind(this);

        this.image.onerror = function() {
            console.error("Error loading game object image: " + colorOrImage);
        };
    }

    this.update = function() {
        var ctx = myGameArea.context;

        if (this.type == "text") {
            ctx.font = this.width + " " + this.height;
            ctx.fillStyle = colorOrImage;
            ctx.fillText(this.text, this.x, this.y);
        } else if (this.type == "image" && this.imageReady) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else if (this.type !== "image") {
            ctx.fillStyle = colorOrImage;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    this.newPos = function() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.hitEdges();
    }

    this.hitEdges = function() {
        if (this.x < 0) {
            this.x = 0;
        }
        if (this.x > myGameArea.canvas.width - this.width) {
            this.x = myGameArea.canvas.width - this.width;
        }
        if (this.y < 0) {
            this.y = 0;
        }
        if (this.y > myGameArea.canvas.height - this.height) {
            this.y = myGameArea.canvas.height - this.height;
        }
    }

    this.crashWith = function(otherobj) {
        var myleft = this.x;
        var myright = this.x + this.width;
        var mytop = this.y;
        var mybottom = this.y + this.height;
        var otherleft = otherobj.x;
        var otherright = otherobj.x + otherobj.width;
        var othertop = otherobj.y;
        var otherbottom = otherobj.y + otherobj.height;
        var crash = true;
        if ((mybottom < othertop) || (mytop > otherbottom) || (myright < otherleft) || (myleft > otherright)) {
            crash = false;
        }
        return crash;
    }
}

function updateGameArea() {
    if (!gamePaused) {
        var x, height, gap, minHeight, maxHeight, minGap, maxGap;

        myGameArea.clear();

        // Draw the background image first
        myGameArea.context.drawImage(backgroundImage, 0, 0, myGameArea.canvas.width, myGameArea.canvas.height);

        myGameArea.frameNo += 1;

        myGameArea.adjustSpeed();

        // Create new obstacles
        if (myGameArea.frameNo == 1 || everyinterval(150)) {
            x = myGameArea.canvas.width;
            minHeight = 20;
            maxHeight = 200;
            height = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);
            minGap = 50;
            maxGap = 200;
            gap = Math.floor(Math.random() * (maxGap - minGap + 1) + minGap);

            myObstacles.push(new gameObject(10, height, "./Media/pole.png", x, 0, "image")); // Top pole
            myObstacles.push(new gameObject(10, myGameArea.canvas.height - height - gap, "./Media/pole.png", x, height + gap, "image")); // Bottom pole
            var flyingY = Math.floor(Math.random() * (myGameArea.canvas.height - 100));
            myFlyingObstacles.push(new gameObject(20, 20, "./Media/flying.png", x, flyingY, "image")); // Flying obstacle
        }

        for (var i = myObstacles.length - 1; i >= 0; i--) {
            myObstacles[i].x -= 1 * gameSpeed;
            myObstacles[i].update();
            if (myObstacles[i].x + myObstacles[i].width < 0) {
                myObstacles.splice(i, 1);
            }
        }

        for (var i = myFlyingObstacles.length - 1; i >= 0; i--) {
            myFlyingObstacles[i].x -= 1.5 * gameSpeed;
            myFlyingObstacles[i].update();
            if (myFlyingObstacles[i].x + myFlyingObstacles[i].width < 0) {
                myFlyingObstacles.splice(i, 1);
            }
        }

        for (var i = myBullets.length - 1; i >= 0; i--) {
            myBullets[i].x += myBullets[i].speedX;
            myBullets[i].update();
            if (myBullets[i].x > myGameArea.canvas.width) {
                myBullets.splice(i, 1);
            }

            for (var j = myObstacles.length - 1; j >= 0; j--) {
                if (myBullets[i] && myBullets[i].crashWith(myObstacles[j])) {
                    myBullets.splice(i, 1);
                    myObstacles.splice(j, 1);
                }
            }
        }

        // Update the game piece
        myGamePiece.newPos();
        myGamePiece.update();

        // Update score
        myScore.text = "SCORE: " + myGameArea.frameNo;
        myScore.update();
    }
}

function everyinterval(n) {
    return (myGameArea.frameNo / n) % 1 === 0;
}

function togglePause() {
    gamePaused = !gamePaused;
}






