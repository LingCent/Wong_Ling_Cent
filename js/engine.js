// js/engine.js

// --- 1. Cursor Engine ---
const cursor = document.getElementById('cursor');
let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
let cursorX = mouseX, cursorY = mouseY;

window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX; mouseY = e.clientY;
});

gsap.ticker.add(() => {
    cursorX += (mouseX - cursorX) * 0.2;
    cursorY += (mouseY - cursorY) * 0.2;
    cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;
});

document.querySelectorAll('.magnetic-target').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('active'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('active'));
});

// --- 2. GPU Canvas Matrix ---
const canvas = document.getElementById('matrix-canvas');
const ctx = canvas.getContext('2d', { alpha: false });
let width, height;
const nodes = [];
const engineState = { zoom: 1, timeScale: 1, nodeSpeedBase: 0.5 };

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

class Node {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5);
        this.vy = (Math.random() - 0.5);
        this.char = '0123456789ABCDEFx@#$*'.charAt(Math.floor(Math.random() * 21));
        this.size = Math.random() * 10 + 8;
    }
    update() {
        this.x += this.vx * engineState.nodeSpeedBase * engineState.timeScale;
        this.y += this.vy * engineState.nodeSpeedBase * engineState.timeScale;
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
        if (Math.random() < 0.01) this.char = '0123456789ABCDEFx@#$*'.charAt(Math.floor(Math.random() * 21));
    }
    draw() {
        ctx.font = `${this.size}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = '#CBBFA9';
        ctx.fillText(this.char, this.x, this.y);
    }
}

const nodeCount = Math.min(Math.floor((width * height) / 15000), 100); 
for (let i = 0; i < nodeCount; i++) nodes.push(new Node());

function render() {
    ctx.fillStyle = '#F7F7F5';
    ctx.fillRect(0, 0, width, height);
    ctx.save(); 
    ctx.translate(width / 2, height / 2);
    ctx.scale(engineState.zoom, engineState.zoom);
    const parallaxX = (mouseX / width - 0.5) * 40;
    const parallaxY = (mouseY / height - 0.5) * 40;
    ctx.translate(-width / 2 + parallaxX, -height / 2 + parallaxY);

    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
                ctx.beginPath();
                ctx.moveTo(nodes[i].x, nodes[i].y);
                ctx.lineTo(nodes[j].x, nodes[j].y);
                ctx.strokeStyle = `rgba(203, 191, 169, ${(1 - dist/150) * 0.3})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
    }
    nodes.forEach(node => { node.update(); node.draw(); });
    ctx.restore(); 
    requestAnimationFrame(render);
}
render();

// --- 3. Terminal Ritual ---
const contactTriggers = document.querySelectorAll('.contact-trigger');
const terminalModal = document.getElementById('terminal-modal');
const termBox = document.getElementById('terminal-box');
const closeTermBtn = document.getElementById('close-terminal');
const typewriter = document.getElementById('term-typewriter');
const termCursor = document.getElementById('term-cursor');
const inputContainer = document.getElementById('input-container');
const termInput = document.getElementById('term-input');
const termForm = document.getElementById('term-form');

let typeTimeout;

contactTriggers.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        gsap.killTweensOf(engineState);
        gsap.to(engineState, { 
            zoom: 1.8, timeScale: 40, duration: 0.8, ease: "power4.out",
            onComplete: () => { gsap.to(engineState, { timeScale: 0.1, duration: 2, ease: "power2.out" }); }
        });

        terminalModal.classList.remove('opacity-0', 'pointer-events-none');
        termBox.classList.remove('scale-95');
        clearTimeout(typeTimeout);
        typewriter.innerHTML = '';
        termCursor.classList.remove('hidden');
        inputContainer.classList.add('hidden');
        termInput.value = '';

        const msg = "CONNECTION_SECURED.\nSYSTEM_READY.\nENTER MESSAGE OR TYPE 'help':";
        let charIndex = 0;
        
        function type() {
            if (charIndex < msg.length) {
                let char = msg.charAt(charIndex);
                if(char === '\n') { typewriter.innerHTML += '<br>'; } 
                else { typewriter.innerHTML += char; }
                charIndex++;
                typeTimeout = setTimeout(type, 30 + Math.random() * 40);
            } else {
                termCursor.classList.add('hidden');
                inputContainer.classList.remove('hidden');
                termInput.focus();
            }
        }
        setTimeout(type, 600);
    });
});

closeTermBtn.addEventListener('click', () => {
    terminalModal.classList.add('opacity-0', 'pointer-events-none');
    termBox.classList.add('scale-95');
    gsap.killTweensOf(engineState);
    gsap.to(engineState, { zoom: 1, timeScale: 1, duration: 1.2, ease: "power3.inOut" });
});

termForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = termInput.value.trim();
    if(!val) return;
    
    if (val.toLowerCase() === 'exit') {
        closeTermBtn.click();
    } else if (val.toLowerCase() === 'help') {
        alert("This is a frontend demo. In a production environment, this would hit an API endpoint to send an email to lingcent00@gmail.com.");
        termInput.value = '';
    } else {
        window.location.href = `mailto:lingcent00@gmail.com?subject=Terminal%20Contact&body=${encodeURIComponent(val)}`;
        termInput.value = '';
        closeTermBtn.click();
    }
});

