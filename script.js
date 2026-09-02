(function () {
  var FRAME_COUNT = 192;
  var canvas = document.getElementById('scrub-canvas');
  var ctx = canvas.getContext('2d');
  var section = document.getElementById('scrub-section');
  var loader = document.getElementById('loader');
  var loadNum = document.getElementById('load-num');
  var devProgressActive = document.getElementById('dev-progress-active');
  var devProgressIndicator = document.getElementById('dev-progress-indicator');
  var devProgressText = document.getElementById('dev-progress-text');
  var devStatusText = document.getElementById('dev-status-text');
  var devCircleStroke = document.getElementById('dev-circle-stroke');
  var frames = new Array(FRAME_COUNT);
  var loaded = 0, targetFrame = 0, currentFrame = 0, lastDrawn = -1;

  function src(i) { return 'frames/frame_' + String(i + 1).padStart(3, '0') + '.jpg' }
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * dpr); canvas.height = Math.round(innerHeight * dpr);
    draw(Math.round(currentFrame));
  }
  function draw(i) {
    var img = frames[i]; if (!img || !img.complete) return;
    var cw = canvas.width, ch = canvas.height;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var headerH = 64 * dpr;
    var availH = ch - headerH;

    // FULL-BLEED Cover scaling
    var scale = Math.max(cw / img.width, availH / img.height);
    var w = img.width * scale, h = img.height * scale;
    var x = (cw - w) / 2;

    // Vertical alignment: center 35% to preserve sky and horizon
    var y = headerH + (availH - h) * 0.35;

    // Clear canvas
    ctx.clearRect(0, 0, cw, ch);

    // Draw main image
    ctx.globalAlpha = 1.0;
    ctx.filter = 'none';
    ctx.drawImage(img, x, y, w, h);
    lastDrawn = i;
  }
  function preload() {
    for (let i = 0; i < FRAME_COUNT; i++) {
      let img = new Image(); frames[i] = img;
      img.onload = function () {
        loaded++; var p = Math.round(loaded / FRAME_COUNT * 100); if (loadNum) loadNum.textContent = p;
        if (i === 0) { resize(); document.body.style.overflow = 'auto' }
        if (loaded >= Math.min(24, FRAME_COUNT)) { if (loader) loader.classList.add('done') }
      };
      img.onerror = function () { loaded++ }; img.src = src(i);
    }
  }
  function updateTarget() {
    var rect = section.getBoundingClientRect();
    var distance = section.offsetHeight - innerHeight;
    var p = Math.max(0, Math.min(1, -rect.top / distance));
    targetFrame = p * (FRAME_COUNT - 1);

    if (devProgressActive) devProgressActive.style.width = (p * 100) + '%';
    if (devProgressIndicator) devProgressIndicator.style.left = (p * 100) + '%';
    if (devProgressText) devProgressText.textContent = Math.round(p * 100);
    if (devStatusText) devStatusText.textContent = Math.round(p * 100);
    if (devCircleStroke) devCircleStroke.setAttribute('stroke-dasharray', (p * 100) + ', 100');

    var storyData = [
      { num: '409', unit: 'km²', label: '새만금 면적' },
      { num: '291', unit: 'km²', label: '개발면적' },
      { num: '22.1', unit: '조 원', label: '용지조성' },
      { num: '27', unit: '만 명', label: '유입인구' },
      { num: '263', unit: 'COMPANIES', label: '기업투자유치' },
      { num: '47.8', unit: '조 원', label: '총투자금액' }
    ];

    var stepIndex = Math.min(5, Math.floor(p * 6));
    if (window.currentStepIndex !== stepIndex) {
      window.currentStepIndex = stepIndex;

      var keyDataContent = document.getElementById('key-data-content');
      var keyDataIdx = document.getElementById('key-data-idx');
      var keyDataVal = document.getElementById('key-data-val');
      var keyDataUnit = document.getElementById('key-data-unit');
      var keyDataLabel = document.getElementById('key-data-label');
      var dots = document.querySelectorAll('#data-pagination .index-num');

      var displayIdx = '0' + (stepIndex + 1);
      if (keyDataIdx) keyDataIdx.textContent = displayIdx;

      if (keyDataContent && typeof gsap !== 'undefined') {
        if (typeof window.storyInitialized === 'undefined') {
          window.storyInitialized = true;
          if (keyDataVal) keyDataVal.textContent = storyData[stepIndex].num;
          if (keyDataUnit) keyDataUnit.textContent = storyData[stepIndex].unit;
          if (keyDataLabel) keyDataLabel.textContent = storyData[stepIndex].label;
          if (dots.length) {
            dots.forEach(function (dot, idx) {
              if (idx === stepIndex) dot.classList.add('active');
              else dot.classList.remove('active');
            });
          }
          gsap.set(keyDataContent, { opacity: 1, y: 0 });
        } else {
          gsap.to(keyDataContent, {
            opacity: 0,
            y: -5,
            duration: 0.28,
            ease: 'power2.out',
            overwrite: 'auto',
            onComplete: function () {
              if (keyDataVal) keyDataVal.textContent = storyData[stepIndex].num;
              if (keyDataUnit) keyDataUnit.textContent = storyData[stepIndex].unit;
              if (keyDataLabel) keyDataLabel.textContent = storyData[stepIndex].label;

              if (dots.length) {
                dots.forEach(function (dot, idx) {
                  if (idx === stepIndex) dot.classList.add('active');
                  else dot.classList.remove('active');
                });
              }

              gsap.fromTo(keyDataContent,
                { opacity: 0, y: 5 },
                { opacity: 1, y: 0, duration: 0.32, ease: 'power2.out', overwrite: 'auto' }
              );
            }
          });
        }
      }
    }
  }
  function animate() {
    currentFrame += (targetFrame - currentFrame) * 0.16;
    if (Math.abs(targetFrame - currentFrame) < 0.02) currentFrame = targetFrame;
    var i = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(currentFrame)));
    if (i !== lastDrawn) draw(i);

    requestAnimationFrame(animate);
  }
  window.addEventListener('scroll', updateTarget, { passive: true }); window.addEventListener('resize', resize);
  window.addEventListener('pageshow', updateTarget);
  document.body.style.overflow = 'hidden'; preload(); updateTarget(); animate();
})();




