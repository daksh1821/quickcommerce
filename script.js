const images = document.querySelectorAll('.slider-image');
let currentIndex = 0;

function showNextImage() {
    images[currentIndex].style.opacity = 0;
    currentIndex = (currentIndex + 1) % images.length;
    images[currentIndex].style.opacity = 1;
}

setInterval(showNextImage, 1000); // Change image every 4 seconds
// Select all product cards to add click event listeners
document.querySelectorAll('.product-card a').forEach((card) => {
    card.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default link behavior for custom handling
        const link = event.currentTarget.getAttribute('href'); // Get the link URL

        // Optional: Custom transition or animation before navigating
        // Example: Adding a fade-out effect before navigating
        document.body.classList.add('fade-out');

        setTimeout(() => {
            window.location.href = link; // Navigate to the link
        }, 300); // Adjust the delay for transition timing
    });
});

// Function to handle the fade-out effect, if used
document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.remove('fade-out');
});

// Smooth scroll setup for the product grid if overflowed horizontally
const productGrid = document.querySelector('.product-grid');
if (productGrid) {
    productGrid.addEventListener('wheel', (e) => {
        e.preventDefault();
        productGrid.scrollBy({
            left: e.deltaY < 0 ? -30 : 30,
            behavior: 'smooth'
        });
    });
}
