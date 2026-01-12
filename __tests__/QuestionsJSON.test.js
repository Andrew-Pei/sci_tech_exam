const fs = require('fs');
const path = require('path');
const QuestionManager = require('../models/QuestionManager');

describe('questions.json 文件测试', () => {
  let questionManager;
  let questionsData;

  beforeAll(() => {
    // 读取实际的 questions.json 文件
    const filePath = path.join(__dirname, '..', 'questions.json');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    questionsData = JSON.parse(fileContent);
    
    questionManager = new QuestionManager();
    questionManager.loadFromJSON(questionsData);
  });

  test('questions.json 文件应该存在且是有效的 JSON', () => {
    expect(questionsData).toBeDefined();
    expect(typeof questionsData).toBe('object');
  });

  test('应该包含选择题数组', () => {
    expect(questionsData).toHaveProperty('choiceQuestions');
    expect(Array.isArray(questionsData.choiceQuestions)).toBe(true);
    expect(questionsData.choiceQuestions.length).toBeGreaterThan(0);
  });

  test('应该包含判断题数组', () => {
    expect(questionsData).toHaveProperty('judgeQuestions');
    expect(Array.isArray(questionsData.judgeQuestions)).toBe(true);
    expect(questionsData.judgeQuestions.length).toBeGreaterThan(0);
  });

  test('选择题应该有正确的结构', () => {
    const firstChoice = questionsData.choiceQuestions[0];
    
    expect(firstChoice).toHaveProperty('question');
    expect(typeof firstChoice.question).toBe('string');
    expect(firstChoice.question.length).toBeGreaterThan(0);
    
    expect(firstChoice).toHaveProperty('options');
    expect(Array.isArray(firstChoice.options)).toBe(true);
    expect(firstChoice.options.length).toBeGreaterThan(0);
    
    expect(firstChoice).toHaveProperty('answer');
    expect(typeof firstChoice.answer).toBe('string');
    expect(['A', 'B', 'C', 'D']).toContain(firstChoice.answer);
  });

  test('判断题应该有正确的结构', () => {
    const firstJudge = questionsData.judgeQuestions[0];
    
    expect(firstJudge).toHaveProperty('question');
    expect(typeof firstJudge.question).toBe('string');
    expect(firstJudge.question.length).toBeGreaterThan(0);
    
    expect(firstJudge).toHaveProperty('answer');
    expect(typeof firstJudge.answer).toBe('boolean');
  });

  test('所有选择题都应该有有效的答案', () => {
    questionsData.choiceQuestions.forEach((question, index) => {
      expect(question).toHaveProperty('answer', expect.any(String));
      expect(['A', 'B', 'C', 'D']).toContain(question.answer);
      
      // 验证答案在选项范围内
      const optionLetters = question.options.map(opt => opt.charAt(0));
      expect(optionLetters).toContain(question.answer);
    });
  });

  test('所有题目都应该有非空的问题文本', () => {
    const allQuestions = [
      ...questionsData.choiceQuestions,
      ...questionsData.judgeQuestions
    ];
    
    allQuestions.forEach((question, index) => {
      expect(question.question.trim().length).toBeGreaterThan(0);
    });
  });

  test('应该能正确加载所有题目到 QuestionManager', () => {
    const count = questionManager.getQuestionCount();
    
    expect(count.total).toBe(
      questionsData.choiceQuestions.length + 
      questionsData.judgeQuestions.length
    );
    expect(count.choice).toBe(questionsData.choiceQuestions.length);
    expect(count.judge).toBe(questionsData.judgeQuestions.length);
  });

  test('应该能验证实际题目的答案', () => {
    // 测试第一个选择题
    const firstChoiceId = 'choice_1';
    const firstChoice = questionsData.choiceQuestions[0];
    const correctAnswer = firstChoice.answer;
    
    const correctResult = questionManager.validateAnswer(firstChoiceId, correctAnswer);
    expect(correctResult.success).toBe(true);
    expect(correctResult.isCorrect).toBe(true);
    
    // 测试一个错误答案
    const wrongAnswer = correctAnswer === 'A' ? 'B' : 'A';
    const wrongResult = questionManager.validateAnswer(firstChoiceId, wrongAnswer);
    expect(wrongResult.success).toBe(true);
    expect(wrongResult.isCorrect).toBe(false);

    // 测试第一个判断题
    const firstJudgeId = 'judge_1';
    const firstJudge = questionsData.judgeQuestions[0];
    const judgeCorrectAnswer = firstJudge.answer;
    
    const judgeCorrectResult = questionManager.validateAnswer(firstJudgeId, judgeCorrectAnswer);
    expect(judgeCorrectResult.success).toBe(true);
    expect(judgeCorrectResult.isCorrect).toBe(true);
    
    const judgeWrongResult = questionManager.validateAnswer(firstJudgeId, !judgeCorrectAnswer);
    expect(judgeWrongResult.success).toBe(true);
    expect(judgeWrongResult.isCorrect).toBe(false);
  });

  test('应该能获取随机题目', () => {
    const randomQuestions = questionManager.getRandomQuestions(5);
    expect(randomQuestions).toHaveLength(5);
    
    // 验证所有随机题目都有有效的数据
    randomQuestions.forEach(question => {
      expect(question).toHaveProperty('id');
      expect(question).toHaveProperty('question');
      expect(question).toHaveProperty('type');
      expect(['choice', 'judge']).toContain(question.type);
    });
  });

  test('题目ID应该正确生成', () => {
    const allQuestions = questionManager.getAllQuestions();
    
    // 验证选择题ID
    const choiceQuestions = allQuestions.filter(q => q.type === 'choice');
    choiceQuestions.forEach((question, index) => {
      expect(question.id).toBe(`choice_${index + 1}`);
    });
    
    // 验证判断题ID
    const judgeQuestions = allQuestions.filter(q => q.type === 'judge');
    judgeQuestions.forEach((question, index) => {
      expect(question.id).toBe(`judge_${index + 1}`);
    });
  });
});