// --- MAP INTRO Reveal Animation ---
(function () {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  const introSection = document.getElementById('map-intro');
  if (!introSection) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const eyebrow = introSection.querySelector('.map-intro-eyebrow');
  const heading = introSection.querySelector('.map-intro-heading');
  const desc = introSection.querySelector('.map-intro-desc');
  const guideEl = document.getElementById('map-intro-guide');

  if (prefersReducedMotion) {
    gsap.set([eyebrow, heading, desc, guideEl].filter(Boolean), { opacity: 1, y: 0, clipPath: 'none' });
    return;
  }

  // 초기 상태 설정
  if (eyebrow) gsap.set(eyebrow, { opacity: 0, y: 20 });
  if (heading) gsap.set(heading, { opacity: 0, y: 24, clipPath: 'inset(100% 0% 0% 0%)' });
  if (desc) gsap.set(desc, { opacity: 0, y: 16 });
  if (guideEl) gsap.set(guideEl, { opacity: 0, y: 16 });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: introSection,
      start: 'top 80%',
      once: true
    }
  });

  if (eyebrow) tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 0);
  if (heading) tl.to(heading, { opacity: 1, y: 0, clipPath: 'inset(0% 0% -10% 0%)', duration: 0.85, ease: 'power3.out' }, 0.1);
  if (desc) tl.to(desc, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 0.22);
  if (guideEl) tl.to(guideEl, { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out' }, 0.32);
})();

