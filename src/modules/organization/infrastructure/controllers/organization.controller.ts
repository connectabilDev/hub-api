import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  HttpCode,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateOrganizationUseCase } from '../../application/use-cases/create-organization/create-organization.use-case';
import { GetOrganizationUseCase } from '../../application/use-cases/get-organization/get-organization.use-case';
import { AddMemberUseCase } from '../../application/use-cases/add-member/add-member.use-case';
import { RemoveMemberUseCase } from '../../application/use-cases/remove-member/remove-member.use-case';
import { ListOrganizationsUseCase } from '../../application/use-cases/list-organizations/list-organizations.use-case';
import { UpdateOrganizationUseCase } from '../../application/use-cases/update-organization/update-organization.use-case';
import { InviteMemberUseCase } from '../../application/use-cases/invite-member/invite-member.use-case';
import { ListMembersUseCase } from '../../application/use-cases/list-members/list-members.use-case';
import { OrganizationMapper } from '../../application/mappers/organization.mapper';
import { CreateOrganizationDto } from '../../application/dtos/create-organization.dto';
import { OrganizationResponseDto } from '../../application/dtos/organization-response.dto';
import { AddMemberDto } from '../../application/dtos/add-member.dto';
import { RemoveMemberDto } from '../../application/dtos/remove-member.dto';
import {
  ListOrganizationsDto,
  ListOrganizationsResponseDto,
} from '../../application/dtos/list-organizations.dto';
import { UpdateOrganizationDto } from '../../application/dtos/update-organization.dto';
import {
  InviteMemberDto,
  InviteMemberResponseDto,
} from '../../application/dtos/invite-member.dto';
import {
  ListMembersDto,
  ListMembersResponseDto,
} from '../../application/dtos/list-members.dto';
import { OrganizationMemberGuard } from '../guards/organization-member.guard';
import {
  OrganizationRoleGuard,
  RequireOrganizationRoles,
} from '../guards/organization-role.guard';
import type { CurrentUserData } from '../decorators/current-user.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';

