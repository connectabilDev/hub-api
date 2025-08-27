import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { I18n, I18nContext } from 'nestjs-i18n';

@ApiTags('i18n Test')
@Controller('i18n-test')
export class I18nTestController {
  @Get('hello')
  @ApiOperation({ summary: 'Test i18n translation' })
  @ApiQuery({
    name: 'lang',
    required: false,
    description: 'Language code (en, pt-BR, es)',
  })
  getHello(@I18n() i18n: I18nContext): { message: string; language: string } {
    const message = i18n.t('common.HELLO');
    const language = i18n.lang;

    return {
      message,
      language,
    };
  }

  @Get('welcome')
  @ApiOperation({ summary: 'Test i18n welcome message' })
  @ApiQuery({
    name: 'lang',
    required: false,
    description: 'Language code (en, pt-BR, es)',
  })
  getWelcome(@I18n() i18n: I18nContext): { message: string; language: string } {
    const message = i18n.t('common.WELCOME');
    const language = i18n.lang;

    return {
      message,
      language,
    };
  }

  @Get('validation-error')
  @ApiOperation({ summary: 'Test i18n validation error message' })
  @ApiQuery({
    name: 'lang',
    required: false,
    description: 'Language code (en, pt-BR, es)',
  })
  getValidationError(@I18n() i18n: I18nContext): {
    message: string;
    language: string;
  } {
    const message = i18n.t('validation.NOT_EMPTY', {
      args: { property: 'email' },
    });
    const language = i18n.lang;

    return {
      message,
      language,
    };
  }

  @Get('auth-error')
  @ApiOperation({ summary: 'Test i18n auth error message' })
  @ApiQuery({
    name: 'lang',
    required: false,
    description: 'Language code (en, pt-BR, es)',
  })
  getAuthError(@I18n() i18n: I18nContext): {
    message: string;
    language: string;
  } {
    const message = i18n.t('auth.INVALID_TOKEN');
    const language = i18n.lang;

    return {
      message,
      language,
    };
  }

  @Get('all-messages')
  @ApiOperation({ summary: 'Get all translation categories' })
  @ApiQuery({
    name: 'lang',
    required: false,
    description: 'Language code (en, pt-BR, es)',
  })
  getAllMessages(@I18n() i18n: I18nContext): any {
    const common = {
      hello: i18n.t('common.HELLO'),
      welcome: i18n.t('common.WELCOME'),
      success: i18n.t('common.SUCCESS'),
      error: i18n.t('common.ERROR'),
    };

    const auth = {
      invalidToken: i18n.t('auth.INVALID_TOKEN'),
      userNotFound: i18n.t('auth.USER_NOT_FOUND'),
      loginSuccess: i18n.t('auth.LOGIN_SUCCESS'),
    };

    const validation = {
      notEmpty: i18n.t('validation.NOT_EMPTY', {
        args: { property: 'field' },
      }),
      isEmail: i18n.t('validation.IS_EMAIL', {
        args: { property: 'email' },
      }),
      minLength: i18n.t('validation.MIN_LENGTH', {
        args: { property: 'password', constraints: [8] },
      }),
    };

    const organization = {
      created: i18n.t('organization.CREATED'),
      notFound: i18n.t('organization.NOT_FOUND'),
      memberAdded: i18n.t('organization.MEMBER_ADDED'),
    };

    const userProfile = {
      created: i18n.t('user-profile.CREATED'),
      invalidCpf: i18n.t('user-profile.INVALID_CPF'),
      onboardingCompleted: i18n.t('user-profile.ONBOARDING_COMPLETED'),
    };

    return {
      language: i18n.lang,
      translations: {
        common,
        auth,
        validation,
        organization,
        userProfile,
      },
    };
  }
}