// Intro Animation
gsap.from(".content-layer", { opacity: 0, y: 30, duration: 1.2, stagger: 0.2, ease: "power3.out" });


// --- 4. High-Performance Linear Depth Gallery Engine ---
const uiTriggers = document.querySelectorAll('.ui-trigger');
const lightboxModal = document.getElementById('lightbox-modal');
const galleryTrack = document.getElementById('gallery-track');
const dotsContainer = document.getElementById('gal-dots');
const closeLightboxBtn = document.getElementById('close-lightbox');

let galleryItems = [];
let currentIndex = 0;
let totalItems = 0;

function renderGalleryMatrix() {
    const GAP = 50; 
    const baseWidths = galleryItems.map(item => item.offsetWidth || 0);

    galleryItems.forEach((item, i) => {
        const offset = i - currentIndex;
        const absOffset = Math.abs(offset);
        const sign = Math.sign(offset);

        let zIndex = 100 - absOffset;
        let scale = absOffset === 0 ? 1 : 0.85; 
        let opacity = absOffset === 0 ? 1 : 0.3;
        let blurAmount = absOffset === 0 ? 0 : 8;
        
        let translateX = 0;
        
        if (i !== currentIndex) {
            let dist = 0;
            const centerWidth = baseWidths[currentIndex] || 0;
            dist += (centerWidth * 1) / 2; 

            const min = Math.min(i, currentIndex);
            const max = Math.max(i, currentIndex);
            for (let k = min + 1; k < max; k++) {
                const intermediateWidth = baseWidths[k] || 0;
                dist += GAP + (intermediateWidth * 0.85); 
            }

            const targetWidth = baseWidths[i] || 0;
            dist += GAP + (targetWidth * 0.85) / 2;

            translateX = sign * dist;
        }

        if (absOffset > 3) opacity = 0;

        gsap.to(item, {
            x: translateX,
            z: 0,
            rotationY: 0,
            scale: scale,
            opacity: opacity,
            zIndex: zIndex,
            filter: `blur(${blurAmount}px)`,
            duration: 0.6,
            ease: "power3.out"
        });

        const dot = dotsContainer.children[i];
        if (dot) {
            if (i === currentIndex) {
                dot.className = "w-8 h-1.5 rounded-full bg-[#CBBFA9] opacity-100 transition-all duration-300 cursor-none magnetic-target";
            } else {
                dot.className = "w-1.5 h-1.5 rounded-full bg-white opacity-30 hover:opacity-60 transition-all duration-300 cursor-none magnetic-target";
            }
        }
    });
}

uiTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
        const rawData = trigger.getAttribute('data-gallery');
        if(!rawData) return;
        
        const images = rawData.split(',').map(src => src.trim());
        totalItems = images.length;
        currentIndex = Math.floor(totalItems / 2); 
        
        galleryTrack.innerHTML = '';
        dotsContainer.innerHTML = '';
        galleryItems = [];

        images.forEach((src, i) => {
            const card = document.createElement('div');
            card.className = "absolute rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl cursor-none magnetic-target bg-[#121212]"; 
            card.style.willChange = "transform, opacity, filter"; 

            const img = document.createElement('img');
            img.src = src;
            img.className = "max-w-[85vw] max-h-[80vh] md:max-h-[85vh] block transform-gpu"; 
            card.appendChild(img);

            img.onload = () => {
                renderGalleryMatrix(); 
            };
            
            card.addEventListener('click', () => {
                if (currentIndex !== i) {
                    currentIndex = i;
                    renderGalleryMatrix();
                }
            });

            galleryTrack.appendChild(card);
            galleryItems.push(card);

            const dot = document.createElement('div');
            dot.className = "h-1.5 rounded-full transition-all duration-300 cursor-none magnetic-target";
            dot.addEventListener('click', () => {
                currentIndex = i;
                renderGalleryMatrix();
            });
            dotsContainer.appendChild(dot);
        });

        gsap.killTweensOf(engineState);
        gsap.to(engineState, { zoom: 0.8, timeScale: 0, duration: 0.8, ease: "power3.out" });

        lightboxModal.classList.remove('opacity-0', 'pointer-events-none');
    });
});

window.addEventListener('keydown', (e) => {
    if (lightboxModal.classList.contains('opacity-0')) return;
    if (e.key === 'Escape') closeLightboxBtn.click();
    if (e.key === 'ArrowRight') {
        if (currentIndex < totalItems - 1) {
            currentIndex++;
            renderGalleryMatrix();
        }
    }
    if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) {
            currentIndex--;
            renderGalleryMatrix();
        }
    }
});

closeLightboxBtn.addEventListener('click', () => {
    lightboxModal.classList.add('opacity-0', 'pointer-events-none');
    gsap.to(engineState, { zoom: 1, timeScale: 1, duration: 1.2, ease: "power3.inOut" });
    setTimeout(() => {
        galleryTrack.innerHTML = '';
        dotsContainer.innerHTML = '';
        galleryItems = [];
    }, 500);
});