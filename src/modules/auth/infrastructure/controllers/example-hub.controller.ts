import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { ScopesGuard } from '../guards/scopes.guard';
import { Roles, RequireAllRoles } from '../decorators/roles.decorator';
import { Scopes, RequireAllScopes } from '../decorators/scopes.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Public } from '../decorators/public.decorator';
import { User, UserRole } from '../../domain/entities/user.entity';

@Controller('hub-examples')
@UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
export class HubExampleController {
  @Get('public-route')
  @Public()
  publicRoute() {
    return { message: 'This is a public route - no authentication required' };
  }

  @Get('authenticated-route')
  authenticatedRoute(@CurrentUser() user: User) {
    return {
      message: 'This route requires authentication',
      userId: user.id,
      email: user.email,
    };
  }

  @Get('candidate-only')
  @Roles(UserRole.CANDIDATE)
  candidateOnlyRoute(@CurrentUser() user: User) {
    return {
      message: 'Only candidates can access this route',
      user: user.email,
      roles: user.roles,
    };
  }

  @Get('employer-only')
  @Roles(UserRole.EMPLOYER)
  employerOnlyRoute(@CurrentUser() user: User) {
    return {
      message: 'Only employers can access this route',
      user: user.email,
      roles: user.roles,
    };
  }

  @Get('mentor-only')
  @Roles(UserRole.MENTOR)
  mentorOnlyRoute(@CurrentUser() user: User) {
    return {
      message: 'Only mentors can access this route',
      user: user.email,
      roles: user.roles,
    };
  }

  @Get('professor-only')
  @Roles(UserRole.PROFESSOR)
  professorOnlyRoute(@CurrentUser() user: User) {
    return {
      message: 'Only professors can access this route',
      user: user.email,
      roles: user.roles,
    };
  }

  @Get('candidate-or-employer')
  @Roles(UserRole.CANDIDATE, UserRole.EMPLOYER)
  candidateOrEmployerRoute(@CurrentUser() user: User) {
    return {
      message: 'Candidates or employers can access this route',
      user: user.email,
      roles: user.roles,
    };
  }

  @Get('mentor-and-professor')
  @Roles(UserRole.MENTOR, UserRole.PROFESSOR)
  @RequireAllRoles()
  mentorAndProfessorRoute(@CurrentUser() user: User) {
    return {
      message: 'Only users who are BOTH mentor AND professor can access',
      user: user.email,
      roles: user.roles,
    };
  }

  @Get('vagas/view')
  @Scopes('vagas:view')
  viewJobListings(@CurrentUser() user: User) {
    return {
      message: 'View job listings - requires vagas:view scope',
      user: user.email,
      scopes: user.scopes,
    };
  }

  @Get('vagas/apply')
  @Scopes('vagas:apply')
  applyToJob(@CurrentUser() user: User) {
    return {
      message: 'Apply to job - requires vagas:apply scope',
      user: user.email,
      scopes: user.scopes,
    };
  }

  @Get('vagas/manage')
  @Scopes('vagas:manage')
  manageJobListings(@CurrentUser() user: User) {
    return {
      message: 'Manage job listings - requires vagas:manage scope',
      user: user.email,
      scopes: user.scopes,
    };
  }

  @Get('mentoria/schedule')
  @Scopes('mentoria:schedule')
  scheduleMentoring(@CurrentUser() user: User) {
    return {
      message: 'Schedule mentoring - requires mentoria:schedule scope',
      user: user.email,
      scopes: user.scopes,
    };
  }

  @Get('educacao/teach')
  @Scopes('educacao:teach')
  teachCourse(@CurrentUser() user: User) {
    return {
      message: 'Teach course - requires educacao:teach scope',
      user: user.email,
      scopes: user.scopes,
    };
  }

  @Get('complex-permissions')
  @Roles(UserRole.MENTOR, UserRole.PROFESSOR)
  @Scopes('mentoria:create', 'educacao:teach')
  @RequireAllScopes()
  complexPermissionsRoute(@CurrentUser() user: User) {
    return {
      message:
        'Requires (mentor OR professor role) AND (mentoria:create AND educacao:teach scopes)',
      user: user.email,
      roles: user.roles,
      scopes: user.scopes,
    };
  }

  @Get('admin-only')
  @Roles(UserRole.ADMIN)
  @Scopes('admin:users')
  adminOnlyRoute(@CurrentUser() user: User) {
    return {
      message: 'Admin only route with admin:users scope',
      user: user.email,
      roles: user.roles,
      scopes: user.scopes,
    };
  }

  @Get('my-profile')
  myProfile(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      roles: user.roles,
      scopes: user.scopes,
      organizations: user.organizations,
      organizationRoles: user.organizationRoles,
      isCandidate: user.isCandidate(),
      isEmployer: user.isEmployer(),
      isMentor: user.isMentor(),
      isProfessor: user.isProfessor(),
      isAdmin: user.isAdmin(),
    };
  }
}