// --- GSAP Map Interaction Logic ---
(function () {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  const mapSection = document.getElementById('explore-map');
  if (!mapSection) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const selectedCard = mapSection.querySelector('.selected-area-card');
  const mapPoints = mapSection.querySelectorAll('.map-point');
  const mapLayout = mapSection.querySelector('.map-layout');

  if (!prefersReducedMotion) {
    // 1. Map Points (Marker Stagger)
    if (mapPoints.length) {
      mapPoints.forEach((point) => {
        const line = point.querySelector('.point-line');
        const dot = point.querySelector('.point-dot');
        const labelText = point.querySelector('.point-label');

        gsap.set(point, { opacity: 0, y: 8, scale: 0.82 });
        if (line) gsap.set(line, { scaleY: 0, transformOrigin: 'top center' });
        if (labelText) gsap.set(labelText, { opacity: 0 });
        if (dot) gsap.set(dot, { scale: 0.7, opacity: 0 });
      });
    }

    if (selectedCard) gsap.set(selectedCard, { opacity: 0, x: -20 });

    const mapTl = gsap.timeline({
      scrollTrigger: {
        trigger: mapSection,
        start: "top 72%",
        once: true
      }
    });

    if (mapPoints.length) {
      mapPoints.forEach((point, i) => {
        const line = point.querySelector('.point-line');
        const dot = point.querySelector('.point-dot');
        const labelText = point.querySelector('.point-label');
        const offset = i * 0.12;

        mapTl.to(point, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "power3.out" }, offset);
        if (line) mapTl.to(line, { scaleY: 1, duration: 0.35, ease: "power2.out" }, offset + 0.1);
        if (dot) mapTl.to(dot, { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }, offset + 0.18);
        if (labelText) mapTl.to(labelText, { opacity: 1, duration: 0.22, ease: "none" }, offset + 0.22);
      });

      const markersDuration = (mapPoints.length - 1) * 0.12 + 0.5 + 0.1;
      
      if (selectedCard) {
        mapTl.to(selectedCard, { opacity: 1, x: 0, duration: 0.65, ease: "power3.out" }, markersDuration + 0.08);
      }
    } else if (selectedCard) {
      mapTl.to(selectedCard, { opacity: 1, x: 0, duration: 0.65, ease: "power3.out" });
    }
  } else {
    // Fallback for prefers-reduced-motion
    gsap.set([selectedCard, ...mapPoints], { opacity: 1 });
  }

  // MAP Parallax (Interaction C)
  if (mapLayout && !prefersReducedMotion) {
    const isMobile = window.innerWidth < 760;
    const yRange = isMobile ? 15 : 25; // 모바일은 약하게
    
    // Animate map-layout wrapper (contains markers and card)
    gsap.fromTo(mapLayout, 
      { y: -yRange },
      {
        y: yRange,
        ease: 'none',
        scrollTrigger: {
          trigger: mapSection,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.0 // 부드러운 연결
        }
      }
    );

    // Animate background-image of explore-map by the same amount
    gsap.fromTo(mapSection,
      { backgroundPosition: `center calc(50% - ${yRange}px)` },
      {
        backgroundPosition: `center calc(50% + ${yRange}px)`,
        ease: 'none',
        scrollTrigger: {
          trigger: mapSection,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.0
        }
      }
    );
  }

  // Step 07: Selected Card Click Interaction
  const areaData = {
    "01": { no: "01", eng: "INDUSTRY", title: "산업·연구용지", desc: "미래 산업을 위한 혁신 거점" },
    "02": { no: "02", eng: "TOURISM", title: "관광·레저용지", desc: "새만금의 자연과 관광이 만나는 공간" },
    "03": { no: "03", eng: "AIRPORT", title: "공항경제권", desc: "새만금의 새로운 글로벌 관문" },
    "04": { no: "04", eng: "COMPLEX", title: "복합·경제용지", desc: "산업과 생활이 연결되는 미래 공간" },
    "05": { no: "05", eng: "CITY", title: "배후도시용지", desc: "새만금의 새로운 정주 환경" }
  };

  const cardNo = mapSection.querySelector('.card-no');
  const cardEng = mapSection.querySelector('.card-eng');
  const cardTitle = mapSection.querySelector('.selected-area-card h3');
  const cardDesc = mapSection.querySelector('.selected-area-card p');

  let activeId = "01";

  mapPoints.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      if (id === activeId || !areaData[id]) return;

      // Update Active State
      mapPoints.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      activeId = id;

      // Card Content Change Animation
      const data = areaData[id];
      const elementsToAnimate = [cardNo, cardEng, cardTitle, cardDesc].filter(Boolean);

      gsap.to(elementsToAnimate, {
        opacity: 0,
        y: -8,
        duration: 0.15,
        ease: "power2.in",
        onComplete: () => {
          if (cardNo) cardNo.textContent = data.no;
          if (cardEng) cardEng.textContent = data.eng;
          if (cardTitle) cardTitle.textContent = data.title;
          if (cardDesc) cardDesc.textContent = data.desc;

          gsap.fromTo(elementsToAnimate,
            { opacity: 0, y: 8 },
            { opacity: 1, y: 0, duration: 0.25, ease: "power2.out", stagger: 0.02 }
          );
        }
      });
    });
  });
})();

