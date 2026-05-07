import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateCustomerDto, CreateAddressDto, UpdateAddressDto } from './dto/customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async getMe(storeId: number, customerId: number) {
    const customer = await this.prisma.withTenant(storeId, (client) =>
      client.customer.findUnique({
        where: { id: customerId },
      }),
    );

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return this.sanitizeCustomer(customer);
  }

  async updateMe(storeId: number, customerId: number, dto: UpdateCustomerDto) {
    const customer = await this.prisma.withTenant(storeId, (client) =>
      client.customer.findUnique({
        where: { id: customerId },
      }),
    );

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const updateData: any = {};
    if (dto.first_name !== undefined) updateData.firstName = dto.first_name;
    if (dto.last_name !== undefined) updateData.lastName = dto.last_name;
    if (dto.phone !== undefined) updateData.phone = dto.phone;

    const updated = await this.prisma.withTenant(storeId, (client) =>
      client.customer.update({
        where: { id: customerId },
        data: updateData,
      }),
    );

    return this.sanitizeCustomer(updated);
  }

  async listAddresses(storeId: number, customerId: number) {
    return this.prisma.withTenant(storeId, (client) =>
      client.address.findMany({
        where: { customerId },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      }),
    );
  }

  async createAddress(storeId: number, customerId: number, dto: CreateAddressDto) {
    const data: any = {
      customerId,
      fullName: dto.full_name,
      phone: dto.phone,
      addressLine1: dto.address_line1,
      city: dto.city,
    };
    if (dto.label !== undefined) data.label = dto.label;
    if (dto.address_line2 !== undefined) data.addressLine2 = dto.address_line2;
    if (dto.region !== undefined) data.region = dto.region;
    if (dto.postal_code !== undefined) data.postalCode = dto.postal_code;
    if (dto.latitude !== undefined) data.latitude = dto.latitude;
    if (dto.longitude !== undefined) data.longitude = dto.longitude;
    if (dto.is_default) {
      await this.clearDefaultAddress(storeId, customerId);
      data.isDefault = true;
    }

    return this.prisma.withTenant(storeId, (client) => client.address.create({ data }));
  }

  async updateAddress(
    storeId: number,
    customerId: number,
    addressId: number,
    dto: UpdateAddressDto,
  ) {
    const address = await this.prisma.withTenant(storeId, (client) =>
      client.address.findFirst({
        where: { id: addressId, customerId },
      }),
    );

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    const updateData: any = {};
    if (dto.label !== undefined) updateData.label = dto.label;
    if (dto.full_name !== undefined) updateData.fullName = dto.full_name;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.address_line1 !== undefined) updateData.addressLine1 = dto.address_line1;
    if (dto.address_line2 !== undefined) updateData.addressLine2 = dto.address_line2;
    if (dto.city !== undefined) updateData.city = dto.city;
    if (dto.region !== undefined) updateData.region = dto.region;
    if (dto.postal_code !== undefined) updateData.postalCode = dto.postal_code;
    if (dto.latitude !== undefined) updateData.latitude = dto.latitude;
    if (dto.longitude !== undefined) updateData.longitude = dto.longitude;
    if (dto.is_default !== undefined) {
      if (dto.is_default) {
        await this.clearDefaultAddress(storeId, customerId);
      }
      updateData.isDefault = dto.is_default;
    }

    return this.prisma.withTenant(storeId, (client) =>
      client.address.update({
        where: { id: addressId },
        data: updateData,
      }),
    );
  }

  async deleteAddress(storeId: number, customerId: number, addressId: number) {
    const address = await this.prisma.withTenant(storeId, (client) =>
      client.address.findFirst({
        where: { id: addressId, customerId },
      }),
    );

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    await this.prisma.withTenant(storeId, (client) =>
      client.address.delete({
        where: { id: addressId },
      }),
    );

    return { message: 'Address deleted' };
  }

  async setDefaultAddress(storeId: number, customerId: number, addressId: number) {
    const address = await this.prisma.withTenant(storeId, (client) =>
      client.address.findFirst({
        where: { id: addressId, customerId },
      }),
    );

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    await this.clearDefaultAddress(storeId, customerId);

    await this.prisma.withTenant(storeId, (client) =>
      client.address.update({
        where: { id: addressId },
        data: { isDefault: true },
      }),
    );

    return this.prisma.withTenant(storeId, (client) =>
      client.address.findFirst({
        where: { id: addressId },
      }),
    );
  }

  private async clearDefaultAddress(storeId: number, customerId: number) {
    await this.prisma.withTenant(storeId, (client) =>
      client.address.updateMany({
        where: { customerId, isDefault: true },
        data: { isDefault: false },
      }),
    );
  }

  private sanitizeCustomer(customer: any) {
    const { passwordHash, ...safe } = customer;
    return safe;
  }
}
