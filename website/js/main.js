document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    const headerCta = document.querySelector('.header-cta');
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            mainNav.classList.toggle('active');
            headerCta.classList.toggle('active');
        });
    }
    
    // Header Scroll Effect
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
    
    // FAQ Accordion
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    
    accordionHeaders.forEach(header => {
        header.addEventListener('click', function() {
            // Toggle active class on the header
            this.classList.toggle('active');
            
            // Toggle active class on the content
            const content = this.nextElementSibling;
            content.classList.toggle('active');
            
            // Close other open accordions
            accordionHeaders.forEach(otherHeader => {
                if (otherHeader !== this) {
                    otherHeader.classList.remove('active');
                    otherHeader.nextElementSibling.classList.remove('active');
                }
            });
        });
    });
    
    // Testimonial Slider
    const testimonialDots = document.querySelectorAll('.testimonial-dots .dot');
    const nextTestimonial = document.querySelector('.next-testimonial');
    const prevTestimonial = document.querySelector('.prev-testimonial');
    let currentTestimonial = 0;
    
    // Function to show a specific testimonial
    function showTestimonial(index) {
        // Hide all testimonials
        const testimonials = document.querySelectorAll('.testimonial-slide');
        testimonials.forEach(testimonial => {
            testimonial.style.display = 'none';
        });
        
        // Show the selected testimonial
        if (testimonials[index]) {
            testimonials[index].style.display = 'block';
        }
        
        // Update dots
        testimonialDots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
        
        // Update current testimonial index
        currentTestimonial = index;
    }
    
    // Initialize the first testimonial
    showTestimonial(0);
    
    // Add event listeners to dots
    testimonialDots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showTestimonial(index);
        });
    });
    
    // Add event listeners to next/prev buttons
    if (nextTestimonial) {
        nextTestimonial.addEventListener('click', () => {
            const testimonials = document.querySelectorAll('.testimonial-slide');
            let nextIndex = currentTestimonial + 1;
            if (nextIndex >= testimonials.length) {
                nextIndex = 0;
            }
            showTestimonial(nextIndex);
        });
    }
    
    if (prevTestimonial) {
        prevTestimonial.addEventListener('click', () => {
            const testimonials = document.querySelectorAll('.testimonial-slide');
            let prevIndex = currentTestimonial - 1;
            if (prevIndex < 0) {
                prevIndex = testimonials.length - 1;
            }
            showTestimonial(prevIndex);
        });
    }
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Close mobile menu if open
                if (mobileMenuToggle && mobileMenuToggle.classList.contains('active')) {
                    mobileMenuToggle.click();
                }
                
                // Calculate header height for offset
                const headerHeight = header.offsetHeight;
                
                // Scroll to target with offset for fixed header
                window.scrollTo({
                    top: targetElement.offsetTop - headerHeight,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Form Submission Handler
    const bookingForm = document.getElementById('booking-form');
    
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Collect form data
            const formData = new FormData(this);
            const formDataObject = {};
            
            formData.forEach((value, key) => {
                formDataObject[key] = value;
            });
            
            // Add source information
            formDataObject.source = 'Website';
            
            // Show loading state
            const submitButton = this.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            submitButton.textContent = 'Processing...';
            submitButton.disabled = true;
            
            // Send data to our backend API
            fetch('/api/consultations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formDataObject),
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Reset form
                    bookingForm.reset();
                    
                    // Show success message
                    const successMessage = document.createElement('div');
                    successMessage.className = 'form-success-message';
                    successMessage.innerHTML = '<i class="fas fa-check-circle"></i> Consultation request received! We\'ll contact you within 24 hours to confirm your appointment.';
                    
                    // Insert message before the form
                    bookingForm.parentNode.insertBefore(successMessage, bookingForm);
                    
                    // Hide the form
                    bookingForm.style.display = 'none';
                    
                    // Scroll to success message
                    successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    throw new Error('Submission failed');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                
                // Show error message
                alert('There was an error submitting your request. Please try again or contact us directly.');
            })
            .finally(() => {
                // Reset button
                submitButton.textContent = originalButtonText;
                submitButton.disabled = false;
            });
        });
    }
});