// --- GSAP Stats Interaction Logic ---
(function () {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  const statsSection = document.querySelector('.hero-stats-overlay');
  if (!statsSection) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const statItems = statsSection.querySelectorAll('.stat-item');

  if (prefersReducedMotion) {
    gsap.set(statsSection, { opacity: 1 });
    gsap.set(statItems, { opacity: 1 });
    return;
  }

  const tlStats = gsap.timeline({ paused: true });

  const isMobile = window.innerWidth < 768;
  const yOffset = isMobile ? 10 : 16;

  statItems.forEach((item, i) => {
    const icon = item.querySelector('.stat-icon');
    const numEl = item.querySelector('.stat-num');

    if (!numEl) return;

    const originalText = numEl.textContent;
    const targetNum = parseFloat(originalText.replace(/,/g, ''));
    const unit = originalText.replace(/[\d,.]/g, '');
    const floatMatch = originalText.match(/\.\d+/);
    const decimals = floatMatch ? floatMatch[0].length - 1 : 0;

    gsap.set(item, { opacity: 0, y: yOffset });
    if (icon) gsap.set(icon, { opacity: 0, scale: 0.8 });

    const pTl = gsap.timeline();

    pTl.to(item, { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" });
    if (icon) pTl.to(icon, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.3)" }, "-=0.4");

    if (!isNaN(targetNum)) {
      const counter = { val: 0 };
      pTl.to(counter, {
        val: targetNum,
        duration: 1.2,
        ease: "power2.out",
        onUpdate: function () {
          numEl.textContent = (counter.val).toFixed(decimals) + unit;
        },
        onComplete: function () {
          numEl.textContent = originalText;
          gsap.fromTo(numEl,
            { scale: 1 },
            { scale: 1.035, duration: 0.12, yoyo: true, repeat: 1, ease: "power1.inOut" }
          );
        }
      }, "-=0.4");
    }

    tlStats.add(pTl, i * 0.08);
  });

  window.addEventListener('playStats', () => {
    if (tlStats.progress() === 0) tlStats.play();
  });
})();

// --- GSAP Showcase Interaction Logic ---
(function () {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  const section = document.querySelector('.showcase-section');
  if (!section) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const introTitle = section.querySelector('.showcase-title');
  const introSub = section.querySelector('.showcase-sub');
  const introEyebrow = section.querySelector('.showcase-eyebrow');

  const panels = section.querySelectorAll('.showcase-panel');
  const currentIndicator = section.querySelector('#showcase-current');

  if (prefersReducedMotion) {
    gsap.set(panels, { autoAlpha: 1, scale: 1, yPercent: 0 });
    return;
  }

  gsap.set(panels[0], { autoAlpha: 0, scale: 0.94 });
  gsap.set(panels[1], { yPercent: 100 });
  gsap.set(panels[2], { yPercent: 100 });

  const imgs = section.querySelectorAll('.panel-image');
  if (imgs[1]) gsap.set(imgs[1], { scale: 1.04 });
  if (imgs[2]) gsap.set(imgs[2], { scale: 1.04 });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1
    }
  });

  // 1. Intro -> Panel 01 Transition (0 ~ 1)
  tl.to([introTitle, introSub, introEyebrow], {
    opacity: 0,
    y: -50,
    duration: 1,
    ease: "power2.inOut",
    stagger: 0.1
  }, 0);

  tl.to(panels[0], {
    autoAlpha: 1,
    scale: 1,
    duration: 1,
    ease: "power2.out"
  }, 0.2);

  // 2. Hold Panel 01 (1 ~ 2)
  tl.to({}, { duration: 1 }, 1);

  // 3. Panel 01 -> Panel 02 Transition (2 ~ 3)
  tl.to(panels[0], {
    scale: 1.04,
    y: -10,
    opacity: 0,
    duration: 1,
    ease: "power2.inOut"
  }, 2);

  tl.to(panels[1], {
    yPercent: 0,
    duration: 1,
    ease: "power2.out",
    onStart: () => { if (currentIndicator) currentIndicator.textContent = '02'; },
    onReverseComplete: () => { if (currentIndicator) currentIndicator.textContent = '01'; }
  }, 2);

  if (imgs[1]) {
    tl.to(imgs[1], { scale: 1.0, duration: 1, ease: "power2.out" }, 2);
  }

  // 4. Hold Panel 02 (3 ~ 4)
  tl.to({}, { duration: 1 }, 3);

  // 5. Panel 02 -> Panel 03 Transition (4 ~ 5)
  tl.to(panels[1], {
    scale: 1.04,
    y: -10,
    opacity: 0,
    duration: 1,
    ease: "power2.inOut"
  }, 4);

  tl.to(panels[2], {
    yPercent: 0,
    duration: 1,
    ease: "power2.out",
    onStart: () => { if (currentIndicator) currentIndicator.textContent = '03'; },
    onReverseComplete: () => { if (currentIndicator) currentIndicator.textContent = '02'; }
  }, 4);

  if (imgs[2]) {
    tl.to(imgs[2], { scale: 1.0, duration: 1, ease: "power2.out" }, 4);
  }

  // 6. Hold Panel 03 (5 ~ 6)
  tl.to({}, { duration: 1 }, 5);

  // 7. Showcase -> News Transition (End of sticky) (6 ~ 7)
  tl.to(panels[2], {
    scale: 0.96,
    opacity: 0.35,
    duration: 1,
    ease: "power2.inOut"
  }, 6);

})();

