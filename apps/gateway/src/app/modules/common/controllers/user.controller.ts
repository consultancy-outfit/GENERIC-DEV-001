import { Controller, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UserController {
  protected readonly logger = new Logger(UserController.name);
}
