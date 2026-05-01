import { PartialType } from '@nestjs/swagger';
import { CreateFirewallRuleDto } from './create-firewall-rule.dto';

export class UpdateFirewallRuleDto extends PartialType(CreateFirewallRuleDto) {}
