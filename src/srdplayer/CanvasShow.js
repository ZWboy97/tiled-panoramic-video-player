var canvas;
var ctx;
function startCanvasOnClick(e) {
    canvas = document.getElementById('outputCanvas');
    ctx = canvas.getContext("2d");
    ctx.scale(2, 2);
    ctx.imageSmoothingQuality = "high"
    processFarme();
}

function processFarme() {
    ctx.drawImage(video5, 0, 0, 320, 180);
    ctx.drawImage(video6, 320, 0, 320, 180);
    ctx.drawImage(video7, 640, 0, 320, 180);
    ctx.drawImage(video8, 960, 0, 320, 180);
    ctx.drawImage(video9, 0, 180, 320, 180);
    ctx.drawImage(video10, 320, 180, 320, 180);
    ctx.drawImage(video11, 640, 180, 320, 180);
    ctx.drawImage(video12, 960, 180, 320, 180);
    ctx.drawImage(video13, 0, 360, 320, 180);
    ctx.drawImage(video14, 320, 360, 320, 180);
    ctx.drawImage(video15, 640, 360, 320, 180);
    ctx.drawImage(video16, 960, 360, 320, 180);
    requestAnimationFrame(processFarme);
}