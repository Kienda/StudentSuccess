// Handle delete confirmations and submissions
document.addEventListener('DOMContentLoaded', () => {
  const deleteForms = document.querySelectorAll('.delete-form');

  deleteForms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const studentId = form.dataset.id;

      if (confirm(`Are you sure you want to delete student ${studentId}?`)) {
        try {
          const response = await fetch(form.action, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              '_method': 'DELETE'
            })
          });

          if (response.ok) {
            window.location.reload(); // Refresh the page
          } else {
            alert('Failed to delete student');
          }
        } catch (error) {
          console.error('Delete error:', error);
          alert('Error deleting student');
        }
      }
    });
  });
});