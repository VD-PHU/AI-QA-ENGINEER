# AI_WORKLOG.md

## 1. Công cụ AI đã dùng
- **Claude (Anthropic)** — dùng trực tiếp qua giao diện chat, với quyền truy cập một sandbox Linux
  (chạy bash, Node.js, Playwright) để: viết code, **tự chạy test thật**, chụp screenshot bằng chứng,
  và tự đọc log để viết bug report — không chỉ "sinh văn bản" mà còn tự kiểm chứng lại kết quả.
- Không dùng thêm ChatGPT/Cursor/Copilot cho phần lõi; toàn bộ vòng lặp
  Requirement → Test Case → Automation → Execute → Analyze → Bug Report được thực hiện trong cùng
  một phiên làm việc với Claude.

## 2. Prompt chính đã dùng (rút gọn, theo trình tự thật)
1. *"Build an AI QA Engineer... [toàn bộ đề bài]. Build the full workflow: Requirement/URL → Test
   Cases → Execute Tests → Analyze Failures → Bug Report... Minimum 15 test cases... automated with
   Playwright... bug report needs test case, expected, actual, evidence, severity, possible cause."*
   → Đây là prompt gốc, gần như copy nguyên đề bài làm requirement đầu vào cho AI.
2. Prompt tiếp theo (ngầm định qua yêu cầu môi trường): *"Chọn website/app phù hợp, giải thích lý do
   trong README."* → AI tự đề xuất phương án dùng sample app tự dựng thay vì site công khai, kèm lý do
   (xem README mục "Vì sao chọn ứng dụng này").
3. Khi người dùng yêu cầu bổ sung theo đúng luật chơi thực tế (README cấu trúc chuẩn, AI_WORKLOG,
   tính năng bonus "AI explore site and suggest tests") → AI tự bổ sung các phần còn thiếu mà không
   cần được liệt kê chi tiết từng phần, dựa trên toàn bộ nội dung luật chơi được dán vào.

## 3. AI đã giúp gì
- Diễn giải một user story mơ hồ ("register using email and password") thành bộ tiêu chí chấp nhận cụ
  thể (độ dài, độ phức tạp mật khẩu, tính duy nhất của email...) — việc một QA thật cũng phải tự suy
  ra hoặc hỏi lại PO.
- Sinh 21 test case có cấu trúc (ID, nhóm, bước, dữ liệu, kết quả mong đợi) trải đều 4 nhóm bắt buộc.
- Viết bộ Playwright tự động hoá **100%** số test case (không chỉ 1 nhóm như yêu cầu tối thiểu).
- Tự dựng một sample app có **2 lỗi thật được cài có chủ đích** để đảm bảo pipeline "phát hiện lỗi →
  viết bug report" có dữ liệu thật để chứng minh, thay vì chỉ chạy toàn PASS (không có gì để phân
  tích).
- Tự chạy test, tự đọc kết quả JSON/log, tự chụp screenshot lỗi, rồi **tự đọc lại source code ứng
  dụng** để suy ra nguyên nhân gốc rễ (root cause) thay vì chỉ mô tả triệu chứng.
- Xây thêm tính năng bonus: một "AI Explorer" tự duyệt DOM và gợi ý nên test gì dựa trên thuộc tính
  từng field (type, required, minlength/maxlength, label...).

## 4. AI đã sai ở đâu — và cách sửa
| # | AI làm sai / thiếu sót ban đầu | Cách phát hiện | Cách sửa |
|---|---|---|---|
| 1 | Bonus feature "AI Explorer" ban đầu chỉ nhận diện field email qua `type="email"`, trong khi field email thực tế trong app khai báo `type="text"` → bị bỏ sót, không sinh gợi ý test nào cho ô email. | Chạy thử explorer và đọc report thấy ô "Email address" chỉ nhận gợi ý generic-text, thiếu hẳn gợi ý về format/duplicate email — vốn là đúng chỗ có bug thật. | Sửa rule để nhận diện field email theo tín hiệu ngữ nghĩa (name/id/label/placeholder chứa "email"), không chỉ theo thuộc tính `type` — giống cách một tester thật vẫn nhận ra "đây là ô email" dù code không khai báo chuẩn. |
| 2 | Ở vòng đầu, `tee` ghi log test thất bại âm thầm vì thư mục `test-results/screenshots` chưa được tạo trước khi chạy — output console vẫn đúng nhưng file log rỗng. | Kiểm tra lại file `console-log.txt` thấy trống dù lệnh chạy "thành công" (do `tee` fail nhưng exit code của lệnh trước đó vẫn được trả về). | Tạo thư mục trước khi chạy (`mkdir -p`) và chạy lại, xác nhận `console-log.txt` có đầy đủ 21 dòng kết quả trước khi coi là hoàn tất. |
| 3 | Ban đầu chỉ định dùng public demo site (vd. demoqa.com) mà chưa kiểm tra được rằng môi trường sandbox **không có quyền truy cập mạng ra ngoài** tới các domain đó (chỉ whitelist một số domain như npm/github/pypi). | Phát hiện khi rà lại cấu hình mạng của container trước khi viết Playwright test — nếu cứ nhắm vào demoqa.com thì test sẽ không chạy được trong môi trường này. | Chuyển sang phương án dựng sample app cục bộ (`file://`), giải thích rõ lý do và đánh đổi trong README thay vì âm thầm đổi hướng. |

**Nguyên tắc kiểm chứng đã áp dụng xuyên suốt:** không tin bất kỳ kết quả PASS/FAIL nào chỉ qua log
chữ — mọi lần FAIL đều được đối chiếu bằng ảnh chụp màn hình thật, và mọi nguyên nhân gốc rễ trong
bug report đều trỏ thẳng vào dòng code cụ thể trong `app/register.html`, không suy đoán chung chung.

## 5. Nếu có thêm 7 ngày nữa, sẽ cải thiện gì
1. **Test trên site công khai thật** (vd. một site đăng ký demo có sẵn) song song với sample app, để
   chứng minh pipeline hoạt động cả trên ứng dụng không kiểm soát được mã nguồn — lúc đó phần "possible
   cause" trong bug report sẽ phải suy luận qua hành vi quan sát được thay vì đọc thẳng source code.
2. **Tích hợp gọi LLM thật** cho bước sinh test case và bước viết bug report (hiện tại bộ test case và
   bug report được chính Claude soạn trực tiếp trong phiên làm việc; bước tiếp theo là tách thành một
   pipeline gọi API độc lập, có thể tái sử dụng cho requirement khác mà không cần người ngồi chat).
3. Mở rộng "AI Explorer" (tính năng bonus) để **tự sinh luôn file test case nháp** từ kết quả khám phá
   DOM, thay vì chỉ dừng ở gợi ý dạng gạch đầu dòng.
4. Thêm test đa trình duyệt (Firefox/WebKit) và một vài test accessibility (nhãn `aria-*`, điều hướng
   bằng bàn phím) — hiện đang nằm ngoài phạm vi (xem mục Limitations trong README).
5. Dựng một dashboard web (không chỉ file Markdown) để non-technical stakeholder xem toàn bộ quy trình
   Requirement → Test case → Kết quả → Bug report trên một trang duy nhất.
