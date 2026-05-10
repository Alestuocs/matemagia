// src/lib/utils.js — shared sanitization utilities

export const sanitize = {
  email: (v) => (v || '').trim().toLowerCase().replace(/[<>'"]/g, '').slice(0, 254),
  name: (v) => (v || '').trim().replace(/<[^>]*>/g, '').slice(0, 50),
  code: (v) => (v || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 7),
  text: (v) => (v || '').trim().replace(/<[^>]*>/g, '').slice(0, 500),
}
