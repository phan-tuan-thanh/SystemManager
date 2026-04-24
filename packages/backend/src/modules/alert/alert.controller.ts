import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AlertService } from './alert.service';

@ApiTags('Alerts')
@ApiBearerAuth()
@Controller('alerts')
export class AlertController {
  constructor(private alertService: AlertService) {}

  @Get()
  @ApiOperation({ summary: 'Get all current system alerts (OS EOL, port conflicts, stopped deployments)' })
  async getAlerts() {
    return this.alertService.getAlerts();
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get alert summary with counts by severity' })
  async getAlertSummary() {
    return this.alertService.getAlertSummary();
  }
}
