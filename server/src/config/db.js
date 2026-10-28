import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let prisma = null;
let isPrismaConnected = false;

// System Permissions Definition
export const SYSTEM_PERMISSIONS = [
  { id: 'manage_users', label: 'Quản lý tài khoản (Thêm/Sửa/Khóa người dùng)' },
  { id: 'manage_roles', label: 'Quản lý vai trò & Phân quyền hệ thống' },
  { id: 'create_project', label: 'Tạo dự án mới' },
  { id: 'delete_project', label: 'Xóa dự án' },
  { id: 'edit_all_projects', label: 'Toàn quyền chỉnh sửa mọi dự án' },
  { id: 'manage_project_permissions', label: 'Phân quyền người dùng cho từng dự án' },
  { id: 'export_stats', label: 'Xem & Xuất báo cáo thống kê' }
];

// Default Roles
export const DEFAULT_ROLES = [
  {
    id: 'role_admin',
    name: 'admin',
    displayName: 'Quản trị viên (Admin)',
    description: 'Toàn quyền quản trị hệ thống, người dùng, vai trò và mọi dự án',
    permissions: SYSTEM_PERMISSIONS.map(p => p.id),
    isSystem: true
  },
  {
    id: 'role_manager',
    name: 'manager',
    displayName: 'Quản lý dự án (PM)',
    description: 'Tạo dự án mới và quản lý các dự án được phân quyền',
    permissions: ['create_project', 'manage_project_permissions', 'export_stats'],
    isSystem: false
  },
  {
    id: 'role_member',
    name: 'member',
    displayName: 'Thành viên (Nhân viên)',
    description: 'Thực hiện công việc và cập nhật tiến độ trong các dự án được cấp quyền',
    permissions: ['export_stats'],
    isSystem: false
  },
  {
    id: 'role_viewer',
    name: 'viewer',
    displayName: 'Người xem (Chỉ đọc)',
    description: 'Chỉ xem thông tin và tiến độ của các dự án được cấp quyền',
    permissions: [],
    isSystem: false
  }
];

// Default initial fields matching Code.gs
export const DEFAULT_FIELDS = [
  { id: 'f_cdt', label: 'Chủ đầu tư', type: 'text', unit: '', group: 'Thông tin chung', options: '', sort: 10 },
  { id: 'f_sohd', label: 'Số hợp đồng', type: 'text', unit: '', group: 'Thông tin chung', options: '', sort: 20 },
  { id: 'f_giatri', label: 'Giá trị hợp đồng', type: 'number', unit: 'VNĐ', group: 'Thông tin chung', options: '', sort: 30 },
  { id: 'f_diadiem', label: 'Địa điểm', type: 'text', unit: '', group: 'Thông tin chung', options: '', sort: 40 },
  { id: 'f_trangthai', label: 'Trạng thái dự án', type: 'select', unit: '', group: 'Thông tin chung', options: 'Chuẩn bị, Đang triển khai, Nghiệm thu, Bảo hành, Tạm dừng', sort: 50 },
  { id: 'f_cam_ptz', label: 'Camera tầm cao (PTZ)', type: 'number', unit: 'cái', group: 'Thiết bị', options: '', sort: 60 },
  { id: 'f_cam_fix', label: 'Camera cố định (fix)', type: 'number', unit: 'cái', group: 'Thiết bị', options: '', sort: 70 },
  { id: 'f_nvr', label: 'Đầu ghi (NVR)', type: 'number', unit: 'bộ', group: 'Thiết bị', options: '', sort: 80 },
  { id: 'f_switch', label: 'Switch mạng', type: 'number', unit: 'cái', group: 'Thiết bị', options: '', sort: 90 },
  { id: 'f_cap', label: 'Cáp quang / cáp mạng', type: 'number', unit: 'm', group: 'Thiết bị', options: '', sort: 100 }
];

// Fallback File Database Path (use /tmp on Vercel or serverless read-only environments)
const dataDir = process.env.VERCEL
  ? path.join('/tmp', 'data')
  : path.resolve(__dirname, '../../data');
const fallbackDbFile = path.join(dataDir, 'fallback_db.json');

// In-memory fallback in case filesystem is completely read-only or restricted
let inMemoryDb = null;

function getInitialFallbackData() {
  return {
    projects: [],
    tasks: [],
    fields: DEFAULT_FIELDS.map(f => ({
      ...f,
      deleted: false,
      updatedBy: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })),
    roles: DEFAULT_ROLES.map(r => ({
      ...r,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })),
    users: [
      {
        id: 'usr_admin',
        username: 'admin',
        email: 'admin@workmanager.local',
        password: bcrypt.hashSync('admin123', 10),
        fullName: 'Quản trị viên Hệ thống',
        unit: 'Ban Giám đốc',
        phone: '0900000000',
        roleId: 'role_admin',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    projectPermissions: []
  };
}

function ensureFallbackDb() {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(fallbackDbFile)) {
      fs.writeFileSync(fallbackDbFile, JSON.stringify(getInitialFallbackData(), null, 2), 'utf-8');
    }
  } catch (err) {
    console.warn('⚠️ File system fallback warning (using in-memory store):', err.message);
    if (!inMemoryDb) {
      inMemoryDb = getInitialFallbackData();
    }
  }
}

