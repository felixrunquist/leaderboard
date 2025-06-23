import fs from 'fs';
import path from 'path';
import { Sequelize, DataTypes } from 'sequelize';
import { fileURLToPath } from 'url';
import { DB } from '../../lib/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const basename = path.basename(__filename);
const db = {};

const config = DB.includes('sqlite')
  ? {
      dialect: 'sqlite',
      storage: path.join(__dirname, '../', DB),
      logging: (...msg) => console.log(msg),
    }
  : DB;

const sequelize = new Sequelize(config);

const modelsDir = path.join(__dirname);

fs.readdirSync(modelsDir)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.endsWith('.js')
    );
  })
  .forEach(async file => {
    const model = (await import('./'+  file)).default;
    console.log(model)
    const defined = model(sequelize, DataTypes);
    db[defined.name] = defined;
  });

Object.keys(db).forEach(modelName => {
  if (typeof db[modelName].associate === 'function') {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;