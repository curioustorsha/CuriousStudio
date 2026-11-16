document.getElementById('booking').addEventListener('submit', (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  alert(`Booked for ${data.guests}, ${data.name}!`);
});
