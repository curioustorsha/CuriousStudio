const form = document.getElementById('booking');
// en-CA formats as YYYY-MM-DD in local time; toISOString would be UTC and can be off by a day
form.date.min = new Date().toLocaleDateString('en-CA');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  alert(`Booked for ${data.guests} on ${data.date}, ${data.name}!`);
});
