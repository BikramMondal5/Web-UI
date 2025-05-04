// Add scroll effect to navbar
window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.navbar');
  if (window.scrollY > 50) {
    navbar.style.padding = '10px 20px';
    navbar.style.background = 'rgba(255, 255, 255, 0.15)';
  } else {
    navbar.style.padding = '15px 30px';
    navbar.style.background = 'rgba(255, 255, 255, 0.1)';
  }
});

// Make search bar interactive
const searchInput = document.querySelector('.search-bar input');
searchInput.addEventListener('focus', () => {
  searchInput.parentElement.style.transform = 'scale(1.03)';
});

searchInput.addEventListener('blur', () => {
  searchInput.parentElement.style.transform = 'scale(1)';
});

// Profile dropdown functionality
const profileBadge = document.getElementById('profileBadge');
const profileDropdown = document.getElementById('profileDropdown');

profileBadge.addEventListener('click', (e) => {
  e.stopPropagation();
  profileDropdown.classList.toggle('active');
});

// Close dropdown when clicking elsewhere
document.addEventListener('click', (e) => {
  if (!profileBadge.contains(e.target) && !profileDropdown.contains(e.target)) {
    profileDropdown.classList.remove('active');
  }
});

// Prevent dropdown from closing when clicking inside it
profileDropdown.addEventListener('click', (e) => {
  e.stopPropagation();
});