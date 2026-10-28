import { prisma, isPrismaConnected, readFallbackData, writeFallbackData } from '../config/db.js';

export const netlabRepository = {
  async findByProjectId(projectId) {
    if (isPrismaConnected && prisma) {
      const record = await prisma.netlabTopology.findUnique({
        where: { projectId }
      });
      if (!record) return null;
      // In Prisma with MySQL, Json field might be returned as object or string
      let parsedData = record.data;
      if (typeof parsedData === 'string') {
        try {
          parsedData = JSON.parse(parsedData);
        } catch (e) {
          console.warn('Failed to parse netlab JSON string from MySQL:', e);
        }
      }
      return {
        ...record,
        data: parsedData
      };
    }

    const data = readFallbackData();
    const list = data.netlabTopologies || [];
    return list.find(x => x.projectId === projectId) || null;
  },

  async upsertByProjectId(projectId, { data, updatedBy = null }) {
    const now = new Date();

    if (isPrismaConnected && prisma) {
      const existing = await prisma.netlabTopology.findUnique({
        where: { projectId }
      });

      if (existing) {
        return await prisma.netlabTopology.update({
          where: { projectId },
          data: {
            data: data,
            updatedBy: updatedBy || existing.updatedBy,
            updatedAt: now
          }
        });
      }

      return await prisma.netlabTopology.create({
        data: {
          projectId,
          data: data,
          updatedBy,
          createdAt: now,
          updatedAt: now
        }
      });
    }

    const fallbackData = readFallbackData();
    if (!fallbackData.netlabTopologies) {
      fallbackData.netlabTopologies = [];
    }

    const idx = fallbackData.netlabTopologies.findIndex(x => x.projectId === projectId);
    let result;
    if (idx >= 0) {
      result = {
        ...fallbackData.netlabTopologies[idx],
        data,
        updatedBy: updatedBy || fallbackData.netlabTopologies[idx].updatedBy,
        updatedAt: now.toISOString()
      };
      fallbackData.netlabTopologies[idx] = result;
    } else {
      result = {
        id: `netlab_${Date.now()}`,
        projectId,
        data,
        updatedBy,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };
      fallbackData.netlabTopologies.push(result);
    }

    writeFallbackData(fallbackData);
    return result;
  },

  async deleteByProjectId(projectId) {
    if (isPrismaConnected && prisma) {
      try {
        await prisma.netlabTopology.delete({ where: { projectId } });
      } catch (e) {
        // Record might not exist, ignore
      }
      return true;
    }

    const fallbackData = readFallbackData();
    if (fallbackData.netlabTopologies) {
      fallbackData.netlabTopologies = fallbackData.netlabTopologies.filter(x => x.projectId !== projectId);
      writeFallbackData(fallbackData);
    }
    return true;
  }
};

