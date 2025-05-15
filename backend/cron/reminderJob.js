const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const Slot = require('../models/Slot');
const User = require('../models/User');
const sendReminderMail = require('../utils/mailer');

cron.schedule('0 0 * * *', async () => {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  try {
    const upcomingAppointments = await Appointment.find({
      status: 'booked'
    }).populate('slot patient therapist');

    for (const app of upcomingAppointments) {
      const slot = app.slot;
      const slotDateTime = new Date(`${slot.date.toISOString().split('T')[0]}T${slot.startTime}:00`);
      const diff = (slotDateTime - now) / (1000 * 60 * 60);

      if (diff >= 23.5 && diff <= 24.5) {
        const message = `
          <p>Reminder: You have a therapy session on <strong>${slot.date.toDateString()}</strong> at <strong>${slot.startTime}</strong>.</p>
        `;

        await sendReminderMail(app.patient.email, 'Session Reminder', message);
        await sendReminderMail(app.therapist.email, 'Upcoming Session Reminder', message);

        console.log(`Reminder sent to ${app.patient.email} and ${app.therapist.email}`);
      }
    }
  } catch (err) {
    console.error('Reminder job error:', err);
  }
});
