(function(){
  var FRAME_COUNT=192;
  var canvas=document.getElementById('scrub-canvas');
  var ctx=canvas.getContext('2d');
  var section=document.getElementById('scrub-section');
  var loader=document.getElementById('loader');
  var loadNum=document.getElementById('load-num');
  var bar=document.getElementById('progress-bar');
  var progressText=document.getElementById('progress-text');
  var frames=new Array(FRAME_COUNT);
  var loaded=0, targetFrame=0, currentFrame=0, lastDrawn=-1;

  function src(i){return 'frames/frame_'+String(i+1).padStart(3,'0')+'.jpg'}
  function resize(){
    var dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.round(innerWidth*dpr);canvas.height=Math.round(innerHeight*dpr);
    draw(Math.round(currentFrame));
  }
  function draw(i){
    var img=frames[i]; if(!img||!img.complete)return;
    var cw=canvas.width, ch=canvas.height;
    var dpr = Math.min(window.devicePixelRatio||1, 2);
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
    lastDrawn=i;
  }
  function preload(){
    for(let i=0;i<FRAME_COUNT;i++){
      let img=new Image();frames[i]=img;
      img.onload=function(){
        loaded++;var p=Math.round(loaded/FRAME_COUNT*100);loadNum.textContent=p;
        if(i===0){resize();document.body.style.overflow='auto'}
        if(loaded>=Math.min(24,FRAME_COUNT)){loader.classList.add('done')}
      };
      img.onerror=function(){loaded++};img.src=src(i);
    }
  }
  function updateTarget(){
    var rect=section.getBoundingClientRect();
    var distance=section.offsetHeight-innerHeight;
    var p=Math.max(0,Math.min(1,-rect.top/distance));
    targetFrame=p*(FRAME_COUNT-1);
    bar.style.width=(p*100)+'%';progressText.textContent=String(Math.round(p*100)).padStart(2,'0');
  }
  function animate(){
    currentFrame+=(targetFrame-currentFrame)*0.16;
    if(Math.abs(targetFrame-currentFrame)<0.02)currentFrame=targetFrame;
    var i=Math.max(0,Math.min(FRAME_COUNT-1,Math.round(currentFrame)));
    if(i!==lastDrawn)draw(i);
    
    var progress = currentFrame / (FRAME_COUNT - 1);
    var statsSection = document.querySelector('.hero-stats-overlay');
    if (statsSection) {
      var p = Math.max(0, Math.min(1, (progress - 0.8) * 10));
      statsSection.style.opacity = p;
      statsSection.style.transform = 'translate(-50%, ' + (20 - p * 20) + 'px)';
      statsSection.style.pointerEvents = p > 0.5 ? 'auto' : 'none';
      
      if (progress >= 0.82 && !window.statsTriggered) {
        window.statsTriggered = true;
        window.dispatchEvent(new Event('playStats'));
      }
    }
    
    requestAnimationFrame(animate);
  }
  window.addEventListener('scroll',updateTarget,{passive:true});window.addEventListener('resize',resize);
  document.body.style.overflow='hidden';preload();updateTarget();animate();
})();

