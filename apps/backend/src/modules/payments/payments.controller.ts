import { Controller, Get, Post, Body, Patch, Param, Request, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PaymentEntity } from './entities/payment.entity';
import { RequestWithUser } from '../../common/interfaces/request-with-user.interface';

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiBody({ type: CreatePaymentDto })
  @ApiResponse({ status: 201, description: 'Payment created successfully', type: PaymentEntity })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Body() createPaymentDto: CreatePaymentDto, @Request() req: RequestWithUser) {
    // Mock user if not present (for now) or rely on AuthGuard
    return this.paymentsService.create(createPaymentDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'List all payments for the club' })
  @ApiResponse({ status: 200, description: 'List of payments', type: [PaymentEntity] })
  findAll(@Request() req: RequestWithUser) {
    return this.paymentsService.findAll(req.user.clubId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'Payment found', type: PaymentEntity })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.paymentsService.findOne(id, req.user.clubId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update payment' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiBody({ type: UpdatePaymentDto })
  @ApiResponse({ status: 200, description: 'Payment updated successfully', type: PaymentEntity })
  update(
    @Param('id') id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
    @Request() req: RequestWithUser,
  ) {
    return this.paymentsService.update(id, updatePaymentDto, req.user.clubId);
  }
}
