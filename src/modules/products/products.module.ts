import { Module } from '@nestjs/common';
import { ProductsController, CategoriesController } from './products.controller';
import { ProductsService } from './products.service';
import { CategoriesService } from './categories.service';

@Module({
  controllers: [ProductsController, CategoriesController],
  providers: [ProductsService, CategoriesService],
  exports: [ProductsService, CategoriesService],
})
export class ProductsModule {}
