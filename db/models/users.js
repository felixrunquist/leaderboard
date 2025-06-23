import bcrypt from 'bcryptjs'

export default function users(sequelize, DataTypes) {
    const users = sequelize.define('users', {
            name: DataTypes.STRING,
            username: {
                type: DataTypes.STRING,
                unique: true,
            },
            password: DataTypes.STRING,
            email: {
                type: DataTypes.STRING,
                unique: true,
            },
        },
        {
            hooks: {
                beforeCreate: async function (user, options) {
                    // Do stuff
                    user.password = bcrypt.hashSync(user.password, 10);
                },
            },
        },
    );
    users.associate = function (models) {
        // associations can be defined here
        // users.hasMany(models.posts, { as: 'posts' });
        // users.hasMany(models.jobs, { as: 'jobs' });
    };
    return users;
};