@ApiTags('Organizations')
@ApiBearerAuth()
@Controller('organizations')
@UseInterceptors(ClassSerializerInterceptor)
export class OrganizationController {
  constructor(
    private readonly createOrganizationUseCase: CreateOrganizationUseCase,
    private readonly getOrganizationUseCase: GetOrganizationUseCase,
    private readonly addMemberUseCase: AddMemberUseCase,
    private readonly removeMemberUseCase: RemoveMemberUseCase,
    private readonly listOrganizationsUseCase: ListOrganizationsUseCase,
    private readonly updateOrganizationUseCase: UpdateOrganizationUseCase,
    private readonly inviteMemberUseCase: InviteMemberUseCase,
    private readonly listMembersUseCase: ListMembersUseCase,
    private readonly organizationMapper: OrganizationMapper,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new organization',
    description: 'Creates a new organization with schema provisioning',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Organization created successfully',
    type: OrganizationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid organization data',
  })
  async createOrganization(
    @Body() createOrganizationDto: CreateOrganizationDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<OrganizationResponseDto> {
    const dto = { ...createOrganizationDto, ownerId: user?.id };
    const organization = await this.createOrganizationUseCase.execute(dto);
    return this.organizationMapper.toDto(organization);
  }

  @Get(':organizationId')
  @UseGuards(OrganizationMemberGuard)
  @ApiOperation({
    summary: 'Get organization by ID',
    description: 'Retrieves organization details. User must be a member.',
  })
  @ApiParam({
    name: 'organizationId',
    description: 'Organization unique identifier',
    example: 'org_123456',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Organization found',
    type: OrganizationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Organization not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User is not a member of this organization',
  })
  async getOrganization(
    @Param('organizationId') organizationId: string,
  ): Promise<OrganizationResponseDto> {
    const organization =
      await this.getOrganizationUseCase.execute(organizationId);
    return this.organizationMapper.toDto(organization);
  }

  @Post(':organizationId/members')
  @UseGuards(OrganizationMemberGuard, OrganizationRoleGuard)
  @RequireOrganizationRoles('owner', 'admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add member to organization',
    description:
      'Adds a new member to the organization. Requires owner or admin role.',
  })
  @ApiParam({
    name: 'organizationId',
    description: 'Organization unique identifier',
    example: 'org_123456',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Member added successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid member data',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have permission to add members',
  })
  async addMember(
    @Param('organizationId') organizationId: string,
    @Body() addMemberDto: AddMemberDto,
  ): Promise<{ message: string }> {
    await this.addMemberUseCase.execute(organizationId, addMemberDto);
    return { message: 'Member added successfully' };
  }

  @Delete(':organizationId/members/:userId')
  @UseGuards(OrganizationMemberGuard, OrganizationRoleGuard)
  @RequireOrganizationRoles('owner', 'admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove member from organization',
    description:
      'Removes a member from the organization. Requires owner or admin role.',
  })
  @ApiParam({
    name: 'organizationId',
    description: 'Organization unique identifier',
    example: 'org_123456',
  })
  @ApiParam({
    name: 'userId',
    description: 'User unique identifier to remove',
    example: 'user_123456',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Member removed successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have permission to remove members',
  })
  async removeMember(
    @Param('organizationId') organizationId: string,
    @Param('userId') userId: string,
  ): Promise<void> {
    const dto = new RemoveMemberDto();
    dto.userId = userId;
    await this.removeMemberUseCase.execute(organizationId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List organizations',
    description: 'Lists organizations with optional filtering',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: 'Number of organizations per page (default: 10)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search query for organization name or description',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Organizations retrieved successfully',
    type: ListOrganizationsResponseDto,
  })
  async listOrganizations(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 10,
    @Query('search') search?: string,
  ): Promise<ListOrganizationsResponseDto> {
    const dto = new ListOrganizationsDto();
    dto.page = page;
    dto.pageSize = pageSize;
    dto.q = search;
    return await this.listOrganizationsUseCase.execute(dto);
  }

  @Put(':organizationId')
  @UseGuards(OrganizationMemberGuard, OrganizationRoleGuard)
  @RequireOrganizationRoles('owner', 'admin')
  @ApiOperation({
    summary: 'Update organization',
    description: 'Updates organization details. Requires owner or admin role.',
  })
  @ApiParam({
    name: 'organizationId',
    description: 'Organization unique identifier',
    example: 'org_123456',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Organization updated successfully',
    type: OrganizationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid organization data',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have permission to update organization',
  })
  async updateOrganization(
    @Param('organizationId') organizationId: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    const organization = await this.updateOrganizationUseCase.execute(
      organizationId,
      updateOrganizationDto,
    );
    return this.organizationMapper.toDto(organization);
  }

  @Post(':organizationId/invitations')
  @UseGuards(OrganizationMemberGuard, OrganizationRoleGuard)
  @RequireOrganizationRoles('owner', 'admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Invite member to organization',
    description:
      'Sends an invitation to join the organization. Requires owner or admin role.',
  })
  @ApiParam({
    name: 'organizationId',
    description: 'Organization unique identifier',
    example: 'org_123456',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Invitation sent successfully',
    type: InviteMemberResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid invitation data',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have permission to invite members',
  })
  async inviteMember(
    @Param('organizationId') organizationId: string,
    @Body() inviteMemberDto: InviteMemberDto,
  ): Promise<InviteMemberResponseDto> {
    return await this.inviteMemberUseCase.execute(
      organizationId,
      inviteMemberDto,
    );
  }

  @Get(':organizationId/members')
  @UseGuards(OrganizationMemberGuard)
  @ApiOperation({
    summary: 'List organization members',
    description: 'Lists all members of the organization with their roles.',
  })
  @ApiParam({
    name: 'organizationId',
    description: 'Organization unique identifier',
    example: 'org_123456',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: 'Number of members per page (default: 10)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Members retrieved successfully',
    type: ListMembersResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User is not a member of this organization',
  })
  async listMembers(
    @Param('organizationId') organizationId: string,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 10,
  ): Promise<ListMembersResponseDto> {
    const dto = new ListMembersDto();
    dto.page = page;
    dto.pageSize = pageSize;
    return await this.listMembersUseCase.execute(organizationId, dto);
  }
}
