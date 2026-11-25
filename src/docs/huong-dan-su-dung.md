# Hướng dẫn sử dụng hệ thống điều khiển điện phòng

## 1. Trang Sơ đồ

Trang **Sơ đồ** giúp lễ tân theo dõi trạng thái sử dụng và tình trạng cấp điện của tất cả các phòng trong khách sạn.

Mỗi phòng được hiển thị bằng một ô riêng, bao gồm số phòng và màu sắc tương ứng với trạng thái hiện tại. Các ô thống kê phía trên thể hiện số lượng phòng theo từng trạng thái.

### 1.1. Nguyên lý hoạt động của hai công tắc

Hệ thống sử dụng hai công tắc điều khiển điện:

| Công tắc | Chức năng | Khi bật | Khi tắt | Quyền điều khiển |
|---|---|---|---|---|
| **Công tắc A – Điện chính** | Cấp nguồn cho hộp thẻ từ trong phòng. | Tự động bật khi lễ tân nhận phòng trên Skyhotel; khách có thể cắm thẻ từ để sử dụng điện. | Tự động tắt khi lễ tân trả phòng trên Skyhotel. | Không điều khiển trực tiếp trên hệ thống. |
| **Công tắc B – Điện phụ** | Cấp điện cho phòng mà không cần cắm thẻ từ. | Chỉ bật được khi Công tắc A đang bật. Dùng để chuẩn bị phòng hoặc duy trì điện, điều hòa khi khách ra ngoài. | Ngắt nguồn điện phụ khi không còn nhu cầu. | Lễ tân chủ động bật hoặc tắt theo nhu cầu. |

**Trường hợp lễ tân muốn bật điện sớm để đón khách:**

Lễ tân có thể xin nhận phòng sớm trên Skyhotel theo quy định của khách sạn. Sau khi phòng được nhận và Công tắc A đã bật, lễ tân có thể bật Công tắc B để cấp điện và bật điều hòa trước khi khách đến phòng.

**Nguyên tắc:** Công tắc A được điều khiển tự động theo trạng thái nhận phòng/trả phòng trên Skyhotel. Công tắc B được lễ tân chủ động điều khiển và chỉ được bật khi Công tắc A đang bật.

### 1.2. Ý nghĩa màu sắc và trạng thái phòng

| Trạng thái | Màu sắc | Công tắc A | Công tắc B | Ý nghĩa |
|---|---|---|---|---|
| **Trống** | Xanh lá | Tắt | Tắt | Phòng chưa có khách hoặc đã trả phòng. |
| **Chờ khách** | Xanh dương | Bật | Tắt | Đã nhận phòng trên Skyhotel, chưa ghi nhận khách cắm thẻ từ. |
| **Có khách** | Đỏ | Bật | Tắt | Hệ thống ghi nhận khách đã cắm thẻ từ vào hộp thẻ từ. |
| **Bật cưỡng bức** | Vàng | Bật | Bật | Điện chính và điện phụ cùng bật, không cần thẻ từ để duy trì điện. |
| **Bảo trì** | Xám | Tắt | Bật | Phòng đang ở chế độ bảo trì theo cấu hình hệ thống. |

**Lưu ý:** Trạng thái phòng được hệ thống tự động xác định dựa trên tín hiệu sử dụng phòng và trạng thái hai công tắc. Khi các tín hiệu thay đổi, màu sắc phòng cũng thay đổi tương ứng.

### 1.3. Các tình huống chuyển trạng thái phòng

| Tình huống chuyển trạng thái | Nguyên nhân hoặc thao tác | Công tắc A | Công tắc B | Kết quả |
|---|---|---|---|---|
| **Trống** → **Chờ khách** | Lễ tân nhận phòng trên Skyhotel; khách có thể cắm thẻ từ sau đó. | Hệ thống bật | Tắt | Phòng chuyển xanh dương. |
| **Chờ khách** → **Có khách** | Khách cắm thẻ từ; hệ thống ghi nhận tín hiệu sử dụng phòng. | Bật | Tắt | Phòng chuyển đỏ. |
| **Có khách** → **Chờ khách** | Khách rút thẻ từ; hệ thống không còn ghi nhận khách sử dụng phòng. | Bật | Tắt | Phòng chuyển xanh dương. |
| **Chờ khách** → **Bật cưỡng bức** | Lễ tân bật điện phụ để chuẩn bị phòng, sau khi phòng được nhận trên Skyhotel. | Bật | Lễ tân bật | Phòng chuyển vàng. |
| **Có khách** → **Bật cưỡng bức** | Lễ tân bật điện phụ để duy trì điện khi khách ra ngoài. | Bật | Lễ tân bật | Phòng chuyển vàng. |
| **Bật cưỡng bức** → **Chờ khách** | Lễ tân tắt điện phụ; hệ thống không còn ghi nhận khách sử dụng phòng. | Bật | Lễ tân tắt | Phòng chuyển xanh dương. |
| **Bật cưỡng bức** → **Có khách** | Lễ tân tắt điện phụ; hệ thống vẫn ghi nhận khách sử dụng phòng. | Bật | Lễ tân tắt | Phòng chuyển đỏ. |
| Các trạng thái đang sử dụng → **Trống** | Khách trả phòng và lễ tân cập nhật trả phòng trên Skyhotel. | Hệ thống tắt | Ngắt điện phụ | Phòng chuyển xanh lá. |
| **Trống** → **Bảo trì** | Người có quyền quản lý thiết lập chế độ bảo trì. | Tắt | Bật theo cấu hình | Phòng chuyển xám. |

