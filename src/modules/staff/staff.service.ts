import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async listStaff(storeId: number) {
    return this.prisma.withTenant(storeId, (client) =>
      client.staffMember.findMany({
        orderBy: { invitedAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          permissions: true,
          isActive: true,
          invitedAt: true,
          lastLoginAt: true,
        },
      }),
    );
  }

  async getStaff(storeId: number, staffId: number) {
    const staffMember = await this.prisma.withTenant(storeId, (client) =>
      client.staffMember.findUnique({
        where: { id: staffId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          permissions: true,
          isActive: true,
          invitedAt: true,
          lastLoginAt: true,
        },
      }),
    );

    if (!staffMember) {
      throw new NotFoundException('Staff member not found');
    }

    return staffMember;
  }

  async inviteStaff(
    storeId: number,
    data: { email: string; name: string; role: string; permissions?: any },
  ) {
    // Check if email already exists in tenant
    const existing = await this.prisma.withTenant(storeId, (client) =>
      client.staffMember.findUnique({ where: { email: data.email } }),
    );
    if (existing) {
      return { error: 'CONFLICT', message: 'Staff member with this email already exists' };
    }

    // Generate a random temporary password
    const tempPassword = randomBytes(16).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const staffMember = await this.prisma.withTenant(storeId, (client) =>
      client.staffMember.create({
        data: {
          email: data.email,
          name: data.name,
          role: data.role as any,
          permissions: data.permissions || {},
          passwordHash,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          permissions: true,
          isActive: true,
          invitedAt: true,
        },
      }),
    );

    return {
      staffMember,
      tempPassword, // Only shown once
    };
  }

  async updateStaff(
    storeId: number,
    staffId: number,
    data: { role?: string; permissions?: any; isActive?: boolean },
  ) {
    const existing = await this.prisma.withTenant(storeId, (client) =>
      client.staffMember.findUnique({ where: { id: staffId } }),
    );

    if (!existing) {
      throw new NotFoundException('Staff member not found');
    }

    const updateData: any = {};
    if (data.role !== undefined) updateData.role = data.role;
    if (data.permissions !== undefined) updateData.permissions = data.permissions;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return this.prisma.withTenant(storeId, (client) =>
      client.staffMember.update({
        where: { id: staffId },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          permissions: true,
          isActive: true,
          lastLoginAt: true,
        },
      }),
    );
  }

  async removeStaff(storeId: number, staffId: number) {
    const existing = await this.prisma.withTenant(storeId, (client) =>
      client.staffMember.findUnique({ where: { id: staffId } }),
    );

    if (!existing) {
      throw new NotFoundException('Staff member not found');
    }

    await this.prisma.withTenant(storeId, (client) =>
      client.staffMember.delete({ where: { id: staffId } }),
    );

    return { message: 'Staff member removed' };
  }
}
