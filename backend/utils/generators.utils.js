export function generateMemberId() {
  const year = new Date().getFullYear();
  const random = String(Math.floor(Math.random() * 99999) + 1).padStart(5, '0');
  return `GYM-${year}-${random}`;
}

export function generateOrderNumber() {
  const timestamp = Date.now().toString().slice(-6);
  const random = String(Math.floor(Math.random() * 999)).padStart(3, '0');
  return `ORD-${timestamp}${random}`;
}

export function generateTransactionId() {
  return `TXN-${Date.now()}`;
}

export function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
