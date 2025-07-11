

export function calculateSessionScore(session){
    const rankAlgorithm = session.suite?.rankAlgorithm || 'avg';
    let totalScore = 0;
    let coeffs = 0;
    for(const score of session.scores){
        totalScore += score.score * score.testCaseWeight;
        coeffs += score.testCaseWeight;
    }

    switch(rankAlgorithm){
        case 'avg':
            totalScore = totalScore / coeffs;
            break;
    }

    return Math.round(totalScore * 100) / 100;
}