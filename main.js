import {
    RGBELoader,
    // OrbitControls
} from 'three/examples/jsm/Addons.js';
import './style.css'
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js';
import gsap from 'gsap';

gsap.to(".sap", {
    y: -1000,
    duration: 2,
    delay: 2
})

const scene = new THREE.Scene();
const canvas = document.querySelector("#canvas");
const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 5;
const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true
});

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputEncoding = THREE.sRGBEncoding;
let model;
const composer = new EffectComposer(renderer);
composer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Match the renderer's pixel ratio
composer.setSize(window.innerWidth, window.innerHeight);

const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const rgbShiftPass = new ShaderPass(RGBShiftShader);
rgbShiftPass.uniforms['amount'].value = 0.0030;
composer.addPass(rgbShiftPass);


const pmremGenerator = new THREE.PMREMGenerator(renderer);

pmremGenerator.compileEquirectangularShader();

const rgbeLoader = new RGBELoader();
rgbeLoader.load('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/pond_bridge_night_1k.hdr', function (texture) {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = envMap;
    texture.dispose();
    pmremGenerator.dispose();

    const loader = new GLTFLoader();
    loader.load('./DamagedHelmet.gltf', function (gltf) {
        model = gltf.scene;
        scene.add(model);
    });

})

// const controls = new OrbitControls(camera, canvas);
// controls.enableDamping = true;

function animate() {
    // controls.update();
    composer.render();
    requestAnimationFrame(animate);
}
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', (event) => {
        if (model) {
            const gamma = event.gamma; // left to right tilt
            const beta = event.beta; // front to back tilt

            gsap.to(model.rotation, {
                duration: 0.9,

                y: THREE.MathUtils.degToRad(gamma * 0.3),
                x: THREE.MathUtils.degToRad(beta * -0.3)
            });
        }
    });
}

window.addEventListener("mousemove", (e) => {
    if (model) {
        gsap.to(model.rotation, {
            duration: 0.9,
            ease: "power1.out",
            y: (e.clientX / window.innerWidth - 0.5) * (Math.PI * 0.2),
            x: (e.clientY / window.innerHeight - 0.5) * (Math.PI * 0.2)
        });

    }
})

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 0.00001));
})
animate();
