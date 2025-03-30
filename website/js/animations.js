// Animation on Scroll Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Mark document as JS-enabled
    document.documentElement.classList.add('js-enabled');
    
    // FORCE ALL ELEMENTS TO BE VISIBLE IMMEDIATELY
    // This is a drastic fix to ensure elements don't disappear
    setTimeout(function() {
        // Force all sections to be visible
        document.querySelectorAll('section').forEach(section => {
            section.style.opacity = '1';
            section.style.visibility = 'visible';
            section.style.display = 'block';
        });
        
        // Force all animated elements to be visible
        document.querySelectorAll('.animate-on-scroll, .benefit-card, .package-card, .process-step, .key-benefits, .benefits-grid').forEach(el => {
            el.classList.add('visible');
            el.style.opacity = '1';
            el.style.visibility = 'visible';
            el.style.display = 'block';
        });
    }, 500);
    
    // Get all elements with animation classes
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    
    // Function to check if an element is in viewport - only used to ADD visible class, never remove
    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.8 &&
            rect.bottom >= 0
        );
    }
    
    // Function to handle scroll events - ONLY ADDS visible class, never removes it
    function handleScroll() {
        animatedElements.forEach(element => {
            if (isInViewport(element) || true) { // Force all elements to be visible regardless of viewport
                element.classList.add('visible');
            }
        });
    }
    
    // Initial check for elements in viewport
    handleScroll();
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    
    // Typewriter effect for hero headline
    const heroHeadline = document.querySelector('.hero-headline');
    if (heroHeadline) {
        heroHeadline.classList.add('typewriter');
    }
    
    // Apply fade-in-sequence to benefits cards
    const benefitCards = document.querySelectorAll('.benefit-card');
    benefitCards.forEach((card, index) => {
        card.classList.add('animate-on-scroll', 'fade-in');
        card.style.animationDelay = `${(index + 1) * 200}ms`;
    });
    
    // Apply animations to package cards
    const packageCards = document.querySelectorAll('.package-card');
    packageCards.forEach((card, index) => {
        card.classList.add('animate-on-scroll', 'slide-up');
        card.style.animationDelay = `${(index + 1) * 200}ms`;
    });
    
    // Apply animations to process steps
    const processSteps = document.querySelectorAll('.process-step');
    processSteps.forEach((step, index) => {
        step.classList.add('animate-on-scroll');
        if (index % 2 === 0) {
            step.classList.add('slide-in-left');
        } else {
            step.classList.add('slide-in-right');
        }
        step.style.animationDelay = `${(index + 1) * 200}ms`;
    });
    
    // Pulse effect for CTA buttons
    const ctaButtons = document.querySelectorAll('.hero-cta .btn-primary, .calculator-cta .btn-primary');
    ctaButtons.forEach(button => {
        button.classList.add('pulse');
    });
    
    // Enhance scroll behavior for navigation links
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Only if it's an anchor link
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    // Add highlight animation to the target element
                    targetElement.classList.add('highlight');
                    setTimeout(() => {
                        targetElement.classList.remove('highlight');
                    }, 2000);
                    
                    // Calculate header height for offset
                    const header = document.querySelector('.header');
                    const headerHeight = header ? header.offsetHeight : 0;
                    
                    // Smooth scroll to target with offset
                    window.scrollTo({
                        top: targetElement.offsetTop - headerHeight - 20,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
});
