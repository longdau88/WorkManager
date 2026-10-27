-- WorkManager PostgreSQL Database Schema
CREATE TABLE IF NOT EXISTS "Project" (
  "id" VARCHAR(255) PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "color" VARCHAR(50) DEFAULT '#2563eb',
  "note" TEXT,
  "dueDate" VARCHAR(50),
  "info" JSONB DEFAULT '{}',
  "folders" JSONB DEFAULT '[]',
  "files" JSONB DEFAULT '[]',
  "deleted" BOOLEAN DEFAULT FALSE,
  "updatedBy" VARCHAR(255),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Task" (
  "id" VARCHAR(255) PRIMARY KEY,
  "projectId" VARCHAR(255) REFERENCES "Project"("id") ON DELETE SET NULL,
  "folderId" VARCHAR(255),
  "title" VARCHAR(500) NOT NULL,
  "note" TEXT,
  "status" VARCHAR(50) DEFAULT 'todo',
  "priority" VARCHAR(50) DEFAULT 'med',
  "progress" INT DEFAULT 0,
  "sort" INT DEFAULT 10,
  "startDate" VARCHAR(50),
  "dueDate" VARCHAR(50),
  "assignee" VARCHAR(255),
  "assigner" VARCHAR(255),
  "files" JSONB DEFAULT '[]',
  "deleted" BOOLEAN DEFAULT FALSE,
  "updatedBy" VARCHAR(255),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Member" (
  "id" VARCHAR(255) PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "fullName" VARCHAR(255),
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "unit" VARCHAR(255),
  "phone" VARCHAR(100),
  "deleted" BOOLEAN DEFAULT FALSE,
  "updatedBy" VARCHAR(255),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Field" (
  "id" VARCHAR(255) PRIMARY KEY,
  "label" VARCHAR(255) NOT NULL,
  "type" VARCHAR(50) DEFAULT 'text',
  "unit" VARCHAR(50),
  "group" VARCHAR(255) DEFAULT 'Thông tin chung',
  "options" TEXT,
  "sort" INT DEFAULT 10,
  "deleted" BOOLEAN DEFAULT FALSE,
  "updatedBy" VARCHAR(255),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial fields if empty
INSERT INTO "Field" ("id", "label", "type", "unit", "group", "options", "sort") VALUES
('f_cdt', 'Chủ đầu tư', 'text', '', 'Thông tin chung', '', 10),
('f_sohd', 'Số hợp đồng', 'text', '', 'Thông tin chung', '', 20),
('f_giatri', 'Giá trị hợp đồng', 'number', 'VNĐ', 'Thông tin chung', '', 30),
('f_diadiem', 'Địa điểm', 'text', '', 'Thông tin chung', '', 40),
('f_trangthai', 'Trạng thái dự án', 'select', '', 'Thông tin chung', 'Chuẩn bị, Đang triển khai, Nghiệm thu, Bảo hành, Tạm dừng', 50),
('f_cam_ptz', 'Camera tầm cao (PTZ)', 'number', 'cái', 'Thiết bị', '', 60),
('f_cam_fix', 'Camera cố định (fix)', 'number', 'cái', 'Thiết bị', '', 70),
('f_nvr', 'Đầu ghi (NVR)', 'number', 'bộ', 'Thiết bị', '', 80),
('f_switch', 'Switch mạng', 'number', 'cái', 'Thiết bị', '', 90),
('f_cap', 'Cáp quang / cáp mạng', 'number', 'm', 'Thiết bị', '', 100)
ON CONFLICT DO NOTHING;
