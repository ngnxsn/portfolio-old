# Deploy Telegram API bằng Vercel

## Mục tiêu
GitHub Pages tiếp tục host giao diện tĩnh.
Vercel host API `/api/send-telegram-message` để form trên web public vẫn gửi được về Telegram.

## File đã chuẩn bị
- `api/send-telegram-message.js`
- `vercel.json`
- `digital-profile-liquid.html` đã gọi API public mặc định:
  - `https://portfolio-telegram-api.vercel.app/api/send-telegram-message`

## Cách deploy nhanh

### 1) Import repo lên Vercel
- Vào https://vercel.com
- New Project
- Import repo: `ngnxsn/portfolio`

### 2) Thêm Environment Variables
Trong Project Settings > Environment Variables, tạo:

- `BOT_TOKEN` = token bot Telegram mới của anh
- `CHAT_ID` = `6724823834`

## 3) Deploy
- Deploy project
- Sau khi có domain Vercel, nếu domain khác `https://portfolio-telegram-api.vercel.app` thì sửa lại hằng số `telegramApiBase` trong `digital-profile-liquid.html`

## 4) Push lại GitHub
Sau khi sửa domain thật nếu cần, push lại repo để GitHub Pages dùng đúng API URL.

## Ghi chú
- Không đưa token vào frontend.
- Sau khi hoàn thành demo, nên revoke token cũ và tạo token mới.
