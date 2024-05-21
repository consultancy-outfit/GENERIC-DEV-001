import {
  BadRequestException,
  ConflictException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  AggregateOptions,
  FindOptions,
  UpdateOptions,
  UpsertOptions,
  WhereOptions,
  Attributes,
  UniqueConstraintError,
  ValidationError,
  ValidationErrorItemType,
} from 'sequelize';
import { Model, ModelCtor } from 'sequelize-typescript';
import { MakeNullishOptional } from 'sequelize/types/utils';

const camelize = (s) => s; //.toLowerCase().replace(/(_\w)/g, (w) => w.toUpperCase().substr(1));

export abstract class AbstractSQLRepository<T extends Model> {
  protected abstract readonly logger: Logger;
  private friendlyName: string;
  private singleName: string;

  constructor(protected readonly model: ModelCtor<T>) {
    this.friendlyName = camelize(this.model.name);
    let end: number;
    this.singleName = this.friendlyName.charAt(0).toUpperCase();
    if (this.friendlyName.slice(1).endsWith('ies')) {
      end = -3;
    } else if (this.friendlyName.slice(1).endsWith('es')) {
      end = -2;
    } else if (this.friendlyName.slice(1).endsWith('s')) {
      end = -1;
    }
    this.singleName += `${this.friendlyName
      .slice(1, end)
      .replace(/([A-Z]+)*([A-Z][a-z])/g, '$1 $2')}${
      end == -3 ? 'y' : ''
    }`.toLowerCase();
  }

