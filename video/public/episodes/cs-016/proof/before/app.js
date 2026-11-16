// No booking in the past: earliest pickable day is today (local time).
const now = new Date();
const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
document.querySelector('input[name="date"]').min = today;

document.getElementById('booking').addEventListener('submit', (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  alert(`Booked for ${data.guests} on ${data.date}, ${data.name}!`);
});
