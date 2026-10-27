/* ===================================================================
   APP CONFIGURATION & CONSTANTS
   =================================================================== */

export const CONFIG = {
  API_BASE_URL: '/api',
  WARN_DAYS: 3,
  AUTO_SYNC_MS: 30000,
  MAX_UPLOAD_BYTES: 20 * 1024 * 1024, // 20 MB
  DEFAULT_COLOR: '#2563eb',
  COLORS: [
    '#2563eb', // Blue
    '#10b981', // Green
    '#ef4444', // Red
    '#f59e0b', // Amber
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
    '#ec4899', // Pink
    '#64748b'  // Slate
  ],
  PRIORITY_WEIGHTS: { high: 0, med: 1, low: 2 },
  FIELD_TYPES: [
    ['text', 'Văn bản'],
    ['number', 'Số'],
    ['date', 'Ngày'],
    ['select', 'Lựa chọn']
  ],
  FILTERS: [
    ['all', 'Tất cả'],
    ['mine', 'Việc của tôi'],
    ['doing', 'Đang làm'],
    ['soon', 'Sắp hạn'],
    ['overdue', 'Quá hạn'],
    ['done', 'Hoàn thành']
  ],
  TEMPLATES: {
    basic: {
      name: 'Cơ bản – 5 hạng mục',
      folders: [
        ['Hồ sơ', []],
        ['Hàng hóa', []],
        ['Triển khai lắp đặt', []],
        ['Hướng dẫn bàn giao', []],
        ['Bảo trì', []]
      ]
    },
    integ: {
      name: 'Tích hợp hệ thống / camera giám sát – 10 hạng mục',
      folders: [
        ['Khảo sát & thiết kế', ['Khảo sát hiện trạng, vị trí lắp đặt', 'Lập bản vẽ thiết kế, sơ đồ hệ thống', 'Lập dự toán, bảng khối lượng']],
        ['Hồ sơ pháp lý – hợp đồng', ['Hồ sơ mời thầu / đề xuất kỹ thuật', 'Ký kết hợp đồng', 'Bảo lãnh thực hiện hợp đồng', 'Hồ sơ tạm ứng']],
        ['Hàng hóa', ['Đặt hàng nhà cung cấp', 'Theo dõi tiến độ giao hàng', 'Thu thập CO, CQ, packing list', 'Kiểm tra nhập kho, lập danh sách serial/MAC']],
        ['Thi công hạ tầng', ['Thi công tuyến ống, máng cáp', 'Kéo cáp quang, cáp mạng, cáp nguồn', 'Lắp tủ rack, cột, giá đỡ']],
        ['Lắp đặt thiết bị', ['Lắp camera, đầu ghi, switch', 'Đấu nối, hàn quang, bấm đầu']],
        ['Cấu hình & chạy thử', ['Cấu hình IP, VLAN, đầu ghi', 'Cài đặt phần mềm quản lý', 'Chạy thử, hiệu chỉnh góc quan sát']],
        ['Nghiệm thu', ['Đo kiểm, biên bản chạy thử', 'Nghiệm thu khối lượng', 'Nghiệm thu hoàn thành, đưa vào sử dụng']],
        ['Đào tạo & bàn giao', ['Hướng dẫn vận hành, sử dụng', 'Bàn giao tài liệu, bản vẽ hoàn công', 'Bàn giao tài khoản quản trị']],
        ['Thanh quyết toán', ['Hồ sơ thanh toán', 'Quyết toán hợp đồng', 'Thanh lý hợp đồng']],
        ['Bảo hành – bảo trì', ['Lập lịch bảo trì định kỳ', 'Xử lý sự cố bảo hành', 'Giải tỏa bảo lãnh bảo hành']]
      ]
    },
    supply: {
      name: 'Cung cấp hàng hóa (không lắp đặt) – 6 hạng mục',
      folders: [
        ['Hồ sơ – hợp đồng', ['Báo giá / hồ sơ dự thầu', 'Ký kết hợp đồng']],
        ['Đặt hàng', ['Đặt hàng nhà cung cấp', 'Thanh toán đặt cọc NCC']],
        ['Giao nhận hàng', ['Theo dõi vận chuyển', 'Kiểm đếm, đối chiếu serial', 'Biên bản giao nhận']],
        ['Chứng từ', ['CO, CQ, hóa đơn', 'Hồ sơ chất lượng']],
        ['Thanh toán', ['Hồ sơ thanh toán', 'Thanh lý hợp đồng']],
        ['Bảo hành', ['Theo dõi bảo hành']]
      ]
    }
  }
};