export function readFallbackData() {
  try {
    ensureFallbackDb();
    if (fs.existsSync(fallbackDbFile)) {
      const content = fs.readFileSync(fallbackDbFile, 'utf-8');
      const parsed = JSON.parse(content);
      if (!parsed.roles) parsed.roles = DEFAULT_ROLES;
      if (!parsed.users || !parsed.users.length) parsed.users = getInitialFallbackData().users;
      if (!parsed.projectPermissions) parsed.projectPermissions = [];
      const v8Keys = ['diary', 'ledger', 'categories', 'workers', 'labor', 'advances', 'contracts', 'devices', 'checks', 'issues', 'receipts', 'guarantees', 'groups'];
      v8Keys.forEach(k => { if (!Array.isArray(parsed[k])) parsed[k] = []; });
      return parsed;
    }
  } catch (err) {
    console.warn('⚠️ Error reading fallback db file, falling back to in-memory store:', err.message);
  }

  if (!inMemoryDb) {
    inMemoryDb = getInitialFallbackData();
  }
  return inMemoryDb;
}

export function writeFallbackData(data) {
  try {
    ensureFallbackDb();
    fs.writeFileSync(fallbackDbFile, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('⚠️ Error writing fallback db file, updating in-memory store:', err.message);
  }
  inMemoryDb = data;
}

/**
 * Tự động tạo dữ liệu khởi tạo ban đầu nếu CSDL MySQL còn trống
 */
async function seedInitialDataIfEmpty(p) {
  try {
    // 1. Roles
    const roleCount = await p.role.count();
    if (roleCount === 0) {
      console.log('🌱 Đang nạp danh sách vai trò (Roles) mặc định vào MySQL...');
      for (const r of DEFAULT_ROLES) {
        await p.role.create({
          data: {
            id: r.id,
            name: r.name,
            displayName: r.displayName,
            description: r.description,
            permissions: r.permissions,
            isSystem: r.isSystem
          }
        });
      }
      console.log('✅ Đã nạp 4 vai trò mặc định (Admin, Manager, Member, Viewer)!');
    }

    // 2. Admin User
    const userCount = await p.user.count();
    let adminUser = null;
    if (userCount === 0) {
      console.log('🌱 Đang tạo tài khoản Admin mặc định (admin / admin123)...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      adminUser = await p.user.create({
        data: {
          id: 'usr_admin',
          username: 'admin',
          email: 'admin@workmanager.local',
          password: hashedPassword,
          fullName: 'Quản trị viên Hệ thống',
          roleId: 'role_admin',
          isActive: true
        }
      });
      console.log('✅ Đã tạo tài khoản Admin mặc định: username="admin", password="admin123"!');
    } else {
      adminUser = await p.user.findUnique({ where: { username: 'admin' } });
    }

    // 3. Fields
    const fieldCount = await p.field.count();
    if (fieldCount === 0) {
      console.log('🌱 Đang khởi tạo bộ trường thông tin dự án mẫu vào MySQL...');
      for (const f of DEFAULT_FIELDS) {
        await p.field.create({
          data: {
            id: f.id,
            label: f.label,
            type: f.type,
            unit: f.unit,
            group: f.group,
            options: f.options,
            sort: f.sort,
            deleted: false,
            updatedBy: 'system'
          }
        });
      }
      console.log('✅ Đã nạp 10 trường thông tin mẫu vào MySQL!');
    }
  } catch (err) {
    console.error('Lỗi khi kiểm tra/tạo dữ liệu ban đầu trong MySQL:', err);
  }
}

let dbInitPromise = null;

export async function initDatabase() {
  if (isPrismaConnected && prisma) {
    return { isPrisma: true, prisma };
  }
  if (dbInitPromise) {
    return dbInitPromise;
  }

  dbInitPromise = (async () => {
    try {
      let dbUrl = env.databaseUrl || process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL is not set in environment');
      }

      // Giới hạn connection pool cho AlwaysData MySQL (max 3 connections) để tránh lỗi 1203 max_user_connections
      if (!dbUrl.includes('connection_limit=')) {
        const sep = dbUrl.includes('?') ? '&' : '?';
        dbUrl = `${dbUrl}${sep}connection_limit=3&pool_timeout=10`;
      }

      if (!prisma) {
        prisma = globalThis.__prismaInstance || new PrismaClient({
          datasources: {
            db: { url: dbUrl }
          }
        });
        globalThis.__prismaInstance = prisma;
      }
      await prisma.$connect();
      isPrismaConnected = true;
      console.log('✅ Kết nối MySQL thành công qua Prisma (Host: mysql-tlcserver.alwaysdata.net, DB: tlcserver_work_manager, Pool: 3)!');
      
      // Tự động kiểm tra và khởi tạo dữ liệu ban đầu nếu chưa có data
      await seedInitialDataIfEmpty(prisma);

      return { isPrisma: true, prisma };
    } catch (err) {
      isPrismaConnected = false;
      prisma = null;
      dbInitPromise = null;
      console.warn('⚠️  Không thể kết nối đến MySQL:', err.message);
      console.log('📦 Tự động kích hoạt Local Fallback Store để dự án vẫn có thể hoạt động!');
      ensureFallbackDb();
      return { isPrisma: false, prisma: null };
    }
  })();

  return dbInitPromise;
}

export function getDbStatus() {
  return {
    isMySQLConnected: isPrismaConnected,
    mode: isPrismaConnected ? 'MySQL (mysql-tlcserver.alwaysdata.net)' : 'Local Fallback Store'
  };
}

export { prisma, isPrismaConnected };