// --- GSAP Map Interaction Logic ---
(function() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  const mapSection = document.getElementById('explore-map');
  if (!mapSection) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Map Section Intro Animation
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: mapSection,
      start: "top 78%",
      once: true
    }
  });

  const eyebrow = mapSection.querySelector('.map-text .eyebrow');
  const divider = mapSection.querySelector('.section-divider');
  const h2 = mapSection.querySelector('.map-text h2');
  const p = mapSection.querySelector('.map-text p');
  const selectedCard = mapSection.querySelector('.selected-area-card');
  const mapPoints = mapSection.querySelectorAll('.map-point');

  if (!prefersReducedMotion) {
    // Step 01: Common Section Header Reveal
    if (eyebrow) gsap.set(eyebrow, { opacity: 0, y: 8 });
    if (divider) gsap.set(divider, { scaleX: 0 });
    if (h2) gsap.set(h2, { opacity: 0, y: 22 });
    if (p) gsap.set(p, { opacity: 0, y: 14 });

    if (eyebrow) tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }, 0);
    if (divider) tl.to(divider, { scaleX: 1, duration: 0.6, ease: "power2.out" }, 0.08);
    if (h2) tl.to(h2, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, 0.12);
    if (p) tl.to(p, { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" }, 0.22);

    const handoffTime = 0.35;

    // Step 02: Selected Area Card
    if (selectedCard) {
      gsap.set(selectedCard, { opacity: 0, x: -25, scale: 0.98 });
      tl.to(selectedCard, {
        opacity: 1,
        x: 0,
        scale: 1,
        duration: 0.65,
        ease: "power3.out"
      }, handoffTime);
    }

    // Step 03 & 04: Map Points & Lines
    if (mapPoints.length) {
      const pointsTl = gsap.timeline();
      
      mapPoints.forEach((point, i) => {
        const line = point.querySelector('.point-line');
        const dot = point.querySelector('.point-dot');
        const labelText = point.querySelector('.point-label');
        
        gsap.set(point, { opacity: 0, y: 8, scale: 0.85 });
        if (line) gsap.set(line, { scaleY: 0 });
        if (labelText) gsap.set(labelText, { opacity: 0 });
        if (dot) gsap.set(dot, { scale: 0, opacity: 0 });

        const pTl = gsap.timeline();
        pTl.to(point, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(1.4)" });
        if (dot) pTl.to(dot, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" }, "-=0.25");
        if (line) pTl.to(line, { scaleY: 1, duration: 0.3, ease: "power2.out" }, "-=0.15");
        if (labelText) pTl.to(labelText, { opacity: 1, duration: 0.2 }, "-=0.1");

        pointsTl.add(pTl, i * 0.12);
      });
      
      tl.add(pointsTl, handoffTime + 0.12);
    }
  } else {
    // Fallback for prefers-reduced-motion
    gsap.set([eyebrow, divider, h2, p, selectedCard, mapPoints], { opacity: 1 });
  }

  // Step 05: Map Point Pulse
  const rings = mapSection.querySelectorAll('.point-ring');
  if (rings.length && !prefersReducedMotion) {
    rings.forEach((ring, i) => {
      gsap.fromTo(ring, 
        { scale: 1, opacity: 0.5 },
        {
          scale: 1.8,
          opacity: 0,
          duration: 2,
          repeat: -1,
          delay: i * 0.4 + 1.5,
          ease: "power1.out",
          immediateRender: false
        }
      );
    });
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
          if(cardNo) cardNo.textContent = data.no;
          if(cardEng) cardEng.textContent = data.eng;
          if(cardTitle) cardTitle.textContent = data.title;
          if(cardDesc) cardDesc.textContent = data.desc;
          
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
(function() {
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
        onUpdate: function() {
          numEl.textContent = (counter.val).toFixed(decimals) + unit;
        },
        onComplete: function() {
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

// --- GSAP Cards Interaction Logic ---
(function() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  const cardsSection = document.querySelector('.cards-section');
  if (!cardsSection) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  const sectionTitle = cardsSection.querySelector('.section-title');
  const featureCards = cardsSection.querySelectorAll('.feature-card');

  const entranceTl = gsap.timeline({
    scrollTrigger: {
      trigger: cardsSection,
      start: "top 82%",
      once: true
    }
  });

  if (!prefersReducedMotion) {
    if (sectionTitle) gsap.set(sectionTitle, { opacity: 0, y: 22 });

    if (sectionTitle) entranceTl.to(sectionTitle, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, 0.12);

    if (featureCards.length) {
      gsap.set(featureCards, { opacity: 0, y: 28, scale: 0.985 });
      const handoffTime = 0.35;
      entranceTl.to(featureCards, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.7,
        stagger: 0.12,
        ease: "power3.out"
      }, handoffTime);
    }
  } else {
    gsap.set([sectionTitle, featureCards], { opacity: 1 });
  }

  // Parallax & Hover Logic for each card
  featureCards.forEach(card => {
    const cardImage = card.querySelector('.card-image');
    if (!cardImage) return;

    if (!prefersReducedMotion) {
      // Scroll Parallax (Y-axis)
      gsap.fromTo(cardImage, 
        { yPercent: -4 },
        {
          yPercent: 4,
          ease: "none",
          scrollTrigger: {
            trigger: card,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.8
          }
        }
      );

      // Mouse Parallax (X & Y axis)
      if (window.matchMedia("(pointer: fine)").matches) {
        const xTo = gsap.quickTo(cardImage, "x", { duration: 0.4, ease: "power2.out" });
        const yTo = gsap.quickTo(cardImage, "y", { duration: 0.4, ease: "power2.out" });
        const scaleTo = gsap.quickTo(cardImage, "scale", { duration: 0.55, ease: "power2.out" });

        card.addEventListener("mouseenter", () => {
          scaleTo(1.035);
        });

        card.addEventListener("mousemove", (e) => {
          const rect = card.getBoundingClientRect();
          const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          const normY = ((e.clientY - rect.top) / rect.height) * 2 - 1;

          xTo(normX * 7);
          yTo(normY * 5);
        });

        card.addEventListener("mouseleave", () => {
          scaleTo(1);
          xTo(0);
          yTo(0);
        });
      }
    }
  });
})();

// --- GSAP News Interaction Logic ---
(function() {
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
(function() {
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
