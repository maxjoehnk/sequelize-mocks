import { EnumDataType } from 'sequelize/types/lib/data-types';
import { ModelAttributeColumnOptions } from 'sequelize/types/lib/model';
import * as faker from 'faker';
import { AbstractDataType, ArrayDataType, ModelAttributes } from 'sequelize';
import { DataType, getAttributes, Model } from 'sequelize-typescript';

interface Type<T = any> extends Function {
  new(...args: any[]): T;
}

type TypeGenerator = (type: any) => any;
type FieldGenerator<T, P extends keyof T> = (() => T[P]) | T[P];
export type FieldGenerators<T> = { [P in keyof T]?: FieldGenerator<T, P> };

const typeGenerators = new Map<string, TypeGenerator>();
typeGenerators.set(DataType.UUID.key, () => faker.datatype.uuid());
typeGenerators.set(DataType.STRING.key, () => faker.datatype.string());
typeGenerators.set(DataType.TEXT.key, () => faker.datatype.string());
typeGenerators.set(DataType.ENUM.key, (enumType: EnumDataType<string>) => {
  const index = faker.datatype.number(enumType.values.length);

  return enumType.values[index];
});
typeGenerators.set(DataType.DATEONLY.key, () => faker.datatype.datetime());
typeGenerators.set(DataType.DATE.key, () => faker.datatype.datetime());
typeGenerators.set(DataType.ARRAY.key, (arrayType: ArrayDataType<any>) => {
  const generator = typeGenerators.get(arrayType.options.type.key);
  if (generator == null) {
    return [];
  }
  return faker.datatype.array().map(() => generator(arrayType.options.type));
});
typeGenerators.set(DataType.BOOLEAN.key, () => false);
typeGenerators.set(DataType.DOUBLE.key, () => faker.datatype.number());
typeGenerators.set(DataType.FLOAT.key, () => faker.datatype.number());

export interface MockingOptions {
  fillNull?: boolean;
}

const defaultOptions: MockingOptions = {
  fillNull: false,
};

export function mockModel<T extends Model>(
  Model: Type<T>,
  fieldGenerators: FieldGenerators<T> = {},
  options: MockingOptions = defaultOptions,
): T {
  const model = new Model();

  const attributes: ModelAttributes<T> = getAttributes(Model.prototype);

  for (const key of Object.keys(attributes)) {
    const attributeName = key as keyof T;
    const attribute = attributes[key] as ModelAttributeColumnOptions<T>;
    assignValueByType(model, attributeName, attribute);
    if (options.fillNull) {
      assignNull(model, attributeName, attribute);
    }
    assignDefaultValue(model, attributeName, attribute);
    assignValueByField(model, fieldGenerators, attributeName);
  }

  return model;
}

function assignValueByType<T extends Model, P extends keyof T>(
  model: T,
  attributeName: P,
  attribute: ModelAttributeColumnOptions<T>,
) {
  const dataType = attribute.type as AbstractDataType;
  const generator = typeGenerators.get(dataType.key);
  if (generator == null) {
    console.warn(`Missing generator for type ${dataType.key} on field ${attributeName}`);
    return;
  }
  model[attributeName] = generator(dataType);
}

function assignNull<T extends Model, P extends keyof T>(
  model: T,
  attributeName: P,
  attribute: ModelAttributeColumnOptions<T>,
) {
  if (!attribute.allowNull) {
    return;
  }
  model[attributeName] = null as any;
}

function assignDefaultValue<T extends Model, P extends keyof T>(
  model: T,
  attributeName: P,
  attribute: ModelAttributeColumnOptions<T>,
) {
  if (attribute.defaultValue != null) {
    model[attributeName] = getDefaultValue<T, P>(attribute.defaultValue);
  }
}

function getDefaultValue<T extends Model, P extends keyof T>(defaultValue: unknown): T[P] {
  if (typeof defaultValue == 'function') {
    return defaultValue() as T[P];
  }
  return defaultValue as T[P];
}

function assignValueByField<T extends Model, P extends keyof T>(
  model: T,
  fieldGenerators: FieldGenerators<T>,
  attributeName: P,
) {
  if (!(attributeName in fieldGenerators)) {
    return;
  }
  model[attributeName] = generateValue(fieldGenerators, attributeName);
}

function generateValue<T, P extends keyof T>(fieldGenerators: FieldGenerators<T>, attribute: P): T[P] {
  const fieldGenerator = fieldGenerators[attribute] as FieldGenerator<T, P>;
  if (isFunctionGenerator(fieldGenerator)) {
    return fieldGenerator();
  }
  return fieldGenerator;
}

function isFunctionGenerator<T, P extends keyof T>(value: FieldGenerator<T, P>): value is () => T[P] {
  return typeof value == 'function';
}