// --- GSAP News Interaction Logic ---
(function () {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  const newsSection = document.querySelector('.news-banner-section');
  if (!newsSection) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const sectionTitle = newsSection.querySelector('.news-head h2');
  const moreLink = newsSection.querySelector('.more-link');
  const newsItems = newsSection.querySelectorAll('.news-item');
  const bannerTitle = newsSection.querySelector('.banner-content h2');
  const bannerBtn = newsSection.querySelector('.banner-content .btn-detail');

  if (prefersReducedMotion) {
    gsap.set([sectionTitle, moreLink, newsItems, bannerTitle, bannerBtn], { opacity: 1 });
    gsap.set(newsItems, { "--divider-scale": 1 });
    return;
  }

  const newsTl = gsap.timeline({
    scrollTrigger: {
      trigger: newsSection,
      start: "top 82%",
      once: true
    }
  });

  if (sectionTitle) gsap.set(sectionTitle, { opacity: 0, y: 22 });
  if (moreLink) gsap.set(moreLink, { opacity: 0, x: -8 });
  if (bannerTitle) gsap.set(bannerTitle, { opacity: 0, y: 22 });
  if (bannerBtn) gsap.set(bannerBtn, { opacity: 0, y: 14 });

  if (sectionTitle) newsTl.to(sectionTitle, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, 0.12);
  if (moreLink) newsTl.to(moreLink, { opacity: 1, x: 0, duration: 0.5, ease: "power3.out" }, 0.22);
  if (bannerTitle) newsTl.to(bannerTitle, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, 0.12);
  if (bannerBtn) newsTl.to(bannerBtn, { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" }, 0.22);

  if (newsItems.length) {
    const itemsTl = gsap.timeline();

    newsItems.forEach((item, i) => {
      gsap.set(item, { opacity: 0, y: 18, "--divider-scale": 0 });

      const pTl = gsap.timeline();
      pTl.to(item, { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" }, 0);
      pTl.to(item, { "--divider-scale": 1, duration: 0.65, ease: "power2.out" }, 0);

      itemsTl.add(pTl, i * 0.10);
    });

    const handoffTime = 0.35;
    newsTl.add(itemsTl, handoffTime);
  }
})();

// --- GSAP Footer Animation ---
(function () {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  const siteFooter = document.querySelector('.site-footer');
  if (!siteFooter) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReducedMotion) {
    gsap.fromTo(siteFooter,
      { opacity: 0, y: 12 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: siteFooter,
          start: "top 95%",
          once: true
        }
      }
    );
  }
})();