### 1.4. Hướng dẫn điều khiển Công tắc B

| Bước | Thao tác | Điều cần kiểm tra |
|---|---|---|
| 1 | Chọn đúng phòng trên trang **Sơ đồ**. | Đối chiếu số phòng trước khi thao tác. |
| 2 | Kiểm tra phòng đã được nhận trên Skyhotel. | Chỉ bật Công tắc B khi Công tắc A đang bật. |
| 3 | Chọn bật hoặc tắt Công tắc B theo nhu cầu. | Không tự ý điều khiển Công tắc A. |
| 4 | Chờ hệ thống xử lý lệnh. | Nút điều khiển hiển thị đang xử lý; nếu lỗi, trạng thái cũ được khôi phục. |
| 5 | Kiểm tra lại trạng thái phòng. | Khi không còn nhu cầu cấp điện phụ, tắt Công tắc B. |

Nếu cần bật điện trước để chuẩn bị phòng, lễ tân phải xin nhận phòng sớm theo quy định khách sạn. Khi khách trả phòng, hệ thống tự động ngắt nguồn điện phòng.

Trong quá trình gửi lệnh, nút điều khiển sẽ hiển thị trạng thái đang xử lý. Nếu thao tác thất bại, hệ thống sẽ thông báo và khôi phục trạng thái nút trước đó.

Nút **Làm mới** dùng để tải lại dữ liệu và cập nhật trạng thái phòng mới nhất.

---

## 2. Trang Lịch sử và Báo cáo

Trang **Lịch sử và Báo cáo** ghi lại các lần thay đổi trạng thái phòng, giúp lễ tân và quản lý theo dõi hoạt động của từng phòng.

| Thông tin | Ý nghĩa |
|---|---|
| **Ngày, giờ** | Thời điểm xảy ra sự kiện. |
| **Phòng** | Phòng phát sinh thay đổi. |
| **Chuyển trạng thái** | Trạng thái trước và sau khi thay đổi. |
| **Nội dung chi tiết** | Mô tả sự kiện hoặc thao tác phát sinh. |

### 2.1. Cách đọc lịch sử

| Chuyển trạng thái | Ý nghĩa |
|---|---|
| **Trống** → **Chờ khách** | Lễ tân nhận phòng trên Skyhotel; hệ thống bật điện chính. |
| **Chờ khách** → **Có khách** | Khách cắm thẻ từ vào hộp thẻ từ. |
| **Có khách** → **Chờ khách** | Khách rút thẻ từ khỏi hộp thẻ từ. |
| **Chờ khách** → **Bật cưỡng bức** | Lễ tân bật điện phụ để chuẩn bị phòng và điều hòa. |
| **Có khách** → **Bật cưỡng bức** | Lễ tân bật điện phụ để duy trì điện khi khách ra ngoài. |
| **Bật cưỡng bức** → **Chờ khách** | Lễ tân tắt điện phụ; hệ thống không còn ghi nhận khách sử dụng phòng. |
| **Bật cưỡng bức** → **Có khách** | Lễ tân tắt điện phụ; hệ thống vẫn ghi nhận khách sử dụng phòng. |
| Các trạng thái đang sử dụng → **Trống** | Lễ tân trả phòng trên Skyhotel; hệ thống ngắt điện phòng. |

### 2.2. Tìm kiếm và lọc lịch sử

| Chức năng | Cách sử dụng |
|---|---|
| **Tìm kiếm** | Tìm theo số phòng, trạng thái hoặc nội dung chi tiết. |
| **Lọc trạng thái** | Chọn trạng thái sau khi thay đổi. |
| **Ngày bắt đầu** | Chọn ngày bắt đầu tra cứu. |
| **Ngày kết thúc** | Chọn ngày kết thúc tra cứu. |
| **Số bản ghi mỗi trang** | Chọn số lượng bản ghi muốn hiển thị. |

Nhấn nút **Đặt lại** để xóa các điều kiện tìm kiếm và trở về danh sách mặc định.

### 2.3. Chuyển trang

Sử dụng các nút chuyển trang ở cuối danh sách để xem những bản ghi tiếp theo hoặc quay lại trang trước.

**Lưu ý:** Ngày bắt đầu không được sau ngày kết thúc.
