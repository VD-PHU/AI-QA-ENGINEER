## 1. Vấn đề

Khi nhận một requirement, QA thường phải tự nghĩ ra các trường hợp cần test, viết test case, chạy lại
mỗi lần code đổi, rồi viết bug report cho từng lỗi. Việc này lặp đi lặp lại và tốn thời gian, nhưng
cũng dễ sót các trường hợp biên. Mình muốn xem AI giúp được đến đâu, với điều kiện kết quả của AI
phải được chạy thử thật, không chỉ đọc thấy hợp lý.

## 2. Giải pháp

Với user story "As a user, I can register using email and password", luồng làm việc như sau:

1. Nhờ Claude sinh test case thành 4 nhóm: Positive, Negative, Boundary, Validation (được 21 case).
2. Viết 21 case đó thành test tự động bằng Playwright, chạy trên Chromium.
3. Test nào FAIL thì tự chụp ảnh màn hình lưu làm bằng chứng.
4. Từ kết quả FAIL, tạo bug report gồm: test case, expected, actual, evidence, severity gợi ý, possible cause.
5. Có thêm một trang web nhỏ (`node server.js`) để nhập requirement, xem test case, bấm chạy test và xem bug report ngay trên trình duyệt.

Bonus: `tools/ai-explorer.js` mở một trang bằng trình duyệt, đọc các ô nhập và nút bấm, rồi gợi ý nên test
những gì (ví dụ thấy ô mật khẩu thì gợi ý test độ dài tối thiểu, tối đa).

### Trang web thử nghiệm

Mình test một form đăng ký tự dựng (`app/register.html`) gồm ô Email, Password, Confirm password và nút
Create account. Form này do AI viết theo yêu cầu của mình, không phải web công khai.

Lý do chọn:
- Khớp thẳng với user story, không có chức năng thừa.
- Mình tự đặt spec nên biết chính xác kết quả đúng là gì: email hợp lệ và không trùng; mật khẩu 8-64 ký
  tự có chữ hoa, chữ thường, số, ký tự đặc biệt; xác nhận mật khẩu phải khớp.
- Dữ liệu cố định, nên test "email đã tồn tại" chạy lại lần nào cũng cho cùng kết quả. Trang demo công
  khai thì nhiều người dùng chung, dữ liệu thay đổi.
- Trong form có 2 lỗi cài sẵn (chi tiết ở mục 5), để phần phân tích lỗi và bug report có lỗi thật mà làm.
- Chỉ là một file HTML nên ai cũng chạy lại được.

Phần đã test: kiểm tra từng ô (bắt buộc, định dạng email, độ phức tạp mật khẩu, xác nhận mật khẩu), giá
trị biên (mật khẩu 7/8/64/65 ký tự, email 254 ký tự), luật email trùng, và hành vi giao diện (ẩn mật
khẩu, khoá nút khi đang gửi, xoá form sau khi đăng ký xong).

Không test: trình duyệt khác Chromium, backend thật, accessibility, hiệu năng.

## 3. Luồng hoạt động

```
Requirement -> Test case (Claude sinh) -> tests/register.spec.js (Playwright)
            -> test-results/ (log, JSON, ảnh) -> bug report cho test FAIL
```

Các file chính:
- `app/register.html`: ứng dụng cần test
- `docs/test-strategy.md`: chiến lược test
- `test-cases/test-cases.md`: 21 test case
- `tests/register.spec.js`: test tự động
- `test-results/`: kết quả, log, ảnh bằng chứng
- `bug-reports/`: bug report viết cho từng lỗi
- `server.js` và `public/`: trang web chạy test
- `tools/ai-explorer.js`: tính năng bonus
- `AI_WORKLOG.md`: ghi lại cách mình dùng AI

## 4. Cách mình dùng AI

Mình dùng Claude để: diễn giải user story thành các quy tắc cụ thể, sinh test case, viết app mẫu,
viết code Playwright và viết bản nháp bug report. Chi tiết prompt, chỗ AI làm chưa đúng và cách xử lý nằm
trong `AI_WORKLOG.md`.

Phần mình tự làm: chạy lại toàn bộ trên máy mình, đọc code để kiểm tra nguyên nhân lỗi AI nêu ra có đúng
không, và tự sửa lỗi TC-13 rồi chạy lại để xác nhận.

## 5. Kết quả

Lần chạy đầu: 19/21 PASS, 2 FAIL.
- TC-09 (đăng ký bằng email đã tồn tại): form vẫn báo thành công. Nguyên nhân: đoạn kiểm tra email
  trùng trong code bị comment out.
- TC-13 (mật khẩu đúng 8 ký tự): bị từ chối dù spec cho phép. Nguyên nhân: điều kiện viết `<= 8`
  thay vì `< 8`.

Sau khi mình sửa TC-13 và chạy lại thì TC-13 PASS, còn 20/21. TC-09 mình để nguyên và đã có bug report,
vì đây là lỗi cần báo cho dev chứ không phải lúc nào cũng nên tự vá.

Bằng chứng: `test-results/screenshots/` (TC-09.png, TC-13.png), `test-results/console-log.txt`,
`test-results/results.json`, `test-results/summary.md`.

## 6. Hạn chế

- Nút "Sinh test case" trên web hiện chưa gọi AI thật. Nó hiển thị bộ 21 case đã soạn sẵn với Claude
  cho requirement đăng ký. Ô nhập requirement chưa ảnh hưởng đến kết quả.
- Bug report trên web được tạo bằng quy tắc cố định: đọc kết quả test và tìm dòng liên quan trong
  `register.html` để gợi ý nguyên nhân. Nó chưa dùng mô hình AI.
- AI Explorer cũng dùng quy tắc viết sẵn, chưa dùng mô hình AI.
- Ứng dụng test là do mình dựng nên chưa thử trên một sản phẩm thật không có mã nguồn.
- Chỉ test trên Chromium, chưa có accessibility và performance.

Nếu có thêm 7 ngày, mình sẽ nối vào API của một mô hình ngôn ngữ để sinh test case và bug report từ
requirement bất kỳ, rồi thử trên một trang đăng ký công khai.

## 7. Cách chạy

Cần cài Node.js. Trong thư mục dự án:

```
npm install playwright
npx playwright install chromium

node tests/register.spec.js     # chạy 21 test, in kết quả ra màn hình
node server.js                  # mở http://localhost:3000 để dùng bản web
node tools/ai-explorer.js       # chạy tính năng bonus
```