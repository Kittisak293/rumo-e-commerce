import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { buildTrackingUrl } from 'src/carriers/tracking-url.util';
// `import type`: a type used in a decorated signature can't be a value import
// while isolatedModules + emitDecoratorMetadata are both on (TS1272).
import type { AuthenticatedRequest } from 'src/auth/authenticated-request';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  // The admin shipping-dashboard queue: orders that need or have had shipping
  // action, with the item/shipment relations findAll() above deliberately
  // doesn't load (that route is used elsewhere and has test coverage).
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/shipping-queue')
  findShippingQueue() {
    return this.ordersService.findShippingQueue();
  }

  // Must stay above the generic ':id' route below, or Nest matches this
  // path against findOne('admin') instead.
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/:id')
  findOneForAdmin(@Param('id') id: string) {
    return this.ordersService.findOneForAdmin(+id);
  }

  @UseGuards(AuthGuard)
  @Post('checkout')
  async checkout(
    @Request() req: AuthenticatedRequest,
    @Body() body: { addressId: number },
  ) {
    return this.ordersService.checkout(req.user.sub, body.addressId);
  }

  @UseGuards(AuthGuard)
  @Get('my-orders')
  findMyOrders(@Request() req: AuthenticatedRequest) {
    return this.ordersService.findByUser(req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Get(':id/tracking')
  async getTracking(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const order = await this.ordersService.findTracking(+id, req.user.sub);
    return {
      ...order,
      shipments: order.shipments.map((shipment) => ({
        ...shipment,
        trackingUrl: buildTrackingUrl(
          shipment.carrier,
          shipment.trackingNumber,
        ),
      })),
    };
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.ordersService.findOneForUser(+id, req.user.sub);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(+id, updateOrderDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(+id);
  }
}
