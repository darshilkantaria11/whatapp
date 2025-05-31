// Temporary in-memory message store (not for production)
export const messagesDB = {}; // { phone: [{ content, direction, timestamp }] }

export function addMessage(phone, messageObj) {
  if (!messagesDB[phone]) messagesDB[phone] = [];
  messagesDB[phone].push(messageObj);
}

export function getAllMessages() {
  return messagesDB;
}

export function getMessagesFor(phone) {
  return messagesDB[phone] || [];
}
