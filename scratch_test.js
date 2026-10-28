import app from './server/src/app.js';
import { netlabRepository } from './server/src/repositories/netlab.repository.js';
import http from 'http';

const PORT = 5566;
const server = http.createServer(app);

server.listen(PORT, async () => {
  console.log(`\n========================================`);
  console.log(`🧪 BẮT ĐẦU KIỂM THỬ TOÀN DIỆN HỆ THỐNG`);
  console.log(`========================================\n`);

  try {
    // TEST 1: WorkManager client serving
    console.log('Test 1: Kiểm tra serving frontend WorkManager...');
    const wmRes = await fetch(`http://localhost:${PORT}/`);
    if (wmRes.status !== 200) throw new Error(`WorkManager client returned status ${wmRes.status}`);
    const wmHtml = await wmRes.text();
    if (!wmHtml.includes('WorkManager')) throw new Error('WorkManager HTML missing title');
    console.log('  ✅ WorkManager Frontend trả về mã 200 OK.');

    // TEST 2: Netlab static app serving
    console.log('\nTest 2: Kiểm tra serving ứng dụng NetLab...');
    const netlabRes = await fetch(`http://localhost:${PORT}/netlab/`);
    if (netlabRes.status !== 200) throw new Error(`Netlab returned status ${netlabRes.status}`);
    const netlabHtml = await netlabRes.text();
    if (!netlabHtml.includes('NetLab Kho Thông Minh') || !netlabHtml.includes('bExitToWM')) {
      throw new Error('Netlab HTML missing critical integration elements');
    }
    console.log('  ✅ NetLab HTML trả về mã 200 OK và chứa đầy đủ nút "Quay lại dự án".');

    // TEST 3: Đăng nhập lấy Token
    console.log('\nTest 3: Kiểm tra API xác thực (Admin Login)...');
    const authRes = await fetch(`http://localhost:${PORT}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const authJson = await authRes.json();
    if (!authJson.data?.token) throw new Error('Login failed: ' + JSON.stringify(authJson));
    const token = authJson.data.token;
    console.log('  ✅ Đăng nhập Admin thành công, đã cấp mã JWT token.');

    // TEST 4: Danh sách dự án
    console.log('\nTest 4: Lấy danh sách dự án...');
    const projRes = await fetch(`http://localhost:${PORT}/api/projects`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const projJson = await projRes.json();
    const projects = projJson.data;
    if (!Array.isArray(projects) || projects.length === 0) throw new Error('No projects found');
    const targetProject = projects[0];
    console.log(`  ✅ Lấy được ${projects.length} dự án. Chọn dự án thử nghiệm: "${targetProject.name}" (ID: ${targetProject.id}).`);

    // TEST 5: GET /api/netlab/:projectId (Chưa có sơ đồ hoặc đã có sơ đồ)
    console.log('\nTest 5: Kiểm tra API GET /api/netlab/:projectId...');
    const getRes = await fetch(`http://localhost:${PORT}/api/netlab/${targetProject.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (getRes.status !== 200) throw new Error(`GET /api/netlab returned ${getRes.status}`);
    const getJson = await getRes.json();
    if (getJson.status !== 'success' || !getJson.data) throw new Error('GET response format invalid');
    console.log(`  ✅ GET /api/netlab thành công: exists = ${getJson.data.exists}, projectName = "${getJson.data.projectName}".`);

    // TEST 6: PUT /api/netlab/:projectId (Lưu sơ đồ mới)
    console.log('\nTest 6: Kiểm tra API PUT /api/netlab/:projectId (Lưu sơ đồ mạng)...');
    const testDiagram = {
      format: 'NetLab',
      version: '2.0',
      title: `Sơ đồ tích hợp - ${targetProject.name}`,
      savedAt: new Date().toISOString(),
      devices: [
        { id: 'd_r1', type: 'router', name: 'R-GATEWAY', x: 200, y: 100, ifaces: [] },
        { id: 'd_sw1', type: 'l3switch', name: 'CORE-SW', x: 200, y: 250, ifaces: [] },
        { id: 'd_plc1', type: 'plc', name: 'PLC-KHO-01', x: 450, y: 250, ifaces: [] }
      ],
      links: [
        { id: 'l_1', a: ['d_r1', 'Gi0/0'], b: ['d_sw1', 'Gi1/0/1'], type: 'copper' },
        { id: 'l_2', a: ['d_sw1', 'Gi1/0/2'], b: ['d_plc1', 'Eth0'], type: 'copper' }
      ],
      zones: [
        { id: 'z_1', name: 'Phòng Máy Chủ', x: 150, y: 50, w: 200, h: 300, color: '#0b5ea8' }
      ],
      texts: [],
      view: { x: 50, y: 30, k: 1 }
    };

    const putRes = await fetch(`http://localhost:${PORT}/api/netlab/${targetProject.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ data: testDiagram })
    });
    if (putRes.status !== 200) throw new Error(`PUT /api/netlab failed with status ${putRes.status}`);
    const putJson = await putRes.json();
    if (putJson.status !== 'success' || !putJson.data?.success) {
      throw new Error('PUT returned error: ' + JSON.stringify(putJson));
    }
    console.log('  ✅ PUT /api/netlab lưu thành công vào cơ sở dữ liệu!');

    // TEST 7: Kiểm tra lại dữ liệu vừa lưu từ DB
    console.log('\nTest 7: Kiểm tra tính nhất quán dữ liệu đọc lại từ DB...');
    const verifyRes = await fetch(`http://localhost:${PORT}/api/netlab/${targetProject.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const verifyJson = await verifyRes.json();
    const loadedData = verifyJson.data?.data;
    if (!verifyJson.data?.exists || !loadedData) throw new Error('Data does not exist after save');
    if (loadedData.devices.length !== 3 || loadedData.links.length !== 2) {
      throw new Error(`Data mismatch: expected 3 devs and 2 links, got ${loadedData.devices.length} devs and ${loadedData.links.length} links`);
    }
    console.log(`  ✅ Đọc lại chính xác: ${loadedData.devices.length} thiết bị, ${loadedData.links.length} kết nối cáp, ${loadedData.zones.length} phân vùng.`);

    // TEST 8: Kiểm tra xử lý lỗi bảo mật & dữ liệu sai
    console.log('\nTest 8: Kiểm tra xử lý ngoại lệ (Unauthorized, Not Found, Bad Request)...');
    // a. Không có Token
    const unauthRes = await fetch(`http://localhost:${PORT}/api/netlab/${targetProject.id}`);
    if (unauthRes.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${unauthRes.status}`);
    console.log('  ✅ 401 Unauthorized khi không gửi Token.');

    // b. Dự án không tồn tại
    const notFoundRes = await fetch(`http://localhost:${PORT}/api/netlab/non_existent_project_12345`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (notFoundRes.status !== 404) throw new Error(`Expected 404 Not Found, got ${notFoundRes.status}`);
    console.log('  ✅ 404 Not Found khi dự án không tồn tại.');

    // c. Dữ liệu PUT không hợp lệ
    const badReqRes = await fetch(`http://localhost:${PORT}/api/netlab/${targetProject.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ data: 'invalid_string_not_object' })
    });
    if (badReqRes.status !== 400) throw new Error(`Expected 400 Bad Request, got ${badReqRes.status}`);
    console.log('  ✅ 400 Bad Request khi truyền dữ liệu sai cấu trúc.');

    console.log(`\n========================================`);
    console.log(`🎉 TẤT CẢ 8 BƯỚC KIỂM THỬ ĐỀU ĐẠT 100%!`);
    console.log(`========================================\n`);
  } catch (err) {
    console.error('\n❌ KIỂM THỬ THẤT BẠI:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    process.exit(process.exitCode || 0);
  }
});

