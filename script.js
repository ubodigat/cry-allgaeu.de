const mouse = { x: null, y: null };
window.addEventListener("mousemove", e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

const starCanvas = document.getElementById("stars");
const sctx = starCanvas.getContext("2d");
let sw, sh;

function resizeStars() {
    sw = starCanvas.width = window.innerWidth;
    sh = starCanvas.height = window.innerHeight;
}
resizeStars();
window.addEventListener("resize", resizeStars);

const stars = Array.from({ length: 420 }, () => ({
    x: Math.random() * sw,
    y: Math.random() * sh,
    base: Math.random() * 0.25 + 0.1
}));

function drawStars() {
    sctx.clearRect(0, 0, sw, sh);
    for (const s of stars) {
        let glow = s.base;
        if (mouse.x !== null) {
            const d = Math.hypot(s.x - mouse.x, s.y - mouse.y);
            if (d < 120) glow += (1 - d / 120) * 0.5;
        }
        sctx.fillStyle = `rgba(110,193,255,${glow})`;
        sctx.fillRect(s.x, s.y, 1.3, 1.3);
    }
    requestAnimationFrame(drawStars);
}
drawStars();

const netCanvas = document.getElementById("network");
const nctx = netCanvas.getContext("2d");
let nw, nh;

function resizeNet() {
    nw = netCanvas.width = window.innerWidth;
    nh = netCanvas.height = window.innerHeight;
}
resizeNet();
window.addEventListener("resize", resizeNet);

const points = Array.from({ length: 90 }, () => ({
    x: Math.random() * nw,
    y: Math.random() * nh,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35
}));

function drawNetwork() {
    nctx.clearRect(0, 0, nw, nh);

    for (const p of points) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > nw) p.vx *= -1;
        if (p.y < 0 || p.y > nh) p.vy *= -1;
    }

    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
            const d = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y);
            if (d < 150) {
                nctx.strokeStyle = `rgba(110,193,255,${(1 - d / 150) * 0.6})`;
                nctx.beginPath();
                nctx.moveTo(points[i].x, points[i].y);
                nctx.lineTo(points[j].x, points[j].y);
                nctx.stroke();
            }
        }
    }

    if (mouse.x !== null) {
        for (const p of points) {
            const d = Math.hypot(p.x - mouse.x, p.y - mouse.y);
            if (d < 180) {
                nctx.strokeStyle = `rgba(110,193,255,${(1 - d / 180) * 0.9})`;
                nctx.beginPath();
                nctx.moveTo(p.x, p.y);
                nctx.lineTo(mouse.x, mouse.y);
                nctx.stroke();
            }
        }
    }

    requestAnimationFrame(drawNetwork);
}
drawNetwork();

let currentScroll = window.scrollY;
let targetScroll = window.scrollY;
let scrolling = false;

window.addEventListener("wheel", e => {
    e.preventDefault();
    targetScroll += e.deltaY * 0.15;
    targetScroll = Math.max(
        0,
        Math.min(document.body.scrollHeight - innerHeight, targetScroll)
    );
    if (!scrolling) smoothScroll();
}, { passive: false });

function smoothScroll() {
    scrolling = true;
    currentScroll += (targetScroll - currentScroll) * 0.12;
    window.scrollTo(0, currentScroll);

    if (Math.abs(targetScroll - currentScroll) > 0.5) {
        requestAnimationFrame(smoothScroll);
    } else {
        scrolling = false;
    }
}

const krayCanvas = document.getElementById("krayCanvas");
const kctx = krayCanvas.getContext("2d");

