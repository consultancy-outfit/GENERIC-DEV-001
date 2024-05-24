import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  DeleteUserDto,
  GetUserDto,
  UpdateSessionDto,
  UpdateUserDto,
  UpdateUserProfileDto,
} from '../dto/user';
import { RpcException } from '@nestjs/microservices';
import { FilterQuery, Types, UpdateQuery } from 'mongoose';
import { S3Service } from '@shared';
import { UserRepository } from '@shared/repository';
import { AxiosRequestConfig } from 'axios';
import { createCipheriv } from 'crypto';
import { VerificationStatusEnum } from '@shared/constants';
import { HttpService } from '@nestjs/axios';
import { User } from '@shared/schemas';
import { firstValueFrom } from 'rxjs';
import { AACLeadGenerationService } from './aac-api.service';
import { AACApiDto } from '@shared/dto';

@Injectable()
export class UserService {
  protected readonly logger = new Logger(UserService.name);

  constructor(
    private userRepository: UserRepository,
    private s3: S3Service,
    private http: HttpService,
    private aacApi: AACLeadGenerationService
  ) {}

  async updateUserByID(data) {
    try {
      return await this.userRepository.findOneAndUpdate(
        { _id: data.userId },
        data
      );
    } catch (err) {
      throw new RpcException(err.message);
    }
  }

  async changeUserStatusByID(id: string, status: boolean) {
    try {
      return await this.userRepository.findOneAndUpdate(
        { _id: id },
        { $set: { isActive: status } },
        { new: true }
      );
    } catch (err) {
      throw new RpcException(err.message);
    }
  }

  async getAllUsersList(payload: {
    search: string;
    limit: number;
    offset: number;
    status: string;
    userId: string;
  }) {
    const { search, limit, offset, status, userId } = payload;

    try {
      let filterQuery: FilterQuery<User> = { createdBy: userId };

      if (search?.length) {
        filterQuery = {
          ...filterQuery,
          $or: [
            {
              firstName: {
                $regex: `.*${search.toLowerCase()}.*`,
                $options: 'i',
              },
            },
            {
              lastName: {
                $regex: `.*${search.toLowerCase()}.*`,
                $options: 'i',
              },
            },
          ],
        };
      }
      if (status) {
        filterQuery.isActive = status == 'true';
      }
      const users = await this.userRepository.paginate({
        filterQuery,
        limit,
        offset,
        returnKey: 'users',
        sort: {},
      });
      return users;
    } catch (err) {
      throw new RpcException(err);
    }
  }

  async getAllUsers() {
    try {
      return await this.userRepository.find({});
    } catch (err) {
      throw new RpcException(err.message);
    }
  }

  async getUserEmailToSetPassword(payload: { email: string }) {
    try {
      const { email } = payload;
      const response = await this.userRepository.findOneAndUpdate(
        {
          $or: [{ _id: email }, { email: email }],
        },
        { $set: { companyRegistered: true } },
        { new: true }
      );
      return response.email;
    } catch (err) {
      throw new RpcException(err.message);
    }
  }

  async updateUserProfile(payload: UpdateUserProfileDto) {
    try {
      const updatedQuery: UpdateQuery<User> = {};
      const { id } = payload;

      for (const key in payload) {
        updatedQuery[key] = payload[key];
      }

      // remove null values from object
      // updatedQuery = await this.commonService.removeNullValues(updatedQuery);

      const data = await this.userRepository.findOneAndUpdate(
        { _id: id },
        updatedQuery
      );

      return data;
    } catch (err) {
      throw new RpcException(err.message);
    }
  }

  async getUser(dto: GetUserDto) {
    const { userId } = dto;
    const user = await this.userRepository.findOne({ _id: userId });
    return user;
  }

