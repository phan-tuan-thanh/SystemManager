import { Module } from '@nestjs/common';
import { FirewallRuleController } from './firewall-rule.controller';
import { FirewallRuleService } from './firewall-rule.service';

@Module({
  controllers: [FirewallRuleController],
  providers: [FirewallRuleService],
  exports: [FirewallRuleService],
})
export class FirewallRuleModule {}
