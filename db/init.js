import models from './models/index.js';

(async () => {
    console.log("Creating database");

    await models.sequelize.sync({ force: true });

    console.log("Created database");

    await models.users.create({
        name: 'Felix',
        username: 'felix',
        password: 'test123',
        email: 'felix.runquist@wearebasis.com'
    });
})();