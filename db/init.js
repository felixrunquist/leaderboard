import initializeDb from './models/index.js';

(async () => {
    console.log("Creating database");

    const models = await initializeDb();

    await models.sequelize.sync({ force: true });

    console.log("Created database");

    // console.log(models, Object.keys(models))
    console.log("Populating database");
    //Create users
    const user1 = await models.users.create({
        name: 'Felix',
        username: 'felix',
        password: 'test123',
        email: 'felix.runquist@wearebasis.com'
    });

    await models.users.create({
        name: 'Admin',
        username: 'admin',
        password: 'test123',
        email: 'admin@wearebasis.com'
    });

    //Create test data
    const testCase1 = await models.testcases.create({ name: 'Arc fault detection', runCommand: './run_arc_fault' })
    const testCase2 = await models.testcases.create({ name: 'Arc fault prediction', runCommand: './predict_arc_fault' })
    const testCase3 = await models.testcases.create({ name: 'Out of band voltage detection', runCommand: './detect_oob_voltage' })
    const testCase4 = await models.testcases.create({ name: 'Energy usage calibration', runCommand: './calibrate_energy_usage' })

    const suite1 = await models.suites.create({name: 'Arc fault algorithms'})
    suite1.addTestcases([testCase1, testCase2])

    const suite2 = await models.suites.create({name: 'Calibration algorithms', rankAlgorithm: 'sum'})
    suite2.addTestcases([testCase3, testCase4])

    const session1 = await models.sessions.create({suiteId: suite1.id, username: user1.username})
    await models.scores.create({sessionId: session1.id, testCaseId: testCase1.id, score: 20})
    await models.scores.create({sessionId: session1.id, testCaseId: testCase2.id, score: 40})

    const session2 = await models.sessions.create({suiteId: suite1.id, username: user1.username})
    await models.scores.create({sessionId: session2.id, testCaseId: testCase1.id, score: 18.2})
    await models.scores.create({sessionId: session2.id, testCaseId: testCase2.id, score: 35})

    const session3 = await models.sessions.create({suiteId: suite2.id, username: user1.username})
    await models.scores.create({sessionId: session3.id, testCaseId: testCase3.id, score: 0.97})
    await models.scores.create({sessionId: session3.id, testCaseId: testCase4.id, score: 8.4})


    console.log("Populated database");


})();