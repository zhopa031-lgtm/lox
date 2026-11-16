/* ============================================================
   VERSTAK — fluid.js: «жидкий» фон-аврора на WebGL-шейдере.
   Медленно текущие лаймовые потоки по графиту — как жидкий дым.
   Слой в hero (canv#fluidHero) и в контактах (canv#fluidContacts).
   Реагирует на курсор, ставится на паузу вне экрана и в фоновой
   вкладке, уважает prefers-reduced-motion (один статичный кадр).
   Без библиотек: при отсутствии WebGL канвас просто скрывается.
   ============================================================ */
(function () {
  "use strict";

  if (typeof WebGLRenderingContext === "undefined") return;

  var VERT = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";

  /* Доменно-деформированный fbm-шум: q = fbm(p), r = fbm(p+q),
     итог f = fbm(p+r) — классическая «жидкая» морфология. */
  var FRAG = [
    "#ifdef GL_FRAGMENT_PRECISION_HIGH",
    "precision highp float;",
    "#else",
    "precision mediump float;",
    "#endif",
    "uniform vec2 uR;uniform float uT;uniform vec2 uM;uniform float uSeed;",
    "float h21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}",
    "float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);",
    " float a=h21(i),b=h21(i+vec2(1.0,0.0)),c=h21(i+vec2(0.0,1.0)),d=h21(i+vec2(1.0,1.0));",
    " return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}",
    "float fbm(vec2 p){float v=0.0,a=0.5;",
    " mat2 m=mat2(1.6,1.2,-1.2,1.6);",
    " for(int i=0;i<5;i++){v+=a*vnoise(p);p=m*p+uSeed;a*=0.5;}",
    " return v;}",
    "void main(){",
    " float asp=uR.x/uR.y;",
    " vec2 uv=(gl_FragCoord.xy*2.0-uR)/min(uR.x,uR.y);",
    /* мягкое притяжение поля к курсору */
    " vec2 mp=vec2((uM.x*2.0-1.0)*asp,uM.y*2.0-1.0);",
    " uv+=(mp-uv)*0.16;",
    " float t=uT*0.055;",
    " vec2 p=uv*1.05+vec2(-0.55,0.0);",
    " vec2 q=vec2(fbm(p+t),fbm(p+vec2(5.2,1.3)-t*0.7));",
    " vec2 r=vec2(fbm(p+2.3*q+vec2(1.7,9.2)+t*0.9),fbm(p+2.3*q+vec2(8.3,2.8)-t*0.6));",
    " float f=fbm(p+2.6*r);",
    /* палитра: графит -> тёмный мох -> приглушённая зелень -> лайм */
    " vec3 c0=vec3(0.043,0.055,0.039);",
    " vec3 c1=vec3(0.075,0.135,0.115);",
    " vec3 c2=vec3(0.16,0.30,0.20);",
    " vec3 c3=vec3(0.45,0.72,0.18);",
    " vec3 c4=vec3(0.84,1.0,0.44);",
    " vec3 col=mix(c0,c1,smoothstep(0.0,1.15,q.y*1.35));",
    " col=mix(col,c2,smoothstep(0.25,0.95,f*f*1.7));",
    " col=mix(col,c3,smoothstep(0.45,1.05,length(r))*smoothstep(0.3,0.9,f));",
    " float glow=pow(clamp(f,0.0,1.0),3.0)*clamp(max(q.x,r.y),0.0,1.0);",
    " col+=c4*glow*0.9;",
    /* виньетка со смещением яркого центра вправо (там, где визуал hero) */
    " vec2 vc=uv-vec2(0.42,0.02);",
    " col*=1.0-0.52*length(vc*vec2(0.62,0.88));",
    " col=max(col,vec3(0.0));",
    " gl_FragColor=vec4(col,1.0);",
    "}"
  ].join("\n");

  var QUALITY = 0.55;                 // рендер в уменьшенном разрешении — жидкость всё равно «дымная»
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function initFluid(canvas) {
    if (!canvas || canvas.dataset.fluidBound) return;
    canvas.dataset.fluidBound = "1";

    var opts = { alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false };
    var gl = canvas.getContext("webgl", opts) || canvas.getContext("experimental-webgl", opts);
    if (!gl) { canvas.style.display = "none"; return; }

    function makeShader(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
      return s;
    }

    var vs = makeShader(gl.VERTEX_SHADER, VERT);
    var fs = makeShader(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) { canvas.style.display = "none"; return; }

    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.style.display = "none"; return; }
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var locA = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(locA);
    gl.vertexAttribPointer(locA, 2, gl.FLOAT, false, 0, 0);

    var uR = gl.getUniformLocation(prog, "uR");
    var uT = gl.getUniformLocation(prog, "uT");
    var uM = gl.getUniformLocation(prog, "uM");
    var uSeed = gl.getUniformLocation(prog, "uSeed");

    /* --- размер --- */
    var W = 0, H = 0;
    function resize() {
      var cw = canvas.clientWidth, ch = canvas.clientHeight;
      if (!cw || !ch) return;
      var w = Math.max(2, Math.round(cw * QUALITY));
      var h = Math.max(2, Math.round(ch * QUALITY));
      if (w === W && h === H) return;
      W = w; H = h;
      canvas.width = W; canvas.height = H;
      gl.viewport(0, 0, W, H);
    }
    resize();

    /* --- курсор: цель + плавное приближение; без движения — тихий дрейф --- */
    var mx = 0.42, my = 0.45, tx = 0.42, ty = 0.45, lastMove = -10;
    function onMove(e) {
      var r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      tx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      ty = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      lastMove = time;
    }
    window.addEventListener("mousemove", onMove, { passive: true });

    /* --- видимость: рендерим только когда блок near viewport и вкладка активна --- */
    var visible = false, rafId = 0, time = 0, last = 0, t0 = performance.now();
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) {
        var e = en[0];
        var wasVisible = visible;
        visible = e.isIntersecting;
        if (visible && !wasVisible && !reduceMotion) start();
      }, { rootMargin: "120px" }).observe(canvas);
    } else { visible = true; }

    document.addEventListener("visibilitychange", function () {
      if (!document.hidden && visible && !reduceMotion) start(); else stop();
    });

    function draw(now) {
      time = (now - t0) / 1000;
      /* дрейф цели, если курсор давно не двигался */
      if (time - lastMove > 2.5) {
        tx = 0.5 + 0.16 * Math.sin(time * 0.21);
        ty = 0.46 + 0.14 * Math.cos(time * 0.17);
      }
      mx += (tx - mx) * 0.035;
      my += (ty - my) * 0.035;
      gl.uniform2f(uR, W, H);
      gl.uniform1f(uT, time);
      gl.uniform2f(uM, mx, my);
      gl.uniform1f(uSeed, canvas.id === "fluidContacts" ? 7.31 : 0.0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function loop(now) {
      rafId = 0;
      if (!visible || document.hidden) return;
      var dt = now - last;
      if (dt > 90) dt = 90;           // после сна не «перематываем» время
      last += dt;
      draw(last);
      rafId = requestAnimationFrame(loop);
    }
    function start() {
      if (!rafId && visible && !document.hidden) { last = performance.now(); rafId = requestAnimationFrame(loop); }
    }
    function stop() { if (rafId) { cancelAnimationFrame(rafId); rafId = 0; } }

    /* статичный кадр для prefers-reduced-motion */
    if (reduceMotion) { resize(); draw(performance.now() - t0 + 42000); return; }

    start();

    var rsRaf = 0;
    window.addEventListener("resize", function () {
      if (rsRaf) return;
      rsRaf = requestAnimationFrame(function () { rsRaf = 0; resize(); if (reduceMotion) draw(performance.now() - t0 + 42000); });
    }, { passive: true });
  }

  function boot() { document.querySelectorAll("canvas.fluid-bg").forEach(initFluid); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
