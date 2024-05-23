import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, EventPattern } from '@nestjs/microservices';
import { MESSAGE_PATTERNS } from '@shared/constants';
import { UserService } from '../services/user.service';
import {
  CreateUserDto,
  DeleteUserDto,
  GetUserDto,
  UpdateSessionDto,
  UpdateUserDto,
} from '../dto/user';

const {
  GET_USER,
  LIST_USERS,
  GET_USER_FOR_AUTH,
  UPDATE_USER,
  UPDATE_USER_MANY,
  DELETE_USER,
  UPDATE_PROFILE_IMAGE,
  REMOVE_PROFILE_IMAGE,
  GET_PROFILE_IMAGE,
  CHANGE_USER_STATUS,
  CHECK_USER_EMAIL_OR_PHONE,
  IG_VERIFICATION,
  VERIFICATION_UPDATE,
  CREATE_USER_DB,
} = MESSAGE_PATTERNS.USER_ACCOUNT_PROFILE.USER;
const { GET_USER_EMAIL_TO_SET_PASSWORD } =
  MESSAGE_PATTERNS.USER_ACCOUNT_PROFILE.AUTH;
@Controller()
export class UserController {
  private readonly logger = new Logger(UserController.name);
  constructor(private readonly userService: UserService) {}

  @MessagePattern('health-check')
  async healthCheck() {
    return {
      healthCheckPassed: true,
      healthCheck: 'Excellent',
    };
  }

  @MessagePattern(CREATE_USER_DB)
  async create(@Payload() payload: CreateUserDto) {
    return await this.userService.createUser(payload);
  }

  @MessagePattern(GET_USER_EMAIL_TO_SET_PASSWORD)
  async getUserEmailToSetPassword(@Payload() payload: { email: string }) {
    return await this.userService.getUserEmailToSetPassword(payload);
  }

  @MessagePattern(LIST_USERS)
  async getAllUsers() {
    return await this.userService.getAllUsers();
  }

  @MessagePattern(CHANGE_USER_STATUS)
  async changeUserStatusByID(
    @Payload() payload: { id: string; status: boolean }
  ) {
    const { id, status } = payload;
    return await this.userService.changeUserStatusByID(id, status);
  }

  @MessagePattern(GET_USER)
  async getUser(@Payload() payload: GetUserDto) {
    return await this.userService.getUser(payload);
  }

  @MessagePattern(GET_USER_FOR_AUTH)
  async getUserForAuth(@Payload() payload: GetUserDto) {
    return await this.userService.getUserForAuth(payload);
  }

  @MessagePattern(UPDATE_USER)
  async updateUser(@Payload() payload: UpdateUserDto) {
    return await this.userService.updateUser(payload);
  }

  @MessagePattern(UPDATE_USER_MANY)
  async updateUserMany(
    @Payload()
    payload: Omit<UpdateUserDto, 'userId'> & {
      userIds: string[];
      companyId: string;
    }
  ) {
    return await this.userService.updateUserMany(payload);
  }

  @MessagePattern(DELETE_USER)
  async deleteUser(@Payload() payload: DeleteUserDto) {
    return await this.userService.deleteUser(payload);
  }

  @MessagePattern(UPDATE_PROFILE_IMAGE)
  async updateProfileImage(@Payload() payload) {
    return await this.userService.updateProfileImage(payload);
  }

  @MessagePattern(REMOVE_PROFILE_IMAGE)
  async removeProfileImage(@Payload() payload) {
    return await this.userService.removeProfileImage(payload);
  }

  @MessagePattern(GET_PROFILE_IMAGE)
  async get(@Payload() userId: string) {
    return await this.userService.get(userId);
  }

  @MessagePattern(CHECK_USER_EMAIL_OR_PHONE)
  async checkUserForEmailOrPhone(
    @Payload() payload: { type: string; value: string; defaultRole: string }
  ) {
    return await this.userService.checkUserForEmailOrPhone(payload);
  }

  @EventPattern(IG_VERIFICATION)
  async createIGVerification(@Payload() payload) {
    return this.userService.createIdentitySession(payload);
  }

  @MessagePattern(VERIFICATION_UPDATE)
  async updateIGVerification(@Payload() payload: UpdateSessionDto) {
    return await this.userService.updateIdentitySession(payload);
  }
}
