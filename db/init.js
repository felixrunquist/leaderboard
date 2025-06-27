import initializeDb from './models/index.js';

function ID() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 15; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

(async () => {
    console.log("Creating database");

    const models = await initializeDb();

    await models.sequelize.sync();

    console.log("Created database");

    //Add default user
    await models.users.create({
        name: 'Admin',
        username: 'admin',
        password: 'test123',
        email: 'admin@test.com',
        admin: 1
    });

})();