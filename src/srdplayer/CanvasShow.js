var ctx;
function startCanvasOnClick(e) {
    ctx = canvas.getContext("2d");
    ctx.scale(2, 2);
    ctx.imageSmoothingQuality = "high"
    processFarme();
}

function processFarme() {
    ctx.drawImage(fallBackLayer, 0, 0, 1280, 720);
    // ctx.drawImage(video5, 0, 0, 320, 180);
    // ctx.drawImage(video6, 320, 0, 320, 180);
    // ctx.drawImage(video7, 640, 0, 320, 180);
    // ctx.drawImage(video8, 960, 0, 320, 180);
    //ctx.drawImage(video9, 0, 180, 320, 180);
    ctx.drawImage(video10, 320, 180, 320, 180);
    ctx.drawImage(video11, 640, 180, 320, 180);
    //ctx.drawImage(video12, 960, 180, 320, 180);
    //ctx.drawImage(video13, 0, 360, 320, 180);
    ctx.drawImage(video14, 320, 360, 320, 180);
    ctx.drawImage(video15, 640, 360, 320, 180);
    //ctx.drawImage(video16, 960, 360, 320, 180);
    requestAnimationFrame(processFarme);
}

function startPanoamic(e) {
    var container = document.getElementById("threeContainer");
    const scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(80, container.clientWidth / container.clientHeight,
        0.001, 10000);
    camera.position.set(3, 0.50, 15);
    camera.target = new THREE.Vector3(0, 0, 0);
    var renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    const geometry = new THREE.SphereBufferGeometry(500, 80, 40); // 球体
    geometry.scale(-1, 1, 1);
    //let texture = new THREE.VideoTexture(fallBackLayer);
    var texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    let material = new THREE.MeshBasicMaterial({ map: texture });
    let mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    let axisHelper = new THREE.AxesHelper(1000)//每个轴的长度
    scene.add(axisHelper);
    let controls = new THREE.OrbitControls(camera, document, renderer.domElement);

    function render() {
        renderer.render(scene, camera);
        // 更新canvas纹理
        material.map.needsUpdate = true;
        scene.add(mesh);
    }
    function r() {
        render();
        controls.update();
        requestAnimationFrame(r)
    }
    r();
}