  async getUserForAuth(dto: GetUserDto) {
    try {
      const { userId } = dto;
      const [user] = await this.userRepository.aggregate([
        {
          $match: {
            _id: userId,
          },
        },
        // {
        //   $set: {
        //     role: {
        //       $ifNull: ['$role', '$defaultRole'],
        //     },
        //   },
        // },
        // {
        //   $lookup: {
        //     from: 'roles',
        //     localField: 'role',
        //     foreignField: '_id',
        //     pipeline: [
        //       {
        //         $project: {
        //           _id: 0,
        //           permissions: 1,
        //         },
        //       },
        //     ],
        //     as: 'rolePermissions',
        //   },
        // },
        // {
        //   $unwind: {
        //     path: '$rolePermissions',
        //     preserveNullAndEmptyArrays: true,
        //   },
        // },
        // {
        //   $lookup: {
        //     from: 'companies',
        //     localField: 'companyId',
        //     foreignField: '_id',
        //     pipeline: [
        //       {
        //         $project: {
        //           _id: 0,
        //           menuPermissions: 1,
        //           oneOnOne: 1,
        //         },
        //       },
        //     ],
        //     as: 'menuPermissions',
        //   },
        // },
        // {
        //   $unwind: {
        //     path: '$rolePermissions',
        //     preserveNullAndEmptyArrays: true,
        //   },
        // },
        // {
        //   $unwind: {
        //     path: '$menuPermissions',
        //     preserveNullAndEmptyArrays: true,
        //   },
        // },
        {
          $project: {
            _id: 0,
            userId: '$_id',
            firstName: '$firstName',
            lastName: '$lastName',
            email: '$email',
            businessName: '$businessName',
            isActive: '$isActive',
            contactNumber: '$contactNumber',
            defaultRole: '$defaultRole',
            // companyId: '$companyId',
            department: '$department',
            role: '$role',
            profileImage: '$profileImage',
            loggedInAs: '$loggedInAs',
            managerId: '$managerId',
            employeeStatus: '$employeeStatus',
            defaultCompany: '$defaultCompany',
            allowedCompanies: '$allowedCompany',
            // menuPermissions: '$menuPermissions',
            allowPushNotifications: 1,
            // userPermissions: {
            //   $cond: {
            //     if: {
            //       $or: [
            //         { userPermissions: { exists: false } },
            //         { userPermissions: { first: { exists: false } } },
            //       ],
            //     },
            //     then: '$rolePermissions.permissions',
            //     else: '$userPermissions',
            //   },
            // },
          },
        },
      ]);

      if (!user.isActive)
        throw new UnauthorizedException('User is deactivated by Admin');

      return {
        data: user,
        message: '',
        errors: null,
      };
    } catch (err) {
      throw new RpcException(err);
    }
  }

  async checkUserForEmailOrPhone(payload: { type: string; value: string }) {
    try {
      const { type, value } = payload;
      const filterQuery: any = {};
      if (type == 'phone') {
        filterQuery.contactNumber = value;
      } else {
        filterQuery.email = value;
      }

      try {
        const user = await this.userRepository.findOne(filterQuery, {
          _id: 1,
          email: 1,
          firstName: 1,
          lastName: 1,
          contactNumber: 1,
        });
        return user;
      } catch (err) {
        return false;
      }
    } catch (err) {
      throw new RpcException(err);
    }
  }

  async createUser(payload) {
    try {
      const response = await this.userRepository.create({
        ...payload,
      });

      return response;
    } catch (err) {
      throw new RpcException(err);
    }
  }

  async checkPhoneNumber(dto: { phoneNumber: string; usersId?: string }) {
    try {
      const { phoneNumber, usersId } = dto;
      try {
        let filter: any = {};
        if (usersId != null && usersId != undefined) {
          filter = { contactNumber: phoneNumber, usersId: { $ne: usersId } };
        } else {
          filter = { contactNumber: phoneNumber };
        }
        await this.userRepository.findOne(
          { ...filter },
          { userId: 1, contactNumber: 1, defaultRole: 1 },
          { notFoundThrowError: false }
        );
        return true;
      } catch (exception) {
        return false;
      }
    } catch (err) {
      throw new RpcException(err);
    }
  }

  async updateUser(dto: UpdateUserDto) {
    try {
      const { userId, ...userData } = dto;

      const user = await this.userRepository.findOneAndUpdate(
        { _id: userId },
        {
          ...userData,
        }
      );
      return user;
    } catch (err) {
      throw new RpcException(err);
    }
  }

  async updateUserMany(
    dto: Omit<UpdateUserDto, 'userId'> & {
      userIds: string[];
      companyId: string;
    }
  ) {
    const { userIds, companyId, ...userData } = dto;

    const user = await this.userRepository.updateMany(
      { _id: { $in: userIds }, companyId: new Types.ObjectId(companyId) },
      {
        ...userData,
      }
    );

    if (user.matchedCount == 0) {
      throw new NotFoundException(
        'None of these employees were found under this company'
      );
    }
    return user;
  }

