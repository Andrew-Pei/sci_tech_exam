const QuestionManager = require('./models/QuestionManager');

// 创建题目管理器实例
const questionManager = new QuestionManager();

// 测试题目抽象模块
async function testQuestionModule() {
    console.log('=== 测试题目抽象模块 ===\n');

    try {
        // 1. 从文件加载题目
        console.log('1. 从questions.json文件加载题目...');
        await questionManager.loadFromFile('./questions.json');
        
        // 2. 显示题目统计
        const count = questionManager.getQuestionCount();
        console.log(`2. 题目统计：`);
        console.log(`   选择题：${count.choice} 道`);
        console.log(`   判断题：${count.judge} 道`);
        console.log(`   总计：${count.total} 道\n`);

        // 3. 测试获取题目
        console.log('3. 测试获取题目：');
        const firstChoiceId = 'choice_1';
        const firstChoice = questionManager.getQuestionById(firstChoiceId);
        if (firstChoice) {
            console.log(`   获取选择题 ${firstChoiceId}:`);
            console.log(`   问题：${firstChoice.question}`);
            console.log(`   选项：${firstChoice.options.join(', ')}`);
            console.log(`   正确答案：${firstChoice.correctAnswer}\n`);
        }

        const firstJudgeId = 'judge_1';
        const firstJudge = questionManager.getQuestionById(firstJudgeId);
        if (firstJudge) {
            console.log(`   获取判断题 ${firstJudgeId}:`);
            console.log(`   问题：${firstJudge.question}`);
            console.log(`   正确答案：${firstJudge.correctAnswer}\n`);
        }

        // 4. 测试验证答案
        console.log('4. 测试验证答案：');
        
        // 测试选择题
        const choiceTestResult = questionManager.validateAnswer('choice_1', 'B');
        console.log(`   选择题验证（用户答案：B）：`);
        console.log(`   是否正确：${choiceTestResult.isCorrect}`);
        console.log(`   正确答案：${choiceTestResult.correctAnswer}`);

        const choiceTestResult2 = questionManager.validateAnswer('choice_1', 'A');
        console.log(`   选择题验证（用户答案：A）：`);
        console.log(`   是否正确：${choiceTestResult2.isCorrect}\n`);

        // 测试判断题
        const judgeTestResult = questionManager.validateAnswer('judge_1', true);
        console.log(`   判断题验证（用户答案：true）：`);
        console.log(`   是否正确：${judgeTestResult.isCorrect}`);
        console.log(`   正确答案：${judgeTestResult.correctAnswer}`);

        const judgeTestResult2 = questionManager.validateAnswer('judge_1', false);
        console.log(`   判断题验证（用户答案：false）：`);
        console.log(`   是否正确：${judgeTestResult2.isCorrect}\n`);

        // 5. 测试获取随机题目
        console.log('5. 测试获取随机题目：');
        const randomQuestions = questionManager.getRandomQuestions(3, 'choice');
        console.log(`   随机获取3道选择题：`);
        randomQuestions.forEach((q, i) => {
            console.log(`   ${i + 1}. ${q.question.substring(0, 30)}...`);
        });

        // 6. 测试批量验证
        console.log('\n6. 测试批量验证答案：');
        const batchAnswers = [
            { questionId: 'choice_1', userAnswer: 'B' },
            { questionId: 'choice_2', userAnswer: 'A' },
            { questionId: 'judge_1', userAnswer: true },
            { questionId: 'judge_2', userAnswer: false }
        ];
        
        const batchResults = questionManager.validateAnswers(batchAnswers);
        batchResults.forEach((result, i) => {
            console.log(`   题目 ${batchAnswers[i].questionId}：${result.isCorrect ? '正确' : '错误'}`);
        });

        // 7. 测试导出为JSON
        console.log('\n7. 测试导出为JSON：');
        const jsonData = questionManager.toJSON();
        console.log(`   导出成功，包含 ${jsonData.choiceQuestions.length} 道选择题和 ${jsonData.judgeQuestions.length} 道判断题`);

        console.log('\n=== 测试完成 ===');

    } catch (error) {
        console.error('测试过程中发生错误:', error);
    }
}

// 运行测试
testQuestionModule();