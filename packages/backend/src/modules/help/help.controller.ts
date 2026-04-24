import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HelpService } from './help.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Help')
@Controller('help')
export class HelpController {
  constructor(private readonly helpService: HelpService) {}

  @Get(':moduleKey')
  @Public() // Allow everyone to see help content
  @ApiOperation({ summary: 'Lấy nội dung hướng dẫn sử dụng theo module' })
  async getHelp(
    @Param('moduleKey') moduleKey: string,
    @Query('lang') lang: string = 'vi',
  ) {
    const content = await this.helpService.getHelpContent(moduleKey, lang);
    return content;
  }
}
