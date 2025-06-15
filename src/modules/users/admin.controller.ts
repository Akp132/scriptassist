import { Controller, Get, Patch, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('admin-users')
@Controller('admin/users')
@UseGuards(RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AdminUsersController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get()
  async getAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.queryBus.execute(new (await import('./queries/get-all-users.query')).GetAllUsersQuery(Number(page), Number(limit)));
  }

  @Patch(':id/disable')
  async disable(@Param('id') id: string) {
    return this.commandBus.execute(new (await import('./commands/disable-user.command')).DisableUserCommand(id));
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.commandBus.execute(new (await import('./commands/delete-user.command')).DeleteUserCommand(id));
  }
}
