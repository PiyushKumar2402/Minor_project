// Text used on the home page. Edit freely.

export const ABOUT = [
  "MediQueue is an appointment-first clinic. Choose a doctor, pick a time that suits you, and follow your place in the queue from your phone, so your time goes to the doctor and not to the waiting room.",
  "Every visit is simple to manage: you get a confirmation and a reminder by email, you can reschedule or cancel before you check in, and each doctor sees their whole day at a glance.",
];

// Sample reviews are shown ONLY while there are fewer than MIN_REAL_REVIEWS real ones.
// A small note under the heading says so. Set SHOW_SAMPLE_REVIEWS to false to turn them off.
export const SHOW_SAMPLE_REVIEWS = true;
export const MIN_REAL_REVIEWS = 4;
export const SAMPLE_REVIEWS = [
  ["Priya S.", 5, "Booked in two minutes and knew my turn before leaving home. No crowded waiting room at all."],
  ["Amit R.", 5, "The reminder email the day before was a lifesaver. The video visit worked on the first try."],
  ["Neha K.", 4, "Clear queue number and the doctor was on time. Rescheduling was easy when work came up."],
  ["Vikram P.", 5, "Simple and quick. I loved seeing how many people were ahead of me before I left."],
  ["Sana M.", 5, "Very polite staff and a clean process. I got the confirmation email immediately."],
  ["Rohit D.", 4, "Good experience overall. Choosing the time slot myself made planning my day much easier."],
  ["Anjali T.", 5, "My mother and I found it easy to use. The doctor explained everything patiently."],
  ["Karan J.", 5, "No phone calls, no waiting in line. Exactly what a clinic booking should be."],
  ["Meera B.", 4, "Helpful reminders and an easy cancel option. Would recommend to friends and family."],
  ["Faisal A.", 5, "The live queue page is brilliant. I arrived just in time for my turn."],
].map(([patientName, rating, comment], i) => ({ _id: `sample${i}`, patientName, rating, comment, doctorName: "" }));

export const FAQS = [
  ["How do I book an appointment?", "Create a free patient account, choose a doctor, pick a day and a time slot, and press \"Book your slot\". A confirmation email arrives straight away."],
  ["Can I book more than one appointment on the same day?", "No. To keep the queue fair, a patient can hold one appointment per day. You can cancel or reschedule it and choose a different time."],
  ["Can I cancel or reschedule?", "Yes. Open My appointments and use Reschedule or Cancel. This works until you check in on the day, and the slot is released for others."],
  ["How does the live queue work?", "On the day, open Track queue and press \"I've arrived\". You see which number is being served and how many patients are ahead of you, updated every few seconds."],
  ["Do you offer online consultations?", "Yes. Choose \"Online (Zoom)\" when booking. The joining link is emailed to you and also shown in My appointments."],
  ["Will I get reminders?", "Yes. We send a confirmation when you book, cancel or reschedule, and a reminder the day before your appointment."],
  ["Can I leave a review?", "Yes. Once your visit is marked completed, you can rate it from My appointments."],
];
