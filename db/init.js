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
        email: 'admin@wearebasis.com',
        admin: 1
    });
    
    const user3 = await models.users.create({
        name: 'John Doe',
        username: 'johndoe',
        password: 'test123',
        email: 'johndoe@wearebasis.com'
    });

    //Create test data
    const testCase1 = await models.testcases.create({ name: 'Arc fault detection', runCommand: './run_arc_fault' })
    const testCase2 = await models.testcases.create({ name: 'Arc fault prediction', runCommand: './predict_arc_fault', weight: 3 })
    const testCase3 = await models.testcases.create({ name: 'Out of band voltage detection', runCommand: './detect_oob_voltage' })
    const testCase4 = await models.testcases.create({ name: 'Energy usage calibration', runCommand: './calibrate_energy_usage', weight: 2 })

    const suite1 = await models.suites.create({name: 'Arc fault algorithms'})
    await suite1.addUser(user1.id);
    suite1.addTestcases([testCase1, testCase2])

    const suite2 = await models.suites.create({name: 'Calibration algorithms', rankAlgorithm: 'sum'})
    await suite2.addUser(user1.id);
    suite2.addTestcases([testCase3, testCase4])

    const session1 = await models.sessions.create({name: 'perfect', suiteId: suite1.id, username: user1.username})
    await models.scores.create({sessionId: session1.id, testCaseId: testCase1.id, score: 20})
    await models.scores.create({sessionId: session1.id, testCaseId: testCase2.id, score: 40})

    const session2 = await models.sessions.create({name: 'random-chance', suiteId: suite1.id, username: user1.username})
    await models.scores.create({sessionId: session2.id, testCaseId: testCase1.id, score: 18.2})
    await models.scores.create({sessionId: session2.id, testCaseId: testCase2.id, score: 35})

    const session3 = await models.sessions.create({name: 'garoth-mean', suiteId: suite2.id, username: user1.username})
    await models.scores.create({sessionId: session3.id, testCaseId: testCase3.id, score: 0.97})
    await models.scores.create({sessionId: session3.id, testCaseId: testCase4.id, score: 0.54})

    const session4 = await models.sessions.create({name: 'johns-update', suiteId: suite2.id, username: user3.username})
    await models.scores.create({sessionId: session4.id, testCaseId: testCase3.id, score: 0.48})
    await models.scores.create({sessionId: session4.id, testCaseId: testCase4.id, score: 0.63})

    //Add randomized data
    const suite3 = await models.suites.create({name: 'Performance test', rankAlgorithm: 'sum'})
    await suite3.addUsers([user1.id, user3.id]);
    const testCases = [];
    for(let i = 0; i < 20; i++){
        testCases.push(await models.testcases.create({ name: 'Performance test case ' + i, runCommand: './calibrate_energy_usage', weight: Math.round(Math.random() * 3) + 1 }))
    }
    suite3.addTestcases(testCases)

    for(let i = 0; i < 200; i++){
        const session = await models.sessions.create({date: (Date.now() / 1000 - 3600 * i + (Math.random() - 0.5) * 1800) * 1000, name: ID(), suiteId: suite3.id, username: Math.random() > 0.5 ? user3.username : user1.username})
        for(const testCase of testCases){
            await models.scores.create({sessionId: session.id, testCaseId: testCase.id, score: Math.round(Math.random() * 100) / 100})
        }
    }

    console.log("Populated database");


})();