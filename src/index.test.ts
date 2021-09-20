import { Column, DataType, Model, Sequelize, Table } from 'sequelize-typescript';
import { validate as validateUuid } from 'uuid';
import { mockModel } from './index';

describe('SequelizeMocks', () => {
  beforeEach(() => {
    new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      models: [TestModel],
    });
  });

  describe('generateByType', () => {
    test(DataType.UUID.key, () => {
      const model = mockModel(TestModel);

      expect(validateUuid(model.uniqueId)).toBe(true);
    });

    test(DataType.BOOLEAN.key, () => {
      const model = mockModel(TestModel);

      expect(model.bool).toBe(false);
    });

    test(DataType.TEXT.key, () => {
      const model = mockModel(TestModel);

      expect(typeof model.text).toBe('string');
    });

    test(DataType.FLOAT.key, () => {
      const model = mockModel(TestModel);

      expect(typeof model.float).toBe('number');
    });

    test('string array', () => {
      const model = mockModel(TestModel);

      expect(Array.isArray(model.stringArray)).toBe(true);
      expect(model.stringArray.length).toBeGreaterThan(0);
      expect(typeof model.stringArray[0]).toBe('string');
    });

    test('nullable string', () => {
      const model = mockModel(TestModel);

      expect(model.nullable).not.toBeNull();
    });

    test('enum', () => {
      const allowedValues = Object.values(TestEnum);

      const model = mockModel(TestModel);

      expect(allowedValues).toContainEqual(model.enum);
    });
  });

  describe('options', () => {
    test('fillNull', () => {
      const model = mockModel(TestModel, {}, { fillNull: true });

      expect(model.nullable).toBeNull();
    });
  });

  describe('fieldGenerators', () => {
    test.each([
      ['value 1'],
      ['another value'],
    ])('override field value', (text: string) => {
      const model = mockModel(TestModel, {
        text,
      });

      expect(model.text).toBe(text);
    });
  });
});

enum TestEnum {
  OptionA = 'a',
  OptionB = 'b',
  OptionC = 'c',
}

@Table
class TestModel extends Model {
  @Column({
    type: DataType.UUID,
  })
  uniqueId: string;

  @Column({
    type: DataType.BOOLEAN,
  })
  bool: boolean;

  @Column({
    type: DataType.TEXT,
  })
  text: string;

  @Column({
    type: DataType.FLOAT,
  })
  float: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  nullable: string | null;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
  })
  stringArray: string[];

  @Column({
    type: DataType.ENUM(...Object.values(TestEnum)),
  })
  enum: TestEnum;
}
