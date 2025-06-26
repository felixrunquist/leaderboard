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
            admin: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
        },
        {
            hooks: {
                beforeCreate: async function (user, options) {
                    user.password = bcrypt.hashSync(user.password, 10);
                },
            },
        },
    );
    users.associate = function (models) {
        // associations can be defined here
        users.belongsToMany(models.suites, {through: 'Users_Suites', foreignKey: 'userId', onDelete: 'CASCADE'})
    };
    return users;
};