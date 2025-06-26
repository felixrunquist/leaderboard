import fs from 'fs';
import path from 'path';
import { Sequelize, DataTypes } from 'sequelize';
import { fileURLToPath } from 'url';
import { DB } from '../../lib/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initializeDb() {
    // if (globalThis.__cached_db) {
    //     return globalThis.__cached_db;
    // }

    const basename = path.basename(__filename);
    const db = {};

    const config = DB.includes('sqlite')
        ? {
            dialect: 'sqlite',
            storage: path.join(__dirname, '../', DB),
            logging: false//(...msg) => console.log(msg),
        }
        : DB;

    const sequelize = new Sequelize(config);

    const modelsDir = path.join(__dirname);

    const files = fs.readdirSync(modelsDir)
        .filter(file => {
            return (
                file.indexOf('.') !== 0 &&
                file !== basename &&
                file.endsWith('.js')
            );
        });
    for (const file of files) {
        const model = (await import('./' + file)).default;
        const defined = model(sequelize, DataTypes);
        db[defined.name] = defined;
    }
    console.log(sequelize)
    // if (!globalThis.__models_associated__) {
        Object.keys(db).forEach(modelName => {
            if (typeof db[modelName].associate === 'function') {
                db[modelName].associate(db);
            }
        });
        globalThis.__models_associated__ = true;
    // }

    db.sequelize = sequelize;
    db.Sequelize = Sequelize;

    // globalThis.__cached_db = db;
    return db;
}

export default initializeDb;