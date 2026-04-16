const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, 'telegram.env');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, 'utf8');
  return Object.fromEntries(
    raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      })
  );
}

const fileEnv = loadEnvFile(envPath);
const BOT_TOKEN = process.env.BOT_TOKEN || fileEnv.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID || fileEnv.CHAT_ID;

function isTelegramConfigured() {
  return Boolean(BOT_TOKEN && CHAT_ID);
}

async function sendTelegramMessage({ name, message }) {
  if (!isTelegramConfigured()) {
    throw new Error('Telegram chưa được cấu hình. Hãy tạo file telegram.env với BOT_TOKEN và CHAT_ID.');
  }

  const safeName = String(name || 'Ẩn danh').trim() || 'Ẩn danh';
  const safeMessage = String(message || '').trim();
  if (!safeMessage) throw new Error('Nội dung lời nhắn đang trống.');

  const text = [
    '📩 Tin nhắn mới từ Digital Profile',
    '',
    `👤 Tên: ${safeName}`,
    `💬 Nội dung: ${safeMessage}`,
  ].join('\n');

  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.description || 'Telegram API trả về lỗi không xác định.');
  }

  return data;
}

module.exports = {
  isTelegramConfigured,
  sendTelegramMessage,
};
