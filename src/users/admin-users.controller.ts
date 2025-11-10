import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { AdminUsersService } from "./admin-users.service";
import { AdminUsersQueryDto, AdminCreateUserDto, AdminUpdateUserDto } from "./dto/admin-users.dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
@Controller("admin/users")
export class AdminUsersController {
  constructor(private service: AdminUsersService) {}

  @Get()
  async list(@Query() q: AdminUsersQueryDto) {
    const page = Math.max(1, parseInt(q.page ?? "1", 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(q.pageSize ?? "20", 10) || 20));
    return this.service.list({
      q: q.q,
      role: q.role as any,
      isActive: q.isActive === "true" ? true : q.isActive === "false" ? false : undefined,
      page, pageSize,
    });
  }

  @Post()
  async create(@Body() dto: AdminCreateUserDto) {
    return this.service.create(dto as any);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: AdminUpdateUserDto) {
    return this.service.update(id, dto as any);
  }
}