function resizeKrayCanvas() {
    const r = krayCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    krayCanvas.width = r.width * dpr;
    krayCanvas.height = r.height * dpr;
    kctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resizeKrayCanvas();
window.addEventListener("resize", resizeKrayCanvas);

const voice = new Audio("voice.mp3");
voice.volume = 0.35;

let particles = [];
let phase = "idle";
let started = false;

function buildParticles(text) {
    const w = krayCanvas.getBoundingClientRect().width;
    const h = krayCanvas.getBoundingClientRect().height;

    kctx.clearRect(0, 0, w, h);
    kctx.font = "700 96px Inter";
    kctx.textAlign = "center";
    kctx.textBaseline = "middle";
    kctx.fillText(text, w / 2, h / 2);

    const img = kctx.getImageData(0, 0, w, h).data;
    const pts = [];

    for (let y = 0; y < h; y += 3) {
        for (let x = 0; x < w; x += 3) {
            if (img[(y * w + x) * 4 + 3] > 150) {
                pts.push({
                    x,
                    y,
                    tx: x,
                    ty: y,
                    vx: (Math.random() - 0.5) * 1.2,
                    vy: (Math.random() - 0.5) * 1.2
                });
            }
        }
    }
    return pts;
}

particles = buildParticles("KRAY");

function drawWord() {
    const w = krayCanvas.getBoundingClientRect().width;
    const h = krayCanvas.getBoundingClientRect().height;
    kctx.clearRect(0, 0, w, h);

    for (const p of particles) {
        if (phase === "explode") {
            p.x += p.vx;
            p.y += p.vy;
        } else if (phase === "merge") {
            p.x += (p.tx - p.x) * 0.045;
            p.y += (p.ty - p.y) * 0.045;
        }
        kctx.fillStyle = "#6ec1ff";
        kctx.fillRect(p.x, p.y, 2, 2);
    }
    requestAnimationFrame(drawWord);
}
drawWord();

window.addEventListener("scroll", () => {
    if (!started && window.scrollY > 10) {
        started = true;
        phase = "explode";
        voice.play().catch(() => {});

        setTimeout(() => {
            const target = buildParticles("CRY");
            particles = target.map(p => ({
                x: p.x + (Math.random() - 0.5) * 60,
                y: p.y + (Math.random() - 0.5) * 60,
                tx: p.tx,
                ty: p.ty,
                vx: (Math.random() - 0.5) * 0.8,
                vy: (Math.random() - 0.5) * 0.8
            }));
            phase = "merge";
        }, 1400);
    }
});

document.querySelectorAll(".reveal").forEach(el => {
    new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
            el.classList.add("visible");
        }
    }, { threshold: 0.2 }).observe(el);
});

const bottom = document.getElementById("bottom");
const circle = document.getElementById("progress-circle");
const counter = document.getElementById("counter");
const counterWrapper = document.getElementById("counterWrapper");
const pauseIcon = document.getElementById("pauseIcon");

const total = 389;
const duration = 5;

let redirectStarted = false;
let paused = false;
let startTime = null;
let elapsedBeforePause = 0;

function animateTimer(ts) {
    if (paused) {
        startTime = null;
        requestAnimationFrame(animateTimer);
        return;
    }

    if (!startTime) startTime = ts;

    const elapsed = (ts - startTime) / 1000 + elapsedBeforePause;
    const remaining = Math.max(0, duration - elapsed);

    counter.textContent = remaining.toFixed(1);
    circle.style.strokeDashoffset = total * (remaining / duration);

    if (remaining > 0) {
        requestAnimationFrame(animateTimer);
    } else {
        window.location.href = "https://kray-allgaeu.de";
    }
}

counterWrapper.addEventListener("click", () => {
    paused = !paused;

    if (paused) {
        elapsedBeforePause += (performance.now() - startTime) / 1000;
        counter.style.display = "none";
        pauseIcon.style.display = "block";
    } else {
        startTime = null;
        pauseIcon.style.display = "none";
        counter.style.display = "block";
    }
});

new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !redirectStarted) {
        redirectStarted = true;
        requestAnimationFrame(animateTimer);
    }
}, { threshold: 0.85 }).observe(bottom);

const soundToggle = document.getElementById("soundToggle");
const soundOn = document.getElementById("soundOn");
const soundOff = document.getElementById("soundOff");

let soundEnabled = true;

voice.volume = 0.35;

soundToggle.addEventListener("click", () => {
    soundEnabled = !soundEnabled;

    if (soundEnabled) {
        voice.muted = false;
        soundOn.style.display = "block";
        soundOff.style.display = "none";
    } else {
        voice.muted = true;
        soundOn.style.display = "none";
        soundOff.style.display = "block";
    }
});