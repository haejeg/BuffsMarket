// Create and add CSS dynamically
const style = document.createElement('style');
style.textContent = `
  body {
    margin: 0;
    overflow: hidden;
    background: #000;
  }

  .particle {
    position: absolute;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.8);
    pointer-events: none;
    animation: explode 1s ease-out forwards;
  }

  @keyframes explode {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    100% {
      transform: scale(0.5) translate(100px, 100px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Firework effect on click
document.addEventListener('click', (e) => {
  const numParticles = 20;
  const particles = [];

  for (let i = 0; i < numParticles; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';

    const x = e.clientX;
    const y = e.clientY;

    // Random angle and distance
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * 80;

    const deltaX = Math.cos(angle) * distance;
    const deltaY = Math.sin(angle) * distance;

    // Set particle's initial position and transformation
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

    document.body.appendChild(particle);
    particles.push(particle);
  }

  // Remove particles after animation
  setTimeout(() => {
    particles.forEach((particle) => particle.remove());
  }, 1000);
});