  async deleteUser(dto: DeleteUserDto) {
    try {
      const { usersId } = dto;
      await this.userRepository.delete({ userId: usersId });
      return {
        data: null,
        message: 'User deleted successfully.',
        errors: null,
      };
    } catch (err) {
      throw new RpcException(err);
    }
  }

  async updateProfileImage(payload: { userId: string; image: string | null }) {
    const { image, userId } = payload;

    try {
      const user = await this.userRepository.findOne({ _id: userId });
      if (image != null && image != '') {
        const url = `users/${userId}/profile-image/{uuid}`;

        // Remove the old profile image from the S3 bucket.
        if (user.profileImage && user.profileImage !== '') {
          await this.s3.deleteFile(user.profileImage);
        }

        user.profileImage = (await this.s3.uploadFile(image, url))?.url;

        await this.userRepository.findOneAndUpdate({ _id: userId }, user);
        return user.profileImage;
      }

      throw new BadRequestException('Image not provided');
    } catch (err) {
      throw new RpcException(err.message);
    }
  }

  async removeProfileImage(payload: { userId: string }) {
    const { userId } = payload;

    try {
      const user = await this.userRepository.findOne({ _id: userId });

      // Remove the old profile image from the S3 bucket.
      if (user.profileImage && user.profileImage !== '') {
        await this.s3.deleteFile(user.profileImage);
        user.profileImage = null;
      }

      await this.userRepository.findOneAndUpdate({ _id: userId }, user);
      return user.profileImage;
    } catch (err) {
      throw new RpcException(err.message);
    }
  }

  async get(userId: string) {
    try {
      const response = await this.userRepository.findOne({
        _id: userId,
      });
      return {
        data: response.profileImage,
        message: '',
        errors: null,
      };
    } catch (err) {
      throw new RpcException(err);
    }
  }

  async getUserByEmail(payload: { email: string }) {
    const { email } = payload;
    try {
      const user = await this.userRepository.findOne(
        { email },
        {},
        { notFoundThrowError: false }
      );
      return user;
    } catch (err) {
      throw new RpcException(err);
    }
  }

  //IG webhook
  async updateIdentitySession(payload: UpdateSessionDto) {
    try {
      const updatedQuery: any = {};
      const options = { new: true };
      if (payload.status === VerificationStatusEnum.SUBMITTED) {
        updatedQuery.verificationId = payload.id;
        updatedQuery.verifiedPhoneNumber = payload.verifiedPhoneNumber;
      }
      updatedQuery.verificationStatus = payload.status;
      return await this.userRepository.findOneAndUpdate(
        {
          _id: payload.uniqueIdentifier,
        },
        updatedQuery,
        options
      );
    } catch (err) {
      throw new RpcException(err.message);
    }
  }

  private encryptData(data: string): any {
    const algorithm = 'aes-256-gcm';
    const publicKey = process.env.IDENTITY_GRAM_PUBLIC_KEY.substring(0, 24);
    const privateKey = Buffer.from(
      process.env.IDENTITY_GRAM_PRIVATE_KEY,
      'hex'
    );
    const cipher = createCipheriv(algorithm, privateKey, publicKey);
    let enc = cipher.update(data, 'utf8', 'hex');
    enc += cipher.final('hex');
    return enc;
  }

  async createIdentitySession(payload: any) {
    const { userId, firstName, lastName, email } = payload;
    try {
      const userData = JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email: email,
        unique_identifier: userId,
      });
      const encryptedData = this.encryptData(userData);
      const config: AxiosRequestConfig = {
        url: process.env.IDENTITY_GRAM_URL + 'verification/verification',
        method: 'POST',
        data: {
          data: encryptedData,
          publicKey: process.env.IDENTITY_GRAM_PUBLIC_KEY,
        },
      };
      const { data } = await firstValueFrom(this.http.request(config));
      return data;
    } catch (err) {
      throw new RpcException(err.message);
    }
  }

  async sendLeadGeneration(payload: AACApiDto) {
    return this.aacApi.createLead(payload);
  }
}
