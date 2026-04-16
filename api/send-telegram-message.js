module.exports = async (req, res) => {
  const origin = req.headers.origin || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Max-Age', '86400')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }

  try {
    const { name, message } = req.body || {}
    const safeName = String(name || 'Ẩn danh').trim() || 'Ẩn danh'
    const safeMessage = String(message || '').trim()

    if (!safeMessage) {
      res.status(400).json({ ok: false, error: 'Nội dung lời nhắn đang trống.' })
      return
    }

    const BOT_TOKEN = process.env.BOT_TOKEN
    const CHAT_ID = process.env.CHAT_ID

    if (!BOT_TOKEN || !CHAT_ID) {
      res.status(500).json({ ok: false, error: 'Server chưa cấu hình BOT_TOKEN hoặc CHAT_ID.' })
      return
    }

    const text = [
      '📩 Tin nhắn mới từ Digital Profile',
      '',
      `👤 Tên: ${safeName}`,
      `💬 Nội dung: ${safeMessage}`,
    ].join('\n')

    const telegramResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
      }),
    })

    const data = await telegramResponse.json()

    if (!telegramResponse.ok || !data.ok) {
      res.status(500).json({ ok: false, error: data.description || 'Telegram API lỗi.' })
      return
    }

    res.status(200).json({ ok: true, message: 'Đã gửi lời nhắn tới Telegram.' })
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message || 'Lỗi server.' })
  }
}
