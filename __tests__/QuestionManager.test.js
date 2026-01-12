const QuestionManager = require('../models/QuestionManager');
const fs = require('fs');
const path = require('path');

// 模拟测试数据
const mockQuestionData = {
  choiceQuestions: [
    {
      question: '测试选择题1',
      options: ['A. 选项1', 'B. 选项2', 'C. 选项3'],
      answer: 'A'
    },
    {
      question: '测试选择题2',
      options: ['A. 选项A', 'B. 选项B'],
      answer: 'B'
    }
  ],
  judgeQuestions: [
    {
      question: '测试判断题1',
      answer: true
    },
    {
      question: '测试判断题2',
      answer: false
    }
  ]
};

describe('QuestionManager 题目管理器类', () => {
  let questionManager;

  beforeEach(() => {
    questionManager = new QuestionManager();
  });

  test('应该正确创建题目管理器实例', () => {
    expect(questionManager.questions).toBeInstanceOf(Map);
    expect(questionManager.choiceQuestions).toBeInstanceOf(Map);
    expect(questionManager.judgeQuestions).toBeInstanceOf(Map);
    expect(questionManager.questions.size).toBe(0);
  });

  test('loadFromJSON() 应该从 JSON 数据加载题目', () => {
    questionManager.loadFromJSON(mockQuestionData);

    const count = questionManager.getQuestionCount();
    expect(count.total).toBe(4);
    expect(count.choice).toBe(2);
    expect(count.judge).toBe(2);

    // 验证选择题
    const choice1 = questionManager.getQuestionById('choice_1');
    expect(choice1).toBeDefined();
    expect(choice1.question).toBe('测试选择题1');
    expect(choice1.type).toBe('choice');
    expect(choice1.options).toEqual(['A. 选项1', 'B. 选项2', 'C. 选项3']);
    expect(choice1.correctAnswer).toBe('A');

    // 验证判断题
    const judge1 = questionManager.getQuestionById('judge_1');
    expect(judge1).toBeDefined();
    expect(judge1.question).toBe('测试判断题1');
    expect(judge1.type).toBe('judge');
    expect(judge1.correctAnswer).toBe(true);
  });

  test('getAllQuestions() 应该返回所有题目', () => {
    questionManager.loadFromJSON(mockQuestionData);
    const allQuestions = questionManager.getAllQuestions();
    
    expect(allQuestions).toHaveLength(4);
    expect(allQuestions[0].id).toBe('choice_1');
    expect(allQuestions[3].id).toBe('judge_2');
  });

  test('getAllChoiceQuestions() 应该返回所有选择题', () => {
    questionManager.loadFromJSON(mockQuestionData);
    const choiceQuestions = questionManager.getAllChoiceQuestions();
    
    expect(choiceQuestions).toHaveLength(2);
    expect(choiceQuestions[0].type).toBe('choice');
    expect(choiceQuestions[1].type).toBe('choice');
  });

  test('getAllJudgeQuestions() 应该返回所有判断题', () => {
    questionManager.loadFromJSON(mockQuestionData);
    const judgeQuestions = questionManager.getAllJudgeQuestions();
    
    expect(judgeQuestions).toHaveLength(2);
    expect(judgeQuestions[0].type).toBe('judge');
    expect(judgeQuestions[1].type).toBe('judge');
  });

  test('getQuestionById() 应该根据 ID 获取题目', () => {
    questionManager.loadFromJSON(mockQuestionData);
    
    const existingQuestion = questionManager.getQuestionById('choice_1');
    expect(existingQuestion).toBeDefined();
    expect(existingQuestion.id).toBe('choice_1');

    const nonExistingQuestion = questionManager.getQuestionById('non_existing');
    expect(nonExistingQuestion).toBeNull();
  });

  test('getQuestionCount() 应该返回题目数量统计', () => {
    questionManager.loadFromJSON(mockQuestionData);
    const count = questionManager.getQuestionCount();
    
    expect(count).toEqual({
      total: 4,
      choice: 2,
      judge: 2
    });
  });

  test('validateAnswer() 应该验证单个答案', () => {
    questionManager.loadFromJSON(mockQuestionData);
    
    // 测试正确答案
    const correctResult = questionManager.validateAnswer('choice_1', 'A');
    expect(correctResult.success).toBe(true);
    expect(correctResult.isCorrect).toBe(true);
    expect(correctResult.correctAnswer).toBe('A');

    // 测试错误答案
    const wrongResult = questionManager.validateAnswer('choice_1', 'B');
    expect(wrongResult.success).toBe(true);
    expect(wrongResult.isCorrect).toBe(false);
    expect(wrongResult.correctAnswer).toBe('A');

    // 测试不存在的题目
    const nonExistingResult = questionManager.validateAnswer('non_existing', 'A');
    expect(nonExistingResult.success).toBe(false);
    expect(nonExistingResult.message).toBe('题目不存在');
  });

  test('validateAnswers() 应该批量验证答案', () => {
    questionManager.loadFromJSON(mockQuestionData);
    
    const answers = [
      { questionId: 'choice_1', userAnswer: 'A' }, // 正确
      { questionId: 'choice_2', userAnswer: 'C' }, // 错误（正确答案是B）
      { questionId: 'judge_1', userAnswer: true }, // 正确
      { questionId: 'judge_2', userAnswer: true }  // 错误（正确答案是false）
    ];

    const results = questionManager.validateAnswers(answers);
    
    expect(results).toHaveLength(4);
    expect(results[0].isCorrect).toBe(true);
    expect(results[1].isCorrect).toBe(false);
    expect(results[2].isCorrect).toBe(true);
    expect(results[3].isCorrect).toBe(false);
  });

  test('getRandomQuestions() 应该返回随机题目', () => {
    questionManager.loadFromJSON(mockQuestionData);
    
    // 测试获取指定数量的题目
    const randomQuestions = questionManager.getRandomQuestions(2);
    expect(randomQuestions).toHaveLength(2);
    
    // 测试获取所有题目（当数量大于等于题目总数时）
    const allQuestions = questionManager.getRandomQuestions(10);
    expect(allQuestions).toHaveLength(4);
    
    // 测试按类型获取题目
    const choiceQuestions = questionManager.getRandomQuestions(1, 'choice');
    expect(choiceQuestions).toHaveLength(1);
    expect(choiceQuestions[0].type).toBe('choice');
    
    const judgeQuestions = questionManager.getRandomQuestions(1, 'judge');
    expect(judgeQuestions).toHaveLength(1);
    expect(judgeQuestions[0].type).toBe('judge');
  });

  test('toJSON() 应该导出为 JSON 格式', () => {
    questionManager.loadFromJSON(mockQuestionData);
    const jsonData = questionManager.toJSON();
    
    expect(jsonData).toHaveProperty('choiceQuestions');
    expect(jsonData).toHaveProperty('judgeQuestions');
    expect(jsonData.choiceQuestions).toHaveLength(2);
    expect(jsonData.judgeQuestions).toHaveLength(2);
    
    expect(jsonData.choiceQuestions[0]).toEqual({
      question: '测试选择题1',
      options: ['A. 选项1', 'B. 选项2', 'C. 选项3'],
      answer: 'A'
    });
  });

  test('loadFromFile() 应该从文件加载题目', async () => {
    // 创建临时测试文件
    const testFilePath = path.join(__dirname, 'test_questions.json');
    fs.writeFileSync(testFilePath, JSON.stringify(mockQuestionData));
    
    try {
      await questionManager.loadFromFile(testFilePath);
      
      const count = questionManager.getQuestionCount();
      expect(count.total).toBe(4);
      expect(count.choice).toBe(2);
      expect(count.judge).toBe(2);
    } finally {
      // 清理临时文件
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    }
  });

  test('loadFromFile() 应该处理文件不存在的情况', async () => {
    const nonExistingFile = path.join(__dirname, 'non_existing.json');
    
    await expect(questionManager.loadFromFile(nonExistingFile))
      .rejects
      .toThrow();
  });

  test('loadFromFile() 应该处理无效的 JSON 格式', async () => {
    const invalidFilePath = path.join(__dirname, 'invalid.json');
    fs.writeFileSync(invalidFilePath, 'invalid json content');
    
    try {
      await expect(questionManager.loadFromFile(invalidFilePath))
        .rejects
        .toThrow();
    } finally {
      if (fs.existsSync(invalidFilePath)) {
        fs.unlinkSync(invalidFilePath);
      }
    }
  });
});