/* ============================================================
   LAZYWORKZ GALLERY — Interactive Script
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* =========================================================
     GLOBAL MOUSE TRACKING
     Single source of truth for all mouse-driven effects.
     ========================================================= */
  let mouseClientX = 0, mouseClientY = 0;       // Raw pixel position
  let mouseNormX = 0, mouseNormY = 0;           // Normalized -1 to 1

  window.addEventListener('mousemove', (e) => {
    mouseClientX = e.clientX;
    mouseClientY = e.clientY;
    mouseNormX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseNormY = (e.clientY / window.innerHeight - 0.5) * 2;
  });


  /* ----- Cursor Glow Follower ----- */
  const glow = document.createElement('div');
  glow.classList.add('cursor-glow');
  document.body.appendChild(glow);

  let glowX = -500, glowY = -500;

  document.addEventListener('mousemove', () => {
    glow.classList.add('active');
  });

  document.addEventListener('mouseleave', () => {
    glow.classList.remove('active');
  });

  function animateGlow() {
    glowX += (mouseClientX - glowX) * 0.08;
    glowY += (mouseClientY - glowY) * 0.08;
    glow.style.left = glowX + 'px';
    glow.style.top = glowY + 'px';
    requestAnimationFrame(animateGlow);
  }
  animateGlow();


  /* =========================================================
     3D MOUSE FOLLOW — Subtle tilt only, robot stays fixed.
     ========================================================= */
  const splineContainer = document.getElementById('sphere-container');
  const headline = document.getElementById('hero-headline');

  let currentX = 0, currentY = 0;
  let slideX = 0; // Smooth lerp target for robot horizontal slide (0 = center, 1 = slid right)

  const splineCanvas = document.getElementById('spline-canvas');

  function animateRobotFollow() {
    currentX += (mouseNormX - currentX) * 0.06;
    currentY += (mouseNormY - currentY) * 0.06;

    // Smoothly lerp the slide position relative to scroll visibility
    const isAtContact = splineContainer && splineContainer.classList.contains('robot-at-contact');
    const slideTarget = isAtContact ? 1 : 0;
    slideX += (slideTarget - slideX) * 0.04; // Slow smooth ease

    // Visually shift the robot to the Right Third by sliding the internal 3D camera to the LEFT
    // This perfectly bypasses all CSS coordinate tracking bugs because the DOM element never moves!
    if (window.splineApp && window.splineApp._camera) {
      const cam = window.splineApp._camera;
      
      // Calculate theoretically perfect 3D translation based on WebGL Frustum
      const fovY = cam.fov || 45; 
      const dist = cam.position.z || 1000;
      
      const vFovRad = (fovY * Math.PI) / 180;
      const visibleHeight = 2 * dist * Math.tan(vFovRad / 2);
      const aspect = window.innerWidth / window.innerHeight;
      const visibleWidth = visibleHeight * aspect;
      
      // The user requested moving it slightly left to avoid crowding the exact edge of the screen
      // Shifting by 10% instead of 16.6% places it organically without severe clipping
      const exactShiftUnits = visibleWidth * 0.10;
      cam.position.x = slideX * -exactShiftUnits;
    }

    if (splineContainer) {
      const rotateY = currentX * 8;   // ±8° left/right tilt
      const rotateX = -currentY * 5;  // ±5° up/down tilt

      // We ONLY apply the subtle mouse tilt to the CSS container now. NO translateX!
      splineContainer.style.transform =
        `perspective(1400px) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
    }

    requestAnimationFrame(animateRobotFollow);
  }
  animateRobotFollow();


  /* ----- Parallax on scroll (headline only) ----- */
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const factor = scrollY * 0.25;

    if (headline) {
      headline.style.transform = `translateY(${factor * 0.4}px)`;
    }
  }, { passive: true });


  /* ----- Mobile hamburger toggle ----- */
  const hamburger = document.getElementById('hamburger');
  const nav = document.getElementById('main-nav');
  const hireBtn = document.getElementById('hire-btn');

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      const isOpen = nav.style.display === 'flex';

      if (isOpen) {
        nav.style.display = 'none';
        if (hireBtn) hireBtn.style.display = 'none';
        hamburger.classList.remove('open');
      } else {
        nav.style.display = 'flex';
        nav.style.flexDirection = 'column';
        nav.style.position = 'absolute';
        nav.style.top = '100%';
        nav.style.left = '0';
        nav.style.width = '100%';
        nav.style.padding = '1.5rem';
        nav.style.background = 'var(--bg-primary)';
        nav.style.borderBottom = '1px solid rgba(26,26,26,0.08)';
        nav.style.gap = '1.2rem';

        if (hireBtn) {
          hireBtn.style.display = 'flex';
          hireBtn.style.padding = '0 1.5rem 1.5rem';
        }

        hamburger.classList.add('open');
      }
    });
  }


  /* ----- Intersection Observer for scroll-triggered fades ----- */
  const observerOptions = {
    root: null,
    threshold: 0.2,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.testimonials-container, .testimonials-controls').forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1)';
    observer.observe(el);
  });

  // Contact section — robot slide + staggered form reveal
  const contactSection = document.getElementById('contact-section');
  const contactCardEl = document.getElementById('contact-card-wrapper');
  const heroContainer = document.getElementById('sphere-container');

  let contactRevealed = false;

  function checkContactSection() {
    if (!contactSection) return;

    const rect = contactSection.getBoundingClientRect();
    const windowH = window.innerHeight;

    // Trigger when the top of the contact section enters the bottom 80% of the viewport
    const isVisible = rect.top < windowH * 0.85;

    if (isVisible) {
      // Robot slides right
      if (heroContainer) heroContainer.classList.add('robot-at-contact');

      if (!contactRevealed) {
        contactRevealed = true;

        // Reveal the contact card wrapper
        if (contactCardEl) contactCardEl.classList.add('slide-in');

        // Stagger-reveal title, description, info items
        const title = contactSection.querySelector('.contact-title');
        const desc = contactSection.querySelector('.contact-description');
        const infoItems = contactSection.querySelectorAll('.contact-info-item');

        if (title) { title.style.transitionDelay = '0.3s'; title.classList.add('reveal'); }
        if (desc) { desc.style.transitionDelay = '0.4s'; desc.classList.add('reveal'); }
        infoItems.forEach((item, i) => {
          item.style.transitionDelay = `${0.5 + i * 0.1}s`;
          item.classList.add('reveal');
        });

        // Stagger-reveal form fields
        const formGroups = contactSection.querySelectorAll('.form-group');
        const submitBtn = contactSection.querySelector('.form-submit');
        formGroups.forEach((group, i) => {
          group.style.transitionDelay = `${0.5 + i * 0.12}s`;
          group.classList.add('reveal');
        });
        if (submitBtn) {
          submitBtn.style.transitionDelay = `${0.5 + formGroups.length * 0.12}s`;
          submitBtn.classList.add('reveal');
        }
      }
    } else {
      // Scrolled back above contact — slide robot back
      if (heroContainer) heroContainer.classList.remove('robot-at-contact');
    }
  }

  // Run on scroll AND immediately on load
  window.addEventListener('scroll', checkContactSection, { passive: true });
  checkContactSection();

  // Add "in-view" styles
  const style = document.createElement('style');
  style.textContent = `
    .in-view {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }
  `;
  document.head.appendChild(style);


  /* ----- Magnetic hover on headline letters (desktop only) ----- */
  if (window.matchMedia('(min-width: 769px)').matches) {
    const lines = document.querySelectorAll('.hero-headline .line');

    lines.forEach((line) => {
      line.addEventListener('mousemove', (e) => {
        const rect = line.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 6;
        line.style.transform = `translate(${x}px, ${y}px)`;
        line.style.transition = 'transform 0.15s ease-out';
      });

      line.addEventListener('mouseleave', () => {
        line.style.transform = 'translate(0, 0)';
        line.style.transition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)';
      });
    });
  }


  /* =========================================================
     TESTIMONIALS (Vanilla JS Implementation)
     ========================================================= */
  const testimonialsData = [
    { tempId: 't0', testimonial: "My favorite solution in the market. We work 5x faster with COMPANY.", by: "Alex, CEO at TechCorp", imgSrc: "https://i.pravatar.cc/150?img=1" },
    { tempId: 't1', testimonial: "I'm confident my data is safe with COMPANY. I can't say that about other providers.", by: "Dan, CTO at SecureNet", imgSrc: "https://i.pravatar.cc/150?img=2" },
    { tempId: 't2', testimonial: "I know it's cliche, but we were lost before we found COMPANY. Can't thank you guys enough!", by: "Stephanie, COO at InnovateCo", imgSrc: "https://i.pravatar.cc/150?img=3" },
    { tempId: 't3', testimonial: "COMPANY's products make planning for the future seamless. Can't recommend them enough!", by: "Marie, CFO at FuturePlanning", imgSrc: "https://i.pravatar.cc/150?img=4" },
    { tempId: 't4', testimonial: "If I could give 11 stars, I'd give 12.", by: "Andre, Head of Design at CreativeSolutions", imgSrc: "https://i.pravatar.cc/150?img=5" },
    { tempId: 't5', testimonial: "SO SO SO HAPPY WE FOUND YOU GUYS!!!! I'd bet you've saved me 100 hours so far.", by: "Jeremy, Product Manager at TimeWise", imgSrc: "https://i.pravatar.cc/150?img=6" },
    { tempId: 't6', testimonial: "Took some convincing, but now that we're on COMPANY, we're never going back.", by: "Pam, Marketing Director at BrandBuilders", imgSrc: "https://i.pravatar.cc/150?img=7" },
    { tempId: 't7', testimonial: "I would be lost without COMPANY's in-depth analytics. The ROI is EASILY 100X for us.", by: "Daniel, Data Scientist at AnalyticsPro", imgSrc: "https://i.pravatar.cc/150?img=8" },
    { tempId: 't8', testimonial: "It's just the best. Period.", by: "Fernando, UX Designer at UserFirst", imgSrc: "https://i.pravatar.cc/150?img=9" },
    { tempId: 't9', testimonial: "I switched 5 years ago and never looked back.", by: "Andy, DevOps Engineer at CloudMasters", imgSrc: "https://i.pravatar.cc/150?img=10" },
    { tempId: 't10', testimonial: "I've been searching for a solution like COMPANY for YEARS. So glad I finally found one!", by: "Pete, Sales Director at RevenueRockets", imgSrc: "https://i.pravatar.cc/150?img=11" },
    { tempId: 't11', testimonial: "It's so simple and intuitive, we got the team up to speed in 10 minutes.", by: "Marina, HR Manager at TalentForge", imgSrc: "https://i.pravatar.cc/150?img=12" },
    { tempId: 't12', testimonial: "COMPANY's customer support is unparalleled. They're always there when we need them.", by: "Olivia, Customer Success Manager at ClientCare", imgSrc: "https://i.pravatar.cc/150?img=13" },
    { tempId: 't13', testimonial: "The efficiency gains we've seen since implementing COMPANY are off the charts!", by: "Raj, Operations Manager at StreamlineSolutions", imgSrc: "https://i.pravatar.cc/150?img=14" },
    { tempId: 't14', testimonial: "COMPANY has revolutionized how we handle our workflow. It's a game-changer!", by: "Lila, Workflow Specialist at ProcessPro", imgSrc: "https://i.pravatar.cc/150?img=15" },
    { tempId: 't15', testimonial: "The scalability of COMPANY's solution is impressive. It grows with our business seamlessly.", by: "Trevor, Scaling Officer at GrowthGurus", imgSrc: "https://i.pravatar.cc/150?img=16" },
    { tempId: 't16', testimonial: "I appreciate how COMPANY continually innovates. They're always one step ahead.", by: "Naomi, Innovation Lead at FutureTech", imgSrc: "https://i.pravatar.cc/150?img=17" },
    { tempId: 't17', testimonial: "The ROI we've seen with COMPANY is incredible. It's paid for itself many times over.", by: "Victor, Finance Analyst at ProfitPeak", imgSrc: "https://i.pravatar.cc/150?img=18" },
    { tempId: 't18', testimonial: "COMPANY's platform is so robust, yet easy to use. It's the perfect balance.", by: "Yuki, Tech Lead at BalancedTech", imgSrc: "https://i.pravatar.cc/150?img=19" },
    { tempId: 't19', testimonial: "We've tried many solutions, but COMPANY stands out in terms of reliability and performance.", by: "Zoe, Performance Manager at ReliableSystems", imgSrc: "https://i.pravatar.cc/150?img=20" }
  ];

  const testimonialsContainer = document.getElementById('testimonials-container');
  const btnPrev = document.getElementById('prev-testimonial');
  const btnNext = document.getElementById('next-testimonial');

  if (testimonialsContainer) {
    let testimonialsList = [...testimonialsData];
    let cardSize = window.matchMedia("(min-width: 640px)").matches ? 365 : 290;

    window.addEventListener("resize", () => {
      const newMatches = window.matchMedia("(min-width: 640px)").matches;
      const newCardSize = newMatches ? 365 : 290;
      if (newCardSize !== cardSize) {
        cardSize = newCardSize;
        renderTestimonials();
      }
    });

    const handleMove = (steps) => {
      if (steps > 0) {
        for (let i = steps; i > 0; i--) {
          const item = testimonialsList.shift();
          if (!item) return;
          testimonialsList.push({ ...item, tempId: Math.random().toString() });
        }
      } else {
        for (let i = steps; i < 0; i++) {
          const item = testimonialsList.pop();
          if (!item) return;
          testimonialsList.unshift({ ...item, tempId: Math.random().toString() });
        }
      }
      renderTestimonials();
    };

    if (btnPrev) btnPrev.addEventListener('click', () => handleMove(-1));
    if (btnNext) btnNext.addEventListener('click', () => handleMove(1));

    const renderTestimonials = () => {
      const existingElements = Array.from(testimonialsContainer.children);
      const currentIds = testimonialsList.map(t => t.tempId);

      // Remove elements that are no longer in the list (items that wraparound)
      existingElements.forEach(el => {
        if (!currentIds.includes(el.dataset.id)) {
          el.remove();
        }
      });

      testimonialsList.forEach((testimonial, index) => {
        // match React component math
        const position = testimonialsList.length % 2
          ? index - (testimonialsList.length + 1) / 2
          : index - testimonialsList.length / 2;

        const isCenter = position === 0;

        let card = testimonialsContainer.querySelector(`[data-id="${testimonial.tempId}"]`);
        
        if (!card) {
          card = document.createElement('div');
          card.dataset.id = testimonial.tempId;
          card.innerHTML = `
            <span class="testimonial-corner"></span>
            <img src="${testimonial.imgSrc}" alt="" class="testimonial-img" />
            <h3 class="testimonial-text">"${testimonial.testimonial}"</h3>
            <p class="testimonial-author">- ${testimonial.by}</p>
          `;
          card.addEventListener('click', () => handleMove(position));
          testimonialsContainer.appendChild(card);
        }

        card.className = `testimonial-card ${isCenter ? 'is-center' : ''}`;
        card.style.width = `${cardSize}px`;
        card.style.height = `${cardSize}px`;
      });
      
      updateParallaxTransforms();
    };

    let scatterScrollProgress = 0;

    const calculateScatter = () => {
      const testimonialsSection = document.getElementById('testimonials');
      if (!testimonialsSection) return;
      
      const rect = testimonialsSection.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate distance from center. Progress is 0 when perfectly centered in viewport.
      const centerDistance = rect.top + (rect.height / 2) - (windowHeight / 2);
      let progress = centerDistance / windowHeight; 
      progress = Math.max(-1.5, Math.min(1.5, progress));
      
      if (Math.abs(scatterScrollProgress - progress) > 0.01) {
        scatterScrollProgress = progress;
        updateParallaxTransforms();
      }
    };

    const updateParallaxTransforms = () => {
      const cards = testimonialsContainer.querySelectorAll('.testimonial-card');
      if (!cards.length) return;
      
      cards.forEach(card => {
        const id = card.dataset.id;
        const index = testimonialsList.findIndex(t => t.tempId === id);
        if (index === -1) return;
        
        const position = testimonialsList.length % 2
          ? index - (testimonialsList.length + 1) / 2
          : index - testimonialsList.length / 2;
          
        const isCenter = position === 0;
        
        // Base assembled transforms
        const translateX = (cardSize / 1.5) * position;
        const translateY = isCenter ? -65 : position % 2 ? 15 : -15;
        const rotate = isCenter ? 0 : position % 2 ? 2.5 : -2.5;
        
        // Parallax Scatter Logic
        const scatterMagnitude = Math.pow(Math.abs(scatterScrollProgress), 1.2); 
        
        let scatterX = 0;
        let scatterY = 0;
        let scatterRotate = 0;
        let targetOpacity = 1;
        
        if (scatterMagnitude > 0.01) {
           // Pushes outer cards drastically outward
           scatterX = position * scatterMagnitude * 400; 
           
           // Scatters vertically (alternating up and down based on index)
           const dirY = (index % 2 === 0) ? -1 : 1;
           scatterY = dirY * scatterMagnitude * 600 + (Math.abs(position) * scatterMagnitude * 100);
           
           // Tumbles the cards dynamically
           const spin = (index % 3 === 0) ? 1 : -1;
           scatterRotate = spin * scatterMagnitude * 120;
           
           // Fade out dynamically based on scatter to complete the "fly in" illusion
           targetOpacity = Math.max(0, 1 - (scatterMagnitude * 1.5));
           
           // Use fast transition for responsive scroll mapping
           card.style.transition = 'transform 0.15s ease-out, opacity 0.15s ease-out';
        } else {
           // Snap to perfectly assembled and restore slow, beautiful shuffle transition
           scatterX = 0;
           scatterY = 0;
           scatterRotate = 0;
           targetOpacity = 1;
           card.style.transition = ''; // Restore CSS defaults
        }
        
        card.style.opacity = targetOpacity;
        card.style.transform = `translate(-50%, -50%) translateX(${translateX + scatterX}px) translateY(${translateY + scatterY}px) rotate(${rotate + scatterRotate}deg)`;
      });
    };

    // Listen to scroll for continuous parallax updates
    window.addEventListener('scroll', calculateScatter, { passive: true });

    renderTestimonials();
    // Initialize scatter position immediately on load
    calculateScatter();
  }

  /* ----- Log ready ----- */
  console.log('🚀 Lazyworkz Gallery loaded');
});