  async create(
    document: Model<T> | MakeNullishOptional<T['_attributes']>,
    options?: Object
  ): Promise<T> {
    try {
      let createdDocument: Model<T>;
      if (document instanceof Model) {
        createdDocument = await document.save();
      } else {
        createdDocument = await this.model.create({
          ...document,
        });
      }

      return createdDocument.toJSON();
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        throw new ConflictException(`${this.friendlyName} already exists.`);
      }
      if (err instanceof ValidationError) {
        throw new BadRequestException({
          message: `Invalid ${this.singleName.toLowerCase()} data entered.`,

          errors: err.errors.map(
            (e) => e.message || `${e.validatorName}: ${e.path} (${e.value})`
          ),
        });
      }

      throw new BadRequestException(
        `Invalid ${this.singleName.toLowerCase()} data entered.`
      );
    }
  }

  async createMany(
    documents: MakeNullishOptional<T['_attributes']>[],
    options?: Object
  ): Promise<T[]> {
    try {
      const insertedDocuments = await this.model.bulkCreate(documents, options);
      return insertedDocuments;
    } catch (err) {
      throw new BadRequestException(
        `Invalid ${this.singleName.toLowerCase()} data entered.`
      );
    }
  }

  async find(
    filterQuery?: WhereOptions<T>,
    projection?: Record<string, 0 | 1>,
    populate?: any[]
  ): Promise<T[]> {
    let includedProjections =
      projection && Object.keys(projection).filter((p) => projection[p] == 1);
    let excludedProjections =
      projection && Object.keys(projection).filter((p) => projection[p] == 0);
    return await this.model.findAll({
      where: { ...filterQuery },
      ...(populate && {
        include: populate,
      }),
      ...((includedProjections || excludedProjections) && {
        attributes: {
          ...(includedProjections && { include: includedProjections }),
          ...(excludedProjections && { exclude: excludedProjections }),
        },
      }),
    });
  }

  async findProfile(
    filterQuery: WhereOptions<T>,
    options?: FindOptions<T>,
    projection?: Record<string, 0 | 1>,
    populate?: any[]
  ): Promise<T> {
    let includedProjections =
      projection && Object.keys(projection).filter((p) => projection[p] == 1);
    let excludedProjections =
      projection && Object.keys(projection).filter((p) => projection[p] == 0);
    const document = await this.model.findOne({
      ...options,
      where: { ...filterQuery, ...options?.where },
      limit: 1,
      // raw: true,
      ...(populate && {
        include: populate,
      }),
      attributes: [...includedProjections],
    });

    if (!document) {
      this.logger.warn(
        `${this.singleName} not found with filterQuery`,
        filterQuery
      );
      throw new NotFoundException(`${this.singleName} not found.`);
    }

    return document;
  }

  async findOne(
    filterQuery: WhereOptions<T>,
    options?: FindOptions<T>,
    projection?: Record<string, 0 | 1>,
    populate?: any[],
    notFoundThrowError: boolean = true
  ): Promise<T> {
    let includedProjections =
      projection && Object.keys(projection).filter((p) => projection[p] == 1);
    let excludedProjections =
      projection && Object.keys(projection).filter((p) => projection[p] == 0);
    const document = await this.model.findOne({
      ...options,
      where: { ...filterQuery, ...options?.where },
      limit: 1,
      ...(populate && {
        include: populate,
      }),
      ...((includedProjections || excludedProjections) && {
        attributes: {
          ...(includedProjections && { include: includedProjections }),
          ...(excludedProjections && { exclude: excludedProjections }),
        },
      }),
    });

    if (!document) {
      if (notFoundThrowError) {
        this.logger.warn(
          `${this.singleName} not found with filterQuery`,
          filterQuery
        );
      }
      throw new NotFoundException(`${this.singleName} not found.`);
    }

    return document;
  }

  async delete(filterQuery: WhereOptions<T>): Promise<boolean> {
    try {
      const options = { ...filterQuery };
      const deletedDocuments = await this.model.destroy({
        where: options,
        limit: 1,
      });
      if (deletedDocuments === 0) {
        this.logger.warn(
          `${this.singleName} not found with filterQuery`,
          filterQuery
        );
        throw new NotFoundException(`${this.singleName} not found.`);
      }
      return true;
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new BadRequestException(
        `Invalid ${this.singleName.toLowerCase()} data entered.`
      );
    }
  }

  async deleteMany(
    filterQuery: WhereOptions<T>,
    ids: Array<any>,
    column: string = 'id'
  ): Promise<boolean> {
    try {
      const options = { ...filterQuery, [column]: [...ids] };
      const deletedDocuments = await this.model.destroy({
        where: options,
      });
      if (deletedDocuments === 0) {
        this.logger.warn(
          `${this.singleName} not found with filterQuery`,
          filterQuery
        );
        throw new NotFoundException(`${this.singleName} not found.`);
      }
      return true;
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new BadRequestException(
        `Invalid ${this.singleName.toLowerCase()} data entered.`
      );
    }
  }

  async update(
    filterQuery: WhereOptions<T>,
    update: MakeNullishOptional<T['_attributes']>,
    options?: UpdateOptions<T> | UpsertOptions<T>,
    upsert?: boolean
  ) {
    try {
      const document = await this.findOne(filterQuery, { ...options });
      if (!document) {
        this.logger.warn(
          `${this.singleName} not found with filterQuery:`,
          filterQuery
        );
        throw new NotFoundException(`${this.singleName} not found.`);
      }

      let updated;

      if (!upsert) {
        Object.keys(update).forEach((u) => {
          document[u] = update[u];
        });
        updated = await document.save();
      } else {
        updated = await this.model.upsert(update, {
          ...options,
          returning: true,
        });
      }
      if (!updated) {
        throw new BadRequestException({
          message: `Invalid ${this.singleName.toLowerCase()} data entered.`,
        });
      }
      return document;
    } catch (err) {
      if (err instanceof ValidationError) {
        throw new BadRequestException({
          message: `Invalid ${this.singleName.toLowerCase()} data entered.`,
          errors: err.errors.map(
            (e) => e.message || `${e.validatorName}: ${e.path} (${e.value})`
          ),
        });
      }
      throw err;
    }
  }

  async updateMany(
    filterQuery: WhereOptions<T>,
    update: MakeNullishOptional<T['_attributes']>,
    options?: UpdateOptions<T> | UpsertOptions<T>,
    upsert?: boolean
  ) {
    const document = await this.model[!upsert ? 'update' : 'upsert']!(update, {
      ...options,
      where: { ...filterQuery, ...(<any>options)?.where },
    });

    if (!document) {
      this.logger.warn(
        `${this.singleName} not found with filterQuery:`,
        filterQuery
      );
      throw new NotFoundException(`${this.singleName} not found.`);
    }

    return document;
  }

  async aggregate(
    field: '*' | keyof Attributes<T>,
    aggregateFunction: string,
    options?: AggregateOptions<unknown, Attributes<T>>
  ) {
    return await this.model.aggregate(field, aggregateFunction, options);
  }

  async count(filterQuery: WhereOptions<T>, options?: FindOptions<T>) {
    return await this.model.count({
      ...options,
      where: { ...filterQuery, ...options?.where },
    });
  }

  async paginate({
    filterQuery = {},
    offset = 0,
    limit = 10,
    options,
    returnKey,
    sort,
    projection,
  }: {
    filterQuery: WhereOptions<T>;
    offset: number;
    limit: number;
    options?: FindOptions<T>;
    returnKey?: string;
    sort?: Record<string, 'ASC' | 'DESC' | 'asc' | 'desc' | 1 | -1>;
    projection?: Record<string, 0 | 1>;
  }) {
    if (typeof offset !== 'number') {
      offset = Number(offset);
    }
    if (typeof limit !== 'number') {
      limit = Number(limit);
    }

    let sorts = Object.keys(sort || { createdAt: -1 }).map((s) => [
      s,
      ['ASC', 'asc', 1]?.includes(sort[s]) ? 'ASC' : 'DESC',
    ]);
    let includedProjections =
      projection && Object.keys(projection).filter((p) => projection[p] == 1);
    let excludedProjections =
      projection && Object.keys(projection).filter((p) => projection[p] == 0);

    const total = await this.model.count({
      ...options,
      where: {
        ...filterQuery,
        ...options?.where,
      },
      ...((includedProjections || excludedProjections) && {
        attributes: {
          ...(includedProjections && { include: includedProjections }),
          ...(excludedProjections && { exclude: excludedProjections }),
        },
      }),
    });

    const rows = await this.model.findAll({
      ...options,
      where: {
        ...filterQuery,
        ...options?.where,
      },
      order: <any>sorts,
      ...((includedProjections || excludedProjections) && {
        attributes: {
          ...(includedProjections && { include: includedProjections }),
          ...(excludedProjections && { exclude: excludedProjections }),
        },
      }),
      limit,
      offset,
    });

    return {
      [!returnKey
        ? `${this.friendlyName[0].toLowerCase() + this.friendlyName.slice(1)}`
        : returnKey]: rows || [],
      meta: {
        page: Math.ceil(offset / limit + 1) || 0,
        pages: Math.ceil(total / limit) || 0,
        limit,
        total: total || 0,
      },
    };
  }
}
