const mongoose = require('mongoose');

const SupportTicketSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
  },
  contentTitle: {
    type: String,
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('SupportTicket', SupportTicketSchema);
