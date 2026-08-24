import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { HealthResponseDocDto } from './research/dto/research-doc.dto';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({
    summary: 'Health check',
    description: 'Returns the current health status of the API server.',
  })
  @ApiResponse({
    status: 200,
    description: 'Server is healthy',
    type: HealthResponseDocDto,
  })
  getHealth() {
    return this.appService.getHealth();
  }
}
