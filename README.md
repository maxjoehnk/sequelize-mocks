# sequelize-mocks

Generate sequelize models based on sequelize-typescript annotations

## Example

```typescript
import { mockModel } from 'sequelize-mocks';
import { Functionality } from './functionality';
import MyModel from './my.model';

describe('Some Functionality', () => {
  let functionality;

  beforeEach(() => {
    functionality = new Functionality();
  });

  test('your test', async () => {
    // create a new instance of MyModel with all properties filled
    const model = mockModel(MyModel);
    await model.save();

    const result = await functionality.someMethod(model);

    expect(result).toEqual('your result');
  });

  test('custom values', async () => {
    // you can also override the generated values for each property
    const model = mockModel(MyModel, { myField: false });
    await model.save();

    const result = await functionality.someMethod(model);

    expect(result).toEqual('your result');
  });
});
```
